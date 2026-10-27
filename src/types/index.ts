export type UserRole = 'ADMIN' | 'REVIEWER' | 'CREATOR' | 'VIEWER';

export type ReviewStatus = 'APPROVED' | 'REJECTED' | 'PENDING' | 'PROCESSING';

export interface ReviewComment {
  id: string;
  author: string;
  role: UserRole;
  timestampSeconds: number;
  timestampFormatted: string; // e.g. "03:12"
  verdict: 'APPROVED' | 'REJECTED' | 'PENDING';
  content: string;
  createdAt: string;
}

export interface SubtitleEntry {
  id: number;
  startTime: string; // "00:00"
  endTime: string;   // "00:05"
  startSeconds: number;
  endSeconds: number;
  textKo: string;
  textEn: string;
}

export interface PipelineStage {
  name: string;
  description: string;
  status: 'done' | 'active' | 'waiting' | 'failed';
  progress: number;
  timestamp?: string;
}

export interface VideoSession {
  id: string;
  weekId: number;
  weekTitle: string;
  sessionTitle: string;
  fileName: string;
  videoUrl: string;
  duration: number; // in seconds
  fileSize: string;
  status: ReviewStatus;
  uploadedAt: string;
  updatedAt: string;
  reviewerName?: string;
  reviews: ReviewComment[];
  subtitles: SubtitleEntry[];
  pipeline: {
    jobId: string;
    overallProgress: number;
    currentStage: string;
    stages: PipelineStage[];
  };
}

export interface AuditLog {
  id: string;
  actor: string;
  role: UserRole;
  action: string;
  target: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface NotificationItem {
  id: string;
  type: 'approval' | 'rejection' | 'comment' | 'pipeline' | 'upload';
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  videoId?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: 'active' | 'suspended';
  lastActive: string;
}
