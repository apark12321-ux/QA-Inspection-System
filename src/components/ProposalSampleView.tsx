import React, { useState, useRef, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';
import { ProjectItem } from '../types';
import {
  Sparkles,
  Download,
  Copy,
  Check,
  Plus,
  Play,
  ExternalLink,
  Search,
  Film,
  Building2,
  X,
  FileCheck,
  ShieldCheck,
  Lock,
  ArrowRight,
  QrCode,
  FolderKanban
} from 'lucide-react';

interface ProposalProjectItem {
  id: string;
  name: string;
  alias: string;
  proposalTitle: string;
  category: string;
  sampleVideoTitles: string[];
}

const PROPOSAL_PROJECTS: ProposalProjectItem[] = [
  {
    id: 'proj-khcu',
    name: '경희사이버대학교',
    alias: 'khcu',
    proposalTitle: '2026학년도 원격 정규 교육과정 콘텐츠 개발 사업 제안',
    category: '1인강의형 전면 연출',
    sampleVideoTitles: ['시니어재무컨설팅 (1인강의형 대표 샘플)', '세무실무적용사례 (1인강의형 대표 샘플)']
  },
  {
    id: 'proj-inha',
    name: '인하대학교',
    alias: 'inha26',
    proposalTitle: 'Bio Health ESG 및 오픈런 공개강좌 개발 사업 제안',
    category: '스튜디오형 고화질 1080p',
    sampleVideoTitles: ['디지털 전환(DX)과 일자리 환경 변화', 'Bio Health 산업의 ESG 실행과 사회공헌']
  },
  {
    id: 'proj-foren',
    name: '경찰수사연수원',
    alias: '26foren04',
    proposalTitle: '디지털포렌식 및 가상자산 수사 심화 교육과정 제작 제안',
    category: '모션그래픽 및 3D 다이어그램',
    sampleVideoTitles: ['2025년 불법 자금 규모', '중국어 기반 자금세탁 네트워크의 부상', 'CMLN이 파는 여섯 가지 상품']
  },
  {
    id: 'proj-syu',
    name: '삼육대학교',
    alias: 'syu26',
    proposalTitle: '스마트미래교육 SU-MOOC 디지털 리터러시 개발 제안',
    category: '크로마키형 그래픽 합성',
    sampleVideoTitles: ['생성형 AI를 활용한 상호작용 설계', '크로마키 합성 교육과정']
  },
  {
    id: 'proj-bio-esg',
    name: '대구보건대학교',
    alias: 'dhc26',
    proposalTitle: 'Bio Health 시대의 ESG와 지속 가능한 성장 콘텐츠 개발',
    category: 'ESG 특화 교육과정',
    sampleVideoTitles: ['ESG 마인드 없이는 성장도 없다', 'ESG와 기업의 사회적 책임', '지속가능경영 보고서 프레임워크']
  }
];

export const ProposalSampleView: React.FC = () => {
  const {
    projects,
    setCurrentProjectSlug,
    setUserViewMode,
    language
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedAlias, setCopiedAlias] = useState<string | null>(null);

  // Selected project for QR modal
  const [selectedForQr, setSelectedForQr] = useState<ProposalProjectItem | null>(null);
  const modalQrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Filter projects
  const filteredList = useMemo(() => {
    return PROPOSAL_PROJECTS.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.alias.toLowerCase().includes(q) ||
        item.proposalTitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  // Generate delivery link for a given project alias
  const getDeliveryUrl = (alias: string) => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    return `${origin}/?p=${encodeURIComponent(alias)}`;
  };

  // Copy delivery link
  const handleCopyLink = async (alias: string) => {
    const url = getDeliveryUrl(alias);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedAlias(alias);
      setTimeout(() => setCopiedAlias(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Open direct Video Review System for this client
  const handleOpenReviewSystem = (alias: string) => {
    setCurrentProjectSlug(alias);
    setUserViewMode('review');
  };

  // Modal QR Code generation
  useEffect(() => {
    if (!selectedForQr || !modalQrCanvasRef.current) return;
    const url = getDeliveryUrl(selectedForQr.alias);
    QRCode.toCanvas(modalQrCanvasRef.current, url, {
      width: 170,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' }
    });
  }, [selectedForQr]);

  // Download QR code PNG
  const handleDownloadQrPng = (item: ProposalProjectItem) => {
    if (!modalQrCanvasRef.current) return;
    try {
      const dataUrl = modalQrCanvasRef.current.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${item.name}_제안서_검수_QR.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 pb-14 font-sans">
      {/* ================= 1. HEADER BANNER ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <FileCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>제안서 서류평가 QR·URL 발급기 (업무요청 대체)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              제안사별 영상 검수 시스템 전용 링크 & QR코드 발급
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              대학 및 기관 입찰 제안서에 삽입할 <strong>영상 검수 시스템 링크와 QR코드</strong>를 실시간 발급합니다.
              심사위원이 접속 시 <strong>실제 영상 검수 시스템</strong>이 열리며, 오직 <strong>해당 제안사의 샘플 영상만</strong> 노출됩니다.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-xs font-semibold px-3 py-2 bg-slate-100 rounded-lg text-slate-700">
              제안 프로젝트: <strong>{PROPOSAL_PROJECTS.length}개</strong>
            </div>
          </div>
        </div>

        {/* Isolation Guarantee Bar */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50/80 px-3.5 py-2.5 rounded-xl border border-emerald-200/80">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>심사위원 격리 원칙:</strong> 제안사 심사위원이 전달받은 링크(또는 QR)로 접속하면 타사 및 타 기관 프로젝트 목록은 일체 비노출 격리되며, 오직 지정된 샘플 영상만 검수할 수 있습니다.
          </span>
        </div>
      </div>

      {/* ================= 2. SEARCH BAR ================= */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="제안사명, 제안 사업명, 강의 형태 검색"
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
          />
        </div>
      </div>

      {/* ================= 3. PROPOSAL CLIENT CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredList.map(item => {
          const deliveryUrl = getDeliveryUrl(item.alias);
          const isCopied = copiedAlias === item.alias;

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-500 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5">
                {/* Top Badge & Code */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {item.category}
                  </span>
                  <span className="font-mono text-xs text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                    /{item.alias}
                  </span>
                </div>

                {/* Institution & Title */}
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                  {item.proposalTitle}
                </p>

                {/* Sample Videos List */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    심사위원에게 노출되는 샘플 영상:
                  </div>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {item.sampleVideoTitles.map((title, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 truncate">
                        <span className="text-blue-500 font-black">◆</span>
                        <span className="truncate">{title}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Delivery URL Box */}
                <div className="mt-4 p-2.5 bg-slate-900 text-white rounded-xl text-xs font-mono flex items-center justify-between gap-2 shadow-inner">
                  <span className="text-blue-300 truncate select-all">{deliveryUrl}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(item.alias)}
                    className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white shrink-0 cursor-pointer"
                    title="제안서 기재용 링크 복사"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedForQr(item)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  title="QR코드 이미지 다운로드 및 확인"
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                  <span>QR코드 다운로드</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenReviewSystem(item.alias)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                  title="이 제안사의 영상 검수 시스템 화면으로 바로 이동"
                >
                  <span>검수 시스템 열기</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= 4. QR CODE MODAL ================= */}
      {selectedForQr && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-slate-200 shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {selectedForQr.name} 제안서용 QR코드
                  </h3>
                  <p className="text-xs text-slate-500">
                    /{selectedForQr.alias} 전용 영상 검수 시스템 링크
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedForQr(null)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-center">
              <div className="inline-block p-3 bg-white rounded-2xl border border-slate-200 shadow-md">
                <canvas ref={modalQrCanvasRef} width={170} height={170} className="w-[150px] h-[150px]" />
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-800">
                  제안서 서류평가 문서 삽입용 (한글 HWP, Word, PPT)
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  평가위원이 스마트폰으로 이 QR을 스캔하면, <strong>{selectedForQr.name}</strong> 전용 영상 검수 시스템이 바로 열립니다.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadQrPng(selectedForQr)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>QR코드 PNG 다운로드</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyLink(selectedForQr.alias)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-blue-600" />
                  <span>{copiedAlias === selectedForQr.alias ? '복사됨!' : '전용 URL 복사'}</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedForQr(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg cursor-pointer"
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
