import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
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
  },
  ...
]
약 8~12개의 자연스러운 문장 단위 자막을 생성해 주세요.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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
      textKo: `안녕하세요, 학습자 여러분. ${sessionTitle} 강의를 시작하겠습니다.`,
      textEn: `Hello, learners. Welcome to the session on "${sessionTitle}".`
    },
    {
      id: 2,
      startTime: "00:07",
      endTime: "00:15",
      startSeconds: 7,
      endSeconds: 15,
      textKo: "스토리텔링의 기본 구조에서 모티프(Motif)는 서사의 추진력을 부여하는 중요한 장치입니다.",
      textEn: "In basic storytelling structure, the motif serves as a vital engine driving narrative momentum."
    },
    {
      id: 3,
      startTime: "00:16",
      endTime: "00:25",
      startSeconds: 16,
      endSeconds: 25,
      textKo: "이번 단편 예시를 통해 주인공의 내적 갈등과 상징적 오브젝트의 상관관계를 분석해보겠습니다.",
      textEn: "Through this short story example, let us analyze the correlation between internal conflict and symbolic objects."
    },
    {
      id: 4,
      startTime: "00:26",
      endTime: "00:36",
      startSeconds: 26,
      endSeconds: 36,
      textKo: "화면 우측의 타임라인을 참고하시어 각 시퀀스별 주요 전환점을 확인해 주세요.",
      textEn: "Please refer to the timeline on the right to examine major turning points for each sequence."
    },
    {
      id: 5,
      startTime: "00:37",
      endTime: "00:48",
      startSeconds: 37,
      endSeconds: 48,
      textKo: "모티프가 반복될 때마다 관객의 감정선은 점진적으로 고조되며 클라이맥스로 연결됩니다.",
      textEn: "With each recurrence of the motif, the audience's emotional arc steadily builds toward the climax."
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
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
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
