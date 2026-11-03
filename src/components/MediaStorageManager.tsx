import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { HardDrive, Play, Trash2, Video, Upload } from 'lucide-react';

function formatBytes(bytes: number): string {
  if (!bytes) return '용량 정보 없음';
  if (bytes >= 1024 ** 3) return (bytes / 1024 ** 3).toFixed(1) + ' GB';
  return (bytes / 1024 ** 2).toFixed(1) + ' MB';
}

export const MediaStorageManager: React.FC = () => {
  const { videos, projects, setSelectedVideo, deleteVideo, clearAllVideos, setUploadModalOpen } = useApp();
  const storedCount = videos.filter(video => Boolean(video.s3Key)).length;
  const knownBytes = useMemo(() => videos.reduce((total, video) => total + (video.sizeBytes || 0), 0), [videos]);

  const handleClearAll = () => {
    if (window.confirm('저장된 모든 영상 데이터와 브라우저 캐시 잔여물을 완전히 삭제하고 0건으로 초기화할까요?')) {
      clearAllVideos();
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <HardDrive size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">영상 자산 스토리지 관리</h2>
              <p className="mt-1 text-sm text-slate-500">
                실제 업로드된 원본 영상 파일(IndexedDB 로컬 스토리지 / S3)만 확인하고 관리합니다. (가짜 목데이터 배제)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {videos.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95"
                title="과거 캐시 잔여물이나 미업로드 가짜 항목을 완전히 정리하고 0건으로 리셋합니다"
              >
                <Trash2 className="w-4 h-4" />
                <span>저장소 전체 비우기 (초기화)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer self-start sm:self-auto active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>동영상 업로드</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs text-slate-500">실제 업로드 영상</span>
            <strong className="block mt-1 text-2xl text-slate-900">{videos.length}건</strong>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs text-slate-500">실제 원본 보관 파일</span>
            <strong className="block mt-1 text-2xl text-slate-900">{storedCount}건</strong>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs text-slate-500">업로드 파일 실측 용량</span>
            <strong className="block mt-1 text-2xl text-slate-900">{videos.length === 0 ? '0 MB' : formatBytes(knownBytes)}</strong>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {videos.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Video className="w-6 h-6 text-slate-400" />
            </div>
            <strong className="block text-base font-bold text-slate-800">
              실제 업로드된 강의 영상이 없습니다 (0건)
            </strong>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              본 저장소는 사용자가 상단의 [동영상 업로드]를 통해 직접 등록한 실제 영상 원본(MP4/WebM/MOV)만 보관합니다. 허구의 목데이터 및 껍데기 파일은 전부 배제되어 있습니다.
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setUploadModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>실제 강의 영상 업로드하기</span>
              </button>
            </div>
          </div>
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
                      <td className="px-5 py-3.5"><span className="inline-flex px-2 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">{video.s3Key ? 'S3 원본 파일' : '스토리지 파일'}</span></td>
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
