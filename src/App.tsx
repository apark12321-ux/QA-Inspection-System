import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { translations } from './utils/i18n';
import { VideoTable } from './components/VideoTable';
import { ReviewModal } from './components/ReviewModal';
import { UploadModal } from './components/UploadModal';
import { ShareModal } from './components/ShareModal';
import { ProjectRegistrationView } from './components/ProjectRegistrationView';
import { ProposalSampleView } from './components/ProposalSampleView';
import { ProposalClientView } from './components/ProposalClientView';
import { AdminLayout } from './components/AdminLayout';
import { WhomediaLogo } from './components/WhomediaLogo';
import {
  Bell,
  Check,
  ClipboardCheck,
  Film,
  FolderKanban,
  Globe,
  LayoutDashboard,
  Sparkles,
  Upload,
  Wifi,
  WifiOff,
  X
} from 'lucide-react';

const RootContent: React.FC = () => {
  const {
    portalMode,
    setPortalMode,
    userViewMode,
    setUserViewMode,
    setUploadModalOpen,
    notifications,
    markAllNotificationsRead,
    language,
    setLanguage,
    isCloudSynced,
    isOffline,
    projects,
    videos,
    selectedVideo,
    setSelectedVideo,
    activeProject,
    currentProjectSlug,
    setCurrentProjectSlug,
    proposalSamples,
    isAdminMode,
    setIsAdminMode
  } = useApp();

  const [notifOpen, setNotifOpen] = useState(false);
  const [shareLoadTimedOut, setShareLoadTimedOut] = useState(false);
  const [shareHadOpened, setShareHadOpened] = useState(false);
  const t = translations[language];
  const unreadCount = notifications.filter(item => !item.read).length;
  const currentProject =
    activeProject ||
    projects.find(p => p.alias.toLowerCase() === (currentProjectSlug || 'khcu').toLowerCase()) ||
    projects[0];
  const selectedAlias = currentProject?.alias || '';

  const sharedVideoId = new URLSearchParams(window.location.search).get('v');
  const sharedVideo = sharedVideoId ? videos.find(video => video.id === sharedVideoId) : undefined;

  useEffect(() => setShareHadOpened(false), [sharedVideoId]);
  useEffect(() => {
    if (sharedVideoId && selectedVideo?.id === sharedVideoId) setShareHadOpened(true);
  }, [selectedVideo?.id, sharedVideoId]);

  useEffect(() => {
    if (!sharedVideoId || sharedVideo || isCloudSynced) {
      setShareLoadTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setShareLoadTimedOut(true), 12000);
    return () => window.clearTimeout(timer);
  }, [isCloudSynced, sharedVideo, sharedVideoId]);

  useEffect(() => {
    if (!isAdminMode && userViewMode !== 'review') {
      setUserViewMode('review');
    }
  }, [isAdminMode, userViewMode, setUserViewMode]);

  if (sharedVideoId) {
    return (
      <div className="share-only-shell">
        <header className="share-only-header">
          <WhomediaLogo size="md" subtitle={language === 'ko' ? '동영상 품질 검수' : 'VIDEO REVIEW'} />
          <span>{language === 'ko' ? '영상 전용 검수 링크' : 'Shared video review link'}</span>
        </header>
        {selectedVideo?.id === sharedVideoId ? (
          <ReviewModal />
        ) : (
          <main className="share-only-message">
            {sharedVideo && !shareHadOpened ? (
              <>
                <div className="share-only-spinner" />
                <h1>{language === 'ko' ? '공유된 강의 영상을 여는 중입니다.' : 'Opening the shared video.'}</h1>
                <p>{sharedVideo.fileName}</p>
              </>
            ) : sharedVideo ? (
              <>
                <div className="share-only-icon"><Film size={22} /></div>
                <h1>{language === 'ko' ? '공유된 강의 검수가 닫혔습니다.' : 'Shared review is closed.'}</h1>
                <p>{sharedVideo.fileName}</p>
                <button type="button" className="button button-primary" onClick={() => setSelectedVideo(sharedVideo)}>
                  {language === 'ko' ? '영상 다시 열기' : 'Open video again'}
                </button>
              </>
            ) : isCloudSynced || shareLoadTimedOut ? (
              <>
                <div className="share-only-icon unavailable"><X size={22} /></div>
                <h1>{language === 'ko' ? '공유된 영상을 찾을 수 없습니다.' : 'This shared video is unavailable.'}</h1>
                <p>{language === 'ko' ? '링크가 만료되었거나 영상 접근 권한이 변경되었습니다.' : 'The link may have expired or access may have changed.'}</p>
              </>
            ) : (
              <>
                <div className="share-only-spinner" />
                <h1>{language === 'ko' ? '공유된 영상 정보를 불러오는 중입니다.' : 'Loading the shared video.'}</h1>
                <p>{language === 'ko' ? '영상 하나만 열기 위해 링크의 대상을 확인하고 있습니다.' : 'Finding the single video attached to this link.'}</p>
              </>
            )}
          </main>
        )}
        <ShareModal />
      </div>
    );
  }

  const openReview = () => {
    setPortalMode('user');
    setUserViewMode('review');
  };
  const openProposal = () => {
    setPortalMode('user');
    setUserViewMode('proposal');
  };
  const openRegistration = () => {
    setPortalMode('user');
    setUserViewMode('registration');
  };
  const openAdmin = () => setPortalMode('admin');

  const projectVideoCount = (projectId: string) => videos.filter(video => video.projectId === projectId).length;

  return (
    <>
      {portalMode === 'admin' ? (
        <AdminLayout />
      ) : (
        <div className="app-shell">
          <aside className="workspace-sidebar">
            <div className="sidebar-brand">
              <WhomediaLogo
                size="md"
                isDarkTheme
                subtitle={language === 'ko' ? '동영상 품질 검수 플랫폼' : 'VIDEO QUALITY WORKSPACE'}
              />
            </div>

            <div className="sidebar-scroll">
              <div className="sidebar-section">
                <div className="sidebar-section-label">{language === 'ko' ? '동영상 검수' : 'CONTENT REVIEW'}</div>
                <button
                  type="button"
                  onClick={openReview}
                  className={'sidebar-link' + (userViewMode === 'review' ? ' active' : '')}
                >
                  <ClipboardCheck size={17} />
                  <span>{language === 'ko' ? '동영상 강의 검수' : 'Video review'}</span>
                  <span className="sidebar-link-count">
                    {currentProject ? projectVideoCount(currentProject.id) : videos.filter(video => video.status === 'PENDING').length}
                  </span>
                </button>

                {/* 관리자 전용 메뉴: 일반 접속 및 제출 링크에서는 일체 비노출 */}
                {isAdminMode && (
                  <>
                    <button
                      type="button"
                      onClick={openProposal}
                      className={'sidebar-link' + (userViewMode === 'proposal' ? ' active' : '')}
                    >
                      <Sparkles size={17} />
                      <span>{language === 'ko' ? '제안샘플 사이트' : 'Proposal samples'}</span>
                      <span className="sidebar-link-count">{proposalSamples.length}</span>
                    </button>
                    <button
                      type="button"
                      onClick={openRegistration}
                      className={'sidebar-link' + (userViewMode === 'registration' ? ' active' : '')}
                    >
                      <FolderKanban size={17} />
                      <span>{language === 'ko' ? '프로젝트 관리' : 'Projects'}</span>
                    </button>
                    <button type="button" onClick={openAdmin} className="sidebar-link">
                      <LayoutDashboard size={17} />
                      <span>{language === 'ko' ? '운영 콘솔' : 'Operations'}</span>
                      <span className="sidebar-link-arrow">↗</span>
                    </button>
                  </>
                )}
              </div>

              <div className="sidebar-section project-nav-section">
                <div className="sidebar-section-heading">
                  <div className="sidebar-section-label">{language === 'ko' ? '내 프로젝트' : 'MY PROJECTS'}</div>
                  <span className="sidebar-section-total">{currentProject ? 1 : 0}</span>
                </div>
                <div className="project-nav-list">
                  {currentProject && (
                    <button
                      type="button"
                      key={currentProject.id}
                      className="project-nav-item active"
                      title={currentProject.name}
                    >
                      <span className="project-nav-dot" />
                      <span className="project-nav-name">{currentProject.name}</span>
                      {projectVideoCount(currentProject.id) > 0 && (
                        <span className="project-nav-count">{projectVideoCount(currentProject.id)}</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="sidebar-bottom">
              <div className="sidebar-sync">
                <span className={'sync-indicator' + ((isOffline || !isCloudSynced) ? ' offline' : '')} />
                <div>
                  <strong>{isOffline || !isCloudSynced ? (language === 'ko' ? '오프라인 저장' : 'Offline mode') : (language === 'ko' ? '데이터 동기화됨' : 'All changes synced')}</strong>
                  <span>{isOffline ? (language === 'ko' ? '연결을 확인해 주세요' : 'Check your connection') : (language === 'ko' ? '이 기기에 자동 저장' : 'Saved on this device')}</span>
                </div>
                {isOffline || !isCloudSynced ? <WifiOff size={15} /> : <Wifi size={15} />}
              </div>
            </div>
          </aside>

          <div className="workspace-main">
            <header className="workspace-topbar">
              <div className="topbar-breadcrumb">
                <span>{language === 'ko' ? '동영상 강의 검수' : 'Video Review'}</span>
                <span className="breadcrumb-separator">/</span>
                <strong>
                  {userViewMode === 'registration'
                    ? (language === 'ko' ? '프로젝트 관리' : 'Project management')
                    : userViewMode === 'proposal'
                    ? (language === 'ko' ? '제안샘플 사이트' : 'Proposal samples')
                    : (currentProject?.name ? `${currentProject.name}` : (language === 'ko' ? '동영상 강의 검수' : 'Video review'))}
                </strong>
              </div>

              <div className="topbar-actions">
                {isAdminMode && userViewMode === 'review' && (
                  <button type="button" className="button button-primary topbar-upload" onClick={() => setUploadModalOpen(true)}>
                    <Upload size={16} />
                    <span>{t.uploadBtn}</span>
                  </button>
                )}

                <div className="topbar-popover-wrap">
                  <button
                    type="button"
                    className="icon-button notification-trigger"
                    onClick={() => setNotifOpen(!notifOpen)}
                    aria-label={language === 'ko' ? '알림' : 'Notifications'}
                    aria-expanded={notifOpen}
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && <span className="notification-dot" />}
                  </button>
                  {notifOpen && (
                    <div className="topbar-popover notification-popover">
                      <div className="popover-heading">
                        <div>
                          <strong>{language === 'ko' ? '알림' : 'Notifications'}</strong>
                          <span>{language === 'ko' ? '검수 작업 업데이트' : 'Review updates'}</span>
                        </div>
                        <button type="button" className="popover-close" onClick={() => setNotifOpen(false)} aria-label="Close"><X size={16} /></button>
                      </div>
                      <div className="notification-list">
                        {notifications.length === 0 ? (
                          <div className="popover-empty">{language === 'ko' ? '새로운 알림이 없습니다.' : 'No notifications yet.'}</div>
                        ) : notifications.slice(0, 6).map(item => (
                          <div key={item.id} className={'notification-item' + (!item.read ? ' unread' : '')}>
                            <span className={'notification-mark ' + item.type} />
                            <div>
                              <strong>{item.title}</strong>
                              <p>{item.body}</p>
                              <time>{item.timestamp}</time>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="popover-footer-action"
                        onClick={() => {
                          markAllNotificationsRead();
                          setNotifOpen(false);
                        }}
                      >
                        <Check size={15} />
                        {language === 'ko' ? '모두 읽음으로 표시' : 'Mark all as read'}
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="language-button"
                  onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
                  title={language === 'ko' ? 'Switch to English' : '한국어로 전환'}
                >
                  <Globe size={15} />
                  {language.toUpperCase()}
                </button>
              </div>
            </header>

            <main className="workspace-content">
              {userViewMode === 'registration' ? (
                <ProjectRegistrationView />
              ) : userViewMode === 'proposal' ? (
                <ProposalSampleView />
              ) : (
                <VideoTable />
              )}
            </main>

            <footer className="workspace-footer">
              <span>WHOMEDIA <span className="footer-dot">·</span> {language === 'ko' ? '영상 품질 검수 워크스페이스' : 'Video quality review workspace'}</span>
              <div className="flex items-center gap-3">
                <span>{language === 'ko' ? '검수 의견은 작업 이력에 자동 기록됩니다.' : 'Review actions are saved to the activity log.'}</span>
                <button
                  type="button"
                  onClick={() => setIsAdminMode(!isAdminMode)}
                  className="text-[11px] text-slate-400/80 hover:text-slate-600 transition-colors cursor-pointer"
                  title="관리자 설정"
                >
                  {isAdminMode ? '· 관리자 해제' : '· 관리자'}
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      <ReviewModal />
      <UploadModal />
      <ShareModal />
    </>
  );
};

export default function App() {
  return (
    <AppProvider>
      <RootContent />
    </AppProvider>
  );
}
