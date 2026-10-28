import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  VideoSession,
  UserAccount,
  UserRole,
  ReviewStatus,
  ReviewComment,
  SubtitleEntry,
  AuditLog,
  NotificationItem,
  ProjectItem,
  VideoAiAnalysis
} from '../types';
import {
  INITIAL_VIDEOS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS
} from '../data/initialData';
import { INITIAL_PROJECTS } from '../data/projectData';
import { firebaseConfigured } from '../utils/firebaseClient';
import { subscribeToReviewData, subscribeToSharedVideo, newFirestoreId, saveFirestoreDocument, deleteFirestoreDocument, deleteFirestoreBatch } from '../utils/firebaseStore';
import { mapFirestoreSnapshot, statusToFirestore, toFirestoreComment } from '../utils/firestoreAdapter';
import { deleteStoredVideo } from '../utils/s3Storage';

interface AppContextType {
  videos: VideoSession[];
  users: UserAccount[];
  currentUser: UserAccount;
  switchRole: (role: UserRole) => void;
  selectedVideo: VideoSession | null;
  setSelectedVideo: (v: VideoSession | null) => void;
  portalMode: 'user' | 'admin';
  setPortalMode: (mode: 'user' | 'admin') => void;
  adminTab: 'dashboard' | 'storage' | 'pipeline' | 'rbac' | 'audit' | 'aws';
  setAdminTab: (tab: 'dashboard' | 'storage' | 'pipeline' | 'rbac' | 'audit' | 'aws') => void;
  activeTab: 'list' | 'dashboard' | 'pipeline' | 'rbac' | 'audit' | 'aws';
  setActiveTab: (tab: 'list' | 'dashboard' | 'pipeline' | 'rbac' | 'audit' | 'aws') => void;
  language: 'ko' | 'en';
  setLanguage: (lang: 'ko' | 'en') => void;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  auditLogs: AuditLog[];
  addAuditLog: (action: string, target: string, details: string) => void;
  addReviewComment: (
    videoId: string,
    comment: Omit<ReviewComment, 'id' | 'createdAt'>,
    verdict?: 'APPROVED' | 'REJECTED' | 'PENDING'
  ) => void;
  updateVideoStatus: (videoId: string, status: ReviewStatus, reviewerName?: string) => void;
  deleteReviewComment: (videoId: string, commentId: string) => void;
  updateVideoSubtitles: (videoId: string, subtitles: SubtitleEntry[]) => void;
  updateVideoAiAnalysis: (videoId: string, analysis: VideoAiAnalysis) => void;
  addNewVideo: (
    videoData: {
      weekId: number;
      weekTitle: string;
      sessionTitle: string;
      fileName: string;
      videoUrl: string;
      duration: number;
      fileSize: string;
      projectId?: string;
      lessonId?: string;
      s3Key?: string;
      mimeType?: string;
      sizeBytes?: number;
      id?: string;
      subtitles?: SubtitleEntry[];
    }
  ) => VideoSession;
  deleteVideo: (videoId: string) => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  uploadModalOpen: boolean;
  setUploadModalOpen: (open: boolean) => void;
  shareModalVideo: VideoSession | null;
  shareModalTimestamp: number;
  openShareModal: (v: VideoSession, timestamp?: number) => void;
  closeShareModal: () => void;
  seekToTime: number | null;
  setSeekToTime: (time: number | null) => void;
  projects: ProjectItem[];
  addProject: (name: string, alias: string) => void;
  deleteProject: (id: string) => void;
  addWeeksToProject: (projectId: string, weekNames: string[]) => void;
  addSessionsToProject: (projectId: string, weekId: string | null, sessionNames: string[]) => void;
  userViewMode: 'registration' | 'review';
  setUserViewMode: (mode: 'registration' | 'review') => void;
  currentProjectSlug: string | null;
  setCurrentProjectSlug: (slug: string | null) => void;
  activeProject: ProjectItem | null;
  isCloudSynced: boolean;
  syncWithBackend: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  VIDEOS: 'video_review_videos_v1',
  USERS: 'video_review_users_v1',
  LOGS: 'video_review_logs_v1',
  NOTIFS: 'video_review_notifs_v1',
  LANG: 'video_review_lang_v1',
  CURRENT_ROLE: 'video_review_role_v1',
  PROJECTS: 'video_review_projects_v1',
  USER_VIEW_MODE: 'video_review_view_mode_v1'
};

