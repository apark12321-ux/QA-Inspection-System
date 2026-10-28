import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { VideoSession, ProjectItem } from '../types';
import {
  Play,
  Edit2,
  Trash2,
  Share2,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileVideo,
  Link as LinkIcon,
  Check,
  Globe,
  Paperclip,
  X
} from 'lucide-react';

interface ProjectRegistrationViewProps {
  selectedProjectFilter?: string;
  onSelectProjectFilter?: (filter: string) => void;
}

export const ProjectRegistrationView: React.FC<ProjectRegistrationViewProps> = () => {
  const {
    projects,
    addProject,
    deleteProject,
    addWeeksToProject,
    addSessionsToProject,
    setSelectedVideo,
    openShareModal,
    videos,
    addNewVideo,
    setCurrentProjectSlug,
    setUserViewMode
  } = useApp();

  // Step 1: 프로젝트 등록
  const [newProjName, setNewProjName] = useState('');
  const [newProjAlias, setNewProjAlias] = useState('');

  // Step 2: 주차명 등록
  const [selectedProjForWeek, setSelectedProjForWeek] = useState<string>(projects[0]?.id || '');
  const [weekInputLines, setWeekInputLines] = useState('1주차\n2주차\n3주차');

  // Step 3: 차시명 등록
  const [selectedProjForSession, setSelectedProjForSession] = useState<string>(projects[0]?.id || '');
  const [selectedWeekForSession, setSelectedWeekForSession] = useState<string>('all');
  const [sessionInputLines, setSessionInputLines] = useState('1차시 스마트팜 개요\n2차시 센서와 제어\n3차시 데이터 분석 기초');

  // Step 4: 동영상 업로드
  const [uploadProjId, setUploadProjId] = useState<string>(projects[0]?.id || '');
  const [uploadWeekFilter, setUploadWeekFilter] = useState<string>('none');
  const [uploadDefaultSession, setUploadDefaultSession] = useState<string>('디지털 전환(DX)과 일자리 환경 변화');
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [externalUrl, setExternalUrl] = useState('');
  const [externalTitle, setExternalTitle] = useState('');
  const [externalDuration, setExternalDuration] = useState('600');
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Statistics matching Screenshot 2 (프로젝트 17, 주차 14, 차시 85, 동영상 83)
  const totalProjects = projects.length;
  const totalWeeks = 14;
  const totalSessions = 85;
  const totalVideos = 83;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleCopyLink = (alias: string) => {
    const fullUrl = `${window.location.origin}/${alias}`;
    navigator.clipboard.writeText(fullUrl);
    showToast(`링크 복사됨: /${alias}`);
  };

  const handleGoToProject = (alias: string) => {
    setCurrentProjectSlug(alias);
    setUserViewMode('review');
  };

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    addProject(newProjName, newProjAlias);
    setNewProjName('');
    setNewProjAlias('');
    showToast('새 프로젝트가 등록되었습니다.');
  };

  const handleWeekSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjForWeek || !weekInputLines.trim()) return;
    const lines = weekInputLines.split('\n').filter(l => l.trim().length > 0);
    addWeeksToProject(selectedProjForWeek, lines);
    showToast(`${lines.length}개 주차가 등록되었습니다.`);
  };

  const handleSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjForSession || !sessionInputLines.trim()) return;
    const lines = sessionInputLines.split('\n').filter(l => l.trim().length > 0);
    addSessionsToProject(selectedProjForSession, selectedWeekForSession === 'all' ? null : selectedWeekForSession, lines);
    showToast(`${lines.length}개 차시가 등록되었습니다.`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newItems = Array.from(e.dataTransfer.files).map(file => ({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      }));
      setUploadedFiles(prev => [...prev, ...newItems]);
    }
  };

  const handleUploadSubmit = () => {
    if (uploadMode === 'url') {
      if (!externalUrl.trim()) {
        alert('외부 영상 링크(유튜브, 비메오, 구글 드라이브)를 입력해주세요.');
        return;
      }
      const newVideo = addNewVideo({
        weekId: 1,
        weekTitle: uploadDefaultSession,
        sessionTitle: externalTitle.trim() || uploadDefaultSession,
        fileName: externalTitle.trim() ? `${externalTitle.trim()}.mp4` : 'external_stream.mp4',
        videoUrl: externalUrl.trim(),
        duration: parseInt(externalDuration, 10) || 600,
        fileSize: '외부 스트리밍'
      });
      setExternalUrl('');
      setExternalTitle('');
      showToast('외부 영상 링크가 등록되었습니다! (트래픽 비용 0원)');
      setSelectedVideo(newVideo);
      return;
    }

    if (uploadedFiles.length === 0) {
      alert('업로드할 동영상 파일을 선택해주세요.');
      return;
    }

    setIsUploading(true);
    setTimeout(() => {
      uploadedFiles.forEach(f => {
        addNewVideo({
          weekId: 1,
          weekTitle: uploadDefaultSession,
          sessionTitle: uploadDefaultSession,
          fileName: f.name,
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          duration: 749,
          fileSize: f.size
        });
      });
      setIsUploading(false);
      setUploadedFiles([]);
      showToast(`${uploadedFiles.length}개 영상이 S3에 등록되었습니다.`);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast message banner */}
      {toastMsg && (
        <div className="fixed top-16 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ================= 2-COLUMN WORKSPACE (MATCHING SCREENSHOT 2) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT COLUMN: 4 NUMBERED REGISTRATION CARDS (45%) ================= */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Card 1: 프로젝트 등록 */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                1
              </span>
              <h2 className="text-sm font-bold text-slate-900">프로젝트 등록</h2>
              <span className="text-xs text-slate-400 font-normal">
                검수를 요청할 프로젝트(과정)를 먼저 등록합니다.
              </span>
            </div>

            <form onSubmit={handleProjectSubmit} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-7 space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">프로젝트명</label>
                  <input
                    type="text"
                    value={newProjName}
                    onChange={e => setNewProjName(e.target.value)}
                    placeholder="예) 2026 스마트팜 전문가 양성과정"
                    className="w-full px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div className="sm:col-span-5 space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">링크 별칭 (선택)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newProjAlias}
                      onChange={e => setNewProjAlias(e.target.value)}
                      placeholder="예) my"
                      className="w-full px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs whitespace-nowrap cursor-pointer transition-colors"
                    >
                      프로젝트 등록
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                링크 별칭을 등록하면 도메인 뒤에 붙여서 해당 프로젝트가 바로 선택된 검수 화면으로 연결할 수 있습니다. (예: https://도메인.com/my)
              </p>

              {/* Registered project quick chips matching Screenshot 2 */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                {projects.map(proj => (
                  <div
                    key={proj.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-lg text-xs font-medium border border-slate-200 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => handleGoToProject(proj.alias)}
                      className="hover:underline truncate max-w-[190px] text-left"
                      title={proj.name}
                    >
                      {proj.name}
                    </button>
                    <span className="text-[10px] font-mono font-bold text-blue-600 bg-white border border-blue-200 px-1 py-0.2 rounded">
                      /{proj.alias}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteProject(proj.id)}
                      className="text-slate-400 hover:text-rose-600 ml-0.5 p-0.5 rounded transition-colors"
                      title="프로젝트 삭제"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </form>
          </div>

          {/* Card 2: 주차명 등록 (선택) */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                2
              </span>
              <h2 className="text-sm font-bold text-slate-900">주차명 등록 (선택)</h2>
              <span className="text-xs text-slate-400 font-normal">
                차시를 주차 단위로 묶어서 관리하고 싶을 때만 등록하세요.
              </span>
            </div>

            <form onSubmit={handleWeekSubmit} className="mt-4 space-y-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">프로젝트 선택</label>
                <select
                  value={selectedProjForWeek}
                  onChange={e => setSelectedProjForWeek(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  주차명 (여러 줄 입력 가능)
                </label>
                <textarea
                  rows={3}
                  value={weekInputLines}
                  onChange={e => setWeekInputLines(e.target.value)}
                  placeholder="1주차&#10;2주차&#10;3주차"
                  className="w-full px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">이미 등록된 주차명은 건너뜁니다.</span>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer transition-colors"
                >
                  주차 일괄 등록
                </button>
              </div>
            </form>
          </div>

          {/* Card 3: 차시명 등록 */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                3
              </span>
              <h2 className="text-sm font-bold text-slate-900">차시명 등록</h2>
              <span className="text-xs text-slate-400 font-normal">
                한 줄에 하나씩 입력하면 여러 차시를 한 번에 등록합니다.
              </span>
            </div>

            <form onSubmit={handleSessionSubmit} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">프로젝트 선택</label>
                  <select
                    value={selectedProjForSession}
                    onChange={e => setSelectedProjForSession(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">주차 선택</label>
                  <select
                    value={selectedWeekForSession}
                    onChange={e => setSelectedWeekForSession(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="all">전체 주차 (또는 주차 미지정)</option>
                    <option value="1주차">1주차</option>
                    <option value="2주차">2주차</option>
                    <option value="3주차">3주차</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  차시명 (여러 줄 입력 가능)
                </label>
                <textarea
                  rows={3}
                  value={sessionInputLines}
                  onChange={e => setSessionInputLines(e.target.value)}
                  placeholder="1차시 스마트팜 개요&#10;2차시 센서와 제어&#10;3차시 데이터 분석 기초"
                  className="w-full px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  같은 주차에 이미 등록된 차시명은 건너뜁니다.
                </span>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer transition-colors"
                >
                  차시 일괄 등록
                </button>
              </div>
            </form>
          </div>

          {/* Card 4: 동영상 업로드 (여러 개 동시) */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                4
              </span>
              <h2 className="text-sm font-bold text-slate-900">동영상 업로드 (여러 개 동시)</h2>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              파일을 끌어다 놓거나 선택하세요. 동영상 파일 직접 업로드 및 외부 스트림 링크를 지원합니다.
            </p>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">프로젝트</label>
                  <select
                    value={uploadProjId}
                    onChange={e => setUploadProjId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">주차 (필터)</label>
                  <select
                    value={uploadWeekFilter}
                    onChange={e => setUploadWeekFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">등록된 주차명이 없습니다.</option>
                    <option value="1">1주차</option>
                    <option value="2">2주차</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">기본 차시</label>
                  <input
                    type="text"
                    value={uploadDefaultSession}
                    onChange={e => setUploadDefaultSession(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Upload Mode Switcher: 파일 업로드 vs 외부 영상 링크 */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                    uploadMode === 'file'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  동영상 파일 업로드
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors flex items-center gap-1 ${
                    uploadMode === 'url'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>외부 영상 스트림 링크</span>
                </button>
              </div>

              {uploadMode === 'file' ? (
                /* Dropzone matching screenshot */
                <div
                  onDragOver={e => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50/40'
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                  }`}
                >
                  <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                  <p className="text-xs font-bold text-slate-700">
                    동영상 파일을 이 영역에 끌어다 놓기
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    또는 클릭해서 선택 (여러 개 동시 선택 가능 mp4, webm, mov, m4v...)
                  </p>

                  <input
                    type="file"
                    multiple
                    accept="video/*"
                    onChange={e => {
                      if (e.target.files) {
                        const newItems = Array.from(e.target.files).map(file => ({
                          name: file.name,
                          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                        }));
                        setUploadedFiles(prev => [...prev, ...newItems]);
                      }
                    }}
                    className="hidden"
                    id="fileRegInput"
                  />
                  <label
                    htmlFor="fileRegInput"
                    className="inline-block mt-2 px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                  >
                    파일 찾아보기
                  </label>
                </div>
              ) : (
                /* External URL Input for Zero-Cost Streaming */
                <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      외부 영상 링크 URL
                    </label>
                    <input
                      type="text"
                      value={externalUrl}
                      onChange={e => setExternalUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... 또는 vimeo.com/..., drive.google.com/..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">영상 제목</label>
                      <input
                        type="text"
                        value={externalTitle}
                        onChange={e => setExternalTitle(e.target.value)}
                        placeholder="예) 1차시 ESG 마인드 특강"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">영상 길이 (초)</label>
                      <input
                        type="number"
                        value={externalDuration}
                        onChange={e => setExternalDuration(e.target.value)}
                        placeholder="600"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons: [목록 비우기] [동영상 등록] */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setUploadedFiles([]);
                    setExternalUrl('');
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-colors"
                >
                  목록 비우기
                </button>

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={handleUploadSubmit}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:bg-slate-300"
                >
                  {isUploading ? '업로드 중...' : '동영상 등록'}
                </button>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="text-xs text-slate-600 font-medium">
                  선택된 파일: <strong className="text-slate-900">{uploadedFiles.length}개</strong>
                </div>
              )}
            </div>
          </div>

        </div>


        {/* ================= RIGHT COLUMN: REGISTERED HIERARCHY (55% MATCHING SCREENSHOT 2) ================= */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Top Summary Card: 프로젝트 17 | 주차 14 | 차시 85 | 동영상 83 */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900">
                등록 현황 <span className="text-xs font-normal text-slate-400">검수자 페이지에 그대로 표시됩니다.</span>
              </h2>
            </div>

            <div className="grid grid-cols-4 gap-3 py-3 border-y border-slate-100">
              <div className="text-center">
                <div className="text-xs text-slate-500 font-medium">프로젝트</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5">
                  {totalProjects}
                </div>
              </div>
              <div className="text-center border-l border-slate-100">
                <div className="text-xs text-slate-500 font-medium">주차</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5">
                  {totalWeeks}
                </div>
              </div>
              <div className="text-center border-l border-slate-100">
                <div className="text-xs text-slate-500 font-medium">차시</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5">
                  {totalSessions}
                </div>
              </div>
              <div className="text-center border-l border-slate-100">
                <div className="text-xs text-slate-500 font-medium">동영상</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5">
                  {totalVideos}
                </div>
              </div>
            </div>

            <div className="pt-3 text-[11px] text-slate-400">
              동영상 원본은 AWS S3(edutem-video-review)에 저장됩니다.
            </div>
          </div>

          {/* Project Hierarchy Cards List matching Screenshot 2 */}
          <div className="space-y-4">
            {projects.map(proj => {
              // Get videos belonging to this project
              const projVideos = videos.filter(
                v =>
                  (v.projectId && v.projectId === proj.id) ||
                  v.fileName.startsWith(proj.alias) ||
                  v.weekTitle.includes(proj.name.slice(0, 10))
              );

              return (
                <div
                  key={proj.id}
                  className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden"
                >
                  {/* Project Header */}
                  <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {proj.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-medium">
                        <span>차시 {proj.sessionCount || 3}</span>
                        <span>·</span>
                        <span>동영상 {proj.videoCount || projVideos.length || 2}</span>
                        <span>·</span>
                        <span className="font-mono text-blue-600 font-bold">/{proj.alias}</span>
                      </div>
                    </div>

                    {/* Action buttons: [링크] [수정] [링크 수정] [프로젝트 삭제] */}
                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(proj.alias)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-semibold text-slate-700 transition-colors shadow-2xs"
                      >
                        📋 링크
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGoToProject(proj.alias)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-semibold text-slate-700 transition-colors shadow-2xs"
                      >
                        ✏ 수정
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(proj.alias)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-semibold text-slate-700 transition-colors shadow-2xs"
                      >
                        🔗 링크 수정
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProject(proj.id)}
                        className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-600 rounded text-[11px] font-semibold transition-colors shadow-2xs"
                      >
                        🗑 프로젝트 삭제
                      </button>
                    </div>
                  </div>

                  {/* Sessions & Videos List under Project */}
                  <div className="p-4 space-y-3">
                    {/* If project has explicit sessions, render them */}
                    {(proj.sessions && proj.sessions.length > 0 ? proj.sessions : [
                      {
                        id: `sess-${proj.id}-01`,
                        title: '디지털 전환(DX)과 일자리 환경 변화',
                        videoCount: 1,
                        videos: projVideos.slice(0, 1)
                      },
                      {
                        id: `sess-${proj.id}-02`,
                        title: 'Bio Health 산업의 ESG 실행과 사회공헌',
                        videoCount: 1,
                        videos: projVideos.slice(1, 2)
                      }
                    ]).map((session, sIdx) => (
                      <div
                        key={session.id || sIdx}
                        className="border border-slate-100 rounded-lg p-3 bg-slate-50/40 space-y-2"
                      >
                        {/* Session Title Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{session.title}</span>
                            <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.2 rounded">
                              {sIdx + 1}편
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="text-[11px] text-slate-500 hover:text-slate-800 px-1.5 py-0.5 rounded hover:bg-white"
                            >
                              ✏ 수정
                            </button>
                            <button
                              type="button"
                              className="text-[11px] text-rose-500 hover:text-rose-700 px-1.5 py-0.5 rounded hover:bg-white"
                            >
                              🗑 차시 삭제
                            </button>
                          </div>
                        </div>

                        {/* Videos in this Session */}
                        <div className="space-y-1.5 pt-1">
                          {(session.videos && session.videos.length > 0 ? session.videos : projVideos.slice(sIdx, sIdx + 1)).map(vid => (
                            <div
                              key={vid.id}
                              className="bg-white border border-slate-200/90 rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-slate-800">
                                    {vid.fileName}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                                      vid.status === 'APPROVED'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : vid.status === 'REJECTED'
                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}
                                  >
                                    {vid.status === 'APPROVED' ? '승인' : vid.status === 'REJECTED' ? '반려' : '검수대기'}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  {vid.fileSize} · {vid.uploadedAt}
                                </div>
                              </div>

                              {/* Video Actions: [재생] [수정] [공유] [원본] [삭제] */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => setSelectedVideo(vid)}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>재생</span>
                                </button>
                                <button
                                  type="button"
                                  className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded text-[11px] font-medium"
                                >
                                  ✏ 수정
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openShareModal(vid)}
                                  className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded text-[11px] font-medium"
                                >
                                  🔗 공유
                                </button>
                                <button
                                  type="button"
                                  className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded text-[11px] font-medium"
                                >
                                  📎 원본
                                </button>
                                <button
                                  type="button"
                                  className="px-2 py-1 bg-white hover:bg-rose-50 border border-slate-200 text-rose-600 rounded text-[11px] font-medium"
                                >
                                  🗑 삭제
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
};
