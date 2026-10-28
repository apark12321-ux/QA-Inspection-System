import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatTime } from '../utils/formatters';
import { X, Share2, Copy, Check, Clock } from 'lucide-react';

export const ShareModal: React.FC = () => {
  const { shareModalVideo, shareModalTimestamp, projects, closeShareModal } = useApp();
  const [includeTime, setIncludeTime] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');

  useEffect(() => {
    setIncludeTime(shareModalTimestamp > 0);
    setCopied(false);
    setCopyError('');
  }, [shareModalVideo?.id, shareModalTimestamp]);

  const shareUrl = useMemo(() => {
    if (!shareModalVideo) return '';

    const project = projects.find(item => item.id === shareModalVideo.projectId);
    const url = new URL(window.location.href);
    // A shared video must always open in the reviewer view, including when the
    // link was created from the admin console.
    const currentPath = url.pathname.replace(/\/+$/, '');
    const fallbackPath = currentPath.endsWith('/admin')
      ? currentPath.slice(0, -'/admin'.length)
      : currentPath === '/admin' ? '' : currentPath;
    const projectPath = project?.alias ? '/' + encodeURIComponent(project.alias) : fallbackPath;
    url.pathname = projectPath || '/';
    url.search = '';
    url.hash = '';
    url.searchParams.set('v', shareModalVideo.id);
    if (includeTime && shareModalTimestamp > 0) {
      url.searchParams.set('t', String(Math.floor(shareModalTimestamp)));
    }
    return url.toString();
  }, [includeTime, projects, shareModalTimestamp, shareModalVideo]);

  if (!shareModalVideo) return null;

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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">이 영상만 공유</h3>
              <p className="text-xs text-slate-500">링크를 열면 이 강의 영상의 검수 화면이 표시됩니다.</p>
            </div>
          </div>
          <button onClick={closeShareModal} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200" aria-label="닫기">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="font-bold text-slate-900">{shareModalVideo.fileName}</div>
            <div className="text-slate-500 text-[11px] mt-0.5">{shareModalVideo.weekTitle} · {shareModalVideo.sessionTitle}</div>
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
              <button onClick={handleCopy} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 shrink-0">
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '복사 완료!' : '링크 복사'}</span>
              </button>
            </div>
            {copyError && <p className="mt-2 text-xs text-rose-600">{copyError}</p>}
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-900 leading-relaxed">
            공유 화면에는 이 영상 하나만 표시됩니다. 재생 시점을 포함하면 받은 사람이 같은 시점부터 검수할 수 있습니다.
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
          <button onClick={closeShareModal} className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">닫기</button>
        </div>
      </div>
    </div>
  );
};
