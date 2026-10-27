import { SubtitleEntry } from '../types';

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const mm = m < 10 ? `0${m}` : `${m}`;
  const ss = s < 10 ? `0${s}` : `${s}`;
  return `${mm}:${ss}`;
}

export function parseTimestamp(str: string): number {
  if (!str) return 0;
  const parts = str.trim().split(':');
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10) || 0;
    const s = parseInt(parts[1], 10) || 0;
    return m * 60 + s;
  }
  if (parts.length === 3) {
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const s = parseInt(parts[2], 10) || 0;
    return h * 3600 + m * 60 + s;
  }
  return 0;
}

export function exportSubtitlesToSrt(subtitles: SubtitleEntry[]): string {
  return subtitles
    .map((sub, index) => {
      const start = `${sub.startTime}:00,000`.padStart(12, '00:');
      const end = `${sub.endTime}:00,000`.padStart(12, '00:');
      return `${index + 1}\n${start} --> ${end}\n${sub.textKo}\n${sub.textEn}\n`;
    })
    .join('\n');
}

export function exportSubtitlesToVtt(subtitles: SubtitleEntry[]): string {
  const body = subtitles
    .map((sub, index) => {
      const start = `${sub.startTime}.000`.padStart(9, '00:');
      const end = `${sub.endTime}.000`.padStart(9, '00:');
      return `${index + 1}\n${start} --> ${end}\n${sub.textKo}\n${sub.textEn}\n`;
    })
    .join('\n');
  return `WEBVTT - AI Subtitles Export\n\n${body}`;
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
