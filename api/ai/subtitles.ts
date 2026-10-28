import { createHmac, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { env } from 'node:process';

type HandlerRequest = { method?: string; body?: any };
type HandlerResponse = {
  status: (code: number) => HandlerResponse;
  json: (payload: unknown) => void;
};

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_UPLOAD_BASE = 'https://generativelanguage.googleapis.com/upload/v1beta';
const DEFAULT_S3_API = 'https://4twap62wo2.execute-api.ap-northeast-2.amazonaws.com';
const MODEL = env.GEMINI_MODEL || 'gemini-3.8-flash';
const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;

function jsonError(res: HandlerResponse, status: number, message: string) {
  res.status(status).json({ error: message });
}

function apiKey() {
  return env.GEMINI_API_KEY || '';
}

function apiHeaders() {
  return { 'x-goog-api-key': apiKey(), 'Content-Type': 'application/json' };
}

function geminiResourceUrl(name: string): string {
  return GEMINI_BASE + '/' + name.split('/').map(part => encodeURIComponent(part)).join('/');
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function secondsToTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return hours > 0 ? pad(hours) + ':' + pad(minutes) + ':' + pad(secs) : pad(minutes) + ':' + pad(secs);
}

async function getSource(reqBody: any) {
  const mimeType = String(reqBody.mimeType || 'video/mp4').split(';')[0];
  const s3Key = typeof reqBody.s3Key === 'string' ? reqBody.s3Key.trim() : '';
  let sourceUrl = '';

  if (s3Key) {
    if (s3Key.startsWith('/') || s3Key.includes('..') || s3Key.length > 1024) {
      throw new Error('영상 저장 경로가 올바르지 않습니다.');
    }
    const base = (env.S3_PRESIGN_API_BASE || env.VITE_S3_PRESIGN_API_BASE || DEFAULT_S3_API).replace(/\/+$/, '');
    const presign = await fetch(base + '/presign-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: s3Key }),
      signal: AbortSignal.timeout(30000)
    });
    const data = await presign.json().catch(() => ({}));
    if (!presign.ok || !data.downloadUrl) throw new Error(data.error || '저장된 영상의 재생 주소를 발급받지 못했습니다.');
    sourceUrl = String(data.downloadUrl);
  } else {
    const candidate = String(reqBody.videoUrl || '');
    let parsed: URL;
    try { parsed = new URL(candidate); } catch { throw new Error('AI 분석을 위해 실제 업로드 영상이 필요합니다.'); }
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'commondatastorage.googleapis.com') {
      throw new Error('AI 분석은 저장된 업로드 영상에서만 지원됩니다. 외부 링크 영상을 프로젝트 저장소에 먼저 업로드해 주세요.');
    }
    sourceUrl = parsed.toString();
  }

  const source = await fetch(sourceUrl, { signal: AbortSignal.timeout(240000) });
  if (!source.ok || !source.body) throw new Error('저장소에서 영상 원본을 불러오지 못했습니다 (' + source.status + ').');

  const headerSize = Number(source.headers.get('content-length') || 0);
  const submittedSize = Number(reqBody.sizeBytes || 0);
  const sizeBytes = headerSize || submittedSize;
  if (!sizeBytes) throw new Error('영상 파일 크기를 확인할 수 없습니다. 파일을 다시 등록해 주세요.');
  if (sizeBytes > MAX_VIDEO_BYTES) throw new Error('Gemini Files API의 단일 파일 한도(2GB)를 초과했습니다.');

  return {
    body: source.body,
    sizeBytes,
    mimeType: source.headers.get('content-type')?.split(';')[0] || mimeType,
    displayName: String(reqBody.fileName || 'lecture-video').slice(0, 180)
  };
}

async function uploadToGemini(reqBody: any) {
  const source = await getSource(reqBody);
  const start = await fetch(GEMINI_UPLOAD_BASE + '/files', {
    method: 'POST',
    headers: {
      ...apiHeaders(),
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(source.sizeBytes),
      'X-Goog-Upload-Header-Content-Type': source.mimeType
    },
    body: JSON.stringify({ file: { displayName: source.displayName } }),
    signal: AbortSignal.timeout(30000)
  });

  if (!start.ok) {
    const detail = await start.text().catch(() => '');
    throw new Error('Gemini 영상 업로드를 시작하지 못했습니다. ' + detail.slice(0, 400));
  }
  const uploadUrl = start.headers.get('x-goog-upload-url');
  if (!uploadUrl) throw new Error('Gemini 업로드 세션 주소를 받지 못했습니다.');

  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': String(source.sizeBytes),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
      'Content-Type': source.mimeType
    },
    body: source.body as any,
    duplex: 'half'
  } as RequestInit & { duplex: 'half' });

  const uploaded = await uploadResponse.json().catch(() => ({}));
  if (!uploadResponse.ok || !uploaded.file?.name || !uploaded.file?.uri) {
    throw new Error('Gemini Files API가 영상 업로드를 완료하지 못했습니다. ' + JSON.stringify(uploaded).slice(0, 400));
  }
  return uploaded.file as { name: string; uri: string; mimeType?: string; state?: string };
}

