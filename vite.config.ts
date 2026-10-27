import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {GoogleGenAI} from '@google/genai';

function apiPlugin() {
  return {
    name: 'api-ai-subtitles-middleware',
    configureServer(server: any) {
      server.middlewares.use('/api/ai/subtitles', (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end('Method Not Allowed');
        }

        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            const { videoTitle, sessionTitle, duration, targetLanguage = 'en' } = parsed;

            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                fallback: true,
                subtitles: [
                  {
                    id: 1,
                    startTime: '00:00',
                    endTime: '00:06',
                    startSeconds: 0,
                    endSeconds: 6,
                    textKo: `안녕하세요, 학습자 여러분. ${sessionTitle || '강의'}를 시작하겠습니다.`,
                    textEn: `Hello, learners. Welcome to the session on "${sessionTitle || 'Lecture'}".`
                  },
                  {
                    id: 2,
                    startTime: '00:07',
                    endTime: '00:15',
                    startSeconds: 7,
                    endSeconds: 15,
                    textKo: '스토리텔링의 기본 구조에서 모티프(Motif)는 서사의 추진력을 부여합니다.',
                    textEn: 'In storytelling, motifs drive narrative momentum and character depth.'
                  }
                ]
              }));
            }

            const ai = new GoogleGenAI({ apiKey });
            const prompt = `
당신은 교육 및 기업용 영상 검수 전문 AI 자막 생성기입니다.
다음 영상 정보를 바탕으로 실시간 타임스탬프와 함께 한국어 원문 자막과 영어(${targetLanguage}) 번역 자막을 생성해주세요.
- 주제: "${videoTitle || 'AI와 함께 쓰는 스토리텔링 워크숍'}"
- 차시: "${sessionTitle || '이야기의 뼈대와 모티프'}"
- 길이: 약 ${Math.round(duration || 749)}초

반드시 다음 JSON 배열만 출력하세요:
[
  {
    "id": 1,
    "startTime": "00:00",
    "endTime": "00:06",
    "startSeconds": 0,
    "endSeconds": 6,
    "textKo": "안녕하세요. 이번 차시에서는 스토리텔링의 핵심 뼈대를 살펴봅니다.",
    "textEn": "Hello. In this session, we will explore the core framework of storytelling."
  }
]
`;

            const response = await ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: prompt,
              config: {
                responseMimeType: 'application/json',
              }
            });

            const text = response.text || '[]';
            const subtitles = JSON.parse(text);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, subtitles }));
          } catch (err: any) {
            console.error('Gemini API error in middleware:', err);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              fallback: true,
              subtitles: [
                {
                  id: 1,
                  startTime: '00:00',
                  endTime: '00:06',
                  startSeconds: 0,
                  endSeconds: 6,
                  textKo: '안녕하세요. 이번 차시 스토리텔링 강의를 시작하겠습니다.',
                  textEn: 'Hello. We will begin this storytelling session.'
                }
              ]
            }));
          }
        });
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
