import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../utils/i18n';
import { ReviewStatus, VideoSession } from '../types';
import {
  Search,
  Play,
  Share2,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Sparkles,
  MessageSquare,
  Link as LinkIcon,
  Check
} from 'lucide-react';

export const VideoTable: React.FC = () => {
  const {
    videos,
    projects,
    language,
    setSelectedVideo,
    openShareModal,
    currentProjectSlug,
    setCurrentProjectSlug,
    activeProject
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReviewStatus>('ALL');
  const [copiedLink, setCopiedLink] = useState(false);

  const t = translations[language];

  // Default active project is Bio Health (dhc26) if none selected, matching Screenshot 1
  const displayedProject = useMemo(() => {
    if (activeProject) return activeProject;
    if (currentProjectSlug) {
      const match = projects.find(
        p => p.alias.toLowerCase() === currentProjectSlug.toLowerCase() || p.id === currentProjectSlug
      );
      if (match) return match;
    }
    // Default to Bio Health project matching screenshot 1
    const defaultBio = projects.find(p => p.alias === 'dhc26') || projects[0];
    return defaultBio;
  }, [activeProject, currentProjectSlug, projects]);

  const selectedProjectAlias = displayedProject?.alias || 'dhc26';

  // Get videos for currently displayed project
  const projectVideos = useMemo(() => {
    if (!displayedProject) return videos;

    // First check if videos array has items matching this project
    const byProjId = videos.filter(
      v =>
        (v.projectId && v.projectId === displayedProject.id) ||
        v.fileName.startsWith(displayedProject.alias) ||
        v.weekTitle.includes(displayedProject.name.slice(0, 10))
    );
    if (byProjId.length > 0) return byProjId;

    // If project has embedded sessions with videos
    if (displayedProject.sessions && displayedProject.sessions.length > 0) {
      const sessVideos = displayedProject.sessions.flatMap(s => s.videos || []);
      if (sessVideos.length > 0) return sessVideos;
    }

    // Fallback: return videos matching alias prefix or all
    return videos;
  }, [displayedProject, videos]);

  const filteredVideos = useMemo(() => {
    return projectVideos.filter(video => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        q === '' ||
        video.weekTitle.toLowerCase().includes(q) ||
        video.sessionTitle.toLowerCase().includes(q) ||
        video.fileName.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || video.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projectVideos, searchQuery, statusFilter]);

  const handleSelectProject = (alias: string) => {
    setCurrentProjectSlug(alias);
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/${selectedProjectAlias}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const renderStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>승인</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>반려</span>
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
            <span>처리중</span>
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>검수대기</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* ================= 1. PROJECT HEADER BAR (MATCHING SCREENSHOT 1) ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
              {displayedProject?.name || 'Bio Health 시대의 ESG와 지속 가능한 성장'}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              전용 검수 슬러그: <span className="font-mono text-slate-700">/{selectedProjectAlias}</span> · 총 {projectVideos.length}개 차시 검수 대상
            </p>
          </div>
        </div>

        {/* Project Switcher Dropdown & 1-Click Link Copy */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedProjectAlias}
            onChange={e => handleSelectProject(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer max-w-[260px] truncate"
          >
            {projects.map(p => (
              <option key={p.id} value={p.alias}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleCopyShareLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all shadow-2xs active:scale-95"
            title="검수자 전용 접속 링크 복사"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">복사 완료!</span>
              </>
            ) : (
              <>
                <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>링크 복사</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ================= 2. MAIN TABLE CARD (MATCHING SCREENSHOT 1) ================= */}
      <div className="bg-white rounded-xl shadow-2xs border border-slate-200/90 overflow-hidden">
        
        {/* Table Header Row: 차시 목록 (총 6개 동영상) ... 6건 / 전체 83건 */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>차시 목록 (총 {projectVideos.length}개 동영상)</span>
                <span className="text-xs font-normal text-slate-400 hidden sm:inline">
                  프로젝트 · 차시 · 동영상파일명 확인하고 재생 버튼을 누르세요.
                </span>
              </h2>
            </div>
            
            <div className="text-xs font-medium tabular-nums text-slate-500 shrink-0">
              {filteredVideos.length}건 / 전체 83건
            </div>
          </div>

          {/* Search & Status Filter Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="프로젝트명 · 차시명 · 동영상 파일명 검색"
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 text-slate-900"
              />
            </div>

            <div className="sm:w-44 shrink-0">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium cursor-pointer"
              >
                <option value="ALL">검수 상태: 전체</option>
                <option value="PENDING">검수대기</option>
                <option value="APPROVED">승인 완료</option>
                <option value="REJECTED">검수 반려</option>
                <option value="PROCESSING">처리중</option>
              </select>
            </div>
          </div>
        </div>

        {/* Exact Table Layout: No | 차시명 | 주차 | 동영상 파일명 | 상태 | 재생 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-bold text-xs">
                <th className="py-3 px-4 w-12 text-center text-slate-400">No</th>
                <th className="py-3 px-4 sm:px-6 w-1/3">차시명</th>
                <th className="py-3 px-4 sm:px-6 w-24">주차</th>
                <th className="py-3 px-4 sm:px-6">동영상 파일명</th>
                <th className="py-3 px-4 text-center w-28">상태</th>
                <th className="py-3 px-4 sm:px-6 text-right w-24">재생</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVideos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="text-sm">검색 조건과 일치하는 동영상이 없습니다.</p>
                    <p className="text-xs mt-1 text-slate-400">검색어를 지우거나 검수 상태 필터를 변경해 보세요.</p>
                  </td>
                </tr>
              ) : (
                filteredVideos.map((video, idx) => (
                  <tr
                    key={video.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* No */}
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-400 align-middle">
                      {idx + 1}
                    </td>

                    {/* 차시명 */}
                    <td className="py-3.5 px-4 sm:px-6 text-slate-800 font-semibold align-middle">
                      <div className="line-clamp-2">
                        {video.sessionTitle}
                      </div>
                      {video.reviews.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 font-normal">
                          <MessageSquare className="w-3 h-3 text-slate-400" />
                          <span>검수 의견 {video.reviews.length}건</span>
                          {video.subtitles.length > 0 && (
                            <>
                              <span>·</span>
                              <span className="text-blue-600 flex items-center gap-0.5 font-medium">
                                <Sparkles className="w-2.5 h-2.5" /> AI 자막
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 주차 */}
                    <td className="py-3.5 px-4 sm:px-6 text-slate-600 align-middle whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium text-slate-700">
                        {video.weekId ? `${video.weekId}주차` : '1주차'}
                      </span>
                    </td>

                    {/* 동영상 파일명 & 메타데이터 */}
                    <td className="py-3.5 px-4 sm:px-6 align-middle">
                      <div className="font-mono text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {video.fileName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 tabular-nums">
                        {video.fileSize} · {video.uploadedAt}
                      </div>
                    </td>

                    {/* 검수 상태 */}
                    <td className="py-3.5 px-4 text-center align-middle whitespace-nowrap">
                      {renderStatusBadge(video.status)}
                      {video.reviewerName && (
                        <div className="text-[10px] text-slate-400 mt-1">
                          검수: {video.reviewerName}
                        </div>
                      )}
                    </td>

                    {/* 재생 버튼 */}
                    <td className="py-3.5 px-4 sm:px-6 text-right align-middle whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedVideo(video)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg text-xs shadow-2xs transition-all transform active:scale-95 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>재생</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer info */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <span>* 검수 의견 작성 시 현재 재생 시점(타임코드)이 자동으로 스탬프됩니다.</span>
          <span className="font-mono tabular-nums text-slate-500">
            표시 중: {filteredVideos.length} / {projectVideos.length}건
          </span>
        </div>

      </div>
    </div>
  );
};