const DEMO_PERSON_NAMES = new Set(['이영희', '박제작', '김관리', '최참관']);

function removeDemoPeopleFromVideo(video: VideoSession): VideoSession {
  return {
    ...video,
    reviewerName: video.reviewerName && DEMO_PERSON_NAMES.has(video.reviewerName) ? '' : video.reviewerName,
    reviews: video.reviews.filter(review => !DEMO_PERSON_NAMES.has(review.author))
  };
}

function toVttTime(seconds: number): string {
  const value = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = value % 60;
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}.000`;
}

function subtitlesToVtt(subtitles: SubtitleEntry[], language: 'ko' | 'en'): string {
  const cues = subtitles.flatMap((subtitle, index) => {
    const content = language === 'ko' ? subtitle.textKo : subtitle.textEn;
    if (!content.trim()) return [];
    return [`${index + 1}\n${toVttTime(subtitle.startSeconds)} --> ${toVttTime(subtitle.endSeconds)}\n${content.trim()}`];
  });
  return cues.length ? `WEBVTT\n\n${cues.join('\n\n')}` : '';
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved projects or initial
  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    if (firebaseConfigured) return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return firebaseConfigured ? [] : INITIAL_PROJECTS;
  });

  const [userViewMode, setUserViewModeState] = useState<'registration' | 'review'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_VIEW_MODE) as 'registration' | 'review';
      if (saved === 'registration' || saved === 'review') return saved;
    } catch (e) {
      console.error(e);
    }
    return 'review'; // Defaults to clean inspection review portal for clients & reviewers
  });

  const setUserViewMode = (mode: 'registration' | 'review') => {
    setUserViewModeState(mode);
    localStorage.setItem(STORAGE_KEYS.USER_VIEW_MODE, mode);
  };

  // Load saved videos or initial
  const [videos, setVideos] = useState<VideoSession[]>(() => {
    if (firebaseConfigured) return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VIDEOS);
      if (saved) return (JSON.parse(saved) as VideoSession[]).map(removeDemoPeopleFromVideo);
    } catch (e) {
      console.error(e);
    }
    return firebaseConfigured ? [] : INITIAL_VIDEOS;
  });

  const [users, setUsers] = useState<UserAccount[]>([]);

  const [currentUser, setCurrentUser] = useState<UserAccount>({
    id: 'workspace-reviewer',
    name: '검수자',
    email: '',
    role: 'REVIEWER',
    department: '',
    status: 'active',
    lastActive: ''
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (saved) return (JSON.parse(saved) as AuditLog[]).filter(log => !DEMO_PERSON_NAMES.has(log.actor));
    } catch (e) {
      console.error(e);
    }
    return INITIAL_AUDIT_LOGS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [language, setLanguageState] = useState<'ko' | 'en'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LANG) as 'ko' | 'en';
      if (saved === 'ko' || saved === 'en') return saved;
    } catch (e) {
      console.error(e);
    }
    return 'ko';
  });

  const parseCurrentRoute = () => {
    try {
      const pathname = window.location.pathname.replace(/^\/+|\/+$/g, '');
      const params = new URLSearchParams(window.location.search);
      const isParamAdmin = params.get('portal') === 'admin';

      if (pathname === 'admin' || isParamAdmin) {
        return { slug: null, mode: 'admin' as const };
      }
      if (pathname.endsWith('/admin')) {
        const parts = pathname.split('/');
        return { slug: parts[0] || null, mode: 'admin' as const };
      }
      if (pathname) {
        return { slug: pathname, mode: 'user' as const };
      }
    } catch (e) {
      console.error(e);
    }
    return { slug: null, mode: 'user' as const };
  };

  const initialRoute = parseCurrentRoute();
  const [currentProjectSlug, setCurrentProjectSlugState] = useState<string | null>(initialRoute.slug);
  const [portalMode, setPortalModeState] = useState<'user' | 'admin'>(initialRoute.mode);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [adminTab, setAdminTab] = useState<'dashboard' | 'storage' | 'pipeline' | 'rbac' | 'audit' | 'aws'>('dashboard');

  const setCurrentProjectSlug = (slug: string | null) => {
    setCurrentProjectSlugState(slug);
    try {
      const url = new URL(window.location.href);
      if (!slug) {
        url.pathname = portalMode === 'admin' ? '/admin' : '/';
      } else {
        url.pathname = portalMode === 'admin' ? `/${slug}/admin` : `/${slug}`;
      }
      window.history.pushState({}, '', url.toString());
    } catch (e) {
      console.error(e);
    }
  };

  const setPortalMode = (mode: 'user' | 'admin') => {
    setPortalModeState(mode);
    try {
      const url = new URL(window.location.href);
      if (mode === 'admin') {
        url.pathname = currentProjectSlug ? `/${currentProjectSlug}/admin` : '/admin';
      } else {
        url.pathname = currentProjectSlug ? `/${currentProjectSlug}` : '/';
      }
      url.searchParams.delete('portal');
      window.history.pushState({}, '', url.toString());
    } catch (e) {
      console.error(e);
    }
  };

  const activeProject = currentProjectSlug
    ? projects.find(
        p =>
          p.alias.toLowerCase() === currentProjectSlug.toLowerCase() ||
          p.id.toLowerCase() === currentProjectSlug.toLowerCase()
      ) || null
    : null;

  useEffect(() => {
    if (!firebaseConfigured) return;
    const sharedVideoId = new URLSearchParams(window.location.search).get('v');
    const unsubscribe = sharedVideoId
      ? subscribeToSharedVideo(sharedVideoId, snapshot => {
          const mapped = mapFirestoreSnapshot(snapshot);
          setProjects(mapped.projects);
          setVideos(mapped.videos);
          setIsCloudSynced(true);
        }, error => {
          console.error('공유 영상 동기화에 실패했습니다:', error);
          setIsCloudSynced(false);
        })
      : subscribeToReviewData(snapshot => {
      const mapped = mapFirestoreSnapshot(snapshot);
      setProjects(mapped.projects);
      setVideos(mapped.videos);
      setIsCloudSynced(true);
    }, error => {
      console.error('Firestore sync failed:', error);
      setIsCloudSynced(false);
    });
    return unsubscribe;
  }, []);

  const syncWithBackend = async () => {
    if (firebaseConfigured) {
      setIsCloudSynced(true);
      return;
    }
    setIsCloudSynced(false);
  };

  useEffect(() => {
    const handlePopState = () => {
      const route = parseCurrentRoute();
      setCurrentProjectSlugState(route.slug);
      setPortalModeState(route.mode);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [activeTab, setActiveTab] = useState<'list' | 'dashboard' | 'pipeline' | 'rbac' | 'audit' | 'aws'>('list');
  const [selectedVideo, setSelectedVideo] = useState<VideoSession | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [shareModalVideo, setShareModalVideo] = useState<VideoSession | null>(null);
  const [shareModalTimestamp, setShareModalTimestamp] = useState<number>(0);
  const [seekToTime, setSeekToTime] = useState<number | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(videos));
  }, [videos]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify(notifications));
  }, [notifications]);

  // Keep selectedVideo in sync when videos array updates
  useEffect(() => {
    if (selectedVideo) {
      const refreshed = videos.find(v => v.id === selectedVideo.id);
      if (refreshed) {
        setSelectedVideo(refreshed);
      }
    }
  }, [videos]);

  // Apply individual video links after Firestore has delivered the shared video's record.
  const deepLinkApplied = useRef('');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const videoId = params.get('v');
    const timeParam = params.get('t');

    if (videoId) {
      const found = videos.find(v => v.id === videoId);
      const linkKey = videoId + ':' + (timeParam || '');
      if (found && deepLinkApplied.current !== linkKey) {
        deepLinkApplied.current = linkKey;
        setSelectedVideo(found);
        if (timeParam) {
          const t = Number(timeParam);
          if (Number.isFinite(t) && t >= 0) {
            setSeekToTime(t);
          }
        } else {
          setSeekToTime(0);
        }
      }
    }

  }, [videos]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const setLanguage = (lang: 'ko' | 'en') => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEYS.LANG, lang);
  };

  const switchRole = (role: UserRole) => {
    setCurrentUser(current => ({ ...current, role }));
  };

  const addAuditLog = (action: string, target: string, details: string) => {
    const now = new Date();
    const formatted = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      actor: currentUser.name.split(' ')[0],
      role: currentUser.role,
      action,
      target,
      details,
      timestamp: formatted,
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 80 + 10)
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const addReviewComment = (
    videoId: string,
    commentData: Omit<ReviewComment, 'id' | 'createdAt'>,
    verdict?: 'APPROVED' | 'REJECTED' | 'PENDING'
  ) => {
    const now = new Date();
    const formatted = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newComment: ReviewComment = {
      ...commentData,
      id: `rev-${Date.now()}`,
      createdAt: now.toISOString()
    };

    setVideos(prev =>
      prev.map(v => {
        if (v.id !== videoId) return v;
        const newStatus = verdict ? verdict : v.status;
        return {
          ...v,
          status: newStatus,
          reviewerName: currentUser.name.split(' ')[0],
          updatedAt: formatted,
          reviews: [newComment, ...v.reviews]
        };
      })
    );

    setSelectedVideo(current => {
      if (current && current.id === videoId) {
        const newStatus = verdict ? verdict : current.status;
        return {
          ...current,
          status: newStatus,
          reviewerName: currentUser.name.split(' ')[0],
          updatedAt: formatted,
          reviews: [newComment, ...current.reviews]
        };
      }
      return current;
    });

    const video = videos.find(v => v.id === videoId);
    const targetName = video ? video.fileName : videoId;
    if (firebaseConfigured && video) {
      const nextStatus = verdict || video.status;
      void saveFirestoreDocument('videos', videoId, {
        comments: [newComment, ...video.reviews].map(toFirestoreComment),
        status: statusToFirestore(nextStatus),
        reviewerName: currentUser.name.split(' ')[0],
        updatedAt: now.toISOString()
      }).catch(error => console.error('검수 의견을 저장하지 못했습니다:', error));
    }

    addAuditLog(
      verdict ? `VERDICT_${verdict}` : 'COMMENT_ADDED',
      targetName,
      `[${commentData.timestampFormatted}] ${commentData.content.slice(0, 40)}... (결과: ${verdict || '유지'})`
    );

    // Push notification
    const notifTitle = verdict === 'APPROVED' ? '동영상 검수 승인' : verdict === 'REJECTED' ? '동영상 검수 반려' : '새 검수 의견 등록';
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      type: verdict === 'APPROVED' ? 'approval' : verdict === 'REJECTED' ? 'rejection' : 'comment',
      title: notifTitle,
      body: `${currentUser.name} 님이 '${targetName}' 에 ${verdict ? `[${verdict}]` : '의견'}을 등록했습니다.`,
      timestamp: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      read: false,
      videoId
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const updateVideoStatus = (videoId: string, status: ReviewStatus, reviewerName?: string) => {
    const now = new Date();
    const formatted = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setVideos(prev =>
      prev.map(v => {
        if (v.id !== videoId) return v;
        return {
          ...v,
          status,
          reviewerName: reviewerName || currentUser.name.split(' ')[0],
          updatedAt: formatted
        };
      })
    );

    setSelectedVideo(current => {
      if (current && current.id === videoId) {
        return {
          ...current,
          status,
          reviewerName: reviewerName || currentUser.name.split(' ')[0],
          updatedAt: formatted
        };
      }
      return current;
    });

    const video = videos.find(v => v.id === videoId);
    if (firebaseConfigured && video) {
      void saveFirestoreDocument('videos', videoId, {
        status: statusToFirestore(status),
        reviewerName: reviewerName || currentUser.name.split(' ')[0],
        updatedAt: now.toISOString()
      }).catch(error => console.error('검수 상태를 저장하지 못했습니다:', error));
    }
    addAuditLog(`STATUS_${status}`, video ? video.fileName : videoId, `상태를 ${status}(으)로 변경`);
  };

  const deleteReviewComment = (videoId: string, commentId: string) => {
    const video = videos.find(v => v.id === videoId);
    const remainingReviews = video?.reviews.filter(review => review.id !== commentId) || [];
    setVideos(prev =>
      prev.map(v => {
        if (v.id !== videoId) return v;
        return {
          ...v,
          reviews: v.reviews.filter(r => r.id !== commentId)
        };
      })
    );
    setSelectedVideo(current => {
      if (current && current.id === videoId) {
        return {
          ...current,
          reviews: current.reviews.filter(r => r.id !== commentId)
        };
      }
      return current;
    });
    if (firebaseConfigured && video) {
      void saveFirestoreDocument('videos', videoId, {
        comments: remainingReviews.map(toFirestoreComment),
        updatedAt: new Date().toISOString()
      }).catch(error => console.error('검수 의견을 삭제하지 못했습니다:', error));
    }
    addAuditLog('DELETE_COMMENT', videoId, `검수 의견 ${commentId} 삭제`);
  };

  const updateVideoSubtitles = (videoId: string, subtitles: SubtitleEntry[]) => {
    setVideos(prev =>
      prev.map(v => {
        if (v.id !== videoId) return v;
        return {
          ...v,
          subtitles
        };
      })
    );
    setSelectedVideo(current => {
      if (current && current.id === videoId) {
        return {
          ...current,
          subtitles
        };
      }
      return current;
    });
    const video = videos.find(v => v.id === videoId);
    if (firebaseConfigured) {
      void saveFirestoreDocument('videos', videoId, {
        subtitles,
        subtitleVtt: { ko: subtitlesToVtt(subtitles, 'ko'), en: subtitlesToVtt(subtitles, 'en') },
        updatedAt: new Date().toISOString()
      }).catch(error => console.error('자막을 저장하지 못했습니다:', error));
    }
    addAuditLog('AI_SUBTITLES_UPDATED', video ? video.fileName : videoId, `AI 자막 ${subtitles.length}개 구간 갱신`);
  };

  const updateVideoAiAnalysis = (videoId: string, analysis: VideoAiAnalysis) => {
    setVideos(prev => prev.map(video => video.id === videoId ? { ...video, aiAnalysis: analysis } : video));
    setSelectedVideo(current => current?.id === videoId ? { ...current, aiAnalysis: analysis } : current);
    if (firebaseConfigured) {
      void saveFirestoreDocument('videos', videoId, {
        aiAnalysis: analysis,
        updatedAt: new Date().toISOString()
      }).catch(error => console.error('AI 분석 결과를 저장하지 못했습니다:', error));
    }
    const video = videos.find(item => item.id === videoId);
    addAuditLog('AI_ANALYSIS_UPDATED', video?.fileName || videoId, '실제 영상 기반 AI 분석 결과 저장');
  };

  const addNewVideo = (videoData: {
    weekId: number;
    weekTitle: string;
    sessionTitle: string;
    fileName: string;
    videoUrl: string;
    duration: number;
    fileSize: string;
    projectId?: string;
    lessonId?: string;
    s3Key?: string;
    mimeType?: string;
    sizeBytes?: number;
    id?: string;
    sourceType?: VideoSession['sourceType'];
    subtitles?: SubtitleEntry[];
  }): VideoSession => {
    const now = new Date();
    const formatted = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newVideo: VideoSession = {
      id: videoData.id || (firebaseConfigured ? newFirestoreId('videos') : `vid-${Date.now()}`),
      weekId: videoData.weekId,
      weekTitle: videoData.weekTitle,
      sessionTitle: videoData.sessionTitle,
      fileName: videoData.fileName,
      videoUrl: videoData.videoUrl,
      sourceType: videoData.sourceType || 'direct',
      projectId: videoData.projectId,
      lessonId: videoData.lessonId,
      s3Key: videoData.s3Key,
      mimeType: videoData.mimeType,
      sizeBytes: videoData.sizeBytes,
      duration: Math.max(0, videoData.duration || 0),
      fileSize: videoData.fileSize || '—',
      status: 'PENDING',
      uploadedAt: formatted,
      updatedAt: formatted,
      reviews: [],
      subtitles: videoData.subtitles || [],
      pipeline: {
        jobId: `video-${Date.now()}`,
        overallProgress: 0,
        currentStage: '검수 대기 중',
        stages: []
      }
    };

    setVideos(prev => [newVideo, ...prev]);
    if (firebaseConfigured) {
      void saveFirestoreDocument('videos', newVideo.id, {
        projectId: newVideo.projectId || '',
        lessonId: newVideo.lessonId || '',
        fileName: newVideo.fileName,
        kind: newVideo.s3Key ? 'file' : newVideo.sourceType === 'direct' ? 'external' : newVideo.sourceType,
        s3Key: newVideo.s3Key || null,
        url: newVideo.videoUrl || null,
        mimeType: newVideo.mimeType || null,
        size: newVideo.sizeBytes || null,
        duration: newVideo.duration,
        status: statusToFirestore(newVideo.status),
        comments: [],
        subtitles: newVideo.subtitles,
        subtitleVtt: { ko: subtitlesToVtt(newVideo.subtitles, 'ko'), en: subtitlesToVtt(newVideo.subtitles, 'en') },
        uploadedAt: now.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }).catch(error => console.error('영상을 저장하지 못했습니다:', error));
    }
    addAuditLog('VIDEO_UPLOAD', newVideo.fileName, `새 영상 등록 (${newVideo.fileSize}, ${newVideo.weekTitle}) - 검수 활성화`);

    return newVideo;
  };

  const deleteVideo = (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    setVideos(prev => prev.filter(v => v.id !== videoId));
    if (firebaseConfigured) {
      void deleteFirestoreDocument('videos', videoId).catch(error => console.error('영상 정보를 삭제하지 못했습니다:', error));
      if (video?.s3Key) void deleteStoredVideo(video.s3Key).catch(error => console.error('저장된 영상 원본을 삭제하지 못했습니다:', error));
    }
    if (selectedVideo?.id === videoId) setSelectedVideo(null);
    addAuditLog('VIDEO_DELETE', video ? video.fileName : videoId, '영상 파일 및 검수 데이터 영구 삭제');
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    if (currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, role: newRole }));
    }
    addAuditLog('USER_ROLE_UPDATE', userId, `사용자 역할을 ${newRole}(으)로 변경`);
  };

  const openShareModal = (v: VideoSession, timestamp: number = 0) => {
    setShareModalVideo(v);
    setShareModalTimestamp(timestamp);
  };

  const closeShareModal = () => {
    setShareModalVideo(null);
  };

  const addProject = (name: string, alias: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const cleanAlias = alias.trim().replace(/^\//, '');
    const newProj: ProjectItem = {
      id: firebaseConfigured ? newFirestoreId('projects') : `proj-${Date.now()}`,
      name: cleanName,
      alias: cleanAlias || `p${Math.floor(Math.random() * 900 + 100)}`,
      weekCount: 0,
      sessionCount: 0,
      videoCount: 0,
      sessions: []
    };
    setProjects(prev => [newProj, ...prev]);
    if (firebaseConfigured) {
      void saveFirestoreDocument('projects', newProj.id, {
        name: newProj.name,
        slug: newProj.alias,
        createdAt: new Date().toISOString()
      }).catch(error => console.error('프로젝트를 저장하지 못했습니다:', error));
    }
    addAuditLog('PROJECT_ADD', cleanName, `새 프로젝트 등록 (별칭: /${newProj.alias})`);
  };

  const deleteProject = (id: string) => {
    const found = projects.find(p => p.id === id);
    setProjects(prev => prev.filter(p => p.id !== id));
    if (firebaseConfigured && found) {
      const weekIds = (found.weeks || []).map(week => week.id);
      const lessonIds = [
        ...(found.sessions || []).map(session => session.id),
        ...(found.weeks || []).flatMap(week => week.sessions.map(session => session.id))
      ];
      const relatedVideos = videos.filter(video => video.projectId === id);
      void (async () => {
        try {
          await deleteFirestoreBatch([
            { collection: 'videos', ids: relatedVideos.map(video => video.id) },
            { collection: 'lessons', ids: Array.from(new Set(lessonIds)) },
            { collection: 'weeks', ids: weekIds },
            { collection: 'projects', ids: [id] }
          ]);
          await Promise.allSettled(relatedVideos.filter(video => video.s3Key).map(video => deleteStoredVideo(video.s3Key!)));
        } catch (error) {
          console.error('프로젝트를 완전히 삭제하지 못했습니다:', error);
        }
      })();
    }
    setVideos(prev => prev.filter(video => video.projectId !== id));
    if (selectedVideo?.projectId === id) setSelectedVideo(null);
    addAuditLog('PROJECT_DELETE', found ? found.name : id, '프로젝트 삭제');
  };

  const addWeeksToProject = (projectId: string, weekNames: string[]) => {
    if (!weekNames.length) return;
    const project = projects.find(item => item.id === projectId);
    if (!project) return;
    const currentWeeks = project.weeks || [];
    const knownNames = new Set(currentWeeks.map(week => week.title.trim()));
    const newWeeks = Array.from(new Set(weekNames.map(name => name.trim()).filter(Boolean)))
      .filter(name => !knownNames.has(name)).map((title, index) => ({
      id: firebaseConfigured ? newFirestoreId('weeks') : `week-${Date.now()}-${index}`,
      title,
      sessions: []
    }));
    const updatedWeeks = [...currentWeeks, ...newWeeks];
    setProjects(prev => prev.map(item => item.id === projectId ? { ...item, weeks: updatedWeeks, weekCount: updatedWeeks.length } : item));
    if (firebaseConfigured) {
      newWeeks.forEach((week, index) => void saveFirestoreDocument('weeks', week.id, {
        projectId,
        name: week.title,
        order: currentWeeks.length + index + 1,
        createdAt: new Date().toISOString()
      }).catch(error => console.error('주차를 저장하지 못했습니다:', error)));
    }
    addAuditLog('WEEKS_ADD', projectId, `${newWeeks.length}개 주차 등록`);
  };

  const addSessionsToProject = (projectId: string, weekId: string | null, sessionNames: string[]) => {
    if (!sessionNames.length) return;
    const project = projects.find(item => item.id === projectId);
    if (!project) return;
    const validNames = Array.from(new Set(sessionNames.map(name => name.trim()).filter(Boolean)));
    const newSessions: Array<{ id: string; title: string; weekTitle?: string; videoCount: number; videos: VideoSession[]; weekId: string | null }> = [];

    if (weekId && project.weeks) {
      const selectedWeek = project.weeks.find(week => week.id === weekId);
      if (!selectedWeek) return;
      const existingNames = new Set(selectedWeek.sessions.map(session => session.title.trim()));
      validNames.filter(name => !existingNames.has(name)).forEach((title, index) => {
        newSessions.push({
          id: firebaseConfigured ? newFirestoreId('lessons') : `lesson-${Date.now()}-${index}`,
          title,
          weekTitle: selectedWeek.title,
          videoCount: 0,
          videos: [],
          weekId
        });
      });
      const updatedWeeks = project.weeks.map(week => week.id === weekId
        ? { ...week, sessions: [...week.sessions, ...newSessions.map(({ weekId: _id, ...session }) => session)] }
        : week);
      const allSessions = [...(project.sessions || []), ...newSessions.map(({ weekId: _id, ...session }) => session)];
      setProjects(prev => prev.map(item => item.id === projectId ? {
        ...item,
        weeks: updatedWeeks,
        sessions: allSessions,
        sessionCount: allSessions.length
      } : item));
    } else {
      const existingNames = new Set((project.sessions || []).map(session => session.title.trim()));
      validNames.filter(name => !existingNames.has(name)).forEach((title, index) => {
        newSessions.push({
          id: firebaseConfigured ? newFirestoreId('lessons') : `lesson-${Date.now()}-${index}`,
          title,
          videoCount: 0,
          videos: [],
          weekId: null
        });
      });
      const updatedSessions = [...(project.sessions || []), ...newSessions.map(({ weekId: _id, ...session }) => session)];
      setProjects(prev => prev.map(item => item.id === projectId ? { ...item, sessions: updatedSessions, sessionCount: updatedSessions.length } : item));
    }

    if (firebaseConfigured) {
      newSessions.forEach((session, index) => void saveFirestoreDocument('lessons', session.id, {
        projectId,
        weekId: session.weekId,
        name: session.title,
        order: index + 1,
        createdAt: new Date().toISOString()
      }).catch(error => console.error('차시를 저장하지 못했습니다:', error)));
    }
    addAuditLog('SESSIONS_ADD', projectId, `${newSessions.length}개 차시 등록`);
  };

  // Sync projects to storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }, [projects]);

  return (
    <AppContext.Provider
      value={{
        videos,
        users,
        currentUser,
        switchRole,
        selectedVideo,
        setSelectedVideo,
        portalMode,
        setPortalMode,
        adminTab,
        setAdminTab,
        activeTab,
        setActiveTab,
        language,
        setLanguage,
        isOffline,
        setIsOffline,
        notifications,
        markNotificationAsRead,
        markAllNotificationsRead,
        auditLogs,
        addAuditLog,
        addReviewComment,
        updateVideoStatus,
        deleteReviewComment,
        updateVideoSubtitles,
        updateVideoAiAnalysis,
        addNewVideo,
        deleteVideo,
        updateUserRole,
        uploadModalOpen,
        setUploadModalOpen,
        shareModalVideo,
        shareModalTimestamp,
        openShareModal,
        closeShareModal,
        seekToTime,
        setSeekToTime,
        projects,
        addProject,
        deleteProject,
        addWeeksToProject,
        addSessionsToProject,
        userViewMode,
        setUserViewMode,
        currentProjectSlug,
        setCurrentProjectSlug,
        activeProject,
        isCloudSynced,
        syncWithBackend
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
