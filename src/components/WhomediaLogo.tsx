import React from 'react';

interface WhomediaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  isDarkTheme?: boolean;
}

export const WhomediaLogo: React.FC<WhomediaLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  subtitle = '스마트 동영상 검수 시스템',
  isDarkTheme = false
}) => {
  const iconSizes = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-11 h-11 rounded-xl',
    xl: 'w-14 h-14 rounded-2xl'
  };

  const textSizes = {
    sm: {
      title: 'text-sm font-black tracking-tight',
      sub: 'text-[9px] font-medium tracking-normal'
    },
    md: {
      title: 'text-base font-black tracking-tight',
      sub: 'text-[10px] font-medium tracking-normal'
    },
    lg: {
      title: 'text-lg font-black tracking-tight',
      sub: 'text-xs font-medium tracking-normal'
    },
    xl: {
      title: 'text-2xl font-black tracking-tight',
      sub: 'text-sm font-medium tracking-normal'
    }
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* WHOMEDIA Signature Emblem Icon with Red & Dark Slate styling */}
      <div
        className={`${iconSizes[size]} relative bg-gradient-to-br from-red-600 via-rose-600 to-red-700 flex items-center justify-center text-white shadow-md shadow-red-500/20 shrink-0 border border-red-400/30 overflow-hidden`}
      >
        <svg
          viewBox="0 0 40 40"
          className="w-full h-full p-1.5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="wmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#fecdd3" />
            </linearGradient>
            <linearGradient id="wmPlay" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>

          {/* Dynamic Media Waves / Geometric W */}
          <path
            d="M8 12 L14 27 L20 16 L26 27 L32 12"
            stroke="url(#wmGrad)"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Media Play Accent Wedge */}
          <polygon
            points="18,18 24,21 18,24"
            fill="url(#wmPlay)"
          />

          {/* Lens focus circle */}
          <circle
            cx="20"
            cy="20"
            r="16"
            stroke="white"
            strokeWidth="1.2"
            strokeOpacity="0.3"
            strokeDasharray="2 3"
          />
        </svg>
      </div>

      {/* WHOMEDIA Typography: WHO in RED, MEDIA in BLACK */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`${textSizes[size].title} font-sans uppercase`}>
              <span className="text-red-600 font-black tracking-tight">WHO</span>
              <span className={isDarkTheme ? 'text-white font-black tracking-tight' : 'text-black font-black tracking-tight'}>MEDIA</span>
            </span>
            <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200/80 px-1.5 py-0.2 rounded font-sans">
              (주)후미디어
            </span>
          </div>
          {subtitle && (
            <span className={`${textSizes[size].sub} ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'} font-medium mt-0.5`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
