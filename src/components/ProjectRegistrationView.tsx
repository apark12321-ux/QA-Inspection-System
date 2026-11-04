import React, { useState, useMemo, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';
import { inspectVideoDuration, uploadVideoFile } from '../utils/s3Storage';
import { newFirestoreId } from '../utils/firebaseStore';
import {
  Play,
  Upload,
  Check,
  X,
  Plus,
  QrCode,
  Download,
  Copy,
  Film,
  Building2,
  ExternalLink,
  ShieldCheck,
  FolderKanban,
  FileCheck,
  Clock,
  Sparkles,
  HelpCircle,
  FileVideo,
  Loader2,
  Trash2,
  Globe,
  RefreshCw
} from 'lucide-react';

export const ProjectRegistrationView: React.FC = () => {
  const {
    projects,
    addProject,
    deleteProject,
    setSelectedVideo,
    openShareModal,
    deleteVideo,
    videos,
    addNewVideo,
    setCurrentProjectSlug,
    setUserViewMode,
    setPortalMode,
    currentUser,
    setCurrentUserName,
    deployDomain,
    setDeployDomain,
    exportSyncData,
    importSyncData
  } = useApp();

  // 1. 프로젝트 등록 상태
  const [newProjName, setNewProjName] = useState('');
  const [newProjAlias, setNewProjAlias] = useState('');

  // 2. 실제 영상 원스톱 업로드 상태
  const [uploadProjId, setUploadProjId] = useState<string>(projects[0]?.id || '');
  const [uploadWeekTitle, setUploadWeekTitle] = useState('1주차');
  const [uploadSessionTitle, setUploadSessionTitle] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDuration, setFileDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // 3. QR코드 모달 상태 (프로젝트 전체 또는 개별 차시 영상)
  interface QrModalTarget {
    type: 'project' | 'video';
    title: string;
    subtitle: string;
    badge: string;
    url: string;
    downloadFileName: string;
  }
  const [qrModalTarget, setQrModalTarget] = useState<QrModalTarget | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // 4. 담당자 / 검수자 이름 설정 상태
  const [editingUserName, setEditingUserName] = useState(false);
  const [tempUserName, setTempUserName] = useState(currentUser.name || '검수자');

  // 5. 배포 도메인 설정 상태
  const [isEditingDomain, setIsEditingDomain] = useState(false);
  const [tempDomain, setTempDomain] = useState(deployDomain);

  useEffect(() => {
    setTempDomain(deployDomain);
  }, [deployDomain]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!uploadProjId && projects.length) {
      setUploadProjId(projects[0].id);
    }
  }, [uploadProjId, projects]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newProjName.trim();
    if (!cleanName) {
      showToast('기관/프로젝트명을 입력해 주세요.');
      return;
    }
    const cleanAlias = newProjAlias.trim().replace(/^\//, '');
    addProject(cleanName, cleanAlias);
    setNewProjName('');
    setNewProjAlias('');
    showToast(`새 프로젝트가 등록되었습니다: ${cleanName}`);
  };

  const handleProcessFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('video/') && !/\.(mp4|webm|mov|m4v|mkv)$/i.test(file.name)) {
      setUploadError('MP4, WebM, MOV, M4V 또는 MKV 영상 파일을 선택해 주세요.');
      return;
    }
    setUploadError(null);
    setSelectedFile(file);
    if (!uploadSessionTitle.trim()) {
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      setUploadSessionTitle(baseName);
    }
    const objectUrl = URL.createObjectURL(file);
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => {
      setFileDuration(Number.isFinite(probe.duration) ? Math.round(probe.duration) : 0);
      URL.revokeObjectURL(objectUrl);
    };
    probe.onerror = () => URL.revokeObjectURL(objectUrl);
    probe.src = objectUrl;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleVideoUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const project = projects.find(item => item.id === uploadProjId);
    if (!project) {
      setUploadError('영상을 등록할 프로젝트를 먼저 선택해 주세요.');
      return;
    }
    if (!selectedFile) {
      setUploadError('업로드할 실제 영상 파일을 선택해 주세요.');
      return;
    }
    const sessionName = uploadSessionTitle.trim() || selectedFile.name;
    const weekTitle = uploadWeekTitle.trim() || '1주차';
    const weekNum = Number(weekTitle.match(/\d+/)?.[0]) || 1;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const videoId = newFirestoreId('videos');
      const s3Key = await uploadVideoFile({
        projectName: project.name,
        lessonName: sessionName,
        fileName: selectedFile.name,
        videoId,
        file: selectedFile,
        onProgress: setUploadProgress
      });

      const dur = fileDuration > 0 ? fileDuration : await inspectVideoDuration(selectedFile);

      addNewVideo({
        id: videoId,
        projectId: project.id,
        s3Key,
        mimeType: selectedFile.type || 'video/mp4',
        sizeBytes: selectedFile.size,
        weekId: weekNum,
        weekTitle,
        sessionTitle: sessionName,
        fileName: selectedFile.name,
        videoUrl: '',
        duration: dur,
        fileSize:
          selectedFile.size >= 1024 ** 3
            ? (selectedFile.size / 1024 ** 3).toFixed(1) + ' GB'
            : Math.max(1, Math.round(selectedFile.size / 1024 ** 2)) + ' MB'
      });

      setSelectedFile(null);
      setUploadSessionTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      showToast(`'${selectedFile.name}' 영상이 성공적으로 등록되었습니다.`);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '영상 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getProposalUrl = (alias: string) => {
    const cleanAlias = (alias || '').trim().replace(/^\/+/, '');
    const base = (deployDomain || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, '');
    return `${base}/?p=${encodeURIComponent(cleanAlias)}`;
  };

  const getVideoReviewUrl = (alias: string, videoId: string) => {
    const cleanAlias = (alias || '').trim().replace(/^\/+/, '');
    const base = (deployDomain || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, '');
    return `${base}/?p=${encodeURIComponent(cleanAlias)}&v=${encodeURIComponent(videoId)}`;
  };

  const handleExportSync = () => {
    try {
      const json = exportSyncData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `qasystem-sync-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Vercel 동기화 데이터 팩(JSON)이 다운로드되었습니다.');
    } catch {
      showToast('동기화 파일 생성 실패');
    }
  };

  const handleImportSync = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const success = importSyncData(content);
        if (success) {
          showToast('Vercel 동기화 데이터를 성공적으로 불러왔습니다!');
        } else {
          showToast('동기화 데이터 형식이 올바르지 않습니다.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCopyLink = async (alias: string) => {
    const url = getProposalUrl(alias);
    try {
      await navigator.clipboard.writeText(url);
      showToast(`제안서 전용 링크 복사 완료: ${url}`);
    } catch {
      showToast('클립보드 복사 실패');
    }
  };

  const handleCopyDirect = async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast(`${label} 복사 완료`);
    } catch {
      showToast('클립보드 복사 실패');
    }
  };

  // QR 모달 Data URL 렌더링 (고해상도 PNG 즉시 생성)
  useEffect(() => {
    if (!qrModalTarget) {
      setQrDataUrl('');
      return;
    }
    let isCancelled = false;
    QRCode.toDataURL(qrModalTarget.url, {
      width: 480,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'H'
    }).then(dataUrl => {
      if (!isCancelled) setQrDataUrl(dataUrl);
    }).catch(err => {
      console.error('QR code generation failed:', err);
    });
    return () => {
      isCancelled = true;
    };
  }, [qrModalTarget]);

  // 1. 기관/프로젝트 전체 검수 QR 열기
  const handleOpenProjectQr = (proj: { id: string; name: string; alias: string }, videoCount: number) => {
    const cleanAlias = (proj.alias || proj.name).trim().replace(/^\/+/, '');
    const url = getProposalUrl(cleanAlias);
    const fileSafeName = (proj.alias || proj.name).replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
    setQrModalTarget({
      type: 'project',
      title: proj.name,
      subtitle: `기관 전용 전체 검수 링크 (등록 영상 ${videoCount}개)`,
      badge: '기관/프로젝트 전체 검수 QR',
      url,
      downloadFileName: `${fileSafeName}_전체검수_제안서_QR.png`
    });
  };

  // 2. 차시별 개별 영상 검수 QR 열기
  const handleOpenVideoQr = (proj: { id: string; name: string; alias: string }, vid: any) => {
    const cleanAlias = (proj.alias || proj.name).trim().replace(/^\/+/, '');
    const url = getVideoReviewUrl(cleanAlias, vid.id);
    const fileSafeProj = (proj.alias || proj.name).replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
    const fileSafeTitle = (vid.sessionTitle || vid.fileName).replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
    const fileSafeWeek = (vid.weekTitle || '1주차').replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
    setQrModalTarget({
      type: 'video',
      title: `${vid.weekTitle} · ${vid.sessionTitle}`,
      subtitle: `${proj.name} | ${vid.fileName} (${vid.fileSize})`,
      badge: '차시별 개별 영상 검수 QR',
      url,
      downloadFileName: `${fileSafeProj}_${fileSafeWeek}_${fileSafeTitle}_QR.png`
    });
  };

  const handleDownloadQrPng = () => {
    if (!qrDataUrl || !qrModalTarget) return;
    try {
      const a = document.createElement('a');
      a.href = qrDataUrl;
      a.download = qrModalTarget.downloadFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('고해상도 QR코드 PNG 이미지가 다운로드되었습니다.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleGoToReview = (alias: string) => {
    setCurrentProjectSlug(alias);
    setPortalMode('user');
    setUserViewMode('review');
  };

  const handleSaveUserName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUserName.trim()) return;
    setCurrentUserName(tempUserName.trim());
    setEditingUserName(false);
    showToast(`작업자(담당자) 이름이 '${tempUserName.trim()}'(으)로 설정되었습니다.`);
  };

  const totalRegisteredVideos = videos.length;
  const totalStorageBytes = useMemo(() => videos.reduce((acc, v) => acc + (v.sizeBytes || 0), 0), [videos]);
  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 MB';
    if (bytes >= 1024 ** 3) return (bytes / 1024 ** 3).toFixed(1) + ' GB';
    return (bytes / 1024 ** 2).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-16">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ================= 0. VERCEL DEPLOYMENT & SYNC BANNER ================= */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl border border-slate-800 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Vercel 공식 배포 연동 시스템</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white">제안서 QR·링크 발급 기준 도메인:</span>
              {isEditingDomain ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    value={tempDomain}
                    onChange={e => setTempDomain(e.target.value)}
                    className="px-2.5 py-1 text-xs bg-slate-800 border border-slate-600 rounded-lg text-white font-mono w-64"
                    placeholder="https://qasystem-psi.vercel.app"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setDeployDomain(tempDomain);
                      setIsEditingDomain(false);
                      showToast('배포 도메인이 설정되었습니다.');
                    }}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs font-bold text-white cursor-pointer"
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTempDomain(typeof window !== 'undefined' ? window.location.origin : '');
                    }}
                    className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300 cursor-pointer"
                    title="현재 접속 중인 브라우저 주소로 자동 입력"
                  >
                    현재주소
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingDomain(false)}
                    className="px-1.5 py-1 text-slate-400 text-xs hover:text-white"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <code className="px-2.5 py-1 bg-white/10 rounded-lg font-mono text-xs text-blue-300 font-bold border border-white/10">
                    {deployDomain}
                  </code>
                  <button
                    type="button"
                    onClick={() => setIsEditingDomain(true)}
                    className="text-[11px] text-slate-300 hover:text-white underline cursor-pointer"
                  >
                    도메인 변경
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              본 시스템에서 발급하는 모든 <strong>제안서 QR코드 및 차시별 개별 링크</strong>가 위 Vercel 실서버 주소(<code>{deployDomain}</code>)로 일괄 생성되어, 외부 심사위원이 스마트폰으로 스캔하거나 링크를 열었을 때 바로 열립니다.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleExportSync}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl text-xs font-bold border border-white/20 transition-all cursor-pointer shadow-2xs"
              title="등록된 프로젝트 목록과 영상 정보들을 Vercel 사이트에 동기화하기 위한 백업 파일 다운로드"
            >
              <Download className="w-3.5 h-3.5 text-blue-300" />
              <span>동기화 데이터 내보내기 (JSON)</span>
            </button>
            <label
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="내보낸 동기화 파일을 선택하여 이 화면에 프로젝트와 영상 정보를 즉시 동일하게 반영"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>동기화 데이터 가져오기</span>
              <input type="file" accept=".json" onChange={handleImportSync} className="hidden" />
            </label>
            <a
              href={deployDomain}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Vercel 배포 사이트 열기</span>
            </a>
          </div>
        </div>
      </section>

      {/* ================= 1. SYSTEM ARCHITECTURE & HOW TO MANAGE GUIDE ================= */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
              <FolderKanban className="w-3.5 h-3.5 text-blue-600" />
              <span>동영상 품질 검수 플랫폼 운영 체계</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              어떻게 관리하는가? (표준 운영 프로세스)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              허구의 목데이터나 빈 껍데기 차시를 없애고, <strong>실제 영상 파일과 대학별 제출 링크</strong>를 직관적으로 원스톱 관리합니다.
            </p>
          </div>

          {/* Current Operator Badge */}
          <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl flex items-center gap-3 shrink-0">
            <div className="text-xs">
              <span className="text-slate-400 block text-[11px]">현재 작업자 / 담당자</span>
              <strong className="text-slate-900 font-bold">{currentUser.name || '검수자'}</strong>
            </div>
            {editingUserName ? (
              <form onSubmit={handleSaveUserName} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={tempUserName}
                  onChange={e => setTempUserName(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-300 rounded bg-white w-28 font-medium"
                  placeholder="담당자명 입력"
                  autoFocus
                />
                <button type="submit" className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-bold">저장</button>
                <button type="button" onClick={() => setEditingUserName(false)} className="px-1.5 py-1 text-slate-500 text-xs">취소</button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => { setTempUserName(currentUser.name || ''); setEditingUserName(true); }}
                className="text-[11px] text-blue-600 hover:underline font-semibold"
              >
                변경
              </button>
            )}
          </div>
        </div>

        {/* 4-Step Visual Workflow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-5">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">1</span>
              <strong className="text-xs font-bold text-slate-900">사업(대학) 등록</strong>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              발주 대학 및 사업명과 전용 슬러그(예: <span className="font-mono text-blue-600 font-bold">khcu</span>)를 등록합니다.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">2</span>
              <strong className="text-xs font-bold text-slate-900">실제 영상 파일 업로드</strong>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              MP4/WebM 파일을 올리면서 차시명을 입력하여 저장소(S3/로컬)에 영구 보존합니다.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">3</span>
              <strong className="text-xs font-bold text-slate-900">제안서 QR·링크 발급</strong>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              서류평가 제안서 삽입용 인쇄 QR PNG 이미지와 전용 검수 URL을 1-클릭 발급합니다.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center">4</span>
              <strong className="text-xs font-bold text-slate-900">실시간 품질 검수</strong>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              1080p 플레이어에서 타임코드 의견을 남기고 [승인]/[반려] 판정을 내립니다.
            </p>
          </div>
        </div>
      </section>

      {/* ================= 2. WORKSPACE: 2-COLUMN REGISTRATION & ASSET VIEW ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT COLUMN: REGISTRATION FORMS (5 Cols) ================= */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Card A: 1단계 사업(대학) 등록 */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">사업(대학) 등록</h2>
                <p className="text-[11px] text-slate-400">발주 기관명과 전용 접속 슬러그를 등록합니다.</p>
              </div>
            </div>

            <form onSubmit={handleProjectSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">프로젝트(대학/사업명)</label>
                <input
                  type="text"
                  value={newProjName}
                  onChange={e => setNewProjName(e.target.value)}
                  placeholder="예: 경희사이버대학교 2026 원격 교육과정 개발 사업"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 hover:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">전용 링크 별칭 (Slug)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">/?p=</span>
                    <input
                      type="text"
                      value={newProjAlias}
                      onChange={e => setNewProjAlias(e.target.value)}
                      placeholder="khcu"
                      className="w-full pl-12 pr-3 py-2 text-xs font-mono font-bold text-blue-600 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 hover:bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs whitespace-nowrap cursor-pointer transition-colors"
                  >
                    프로젝트 등록
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Card B: 2단계 실제 동영상 원스톱 업로드 */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">실제 강의 영상 원스톱 업로드</h2>
                <p className="text-[11px] text-slate-400">영상 파일(MP4 등)을 올리면서 차시와 즉각 연결합니다.</p>
              </div>
            </div>

            <form onSubmit={handleVideoUploadSubmit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">소속 프로젝트</label>
                  <select
                    value={uploadProjId}
                    onChange={e => setUploadProjId(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg text-slate-800 bg-slate-50"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">주차</label>
                  <input
                    type="text"
                    value={uploadWeekTitle}
                    onChange={e => setUploadWeekTitle(e.target.value)}
                    placeholder="예: 1주차"
                    className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg text-slate-800 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">강의 차시명 (파일명과 다를 경우 입력)</label>
                <input
                  type="text"
                  value={uploadSessionTitle}
                  onChange={e => setUploadSessionTitle(e.target.value)}
                  placeholder="예: 1차시 시니어재무컨설팅 (1인강의형)"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-800 bg-slate-50 focus:bg-white"
                />
              </div>

              {/* Drag and drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer ${
                  dragActive ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-slate-400 bg-slate-50/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,.mkv"
                  onChange={e => handleProcessFile(e.target.files?.[0])}
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="space-y-1">
                    <FileVideo className="w-8 h-8 mx-auto text-emerald-600" />
                    <strong className="block text-xs text-slate-900 truncate max-w-xs mx-auto">{selectedFile.name}</strong>
                    <span className="text-[11px] text-slate-500">
                      {(selectedFile.size / 1024 ** 2).toFixed(1)} MB {fileDuration > 0 ? `· ${Math.floor(fileDuration / 60)}분 ${fileDuration % 60}초` : ''}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="w-7 h-7 mx-auto text-slate-400" />
                    <p className="text-xs font-bold text-slate-700">실제 영상 파일 끌어다 놓기</p>
                    <p className="text-[11px] text-slate-400">클릭하여 파일 선택 (MP4, WebM, MOV, MKV)</p>
                  </div>
                )}
              </div>

              {uploadProgress > 0 && isUploading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-blue-800">
                    <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> 업로드 저장 중...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-blue-100 overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {uploadError}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">S3 및 브라우저 영구 스토리지에 저장</span>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? '업로드 중...' : '영상 업로드 & 차시 등록'}</span>
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* ================= RIGHT COLUMN: REGISTERED ASSETS & QR MANAGER (7 Cols) ================= */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Top Summary Banner */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">등록된 영상 및 제안서 현황</h2>
              <p className="text-xs text-slate-500 mt-0.5">실제 업로드된 영상 파일만 집계되며, 가짜 리스트는 노출되지 않습니다.</p>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">총 등록 프로젝트</span>
                <strong className="text-base sm:text-lg font-black text-slate-900">{projects.length}개</strong>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <span className="text-[11px] text-slate-400 block font-medium">실제 업로드 영상</span>
                <strong className="text-base sm:text-lg font-black text-blue-600">{totalRegisteredVideos}편</strong>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <span className="text-[11px] text-slate-400 block font-medium">총 스토리지 용량</span>
                <strong className="text-base sm:text-lg font-black text-slate-900">{formatBytes(totalStorageBytes)}</strong>
              </div>
            </div>
          </div>

          {/* Project Cards List */}
          <div className="space-y-4">
            {projects.map(proj => {
              const projVideos = videos.filter(v => v.projectId === proj.id);
              const proposalUrl = getProposalUrl(proj.alias);

              return (
                <div key={proj.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  
                  {/* Project Card Header */}
                  <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">{proj.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium pl-4.5">
                        <span>전용 링크: <strong className="font-mono text-blue-600">/?p={proj.alias}</strong></span>
                        <span>·</span>
                        <span>실제 영상: <strong className="text-slate-900">{projVideos.length}개</strong></span>
                      </div>
                    </div>

                    {/* Actions: Copy Link, QR Code, Delete */}
                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(proj.alias)}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                        title="제안서 기재용 전용 링크 복사"
                      >
                        <Copy className="w-3.5 h-3.5 text-blue-600" />
                        <span>링크 복사</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenProjectQr(proj, projVideos.length)}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                        title="제안서 삽입용 기관 전체 검수 QR코드 확인 및 다운로드"
                      >
                        <QrCode className="w-3.5 h-3.5 text-emerald-300" />
                        <span>QR 발급 (전체)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleGoToReview(proj.alias)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        title="이 프로젝트 검수 화면으로 이동"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>검수 열기</span>
                      </button>

                      {projects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`'${proj.name}' 프로젝트와 연결된 영상을 모두 삭제할까요?`)) {
                              deleteProject(proj.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="프로젝트 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Registered Real Videos Under this Project */}
                  <div className="p-4 sm:p-5">
                    {projVideos.length === 0 ? (
                      <div className="py-8 px-4 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/40">
                        <Film className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700">등록된 실제 강의 영상이 없습니다.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          왼쪽의 <strong>'2단계 실제 강의 영상 원스톱 업로드'</strong>를 통해 첫 강의 영상을 등록해 주세요.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          업로드된 실제 강의 영상 목록 ({projVideos.length}개):
                        </div>
                        {projVideos.map((vid, idx) => (
                          <div
                            key={vid.id}
                            className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-slate-300 transition-colors shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                                {idx + 1}
                              </span>
                              <div className="truncate">
                                <div className="flex items-center gap-2">
                                  <strong className="text-xs text-slate-900 truncate font-semibold">
                                    {vid.sessionTitle}
                                  </strong>
                                  <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                                    vid.status === 'APPROVED'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : vid.status === 'REJECTED'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}>
                                    {vid.status === 'APPROVED' ? '승인' : vid.status === 'REJECTED' ? '반려' : '대기'}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                                  <span>{vid.fileName}</span>
                                  <span>·</span>
                                  <span>{vid.fileSize}</span>
                                  <span>·</span>
                                  <span>{vid.weekTitle}</span>
                                  <span>·</span>
                                  <span>{vid.uploadedAt}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto flex-wrap">
                              <button
                                type="button"
                                onClick={() => setSelectedVideo(vid)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>재생</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenVideoQr(proj, vid)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                                title="이 차시(영상) 전용 개별 QR코드 및 링크 발급"
                              >
                                <QrCode className="w-3 h-3 text-white" />
                                <span>QR 발급 (개별)</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openShareModal(vid)}
                                className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                              >
                                공유
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`'${vid.fileName}' 영상을 삭제할까요?`)) {
                                    deleteVideo(vid.id);
                                  }
                                }}
                                className="px-2 py-1 bg-white hover:bg-rose-50 border border-slate-200 text-rose-600 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* ================= 3. QR CODE MODAL ================= */}
      {qrModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                qrModalTarget.type === 'video'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                <QrCode className="w-3.5 h-3.5" />
                <span>{qrModalTarget.badge}</span>
              </span>
              <button
                type="button"
                onClick={() => setQrModalTarget(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-900 leading-snug">{qrModalTarget.title}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{qrModalTarget.subtitle}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl inline-block border border-slate-200 shadow-inner mx-auto">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-56 h-56 mx-auto rounded-lg shadow-xs select-none bg-white p-2"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-400">
              * 스마트폰 카메라로 스캔하거나 제안서(한글/워드/PPT)에 삽입하세요.
            </div>

            <div className="p-2.5 bg-slate-900 text-white rounded-xl text-xs font-mono truncate select-all text-left flex items-center justify-between gap-2">
              <span className="truncate flex-1">{qrModalTarget.url}</span>
              <button
                type="button"
                onClick={() => handleCopyDirect(qrModalTarget.url, '전용 링크')}
                className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 rounded text-[11px] font-bold text-emerald-300 shrink-0 cursor-pointer"
              >
                복사
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopyDirect(qrModalTarget.url, '전용 링크')}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>링크 복사</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadQrPng}
                disabled={!qrDataUrl}
                className="py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PNG 저장</span>
              </button>
              <button
                type="button"
                onClick={() => window.open(qrModalTarget.url, '_blank')}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>새 탭 테스트</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
