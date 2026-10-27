import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatTime } from '../utils/formatters';
import {
  X,
  Share2,
  Copy,
  Check,
  Link,
  Clock,
  ExternalLink
} from 'lucide-react';

export const ShareModal: React.FC = () => {
  const { shareModalVideo, shareModalTimestamp, closeShareModal } = useApp();
  const [includeTime, setIncludeTime] = useState(shareModalTimestamp > 0);
  const [copied, setCopied] = useState(false);

  if (!shareModalVideo) return null;

  const origin = window.location.origin + window.location.pathname;
  const shareUrl = `${origin}?v=${shareModalVideo.id}${includeTime ? `&t=${shareModalTimestamp}` : ''}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">간편 검수 공유 링크 생성</h3>
              <p className="text-xs text-slate-500">동료 검수자 및 제작자에게 타임코드 직행 링크 전달</p>
            </div>
          </div>

          <button
            onClick={closeShareModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="font-bold text-slate-900">{shareModalVideo.fileName}</div>
            <div className="text-slate-500 text-[11px] mt-0.5">
              {shareModalVideo.weekTitle} · {shareModalVideo.sessionTitle}
            </div>
          </div>

          {shareModalTimestamp > 0 && (
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeTime}
                onChange={e => setIncludeTime(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>현재 재생 시점 담기 ({formatTime(shareModalTimestamp)})</span>
            </label>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              생성된 다이렉트 검수 링크
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 truncate select-all">
                {shareUrl}
              </div>

              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '복사 완료!' : '링크 복사'}</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-900 leading-relaxed">
            ℹ️ 링크를 받은 사용자는 별도의 파일 탐색 없이 바로 해당 차시의 지정된 타임스탬프로 즉시 이동하여 동영상을 검수할 수 있습니다.
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={closeShareModal}
            className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
