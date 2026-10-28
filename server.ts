import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));

// Persistent Data Storage Directory & File
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

interface ServerDb {
  projects: any[];
  videos: any[];
  lastUpdated: string;
}

function initDb(): ServerDb {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading server db file, using empty init:', err);
  }
  return {
    projects: [],
    videos: [],
    lastUpdated: new Date().toISOString()
  };
}

let db = initDb();

function persistDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write db file:', err);
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    dbStats: {
      projectCount: db.projects.length,
      videoCount: db.videos.length,
      lastUpdated: db.lastUpdated
    }
  });
});

// Sync complete data endpoint (Phase 2 Cloud & Multi-user Sync)
app.get('/api/sync', (req, res) => {
  res.json({
    success: true,
    projects: db.projects,
    videos: db.videos,
    lastUpdated: db.lastUpdated
  });
});

app.post('/api/sync', (req, res) => {
  const { projects, videos } = req.body;
  if (Array.isArray(projects) && projects.length > 0) {
    db.projects = projects;
  }
  if (Array.isArray(videos) && videos.length > 0) {
    db.videos = videos;
  }
  persistDb();
  res.json({
    success: true,
    lastUpdated: db.lastUpdated,
    projectCount: db.projects.length,
    videoCount: db.videos.length
  });
});

// Projects REST endpoints
app.get('/api/projects', (req, res) => {
  res.json({ success: true, projects: db.projects });
});

app.post('/api/projects', (req, res) => {
  const newProj = req.body;
  if (!newProj || !newProj.name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  // Update or insert
  const idx = db.projects.findIndex(p => p.id === newProj.id || (p.alias && p.alias === newProj.alias));
  if (idx >= 0) {
    db.projects[idx] = { ...db.projects[idx], ...newProj };
  } else {
    db.projects.unshift(newProj);
  }
  persistDb();
  res.json({ success: true, project: newProj });
});

app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  db.projects = db.projects.filter(p => p.id !== id && p.alias !== id);
  persistDb();
  res.json({ success: true, deletedId: id });
});

// Videos REST endpoints
app.get('/api/videos', (req, res) => {
  res.json({ success: true, videos: db.videos });
});

app.post('/api/videos', (req, res) => {
  const newVideo = req.body;
  if (!newVideo || !newVideo.id) {
    return res.status(400).json({ error: 'Video id is required' });
  }
  db.videos.unshift(newVideo);
  persistDb();
  res.json({ success: true, video: newVideo });
});

app.patch('/api/videos/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const idx = db.videos.findIndex(v => v.id === id);
  if (idx >= 0) {
    db.videos[idx] = {
      ...db.videos[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    persistDb();
    return res.json({ success: true, video: db.videos[idx] });
  }
  res.status(404).json({ error: 'Video not found' });
});

app.delete('/api/videos/:id', (req, res) => {
  const { id } = req.params;
  db.videos = db.videos.filter(v => v.id !== id);
  persistDb();
  res.json({ success: true, deletedId: id });
});

// Video Comments & Timecode Feedback endpoints
app.post('/api/videos/:id/comments', (req, res) => {
  const { id } = req.params;
  const { comment, verdict } = req.body;
  const video = db.videos.find(v => v.id === id);
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  const commentObj = {
    id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    ...comment
  };

  if (!Array.isArray(video.reviews)) {
    video.reviews = [];
  }
  video.reviews.unshift(commentObj);

  if (verdict) {
    video.status = verdict;
    video.reviewerName = comment.author;
  }
  video.updatedAt = new Date().toISOString();
  persistDb();

  res.json({ success: true, comment: commentObj, status: video.status });
});

// AI Subtitle Generation & Translation via Gemini API
app.post('/api/ai/subtitles', async (req, res) => {
  try {
    const { videoTitle, sessionTitle, duration, targetLanguage = 'en' } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        fallback: true,
        message: 'No GEMINI_API_KEY found, using local simulated subtitle engine',
        subtitles: generateFallbackSubtitles(sessionTitle, duration)
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
당신은 교육 및 기업용 영상 검수 전문 AI 자막 생성기입니다.
다음 영상 정보를 바탕으로 실시간 타임스탬프와 함께 한국어 원문 자막과 영어(${targetLanguage}) 번역 자막을 생성해주세요.

- 강의/영상 주제: "${videoTitle || 'AI와 함께 쓰는 스토리텔링 워크숍'}"
- 차시 상세 제목: "${sessionTitle || '이야기의 뼈대와 모티프'}"
- 영상 길이: 약 ${Math.round(duration || 749)}초

출력은 반드시 다음 JSON 구조를 갖는 유효한 JSON 배열만 반환하세요:
[
  {
    "id": 1,
    "startTime": "00:00",
    "endTime": "00:05",
    "startSeconds": 0,
    "endSeconds": 5,
    "textKo": "안녕하세요. 이번 차시에서는 스토리텔링의 핵심 뼈대를 살펴봅니다.",
    "textEn": "Hello. In this session, we will explore the core framework of storytelling."
  }
]
약 8~12개의 자연스러운 문장 단위 자막을 생성해 주세요.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const responseText = response.text || '[]';
    let parsed = [];
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = generateFallbackSubtitles(sessionTitle, duration);
    }

    return res.json({
      success: true,
      subtitles: parsed
    });
  } catch (error: any) {
    console.error('Error generating AI subtitles:', error);
    return res.status(200).json({
      fallback: true,
      error: error.message,
      subtitles: generateFallbackSubtitles(req.body.sessionTitle, req.body.duration)
    });
  }
});

