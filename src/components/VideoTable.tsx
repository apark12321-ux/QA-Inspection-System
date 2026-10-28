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

  const displayedProject = useMemo(() => {
    if (activeProject) return activeProject;
    if (currentProjectSlug) {
      const match = projects.find(
        p => p.alias.toLowerCase() === currentProjectSlug.toLowerCase() || p.id === currentProjectSlug
      );
      if (match) return match;
    }
    return projects[0];
  }, [activeProject, currentProjectSlug, projects]);

  const selectedProjectAlias = displayedProject?.alias || '';

  // Get videos for currently displayed project
  const projectVideos = useMemo(() => {
    if (!displayedProject) return videos;

    const byProjectId = videos.filter(video => video.projectId === displayedProject.id);
    if (byProjectId.length > 0) return byProjectId;

    // If project has embedded sessions with videos
    if (displayedProject.sessions && displayedProject.sessions.length > 0) {
      const sessVideos = displayedProject.sessions.flatMap(s => s.videos || []);
      if (sessVideos.length > 0) return sessVideos;
    }

    return [];
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

  const handleCopyShareLink = async () => {
    if (!selectedProjectAlias) return;
    const shareUrl = new URL('/' + encodeURIComponent(selectedProjectAlias), window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setCopiedLink(false);
    }
  };

  const renderStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.statusApproved}</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>{t.statusRejected}</span>
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 shadow-2xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
            <span>{t.statusProcessing}</span>
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.statusPending}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* ================= 1. PROJECT HEADER BAR ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 tracking-tight leading-tight">
              {displayedProject?.name || (language === 'ko' ? '등록된 프로젝트가 없습니다.' : 'No project registered')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {selectedProjectAlias && <>{language === 'ko' ? '프로젝트 검수 주소:' : 'Project review link:'} <span className="font-mono text-slate-800 font-semibold">/{selectedProjectAlias}</span> · </>}{language === 'ko' ? `영상 ${projectVideos.length}개` : `${projectVideos.length} videos`}
            </p>
          </div>
        </div>

        {/* Project Switcher Dropdown & 1-Click Link Copy */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedProjectAlias}
            onChange={e => handleSelectProject(e.target.value)}
            className="px-3 py-2 bg-slate-50 hover:bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-800 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer max-w-[280px] truncate"
          >
            {projects.length === 0 && <option value="">{language === 'ko' ? '등록된 프로젝트 없음' : 'No projects registered'}</option>}
            {projects.map(p => (
              <option key={p.id} value={p.alias}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleCopyShareLink}
            disabled={!selectedProjectAlias}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-2xs active:scale-95"
            title={t.shareLink}
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">{language === 'ko' ? '복사 완료!' : 'Copied!'}</span>
              </>
            ) : (
              <>
                <LinkIcon className="w-4 h-4 text-blue-600" />
                <span>{language === 'ko' ? '링크 복사' : 'Copy Link'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ================= 2. MAIN TABLE CARD ================= */}
      <div className="bg-white rounded-xl shadow-2xs border border-slate-200/90 overflow-hidden">
        
        {/* Table Header Row */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>{t.subTitle.replace('{count}', String(projectVideos.length))}</span>
                <span className="text-xs sm:text-sm font-normal text-slate-500 hidden sm:inline">
                  {t.subDesc}
                </span>
              </h2>
            </div>
            
            <div className="text-xs sm:text-sm font-semibold tabular-nums text-slate-500 shrink-0">
              {t.totalSummary.replace('{count}', String(filteredVideos.length)).replace('{total}', String(projectVideos.length))}
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
                placeholder={t.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-[15px] bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 text-slate-900"
              />
            </div>

            <div className="sm:w-48 shrink-0">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2.5 text-xs sm:text-[15px] bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium cursor-pointer"
              >
                <option value="ALL">{t.allStatus}</option>
                <option value="PENDING">{t.statusPending}</option>
                <option value="APPROVED">{t.statusApproved}</option>
                <option value="REJECTED">{t.statusRejected}</option>
                <option value="PROCESSING">{t.statusProcessing}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table: No | 차시명 | 주차 | 동영상 파일명 | 상태 | 재생 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-[15px] border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold text-xs sm:text-sm">
                <th className="py-3.5 px-4 w-14 text-center text-slate-400">No</th>
                <th className="py-3.5 px-4 sm:px-6 w-1/3">{t.colSession}</th>
                <th className="py-3.5 px-4 sm:px-6 w-28">{t.colWeek}</th>
                <th className="py-3.5 px-4 sm:px-6">{t.colFileName}</th>
                <th className="py-3.5 px-4 text-center w-32">{t.colStatus}</th>
                <th className="py-3.5 px-4 sm:px-6 text-right w-28">{t.colPlay}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVideos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="text-base">{language === 'ko' ? '검색 조건과 일치하는 동영상이 없습니다.' : 'No videos match the search criteria.'}</p>
                    <p className="text-xs sm:text-sm mt-1 text-slate-400">{language === 'ko' ? '검색어를 지우거나 검수 상태 필터를 변경해 보세요.' : 'Try clearing search terms or changing the status filter.'}</p>
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
                      <div className="line-clamp-2 text-slate-900 font-medium">
                        {video.sessionTitle}
                      </div>
                      {video.reviews.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400 font-normal">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                          <span>{language === 'ko' ? `검수 의견 ${video.reviews.length}건` : `${video.reviews.length} notes`}</span>
                          {video.subtitles.length > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-blue-600 flex items-center gap-0.5 font-medium">
                                <Sparkles className="w-3 h-3" /> {language === 'ko' ? 'AI 자막' : 'Subtitles'}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 주차 */}
                    <td className="py-3.5 px-4 sm:px-6 text-slate-600 align-middle whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-md text-xs font-semibold text-slate-700">
                        {video.weekTitle || (language === 'ko' ? '주차 미지정' : 'No week assigned')}
                      </span>
                    </td>

                    {/* 동영상 파일명 & 메타데이터 */}
                    <td className="py-3.5 px-4 sm:px-6 align-middle">
                      <div className="font-mono text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {video.fileName}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5 tabular-nums">
                        {video.fileSize} · {video.uploadedAt}
                      </div>
                    </td>

                    {/* 검수 상태 */}
                    <td className="py-3.5 px-4 text-center align-middle whitespace-nowrap">
                      {renderStatusBadge(video.status)}
                      {video.reviewerName && (
                        <div className="text-[11px] text-slate-400 mt-1">
                          {language === 'ko' ? '검수:' : 'By:'} {video.reviewerName}
                        </div>
                      )}
                    </td>

                    {/* 재생 버튼 */}
                    <td className="py-3.5 px-4 sm:px-6 text-right align-middle whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedVideo(video)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg text-xs sm:text-sm shadow-2xs transition-all transform active:scale-95 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{t.playButton}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer info */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-slate-400 gap-2">
          <span>{language === 'ko' ? '* 검수 의견 작성 시 현재 재생 시점(타임코드)이 자동으로 기록됩니다.' : '* Timestamps are automatically captured when adding comments.'}</span>
          <span className="font-mono tabular-nums text-slate-500 font-medium">
            {language === 'ko' ? '표시 중:' : 'Showing:'} {filteredVideos.length} / {projectVideos.length}건
          </span>
        </div>

      </div>
    </div>
  );
};
