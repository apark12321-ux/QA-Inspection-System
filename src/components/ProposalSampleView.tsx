import React, { useState, useRef, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';
import { ProposalSampleItem, ProposalClientPackage } from '../types';
import { ProposalClientView } from './ProposalClientView';
import {
  Sparkles,
  Download,
  Copy,
  Check,
  Plus,
  Play,
  Trash2,
  ExternalLink,
  Search,
  Film,
  Building2,
  Layers,
  X,
  FileCheck,
  Info,
  ShieldCheck,
  Lock,
  Eye,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const ProposalSampleView: React.FC = () => {
  const {
    proposalSamples,
    addProposalSample,
    deleteProposalSample,
    proposalClients,
    selectedProposalClientId,
    setSelectedProposalClientId,
    addProposalClient,
    deleteProposalClient,
    toggleSampleInProposalClient,
    language
  } = useApp();

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [previewingSlug, setPreviewingSlug] = useState<string | null>(null);

  // New Proposal Client Modal
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientSlug, setNewClientSlug] = useState('');
  const [newProposalTitle, setNewProposalTitle] = useState('');
  const [newClientNotice, setNewClientNotice] = useState('');

  // New Sample Card Modal
  const [isAddSampleModalOpen, setIsAddSampleModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newInstitution, setNewInstitution] = useState('');
  const [newLectureType, setNewLectureType] = useState('1인강의형');
  const [newInstructor, setNewInstructor] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newThumbnailUrl, setNewThumbnailUrl] = useState('');
  const [newBulletsText, setNewBulletsText] = useState(
    '사진, 영상 등의 다양한 시각적 자료를 효과적으로 활용\n학습자 몰입도를 높이는 전자칠판 판서 및 핵심 요약 구성\n원거리 및 모바일 환경에서도 가독성이 뛰어난 전면 강의 연출'
  );

  // Video playback modal state
  const [activeSampleVideo, setActiveSampleVideo] = useState<ProposalSampleItem | null>(null);

  // Filter state for manager
  const [managerFilterType, setManagerFilterType] = useState<'all' | 'assigned_only'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected client
  const activeClient = useMemo<ProposalClientPackage>(() => {
    const found = proposalClients.find(c => c.id === selectedProposalClientId);
    return found || proposalClients[0];
  }, [proposalClients, selectedProposalClientId]);

  // Delivery link dedicated to this specific client
  const clientDeliveryUrl = useMemo(() => {
    if (typeof window === 'undefined' || !activeClient) return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?proposal=${encodeURIComponent(activeClient.slug)}`;
  }, [activeClient]);

  // QR canvas reference
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate QR code for client delivery URL
  useEffect(() => {
    if (!qrCanvasRef.current || !clientDeliveryUrl) return;

    QRCode.toCanvas(
      qrCanvasRef.current,
      clientDeliveryUrl,
      {
        width: 150,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      },
      error => {
        if (error) console.error('QR code generation failed:', error);
      }
    );
  }, [clientDeliveryUrl]);

  // Copy client delivery URL
  const handleCopyClientUrl = async () => {
    if (!clientDeliveryUrl) return;
    try {
      await navigator.clipboard.writeText(clientDeliveryUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  // Download client-specific QR code PNG
  const handleDownloadQr = () => {
    if (!qrCanvasRef.current || !activeClient) return;
    try {
      const dataUrl = qrCanvasRef.current.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `${activeClient.name}_제안서_전용_QR코드.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('Failed to download QR image:', err);
    }
  };

  // Handle creating new client proposal package
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientSlug.trim()) return;

    addProposalClient({
      name: newClientName.trim(),
      slug: newClientSlug.trim(),
      proposalTitle:
        newProposalTitle.trim() || `${newClientName.trim()} 온라인 교육과정 콘텐츠 개발 사업 제안`,
      assignedSampleIds: [],
      customNotice: newClientNotice.trim() || undefined
    });

    setNewClientName('');
    setNewClientSlug('');
    setNewProposalTitle('');
    setNewClientNotice('');
    setIsAddClientModalOpen(false);
  };

  // Handle creating new sample card
  const handleCreateSample = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newInstitution.trim()) return;

    const bullets = newBulletsText
      .split('\n')
      .map(b => b.trim())
      .filter(b => b.length > 0);

    addProposalSample({
      title: newTitle.trim(),
      institution: newInstitution.trim(),
      lectureType: newLectureType.trim() || '1인강의형',
      instructor: newInstructor.trim() || undefined,
      videoUrl:
        newVideoUrl.trim() ||
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: newThumbnailUrl.trim() || undefined,
      descriptionBullets:
        bullets.length > 0
          ? bullets
          : ['사진, 영상 등의 다양한 시각적 자료를 효과적으로 활용']
    });

    setNewTitle('');
    setNewInstitution('');
    setNewInstructor('');
    setNewVideoUrl('');
    setNewThumbnailUrl('');
    setIsAddSampleModalOpen(false);
  };

  // If in Preview Mode, render the client view directly!
  if (previewingSlug) {
    return (
      <ProposalClientView
        clientSlug={previewingSlug}
        isPreview={true}
        onExitPreview={() => setPreviewingSlug(null)}
      />
    );
  }

  const assignedSet = new Set(activeClient?.assignedSampleIds || []);

  const displayedSamples = proposalSamples.filter(item => {
    if (managerFilterType === 'assigned_only' && !assignedSet.has(item.id)) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.institution.toLowerCase().includes(q) ||
      item.lectureType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-14 font-sans">
      {/* ================= 1. ADMIN CONSOLE HEADER ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>관리자 전용 콘솔 · 제안사별 격리 시스템</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              제안사별 전용 샘플 사이트 & 전달 링크 관리
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              제안사(발주처)에는 <strong>오직 해당 기관만을 위해 선별된 샘플</strong>만 노출되며, 다른 대학이나 경쟁사의
              샘플은 절대 보여지지 않습니다. 각 제안사 전용 링크와 QR코드를 생성하여 제안서에 기재하십시오.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsAddClientModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-bold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>새 제안 대상사 추가</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddSampleModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>새 강좌 샘플 카드 등록</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= 2. PROPOSAL CLIENT SELECTOR TABS ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>제안 대상사(발주처) 선택</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            총 {proposalClients.length}개 제안 프로젝트 등록됨
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {proposalClients.map(client => {
            const isSelected = activeClient?.id === client.id;
            const assignedCount = client.assignedSampleIds.length;
            return (
              <button
                key={client.id}
                type="button"
                onClick={() => setSelectedProposalClientId(client.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600 ring-offset-2'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{client.name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                    isSelected ? 'bg-blue-800 text-blue-100' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {assignedCount}개 샘플
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= 3. "그들에게 전달할 링크 주소 & QR코드" (DELIVERY BOX) ================= */}
      {activeClient && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-5 sm:p-7 shadow-lg border border-slate-700">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Client info and Delivery Link */}
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-blue-500/30 text-blue-300 font-bold text-xs border border-blue-400/40">
                  {activeClient.name} 전용 전달 링크
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  슬러그: ?proposal={activeClient.slug}
                </span>
              </div>

              <div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {activeClient.proposalTitle}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  제안서 본문 및 서류평가 심사위원에게 전달할 <strong>전용 웹 주소</strong>입니다.
                  접속 시 <strong>{activeClient.name}</strong>에 배정된 샘플({assignedSet.size}개)만 노출됩니다.
                </p>
              </div>

              {/* The Delivery URL Box (High-Contrast & Large) */}
              <div className="bg-black/60 border border-blue-500/40 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-2.5 truncate font-mono text-xs sm:text-sm">
                  <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[11px] shrink-0">
                    전달용 URL
                  </span>
                  <span className="text-blue-200 font-semibold truncate select-all">
                    {clientDeliveryUrl}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyClientUrl}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow-xs transition-all cursor-pointer shrink-0"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span className="text-white font-bold">주소 복사 완료!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>전용 링크 주소 복사</span>
                    </>
                  )}
                </button>
              </div>

              {/* Security Isolation Notice */}
              <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-3 py-2 rounded-lg">
                <Lock className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>
                  <strong>제안사 완벽 격리 활성화됨:</strong> 이 주소로 접속하는 제안사 심사위원은 타 기관/타 사의
                  샘플이나 사내 관리 메뉴를 일체 볼 수 없습니다.
                </span>
              </div>
            </div>

            {/* Right: QR Code for Client Proposal */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4 shrink-0 lg:w-72">
              <div className="bg-white p-2 rounded-xl shrink-0 shadow-md flex items-center justify-center">
                <canvas ref={qrCanvasRef} width={150} height={150} className="w-[130px] h-[130px]" />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <div className="text-xs font-bold text-slate-300 text-center sm:text-left">
                  서류평가 인쇄용 QR
                </div>

                {/* Download QR PNG Button */}
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
                  title="제안서 삽입용 QR코드 이미지(PNG) 저장"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>QR코드 다운로드</span>
                </button>

                {/* Preview Client Page Button */}
                <button
                  type="button"
                  onClick={() => setPreviewingSlug(activeClient.slug)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                  title="제안사 심사위원에게 실제로 어떻게 보이는지 미리보기"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-300" />
                  <span>제안사 화면 미리보기</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 4. SAMPLE ASSIGNMENT & ISOLATION MANAGEMENT ================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {activeClient.name} 제안서에 노출할 샘플 선택 (샘플 격리 관리)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              체크된 샘플만 {activeClient.name} 전용 링크에 노출되며, 체크 해제된 샘플은 철저히 비노출 격리됩니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setManagerFilterType('all')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  managerFilterType === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                전체 샘플 ({proposalSamples.length})
              </button>
              <button
                type="button"
                onClick={() => setManagerFilterType('assigned_only')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  managerFilterType === 'assigned_only'
                    ? 'bg-white text-blue-700 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                배정된 샘플만 ({assignedSet.size})
              </button>
            </div>
          </div>
        </div>

        {/* Card Grid (matching screenshot 1:1 with assignment toggle) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {displayedSamples.map(sample => {
            const isAssigned = assignedSet.has(sample.id);
            return (
              <div
                key={sample.id}
                className={`group bg-white rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden ${
                  isAssigned
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                    : 'border-slate-200 opacity-75 hover:opacity-100 shadow-2xs'
                }`}
              >
                {/* Assignment Status Top Bar */}
                <div
                  className={`px-3.5 py-2 text-xs font-bold flex items-center justify-between ${
                    isAssigned
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {isAssigned ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                        <span>{activeClient.name} 전용 링크에 노출 중</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>비노출 (심사위원 차단됨)</span>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleSampleInProposalClient(activeClient.id, sample.id)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      isAssigned
                        ? 'bg-blue-700 hover:bg-blue-800 text-white'
                        : 'bg-white hover:bg-slate-200 text-slate-800 border border-slate-300'
                    }`}
                  >
                    {isAssigned ? '제외하기' : '+ 배정하기'}
                  </button>
                </div>

                {/* 16:9 Thumbnail Area with Play Button */}
                <div
                  className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer select-none"
                  onClick={() => setActiveSampleVideo(sample)}
                >
                  {sample.thumbnailUrl ? (
                    <img
                      src={sample.thumbnailUrl}
                      alt={sample.title}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4 text-center">
                      <Film className="w-8 h-8 text-blue-400 mb-2 opacity-80" />
                      <span className="text-xs font-bold text-white/90 line-clamp-2 px-2">
                        {sample.title}
                      </span>
                      <span className="text-[11px] text-blue-300 mt-1">{sample.institution}</span>
                    </div>
                  )}

                  {sample.duration && (
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/75 text-[11px] font-mono font-medium text-white">
                      {Math.floor(sample.duration / 60)}:
                      {String(sample.duration % 60).padStart(2, '0')}
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white/95 text-blue-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Card Body (Matching User Screenshot 1:1) */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* ◆ 강좌명 (Blue Diamond Bullet + Bold Title) */}
                    <div className="flex items-start gap-1.5">
                      <span className="text-sky-600 font-black text-sm select-none leading-tight mt-0.5">◆</span>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug tracking-tight">
                        {sample.title}
                      </h3>
                    </div>

                    {/* 기관명 */}
                    <div className="text-xs sm:text-sm font-semibold text-slate-700 mt-1.5 pl-4">
                      {sample.institution}
                    </div>

                    {/* 강의형태 뱃지 */}
                    <div className="mt-2.5 pl-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200/50">
                        {sample.lectureType}
                      </span>
                    </div>

                    {/* 특징 불릿 */}
                    <ul className="mt-3.5 space-y-1.5 text-xs text-slate-600 pl-4 border-t border-slate-100 pt-3">
                      {sample.descriptionBullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-slate-400 select-none">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <button
                      type="button"
                      onClick={() => setActiveSampleVideo(sample)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>영상 보기</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`'${sample.title}' 샘플을 완전히 삭제하시겠습니까?`)) {
                          deleteProposalSample(sample.id);
                        }
                      }}
                      className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="샘플 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= 5. NEW CLIENT PROPOSAL MODAL ================= */}
      {isAddClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">새 제안 대상사(발주처) 등록</h3>
                  <p className="text-xs text-slate-500">
                    새로운 대학 또는 공공기관에 제안할 전용 페이지를 생성합니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddClientModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  제안사명 (대학 / 공공기관) *
                </label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={e => {
                    setNewClientName(e.target.value);
                    if (!newClientSlug) {
                      setNewClientSlug(
                        e.target.value
                          .replace(/[^a-zA-Z0-9]/g, '')
                          .toLowerCase()
                          .slice(0, 10)
                      );
                    }
                  }}
                  placeholder="예: 한국기술교육대학교"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  전용 접속 슬러그 (영문 소문자/숫자) *
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-mono">?proposal=</span>
                  <input
                    type="text"
                    required
                    value={newClientSlug}
                    onChange={e => setNewClientSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="koreatech"
                    className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  이 슬러그로 제안사 전용 주소(<span className="font-mono">?proposal={newClientSlug || 'slug'}</span>)가 생성됩니다.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  제안 사업명 (선택)
                </label>
                <input
                  type="text"
                  value={newProposalTitle}
                  onChange={e => setNewProposalTitle(e.target.value)}
                  placeholder="예: 2026 첨단산업 스마트 직무 교육 콘텐츠 제작 제안"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  심사위원 전용 안내 문구 (선택)
                </label>
                <textarea
                  rows={2}
                  value={newClientNotice}
                  onChange={e => setNewClientNotice(e.target.value)}
                  placeholder="심사위원에게 전달할 보안 및 검수 안내문을 기재하세요."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddClientModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
                >
                  제안 대상사 생성 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 6. NEW SAMPLE CARD MODAL ================= */}
      {isAddSampleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">새 강좌 샘플 카드 직접 등록</h3>
                  <p className="text-xs text-slate-500">
                    제안서와 QR코드에 표기될 강좌 정보를 입력합니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSampleModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSample} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">강좌명 *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="예: 시니어재무컨설팅"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">기관명 / 대학교 *</label>
                <input
                  type="text"
                  required
                  value={newInstitution}
                  onChange={e => setNewInstitution(e.target.value)}
                  placeholder="예: 경희사이버대학교"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">강의 형태</label>
                  <select
                    value={newLectureType}
                    onChange={e => setNewLectureType(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1인강의형">1인강의형</option>
                    <option value="스튜디오형">스튜디오형</option>
                    <option value="크로마키형">크로마키형</option>
                    <option value="대담형">대담형</option>
                    <option value="모션그래픽형">모션그래픽형</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">교수자 / 강사명</label>
                  <input
                    type="text"
                    value={newInstructor}
                    onChange={e => setNewInstructor(e.target.value)}
                    placeholder="예: 성진호 교수"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">동영상 URL (MP4 등)</label>
                <input
                  type="url"
                  value={newVideoUrl}
                  onChange={e => setNewVideoUrl(e.target.value)}
                  placeholder="https://... 또는 공용 저장소 MP4 링크"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">썸네일 이미지 URL (선택)</label>
                <input
                  type="text"
                  value={newThumbnailUrl}
                  onChange={e => setNewThumbnailUrl(e.target.value)}
                  placeholder="예: /assets/aistudio/image_f623d953.png"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  주요 특징 불릿 목록 (줄바꿈 구분)
                </label>
                <textarea
                  rows={3}
                  value={newBulletsText}
                  onChange={e => setNewBulletsText(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSampleModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
                >
                  등록 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 7. VIDEO PLAYBACK MODAL ================= */}
      {activeSampleVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-slate-900 rounded-2xl max-w-4xl w-full overflow-hidden border border-slate-700 shadow-2xl flex flex-col">
            <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between text-white">
              <div className="flex items-center gap-2 truncate">
                <span className="text-sky-400 font-black">◆</span>
                <h3 className="font-bold text-base sm:text-lg truncate">{activeSampleVideo.title}</h3>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-sky-950 text-sky-300 border border-sky-800 shrink-0">
                  {activeSampleVideo.institution}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-700 text-slate-200 shrink-0">
                  {activeSampleVideo.lectureType}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveSampleVideo(null)}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video
                src={activeSampleVideo.videoUrl}
                controls
                autoPlay
                className="w-full h-full max-h-[70vh] object-contain"
              >
                동영상 재생을 지원하지 않는 브라우저입니다.
              </video>
            </div>

            <div className="p-4 bg-slate-800/60 border-t border-slate-700 text-xs sm:text-sm text-slate-300 flex items-center justify-between">
              <div>{activeSampleVideo.descriptionBullets.join(' · ')}</div>
              <button
                type="button"
                onClick={() => setActiveSampleVideo(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