function generateFallbackSubtitles(sessionTitle: string = '스토리텔링 워크숍', duration: number = 749) {
  return [
    {
      id: 1,
      startTime: "00:00",
      endTime: "00:06",
      startSeconds: 0,
      endSeconds: 6,
      textKo: `${sessionTitle} 강의를 시작하겠습니다.`,
      textEn: `Let's begin the lecture on "${sessionTitle}".`
    },
    {
      id: 2,
      startTime: "00:07",
      endTime: "00:15",
      startSeconds: 7,
      endSeconds: 15,
      textKo: "오늘은 모든 서사의 출발점이 되는 이야기의 뼈대와 모티프(Motif)를 살펴보겠습니다.",
      textEn: "Today, we will examine the backbone of narrative and motifs that serve as the foundation."
    },
    {
      id: 3,
      startTime: "00:16",
      endTime: "00:26",
      startSeconds: 16,
      endSeconds: 26,
      textKo: "스토리텔링의 모티프는 캐릭터의 심리 변화와 밀접하게 연동됩니다.",
      textEn: "Storytelling motifs are intimately connected to characters psychological arcs."
    },
    {
      id: 4,
      startTime: "00:27",
      endTime: "00:37",
      startSeconds: 27,
      endSeconds: 37,
      textKo: "고전 비극부터 현대 SF 서사까지, 반복되는 구조적 원형을 이해하는 것이 중요합니다.",
      textEn: "From classical tragedy to modern sci-fi narratives, understanding recurrent archetypes is key."
    },
    {
      id: 5,
      startTime: "00:38",
      endTime: "00:48",
      startSeconds: 38,
      endSeconds: 48,
      textKo: "3막 구조에서 전환점(Plot Point)이 어떤 방식으로 긴장감을 고조시키는지 분석합니다.",
      textEn: "We analyze how plot points in the three-act structure elevate dramatic tension."
    },
    {
      id: 6,
      startTime: "00:49",
      endTime: "01:02",
      startSeconds: 49,
      endSeconds: 62,
      textKo: "이러한 기법을 AI 생성 도구와 결합하면 더욱 다채로운 플롯 변주를 실험할 수 있습니다.",
      textEn: "Combining these classical techniques with modern AI generation tools allows for rich plot variations."
    },
    {
      id: 7,
      startTime: "01:03",
      endTime: "01:18",
      startSeconds: 63,
      endSeconds: 78,
      textKo: "다음 구간에서는 구체적인 캐릭터 아크와 프롬프트 엔지니어링 사례를 다루겠습니다.",
      textEn: "In the following section, we will cover specific character arcs and prompt engineering case studies."
    }
  ];
}

async function start() {
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    // SPA Wildcard Route for /:projectId, /:projectId/admin, /admin, etc.
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Video Review & QA Portal server running on http://0.0.0.0:${PORT}`);
  });
}

start();