async function waitForGeminiFile(name: string) {
  const deadline = Date.now() + 150000;
  let file: any;
  while (Date.now() < deadline) {
    const response = await fetch(geminiResourceUrl(name), {
      headers: apiHeaders(),
      signal: AbortSignal.timeout(30000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error('Gemini가 업로드된 영상을 확인하지 못했습니다.');
    file = data;
    if (file.state === 'ACTIVE') return file;
    if (file.state === 'FAILED') throw new Error('Gemini에서 영상 파일을 처리하지 못했습니다.');
    await sleep(2500);
  }
  throw new Error('Gemini의 영상 준비 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.');
}

function makeJobToken(interactionId: string, fileName: string): string {
  const expiresAt = Date.now() + 2 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ interactionId, fileName, expiresAt })).toString('base64url');
  const signature = createHmac('sha256', apiKey()).update(payload).digest('base64url');
  return payload + '.' + signature;
}

function readJobToken(token: string): { interactionId: string; fileName: string; expiresAt: number } {
  const parts = token.split('.');
  if (parts.length !== 2) throw new Error('분석 작업 토큰이 올바르지 않습니다.');
  const expected = createHmac('sha256', apiKey()).update(parts[0]).digest();
  const actual = Buffer.from(parts[1], 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error('분석 작업 토큰을 확인할 수 없습니다.');
  const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
  if (!payload.interactionId || !payload.fileName || Date.now() > payload.expiresAt) throw new Error('분석 작업 링크가 만료되었습니다. 다시 분석해 주세요.');
  return payload;
}

function buildPrompt(body: any) {
  const title = String(body.sessionTitle || '강의').slice(0, 300);
  const course = String(body.videoTitle || '').slice(0, 300);
  const duration = Number(body.duration || 0);

  return [
    '역할: 한국어 강의 영상의 전문 전사자이자 자막 품질 검수자.',
    '첨부된 실제 영상의 음성을 우선 근거로 사용하고, 화면의 강의 자료는 전문 용어의 철자를 확인할 때만 보조 근거로 사용한다.',
    '제목만 보고 내용을 추측하거나 일반적인 강의 문장을 만들어내지 않는다. 들리지 않는 부분은 채우지 말고 해당 구간을 uncertaintyNotes에 적는다.',
    '한국어 발화는 가능한 한 실제 표현을 보존해 자연스러운 문장으로 전사한다. 반복·군더더기는 의미를 바꾸지 않는 범위에서만 정리한다.',
    '발화 순서에 맞춰 자막 구간을 만들고, 각 구간은 발화에 가까운 실제 시작/종료 시각을 초 단위로 기록한다. 영상에 없는 내용이나 임의의 인사말·요약을 추가하지 않는다.',
    'textEn은 textKo의 충실한 번역이며, 한국어 내용을 새로 보충하지 않는다.',
    'confidence는 음성이 명확하면 high, 일부가 겹치거나 발음이 불분명하면 medium/low로 표시한다. 낮은 confidence 구간에는 uncertaintyNote를 간결하게 기록한다.',
    '응답은 JSON 객체 하나만 반환한다. 코드 블록, 머리말, 마크다운은 쓰지 않는다.',
    '강좌명: ' + course,
    '차시명: ' + title,
    '예상 길이(초): ' + duration,
    'JSON 형식: {"summary":"영상에서 실제 확인한 강의 요약","keyTerms":["실제 나온 용어"],"uncertaintyNotes":["시각과 불확실 사유"],"segments":[{"startSeconds":0,"endSeconds":8,"textKo":"실제 음성 전사","textEn":"Faithful translation","confidence":"high","uncertaintyNote":""}]}',
    'segments는 영상 전체의 발화를 누락 없이 가능한 한 촘촘하게 나누되, 타임코드가 겹치지 않게 한다. 전체 내용을 확인한 뒤 생성한다.'
  ].join('\n');
}

async function startAnalysis(body: any, res: HandlerResponse) {
  if (!apiKey()) return jsonError(res, 503, '서버에 GEMINI_API_KEY가 설정되지 않았습니다.');
  if (!body.s3Key && !body.videoUrl) return jsonError(res, 400, '분석할 실제 영상이 지정되지 않았습니다.');

  let file: any;
  try {
    file = await uploadToGemini(body);
    file = await waitForGeminiFile(file.name);

    const response = await fetch(GEMINI_BASE + '/interactions', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({
        model: MODEL,
        input: [
          {
            type: 'video',
            uri: file.uri,
            mime_type: file.mimeType || body.mimeType || 'video/mp4',
            processing: 'agentic'
          },
          { type: 'text', text: buildPrompt(body) }
        ],
        background: true
      }),
      signal: AbortSignal.timeout(30000)
    });
    const interaction = await response.json().catch(() => ({}));
    if (!response.ok || !interaction.id) throw new Error(interaction.error?.message || 'Gemini 분석 작업을 시작하지 못했습니다.');
    res.status(202).json({
      status: 'processing',
      jobToken: makeJobToken(interaction.id, file.name),
      model: MODEL
    });
  } catch (error: any) {
    if (file?.name) {
      await fetch(geminiResourceUrl(file.name), {
        method: 'DELETE',
        headers: apiHeaders()
      }).catch(() => undefined);
    }
    jsonError(res, 502, error.message || '실제 영상 AI 분석을 시작하지 못했습니다.');
  }
}

