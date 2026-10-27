import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../utils/i18n';
import { UserRole } from '../types';
import {
  Play,
  Upload,
  Globe,
  Bell,
  Wifi,
  WifiOff,
  Shield,
  UserCheck,
  Film,
  Eye,
  CheckCheck,
  ChevronDown,
  LayoutDashboard,
  ArrowRight
} from 'lucide-react';

export const UserHeader: React.FC = () => {
  const {
    currentUser,
    switchRole,
    language,
    setLanguage,
    isOffline,
    setIsOffline,
    notifications,
    markNotificationAsRead,
    markAllNotificationsRead,
    setUploadModalOpen,
    setSelectedVideo,
    videos,
    setPortalMode
  } = useApp();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const t = translations[language];
  const unreadCount = notifications.filter(n => !n.read).length;

  const roleLabels: Record<UserRole, { label: string; icon: React.ReactNode; color: string; desc: string }> = {
    REVIEWER: {
      label: t.roleReviewer,
      icon: <UserCheck className="w-3.5 h-3.5" />,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      desc: '영상 검수, 승인/반려 결정, 타임코드 의견 등록, AI 자막'
    },
    CREATOR: {
      label: t.roleCreator,
      icon: <Film className="w-3.5 h-3.5" />,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      desc: '영상 업로드, 피드백 확인, 수정본 등록'
    },
    VIEWER: {
      label: t.roleViewer,
      icon: <Eye className="w-3.5 h-3.5" />,
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      desc: '검수 내역 열람 및 재생 전용 (읽기 전용)'
    },
    ADMIN: {
      label: t.roleAdmin,
      icon: <Shield className="w-3.5 h-3.5" />,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      desc: '모든 관리 권한 (대시보드, 파이프라인, 감사로그, 사용자 설정)'
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Authentic Brand matching reference screenshot */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">
                {t.appTitle}
              </span>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline-block">
                교육 영상 품질검수 포털 (QA Portal)
              </span>
            </div>
          </div>

          {/* Zone 2: Focused Clean Space (Zero Admin clutter for reviewers!) */}
          <div className="hidden md:flex items-center text-xs font-semibold text-slate-500">
            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full font-medium">
              차시 검수 워크스페이스
            </span>
          </div>

          {/* Zone 3: Essential Controls (Role, Admin Transition, Language, Notifications, Upload) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Direct Admin Console Link Button */}
            <button
              onClick={() => {
                if (currentUser.role !== 'ADMIN') {
                  switchRole('ADMIN');
                }
                setPortalMode('admin');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all shadow-xs"
              title="관리자 전용 대시보드 및 파이프라인 콘솔로 이동합니다."
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">관리자 콘솔</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>

            {/* Quick Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  roleLabels[currentUser.role].color
                } hover:opacity-90`}
                title="역할 전환"
              >
                {roleLabels[currentUser.role].icon}
                <span className="font-semibold">{roleLabels[currentUser.role].label}</span>
                <span className="hidden md:inline text-[11px] opacity-75">({currentUser.name.split(' ')[0]})</span>
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
              </button>

              {roleMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onMouseLeave={() => setRoleMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      역할 빠른 전환 (시연용)
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      현재 사용자: <strong className="text-slate-900">{currentUser.name}</strong>
                    </p>
                  </div>
                  <div className="p-1.5 space-y-1">
                    {(Object.keys(roleLabels) as UserRole[]).map(role => (
                      <button
                        key={role}
                        onClick={() => {
                          switchRole(role);
                          setRoleMenuOpen(false);
                        }}
                        className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors ${
                          currentUser.role === role ? 'bg-blue-50/80 text-blue-900' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="mt-0.5 text-slate-700">{roleLabels[role].icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">{roleLabels[role].label}</span>
                            {currentUser.role === role && (
                              <span className="text-[10px] font-semibold text-blue-600 bg-blue-100/60 px-1.5 py-0.2 rounded">
                                활성
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                            {roleLabels[role].desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Offline Mode Indicator */}
            <button
              onClick={() => setIsOffline(!isOffline)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                isOffline
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
              title="오프라인 캐시 모드 토글"
            >
              {isOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">오프라인</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">온라인</span>
                </>
              )}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                title="알림 센터"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in"
                  onMouseLeave={() => setNotifOpen(false)}
                >
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800">알림 센터 ({notifications.length})</span>
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5"
                    >
                      <CheckCheck className="w-3 h-3" /> 모두 읽음
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-xs text-center text-slate-400">새로운 알림이 없습니다.</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationAsRead(n.id);
                            if (n.videoId) {
                              const found = videos.find(v => v.id === n.videoId);
                              if (found) setSelectedVideo(found);
                            }
                            setNotifOpen(false);
                          }}
                          className={`p-3 text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                            !n.read ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-900">{n.title}</span>
                            <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                            {n.body}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
              className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              title="다국어 전환"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="font-bold">{language.toUpperCase()}</span>
            </button>

            {/* Video Upload CTA */}
            {currentUser.role !== 'VIEWER' && (
              <button
                onClick={() => setUploadModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.uploadBtn}</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
