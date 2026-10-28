import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { downloadFile } from '../utils/formatters';
import { BarChart3, CheckCircle2, Clock3, Download, Film, MessageSquare, XCircle } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { videos, setSelectedVideo } = useApp();
  const counts = useMemo(() => ({
    total: videos.length,
    approved: videos.filter(video => video.status === 'APPROVED').length,
    rejected: videos.filter(video => video.status === 'REJECTED').length,
    pending: videos.filter(video => video.status === 'PENDING' || video.status === 'PROCESSING').length
  }), [videos]);
  const completed = counts.approved + counts.rejected;
  const completionRate = counts.total ? Math.round((completed / counts.total) * 100) : 0;
  const weekRows = useMemo(() => {
    const grouped = new Map<string, { total: number; approved: number; rejected: number; pending: number }>();
    videos.forEach(video => {
      const title = video.weekTitle || '주차 미지정';
      const current = grouped.get(title) || { total: 0, approved: 0, rejected: 0, pending: 0 };
      current.total += 1;
      if (video.status === 'APPROVED') current.approved += 1;
      else if (video.status === 'REJECTED') current.rejected += 1;
      else current.pending += 1;
      grouped.set(title, current);
    });
    return Array.from(grouped, ([title, values]) => ({ title, ...values })).sort((a, b) => a.title.localeCompare(b.title, 'ko'));
  }, [videos]);
  const reviewerRows = useMemo(() => {
    const grouped = new Map<string, { name: string; role: string; comments: number; approvals: number; rejections: number }>();
    videos.forEach(video => video.reviews.forEach(comment => {
      const row = grouped.get(comment.author) || { name: comment.author, role: comment.role, comments: 0, approvals: 0, rejections: 0 };
      row.comments += 1;
      if (comment.verdict === 'APPROVED') row.approvals += 1;
      if (comment.verdict === 'REJECTED') row.rejections += 1;
      grouped.set(comment.author, row);
    }));
    return Array.from(grouped.values()).sort((a, b) => b.comments - a.comments);
  }, [videos]);
  const flagged = videos.flatMap(video => video.reviews
    .filter(comment => comment.verdict === 'REJECTED')
    .map(comment => ({ video, comment })))
    .sort((a, b) => b.comment.createdAt.localeCompare(a.comment.createdAt))
    .slice(0, 6);

  const exportCsv = () => {
    const headers = ['Video ID', 'Week', 'Session', 'File Name', 'Status', 'Reviewer', 'Comments Count', 'Upload Date'];
    const rows = videos.map(video => [
      video.id,
      '"' + video.weekTitle.replaceAll('"', '""') + '"',
      '"' + video.sessionTitle.replaceAll('"', '""') + '"',
      '"' + video.fileName.replaceAll('"', '""') + '"',
      video.status,
      '"' + (video.reviewerName || '').replaceAll('"', '""') + '"',
      String(video.reviews.length),
      video.uploadedAt
    ]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    downloadFile(csv, 'video-review-' + new Date().toISOString().slice(0, 10) + '.csv', 'text/csv;charset=utf-8;');
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><BarChart3 size={20} /></div><div><h2 className="text-lg font-bold text-slate-900">검수 현황</h2><p className="mt-1 text-sm text-slate-500">등록된 영상과 실제 검수 상태를 집계합니다.</p></div></div>
        <button type="button" onClick={exportCsv} disabled={!videos.length} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold"><Download size={15} />CSV 내보내기</button>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex justify-between text-xs text-slate-500"><span>등록 영상</span><Film size={15} /></div><strong className="block mt-2 text-2xl text-slate-900">{counts.total}</strong></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex justify-between text-xs text-slate-500"><span>승인</span><CheckCircle2 size={15} className="text-emerald-600" /></div><strong className="block mt-2 text-2xl text-slate-900">{counts.approved}</strong></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex justify-between text-xs text-slate-500"><span>반려</span><XCircle size={15} className="text-rose-600" /></div><strong className="block mt-2 text-2xl text-slate-900">{counts.rejected}</strong></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex justify-between text-xs text-slate-500"><span>검수 대기</span><Clock3 size={15} className="text-amber-600" /></div><strong className="block mt-2 text-2xl text-slate-900">{counts.pending}</strong></div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex justify-between text-sm"><strong className="text-slate-900">검수 완료율</strong><span className="font-semibold text-slate-700">{completionRate}% · {completed}/{counts.total}</span></div>
        <div className="mt-3 h-2.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: completionRate + '%' }} /></div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200"><h3 className="font-bold text-slate-900">주차별 검수</h3></div>
          {weekRows.length ? <div className="divide-y divide-slate-100">{weekRows.map(row => <div key={row.title} className="px-5 py-3.5 flex items-center justify-between gap-3"><div><strong className="text-sm text-slate-800">{row.title}</strong><p className="text-xs text-slate-500 mt-0.5">{row.total}개 영상</p></div><div className="text-right text-xs"><span className="text-emerald-700">승인 {row.approved}</span><span className="mx-2 text-slate-300">·</span><span className="text-rose-700">반려 {row.rejected}</span><span className="mx-2 text-slate-300">·</span><span className="text-amber-700">대기 {row.pending}</span></div></div>)}</div> : <p className="px-5 py-10 text-center text-sm text-slate-500">집계할 영상이 없습니다.</p>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2"><MessageSquare size={16} className="text-blue-600" /><h3 className="font-bold text-slate-900">반려 의견</h3></div>
          {flagged.length ? <div className="divide-y divide-slate-100">{flagged.map(({ video, comment }) => <button key={video.id + comment.id} type="button" onClick={() => setSelectedVideo(video)} className="w-full px-5 py-3.5 text-left hover:bg-slate-50"><strong className="block text-xs text-slate-800">{video.fileName} · {comment.timestampFormatted}</strong><p className="mt-1 text-xs text-slate-600 line-clamp-2">{comment.content}</p><span className="mt-1 block text-[11px] text-slate-400">{comment.author} · {comment.createdAt}</span></button>)}</div> : <p className="px-5 py-10 text-center text-sm text-slate-500">등록된 반려 의견이 없습니다.</p>}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200"><h3 className="font-bold text-slate-900">검수 활동</h3></div>
        {reviewerRows.length ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3 text-left">검수자</th><th className="px-5 py-3 text-left">역할 기록</th><th className="px-5 py-3 text-right">의견 수</th><th className="px-5 py-3 text-right">승인</th><th className="px-5 py-3 text-right">반려</th></tr></thead><tbody className="divide-y divide-slate-100">{reviewerRows.map(row => <tr key={row.name}><td className="px-5 py-3 font-semibold text-slate-800">{row.name}</td><td className="px-5 py-3 text-slate-500">{row.role}</td><td className="px-5 py-3 text-right tabular-nums">{row.comments}</td><td className="px-5 py-3 text-right tabular-nums">{row.approvals}</td><td className="px-5 py-3 text-right tabular-nums">{row.rejections}</td></tr>)}</tbody></table></div> : <p className="px-5 py-10 text-center text-sm text-slate-500">아직 검수 의견이 등록되지 않았습니다.</p>}
      </section>
    </div>
  );
};
