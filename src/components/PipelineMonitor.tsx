import React from 'react';
import { useApp } from '../context/AppContext';
import { Activity, CheckCircle2, Clock3, Play, Sparkles, XCircle } from 'lucide-react';

export const PipelineMonitor: React.FC = () => {
  const { videos, setSelectedVideo } = useApp();
  const reviewedCount = videos.filter(video => video.status === 'APPROVED' || video.status === 'REJECTED').length;
  const aiAnalyzedCount = videos.filter(video => Boolean(video.aiAnalysis)).length;
  const pendingCount = videos.filter(video => video.status === 'PENDING').length;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Activity size={20} /></div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">영상 처리 및 AI 분석 현황</h2>
            <p className="mt-1 text-sm text-slate-500">Firestore에 등록된 실제 영상 상태와 Gemini 분석 결과를 기준으로 표시합니다.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><span className="text-xs text-slate-500">검수 대기</span><strong className="block mt-1 text-2xl text-slate-900">{pendingCount}</strong></div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><span className="text-xs text-slate-500">검수 완료</span><strong className="block mt-1 text-2xl text-slate-900">{reviewedCount}</strong></div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><span className="text-xs text-slate-500">AI 분석 저장됨</span><strong className="block mt-1 text-2xl text-slate-900">{aiAnalyzedCount}</strong></div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div><h3 className="font-bold text-slate-900">등록 영상</h3><p className="text-xs text-slate-500 mt-0.5">{videos.length}개 영상</p></div>
        </div>
        {videos.length === 0 ? (
          <div className="px-5 py-14 text-center text-sm text-slate-500">표시할 영상이 없습니다. 프로젝트 검수 화면에서 영상을 등록해 주세요.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {videos.map(video => {
              const complete = video.status === 'APPROVED';
              const rejected = video.status === 'REJECTED';
              return (
                <article key={video.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm text-slate-900 truncate">{video.fileName}</strong>
                      <span className={'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ' + (complete ? 'bg-emerald-50 text-emerald-700' : rejected ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700')}>
                        {complete ? <CheckCircle2 size={12} /> : rejected ? <XCircle size={12} /> : <Clock3 size={12} />}
                        {complete ? '승인' : rejected ? '반려' : video.status === 'PROCESSING' ? '처리 중' : '검수 대기'}
                      </span>
                      {video.aiAnalysis && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[11px] font-semibold"><Sparkles size={12} />AI 분석 완료</span>}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 truncate">{video.sessionTitle} · {video.fileSize} · 등록 {video.uploadedAt}</p>
                    {video.aiAnalysis && <p className="mt-1 text-xs text-slate-600 line-clamp-1">{video.aiAnalysis.summary}</p>}
                  </div>
                  <button type="button" onClick={() => setSelectedVideo(video)} className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"><Play size={14} />검수 열기</button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
