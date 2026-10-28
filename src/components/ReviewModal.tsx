import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../utils/i18n';
import { ReviewComment, SubtitleEntry } from '../types';
import { formatTime, exportSubtitlesToSrt, exportSubtitlesToVtt, downloadFile } from '../utils/formatters';
import { getVideoSourceInfo } from '../utils/videoUtils';
import { getVideoPlaybackUrl } from '../utils/s3Storage';
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
    updateVideoAiAnalysis,
    openShareModal,
    seekToTime,
    setSeekToTime
  } = useApp();

  const t = translations[language];
  const sourceInfo = getVideoSourceInfo(selectedVideo?.videoUrl);
  const [resolvedPlaybackUrl, setResolvedPlaybackUrl] = useState('');
  const [playbackUrlError, setPlaybackUrlError] = useState<string | null>(null);

  // Video playback states & references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mutable refs to prevent render lag / infinite loops during playback
  const currentVideoIdRef = useRef<string | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const currentTimeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const playbackRateRef = useRef<number>(1.0);
  const durationRef = useRef<number>(0);
  const lastUiUpdateRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [useCanvasFallback, setUseCanvasFallback] = useState(false);

  // Review Form states
  const [reviewerName, setReviewerName] = useState('');
  const [selectedVerdict, setSelectedVerdict] = useState<'APPROVED' | 'REJECTED' | 'PENDING'>('PENDING');
  const [commentText, setCommentText] = useState('');
  const [includeTimestamp, setIncludeTimestamp] = useState(true);

  const [rightTab, setRightTab] = useState<'feedback' | 'aiSubtitles'>('feedback');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiGenError, setAiGenError] = useState<string | null>(null);
  const [aiProgress, setAiProgress] = useState('');
  const [showContextMenuNotice, setShowContextMenuNotice] = useState(false);
  const [verdictNotice, setVerdictNotice] = useState<{
    type: 'APPROVED' | 'REJECTED' | 'PENDING';
    title: string;
    desc: string;
  } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [editingSubId, setEditingSubId] = useState<number | null>(null);
  const [editingTextKo, setEditingTextKo] = useState<string>('');

  useEffect(() => {
    if (!selectedVideo) {
      setResolvedPlaybackUrl('');
      setPlaybackUrlError(null);
      return;
    }

    let active = true;
    setPlaybackUrlError(null);
    setResolvedPlaybackUrl(selectedVideo.s3Key ? '' : selectedVideo.videoUrl || '');
    if (selectedVideo.s3Key) {
      getVideoPlaybackUrl(selectedVideo.s3Key)
        .then(url => { if (active) setResolvedPlaybackUrl(url); })
        .catch(error => {
          if (active) setPlaybackUrlError(error instanceof Error ? error.message : '영상 재생 주소를 불러오지 못했습니다.');
        });
    }
    return () => { active = false; };
  }, [selectedVideo?.id, selectedVideo?.s3Key, selectedVideo?.videoUrl]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowContextMenuNotice(true);
    setTimeout(() => {
      setShowContextMenuNotice(false);
    }, 2500);
  };

  // Sync state when selected video changes or status is updated
  useEffect(() => {
    if (!selectedVideo) return;

    // When opening a DIFFERENT video, reset player & comment form
    if (currentVideoIdRef.current !== selectedVideo.id) {
      currentVideoIdRef.current = selectedVideo.id;
      const initialDur = selectedVideo.duration || 0;
      setDuration(initialDur);
      durationRef.current = initialDur;
      
      const startTime = 0;
      setCurrentTime(startTime);
      currentTimeRef.current = startTime;
      
      setIsPlaying(false);
      isPlayingRef.current = false;
      setUseCanvasFallback(false);
      pendingSeekRef.current = null;
      setCommentText('');
      setVerdictNotice(null);

      if (videoRef.current) {
        pendingSeekRef.current = startTime;
        videoRef.current.load();
      }
    }

    // Always keep verdict button in sync with selected video's status
    const vStatus: 'APPROVED' | 'REJECTED' | 'PENDING' =
      selectedVideo.status === 'APPROVED'
        ? 'APPROVED'
        : selectedVideo.status === 'REJECTED'
        ? 'REJECTED'
        : 'PENDING';
    setSelectedVerdict(vStatus);
  }, [selectedVideo?.id, selectedVideo?.status, currentUser]);

  // Handle external seek requests (e.g. from share links)
  useEffect(() => {
    if (seekToTime !== null) {
      handleSeek(seekToTime);
      setSeekToTime(null);
    }
  }, [seekToTime]);

  // Canvas interactive playback engine: runs 60fps animations while updating React UI smoothly
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas || !useCanvasFallback) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastStamp = performance.now();

    const renderFrame = (now: number) => {
      const dt = Math.min((now - lastStamp) / 1000, 0.1);
      lastStamp = now;

      if (isPlayingRef.current) {
        currentTimeRef.current += dt * playbackRateRef.current;
        if (currentTimeRef.current >= durationRef.current) {
          currentTimeRef.current = 0;
        }

        // Throttle React state update to ~4 times per second (250ms) to prevent render storms
        if (now - lastUiUpdateRef.current > 250) {
          lastUiUpdateRef.current = now;
          setCurrentTime(Math.round(currentTimeRef.current * 10) / 10);
        }
      }

      const w = canvas.width;
      const h = canvas.height;
      const cur = currentTimeRef.current;
      const dur = durationRef.current;

      // Dark cinematic backdrop
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#0a0f1d');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Glow particles / grid
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.09)';
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

      // Title & Artwork Simulation: Clean Educational Lecture Slide
      ctx.save();
      ctx.textAlign = 'center';

      // Elegant dark lecture slide card
      const cardW = Math.min(w * 0.88, 540);
      const cardH = 200;
      const cx = (w - cardW) / 2;
      const cy = (h - cardH) / 2;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cx, cy, cardW, cardH, 16);
      ctx.fill();
      ctx.stroke();

      // Top mini badge: Lecture Series
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#60a5fa';
      ctx.fillText(selectedVideo?.weekTitle || '(주)후미디어 교육 콘텐츠', w / 2, cy + 42);

      // Main Lecture Title
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(selectedVideo?.sessionTitle || '동영상 강의 검수', w / 2, cy + 82);

      // Lecturer / Info
      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`파일명: ${selectedVideo?.fileName || ''} · 길이: ${formatTime(dur)}`, w / 2, cy + 120);

      // Current Timecode
      ctx.font = '13px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`재생 시점: ${formatTime(cur)} / ${formatTime(dur)}`, w / 2, cy + 155);

      // Dynamic animated audio waveform bars when playing
      if (isPlayingRef.current) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
        const barCount = 28;
        const barWidth = 4;
        const startX = w / 2 - (barCount * 8) / 2;
        for (let i = 0; i < barCount; i++) {
          const waveHeight = Math.sin(cur * 8 + i * 0.4) * 14 + 16;
          ctx.fillRect(startX + i * 8, h - 55 - waveHeight, barWidth, waveHeight);
        }
      }

      ctx.restore();

      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, [useCanvasFallback, selectedVideo]);

  if (!selectedVideo) return null;

  // Toggle Play / Pause: works reliably in both HTML5 video and Canvas fallback
  const handlePlayPause = async () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    isPlayingRef.current = nextState;

    if (!useCanvasFallback && videoRef.current) {
      const video = videoRef.current;
      if (nextState) {
        try {
          await video.play();
        } catch (err) {
          console.warn('Playback blocked by browser autoplay policy, attempting muted play:', err);
          try {
            video.muted = true;
            setIsMuted(true);
            await video.play();
          } catch {
            console.log('Video media error, switching to interactive inspection canvas engine');
            setUseCanvasFallback(true);
          }
        }
      } else {
        video.pause();
      }
    }
  };

  const handleSeek = (seconds: number) => {
    const mediaDuration = videoRef.current?.duration;
    const knownDuration = Number.isFinite(mediaDuration) && mediaDuration && mediaDuration > 0
      ? mediaDuration
      : durationRef.current;
    const clamped = Math.max(0, knownDuration > 0 ? Math.min(seconds, knownDuration) : seconds);
    currentTimeRef.current = clamped;
    setCurrentTime(clamped);

    if (videoRef.current) {
      if (videoRef.current.readyState >= 1) {
        videoRef.current.currentTime = clamped;
        pendingSeekRef.current = null;
      } else {
        pendingSeekRef.current = clamped;
      }
    } else {
      pendingSeekRef.current = clamped;
    }
  };

  const handleSkip = (delta: number) => {
    handleSeek(currentTimeRef.current + delta);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    playbackRateRef.current = speed;
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Verdict action: 승인, 반려, 대기로
  // Crucial: Changing verdict updates status immediately WITHOUT pausing or disrupting video playback!
  const handleVerdictClick = (verdict: 'APPROVED' | 'REJECTED' | 'PENDING') => {
    if (!selectedVideo) return;

    const author = reviewerName.trim() || '검수자';
    setSelectedVerdict(verdict);

    // 1. Immediately update video status in state and backend
    updateVideoStatus(selectedVideo.id, verdict, author);

    // 2. Action feedback banner & helper text
    const curStamp = formatTime(Math.round(currentTimeRef.current));
    if (verdict === 'APPROVED') {
      setVerdictNotice({
        type: 'APPROVED',
        title: `'승인 완료' 상태로 반영되었습니다.`,
        desc: `전체 강의 검수가 승인되었습니다. 필요시 아래 폼에서 세부 승인 의견을 등록하거나 검수를 완료할 수 있습니다.`
      });
      if (!commentText.trim()) {
        setCommentText('도입부 모션 및 오디오/자막 싱크 검수 완료. 최종 승인합니다.');
      }
    } else if (verdict === 'REJECTED') {
      setVerdictNotice({
        type: 'REJECTED',
        title: `'검수 반려' 상태로 변경되었습니다.`,
        desc: `제작자가 신속히 수정할 수 있도록 아래 입력창에 수정할 타임코드 및 반려 사유를 작성하고 [의견 등록]을 진행해 주세요.`
      });
      if (!commentText.trim()) {
        setCommentText(`[${curStamp}] 수정 요청 사유: `);
      }
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    } else {
      setVerdictNotice({
        type: 'PENDING',
        title: `'검수 대기' 상태로 전환되었습니다.`,
        desc: `추가 검토를 위해 검수 대기열 상태로 유지됩니다.`
      });
    }
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const stampSec = includeTimestamp ? Math.round(currentTime) : 0;
    const stampFormatted = includeTimestamp ? formatTime(stampSec) : '--:--';

    addReviewComment(
      selectedVideo.id,
      {
        author: reviewerName.trim() || '검수자',
        role: 'REVIEWER',
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

  const parseSrtOrVtt = (text: string): SubtitleEntry[] => {
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const entries: SubtitleEntry[] = [];
    let currentStart = '';
    let currentEnd = '';
    let startSec = 0;
    let endSec = 0;
    let textLines: string[] = [];
    let id = 1;

    const timeRegex = /(?:(\d{1,2}):)?(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(?:(\d{1,2}):)?(\d{2}):(\d{2})[,.](\d{3})/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        if (currentStart && textLines.length > 0) {
          entries.push({
            id: id++,
            startTime: currentStart,
            endTime: currentEnd,
            startSeconds: startSec,
            endSeconds: endSec,
            textKo: textLines.join(' '),
            textEn: ''
          });
          currentStart = '';
          currentEnd = '';
          textLines = [];
        }
        continue;
      }

      const match = line.match(timeRegex);
      if (match) {
        const sh = parseInt(match[1] || '0', 10);
        const sm = parseInt(match[2], 10);
        const ss = parseInt(match[3], 10);
        const eh = parseInt(match[5] || '0', 10);
        const em = parseInt(match[6], 10);
        const es = parseInt(match[7], 10);

        startSec = sh * 3600 + sm * 60 + ss;
        endSec = eh * 3600 + em * 60 + es;
        currentStart = `${String(sm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
        currentEnd = `${String(em).padStart(2, '0')}:${String(es).padStart(2, '0')}`;
      } else if (currentStart && !/^\d+$/.test(line) && line !== 'WEBVTT') {
        textLines.push(line);
      }
    }

    if (currentStart && textLines.length > 0) {
      entries.push({
        id: id++,
        startTime: currentStart,
        endTime: currentEnd,
        startSeconds: startSec,
        endSeconds: endSec,
        textKo: textLines.join(' '),
        textEn: ''
      });
    }

    return entries;
  };

  const handleSubtitleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedVideo) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (!content) return;

      const parsed = parseSrtOrVtt(content);
      if (parsed.length > 0) {
        updateVideoSubtitles(selectedVideo.id, parsed);
        setVerdictNotice({
          type: 'APPROVED',
          title: '자막 파일이 성공적으로 로드되었습니다.',
          desc: `'${file.name}' 파일에서 총 ${parsed.length}개 자막 구간을 실시간 플레이어에 반영했습니다.`
        });
      } else {
        alert('자막 파일 형식을 인식할 수 없습니다. .srt 또는 .vtt 표준 포맷인지 확인해 주세요.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveSubtitleRow = (subId: number) => {
    if (!selectedVideo) return;
    const updated = selectedVideo.subtitles.map(s =>
      s.id === subId ? { ...s, textKo: editingTextKo } : s
    );
    updateVideoSubtitles(selectedVideo.id, updated);
    setEditingSubId(null);
  };

  const handleGenerateAiSubtitles = async () => {
    const video = selectedVideo;
    if (!video) return;
    if (!video.s3Key && !video.videoUrl) {
      setAiGenError('AI 분석을 시작할 실제 영상 파일이 없습니다. 먼저 원본 영상을 업로드해 주세요.');
      return;
    }

    setIsGeneratingAi(true);
    setAiGenError(null);
    setAiProgress('원본 영상과 분석 작업을 준비하고 있습니다.');
    try {
      const startResponse = await fetch('/api/ai/subtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoTitle: video.weekTitle,
          sessionTitle: video.sessionTitle,
          fileName: video.fileName,
          duration: video.duration,
          s3Key: video.s3Key,
          videoUrl: video.videoUrl,
          mimeType: video.mimeType,
          sizeBytes: video.sizeBytes
        })
      });
      const startData = await startResponse.json().catch(() => ({}));
      if (!startResponse.ok) throw new Error(startData.error || '영상 분석을 시작하지 못했습니다.');
      if (!startData.jobToken) throw new Error('분석 작업을 추적할 수 있는 토큰을 받지 못했습니다.');

      setAiProgress('실제 강의 음성과 화면을 분석하고 있습니다. 영상 길이에 따라 시간이 걸릴 수 있습니다.');
      let completed = false;
      for (let attempt = 0; attempt < 240; attempt += 1) {
        await new Promise(resolve => window.setTimeout(resolve, 5000));
        const statusResponse = await fetch('/api/ai/subtitles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'status', jobToken: startData.jobToken, duration: video.duration })
        });
        const statusData = await statusResponse.json().catch(() => ({}));
        if (!statusResponse.ok) throw new Error(statusData.error || 'AI 분석 진행 상태를 가져오지 못했습니다.');
        if (statusData.status === 'completed') {
          const analysis = statusData.analysis;
          const subtitles: SubtitleEntry[] = Array.isArray(analysis?.segments)
            ? analysis.segments.map((segment: SubtitleEntry, index: number) => ({ ...segment, id: index + 1 }))
            : [];
          if (!subtitles.length) throw new Error('실제 음성에서 생성된 자막 구간이 없습니다.');
          updateVideoSubtitles(video.id, subtitles);
          updateVideoAiAnalysis(video.id, {
            summary: String(analysis.summary || ''),
            keyTerms: Array.isArray(analysis.keyTerms) ? analysis.keyTerms : [],
            uncertaintyNotes: Array.isArray(analysis.uncertaintyNotes) ? analysis.uncertaintyNotes : [],
            model: String(statusData.model || startData.model || 'Gemini'),
            analyzedAt: new Date().toISOString()
          });
          setAiProgress(`분석 완료 · ${subtitles.length}개 자막 구간`);
          setRightTab('aiSubtitles');
          completed = true;
          break;
        }
        if (statusData.status === 'failed' || statusData.status === 'cancelled') {
          throw new Error(statusData.error || 'AI 분석이 완료되지 않았습니다.');
        }
        if (attempt > 0 && attempt % 12 === 0) {
          setAiProgress('아직 분석 중입니다. 실제 발화의 타임코드와 자막을 확인하고 있습니다.');
        }
      }
      if (!completed) throw new Error('분석 시간이 길어져 대기 상태를 종료했습니다. 자막 결과가 저장되지 않았습니다. 다시 시도해 주세요.');
    } catch (error) {
      setAiGenError(error instanceof Error ? error.message : '실제 영상 AI 분석에 실패했습니다.');
      setAiProgress('');
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

              {/* Top-Left: Video Lecture Title Overlay & Realtime Verdict Status (Requested by user) */}
              <div className="absolute top-3 left-3 z-30 max-w-[90%] flex items-center gap-2 pointer-events-none flex-wrap">
                <div className="px-3.5 py-1.5 bg-black/85 backdrop-blur-md rounded-lg text-white border border-white/10 shadow-lg flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 animate-pulse" />
                  <span className="text-xs sm:text-sm font-bold truncate tracking-tight">
                    {selectedVideo.sessionTitle}
                  </span>
                </div>

                {/* Instant visual verdict indicator right on video player screen */}
                {selectedVerdict === 'APPROVED' ? (
                  <div className="px-2.5 py-1.5 bg-emerald-600/95 backdrop-blur-md text-white rounded-lg text-xs font-bold border border-emerald-400/40 shadow-lg flex items-center gap-1.5 animate-in fade-in duration-150">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>✓ {t.statusApproved}</span>
                  </div>
                ) : selectedVerdict === 'REJECTED' ? (
                  <div className="px-2.5 py-1.5 bg-rose-600/95 backdrop-blur-md text-white rounded-lg text-xs font-bold border border-rose-400/40 shadow-lg flex items-center gap-1.5 animate-in fade-in duration-150">
                    <XCircle className="w-3.5 h-3.5 text-white" />
                    <span>✕ {t.statusRejected}</span>
                  </div>
                ) : (
                  <div className="px-2.5 py-1.5 bg-slate-800/90 backdrop-blur-md text-slate-200 rounded-lg text-xs font-semibold border border-slate-600/40 shadow-lg flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>⏱ {t.statusPending}</span>
                  </div>
                )}
              </div>

              {sourceInfo.isExternal ? (
                <div className="w-full h-full relative flex items-center justify-center bg-black">
                  <iframe
                    src={sourceInfo.embedUrl}
                    title={selectedVideo.fileName}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : !useCanvasFallback && resolvedPlaybackUrl ? (
                <video
                  ref={videoRef}
                  key={selectedVideo.id}
                  src={resolvedPlaybackUrl}
                  crossOrigin="anonymous"
                  preload="auto"
                  className="w-full h-full object-contain cursor-pointer select-none"
                  onClick={handlePlayPause}
                  onContextMenu={handleContextMenu}
                  onDragStart={e => e.preventDefault()}
                  controlsList="nodownload noplaybackrate"
                  disablePictureInPicture
                  onTimeUpdate={() => {
                    if (videoRef.current && !useCanvasFallback) {
                      const t = videoRef.current.currentTime;
                      currentTimeRef.current = t;
                      setCurrentTime(t);
                    }
                  }}
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      const d = videoRef.current.duration || selectedVideo.duration || 749;
                      setDuration(d);
                      durationRef.current = d;
                      if (pendingSeekRef.current !== null) {
                        const target = Math.max(0, Math.min(pendingSeekRef.current, d));
                        videoRef.current.currentTime = target;
                        currentTimeRef.current = target;
                        setCurrentTime(target);
                        pendingSeekRef.current = null;
                      }
                    }
                  }}
                  onPlay={() => {
                    setIsPlaying(true);
                    isPlayingRef.current = true;
                  }}
                  onPause={() => {
                    setIsPlaying(false);
                    isPlayingRef.current = false;
                  }}
                  onError={() => {
                    console.log('Video stream error, activating animated inspection canvas fallback');
                    setUseCanvasFallback(true);
                  }}
                  playsInline
                />
              ) : !useCanvasFallback ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-950 text-center px-6">
                  {playbackUrlError ? (
                    <>
                      <AlertCircle className="w-7 h-7 text-rose-400" />
                      <p className="text-sm font-semibold text-white">영상을 재생할 수 없습니다.</p>
                      <p className="max-w-md text-xs text-slate-400">{playbackUrlError}</p>
                    </>
                  ) : (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                      <p className="text-sm font-semibold text-white">공유된 강의 영상을 준비하고 있습니다.</p>
                    </>
                  )}
                </div>
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

              {/* Center Play overlay button when paused (for native/canvas) */}
              {!sourceInfo.isExternal && !isPlaying && (resolvedPlaybackUrl || useCanvasFallback) && (
                <button
                  type="button"
                  onClick={handlePlayPause}
                  className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform z-30"
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

              {/* Inspection Activation Check if Processing */}
              {selectedVideo.status === 'PROCESSING' && (
                <div className="mb-3 p-2.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-950 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                    <div>
                      <p className="font-bold">미디어 변환 처리 상태</p>
                      <p className="text-[11px] text-amber-700">검수 활성화 버튼을 눌러 즉시 검수 대기열로 전환할 수 있습니다.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateVideoStatus(selectedVideo.id, 'PENDING');
                      setSelectedVerdict('PENDING');
                    }}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors shadow-xs"
                  >
                    ⚡ 검수 즉시 활성화
                  </button>
                </div>
              )}

              {/* Reviewer & Verdict controls matching screenshot */}
              <div className="grid grid-cols-1 gap-4 pt-1">
                {/* 검수자 이름은 실제 작업자가 직접 입력합니다. */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">{t.reviewer}</label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={e => setReviewerName(e.target.value)}
                    placeholder={t.reviewerNameInput}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 transition-colors"
                  />
                </div>

                {/* 검수 결과 3 Buttons: 승인 [Green], 반려 [Red], 대기로 [Dark Slate] */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      {t.reviewResult}
                    </label>
                    {/* Real-time Status Badge */}
                    <div className="text-[11px] font-bold">
                      {selectedVerdict === 'APPROVED' ? (
                        <span className="text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md inline-flex items-center gap-1 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{t.statusApproved} 반영됨</span>
                        </span>
                      ) : selectedVerdict === 'REJECTED' ? (
                        <span className="text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-md inline-flex items-center gap-1 shadow-2xs">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>{t.statusRejected} 반영됨</span>
                        </span>
                      ) : (
                        <span className="text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{t.statusPending}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* 승인 버튼 */}
                    <button
                      type="button"
                      onClick={() => handleVerdictClick('APPROVED')}
                      className={`min-h-11 py-2 px-2 whitespace-nowrap rounded-xl text-xs sm:text-sm font-bold transition-all transform active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${
                        selectedVerdict === 'APPROVED'
                          ? 'bg-emerald-600 text-white border-2 border-emerald-600 ring-4 ring-emerald-500/20 shadow-md scale-[1.02]'
                          : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/40 shadow-2xs'
                      }`}
                      title="클릭하여 즉시 '승인 완료' 상태로 저장합니다."
                    >
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${selectedVerdict === 'APPROVED' ? 'text-white' : 'text-emerald-600'}`} />
                      <span>{t.btnApprove}</span>
                    </button>

                    {/* 반려 버튼 */}
                    <button
                      type="button"
                      onClick={() => handleVerdictClick('REJECTED')}
                      className={`min-h-11 py-2 px-2 whitespace-nowrap rounded-xl text-xs sm:text-sm font-bold transition-all transform active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${
                        selectedVerdict === 'REJECTED'
                          ? 'bg-rose-600 text-white border-2 border-rose-600 ring-4 ring-rose-500/20 shadow-md scale-[1.02]'
                          : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-rose-500 hover:text-rose-700 hover:bg-rose-50/40 shadow-2xs'
                      }`}
                      title="클릭하여 즉시 '검수 반려' 상태로 저장하고 사유 입력을 활성화합니다."
                    >
                      <XCircle className={`w-4 h-4 shrink-0 ${selectedVerdict === 'REJECTED' ? 'text-white' : 'text-rose-600'}`} />
                      <span>{t.btnReject}</span>
                    </button>

                    {/* 대기로 버튼 */}
                    <button
                      type="button"
                      onClick={() => handleVerdictClick('PENDING')}
                      className={`min-h-11 py-2 px-2 whitespace-nowrap rounded-xl text-xs sm:text-sm font-bold transition-all transform active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${
                        selectedVerdict === 'PENDING'
                          ? 'bg-slate-800 text-white border-2 border-slate-800 ring-4 ring-slate-700/20 shadow-md scale-[1.02]'
                          : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-500 hover:text-slate-900 hover:bg-slate-100 shadow-2xs'
                      }`}
                      title="클릭하여 '검수 대기' 상태로 전환합니다."
                    >
                      <Clock className={`w-4 h-4 shrink-0 ${selectedVerdict === 'PENDING' ? 'text-white' : 'text-slate-500'}`} />
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

                              {(currentUser.role === 'ADMIN' || (reviewerName.trim() !== '' && reviewerName.trim().startsWith(rev.author))) && (
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


            {/* Tab 2 Content: AI Automated Subtitles & SRT/VTT Import */}
            {rightTab === 'aiSubtitles' && (
              <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-y-auto">
                {/* Hidden File Input for SRT/VTT */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleSubtitleFileUpload}
                  accept=".srt,.vtt,.txt"
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>{t.aiSubtitleTab}</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {language === 'ko' ? '실제 강의 음성을 전사해 타임코드 자막과 분석 요약을 생성합니다.' : 'Transcribe the actual lecture audio into timed subtitles and an analysis summary.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* SRT / VTT File Import Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="SRT 또는 VTT 자막 파일 불러오기"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-600" />
                      <span>{t.uploadSubtitleBtn}</span>
                    </button>

                    {/* AI Subtitle Generation Button */}
                    <button
                      type="button"
                      onClick={handleGenerateAiSubtitles}
                      disabled={isGeneratingAi || (!selectedVideo.s3Key && !selectedVideo.videoUrl?.startsWith('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/'))}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {isGeneratingAi ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{language === 'ko' ? '생성 중...' : 'Generating...'}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{t.btnGenerateSubtitles}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {(aiProgress || aiGenError) && (
                  <div role={aiGenError ? 'alert' : 'status'} className={'mb-3 p-3 rounded-lg border text-xs ' + (aiGenError ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-blue-200 bg-blue-50 text-blue-800')}>
                    <div className="flex items-start gap-2">
                      {aiGenError ? <AlertCircle className="w-4 h-4 shrink-0" /> : isGeneratingAi ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                      <span>{aiGenError || aiProgress}</span>
                    </div>
                  </div>
                )}

                {!selectedVideo.s3Key && !selectedVideo.videoUrl?.startsWith('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/') && (
                  <p className="mb-3 p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-800">
                    AI 분석은 업로드한 실제 영상 파일에서만 실행할 수 있습니다. 외부 링크 영상은 원본 파일로 등록해 주세요. AI는 강의 제목만 보고 자막을 만들어내지 않습니다.
                  </p>
                )}

                {selectedVideo.aiAnalysis && (
                  <section className="mb-3 p-3.5 rounded-xl border border-violet-200 bg-violet-50/70">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-violet-900 mb-1.5"><Sparkles className="w-3.5 h-3.5" />실제 영상 AI 분석 요약</div>
                    <p className="text-xs leading-relaxed text-slate-700">{selectedVideo.aiAnalysis.summary || '요약 정보가 없습니다.'}</p>
                    {selectedVideo.aiAnalysis.keyTerms.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{selectedVideo.aiAnalysis.keyTerms.map((term, index) => <span key={term + index} className="px-2 py-0.5 rounded-full bg-white border border-violet-200 text-[10px] font-semibold text-violet-800">{term}</span>)}</div>}
                    {selectedVideo.aiAnalysis.uncertaintyNotes.length > 0 && <div className="mt-2 pt-2 border-t border-violet-200 text-[11px] text-amber-800"><strong>확인 필요:</strong> {selectedVideo.aiAnalysis.uncertaintyNotes.join(' · ')}</div>}
                    <div className="mt-2 text-[10px] text-slate-500">{selectedVideo.aiAnalysis.model} · {new Date(selectedVideo.aiAnalysis.analyzedAt).toLocaleString()}</div>
                  </section>
                )}

                {/* Subtitles Export Toolbar */}
                {selectedVideo.subtitles.length > 0 && (
                  <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-slate-100 flex-wrap">
                    <span className="text-xs text-slate-500 font-semibold">{language === 'ko' ? '내보내기:' : 'Export:'}</span>
                    <button
                      onClick={() => downloadFile(exportSubtitlesToSrt(selectedVideo.subtitles), `${selectedVideo.fileName}.srt`, 'text/plain')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3 h-3 text-slate-600" /> {t.exportSrt}
                    </button>
                    <button
                      onClick={() => downloadFile(exportSubtitlesToVtt(selectedVideo.subtitles), `${selectedVideo.fileName}.vtt`, 'text/vtt')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3 h-3 text-slate-600" /> {t.exportVtt}
                    </button>
                    <button
                      onClick={() => downloadFile(JSON.stringify(selectedVideo.subtitles, null, 2), `${selectedVideo.fileName}.json`, 'application/json')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3 h-3 text-slate-600" /> {t.exportJson}
                    </button>
                  </div>
                )}

                {/* Subtitles Item List with Inline Editing */}
                <div className="flex-1 space-y-2.5 overflow-y-auto max-h-80 pr-1">
                  {selectedVideo.subtitles.length === 0 ? (
                    <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-400 border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
                      <Sparkles className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-sm font-bold text-slate-600">{language === 'ko' ? '등록된 자막이 없습니다.' : 'No subtitles loaded.'}</p>
                      <p className="text-xs mt-1 text-slate-500 max-w-sm">
                        {language === 'ko'
                          ? "상단 '강의 맞춤 AI 자막 생성'을 실행하거나, 보유하신 SRT/VTT 자막 파일을 직접 불러오세요."
                          : "Click 'Generate Lecture Subtitles' or import your SRT/VTT subtitle files above."}
                      </p>
                    </div>
                  ) : (
                    selectedVideo.subtitles.map(sub => (
                      <div
                        key={sub.id}
                        className={`p-3 rounded-xl border text-xs sm:text-[14px] transition-colors ${
                          currentTime >= sub.startSeconds && currentTime <= sub.endSeconds
                            ? 'bg-blue-50/90 border-blue-400 shadow-2xs ring-1 ring-blue-300'
                            : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <button
                            type="button"
                            onClick={() => handleSeek(sub.startSeconds)}
                            className="font-mono font-bold text-blue-600 hover:text-blue-800 text-xs bg-blue-100/70 hover:bg-blue-200 px-2 py-0.5 rounded transition-colors"
                            title="클릭하여 해당 시점으로 이동"
                          >
                            ▶ {sub.startTime} - {sub.endTime}
                          </button>

                          <div className="flex items-center gap-2">
                            {sub.confidence && <span className={'px-1.5 py-0.5 rounded text-[10px] font-bold ' + (sub.confidence === 'high' ? 'bg-emerald-100 text-emerald-700' : sub.confidence === 'low' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800')}>{sub.confidence === 'high' ? '높은 신뢰도' : sub.confidence === 'low' ? '확인 필요' : '보통 신뢰도'}</span>}
                            {editingSubId === sub.id ? (
                              <button
                                type="button"
                                onClick={() => handleSaveSubtitleRow(sub.id)}
                                className="text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded"
                              >
                                저장
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSubId(sub.id);
                                  setEditingTextKo(sub.textKo);
                                }}
                                className="text-[11px] font-medium text-slate-500 hover:text-slate-800 underline"
                              >
                                {language === 'ko' ? '수정' : 'Edit'}
                              </button>
                            )}
                          </div>
                        </div>

                        {editingSubId === sub.id ? (
                          <textarea
                            rows={2}
                            value={editingTextKo}
                            onChange={e => setEditingTextKo(e.target.value)}
                            className="w-full p-2 bg-white border border-blue-400 rounded-lg text-xs sm:text-[14px] focus:outline-hidden text-slate-900"
                          />
                        ) : (
                          <p
                            onClick={() => handleSeek(sub.startSeconds)}
                            className="text-slate-900 font-medium cursor-pointer hover:text-blue-600 transition-colors leading-relaxed"
                          >
                            {sub.textKo}
                          </p>
                        )}

                        {sub.textEn && (
                          <p className="text-blue-700 text-xs mt-1 font-normal opacity-90">{sub.textEn}</p>
                        )}
                        {sub.uncertaintyNote && <p className="mt-1 text-[11px] text-rose-700">확인 필요: {sub.uncertaintyNote}</p>}
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

      {/* Floating live subtitle indicator matching screenshot 1 */}
      {selectedVideo.subtitles && selectedVideo.subtitles.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black/90 text-white px-6 py-2.5 rounded-xl shadow-2xl border border-slate-700/80 max-w-lg text-center backdrop-blur-md pointer-events-none">
          <div className="text-[10px] font-bold text-slate-400 mb-0.5 italic">실시간 자막</div>
          <div className="text-xs sm:text-sm font-medium text-slate-100">
            {selectedVideo.subtitles.find(s => currentTime >= s.startSeconds && currentTime <= s.endSeconds)?.textKo ||
              selectedVideo.subtitles[0]?.textKo ||
              '안녕하십니까? 전문대학 평생직업교육 혁신과 ESG 생태계 조성입니다.'}
          </div>
        </div>
      )}

    </div>
  );
};
