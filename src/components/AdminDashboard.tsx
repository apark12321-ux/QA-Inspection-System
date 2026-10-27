import React from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../utils/i18n';
import { downloadFile } from '../utils/formatters';
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Users,
  Film,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { videos, language, setSelectedVideo } = useApp();
  const t = translations[language];

  // Metrics
  const totalVideos = videos.length;
  const approvedCount = videos.filter(v => v.status === 'APPROVED').length;
  const rejectedCount = videos.filter(v => v.status === 'REJECTED').length;
  const pendingCount = videos.filter(v => v.status === 'PENDING').length;
  const processingCount = videos.filter(v => v.status === 'PROCESSING').length;

  const reviewedTotal = approvedCount + rejectedCount;
  const completionRate = totalVideos > 0 ? Math.round((reviewedTotal / totalVideos) * 100) : 0;

  // Breakdown by Week
  const weekMap = videos.reduce((acc, video) => {
    const key = `${video.weekId}주차: ${video.weekTitle}`;
    if (!acc[key]) {
      acc[key] = { total: 0, approved: 0, rejected: 0, pending: 0 };
    }
    acc[key].total += 1;
    if (video.status === 'APPROVED') acc[key].approved += 1;
    if (video.status === 'REJECTED') acc[key].rejected += 1;
    if (video.status === 'PENDING') acc[key].pending += 1;
    return acc;
  }, {} as Record<string, { total: number; approved: number; rejected: number; pending: number }>);

  // Reviewer Leaderboard
  const reviewerStats = videos.reduce((acc, video) => {
    video.reviews.forEach(r => {
      if (!acc[r.author]) {
        acc[r.author] = { name: r.author, role: r.role, reviewsCount: 0, approved: 0, rejected: 0 };
      }
      acc[r.author].reviewsCount += 1;
      if (r.verdict === 'APPROVED') acc[r.author].approved += 1;
      if (r.verdict === 'REJECTED') acc[r.author].rejected += 1;
    });
    return acc;
  }, {} as Record<string, { name: string; role: string; reviewsCount: number; approved: number; rejected: number }>);

  // Rejection reasons analysis
  const rejectionReasons = [
    { label: '자막 오타 및 맞춤법 오류', percentage: 45, count: 9 },
    { label: '배경음악(BGM) 게인 과다 및 음질 불량', percentage: 25, count: 5 },
    { label: '화면-음성 싱크 불일치 (0.5s 이상)', percentage: 20, count: 4 },
    { label: '강의 슬라이드 CG 오기입 및 해상도 저하', percentage: 10, count: 2 }
  ];

  const handleExportCsv = () => {
    const headers = ['Video ID', 'Week', 'Session', 'File Name', 'Status', 'Reviewer', 'Comments Count', 'Upload Date'];
    const rows = videos.map(v => [
      v.id,
      `"${v.weekTitle}"`,
      `"${v.sessionTitle}"`,
      v.fileName,
      v.status,
      v.reviewerName || 'N/A',
      v.reviews.length,
      v.uploadedAt
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile(csvContent, `Video_QA_Report_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Export CTA */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>관리자 품질검수 현황 및 종합 지표</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            실시간 검수 진척률, 차시별 승인/반려 현황 및 검수자 처리 실적을 총괄 모니터링합니다.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>종합 검수 리포트 (CSV 다운로드)</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total Videos */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">총 등록 동영상</span>
            <Film className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {totalVideos} <span className="text-xs font-normal text-slate-500">/ 76개</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-blue-600 font-semibold">{totalVideos}개 차시</span> 활성 모니터링 중
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">전체 검수 완료율</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600">
            {completionRate}%
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Approved vs Rejected */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">승인 vs 반려</span>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <XCircle className="w-3.5 h-3.5 text-red-600" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 flex items-center gap-2">
            <span className="text-emerald-600">{approvedCount} 승인</span>
            <span className="text-slate-300">/</span>
            <span className="text-red-600">{rejectedCount} 반려</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            대기: {pendingCount}건 · 처리중: {processingCount}건
          </div>
        </div>

        {/* Average Turnaround */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">평균 검수 소요시간</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            2.4 <span className="text-xs font-normal text-slate-500">시간</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            목표치(4시간) 대비 40% 단축
          </div>
        </div>

      </div>

      {/* 2-Column Split: Weekly Progress & Rejection Reasons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Weekly Progress Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
            <span>주차별 검수 진척 현황</span>
            <span className="text-xs text-slate-400 font-normal">차시 기준</span>
          </h3>

          <div className="space-y-4">
            {Object.entries(weekMap).map(([weekTitle, stats]) => {
              const weekRate = stats.total > 0 ? Math.round(((stats.approved + stats.rejected) / stats.total) * 100) : 0;
              return (
                <div key={weekTitle} className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                    <span>{weekTitle}</span>
                    <span className="font-mono text-blue-600">{weekRate}%</span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${(stats.approved / stats.total) * 100}%` }}
                      title={`승인: ${stats.approved}건`}
                    />
                    <div
                      className="bg-red-500 h-full"
                      style={{ width: `${(stats.rejected / stats.total) * 100}%` }}
                      title={`반려: ${stats.rejected}건`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
                    <span className="text-emerald-700">승인 {stats.approved}</span>
                    <span className="text-red-700">반려 {stats.rejected}</span>
                    <span className="text-slate-600">대기 {stats.pending}</span>
                    <span className="text-slate-400">총 {stats.total}개</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rejection Causes Analysis */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span>주요 검수 반려 사유 분석</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              반려 등록된 피드백의 유형별 비율 통계입니다.
            </p>

            <div className="space-y-3">
              {rejectionReasons.map(item => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-800">
                    <span>{item.label}</span>
                    <span className="font-mono text-slate-600 font-bold">{item.percentage}% ({item.count}건)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-red-500 h-full rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 mt-4 leading-relaxed">
            💡 <strong>AI 검수 개선 제안</strong>: 자막 오타 반려 비율이 45%로 가장 높습니다. 영상 업로드 직후 Gemini 3.8 Flash 자막 자동 추출 및 맞춤법 사전 검사를 권장합니다.
          </div>
        </div>

      </div>

      {/* Reviewer Productivity Leaderboard */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>검수 담당자별 처리 실적</span>
          </h3>
          <span className="text-xs text-slate-500">실시간 누적</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase">
                <th className="py-3 px-6">담당자명</th>
                <th className="py-3 px-6">역할</th>
                <th className="py-3 px-6 text-center">총 검수 의견</th>
                <th className="py-3 px-6 text-center">승인 건수</th>
                <th className="py-3 px-6 text-center">반려 건수</th>
                <th className="py-3 px-6 text-right">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.values(reviewerStats).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    아직 등록된 검수 의견 통계가 없습니다.
                  </td>
                </tr>
              ) : (
                Object.values(reviewerStats).map(rev => (
                  <tr key={rev.name} className="hover:bg-slate-50">
                    <td className="py-3.5 px-6 font-bold text-slate-900">{rev.name}</td>
                    <td className="py-3.5 px-6 text-slate-600 font-mono text-xs">{rev.role}</td>
                    <td className="py-3.5 px-6 text-center font-mono font-bold text-blue-600">{rev.reviewsCount}건</td>
                    <td className="py-3.5 px-6 text-center font-mono text-emerald-600">{rev.approved}건</td>
                    <td className="py-3.5 px-6 text-center font-mono text-red-600">{rev.rejected}건</td>
                    <td className="py-3.5 px-6 text-right">
                      <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                        활동 중
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
