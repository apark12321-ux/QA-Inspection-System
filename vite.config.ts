import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import subtitleHandler from './api/ai/subtitles';
import { env } from 'node:process';

function aiSubtitleApiPlugin() {
  return {
    name: 'ai-subtitle-api',
    configureServer(server: any) {
      server.middlewares.use('/api/ai/subtitles', async (request: any, response: any) => {
        if (request.method !== 'POST') {
          response.statusCode = 405;
          response.setHeader('Content-Type', 'application/json');
          response.end(JSON.stringify({ error: 'POST 요청만 지원합니다.' }));
          return;
        }

        try {
          let rawBody = '';
          for await (const chunk of request) rawBody += chunk.toString();
          const body = rawBody ? JSON.parse(rawBody) : {};
          let statusCode = 200;
          const responseAdapter = {
            status(code: number) {
              statusCode = code;
              return this;
            },
            json(payload: unknown) {
              response.statusCode = statusCode;
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify(payload));
            }
          };
          await subtitleHandler({ method: request.method, body } as any, responseAdapter as any);
        } catch (error) {
          response.statusCode = 400;
          response.setHeader('Content-Type', 'application/json');
          response.end(JSON.stringify({ error: error instanceof Error ? error.message : '요청 본문을 읽지 못했습니다.' }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), aiSubtitleApiPlugin()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: env.DISABLE_HMR !== 'true',
    watch: env.DISABLE_HMR === 'true' ? null : {}
  }
});
