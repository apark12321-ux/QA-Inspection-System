import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { HardDrive, Play, Trash2, Video } from 'lucide-react';

function formatBytes(bytes: number): string {
  if (!bytes) return '용량 정보 없음';
  if (bytes >= 1024 ** 3) return (bytes / 1024 ** 3).toFixed(1) + ' GB';
  return (bytes / 1024 ** 2).toFixed(1) + ' MB';
}

export const MediaStorageManager: React.FC = () => {
  const { videos, projects, setSelectedVideo, deleteVideo } = useApp();
  const storedCount = videos.filter(video => Boolean(video.s3Key)).length;
  const externalCount = videos.length - storedCount;
  const knownBytes = useMemo(() => videos.reduce((total, video) => total + (video.sizeBytes || 0), 0), [videos]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><HardDrive size={20} /></div>
          <div><h2 className="text-lg font-bold text-slate-900">영상 자산</h2><p className="mt-1 text-sm text-slate-500">등록된 실제 영상 원본과 외부 링크를 확인합니다.</p></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><span className="text-xs text-slate-500">전체 영상</span><strong className="block mt-1 text-2xl text-slate-900">{videos.length}</strong></div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><span className="text-xs text-slate-500">S3 원본 파일</span><strong className="block mt-1 text-2xl text-slate-900">{storedCount}</strong></div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><span className="text-xs text-slate-500">알려진 파일 용량 합계</span><strong className="block mt-1 text-2xl text-slate-900">{formatBytes(knownBytes)}</strong></div>
        </div>
        {externalCount > 0 && <p className="mt-3 text-xs text-slate-500">외부 링크 영상 {externalCount}개는 S3 원본 용량에 포함되지 않습니다.</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {videos.length === 0 ? (
          <div className="px-5 py-14 text-center"><Video className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-sm text-slate-500">등록된 영상이 없습니다.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr><th className="px-5 py-3 font-semibold">영상</th><th className="px-5 py-3 font-semibold">프로젝트 · 차시</th><th className="px-5 py-3 font-semibold">저장 방식</th><th className="px-5 py-3 font-semibold">용량</th><th className="px-5 py-3 text-right font-semibold">작업</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {videos.map(video => {
                  const project = projects.find(item => item.id === video.projectId);
                  return (
                    <tr key={video.id}>
                      <td className="px-5 py-3.5"><strong className="block text-sm text-slate-900">{video.fileName}</strong><span className="text-xs text-slate-500">{video.weekTitle}</span></td>
                      <td className="px-5 py-3.5"><span className="block text-sm text-slate-800">{project?.name || '프로젝트 미지정'}</span><span className="text-xs text-slate-500">{video.sessionTitle}</span></td>
                      <td className="px-5 py-3.5"><span className={'inline-flex px-2 py-1 rounded-full text-[11px] font-semibold ' + (video.s3Key ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600')}>{video.s3Key ? 'S3 원본' : '외부 링크'}</span></td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{video.sizeBytes ? formatBytes(video.sizeBytes) : video.fileSize}</td>
                      <td className="px-5 py-3.5"><div className="flex justify-end gap-1">
                        <button type="button" onClick={() => setSelectedVideo(video)} title="검수 플레이어에서 열기" className="p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"><Play size={16} /></button>
                        <button type="button" onClick={() => { if (window.confirm(`'${video.fileName}' 영상 원본과 검수 기록을 삭제할까요?`)) deleteVideo(video.id); }} title="영상 삭제" className="p-2 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
