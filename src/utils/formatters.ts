import { SubtitleEntry } from '../types';

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(secs)}` : `${pad(minutes + hours * 60)}:${pad(secs)}`;
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

function exportTimestamp(seconds: number, separator: ',' | '.'): string {
  const milliseconds = Math.max(0, Math.round(seconds * 1000));
  const wholeSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const secs = wholeSeconds % 60;
  const ms = milliseconds % 1000;
  const pad = (value: number, width = 2) => String(value).padStart(width, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}${separator}${pad(ms, 3)}`;
}

export function exportSubtitlesToSrt(subtitles: SubtitleEntry[]): string {
  return subtitles
    .map((sub, index) => {
      const start = exportTimestamp(sub.startSeconds, ',');
      const end = exportTimestamp(sub.endSeconds, ',');
      return `${index + 1}\n${start} --> ${end}\n${sub.textKo}${sub.textEn ? '\n' + sub.textEn : ''}\n`;
    })
    .join('\n');
}

export function exportSubtitlesToVtt(subtitles: SubtitleEntry[]): string {
  const body = subtitles
    .map((sub, index) => {
      const start = exportTimestamp(sub.startSeconds, '.');
      const end = exportTimestamp(sub.endSeconds, '.');
      return `${index + 1}\n${start} --> ${end}\n${sub.textKo}${sub.textEn ? '\n' + sub.textEn : ''}\n`;
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
