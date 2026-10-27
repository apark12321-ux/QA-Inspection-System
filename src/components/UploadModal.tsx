import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Upload,
  Film,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileVideo
} from 'lucide-react';

export const UploadModal: React.FC = () => {
  const { uploadModalOpen, setUploadModalOpen, addNewVideo, setSelectedVideo } = useApp();

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [duration, setDuration] = useState<number>(600);
  const [fileSizeStr, setFileSizeStr] = useState<string>('');

  // Form Fields
  const [weekId, setWeekId] = useState<number>(4);
  const [weekTitle, setWeekTitle] = useState<string>('AI 기반 후반 프로덕션 및 사운드 디자인');
  const [sessionTitle, setSessionTitle] = useState<string>('보이스 클론과 다국어 더빙 검수 실습');
  const [fileName, setFileName] = useState<string>('');

  // Upload Progress simulation
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!uploadModalOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|mkv)$/i)) {
      alert('동영상 파일(.mp4, .webm, .mov)만 업로드할 수 있습니다.');
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);

    // Calculate file size in MB
    const mb = (file.size / (1024 * 1024)).toFixed(0);
    setFileSizeStr(`${mb} MB`);

    // Create object URL for local preview and metadata inspection
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Detect duration using temporary video element
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = objectUrl;
    tempVideo.onloadedmetadata = () => {
      setDuration(Math.round(tempVideo.duration) || 600);
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    setIsUploading(true);
    setUploadProgress(10);

    // Simulate S3 presigned multipart upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          setTimeout(() => {
            const newVideo = addNewVideo({
              weekId,
              weekTitle,
              sessionTitle,
              fileName: fileName.trim(),
              videoUrl: previewUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
              duration,
              fileSize: fileSizeStr || '180 MB'
            });

            setIsUploading(false);
            setUploadModalOpen(false);
            setSelectedVideo(newVideo);
          }, 600);
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">새 검수 동영상 등록 (드래그 앤 드롭)</h3>
              <p className="text-xs text-slate-500">AWS S3 Presigned URL 직접 업로드 및 트랜스코딩</p>
            </div>
          </div>

          <button
            onClick={() => setUploadModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Drag & Drop Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50/60'
                : selectedFile
                ? 'border-emerald-500 bg-emerald-50/40'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex flex-col items-center">
                <FileVideo className="w-10 h-10 text-emerald-600 mb-2" />
                <p className="text-sm font-bold text-slate-800">{selectedFile.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  용량: {fileSizeStr} · 감지 길이: {Math.round(duration / 60)}분
                </p>
                <span className="mt-2 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  파일 선택 완료 (클릭하여 변경)
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-10 h-10 text-slate-400 mb-2" />
                <p className="text-sm font-bold text-slate-700">
                  동영상 파일을 이곳에 드래그하거나 클릭하여 선택하세요
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  MP4, WebM, MOV 지원 (최대 5GB S3 멀티파트 전송)
                </p>
              </div>
            )}
          </div>

          {/* Metadata Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                주차 구분
              </label>
              <select
                value={weekId}
                onChange={e => {
                  const id = parseInt(e.target.value, 10);
                  setWeekId(id);
                  if (id === 1) setWeekTitle('AI 시대, 새로운 스토리텔링의 문법');
                  else if (id === 2) setWeekTitle('생성형 AI를 활용한 시나리오 디벨롭');
                  else if (id === 3) setWeekTitle('멀티모달 비주얼 스토리보딩');
                  else setWeekTitle('AI 기반 후반 프로덕션 및 사운드 디자인');
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-800 font-medium"
              >
                <option value={1}>1주차</option>
                <option value={2}>2주차</option>
                <option value={3}>3주차</option>
                <option value={4}>4주차 (신규)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                동영상 파일명
              </label>
              <input
                type="text"
                value={fileName}
                onChange={e => setFileName(e.target.value)}
                placeholder="예) 26story04_01_01.mp4"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono text-slate-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              차시 상세 제목
            </label>
            <input
              type="text"
              value={sessionTitle}
              onChange={e => setSessionTitle(e.target.value)}
              placeholder="예) 보이스 클론과 다국어 더빙 검수 실습"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900"
              required
            />
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 p-3 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  S3 멀티파트 업로드 및 MediaConvert 작업 등록 중...
                </span>
                <span className="font-mono">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setUploadModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              취소
            </button>

            <button
              type="submit"
              disabled={isUploading || !fileName.trim()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>업로드 및 검수 큐 인입</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
