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
  MessageSquare
} from 'lucide-react';

export const VideoTable: React.FC = () => {
  const {
    videos,
    language,
    setSelectedVideo,
    openShareModal
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReviewStatus>('ALL');

  const t = translations[language];

  const filteredVideos = useMemo(() => {
    return videos.filter(video => {
      const matchesSearch =
        searchQuery === '' ||
        video.weekTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.sessionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.fileName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || video.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [videos, searchQuery, statusFilter]);

  const renderStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t.statusApproved}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3.5 h-3.5" />
            {t.statusRejected}
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {t.statusProcessing}
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {t.statusPending}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      
      {/* Table Header matching the screenshot */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{t.subTitle.replace('{count}', String(filteredVideos.length))}</span>
              <span className="text-xs font-normal text-slate-500">
                {t.subDesc}
              </span>
            </h2>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-600 bg-white px-3 py-1.5 rounded-md border border-slate-200 self-start sm:self-auto shadow-2xs">
            {t.totalSummary
              .replace('{count}', String(filteredVideos.length))
              .replace('{total}', '76')}
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
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="sm:w-48 shrink-0">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700 font-medium"
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

      {/* Responsive Video Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
              <th className="py-3.5 px-4 sm:px-6 w-1/4">{t.colWeek}</th>
              <th className="py-3.5 px-4 sm:px-6 w-1/3">{t.colSession}</th>
              <th className="py-3.5 px-4 sm:px-6">{t.colFileName}</th>
              <th className="py-3.5 px-4 sm:px-6 text-center">{t.colStatus}</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">{t.colPlay}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredVideos.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <p className="text-sm">검색 조건과 일치하는 동영상이 없습니다.</p>
                  <p className="text-xs mt-1 text-slate-400">검색어를 초기화하거나 필터를 변경해 보세요.</p>
                </td>
              </tr>
            ) : (
              filteredVideos.map(video => (
                <tr
                  key={video.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {/* 주차명 */}
                  <td className="py-4 px-4 sm:px-6 font-medium text-slate-800 align-middle">
                    <div className="line-clamp-2">
                      <span className="inline-block text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">
                        {video.weekId}주차
                      </span>
                      <p className="text-slate-900 font-semibold">{video.weekTitle}</p>
                    </div>
                  </td>

                  {/* 차시명 */}
                  <td className="py-4 px-4 sm:px-6 text-slate-700 align-middle">
                    <div className="font-medium text-slate-800 line-clamp-2">
                      {video.sessionTitle}
                    </div>
                    {video.reviews.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                        <MessageSquare className="w-3 h-3 text-slate-400" />
                        <span>검수 의견 {video.reviews.length}건</span>
                        {video.subtitles.length > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-blue-600 flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" /> AI 자막
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </td>

                  {/* 동영상파일명 & 메타데이터 */}
                  <td className="py-4 px-4 sm:px-6 align-middle">
                    <div className="font-mono text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {video.fileName}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 tabular-nums">
                      {video.fileSize} · {video.uploadedAt}
                    </div>
                  </td>

                  {/* 검수현황 */}
                  <td className="py-4 px-4 sm:px-6 text-center align-middle whitespace-nowrap">
                    {renderStatusBadge(video.status)}
                    {video.reviewerName && (
                      <div className="text-[11px] text-slate-400 mt-1">
                        검수: {video.reviewerName}
                      </div>
                    )}
                  </td>

                  {/* 재생 버튼 & 공유 */}
                  <td className="py-4 px-4 sm:px-6 text-right align-middle whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openShareModal(video)}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title={t.shareLink}
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      {/* Main Play CTA matching screenshot button styling */}
                      <button
                        onClick={() => setSelectedVideo(video)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg text-xs shadow-xs transition-all transform active:scale-98"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{t.playButton}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer info */}
      <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span>* 검수 의견 작성 시 현재 재생 시점(타임코드)이 자동으로 스탬프됩니다.</span>
        </div>
        <div className="font-mono tabular-nums text-slate-400">
          Showing {filteredVideos.length} of {videos.length} sessions
        </div>
      </div>

    </div>
  );
};
