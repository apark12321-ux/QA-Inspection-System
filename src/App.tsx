import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { VideoTable } from './components/VideoTable';
import { ReviewModal } from './components/ReviewModal';
import { UploadModal } from './components/UploadModal';
import { ShareModal } from './components/ShareModal';
import { ProjectRegistrationView } from './components/ProjectRegistrationView';
import { WhomediaLogo } from './components/WhomediaLogo';
import { UserRole } from './types';
import {
  Bell,
  Globe,
  Upload,
  CheckCircle2,
  FolderKanban,
  UserCheck,
  Film,
  Eye,
  Shield,
  ChevronDown,
  Cloud,
  Check
} from 'lucide-react';

const RootContent: React.FC = () => {
  const {
    userViewMode,
    setUserViewMode,
    setUploadModalOpen,
    notifications,
    markAllNotificationsRead,
    language,
    setLanguage,
    currentUser,
    switchRole,
    isCloudSynced
  } = useApp();

  const [notifOpen, setNotifOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const roles: { role: UserRole; name: string; icon: React.ReactNode }[] = [
    { role: 'REVIEWER', name: '이영희 (Reviewer)', icon: <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> },
    { role: 'CREATOR', name: '박제작 (Creator)', icon: <Film className="w-3.5 h-3.5 text-amber-600" /> },
    { role: 'ADMIN', name: '김관리 (Admin)', icon: <Shield className="w-3.5 h-3.5 text-blue-600" /> },
    { role: 'VIEWER', name: '최참관 (Viewer)', icon: <Eye className="w-3.5 h-3.5 text-slate-500" /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white">
      
      {/* ================= GLOBAL TOP NAVIGATION BAR (MATCHING SCREENSHOT 2) ================= */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left: WHOMEDIA Brand Logo & Subtitle */}
          <div className="flex items-center gap-4">
            <WhomediaLogo
              size="md"
              subtitle={
                userViewMode === 'registration'
                  ? '검수요청 등록자 페이지 · 프로젝트 / 차시 / 동영상 등록'
                  : '검수자 페이지 · 프로젝트 / 차시 / 동영상 검수'
              }
            />
          </div>

          {/* Right: Navigation Tabs + Role Selector + Quick Upload */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Main Navigation Tabs: [검수하기] | [검수요청 등록] (Matching Screenshot 2) */}
            <nav className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setUserViewMode('review')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  userViewMode === 'review'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>검수하기</span>
              </button>

              <button
                type="button"
                onClick={() => setUserViewMode('registration')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  userViewMode === 'registration'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>검수요청 등록</span>
              </button>
            </nav>

            {/* Quick S3 Upload Button */}
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>영상 업로드</span>
            </button>

            {/* User Role Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
                title="역할 변경"
              >
                {roles.find(r => r.role === currentUser.role)?.icon}
                <span className="hidden sm:inline">{currentUser.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    역할 변경 (실시간 전환)
                  </div>
                  {roles.map(r => (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => {
                        switchRole(r.role);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-left transition-colors ${
                        currentUser.role === r.role
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {r.icon}
                        <span>{r.name}</span>
                      </div>
                      {currentUser.role === r.role && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cloud Sync Status Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>실시간 연동</span>
            </div>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                title="검수 알림"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800">최근 검수 알림</span>
                    <button
                      type="button"
                      onClick={() => {
                        markAllNotificationsRead();
                        setNotifOpen(false);
                      }}
                      className="text-[10px] text-blue-600 hover:underline"
                    >
                      모두 읽음
                    </button>
                  </div>
                  <div className="py-2 space-y-2 max-h-60 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className="text-xs p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80">
                        <div className="font-bold text-slate-900">{n.title}</div>
                        <div className="text-slate-600 text-[11px] mt-0.5">{n.body}</div>
                        <div className="text-slate-400 text-[10px] mt-1">{n.timestamp}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{language === 'ko' ? 'KO' : 'EN'}</span>
            </button>

          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT WORKSPACE ================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {userViewMode === 'registration' ? (
          <ProjectRegistrationView />
        ) : (
          <VideoTable />
        )}
      </main>

      {/* ================= CLEAN FOOTER ================= */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">
              <span className="text-red-600">WHO</span><span className="text-black">MEDIA</span> (주)후미디어
            </span>
            <span>·</span>
            <span>동영상 검수 및 프로젝트 통합 관리 시스템</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>AWS S3 (edutem-video-review) 스토리지 연동</span>
            <span>·</span>
            <span>서버 트래픽 비용 0원 외부 호스팅 지원 (유튜브/비메오/구글 드라이브)</span>
          </div>
        </div>
      </footer>

      {/* ================= GLOBAL MODALS ================= */}
      <ReviewModal />
      <UploadModal />
      <ShareModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <RootContent />
    </AppProvider>
  );
}
