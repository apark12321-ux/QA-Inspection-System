import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';
import { formatTime } from '../utils/formatters';
import { X, Share2, Copy, Check, Clock, QrCode, Download, ExternalLink, Loader2 } from 'lucide-react';

export const ShareModal: React.FC = () => {
  const { shareModalVideo, shareModalTimestamp, projects, closeShareModal, deployDomain } = useApp();
  const [includeTime, setIncludeTime] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    setIncludeTime(shareModalTimestamp > 0);
    setCopied(false);
    setCopyError('');
  }, [shareModalVideo?.id, shareModalTimestamp]);

  const shareUrl = useMemo(() => {
    if (!shareModalVideo) return '';
    const project = projects.find(item => item.id === shareModalVideo.projectId);
    const origin = (deployDomain || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, '');
    const url = new URL(origin);
    url.pathname = '/';
    if (project?.alias) {
      url.searchParams.set('p', project.alias);
    }
    url.searchParams.set('v', shareModalVideo.id);
    if (includeTime && shareModalTimestamp > 0) {
      url.searchParams.set('t', String(Math.floor(shareModalTimestamp)));
    }
    return url.toString();
  }, [deployDomain, includeTime, projects, shareModalTimestamp, shareModalVideo]);

  useEffect(() => {
    if (!shareUrl) {
      setQrDataUrl('');
      return;
    }
    let isCancelled = false;
    QRCode.toDataURL(shareUrl, {
      width: 400,
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
  }, [shareUrl]);

  if (!shareModalVideo) return null;

  const project = projects.find(item => item.id === shareModalVideo.projectId);
  const fileSafeProj = (project?.alias || project?.name || 'project').replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
  const fileSafeTitle = (shareModalVideo.sessionTitle || shareModalVideo.fileName).replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
  const downloadFileName = `${fileSafeProj}_${shareModalVideo.weekTitle}_${fileSafeTitle}_QR.png`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setCopyError('');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError('브라우저에서 클립보드 접근을 허용하지 않았습니다. 링크를 직접 선택해 복사해 주세요.');
    }
  };

  const handleDownloadQrPng = () => {
    if (!qrDataUrl) return;
    try {
      const a = document.createElement('a');
      a.href = qrDataUrl;
      a.download = downloadFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">강의 영상 개별 공유 & QR코드</h3>
              <p className="text-xs text-slate-500">제안서(서류평가) 삽입용 QR 및 단독 검수 링크입니다.</p>
            </div>
          </div>
          <button onClick={closeShareModal} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 cursor-pointer" aria-label="닫기">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="font-bold text-slate-900 text-sm">{shareModalVideo.sessionTitle}</div>
            <div className="text-slate-500 text-xs mt-0.5">{shareModalVideo.fileName} · {shareModalVideo.weekTitle} ({shareModalVideo.fileSize})</div>
          </div>

          {/* QR Code Preview */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50/80 rounded-xl border border-slate-200">
            <div className="w-36 h-36 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="w-full h-full select-none" />
              ) : (
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              )}
            </div>
            <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <QrCode className="w-3 h-3" />
                <span>차시별 개별 영상 QR</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                스마트폰 카메라로 스캔하면 이 강의 검수창이 즉시 열립니다. 한글/워드/PPT 제안서에 삽입하세요.
              </p>
              <button
                type="button"
                onClick={handleDownloadQrPng}
                disabled={!qrDataUrl}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>QR PNG 다운로드</span>
              </button>
            </div>
          </div>

          {shareModalTimestamp > 0 && (
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input type="checkbox" checked={includeTime} onChange={event => setIncludeTime(event.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>현재 재생 시점에서 시작 ({formatTime(shareModalTimestamp)})</span>
            </label>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">영상 전용 링크</label>
            <div className="flex items-center gap-2">
              <input readOnly value={shareUrl} onFocus={event => event.currentTarget.select()} className="flex-1 min-w-0 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-700" aria-label="공유 링크" />
              <button onClick={handleCopy} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer">
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '복사 완료!' : '링크 복사'}</span>
              </button>
            </div>
            {copyError && <p className="mt-2 text-xs text-rose-600">{copyError}</p>}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>* 외부 심사위원이 별도 로그인 없이 즉시 검수할 수 있습니다.</span>
            <button
              type="button"
              onClick={() => window.open(shareUrl, '_blank')}
              className="text-blue-600 hover:underline font-semibold inline-flex items-center gap-1"
            >
              <span>새 탭 테스트</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
          <button onClick={closeShareModal} className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer">닫기</button>
        </div>
      </div>
    </div>
  );
};
