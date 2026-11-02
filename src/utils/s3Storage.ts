const env = import.meta.env as Record<string, string | undefined>;
const API_BASE = (env.VITE_S3_PRESIGN_API_BASE || 'https://4twap62wo2.execute-api.ap-northeast-2.amazonaws.com').replace(/\/+$/, '');

interface PresignResponse {
  uploadUrl?: string;
  downloadUrl?: string;
  deleteUrl?: string;
  key?: string;
  error?: string;
}

export interface UploadVideoOptions {
  projectName: string;
  lessonName: string;
  fileName: string;
  videoId: string;
  file: File;
  onProgress?: (progress: number) => void;
}

export function inspectVideoDuration(file: File): Promise<number> {
  return new Promise(resolve => {
    const objectUrl = URL.createObjectURL(file);
    const probe = document.createElement('video');
    const finish = (duration: number) => {
      URL.revokeObjectURL(objectUrl);
      probe.removeAttribute('src');
      probe.load();
      resolve(Number.isFinite(duration) && duration > 0 ? Math.round(duration) : 0);
    };
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => finish(probe.duration);
    probe.onerror = () => finish(0);
    probe.src = objectUrl;
  });
}

async function requestPresign(path: string, payload: Record<string, unknown>): Promise<PresignResponse> {
  const response = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || '스토리지 요청에 실패했습니다 (' + response.status + ').');
  return data;
}

const DB_NAME = 'whomedia_video_db';
const STORE_NAME = 'video_blobs';

function openIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported'));
    }
    const req = window.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveToLocalIndexedDb(key: string, file: File): Promise<void> {
  const db = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(file, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getFromLocalIndexedDb(key: string): Promise<Blob | null> {
  const db = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function deleteFromLocalIndexedDb(key: string): Promise<void> {
  try {
    const db = await openIndexedDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Local IndexedDB delete failed:', e);
  }
}

export async function uploadVideoFile(options: UploadVideoOptions): Promise<string> {
  const contentType = options.file.type || 'application/octet-stream';
  
  // Try AWS S3 presigned upload first if configured
  try {
    const result = await requestPresign('/presign-upload', {
      projectName: options.projectName,
      lessonName: options.lessonName,
      fileName: options.file.name || options.fileName,
      videoId: options.videoId,
      contentType
    });

    if (result.uploadUrl && result.key) {
      await new Promise<void>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('PUT', result.uploadUrl!);
        request.setRequestHeader('Content-Type', contentType);
        request.upload.onprogress = event => {
          if (event.lengthComputable) options.onProgress?.(Math.round((event.loaded / event.total) * 100));
        };
        request.onload = () => request.status >= 200 && request.status < 300
          ? resolve()
          : reject(new Error('S3 업로드 실패 (' + request.status + ')'));
        request.onerror = () => reject(new Error('S3 네트워크 오류'));
        request.onabort = () => reject(new Error('업로드 취소'));
        request.send(options.file);
      });
      return result.key;
    }
  } catch (s3Error) {
    console.warn('AWS S3 미설정 또는 업로드 실패, Vercel/로컬 브라우저 고속 스토리지로 저장합니다:', s3Error);
  }

  // Vercel / 로컬 환경: IndexedDB에 실제 대용량 비디오 파일 영구 저장
  const localKey = `local-video-${options.videoId}`;
  options.onProgress?.(30);
  await saveToLocalIndexedDb(localKey, options.file);
  options.onProgress?.(100);
  return localKey;
}

export async function getVideoPlaybackUrl(key: string): Promise<string> {
  // Check if it's a local IndexedDB video
  if (key.startsWith('local-video-')) {
    const blob = await getFromLocalIndexedDb(key);
    if (blob) {
      return URL.createObjectURL(blob);
    }
    throw new Error('로컬에 저장된 영상 파일을 찾을 수 없습니다.');
  }

  // Otherwise request S3 presigned URL
  try {
    const result = await requestPresign('/presign-download', { key });
    if (result.downloadUrl) return result.downloadUrl;
  } catch (err) {
    // If S3 fails, check if local copy exists
    const localBlob = await getFromLocalIndexedDb(key);
    if (localBlob) return URL.createObjectURL(localBlob);
    throw err;
  }
  throw new Error('영상 재생 주소를 받지 못했습니다.');
}

export async function deleteStoredVideo(key: string): Promise<void> {
  if (key.startsWith('local-video-')) {
    await deleteFromLocalIndexedDb(key);
    return;
  }

  try {
    const result = await requestPresign('/presign-delete', { key });
    if (result.deleteUrl) {
      await fetch(result.deleteUrl, { method: 'DELETE' });
    }
  } catch (err) {
    console.warn('S3 delete failed, checking local:', err);
  }
  await deleteFromLocalIndexedDb(key);
}
