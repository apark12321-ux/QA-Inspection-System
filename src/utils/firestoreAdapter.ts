import { ProjectItem, ProjectSessionItem, ProjectWeekItem, ReviewComment, ReviewStatus, SubtitleEntry, UserRole, VideoSession } from '../types';
import { formatTime } from './formatters';
import { FirestoreDocument } from './firebaseClient';

export interface FirestoreSnapshotData {
  projects: FirestoreDocument[];
  weeks: FirestoreDocument[];
  lessons: FirestoreDocument[];
  videos: FirestoreDocument[];
}

export function statusFromFirestore(value: unknown): ReviewStatus {
  const status = String(value || 'pending').toLowerCase();
  if (status === 'approved') return 'APPROVED';
  if (status === 'rejected') return 'REJECTED';
  if (status === 'processing') return 'PROCESSING';
  return 'PENDING';
}

export function statusToFirestore(value: ReviewStatus): string {
  return value.toLowerCase();
}

function asDateLabel(value: unknown): string {
  if (!value) return '';
  let normalized: unknown = value;
  if (typeof value === 'object' && value !== null) {
    const timestamp = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
    if (typeof timestamp.toDate === 'function') normalized = timestamp.toDate();
    else if (typeof timestamp.seconds === 'number' || typeof timestamp._seconds === 'number') {
      normalized = new Date(Number(timestamp.seconds ?? timestamp._seconds) * 1000);
    }
  }
  const date = normalized instanceof Date ? normalized : new Date(String(normalized));
  if (Number.isNaN(date.getTime())) return String(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return date.getFullYear() + '.' + pad(date.getMonth() + 1) + '.' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
}

function asBytes(value: unknown): number {
  const bytes = Number(value);
  return Number.isFinite(bytes) && bytes >= 0 ? bytes : 0;
}

function asSizeLabel(value: unknown): string {
  const bytes = asBytes(value);
  if (!bytes) return typeof value === 'string' ? value : '—';
  if (bytes >= 1024 ** 3) return (bytes / 1024 ** 3).toFixed(1) + ' GB';
  return Math.max(1, Math.round(bytes / 1024 ** 2)) + ' MB';
}

function parseVttTime(value: string): number {
  const parts = value.replace(',', '.').split(':').map(part => Number(part));
  if (parts.some(part => !Number.isFinite(part))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

function parseVtt(source: unknown, language: 'ko' | 'en'): SubtitleEntry[] {
  if (typeof source !== 'string' || !source.trim()) return [];
  const blocks = source.replace(/\r/g, '').split(/\n\s*\n/).filter(block => block.includes('-->'));
  return blocks.flatMap((block, index) => {
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
    const timeLine = lines.find(line => line.includes('-->'));
    if (!timeLine) return [];
    const [startRaw, endRaw] = timeLine.split('-->').map(value => value.trim().split(/\s+/)[0]);
    const startSeconds = parseVttTime(startRaw);
    const endSeconds = parseVttTime(endRaw);
    const text = lines.slice(lines.indexOf(timeLine) + 1).join('\n');
    if (!text || endSeconds <= startSeconds) return [];
    return [{
      id: index + 1,
      startTime: formatTime(startSeconds),
      endTime: formatTime(endSeconds),
      startSeconds,
      endSeconds,
      textKo: language === 'ko' ? text : '',
      textEn: language === 'en' ? text : ''
    }];
  });
}

function commentsFromFirestore(doc: FirestoreDocument): ReviewComment[] {
  const comments = Array.isArray(doc.comments) ? doc.comments : Array.isArray(doc.reviews) ? doc.reviews : [];
  return comments.map((comment: Record<string, any>) => {
    const seconds = Number(comment.timecode ?? comment.timestampSeconds);
    const verdict = String(comment.verdict || 'pending').toUpperCase();
    return {
      id: String(comment.id || doc.id + '-' + (comment.createdAt || '')),
      author: String(comment.author || '검수자'),
      role: (['ADMIN', 'REVIEWER', 'CREATOR', 'VIEWER'].includes(comment.role) ? comment.role : 'REVIEWER') as UserRole,
      timestampSeconds: Number.isFinite(seconds) ? seconds : 0,
      timestampFormatted: Number.isFinite(seconds) ? formatTime(seconds) : '--:--',
      verdict: verdict === 'APPROVED' || verdict === 'REJECTED' ? verdict : 'PENDING',
      content: String(comment.text || comment.content || ''),
      createdAt: asDateLabel(comment.createdAt)
    };
  }).filter(comment => comment.content);
}

function makeVideo(doc: FirestoreDocument, project: FirestoreDocument | undefined, lesson: FirestoreDocument | undefined, week: FirestoreDocument | undefined): VideoSession {
  const subtitleVtt = doc.subtitleVtt || {};
  const storedSubtitles: SubtitleEntry[] = Array.isArray(doc.subtitles) ? doc.subtitles : [];
  const koRows = parseVtt(subtitleVtt.ko, 'ko');
  const enRows = parseVtt(subtitleVtt.en, 'en');
  const subtitles = koRows.map((row, index) => ({
    ...row,
    textEn: enRows[index]?.textEn || row.textEn,
    confidence: storedSubtitles.find(saved => saved.id === row.id)?.confidence || storedSubtitles[index]?.confidence,
    uncertaintyNote: storedSubtitles.find(saved => saved.id === row.id)?.uncertaintyNote || storedSubtitles[index]?.uncertaintyNote
  }));
  const status = statusFromFirestore(doc.status);
  const createdAt = doc.createdAt || doc.uploadedAt || new Date().toISOString();
  const updatedAt = doc.updatedAt || createdAt;
  const sizeBytes = asBytes(doc.size || doc.sizeBytes);

  return {
    id: doc.id,
    projectId: String(doc.projectId || lesson?.projectId || ''),
    lessonId: String(doc.lessonId || ''),
    weekId: Number(week?.order || doc.weekId || 1),
    weekTitle: String(week?.name || lesson?.weekTitle || (project?.name || '주차 미지정')),
    sessionTitle: String(lesson?.name || doc.sessionTitle || doc.fileName || '제목 미지정'),
    fileName: String(doc.fileName || 'video'),
    videoUrl: String(doc.url || doc.videoUrl || ''),
    s3Key: typeof doc.s3Key === 'string' ? doc.s3Key : undefined,
    mimeType: String(doc.mimeType || ''),
    sizeBytes,
    sourceType: doc.kind === 'external' ? 'direct' : 'direct',
    duration: Number(doc.duration || 0),
    fileSize: asSizeLabel(sizeBytes || doc.fileSize),
    status,
    uploadedAt: asDateLabel(createdAt),
    updatedAt: asDateLabel(updatedAt),
    reviewerName: String(doc.reviewerName || ''),
    reviews: commentsFromFirestore(doc),
    subtitles: subtitles.length ? subtitles : storedSubtitles,
    aiAnalysis: doc.aiAnalysis && typeof doc.aiAnalysis === 'object' ? {
      summary: String(doc.aiAnalysis.summary || ''),
      keyTerms: Array.isArray(doc.aiAnalysis.keyTerms) ? doc.aiAnalysis.keyTerms.map(String) : [],
      uncertaintyNotes: Array.isArray(doc.aiAnalysis.uncertaintyNotes) ? doc.aiAnalysis.uncertaintyNotes.map(String) : [],
      model: String(doc.aiAnalysis.model || ''),
      analyzedAt: String(doc.aiAnalysis.analyzedAt || '')
    } : undefined,
    pipeline: {
      jobId: String(doc.id),
      overallProgress: 100,
      currentStage: status === 'PROCESSING' ? '미디어 처리 중' : '검수 준비 완료',
      stages: []
    }
  };
}

export function mapFirestoreSnapshot(snapshot: FirestoreSnapshotData): { projects: ProjectItem[]; videos: VideoSession[] } {
  const projectDocs = snapshot.projects;
  const weekDocs = snapshot.weeks;
  const lessonDocs = snapshot.lessons;
  const videoDocs = snapshot.videos;

  const videos = videoDocs.map(doc => {
    const lesson = lessonDocs.find(item => item.id === doc.lessonId);
    const project = projectDocs.find(item => item.id === (doc.projectId || lesson?.projectId));
    const week = weekDocs.find(item => item.id === lesson?.weekId);
    return makeVideo(doc, project, lesson, week);
  }).filter(video => video.projectId || video.videoUrl || video.s3Key);

  const projects = projectDocs.map(project => {
    const weeksForProject = weekDocs.filter(week => week.projectId === project.id);
    const lessonsForProject = lessonDocs.filter(lesson => lesson.projectId === project.id);
    const sessionsForProject = lessonsForProject.map(lesson => {
      const sessionVideos = videos.filter(video => video.lessonId === lesson.id || (video.projectId === project.id && video.sessionTitle === lesson.name));
      return {
        id: lesson.id,
        title: String(lesson.name || '차시'),
        weekTitle: String(weeksForProject.find(week => week.id === lesson.weekId)?.name || ''),
        videoCount: sessionVideos.length,
        videos: sessionVideos
      } satisfies ProjectSessionItem;
    });
    const nestedWeeks = weeksForProject.map(week => ({
      id: week.id,
      title: String(week.name || '주차'),
      sessions: sessionsForProject.filter(session => {
        const lesson = lessonsForProject.find(item => item.id === session.id);
        return lesson?.weekId === week.id;
      })
    } satisfies ProjectWeekItem));

    return {
      id: project.id,
      name: String(project.name || '이름 없는 프로젝트'),
      alias: String(project.slug || project.alias || project.id),
      weekCount: weeksForProject.length,
      sessionCount: lessonsForProject.length,
      videoCount: videos.filter(video => video.projectId === project.id).length,
      weeks: nestedWeeks,
      sessions: sessionsForProject
    };
  }).sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  return { projects, videos };
}

export function toFirestoreComment(comment: ReviewComment): Record<string, unknown> {
  return {
    id: comment.id,
    text: comment.content,
    timecode: comment.timestampFormatted === '--:--' ? null : comment.timestampSeconds,
    author: comment.author,
    role: comment.role,
    verdict: comment.verdict.toLowerCase(),
    createdAt: comment.createdAt || new Date().toISOString()
  };
}
