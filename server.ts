import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import subtitleHandler from './api/ai/subtitles';

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

// Actual video-only Gemini analysis handler shared with Vercel and Vite.
app.post('/api/ai/subtitles', (req, res) => {
  void subtitleHandler({ method: req.method, body: req.body } as any, res as any);
});
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
