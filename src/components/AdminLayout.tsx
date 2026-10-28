import React from 'react';
import { useApp } from '../context/AppContext';
import { AdminDashboard } from './AdminDashboard';
import { PipelineMonitor } from './PipelineMonitor';
import { UserManagement } from './UserManagement';
import { AuditLogView } from './AuditLogView';
import { AwsArchitectureView } from './AwsArchitectureView';
import { MediaStorageManager } from './MediaStorageManager';
import {
  BarChart3,
  HardDrive,
  Activity,
  Shield,
  FileText,
  Cloud,
  ArrowLeft,
  ShieldAlert,
  Globe,
  Bell,
  CheckCircle2,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const {
    adminTab,
    setAdminTab,
    setPortalMode,
    currentUser,
    switchRole,
    language,
    setLanguage,
    notifications
  } = useApp();

  const unreadCount = notifications.filter(n => !n.read).length;

  const adminNavItems: {
    id: typeof adminTab;
    label: string;
    icon: React.ReactNode;
    desc: string;
  }[] = [
    {
      id: 'dashboard',
      label: '관리자 대시보드',
      icon: <BarChart3 className="w-4 h-4" />,
      desc: '검수율, 승인/반려 현황 및 종합 지표'
    },
    {
      id: 'storage',
      label: '영상 저장소 & 서버 관리',
      icon: <HardDrive className="w-4 h-4" />,
      desc: 'S3 버킷, CloudFront CDN 및 비디오 자산'
    },
    {
      id: 'pipeline',
      label: '처리 파이프라인',
      icon: <Activity className="w-4 h-4" />,
      desc: 'AWS MediaConvert & Gemini AI 실시간 모니터링'
    },
    {
      id: 'rbac',
      label: '권한 및 사용자 관리',
      icon: <Shield className="w-4 h-4" />,
      desc: '역할별 접근 권한 매트릭스 및 계정 관리'
    },
    {
      id: 'audit',
      label: '활동 감사 로그',
      icon: <FileText className="w-4 h-4" />,
      desc: '작업자별 승인/반려/업로드 보안 이력'
    },
    {
      id: 'aws',
      label: 'AWS 서버리스 아키텍처',
      icon: <Cloud className="w-4 h-4" />,
      desc: '인프라 다이어그램 및 SAM 템플릿'
    }
  ];

  const currentTabObj = adminNavItems.find(i => i.id === adminTab) || adminNavItems[0];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      
      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 flex flex-col border-r border-slate-800">
        
        {/* Brand Lockup */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs">
              QA
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white">관리자 콘솔</h1>
              <p className="text-[11px] text-slate-400 font-mono">Enterprise Admin Suite</p>
            </div>
          </div>
        </div>

        {/* Admin Navigation Links */}
        <nav className="p-3 space-y-1 flex-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            시스템 관리 메뉴
          </div>

          {adminNavItems.map(item => (
            <button
              key={item.id}
              onClick={() => setAdminTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                adminTab === item.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className={adminTab === item.id ? 'text-white' : 'text-slate-400'}>
                {item.icon}
              </div>
              <div className="truncate">
                <div>{item.label}</div>
              </div>
            </button>
          ))}
        </nav>

        {/* Back to User Portal Action */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={() => setPortalMode('user')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>검수 포털로 돌아가기</span>
          </button>
          <p className="text-[10px] text-slate-400 text-center mt-2 font-mono">
            URL: /admin?portal=admin
          </p>
        </div>

      </aside>

      {/* ================= RIGHT MAIN WORKSPACE ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Admin Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4">
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>관리자 콘솔</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-900">{currentTabObj.label}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            
            {/* Quick Switch to User Portal */}
            <button
              onClick={() => setPortalMode('user')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors border border-blue-200"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>일반 검수 화면 보기</span>
            </button>

            {/* Current Role Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
              <span className="font-semibold text-slate-800">{currentUser.name}</span>
              <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                {currentUser.role}
              </span>
            </div>

            {/* Language */}
            <button
              onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="font-bold">{language.toUpperCase()}</span>
            </button>

          </div>

        </header>

        {/* Non-Admin Role Warning Banner (if visitor isn't admin) */}
        {currentUser.role !== 'ADMIN' && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                현재 <strong>{currentUser.role}</strong> 역할로 관리자 콘솔을 열람 중입니다. 전체 관리 권한을 행사하려면 관리자로 전환하세요.
              </span>
            </div>
            <button
              onClick={() => switchRole('ADMIN')}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs shadow-2xs transition-colors shrink-0"
            >
              관리자(Admin)로 전환
            </button>
          </div>
        )}

        {/* Content Viewport */}
        <main className="p-6 overflow-y-auto flex-1">
          {adminTab === 'dashboard' && <AdminDashboard />}
          {adminTab === 'storage' && <MediaStorageManager />}
          {adminTab === 'pipeline' && <PipelineMonitor />}
          {adminTab === 'rbac' && <UserManagement />}
          {adminTab === 'audit' && <AuditLogView />}
          {adminTab === 'aws' && <AwsArchitectureView />}
        </main>

      </div>

    </div>
  );
};
