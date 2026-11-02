import React, { useState, useRef, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';
import { ProposalSampleItem } from '../types';
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
  Info
} from 'lucide-react';

const LECTURE_TYPES = [
  '전체',
  '1인강의형',
  '스튜디오형',
  '크로마키형',
  '대담형',
  '모션그래픽형'
] as const;

export const ProposalSampleView: React.FC = () => {
  const { proposalSamples, addProposalSample, deleteProposalSample, language } = useApp();

  const [selectedType, setSelectedType] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [cardCopiedId, setCardCopiedId] = useState<string | null>(null);

  // Video playback modal state
  const [activeSampleVideo, setActiveSampleVideo] = useState<ProposalSampleItem | null>(null);

  // New sample registration modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newInstitution, setNewInstitution] = useState('');
  const [newLectureType, setNewLectureType] = useState('1인강의형');
  const [newInstructor, setNewInstructor] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newThumbnailUrl, setNewThumbnailUrl] = useState('');
  const [newBulletsText, setNewBulletsText] = useState(
    '사진, 영상 등의 다양한 시각적 자료를 효과적으로 활용\n학습자 몰입도를 높이는 전자칠판 판서 및 핵심 요약 구성\n원거리 및 모바일 환경에서도 가독성이 뛰어난 전면 강의 연출'
  );

  // QR Code canvas reference
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Evaluation share URL: Evaluators opening this link see the proposal sample showcase
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?view=sample`;
  }, []);

  // Generate QR code onto canvas whenever shareUrl changes
  useEffect(() => {
    if (!qrCanvasRef.current || !shareUrl) return;

    QRCode.toCanvas(
      qrCanvasRef.current,
      shareUrl,
      {
        width: 140,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      },
      (error) => {
        if (error) {
          console.error('QR Code generation failed:', error);
        }
      }
    );
  }, [shareUrl]);

  // Copy proposal URL to clipboard
  const handleCopyUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error('Failed to copy share URL:', err);
    }
  };

  // Download high-resolution QR Code image for Word / HWP / PPT proposal embedding
  const handleDownloadQr = () => {
    if (!qrCanvasRef.current) return;
    try {
      const dataUrl = qrCanvasRef.current.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = 'whomedia-proposal-sample-qr.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('Failed to download QR code image:', err);
    }
  };

  // Copy individual card link
  const handleCopyCardLink = async (sample: ProposalSampleItem) => {
    const cardUrl = `${shareUrl}&sampleId=${encodeURIComponent(sample.id)}`;
    try {
      await navigator.clipboard.writeText(cardUrl);
      setCardCopiedId(sample.id);
      setTimeout(() => setCardCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy card URL:', err);
    }
  };

  // Handle adding new sample
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

    // Reset & close
    setNewTitle('');
    setNewInstitution('');
    setNewInstructor('');
    setNewVideoUrl('');
    setNewThumbnailUrl('');
    setIsAddModalOpen(false);
  };

  // Filtered samples
  const filteredSamples = useMemo(() => {
    return proposalSamples.filter(item => {
      const matchesType = selectedType === '전체' || item.lectureType === selectedType;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.institution.toLowerCase().includes(q) ||
        (item.instructor && item.instructor.toLowerCase().includes(q)) ||
        item.descriptionBullets.some(b => b.toLowerCase().includes(q));
      return matchesType && matchesQuery;
    });
  }, [proposalSamples, selectedType, searchQuery]);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ================= 1. PROPOSAL HEADER & QR CODE EXPORTER BANNER ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Title & Explanation */}
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <FileCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'ko' ? '제안서 서류평가 전용 도구' : 'Proposal Evaluation Suite'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {language === 'ko' ? '제안샘플 사이트 & QR·URL 생성기' : 'Proposal Sample Showcase & QR Generator'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {language === 'ko'
                ? '별도의 업무요청 없이, 대학·기관 입찰 제안서에 삽입할 샘플 사이트 접속 URL과 고해상도 QR코드를 실시간 생성하고 다운로드할 수 있습니다.'
                : 'Instantly generate and download high-resolution QR codes and evaluation links to embed in RFP documents without filing manual work requests.'}
            </p>

            <div className="flex items-center gap-2 pt-1 text-xs text-amber-800 bg-amber-50/80 border border-amber-200/70 px-3 py-2 rounded-lg">
              <Info className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                {language === 'ko'
                  ? '제안서 서류평가 시 URL과 QR코드를 나란히 배치하면 평가위원이 스마트폰과 PC에서 즉시 강의 샘플을 검수할 수 있습니다.'
                  : 'Place both the URL and QR code in your proposal document so committee members can easily review on mobile and desktop.'}
              </span>
            </div>
          </div>

          {/* Right QR Code Generator Card */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 shrink-0 shadow-2xs">
            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center">
              <canvas ref={qrCanvasRef} width={140} height={140} className="w-[120px] h-[120px] sm:w-[130px] sm:h-[130px]" />
            </div>

            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center sm:text-left">
                {language === 'ko' ? '서류평가 제출용' : 'For Document Review'}
              </div>

              {/* Download QR PNG Button */}
              <button
                type="button"
                onClick={handleDownloadQr}
                className="flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs sm:text-sm font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                title="제안서 삽입용 QR코드 이미지(PNG) 저장"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>{language === 'ko' ? 'QR코드 다운로드 (PNG)' : 'Download QR Image'}</span>
              </button>

              {/* Copy URL Button */}
              <button
                type="button"
                onClick={handleCopyUrl}
                className="flex items-center justify-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs sm:text-sm font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                title="제안서 표기용 URL 복사"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">{language === 'ko' ? 'URL 복사 완료!' : 'URL Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-blue-600" />
                    <span>{language === 'ko' ? '제안서용 URL 복사' : 'Copy Proposal URL'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Current URL Readout Bar */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 font-mono">
          <div className="truncate flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 font-semibold uppercase text-[10px]">
              URL
            </span>
            <span className="text-slate-800 truncate select-all">{shareUrl}</span>
          </div>
          <div className="text-slate-400 shrink-0 font-sans text-xs">
            {language === 'ko' ? `총 ${proposalSamples.length}개 제안샘플 등록됨` : `${proposalSamples.length} samples registered`}
          </div>
        </div>
      </div>

      {/* ================= 2. SEARCH, CATEGORY FILTER & DIRECT ADD BUTTON ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {LECTURE_TYPES.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedType === type
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Right Search & Add Card Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={language === 'ko' ? '강좌명, 기관명, 교수자 검색' : 'Search title, institution...'}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-lg shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ko' ? '제안샘플 등록' : 'Add Sample'}</span>
          </button>
        </div>
      </div>

      {/* ================= 3. SAMPLE CARDS GRID (1:1 MATCHING USER SCREENSHOT) ================= */}
      {filteredSamples.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Film className="w-12 h-12 mx-auto text-slate-300" />
          <h2 className="text-base font-bold text-slate-700">
            {language === 'ko' ? '해당 조건의 제안샘플이 없습니다.' : 'No matching proposal samples found.'}
          </h2>
          <p className="text-xs text-slate-400">
            {language === 'ko'
              ? '새로운 제안샘플 카드를 등록하거나 [동영상 강의 검수] 화면에서 1클릭으로 추가할 수 있습니다.'
              : 'Add a new proposal sample card or add directly from the review table.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredSamples.map(sample => (
            <div
              key={sample.id}
              className="group bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden"
            >
              {/* Card Thumbnail Area (16:9) with Play Hover */}
              <div
                className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer select-none"
                onClick={() => setActiveSampleVideo(sample)}
              >
                {sample.thumbnailUrl ? (
                  <img
                    src={sample.thumbnailUrl}
                    alt={sample.title}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4 text-center">
                    <Film className="w-8 h-8 text-blue-400 mb-2 opacity-80" />
                    <span className="text-xs font-bold text-white/90 line-clamp-2 px-2">{sample.title}</span>
                    <span className="text-[11px] text-blue-300 mt-1">{sample.institution}</span>
                  </div>
                )}

                {/* Duration Badge */}
                {sample.duration && (
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/75 text-[11px] font-mono font-medium text-white">
                    {Math.floor(sample.duration / 60)}:
                    {String(sample.duration % 60).padStart(2, '0')}
                  </div>
                )}

                {/* Central Play Button Overlay on Hover */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                  <div className="w-11 h-11 rounded-full bg-white/95 text-blue-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Card Body - Exactly matching the user's reference screenshot */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  {/* ◆ Title (Blue Diamond Bullet + Bold Title) */}
                  <div className="flex items-start gap-1.5">
                    <span className="text-sky-600 font-black text-sm select-none leading-tight mt-0.5">◆</span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug tracking-tight">
                      {sample.title}
                    </h3>
                  </div>

                  {/* Institution Name */}
                  <div className="text-xs sm:text-sm font-semibold text-slate-700 mt-1.5 pl-4">
                    {sample.institution}
                  </div>

                  {/* Format Badge (Light blue badge e.g. 1인강의형) */}
                  <div className="mt-2.5 pl-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200/50">
                      {sample.lectureType}
                    </span>
                  </div>

                  {/* Feature Bullet Points */}
                  <ul className="mt-3.5 space-y-1.5 text-xs text-slate-600 pl-4 border-t border-slate-100 pt-3">
                    {sample.descriptionBullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                        <span className="text-slate-400 select-none">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Action Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1 text-xs text-slate-500">
                  <button
                    type="button"
                    onClick={() => setActiveSampleVideo(sample)}
                    className="flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 text-blue-700 font-bold transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{language === 'ko' ? '영상 보기' : 'Watch'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopyCardLink(sample)}
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      title={language === 'ko' ? '샘플 바로가기 링크 복사' : 'Copy Sample Link'}
                    >
                      {cardCopiedId === sample.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`'${sample.title}' 샘플을 삭제하시겠습니까?`)) {
                          deleteProposalSample(sample.id);
                        }
                      }}
                      className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title={language === 'ko' ? '제안샘플 삭제' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= 4. VIDEO PLAYBACK MODAL ================= */}
      {activeSampleVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-slate-900 rounded-2xl max-w-4xl w-full overflow-hidden border border-slate-700 shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <span className="text-sky-400 font-black">◆</span>
                <h3 className="font-bold text-base sm:text-lg">{activeSampleVideo.title}</h3>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-sky-950 text-sky-300 border border-sky-800">
                  {activeSampleVideo.institution}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-700 text-slate-200">
                  {activeSampleVideo.lectureType}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveSampleVideo(null)}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Area */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video
                src={activeSampleVideo.videoUrl}
                controls
                autoPlay
                className="w-full h-full max-h-[65vh] object-contain"
              >
                브라우저가 동영상 재생을 지원하지 않습니다.
              </video>
            </div>

            {/* Modal Footer with details */}
            <div className="p-4 bg-slate-800/60 border-t border-slate-700 text-xs sm:text-sm text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                {activeSampleVideo.instructor && (
                  <div className="text-slate-400 font-medium">
                    {language === 'ko' ? '교수자 / 강사: ' : 'Instructor: '}
                    <span className="text-white font-semibold">{activeSampleVideo.instructor}</span>
                  </div>
                )}
                <div className="text-slate-400 text-xs">
                  {activeSampleVideo.descriptionBullets.join(' · ')}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopyCardLink(activeSampleVideo)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{language === 'ko' ? '이 영상 링크 복사' : 'Copy link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 5. NEW SAMPLE REGISTRATION MODAL ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {language === 'ko' ? '새 제안샘플 카드 직접 등록' : 'Register New Proposal Sample'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'ko' ? '제안서와 QR코드에 노출될 샘플 정보를 입력합니다.' : 'Enter details for the proposal evaluation card.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSample} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* 강좌명 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'ko' ? '강좌명 *' : 'Course Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="예: 시니어재무컨설팅"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 기관명 / 대학교 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'ko' ? '기관명 / 대학교 *' : 'Institution / University *'}
                </label>
                <input
                  type="text"
                  required
                  value={newInstitution}
                  onChange={e => setNewInstitution(e.target.value)}
                  placeholder="예: 경희사이버대학교, 인하대학교 등"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 강의 형태 및 교수자 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'ko' ? '강의 형태' : 'Lecture Type'}
                  </label>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'ko' ? '교수자 / 강사명' : 'Instructor'}
                  </label>
                  <input
                    type="text"
                    value={newInstructor}
                    onChange={e => setNewInstructor(e.target.value)}
                    placeholder="예: 성진호 교수"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 동영상 URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'ko' ? '재생 동영상 URL (MP4 등)' : 'Video URL'}
                </label>
                <input
                  type="url"
                  value={newVideoUrl}
                  onChange={e => setNewVideoUrl(e.target.value)}
                  placeholder="https://... 또는 공용 저장소 MP4 링크"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 썸네일 이미지 URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'ko' ? '썸네일 이미지 URL (선택)' : 'Thumbnail URL (Optional)'}
                </label>
                <input
                  type="text"
                  value={newThumbnailUrl}
                  onChange={e => setNewThumbnailUrl(e.target.value)}
                  placeholder="예: /assets/aistudio/image_f623d953.png 또는 웹 이미지 URL"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 주요 특징 요약 불릿 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'ko' ? '주요 특징 불릿 목록 (줄바꿈으로 구분)' : 'Feature Bullets (1 per line)'}
                </label>
                <textarea
                  rows={3}
                  value={newBulletsText}
                  onChange={e => setNewBulletsText(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {language === 'ko' ? '취소' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {language === 'ko' ? '제안샘플 등록 완료' : 'Save Sample'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