function parseAnalysis(text: string, duration: number) {
  const trimmed = text.trim().replace(/^(?:\u0060){3}(?:json)?\s*/i, '').replace(/\s*(?:\u0060){3}$/, '');
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('AI 응답에 분석 결과 JSON이 없습니다.');
  const parsed = JSON.parse(trimmed.slice(start, end + 1));
  const rawSegments = Array.isArray(parsed.segments) ? parsed.segments : [];
  const safeDuration = Math.max(0, Number(duration) || 0);
  const segments = rawSegments.map((segment: any) => {
    const startSeconds = Math.max(0, Math.floor(Number(segment.startSeconds)));
    const rawEnd = Math.floor(Number(segment.endSeconds));
    const endSeconds = safeDuration > 0 ? Math.min(safeDuration, rawEnd) : rawEnd;
    const confidence = ['high', 'medium', 'low'].includes(segment.confidence) ? segment.confidence : 'medium';
    return {
      startSeconds,
      endSeconds,
      startTime: secondsToTime(startSeconds),
      endTime: secondsToTime(endSeconds),
      textKo: String(segment.textKo || '').trim(),
      textEn: String(segment.textEn || '').trim(),
      confidence,
      uncertaintyNote: String(segment.uncertaintyNote || '').trim()
    };
  }).filter((segment: any) => segment.endSeconds > segment.startSeconds && segment.textKo)
    .sort((a: any, b: any) => a.startSeconds - b.startSeconds)
    .map((segment: any, index: number) => ({ id: index + 1, ...segment }));

  if (!segments.length) throw new Error('실제 음성을 바탕으로 한 자막 구간을 만들지 못했습니다.');
  return {
    summary: String(parsed.summary || '').trim(),
    keyTerms: Array.isArray(parsed.keyTerms) ? parsed.keyTerms.map((term: unknown) => String(term).trim()).filter(Boolean).slice(0, 30) : [],
    uncertaintyNotes: Array.isArray(parsed.uncertaintyNotes) ? parsed.uncertaintyNotes.map((note: unknown) => String(note).trim()).filter(Boolean).slice(0, 100) : [],
    segments
  };
}

async function getAnalysisStatus(body: any, res: HandlerResponse) {
  if (!apiKey()) return jsonError(res, 503, '서버에 GEMINI_API_KEY가 설정되지 않았습니다.');
  let job: { interactionId: string; fileName: string; expiresAt: number };
  try {
    job = readJobToken(String(body.jobToken || ''));
  } catch (error: any) {
    return jsonError(res, 400, error.message);
  }

  const response = await fetch(geminiResourceUrl('interactions/' + job.interactionId), {
    headers: apiHeaders(),
    signal: AbortSignal.timeout(30000)
  });
  const interaction = await response.json().catch(() => ({}));
  if (!response.ok) return jsonError(res, 502, interaction.error?.message || '분석 진행 상태를 가져오지 못했습니다.');
  if (interaction.status === 'in_progress' || interaction.status === 'queued') {
    return res.status(200).json({ status: interaction.status });
  }
  if (interaction.status === 'failed' || interaction.status === 'cancelled') {
    await fetch(geminiResourceUrl(job.fileName), { method: 'DELETE', headers: apiHeaders() }).catch(() => undefined);
    return jsonError(res, 502, interaction.error?.message || 'AI 분석이 완료되지 않았습니다.');
  }

  try {
    const analysis = parseAnalysis(String(interaction.output_text || ''), Number(body.duration || 0));
    await fetch(geminiResourceUrl(job.fileName), { method: 'DELETE', headers: apiHeaders() }).catch(() => undefined);
    res.status(200).json({ status: 'completed', analysis, model: MODEL });
  } catch (error: any) {
    await fetch(geminiResourceUrl(job.fileName), { method: 'DELETE', headers: apiHeaders() }).catch(() => undefined);
    jsonError(res, 502, error.message || 'AI 분석 결과를 검증하지 못했습니다.');
  }
}

export default async function handler(req: HandlerRequest, res: HandlerResponse) {
  if (req.method !== 'POST') return jsonError(res, 405, 'POST 요청만 지원합니다.');
  const body = req.body || {};
  try {
    if (body.action === 'status') return await getAnalysisStatus(body, res);
    return await startAnalysis(body, res);
  } catch (error: any) {
    jsonError(res, 500, error.message || 'AI 자막 분석 요청을 처리하지 못했습니다.');
  }
}
