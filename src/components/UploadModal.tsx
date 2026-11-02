import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { uploadVideoFile } from '../utils/s3Storage';
import { newFirestoreId } from '../utils/firebaseStore';
import { X, Upload, FileVideo, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export const UploadModal: React.FC = () => {
  const {
    uploadModalOpen,
    setUploadModalOpen,
    addNewVideo,
    setSelectedVideo,
    projects,
    activeProject
  } = useApp();
  const [projectId, setProjectId] = useState(activeProject?.id || projects[0]?.id || '');
  const [weekTitle, setWeekTitle] = useState('1주차');
  const [sessionTitle, setSessionTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const project = projects.find(item => item.id === projectId);

  useEffect(() => {
    if (!projectId && projects.length) setProjectId(activeProject?.id || projects[0].id);
  }, [activeProject?.id, projectId, projects]);

  useEffect(() => {
    if (!uploadModalOpen) {
      setError('');
      setUploadProgress(0);
      setIsUploading(false);
      setSelectedFile(null);
      setSessionTitle('');
    }
  }, [uploadModalOpen]);

  if (!uploadModalOpen) return null;

  const processFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('video/') && !/\.(mp4|webm|mov|m4v|mkv)$/i.test(file.name)) {
      setError('MP4, WebM, MOV, M4V 또는 MKV 영상 파일을 선택해 주세요.');
      return;
    }
    setError('');
    setSelectedFile(file);
    if (!sessionTitle.trim()) {
      const cleanBaseName = file.name.replace(/\.[^/.]+$/, '');
      setSessionTitle(cleanBaseName);
    }
    const objectUrl = URL.createObjectURL(file);
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => {
      setDuration(Number.isFinite(probe.duration) ? Math.round(probe.duration) : 0);
      URL.revokeObjectURL(objectUrl);
    };
    probe.onerror = () => URL.revokeObjectURL(objectUrl);
    probe.src = objectUrl;
  };

  const getWeekNumber = (wTitle?: string) => {
    const match = wTitle?.match(/\d+/);
    return match ? Number(match[0]) : 1;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!project) {
      setError('먼저 프로젝트를 등록해 주세요.');
      return;
    }
    const title = sessionTitle.trim();
    if (!title) {
      setError('차시명을 입력해 주세요 (예: 1차시 강의 개요).');
      return;
    }
    if (!selectedFile) {
      setError('업로드할 실제 영상 파일을 선택해 주세요.');
      return;
    }

    const videoId = newFirestoreId('videos');
    const finalWeekTitle = weekTitle.trim() || '1주차';
    const weekId = getWeekNumber(finalWeekTitle);
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const s3Key = await uploadVideoFile({
        projectName: project.name,
        lessonName: title,
        fileName: selectedFile.name,
        videoId,
        file: selectedFile,
        onProgress: setUploadProgress
      });
      const newVideo = addNewVideo({
        id: videoId,
        projectId: project.id,
        s3Key,
        mimeType: selectedFile.type || 'video/mp4',
        sizeBytes: selectedFile.size,
        weekId,
        weekTitle: finalWeekTitle,
        sessionTitle: title,
        fileName: selectedFile.name,
        videoUrl: '',
        duration,
        fileSize: selectedFile.size >= 1024 ** 3
          ? (selectedFile.size / 1024 ** 3).toFixed(1) + ' GB'
          : Math.max(1, Math.round(selectedFile.size / 1024 ** 2)) + ' MB'
      });
      setSelectedVideo(newVideo);
      setUploadModalOpen(false);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '업로드를 완료하지 못했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">실제 강의 영상 등록</h3>
              <p className="text-xs text-slate-500">실제 영상 파일을 브라우저/클라우드 저장소에 보관하고 검수 목록에 즉시 연결합니다.</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isUploading}
            onClick={() => setUploadModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 disabled:opacity-40"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs font-bold text-slate-700">
              대상 프로젝트
              <select
                value={projectId}
                onChange={event => setProjectId(event.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium"
              >
                {projects.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.alias})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold text-slate-700">
              주차 (Week)
              <input
                value={weekTitle}
                onChange={event => setWeekTitle(event.target.value)}
                placeholder="예: 1주차"
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </label>
          </div>

          <label className="block text-xs font-bold text-slate-700">
            차시명 (Session Title)
            <input
              value={sessionTitle}
              onChange={event => setSessionTitle(event.target.value)}
              placeholder="예: 1차시 강의 오리엔테이션 및 학습 개요"
              className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </label>

          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-6 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl bg-slate-50 text-center disabled:opacity-50 cursor-pointer transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,.mkv"
              onChange={event => processFile(event.target.files?.[0])}
              className="hidden"
            />
            {selectedFile ? (
              <>
                <FileVideo className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                <strong className="block text-sm text-slate-800">{selectedFile.name}</strong>
                <span className="text-xs text-slate-500">
                  {(selectedFile.size / 1024 ** 2).toFixed(1)} MB
                  {duration > 0 ? ' · ' + Math.floor(duration / 60) + '분 ' + (duration % 60) + '초' : ''}
                </span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <strong className="block text-sm text-slate-700">실제 영상 파일을 선택하세요 (클릭 또는 파일 끌어놓기)</strong>
                <span className="text-xs text-slate-500 mt-1 block">
                  MP4, WebM, MOV 지원 · GitHub+Vercel 로컬 스토리지에 영구 보존되어 고화질로 즉시 재생됩니다.
                </span>
              </>
            )}
          </button>

          {isUploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-blue-800">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  동영상 저장소 등록 중...
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-blue-100 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: uploadProgress + '%' }}
                />
              </div>
            </div>
          )}
          {error && <div role="alert" className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-700 flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
          {!error && !isUploading && selectedFile && <div className="text-xs text-emerald-700 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" />파일을 선택했습니다. 업로드 전에는 검수 목록에 등록되지 않습니다.</div>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" disabled={isUploading} onClick={() => setUploadModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold disabled:opacity-50">취소</button>
            <button type="submit" disabled={isUploading || !project} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" />{isUploading ? '업로드 중...' : '영상 등록'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
