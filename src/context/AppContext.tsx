import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  VideoSession,
  UserAccount,
  UserRole,
  ReviewStatus,
  ReviewComment,
  SubtitleEntry,
  AuditLog,
  NotificationItem,
  ProjectItem
} from '../types';
import {
  INITIAL_VIDEOS,
  INITIAL_USERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS
} from '../data/initialData';
import { INITIAL_PROJECTS } from '../data/projectData';

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
  addNewVideo: (
    videoData: {
      weekId: number;
      weekTitle: string;
      sessionTitle: string;
      fileName: string;
      videoUrl: string;
      duration: number;
      fileSize: string;
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
  triggerSimulatedPipeline: (videoId: string) => void;
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved projects or initial
  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PROJECTS;
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
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VIDEOS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_VIDEOS;
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    try {
      const savedRole = localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE) as UserRole;
      if (savedRole) {
        const found = INITIAL_USERS.find(u => u.role === savedRole);
        if (found) return found;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_USERS[1]; // Default to Reviewer (이영희) for instant QA inspection testing
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (saved) return JSON.parse(saved);
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
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);
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

  const syncWithBackend = async () => {
    try {
      const res = await fetch('/api/sync');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.projects) && data.projects.length > 0) {
          setProjects(data.projects);
        } else {
          await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projects, videos })
          });
        }
        if (Array.isArray(data.videos) && data.videos.length > 0) {
          setVideos(data.videos);
        }
        setIsCloudSynced(true);
      }
    } catch (err) {
      console.warn('Backend sync note (using local cache):', err);
      setIsCloudSynced(false);
    }
  };

  useEffect(() => {
    syncWithBackend();
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

  // Handle URL deep linking (e.g. ?v=vid-02&t=192)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const videoId = params.get('v');
    const timeParam = params.get('t');

    if (videoId) {
      const found = videos.find(v => v.id === videoId || v.fileName.includes(videoId));
      if (found) {
        setSelectedVideo(found);
        if (timeParam) {
          const t = parseInt(timeParam, 10);
          if (!isNaN(t)) {
            setSeekToTime(t);
          }
        }
      }
    }

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
    const targetUser = users.find(u => u.role === role) || {
      id: `user_${role.toLowerCase()}`,
      name: role === 'ADMIN' ? '김관리 (Admin)' : role === 'REVIEWER' ? '이영희 (Reviewer)' : role === 'CREATOR' ? '박제작 (Creator)' : '최참관 (Viewer)',
      email: `${role.toLowerCase()}@corporate-edu.com`,
      role,
      department: '운영팀',
      status: 'active',
      lastActive: '방금 전'
    };
    setCurrentUser(targetUser);
    localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, role);

    addAuditLog('ROLE_SWITCH', 'Auth', `역할을 [${role}] (으)로 전환하였습니다.`);
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
      createdAt: formatted
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
    addAuditLog(`STATUS_${status}`, video ? video.fileName : videoId, `상태를 ${status}(으)로 변경`);
  };

  const deleteReviewComment = (videoId: string, commentId: string) => {
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
    addAuditLog('AI_SUBTITLES_UPDATED', video ? video.fileName : videoId, `AI 자막 ${subtitles.length}개 구간 갱신`);
  };

  const addNewVideo = (videoData: {
    weekId: number;
    weekTitle: string;
    sessionTitle: string;
    fileName: string;
    videoUrl: string;
    duration: number;
    fileSize: string;
  }): VideoSession => {
    const now = new Date();
    const formatted = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newVideo: VideoSession = {
      id: `vid-${Date.now()}`,
      weekId: videoData.weekId,
      weekTitle: videoData.weekTitle,
      sessionTitle: videoData.sessionTitle,
      fileName: videoData.fileName,
      videoUrl: videoData.videoUrl,
      duration: videoData.duration || 600,
      fileSize: videoData.fileSize || '150 MB',
      status: 'PENDING', // Immediately active for inspection
      uploadedAt: formatted,
      updatedAt: formatted,
      reviews: [],
      subtitles: [],
      pipeline: {
        jobId: `job-aws-${Math.floor(Math.random() * 900 + 100)}`,
        overallProgress: 100,
        currentStage: '검수 대기 중 (인스펙션 활성화됨)',
        stages: [
          { name: 'S3 Multipart Upload', description: '파일 전송 완료', status: 'done', progress: 100, timestamp: '방금' },
          { name: 'AWS MediaConvert', description: '1080p H.264 인코딩 완료', status: 'done', progress: 100, timestamp: '방금' },
          { name: 'Gemini AI Subtitles', description: '음성 추출 및 자막 준비 완료', status: 'done', progress: 100, timestamp: '방금' },
          { name: 'DynamoDB Indexing', description: '검수 대기열 등록 완료', status: 'done', progress: 100, timestamp: '방금' }
        ]
      }
    };

    setVideos(prev => [newVideo, ...prev]);
    addAuditLog('VIDEO_UPLOAD', newVideo.fileName, `새 영상 등록 (${newVideo.fileSize}, ${newVideo.weekTitle}) - 검수 활성화`);

    return newVideo;
  };

  const deleteVideo = (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    setVideos(prev => prev.filter(v => v.id !== videoId));
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

  const triggerSimulatedPipeline = (videoId: string) => {
    setVideos(prev =>
      prev.map(v => {
        if (v.id !== videoId) return v;
        return {
          ...v,
          status: 'PROCESSING',
          pipeline: {
            ...v.pipeline,
            overallProgress: 15,
            currentStage: 'S3 Event 수신 및 Lambda 호출 중',
            stages: [
              { name: 'S3 Multipart Upload', description: '재검증 완료', status: 'done', progress: 100 },
              { name: 'AWS MediaConvert', description: '프로파일 재인코딩 시작', status: 'active', progress: 30 },
              { name: 'Gemini AI Subtitles', description: '대기 중', status: 'waiting', progress: 0 },
              { name: 'DynamoDB Indexing', description: '대기 중', status: 'waiting', progress: 0 }
            ]
          }
        };
      })
    );

    addAuditLog('PIPELINE_RETRIGGER', videoId, 'AWS 미디어 파이프라인 수동 재실행');

    setTimeout(() => {
      setVideos(prev =>
        prev.map(v => {
          if (v.id !== videoId) return v;
          return {
            ...v,
            status: 'PENDING',
            pipeline: {
              ...v.pipeline,
              overallProgress: 100,
              currentStage: '인코딩 완료 (검수 대기)',
              stages: v.pipeline.stages.map(s => ({ ...s, status: 'done', progress: 100 }))
            }
          };
        })
      );
    }, 3000);
  };

  const addProject = (name: string, alias: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const cleanAlias = alias.trim().replace(/^\//, '');
    const newProj: ProjectItem = {
      id: `proj-${Date.now()}`,
      name: cleanName,
      alias: cleanAlias || `p${Math.floor(Math.random() * 900 + 100)}`,
      weekCount: 0,
      sessionCount: 0,
      videoCount: 0,
      sessions: []
    };
    setProjects(prev => [newProj, ...prev]);
    addAuditLog('PROJECT_ADD', cleanName, `새 프로젝트 등록 (별칭: /${newProj.alias})`);
  };

  const deleteProject = (id: string) => {
    const found = projects.find(p => p.id === id);
    setProjects(prev => prev.filter(p => p.id !== id));
    addAuditLog('PROJECT_DELETE', found ? found.name : id, '프로젝트 삭제');
  };

  const addWeeksToProject = (projectId: string, weekNames: string[]) => {
    if (!weekNames.length) return;
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        const currentWeeks = p.weeks ? [...p.weeks] : [];
        const existingTitles = new Set(currentWeeks.map(w => w.title.trim()));
        const newWeeks = weekNames
          .map(w => w.trim())
          .filter(w => w && !existingTitles.has(w))
          .map(title => ({
            id: `week-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title,
            sessions: []
          }));
        const updatedWeeks = [...currentWeeks, ...newWeeks];
        return {
          ...p,
          weeks: updatedWeeks,
          weekCount: updatedWeeks.length
        };
      })
    );
    addAuditLog('WEEKS_ADD', projectId, `${weekNames.length}개 주차 일괄 등록`);
  };

  const addSessionsToProject = (projectId: string, weekId: string | null, sessionNames: string[]) => {
    if (!sessionNames.length) return;
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        const validNames = sessionNames.map(s => s.trim()).filter(Boolean);
        
        if (weekId && p.weeks) {
          const updatedWeeks = p.weeks.map(w => {
            if (w.id !== weekId && weekId !== 'all') return w;
            const existingTitles = new Set(w.sessions.map(s => s.title.trim()));
            const newSessions = validNames
              .filter(s => !existingTitles.has(s))
              .map(title => ({
                id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                title,
                weekTitle: w.title,
                videoCount: 0,
                videos: []
              }));
            return {
              ...w,
              sessions: [...w.sessions, ...newSessions]
            };
          });
          const totalSessions = updatedWeeks.reduce((acc, w) => acc + w.sessions.length, 0);
          return {
            ...p,
            weeks: updatedWeeks,
            sessionCount: totalSessions
          };
        } else {
          const currentSessions = p.sessions ? [...p.sessions] : [];
          const existingTitles = new Set(currentSessions.map(s => s.title.trim()));
          const newSessions = validNames
            .filter(s => !existingTitles.has(s))
            .map(title => ({
              id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              title,
              videoCount: 0,
              videos: []
            }));
          const updatedSessions = [...currentSessions, ...newSessions];
          return {
            ...p,
            sessions: updatedSessions,
            sessionCount: updatedSessions.length
          };
        }
      })
    );
    addAuditLog('SESSIONS_ADD', projectId, `${sessionNames.length}개 차시 일괄 등록`);
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
        addNewVideo,
        deleteVideo,
        updateUserRole,
        uploadModalOpen,
        setUploadModalOpen,
        shareModalVideo,
        shareModalTimestamp,
        openShareModal,
        closeShareModal,
        triggerSimulatedPipeline,
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
