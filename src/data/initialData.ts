import { VideoSession, UserAccount, AuditLog, NotificationItem } from '../types';

export const INITIAL_USERS: UserAccount[] = [];

// 실제 업로드된 영상만 관리하기 위해 허구의 목데이터 영상은 전부 제거
export const INITIAL_VIDEOS: VideoSession[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
