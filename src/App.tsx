import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { translations } from './utils/i18n';
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

  const t = translations[language];

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white">
      
      {/* ================= GLOBAL TOP NAVIGATION BAR ================= */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left: WHOMEDIA Brand Logo */}
          <div className="flex items-center gap-3">
            <WhomediaLogo
              size="md"
              subtitle={
                userViewMode === 'registration'
                  ? '관리자 콘솔 · 프로젝트 및 차시 등록 관리'
                  : t.reviewPortalSub
              }
            />
          </div>

          {/* Right: Controls & Mode Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* If in Registration Mode, show clear 'Back to Review' button */}
            {userViewMode === 'registration' ? (
              <button
                type="button"
                onClick={() => setUserViewMode('review')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-bold shadow-2xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.backToReviewBtn}</span>
              </button>
            ) : (
              /* Review Mode: Client & Reviewer clean view */
              <div className="flex items-center gap-2">
                {/* Upload Button */}
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(true)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t.uploadBtn}</span>
                </button>

                {/* Subtle Discrete Admin Mode Entry on Top Right */}
                <button
                  type="button"
                  onClick={() => setUserViewMode('registration')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                  title="관리자 등록 콘솔로 이동"
                >
                  <FolderKanban className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t.adminModeBtn}</span>
                </button>
              </div>
            )}

            {/* User Role Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
                title="역할 변경"
              >
                {roles.find(r => r.role === currentUser.role)?.icon}
                <span className="hidden sm:inline">{currentUser.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    역할 전환
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
              <span>{t.onlineBadge}</span>
            </div>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="알림"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800">검수 알림</span>
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
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              title="언어 전환 / Switch Language"
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

      {/* ================= CLEAN FOOTER (NO S3 / TRAFFIC FLUFF) ================= */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 tracking-tight">
              {t.reviewPortalHeader}
            </span>
            <span aria-hidden="true">·</span>
            <span>{t.reviewPortalSub}</span>
          </div>
          <div className="text-[11px] text-slate-400">
            © 온라인 동영상 강의 검수 포털. All rights reserved.
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
