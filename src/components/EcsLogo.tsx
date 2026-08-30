import React from 'react';

interface EcsLogoProps {
  variant?: 'circle' | 'horizontal' | 'compact' | 'full';
  className?: string;
  isDark?: boolean;
}

export const EcsLogo: React.FC<EcsLogoProps> = ({
  variant = 'circle',
  className = 'h-8',
  isDark = false,
}) => {
  if (variant === 'circle') {
    return (
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Background Circle */}
        <circle cx="100" cy="100" r="98" fill="#00529b" stroke="#003e75" strokeWidth="3" />

        {/* Large Bold ECS Text */}
        <text
          x="100"
          y="92"
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="72"
          letterSpacing="-1.5"
        >
          ECS
        </text>

        {/* Green Wave Swoosh */}
        <path
          d="M 12 99 C 55 106, 95 104, 135 95 C 160 89, 185 96, 188 98 C 170 106, 130 110, 95 107 C 55 105, 25 103, 12 99 Z"
          fill="#44b33c"
        />

        {/* Tagline: A Service Logic Company */}
        <text
          x="172"
          y="118"
          textAnchor="end"
          fill="#ffffff"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontStyle="italic"
          fontSize="10"
          fontWeight="500"
          opacity="0.95"
        >
          A Service Logic Company
        </text>

        {/* Engineered */}
        <text
          x="100"
          y="142"
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="800"
          fontSize="23"
          letterSpacing="-0.3"
        >
          Engineered
        </text>

        {/* Cooling */}
        <text
          x="100"
          y="167"
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="800"
          fontSize="24"
          letterSpacing="-0.3"
        >
          Cooling
        </text>

        {/* Services */}
        <text
          x="100"
          y="190"
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="400"
          fontSize="21"
          letterSpacing="0.2"
        >
          Services
        </text>
      </svg>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-7 h-7 shrink-0 shadow-sm rounded-full"
        >
          <circle cx="100" cy="100" r="98" fill="#00529b" />
          <text
            x="100"
            y="94"
            textAnchor="middle"
            fill="#ffffff"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="74"
            letterSpacing="-1"
          >
            ECS
          </text>
          <path
            d="M 15 101 C 55 107, 95 105, 135 96 C 160 90, 185 97, 185 97 C 170 105, 130 110, 95 107 C 55 105, 25 103, 15 101 Z"
            fill="#44b33c"
          />
          <text
            x="100"
            y="152"
            textAnchor="middle"
            fill="#ffffff"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="800"
            fontSize="30"
          >
            COOLING
          </text>
        </svg>
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1">
            <span className={`font-black tracking-tight text-sm ${isDark ? 'text-white' : 'text-[#00529b]'}`}>
              ECS
            </span>
            <span className="text-[11px] font-bold text-[#44b33c]">•</span>
            <span className={`font-bold text-xs ${isDark ? 'text-slate-200' : 'text-[#00386b]'}`}>
              Engineered Cooling Services
            </span>
          </div>
          <span className="text-[9px] font-medium opacity-75 text-slate-400 italic">
            A Service Logic Company
          </span>
        </div>
      </div>
    );
  }

  // Full / Horizontal Logo
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-10 shrink-0 drop-shadow-sm"
      >
        <circle cx="100" cy="100" r="98" fill="#00529b" />
        <text
          x="100"
          y="92"
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="72"
        >
          ECS
        </text>
        <path
          d="M 12 99 C 55 106, 95 104, 135 95 C 160 89, 185 96, 188 98 C 170 106, 130 110, 95 107 C 55 105, 25 103, 12 99 Z"
          fill="#44b33c"
        />
        <text
          x="100"
          y="152"
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="800"
          fontSize="30"
        >
          COOLING
        </text>
      </svg>

      <div className="flex flex-col">
        {/* Title: Engineered Cooling Services */}
        <div className="flex items-baseline gap-1.5">
          <span className={`font-black tracking-tight text-base ${isDark ? 'text-sky-400' : 'text-[#004e8c]'}`}>
            Engineered
          </span>
          <span className={`font-semibold tracking-tight text-base ${isDark ? 'text-slate-100' : 'text-[#00386b]'}`}>
            Cooling Services
          </span>
        </div>

        {/* Tagline 1: Building Efficiency and Sustainability */}
        <div className="text-[10px] tracking-wider uppercase font-semibold text-slate-400 -mt-0.5">
          Building Efficiency and Sustainability
        </div>

        {/* Green Wave Divider line */}
        <div className="w-full h-0.5 my-0.5 bg-gradient-to-r from-[#44b33c] via-[#44b33c] to-transparent rounded-full" />

        {/* Tagline 2: A Service Logic Company */}
        <div className={`text-[9px] font-medium italic ${isDark ? 'text-sky-300' : 'text-[#004e8c]'}`}>
          A Service Logic Company
        </div>
      </div>
    </div>
  );
};
