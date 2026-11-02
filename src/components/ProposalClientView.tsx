import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ProposalSampleItem, ProposalClientPackage } from '../types';
import { WhomediaLogo } from './WhomediaLogo';
import {
  ShieldCheck,
  Play,
  Film,
  Building2,
  ExternalLink,
  Lock,
  ArrowLeft,
  X,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';

interface ProposalClientViewProps {
  clientSlug: string;
  isPreview?: boolean;
  onExitPreview?: () => void;
}

export const ProposalClientView: React.FC<ProposalClientViewProps> = ({
  clientSlug,
  isPreview = false,
  onExitPreview
}) => {
  const { proposalClients, proposalSamples, language } = useApp();
  const [activeVideo, setActiveVideo] = useState<ProposalSampleItem | null>(null);

  // Find the matching client proposal package
  const clientPackage = useMemo<ProposalClientPackage | undefined>(() => {
    return proposalClients.find(
      c => c.slug.toLowerCase() === clientSlug.toLowerCase() || c.id === clientSlug
    );
  }, [proposalClients, clientSlug]);

  // STRICT ISOLATION: Filter ONLY the samples assigned to this client!
  const assignedSamples = useMemo<ProposalSampleItem[]>(() => {
    if (!clientPackage) return [];
    const assignedSet = new Set(clientPackage.assignedSampleIds);
    return proposalSamples.filter(sample => assignedSet.has(sample.id));
  }, [clientPackage, proposalSamples]);

  if (!clientPackage) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4 text-amber-400">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold mb-2">제안서 평가 대상을 찾을 수 없습니다</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          요청하신 제안 심사용 주소(<span className="font-mono text-amber-300">/{clientSlug}</span>)에 해당하는
          제안서 정보가 만료되었거나 비활성화되었습니다. 제안서에 기재된 담당자에게 문의해 주세요.
        </p>
        {isPreview && onExitPreview && (
          <button
            type="button"
            onClick={onExitPreview}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>관리자 콘솔로 돌아가기</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 font-sans flex flex-col">
      {/* ================= 1. PREVIEW BANNER (IF IN ADMIN PREVIEW) ================= */}
      {isPreview && (
        <aside aria-label="관리자 미리보기 배너" className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xs sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>
              [관리자 미리보기 모드] 현재 화면은 <strong>{clientPackage.name}</strong> 제안서 심사위원에게
              실제로 노출되는 전용 페이지입니다. (타 기관 샘플 100% 차단됨)
            </span>
          </div>
          {onExitPreview && (
            <button
              type="button"
              onClick={onExitPreview}
              className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 hover:bg-black text-white rounded-md text-xs font-bold transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>관리자 콘솔로 복귀</span>
            </button>
          )}
        </aside>
      )}

      {/* ================= 2. CLIENT PROPOSAL HEADER ================= */}
      <header className="bg-white border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <WhomediaLogo size="md" subtitle="제안서 서류평가 심사용" />
            </div>

            {/* Security Isolation Badge */}
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{clientPackage.name} 심사위원 전용 안심 링크</span>
              </div>
            </div>
          </div>

          {/* Proposal Title & Institution Lockup */}
          <div className="mt-5 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700 tracking-wider uppercase mb-1">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{clientPackage.name} 귀중</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {clientPackage.proposalTitle}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
              {clientPackage.customNotice ||
                `${clientPackage.name} 제안서 서류평가를 위한 온라인 강좌 샘플 영상 포트폴리오입니다. 본 페이지는 심사위원 전용으로 구성되어 있습니다.`}
            </p>
          </div>
        </div>
      </header>

      {/* ================= 3. CONFIDENTIALITY & EVALUATOR NOTICE ================= */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full">
        <div className="bg-blue-50/80 border border-blue-200/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-2.5 text-xs text-blue-900 font-medium">
            <Lock className="w-4 h-4 text-blue-700 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong>보안 및 평가 보장 안내:</strong> 본 페이지는 <strong>{clientPackage.name}</strong> 전용으로
              편성된 샘플(총 {assignedSamples.length}건)만 표시되며, 타 기관 또는 타 사 샘플은 일체 노출되지 않습니다.
            </span>
          </div>
          <span className="text-[11px] text-blue-700 font-mono shrink-0">
            평가 강좌: {assignedSamples.length}개
          </span>
        </div>
      </div>

      {/* ================= 4. SAMPLES GRID (MATCHING USER SCREENSHOT 1:1) ================= */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {assignedSamples.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <Film className="w-12 h-12 mx-auto text-slate-300" />
            <h2 className="text-base font-bold text-slate-700">등록된 제안 샘플이 없습니다.</h2>
            <p className="text-xs text-slate-400">
              {clientPackage.name} 제안서에 배정된 샘플 영상이 준비 중입니다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignedSamples.map(sample => (
              <div
                key={sample.id}
                className="group bg-white rounded-2xl border border-slate-200/90 hover:border-blue-500 shadow-2xs hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden"
              >
                {/* 16:9 Thumbnail Area with Click-to-Play */}
                <div
                  className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer select-none"
                  onClick={() => setActiveVideo(sample)}
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

                  {/* Duration Badge */}
                  {sample.duration && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[11px] font-mono font-medium text-white shadow-xs">
                      {Math.floor(sample.duration / 60)}:
                      {String(sample.duration % 60).padStart(2, '0')}
                    </div>
                  )}

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/45 flex items-center justify-center transition-all">
                    <div className="w-12 h-12 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Card Body (1:1 with User Attachment) */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* ◆ 강좌명 (Blue diamond + Bold Title) */}
                    <div className="flex items-start gap-1.5">
                      <span className="text-sky-600 font-black text-sm select-none leading-tight mt-0.5">◆</span>
                      <h3 className="font-bold text-slate-900 text-base leading-snug tracking-tight">
                        {sample.title}
                      </h3>
                    </div>

                    {/* 기관명 */}
                    <div className="text-xs sm:text-sm font-semibold text-slate-700 mt-1.5 pl-4">
                      {sample.institution}
                    </div>

                    {/* 강의형태 뱃지 (e.g. 1인강의형) */}
                    <div className="mt-2.5 pl-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200/50">
                        {sample.lectureType}
                      </span>
                    </div>

                    {/* 특징 불릿 목록 */}
                    <ul className="mt-3.5 space-y-1.5 text-xs text-slate-600 pl-4 border-t border-slate-100 pt-3">
                      {sample.descriptionBullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-slate-400 select-none">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Card Action Button */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveVideo(sample)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>샘플 영상 시청하기 (Full HD)</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ================= 5. FOOTER ================= */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 font-sans">
        <div className="max-w-6xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-700">
            WHOMEDIA · (주)후미디어 제안사업본부
          </p>
          <p className="text-slate-400">
            본 페이지의 영상 및 콘텐츠 저작권은 (주)후미디어 및 해당 발주기관에 있으며, 무단 복제 및 재배포를 금합니다.
          </p>
        </div>
      </footer>

      {/* ================= 6. VIDEO PLAYBACK MODAL ================= */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-slate-900 rounded-2xl max-w-4xl w-full overflow-hidden border border-slate-700 shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between text-white">
              <div className="flex items-center gap-2 truncate">
                <span className="text-sky-400 font-black">◆</span>
                <h3 className="font-bold text-base sm:text-lg truncate">{activeVideo.title}</h3>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-sky-950 text-sky-300 border border-sky-800 shrink-0">
                  {activeVideo.institution}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-700 text-slate-200 shrink-0">
                  {activeVideo.lectureType}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video
                src={activeVideo.videoUrl}
                controls
                autoPlay
                className="w-full h-full max-h-[70vh] object-contain"
              >
                동영상 재생을 지원하지 않는 브라우저입니다.
              </video>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-800/60 border-t border-slate-700 text-xs sm:text-sm text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                {activeVideo.instructor && (
                  <div className="text-slate-400 font-medium">
                    교수자 / 강사: <span className="text-white font-semibold">{activeVideo.instructor}</span>
                  </div>
                )}
                <div className="text-slate-400 text-xs">
                  {activeVideo.descriptionBullets.join(' · ')}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
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
