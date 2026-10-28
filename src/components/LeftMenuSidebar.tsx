import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { WhomediaLogo } from './WhomediaLogo';
import { UserRole } from '../types';
import {
  FolderKanban,
  CheckCircle2,
  Upload,
  HardDrive,
  UserCheck,
  Film,
  Eye,
  Shield,
  LayoutDashboard,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Cloud,
  ChevronDown,
  Layers,
  Check
} from 'lucide-react';

interface LeftMenuSidebarProps {
  onSelectProjectFilter?: (aliasOrName: string) => void;
  selectedProjectFilter?: string;
}

export const LeftMenuSidebar: React.FC<LeftMenuSidebarProps> = ({
  onSelectProjectFilter,
  selectedProjectFilter = ''
}) => {
  const {
    userViewMode,
    setUserViewMode,
    projects,
    videos,
    currentUser,
    switchRole,
    setUploadModalOpen,
    setPortalMode
  } = useApp();

  const [projectSearch, setProjectSearch] = useState('');
  const [projectListOpen, setProjectListOpen] = useState(true);

  // Filtered projects for sidebar quick links
  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
    p.alias.toLowerCase().includes(projectSearch.toLowerCase())
  );

  const roleIcons: Record<UserRole, React.ReactNode> = {
    REVIEWER: <UserCheck className="w-3.5 h-3.5 text-emerald-600" />,
    CREATOR: <Film className="w-3.5 h-3.5 text-amber-600" />,
    VIEWER: <Eye className="w-3.5 h-3.5 text-slate-500" />,
    ADMIN: <Shield className="w-3.5 h-3.5 text-indigo-600" />
  };

  const roleNames: Record<UserRole, string> = {
    REVIEWER: '검수자 (Reviewer)',
    CREATOR: '제작PD (Creator)',
    VIEWER: '열람자 (Viewer)',
    ADMIN: '관리자 (Admin)'
  };

  return (
    <aside className="w-72 shrink-0 bg-white border-r border-slate-200 min-h-screen flex flex-col justify-between select-none">
      {/* Top Section: Logo & Main Navigation */}
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100">
          <WhomediaLogo size="md" subtitle="스마트 동영상 검수 시스템" />
          <div className="mt-2.5 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-md flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>QA 클라우드 가동 중</span>
            </span>
            <span className="text-slate-400 font-mono text-[10px]">v2.6.4</span>
          </div>
        </div>

        {/* Primary Menu Navigation */}
        <div className="p-3 space-y-1">
          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            업무 메뉴
          </div>

          {/* Menu Item 1: 프로젝트 등록 및 구성 */}
          <button
            type="button"
            onClick={() => setUserViewMode('registration')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              userViewMode === 'registration'
                ? 'bg-red-50 text-red-700 border border-red-200/80 shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  userViewMode === 'registration'
                    ? 'bg-red-600 text-white shadow-xs shadow-red-500/20'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <FolderKanban className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-bold leading-tight">프로젝트 등록 관리</div>
                <div className="text-[10px] font-normal text-slate-500 mt-0.5">과정 · 주차 · 차시 구조</div>
              </div>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                userViewMode === 'registration'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              17
            </span>
          </button>

          {/* Menu Item 2: 동영상 검수 대시보드 */}
          <button
            type="button"
            onClick={() => setUserViewMode('review')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              userViewMode === 'review'
                ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  userViewMode === 'review'
                    ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-bold leading-tight">동영상 검수 대시보드</div>
                <div className="text-[10px] font-normal text-slate-500 mt-0.5">차시별 재생 · 승인/반려</div>
              </div>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                userViewMode === 'review'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              76
            </span>
          </button>

          {/* Menu Item 3: AWS S3 일괄 업로드 */}
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-bold leading-tight">영상 파일 업로드</div>
                <div className="text-[10px] font-normal text-slate-500 mt-0.5">S3 직통 버킷 업로드</div>
              </div>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded">
              S3
            </span>
          </button>
        </div>

        {/* Quick Project Shortcuts (17 Projects) */}
        <div className="px-3 pt-2">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              프로젝트 바로가기 ({projects.length})
            </span>
            <button
              type="button"
              onClick={() => setProjectListOpen(!projectListOpen)}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${projectListOpen ? '' : '-rotate-90'}`} />
            </button>
          </div>

          {projectListOpen && (
            <div className="mt-1 space-y-2">
              {/* Quick Search inside projects */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={projectSearch}
                  onChange={e => setProjectSearch(e.target.value)}
                  placeholder="프로젝트명/별칭 검색..."
                  className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-red-500"
                />
              </div>

              {/* Scrollable Project List */}
              <div className="max-h-56 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                {selectedProjectFilter && (
                  <button
                    type="button"
                    onClick={() => onSelectProjectFilter && onSelectProjectFilter('')}
                    className="w-full text-left px-2 py-1 rounded-md text-[11px] text-red-600 hover:bg-red-50 font-bold flex items-center justify-between"
                  >
                    <span>← 전체 프로젝트 보기</span>
                    <span className="text-[10px]">필터 해제</span>
                  </button>
                )}

                {filteredProjects.map(proj => {
                  const isSelected = selectedProjectFilter === proj.alias || selectedProjectFilter === proj.id;
                  return (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => onSelectProjectFilter && onSelectProjectFilter(proj.alias)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between group ${
                        isSelected
                          ? 'bg-red-50 text-red-700 font-bold border border-red-200'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      title={proj.name}
                    >
                      <span className="truncate max-w-[150px]">{proj.name}</span>
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 group-hover:bg-white text-slate-500 border border-slate-200 shrink-0">
                        /{proj.alias}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: AWS S3 Status, User Profile, Admin Link */}
      <div className="p-3 border-t border-slate-200 space-y-2.5 bg-slate-50/50">
        {/* AWS S3 Connection Widget */}
        <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Cloud className="w-3.5 h-3.5 text-blue-600" />
              <span>AWS S3 저장소</span>
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              정상 연결
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-600 truncate" title="edutem-video-review">
            edutem-video-review
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-600 h-1.5 rounded-full w-[24%]" />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>24.3 GB 사용 중</span>
            <span>100 GB 한도</span>
          </div>
        </div>

        {/* Current User & Quick Role Switch */}
        <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {roleNames[currentUser.role]}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const nextRole: UserRole = currentUser.role === 'REVIEWER' ? 'CREATOR' : 'REVIEWER';
              switchRole(nextRole);
            }}
            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md border border-blue-200 transition-colors"
            title="역할 즉시 전환"
          >
            역할변경
          </button>
        </div>

        {/* Admin Console Switcher Link */}
        <button
          type="button"
          onClick={() => setPortalMode('admin')}
          className="w-full py-2 px-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>관리자 전용 콘솔 이동</span>
        </button>
      </div>
    </aside>
  );
};
