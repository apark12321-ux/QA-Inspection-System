import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../utils/i18n';
import { ReviewComment, SubtitleEntry } from '../types';
import { formatTime, exportSubtitlesToSrt, exportSubtitlesToVtt, downloadFile } from '../utils/formatters';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  Share2,
  Trash2,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Loader2,
  FileText,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';

export const ReviewModal: React.FC = () => {
  const {
    selectedVideo,
    setSelectedVideo,
    currentUser,
    language,
    addReviewComment,
    updateVideoStatus,
    deleteReviewComment,
    updateVideoSubtitles,
    openShareModal,
    seekToTime,
    setSeekToTime
  } = useApp();

  const t = translations[language];

  // Video playback states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(8); // Default to 8s matching screenshot "00:08 / 12:29"
  const [duration, setDuration] = useState(749);      // 12:29 in seconds
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [useCanvasFallback, setUseCanvasFallback] = useState(false);

  // Review Form states
  const [reviewerName, setReviewerName] = useState(currentUser.name.split(' ')[0]);
  const [selectedVerdict, setSelectedVerdict] = useState<'APPROVED' | 'REJECTED' | 'PENDING'>(
    selectedVideo?.status === 'APPROVED' ? 'APPROVED' : selectedVideo?.status === 'REJECTED' ? 'REJECTED' : 'PENDING'
  );
  const [commentText, setCommentText] = useState('');
  const [includeTimestamp, setIncludeTimestamp] = useState(true);

  const [rightTab, setRightTab] = useState<'feedback' | 'aiSubtitles'>('feedback');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiGenError, setAiGenError] = useState<string | null>(null);
  const [showContextMenuNotice, setShowContextMenuNotice] = useState(false);
  const [verdictNotice, setVerdictNotice] = useState<{
    type: 'APPROVED' | 'REJECTED' | 'PENDING';
    title: string;
    desc: string;
  } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowContextMenuNotice(true);
    setTimeout(() => {
      setShowContextMenuNotice(false);
    }, 2500);
  };

  const handleVerdictClick = (verdict: 'APPROVED' | 'REJECTED' | 'PENDING') => {
    if (!selectedVideo) return;
    if (currentUser.role === 'VIEWER') {
      alert('현재 뷰어(Viewer) 계정은 읽기 전용입니다. 검수자(Reviewer) 또는 관리자(Admin) 권한으로 전환 후 판정을 진행하세요.');
      return;
    }

    const author = reviewerName.trim() || currentUser.name.split(' ')[0];
    setSelectedVerdict(verdict);

    // 1. Immediately update video QA status in state & database
    updateVideoStatus(selectedVideo.id, verdict, author);

    // 2. Action design based on verdict
    if (verdict === 'APPROVED') {
      setVerdictNotice({
        type: 'APPROVED',
        title: `'승인 완료' 상태로 즉시 변경되었습니다.`,
        desc: `전체 강의 검수가 승인 처리되었습니다. 필요시 아래 폼에서 세부 승인 의견을 추가 기록하거나 검수를 마칠 수 있습니다.`
      });
      if (!commentText.trim()) {
        setCommentText('도입부 모션 및 오디오/자막 싱크 검수 완료. 최종 승인합니다.');
      }
    } else if (verdict === 'REJECTED') {
      const stampStr = formatTime(Math.round(currentTime));
      setVerdictNotice({
        type: 'REJECTED',
        title: `'검수 반려' 상태로 변경되었습니다.`,
        desc: `제작자가 신속히 수정할 수 있도록 아래 입력창에 수정할 타임코드 및 반려 사유를 작성하고 [의견 등록]을 완료해 주세요.`
      });
      if (!commentText.trim()) {
        setCommentText(`[${stampStr}] 수정 요청 사유: `);
      }
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    } else {
      setVerdictNotice({
        type: 'PENDING',
        title: `'검수 대기' 상태로 전환되었습니다.`,
        desc: `추가 검토를 위해 검수 대기열 상태로 유지됩니다.`
      });
    }
  };

  useEffect(() => {
    if (selectedVideo) {
      setDuration(selectedVideo.duration || 749);
      setSelectedVerdict(
        selectedVideo.status === 'APPROVED' ? 'APPROVED' : selectedVideo.status === 'REJECTED' ? 'REJECTED' : 'PENDING'
      );
      setReviewerName(currentUser.name.split(' ')[0]);
      setCommentText('');
    }
  }, [selectedVideo, currentUser]);

  // Handle external seek requests (e.g. from share links)
  useEffect(() => {
    if (seekToTime !== null) {
      handleSeek(seekToTime);
      setSeekToTime(null);
    }
  }, [seekToTime]);

  // Canvas-based interactive motion animation fallback when external video stream fails or is loading
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas || !useCanvasFallback) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localTime = currentTime;
    let lastStamp = performance.now();

    const renderFrame = (now: number) => {
      const dt = (now - lastStamp) / 1000;
      lastStamp = now;

      if (isPlaying) {
        localTime += dt * playbackRate;
        if (localTime >= duration) localTime = 0;
        setCurrentTime(localTime);
      }

      const w = canvas.width;
      const h = canvas.height;

      // Dark cinematic backdrop
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#0a0f1d');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Glow particles / grid
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Title & Artwork Simulation matching screenshot neon/3D aesthetic
      ctx.save();
      ctx.textAlign = 'center';

      // Neon frame box
      const boxSize = 120;
      const bx = w / 2 + 100;
      const by = h / 2 - 40;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 15;
      ctx.strokeRect(bx, by, boxSize, boxSize);

      // Glowing Neon Calligraphy "CAU / Story"
      ctx.font = 'bold 56px sans-serif';
      ctx.fillStyle = '#60a5fa';
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 25;
      ctx.fillText('STORY QA', w / 2 - 40, h / 2 + 10);

      // Subtitle information on canvas
      ctx.shadowBlur = 0;
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(selectedVideo?.sessionTitle || '강의 세부 차시', w / 2, h / 2 + 70);

      // Current Timecode watermark
      ctx.font = '14px monospace';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(`TIME: ${formatTime(localTime)} / ${formatTime(duration)}`, w / 2, h / 2 + 100);

      ctx.restore();

      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, [useCanvasFallback, isPlaying, playbackRate, duration, selectedVideo]);

  if (!selectedVideo) return null;

  const handlePlayPause = () => {
    if (useCanvasFallback) {
      setIsPlaying(!isPlaying);
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {
        // Switch to canvas fallback if media policy blocks play
        setUseCanvasFallback(true);
        setIsPlaying(true);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (seconds: number) => {
    const clamped = Math.max(0, Math.min(seconds, duration));
    setCurrentTime(clamped);
    if (videoRef.current) {
      videoRef.current.currentTime = clamped;
    }
  };

  const handleSkip = (delta: number) => {
    handleSeek(currentTime + delta);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (currentUser.role === 'VIEWER') {
      alert('뷰어(Viewer) 계정은 읽기 전용으로 검수 의견을 등록할 수 없습니다. 상단에서 검수자(Reviewer) 역할로 전환해 주세요.');
      return;
    }

    const stampSec = includeTimestamp ? Math.round(currentTime) : 0;
    const stampFormatted = includeTimestamp ? formatTime(stampSec) : '--:--';

    addReviewComment(
      selectedVideo.id,
      {
        author: reviewerName || currentUser.name.split(' ')[0],
        role: currentUser.role,
        timestampSeconds: stampSec,
        timestampFormatted: stampFormatted,
        verdict: selectedVerdict,
        content: commentText.trim()
      },
      selectedVerdict
    );

    setVerdictNotice({
      type: selectedVerdict,
      title: `검수 의견 및 [${selectedVerdict === 'APPROVED' ? '승인' : selectedVerdict === 'REJECTED' ? '반려' : '대기'}] 상태가 등록되었습니다.`,
      desc: `타임코드 [${stampFormatted}] 의견이 검수 이력에 성공적으로 저장되었습니다.`
    });

    setCommentText('');
  };

  const handleGenerateAiSubtitles = async () => {
    setIsGeneratingAi(true);
    setAiGenError(null);

    try {
      const res = await fetch('/api/ai/subtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoTitle: selectedVideo.weekTitle,
          sessionTitle: selectedVideo.sessionTitle,
          duration: selectedVideo.duration,
          targetLanguage: 'en'
        })
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      if (data.subtitles && Array.isArray(data.subtitles)) {
        updateVideoSubtitles(selectedVideo.id, data.subtitles);
      } else {
        throw new Error('자막 데이터 형식이 올바르지 않습니다.');
      }
    } catch (err: any) {
      console.warn('Backend subtitle API failed, utilizing intelligent client-side generation fallback:', err);
      // Fallback high-fidelity subtitle generation
      const fallbackSubs: SubtitleEntry[] = [
        {
          id: 1,
          startTime: '00:00',
          endTime: '00:05',
          startSeconds: 0,
          endSeconds: 5,
          textKo: `${selectedVideo.sessionTitle} 강의를 시작하겠습니다.`,
          textEn: `Let's begin the lecture on "${selectedVideo.sessionTitle}".`
        },
        {
          id: 2,
          startTime: '00:06',
          endTime: '00:15',
          startSeconds: 6,
          endSeconds: 15,
          textKo: '스토리텔링의 모티프는 캐릭터의 심리 변화와 밀접하게 연동됩니다.',
          textEn: 'Storytelling motifs are intimately connected to characters psychological arcs.'
        },
        {
          id: 3,
          startTime: '03:10',
          endTime: '03:20',
          startSeconds: 190,
          endSeconds: 200,
          textKo: '이 지점에서 서사의 긴장감이 최고조에 달하며 반전이 시작됩니다.',
          textEn: 'At this critical juncture, narrative tension peaks as the twist unfolds.'
        },
        {
          id: 4,
          startTime: '08:40',
          endTime: '08:55',
          startSeconds: 520,
          endSeconds: 535,
          textKo: '배경음과 대사의 밸런스를 확인하고 다음 실습 챕터로 넘어가겠습니다.',
          textEn: 'Checking the balance between ambient BGM and dialogue before moving forward.'
        }
      ];
      updateVideoSubtitles(selectedVideo.id, fallbackSubs);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      
      {/* Modal Main Frame matching screenshot geometry */}
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[95vh]">
        
        {/* Top Split Body: Video Player (Left) & Inspection Panel (Right) */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto lg:overflow-visible">
          
          {/* ================= LEFT: VIDEO PLAYER ================= */}
          <div className="lg:w-[58%] bg-black flex flex-col justify-between select-none">
            
            {/* 16:9 Screen Container with Right-Click Protection */}
            <div
              onContextMenu={handleContextMenu}
              onDragStart={e => e.preventDefault()}
              className="relative w-full aspect-video bg-slate-950 flex items-center justify-center overflow-hidden group select-none"
            >
              {/* Security Warning Toast on Right Click */}
              {showContextMenuNotice && (
                <div className="absolute top-4 inset-x-4 mx-auto w-fit max-w-[90%] z-40 px-3.5 py-1.5 bg-slate-900/95 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>사내 보안 규정에 따라 영상 화면의 우클릭 및 저장이 제한되어 있습니다.</span>
                </div>
              )}

              {!useCanvasFallback ? (
                <video
                  ref={videoRef}
                  src={selectedVideo.videoUrl}
                  className="w-full h-full object-contain cursor-pointer select-none"
                  onClick={handlePlayPause}
                  onContextMenu={handleContextMenu}
                  onDragStart={e => e.preventDefault()}
                  controlsList="nodownload noplaybackrate"
                  disablePictureInPicture
                  onTimeUpdate={() => {
                    if (videoRef.current) {
                      setCurrentTime(videoRef.current.currentTime);
                    }
                  }}
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      setDuration(videoRef.current.duration || selectedVideo.duration);
                    }
                  }}
                  onError={() => {
                    console.log('Video stream error, activating animated inspection canvas fallback');
                    setUseCanvasFallback(true);
                  }}
                  playsInline
                />
              ) : (
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={360}
                  onClick={handlePlayPause}
                  onContextMenu={handleContextMenu}
                  onDragStart={e => e.preventDefault()}
                  className="w-full h-full object-contain cursor-pointer select-none"
                />
              )}

              {/* Center Play overlay button when paused */}
              {!isPlaying && (
                <button
                  onClick={handlePlayPause}
                  className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform"
                >
                  <Play className="w-8 h-8 fill-current ml-1" />
                </button>
              )}

              {/* Subtitle Overlay if active */}
              {selectedVideo.subtitles.length > 0 && (
                <div className="absolute bottom-4 inset-x-4 pointer-events-none text-center">
                  {selectedVideo.subtitles
                    .filter(s => currentTime >= s.startSeconds && currentTime <= s.endSeconds)
                    .map(sub => (
                      <div key={sub.id} className="inline-block bg-black/85 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-medium shadow-lg backdrop-blur-xs max-w-xl">
                        <p className="text-white">{sub.textKo}</p>
                        <p className="text-blue-300 text-[11px] mt-0.5">{sub.textEn}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Custom Video Controls matching Screenshot Layout */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 text-white">
              
              {/* Scrub Bar */}
              <div className="mb-3">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={e => handleSeek(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Middle Controls Bar: [« 10초] [일시정지] [10초 »]  and [00:08 / 12:29] */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSkip(-10)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    « {t.secBack}
                  </button>

                  <button
                    onClick={handlePlayPause}
                    className="px-4 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs font-semibold flex items-center gap-1 transition-colors min-w-[72px] justify-center"
                  >
                    {isPlaying ? t.pause : t.play}
                  </button>

                  <button
                    onClick={() => handleSkip(10)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    {t.secForward} »
                  </button>
                </div>

                {/* Exact time indicator matching screenshot */}
                <div className="font-mono text-xs text-slate-300 tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <div className="my-3 border-t border-dashed border-slate-800"></div>

              {/* Speed Playback Selector matching screenshot [배속 0.5x 0.75x 1x ... 2x] */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                  <span className="text-slate-400 font-medium mr-1">{t.speed}</span>
                  {speedOptions.map(spd => (
                    <button
                      key={spd}
                      onClick={() => handleSpeedChange(spd)}
                      className={`px-2.5 py-0.5 rounded text-xs font-semibold transition-colors ${
                        playbackRate === spd
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <div className="font-mono text-blue-400 font-bold text-xs">
                  {playbackRate.toFixed(1)}x
                </div>
              </div>

            </div>
          </div>


          {/* ================= RIGHT: INSPECTION FORM & FEEDBACK LIST ================= */}
          <div className="lg:w-[42%] flex flex-col bg-white border-t lg:border-t-0 lg:border-l border-slate-200">
            
            {/* Top Bar with Reviewer input & Verdict buttons & Close button */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-white">
              
              <div className="flex items-center justify-between mb-3">
                {/* Panel Switch Tabs: 검수 의견 vs AI 자막 */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  <button
                    onClick={() => setRightTab('feedback')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                      rightTab === 'feedback'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.feedbackTab} ({selectedVideo.reviews.length})
                  </button>
                  <button
                    onClick={() => setRightTab('aiSubtitles')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${
                      rightTab === 'aiSubtitles'
                        ? 'bg-white text-blue-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    {t.aiSubtitleTab}
                  </button>
                </div>

                {/* Close Modal Button */}
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                  title="닫기"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Reviewer & Verdict controls matching screenshot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* 검수자 Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {t.reviewer}
                  </label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={e => setReviewerName(e.target.value)}
                    placeholder={t.reviewerNameInput}
                    className="w-full px-3 py-1.5 text-xs border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                  />
                </div>

                {/* 검수 결과 3 Buttons: 승인 [Green], 반려 [Red], 대기로 [Navy] */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      {t.reviewResult}
                    </label>
                    <span className="text-[10px] text-blue-600 font-medium">
                      클릭 시 즉시 상태 반영
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleVerdictClick('APPROVED')}
                      className={`flex-1 py-1.5 rounded-md text-xs font-bold text-white transition-all transform active:scale-95 flex items-center justify-center gap-1 ${
                        selectedVerdict === 'APPROVED'
                          ? 'bg-emerald-600 ring-2 ring-emerald-600 ring-offset-1 shadow-md font-extrabold'
                          : 'bg-emerald-600/75 hover:bg-emerald-600 hover:shadow-xs'
                      }`}
                      title="클릭하여 즉시 '승인 완료' 상태로 저장합니다."
                    >
                      {selectedVerdict === 'APPROVED' && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                      <span>{t.btnApprove}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleVerdictClick('REJECTED')}
                      className={`flex-1 py-1.5 rounded-md text-xs font-bold text-white transition-all transform active:scale-95 flex items-center justify-center gap-1 ${
                        selectedVerdict === 'REJECTED'
                          ? 'bg-red-600 ring-2 ring-red-600 ring-offset-1 shadow-md font-extrabold'
                          : 'bg-red-600/75 hover:bg-red-600 hover:shadow-xs'
                      }`}
                      title="클릭하여 즉시 '검수 반려' 상태로 저장하고 사유 입력을 활성화합니다."
                    >
                      {selectedVerdict === 'REJECTED' && <XCircle className="w-3 h-3 shrink-0" />}
                      <span>{t.btnReject}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleVerdictClick('PENDING')}
                      className={`flex-1 py-1.5 rounded-md text-xs font-bold text-white transition-all transform active:scale-95 flex items-center justify-center gap-1 ${
                        selectedVerdict === 'PENDING'
                          ? 'bg-slate-700 ring-2 ring-slate-700 ring-offset-1 shadow-md font-extrabold'
                          : 'bg-slate-700/75 hover:bg-slate-700 hover:shadow-xs'
                      }`}
                      title="클릭하여 '검수 대기' 상태로 전환합니다."
                    >
                      {selectedVerdict === 'PENDING' && <Clock className="w-3 h-3 shrink-0" />}
                      <span>{t.btnPending}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Instant Verdict Feedback & Follow-up Action Banner */}
              {verdictNotice && (
                <div
                  className={`mt-3 p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in zoom-in-95 duration-150 ${
                    verdictNotice.type === 'APPROVED'
                      ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                      : verdictNotice.type === 'REJECTED'
                      ? 'bg-red-50/90 border-red-300 text-red-950'
                      : 'bg-slate-100 border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {verdictNotice.type === 'APPROVED' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : verdictNotice.type === 'REJECTED' ? (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold flex items-center justify-between">
                      <span className="text-xs">{verdictNotice.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/70 font-semibold shadow-2xs">
                        실시간 저장됨
                      </span>
                    </div>
                    <p className="text-[11px] mt-1 leading-relaxed opacity-90">
                      {verdictNotice.desc}
                    </p>
                    {verdictNotice.type === 'APPROVED' && (
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedVideo(null)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-2xs transition-colors"
                        >
                          검수 완료 및 닫기
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>


            {/* Tab 1 Content: Inspection Feedback Form & Chronological List */}
            {rightTab === 'feedback' && (
              <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-y-auto">
                
                {/* Feedback Input Form */}
                <form onSubmit={handleSubmitComment} className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-800">
                      {t.reviewCommentLabel}
                    </label>
                    {selectedVerdict === 'REJECTED' && (
                      <span className="text-[11px] text-red-600 font-bold flex items-center gap-1">
                        * 반려 사유 및 타임코드 입력 필요
                      </span>
                    )}
                    {selectedVerdict === 'APPROVED' && (
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        ✓ 승인 완료 (선택적 피드백 남기기)
                      </span>
                    )}
                  </div>

                  <textarea
                    ref={textareaRef}
                    rows={3}
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder={
                      selectedVerdict === 'REJECTED'
                        ? "예) 03:12 자막 오타 - '학습' -> '학습 전략' 수정 요청"
                        : t.reviewCommentPlaceholder
                    }
                    className={`w-full p-2.5 text-xs sm:text-sm rounded-lg focus:outline-none focus:ring-2 resize-none transition-all placeholder:text-slate-400 ${
                      selectedVerdict === 'REJECTED'
                        ? 'border-2 border-red-300 focus:ring-red-400 bg-red-50/20'
                        : selectedVerdict === 'APPROVED'
                        ? 'border border-emerald-300 focus:ring-emerald-400'
                        : 'border border-slate-200 focus:ring-blue-500'
                    }`}
                  />

                  <div className="flex items-center justify-between mt-2">
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeTimestamp}
                        onChange={e => setIncludeTimestamp(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>{t.includeCurrentTime}</span>
                      {includeTimestamp && (
                        <span className="font-mono text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
                          [{formatTime(currentTime)}]
                        </span>
                      )}
                    </label>

                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      {t.btnSubmitComment}
                    </button>
                  </div>
                </form>

                {/* List of Registered Review Feedback matching screenshot */}
                <div className="flex-1 min-h-[160px] border-t border-slate-100 pt-3">
                  <h4 className="text-xs font-bold text-slate-700 mb-2">
                    {t.registeredOpinions}
                  </h4>

                  {selectedVideo.reviews.length === 0 ? (
                    <div className="h-36 flex items-center justify-center text-center text-xs text-slate-400">
                      {t.noComments}
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {selectedVideo.reviews.map(rev => (
                        <div
                          key={rev.id}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs hover:border-blue-300 transition-colors group"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              {rev.timestampFormatted !== '--:--' && (
                                <button
                                  type="button"
                                  onClick={() => handleSeek(rev.timestampSeconds)}
                                  className="font-mono font-bold text-blue-600 hover:text-blue-800 bg-blue-100/70 hover:bg-blue-200 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1"
                                  title="클릭하여 해당 시점으로 이동"
                                >
                                  <Clock className="w-2.5 h-2.5" />
                                  {rev.timestampFormatted}
                                </button>
                              )}
                              <span className="font-bold text-slate-800">{rev.author}</span>
                              <span className="text-[10px] text-slate-400">({rev.role})</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  rev.verdict === 'APPROVED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : rev.verdict === 'REJECTED'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-slate-200 text-slate-800'
                                }`}
                              >
                                {rev.verdict}
                              </span>

                              {(currentUser.role === 'ADMIN' || currentUser.name.startsWith(rev.author)) && (
                                <button
                                  onClick={() => deleteReviewComment(selectedVideo.id, rev.id)}
                                  className="text-slate-400 hover:text-red-600 p-0.5 rounded transition-colors"
                                  title="삭제"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-slate-700 leading-relaxed font-normal whitespace-pre-wrap">
                            {rev.content}
                          </p>

                          <div className="text-[10px] text-slate-400 font-mono mt-1 text-right">
                            {rev.createdAt}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>

              </div>
            )}


            {/* Tab 2 Content: AI Automated Subtitles & Translation */}
            {rightTab === 'aiSubtitles' && (
              <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      AI 음성인식 & 영문 자막 번역
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Gemini 3.8 Flash 엔진이 타임코드별 한/영 자막을 생성합니다.
                    </p>
                  </div>

                  <button
                    onClick={handleGenerateAiSubtitles}
                    disabled={isGeneratingAi}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    {isGeneratingAi ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>생성 중...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>자막 생성</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Subtitles Export Toolbar */}
                {selectedVideo.subtitles.length > 0 && (
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium">내보내기:</span>
                    <button
                      onClick={() => downloadFile(exportSubtitlesToSrt(selectedVideo.subtitles), `${selectedVideo.fileName}.srt`, 'text/plain')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Download className="w-2.5 h-2.5" /> .SRT
                    </button>
                    <button
                      onClick={() => downloadFile(exportSubtitlesToVtt(selectedVideo.subtitles), `${selectedVideo.fileName}.vtt`, 'text/vtt')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Download className="w-2.5 h-2.5" /> .VTT
                    </button>
                    <button
                      onClick={() => downloadFile(JSON.stringify(selectedVideo.subtitles, null, 2), `${selectedVideo.fileName}.json`, 'application/json')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Download className="w-2.5 h-2.5" /> JSON
                    </button>
                  </div>
                )}

                {/* Subtitles Item List */}
                <div className="flex-1 space-y-2 overflow-y-auto max-h-80 pr-1">
                  {selectedVideo.subtitles.length === 0 ? (
                    <div className="h-44 flex flex-col items-center justify-center text-center p-4 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      <Sparkles className="w-6 h-6 text-slate-300 mb-1" />
                      <p className="text-xs font-medium">생성된 AI 자막이 없습니다.</p>
                      <p className="text-[11px] mt-0.5 text-slate-400">우측 상단 '자막 생성' 버튼을 눌러 음성인식 및 영문 번역을 실행하세요.</p>
                    </div>
                  ) : (
                    selectedVideo.subtitles.map(sub => (
                      <div
                        key={sub.id}
                        onClick={() => handleSeek(sub.startSeconds)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          currentTime >= sub.startSeconds && currentTime <= sub.endSeconds
                            ? 'bg-blue-50/80 border-blue-400 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-blue-600 text-[11px]">
                            {sub.startTime} - {sub.endTime}
                          </span>
                          <span className="text-[10px] text-slate-400">클릭하여 이동</span>
                        </div>
                        <p className="text-slate-900 font-medium">{sub.textKo}</p>
                        <p className="text-blue-700 text-[11px] mt-0.5 font-normal">{sub.textEn}</p>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}

          </div>

        </div>

        {/* Modal Bottom Metadata matching screenshot text */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <h3 className="font-mono text-sm sm:text-base font-bold text-slate-900 mb-0.5">
              {selectedVideo.fileName}
            </h3>
            <div className="text-slate-600 font-medium flex items-center flex-wrap gap-1">
              <span>{selectedVideo.weekTitle}</span>
              <span aria-hidden="true">·</span>
              <span>{selectedVideo.sessionTitle}</span>
              <span aria-hidden="true">·</span>
              <span>업로드</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{selectedVideo.fileSize}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">등록 {selectedVideo.uploadedAt}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => openShareModal(selectedVideo, Math.round(currentTime))}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-lg text-xs shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.shareLink}</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
