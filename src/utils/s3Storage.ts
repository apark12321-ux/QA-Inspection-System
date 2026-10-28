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

export async function uploadVideoFile(options: UploadVideoOptions): Promise<string> {
  const contentType = options.file.type || 'application/octet-stream';
  const result = await requestPresign('/presign-upload', {
    projectName: options.projectName,
    lessonName: options.lessonName,
    fileName: options.file.name || options.fileName,
    videoId: options.videoId,
    contentType
  });
  if (!result.uploadUrl || !result.key) throw new Error('저장소에서 업로드 주소를 받지 못했습니다.');

  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', result.uploadUrl!);
    request.setRequestHeader('Content-Type', contentType);
    request.upload.onprogress = event => {
      if (event.lengthComputable) options.onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => request.status >= 200 && request.status < 300
      ? resolve()
      : reject(new Error('영상 업로드에 실패했습니다 (' + request.status + ').'));
    request.onerror = () => reject(new Error('영상 업로드 중 네트워크 연결이 끊겼습니다.'));
    request.onabort = () => reject(new Error('영상 업로드가 취소되었습니다.'));
    request.send(options.file);
  });
  return result.key;
}

export async function getVideoPlaybackUrl(key: string): Promise<string> {
  const result = await requestPresign('/presign-download', { key });
  if (!result.downloadUrl) throw new Error('영상 재생 주소를 받지 못했습니다.');
  return result.downloadUrl;
}

export async function deleteStoredVideo(key: string): Promise<void> {
  const result = await requestPresign('/presign-delete', { key });
  if (!result.deleteUrl) throw new Error('영상 삭제 주소를 받지 못했습니다.');
  const response = await fetch(result.deleteUrl, { method: 'DELETE' });
  if (!response.ok && response.status !== 404) throw new Error('영상 삭제에 실패했습니다 (' + response.status + ').');
}
