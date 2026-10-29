import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../utils/i18n';
import {
  Film,
  FolderKanban,
  FileText,
  Sparkles,
  BookOpen,
  Plus,
  Play,
  ArrowRight,
  Shield,
  Layers,
  Users,
  CheckCircle2,
  Clock,
  X,
  PlusCircle,
  ExternalLink
} from 'lucide-react';

interface IntranetPortalHomeProps {
  onOpenVideoReview: () => void;
  onOpenAdmin: () => void;
}

export const IntranetPortalHome: React.FC<IntranetPortalHomeProps> = ({
  onOpenVideoReview,
  onOpenAdmin
}) => {
  const { videos, projects, currentUser, setSelectedVideo, language } = useApp();
  const t = translations[language];

  const [activeModal, setActiveModal] = useState<
    'handbook' | 'projects' | 'newTool' | 'culture' | 'teamUpdate' | 'annualReport' | null
  >(null);

  // Dynamic user-added tools list (matching "거기에 툴을 하나씩 얹어가려고 함")
  const [internalTools, setInternalTools] = useState<
    { id: string; name: string; category: string; desc: string; status: string; link?: string }[]
  >([
    {
      id: 'tool-video-review',
      name: '동영상 강의 검수 시스템',
      category: '핵심 업무 툴',
      desc: '동영상 강의 초단위 타임코드 피드백, 승인/반려 결정, Gemini AI 3.8 Flash 자막 생성',
      status: '운영중 (Active)'
    },
    {
      id: 'tool-ai-transcribe',
      name: 'AI 자막 & 스크립트 허브',
      category: '콘텐츠 제작',
      desc: '강의 음성인식 기반 SRT/VTT 타임스탬프 추출 및 영문 자동 번역 인덱서',
      status: '운영중 (Active)'
    },
    {
      id: 'tool-lms-export',
      name: 'LMS 패키징 & 배포 매니저',
      category: '유통 및 연동',
      desc: '대학 및 교육기관 CMS/LMS 표준 메타데이터 연동 및 SCORM 패키지 빌더',
      status: '개발 진행중 (Beta)'
    }
  ]);

  const [newToolForm, setNewToolForm] = useState({
    name: '',
    category: '사내 생산성',
    desc: ''
  });

  const handleAddTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToolForm.name.trim()) return;

    const newTool = {
      id: `tool-${Date.now()}`,
      name: newToolForm.name.trim(),
      category: newToolForm.category,
      desc: newToolForm.desc.trim() || '신규 등록된 사내 임직원 전용 업무 도구입니다.',
      status: '준비중 (Planned)'
    };

    setInternalTools(prev => [newTool, ...prev]);
    setNewToolForm({ name: '', category: '사내 생산성', desc: '' });
  };

  const pendingVideosCount = videos.filter(v => v.status === 'PENDING').length;
  const approvedVideosCount = videos.filter(v => v.status === 'APPROVED').length;
  const latestVideo = videos[0];

  return (
    <div className="relative w-full min-h-[calc(100vh-130px)] flex flex-col justify-center py-6 sm:py-10">
      
      {/* Background Cyber-Wave Artwork matching Reference Screenshot */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-40">
        <svg
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover scale-105"
        >
          <path
            d="M-100 600 C 300 400, 500 800, 900 300 C 1200 -50, 1400 350, 1600 200"
            stroke="url(#cyanGlow)"
            strokeWidth="3"
            strokeOpacity="0.4"
          />
          <path
            d="M-50 450 C 400 250, 600 700, 1100 200 C 1350 -50, 1500 300, 1650 150"
            stroke="url(#magentaGlow)"
            strokeWidth="2.5"
            strokeOpacity="0.5"
          />
          <path
            d="M-80 520 C 350 320, 550 750, 1000 250 C 1280 0, 1450 320, 1620 180"
            stroke="url(#cyanGlow)"
            strokeWidth="1.2"
            strokeOpacity="0.3"
          />
          {/* Subtle horizontal grid lines */}
          {Array.from({ length: 8 }).map((_, i) => (
            <line
              key={i}
              x1="0"
              y1={150 + i * 90}
              x2="1440"
              y2={150 + i * 90}
              stroke="#7c3aed"
              strokeOpacity="0.05"
              strokeDasharray="4 8"
            />
          ))}
          <defs>
            <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
            <linearGradient id="magentaGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="50%" stopColor="#d946ef" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6">
        
        {/* Intranet Top Welcome Banner */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-fuchsia-900/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse" />
              <span className="text-xs font-bold text-fuchsia-400 uppercase tracking-widest">
                WHOMEDIA Internal Employee Intranet
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              사내 임직원 업무 포털
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenVideoReview}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-fuchsia-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Film className="w-4 h-4 text-white" />
              <span>동영상 강의 검수 바로가기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================= EXACT 4-COLUMN CARD GRID MATCHING REFERENCE SCREENSHOT ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          
          {/* ================= COLUMN 1 ================= */}
          <div className="flex flex-col gap-4 sm:gap-5">
            
            {/* Top-Left: Logo & Brand Outlined Card (Exact match to top-left "하퍼스" card) */}
            <div className="relative aspect-4/3 sm:aspect-square lg:aspect-4/3 rounded-2xl border-2 border-indigo-400/80 bg-slate-950/40 backdrop-blur-md p-5 flex flex-col items-center justify-center text-center shadow-lg shadow-indigo-500/10 hover:border-indigo-300 transition-all group select-none">
              
              {/* Dotted Halo Circular Logo Artwork */}
              <div className="relative w-20 h-20 mb-3 flex items-center justify-center">
                {/* Concentric dotted rings */}
                <svg viewBox="0 0 100 100" className="w-full h-full animate-spin-slow">
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="none"
                    stroke="#ec4899"
                    strokeWidth="2.5"
                    strokeDasharray="2 6"
                    strokeOpacity="0.7"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="34"
                    fill="none"
                    stroke="#d946ef"
                    strokeWidth="2"
                    strokeDasharray="2 5"
                    strokeOpacity="0.85"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="24"
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="1.5"
                    strokeDasharray="2 4"
                    strokeOpacity="0.6"
                  />
                </svg>

                {/* Central Emblem 'W' */}
                <div className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-slate-900/90 border border-fuchsia-400/40 flex items-center justify-center text-white font-black text-lg tracking-tighter shadow-inner shadow-fuchsia-500/30">
                  <span className="text-transparent bg-clip-text bg-gradient-to-br from-red-500 via-rose-400 to-white">
                    W
                  </span>
                </div>
              </div>

              {/* Company Title (Strictly without (주)후미디어) */}
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wider">
                <span className="text-red-500">WHO</span>MEDIA
              </h2>
              <p className="text-[11px] font-semibold text-indigo-300/80 mt-1">
                사내 임직원 업무 포털
              </p>
            </div>

            {/* Bottom: Tall Crisp White Card (Exact match to "팀 업데이트" tall card) */}
            <div
              onClick={() => setActiveModal('teamUpdate')}
              className="relative flex-1 min-h-[260px] sm:min-h-[300px] rounded-2xl bg-white text-slate-900 p-6 flex flex-col justify-between shadow-2xl hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer group"
            >
              {/* Corner Magenta Plus Badge */}
              <div className="self-end w-7 h-7 rounded-full bg-fuchsia-600 group-hover:bg-fuchsia-500 flex items-center justify-center text-white shadow-md shadow-fuchsia-500/30 transition-transform group-hover:scale-110">
                <Plus className="w-4 h-4 stroke-[3]" />
              </div>

              {/* Centered Large Bold Text */}
              <div className="my-auto text-center py-4">
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 leading-tight">
                  팀<br />업데이트
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-3">
                  제작실 & 영상검수팀 실시간 현황
                </p>
              </div>

              {/* Bottom Quick Indicator */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>최신 검수 차시</span>
                <span className="text-fuchsia-600 font-mono">
                  {latestVideo?.fileName || 'dhc26_01.mp4'}
                </span>
              </div>
            </div>

          </div>

          {/* ================= COLUMN 2 ================= */}
          <div className="flex flex-col gap-4 sm:gap-5">
            
            {/* Top: Neon Outlined Card 1 (Exact match to "직원 핸드북" / Core Video Review Tool) */}
            <div
              onClick={onOpenVideoReview}
              className="relative aspect-square rounded-2xl border-2 border-fuchsia-500/85 hover:border-pink-400 bg-slate-950/45 backdrop-blur-md p-6 flex flex-col justify-between text-white shadow-xl shadow-fuchsia-500/10 hover:shadow-fuchsia-500/20 hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer group"
            >
              {/* Corner Magenta Plus Badge */}
              <div className="self-end w-7 h-7 rounded-full bg-fuchsia-600 group-hover:bg-fuchsia-500 flex items-center justify-center text-white shadow-md shadow-fuchsia-500/40 transition-transform group-hover:scale-110">
                <Plus className="w-4 h-4 stroke-[3]" />
              </div>

              {/* Centered Large Bold Text */}
              <div className="my-auto text-center py-2">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug group-hover:text-fuchsia-200 transition-colors">
                  동영상<br />강의 검수
                </h3>
                <span className="inline-block mt-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40">
                  ⚡ 운영 툴 바로가기
                </span>
              </div>

              {/* Bottom Stats */}
              <div className="pt-2 border-t border-fuchsia-900/40 flex items-center justify-between text-[11px] text-fuchsia-300 font-semibold">
                <span>검수 대기:</span>
                <span className="font-mono text-white font-bold">{pendingVideosCount}건</span>
              </div>
            </div>

            {/* Bottom: Crisp White Card (Exact match to "연례 보고서") */}
            <div
              onClick={() => setActiveModal('annualReport')}
              className="relative aspect-square rounded-2xl bg-white text-slate-900 p-6 flex flex-col justify-between shadow-2xl hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer group"
            >
              {/* Corner Magenta Plus Badge */}
              <div className="self-end w-7 h-7 rounded-full bg-fuchsia-600 group-hover:bg-fuchsia-500 flex items-center justify-center text-white shadow-md shadow-fuchsia-500/30 transition-transform group-hover:scale-110">
                <Plus className="w-4 h-4 stroke-[3]" />
              </div>

              {/* Centered Large Bold Text */}
              <div className="my-auto text-center py-2">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 leading-snug">
                  연례<br />보고서
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-2">
                  2026 콘텐츠 품질 지표
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>승인율</span>
                <span className="text-emerald-600 font-mono font-black">
                  {videos.length > 0 ? Math.round((approvedVideosCount / videos.length) * 100) : 0}%
                </span>
              </div>
            </div>

          </div>

          {/* ================= COLUMN 3 ================= */}
          <div className="flex flex-col gap-4 sm:gap-5">
            
            {/* Top: Neon Outlined Card 2 (Exact match to "프로젝트 보고서") */}
            <div
              onClick={() => setActiveModal('projects')}
              className="relative aspect-square rounded-2xl border-2 border-fuchsia-500/85 hover:border-pink-400 bg-slate-950/45 backdrop-blur-md p-6 flex flex-col justify-between text-white shadow-xl shadow-fuchsia-500/10 hover:shadow-fuchsia-500/20 hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer group"
            >
              {/* Corner Magenta Plus Badge */}
              <div className="self-end w-7 h-7 rounded-full bg-fuchsia-600 group-hover:bg-fuchsia-500 flex items-center justify-center text-white shadow-md shadow-fuchsia-500/40 transition-transform group-hover:scale-110">
                <Plus className="w-4 h-4 stroke-[3]" />
              </div>

              {/* Centered Large Bold Text */}
              <div className="my-auto text-center py-2">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug group-hover:text-fuchsia-200 transition-colors">
                  프로젝트<br />보고서
                </h3>
                <p className="text-xs font-semibold text-fuchsia-300/80 mt-2">
                  대학·협회별 강좌 현황
                </p>
              </div>

              <div className="pt-2 border-t border-fuchsia-900/40 flex items-center justify-between text-[11px] text-fuchsia-300 font-semibold">
                <span>진행 강좌</span>
                <span className="font-mono text-white font-bold">{projects.length}개 기관</span>
              </div>
            </div>

            {/* Bottom: Crisp White Card (Exact match to "새로운 서비스") */}
            <div
              onClick={() => setActiveModal('newTool')}
              className="relative aspect-square rounded-2xl bg-white text-slate-900 p-6 flex flex-col justify-between shadow-2xl hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer group border-2 border-transparent hover:border-fuchsia-500/30"
            >
              {/* Corner Magenta Plus Badge */}
              <div className="self-end w-7 h-7 rounded-full bg-fuchsia-600 group-hover:bg-fuchsia-500 flex items-center justify-center text-white shadow-md shadow-fuchsia-500/30 transition-transform group-hover:scale-110">
                <Plus className="w-4 h-4 stroke-[3]" />
              </div>

              {/* Centered Large Bold Text */}
              <div className="my-auto text-center py-2">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 leading-snug">
                  새로운<br />서비스
                </h3>
                <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200">
                  + 사내 툴 추가하기
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>연동 툴 수</span>
                <span className="text-indigo-600 font-mono font-black">{internalTools.length}개</span>
              </div>
            </div>

          </div>

          {/* ================= COLUMN 4 ================= */}
          <div className="flex flex-col gap-4 sm:gap-5">
            
            {/* Top: Neon Outlined Card 3 (Exact match to "채용 허브" / AI Subtitle Hub) */}
            <div
              onClick={() => setActiveModal('handbook')}
              className="relative aspect-square rounded-2xl border-2 border-fuchsia-500/85 hover:border-pink-400 bg-slate-950/45 backdrop-blur-md p-6 flex flex-col justify-between text-white shadow-xl shadow-fuchsia-500/10 hover:shadow-fuchsia-500/20 hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer group"
            >
              {/* Corner Magenta Plus Badge */}
              <div className="self-end w-7 h-7 rounded-full bg-fuchsia-600 group-hover:bg-fuchsia-500 flex items-center justify-center text-white shadow-md shadow-fuchsia-500/40 transition-transform group-hover:scale-110">
                <Plus className="w-4 h-4 stroke-[3]" />
              </div>

              {/* Centered Large Bold Text */}
              <div className="my-auto text-center py-2">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug group-hover:text-fuchsia-200 transition-colors">
                  직원<br />핸드북
                </h3>
                <p className="text-xs font-semibold text-fuchsia-300/80 mt-2">
                  사내 규정 및 검수 가이드
                </p>
              </div>

              <div className="pt-2 border-t border-fuchsia-900/40 flex items-center justify-between text-[11px] text-fuchsia-300 font-semibold">
                <span>가이드라인</span>
                <span className="font-mono text-white font-bold">2026 최신판</span>
              </div>
            </div>

            {/* Bottom: Crisp White Card (Exact match to "사내 문화") */}
            <div
              onClick={() => setActiveModal('culture')}
              className="relative aspect-square rounded-2xl bg-white text-slate-900 p-6 flex flex-col justify-between shadow-2xl hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer group"
            >
              {/* Corner Magenta Plus Badge */}
              <div className="self-end w-7 h-7 rounded-full bg-fuchsia-600 group-hover:bg-fuchsia-500 flex items-center justify-center text-white shadow-md shadow-fuchsia-500/30 transition-transform group-hover:scale-110">
                <Plus className="w-4 h-4 stroke-[3]" />
              </div>

              {/* Centered Large Bold Text */}
              <div className="my-auto text-center py-2">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 leading-snug">
                  사내<br />문화
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-2">
                  소통 및 복지 프로그램
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>공지사항</span>
                <span className="text-fuchsia-600 font-mono font-bold">NEW 3건</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ================= INTERACTIVE INTRANET MODALS ================= */}

      {/* 1. 새로운 사내 서비스 등록 & 툴 목록 모달 (Matching "거기에 툴을 하나씩 얹어가려고 함") */}
      {activeModal === 'newTool' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-fuchsia-500/40 rounded-2xl shadow-2xl overflow-hidden text-white p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-fuchsia-600 flex items-center justify-center text-white">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">사내 툴 및 서비스 관리</h3>
                  <p className="text-xs text-slate-400">사내 직원이 사용하는 내부 툴을 확인하고 새 툴을 추가할 수 있습니다.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Currently Integrated Tools List */}
            <div className="my-5 space-y-2.5 max-h-60 overflow-y-auto pr-1">
              <div className="text-xs font-bold text-fuchsia-400 uppercase tracking-wider mb-2">
                현재 연동된 사내 툴 목록 ({internalTools.length})
              </div>
              {internalTools.map(tool => (
                <div
                  key={tool.id}
                  className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-fuchsia-500/40 flex items-start justify-between gap-3 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">{tool.name}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {tool.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{tool.desc}</p>
                  </div>
                  <span className="shrink-0 px-2 py-1 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {tool.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Add New Tool Form */}
            <form onSubmit={handleAddTool} className="pt-4 border-t border-slate-800">
              <div className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-fuchsia-400" />
                <span>새로운 사내 툴 연동 등록하기</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    placeholder="새 툴 이름 (예: 사내 번역기, 미디어 인덱서 등)"
                    value={newToolForm.name}
                    onChange={e => setNewToolForm({ ...newToolForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-white placeholder-slate-500 focus:outline-hidden focus:border-fuchsia-500"
                  />
                </div>
                <div>
                  <select
                    value={newToolForm.category}
                    onChange={e => setNewToolForm({ ...newToolForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-white focus:outline-hidden focus:border-fuchsia-500"
                  >
                    <option value="사내 생산성">사내 생산성</option>
                    <option value="콘텐츠 제작">콘텐츠 제작</option>
                    <option value="데이터 분석">데이터 분석</option>
                    <option value="인사/행정">인사/행정</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="도구 설명 및 사내 활용 용도"
                  value={newToolForm.desc}
                  onChange={e => setNewToolForm({ ...newToolForm, desc: e.target.value })}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-white placeholder-slate-500 focus:outline-hidden focus:border-fuchsia-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-lg text-xs font-bold transition-colors shrink-0"
                >
                  + 등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. 팀 업데이트 모달 */}
      {activeModal === 'teamUpdate' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl bg-slate-900 border border-indigo-500/40 rounded-2xl shadow-2xl overflow-hidden text-white p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-black text-white">제작팀 & 검수팀 최근 업데이트</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="my-4 space-y-3">
              <div className="p-3 bg-slate-800 rounded-xl text-xs">
                <span className="text-fuchsia-400 font-bold">[검수 완료]</span> 인하대학교 2026 오픈런 1차시 영상 검수 승인 완료되었습니다.
              </div>
              <div className="p-3 bg-slate-800 rounded-xl text-xs">
                <span className="text-emerald-400 font-bold">[신규 업로드]</span> Bio Health ESG 6개 차시 1080p 마스터본이 스토리지에 동기화되었습니다.
              </div>
              <div className="p-3 bg-slate-800 rounded-xl text-xs">
                <span className="text-blue-400 font-bold">[AI 자막]</span> 삼육대학교 스마트미래교육 SU-MOOC 2개 차시 타임코드 자막 인덱싱이 완료되었습니다.
              </div>
            </div>
            <button
              onClick={() => {
                setActiveModal(null);
                onOpenVideoReview();
              }}
              className="w-full py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-xs font-bold transition-colors"
            >
              검수 워크스페이스로 이동하여 확인하기
            </button>
          </div>
        </div>
      )}

      {/* 3. 직원 핸드북 모달 */}
      {activeModal === 'handbook' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-fuchsia-500/40 rounded-2xl shadow-2xl overflow-hidden text-white p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-black text-white">WHOMEDIA 사내 직원 업무 핸드북</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="my-4 space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="p-3 bg-slate-800 rounded-xl">
                <h4 className="font-bold text-white mb-1">1. 동영상 강의 감수 및 검수 기준</h4>
                <p>도입부 타이틀 모션 오타 검수, 교수자 마이크 오디오 싱크 일치 여부, 판서 및 슬라이드 해상도(최소 1080p 60fps)를 반드시 확인 후 승인 처리합니다.</p>
              </div>
              <div className="p-3 bg-slate-800 rounded-xl">
                <h4 className="font-bold text-white mb-1">2. 반려 처리 프로세스</h4>
                <p>화면 싱크 오류 또는 자막 오탈자 발견 시 정확한 타임코드(예: 02:45)와 함께 반려 사유를 등록하여 제작자에게 실시간 알림을 전달합니다.</p>
              </div>
              <div className="p-3 bg-slate-800 rounded-xl">
                <h4 className="font-bold text-white mb-1">3. 사내 보안 및 데이터 취급 원칙</h4>
                <p>본 인트라넷은 사내 직원 전용 시스템으로 외부 반출이 금지되어 있으며, 모든 접근 기록은 실시간 감사 로그에 기록됩니다.</p>
              </div>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 4. 프로젝트 보고서 모달 */}
      {activeModal === 'projects' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-fuchsia-500/40 rounded-2xl shadow-2xl overflow-hidden text-white p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-black text-white">2026 교과목 및 강좌 프로젝트 현황</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="my-4 space-y-3 max-h-72 overflow-y-auto pr-1">
              {projects.map(proj => (
                <div key={proj.id} className="p-3.5 bg-slate-800 rounded-xl text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm">{proj.name}</h4>
                    <span className="font-mono text-fuchsia-400 font-bold">/{proj.alias}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-slate-400 font-medium">
                    <span>주차 수: {proj.weekCount}주차</span>
                    <span>·</span>
                    <span>차시 수: {proj.sessionCount}개 차시</span>
                    <span>·</span>
                    <span>등록 동영상: {proj.videoCount}개</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setActiveModal(null);
                onOpenAdmin();
              }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors"
            >
              프로젝트 관리자 콘솔 열기
            </button>
          </div>
        </div>
      )}

      {/* 5. 연례 보고서 모달 */}
      {activeModal === 'annualReport' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-white p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white">2026 연례 품질 검수 보고서</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs text-slate-300">
              <div className="flex justify-between p-3 bg-slate-800 rounded-lg">
                <span>총 검수 차시</span>
                <span className="font-bold text-white">{videos.length}개 차시</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-800 rounded-lg">
                <span>최종 승인 완료</span>
                <span className="font-bold text-emerald-400">{approvedVideosCount}개 (승인율 {videos.length > 0 ? Math.round((approvedVideosCount / videos.length) * 100) : 0}%)</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-800 rounded-lg">
                <span>검수 대기중</span>
                <span className="font-bold text-amber-400">{pendingVideosCount}개 차시</span>
              </div>
            </div>
            <button onClick={() => setActiveModal(null)} className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold">
              확인 완료
            </button>
          </div>
        </div>
      )}

      {/* 6. 사내 문화 모달 */}
      {activeModal === 'culture' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-slate-900 border border-fuchsia-500/40 rounded-2xl shadow-2xl overflow-hidden text-white p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white">WHOMEDIA 사내 문화 & 공지</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-800 rounded-lg">
                <div className="font-bold text-white mb-1">🚀 2026 디지털 교육콘텐츠 역량 강화 워크숍</div>
                <p className="text-slate-400">전 직원 대상 최신 생성형 AI 자막 및 멀티미디어 저작 도구 사내 교육이 예정되어 있습니다.</p>
              </div>
              <div className="p-3 bg-slate-800 rounded-lg">
                <div className="font-bold text-white mb-1">☕ 유연근무제 및 리프레시 데이 안내</div>
                <p className="text-slate-400">매월 마지막 주 금요일은 집중 검수 후 1시간 조기 퇴근이 시행됩니다.</p>
              </div>
            </div>
            <button onClick={() => setActiveModal(null)} className="w-full py-2 bg-fuchsia-600 hover:bg-fuchsia-500 rounded-lg text-xs font-bold">
              확인
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
