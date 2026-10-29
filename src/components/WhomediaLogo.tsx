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
      title: 'text-sm font-bold tracking-tight',
      sub: 'text-[9px] font-medium tracking-normal'
    },
    md: {
      title: 'text-base font-bold tracking-tight',
      sub: 'text-[11px] font-medium tracking-normal'
    },
    lg: {
      title: 'text-lg font-bold tracking-tight',
      sub: 'text-xs font-medium tracking-normal'
    },
    xl: {
      title: 'text-2xl font-bold tracking-tight',
      sub: 'text-sm font-medium tracking-normal'
    }
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Modern Video QA Emblem: Indigo & Blue gradient with play checkmark */}
      <div
        className={`${iconSizes[size]} relative bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 flex items-center justify-center text-white shadow-md shadow-blue-500/15 shrink-0 border border-blue-400/25 overflow-hidden`}
      >
        <svg
          viewBox="0 0 40 40"
          className="w-full h-full p-1.5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Rounded Video Display outline */}
          <rect
            x="5"
            y="7"
            width="30"
            height="22"
            rx="4"
            stroke="white"
            strokeWidth="2.4"
            strokeOpacity="0.9"
          />
          {/* Stand */}
          <path
            d="M16 29 L24 29 M20 29 L20 33 M13 33 L27 33"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Play & QA Check Accent */}
          <polygon
            points="16,13 25,18 16,23"
            fill="#38bdf8"
          />
          {/* Verification Dot */}
          <circle
            cx="29"
            cy="11"
            r="3.5"
            fill="#10b981"
            stroke="white"
            strokeWidth="1.2"
          />
        </svg>
      </div>

      {/* Official Corporate Brand Lockup: WHOMEDIA · (주)후미디어 영상 검수 시스템 */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`${textSizes[size].title} font-black tracking-tight`}>
              <span className="text-red-600">WHO</span><span className={isDarkTheme ? 'text-white' : 'text-slate-900'}>MEDIA</span>
            </span>
            <span className="text-slate-400 font-bold" aria-hidden="true">·</span>
            <span className={`${textSizes[size].title} font-bold tracking-tight ${isDarkTheme ? 'text-slate-100' : 'text-slate-900'}`}>
              (주)후미디어 영상 검수 시스템
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
