import React, { useEffect, useState } from 'react';
import { EcsLogo } from './EcsLogo';
import {
  FileCode,
  Globe,
  Settings,
  HelpCircle,
  Activity,
  ArrowRight,
  Database,
  ShieldCheck,
  Cpu,
  BookOpen,
} from 'lucide-react';
import { NiagaraProgram } from '../types/niagara';

interface StartPageProps {
  onGoToView: (view: 'wiresheet' | 'guide' | 'soo' | 'troubleshoot') => void;
  onGoToStudio: (studioId: string) => void;
  currentProgram: NiagaraProgram;
  isDark: boolean;
  onOpenSettings?: () => void;
  isSidebarOpen?: boolean;
}

export const StartPage: React.FC<StartPageProps> = ({
  onGoToView,
  onGoToStudio,
  currentProgram,
  isDark,
  onOpenSettings,
  isSidebarOpen = true,
}) => {
  const [uptime, setUptime] = useState('00:00:00');
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const diff = Date.now() - start;
      const hrs = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const mins = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setUptime(`${uptime}`);
      setSeconds(Math.floor(diff / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`flex-1 flex flex-col items-center justify-center p-8 sm:p-12 md:p-16 select-none transition-all duration-500 overflow-y-auto ${
        isDark
          ? 'bg-radial from-[#0d1b35] via-[#071122] to-[#040811] text-slate-200'
          : 'bg-radial from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] text-slate-800'
      }`}
    >
      <div
        className={`flex flex-col items-center justify-center transition-all duration-500 ease-in-out w-full max-w-5xl space-y-12 md:space-y-16`}
      >
        {/* Circular ECS Logo */}
        <div
          className={`relative group transition-all duration-500 ${
            isSidebarOpen
              ? 'w-40 h-40 sm:w-48 sm:h-48 md:w-52 md:h-52 lg:w-56 lg:h-56'
              : 'w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 lg:w-64 lg:h-64'
          }`}
        >
          {/* Subtle outer glowing rings for rich engineering style */}
          <div className="absolute inset-0 rounded-full bg-[#00529b]/15 blur-2xl scale-125 group-hover:scale-135 transition-transform duration-1000" />
          <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#44b33c]/25 to-[#00529b]/25 opacity-30 animate-spin-slow" />

          <EcsLogo
            variant="circle"
            className="w-full h-full shrink-0 relative z-10 transition-transform duration-500 hover:scale-105 filter drop-shadow-[0_10px_15px_rgba(0,82,155,0.25)]"
            isDark={isDark}
          />
        </div>

        {/* Dynamic Vector Banner Image */}
        <div
          className={`w-full transition-all duration-500 px-4 ${
            isSidebarOpen
              ? 'max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl'
              : 'max-w-lg sm:max-w-xl md:max-w-3xl lg:max-w-4xl'
          }`}
        >
          <svg
            viewBox="0 0 1000 280"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto select-none filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.05)]"
          >
            {/* Engineered Cooling Services */}
            <text
              x="10"
              y="90"
              fontFamily="system-ui, -apple-system, sans-serif"
              className="fill-[#00529b] dark:fill-slate-100 transition-colors"
            >
              <tspan fontWeight="900" fontSize="80" letterSpacing="-1.5">Engineered</tspan>
              <tspan fontWeight="300" fontSize="80" letterSpacing="-1"> Cooling Services</tspan>
            </text>

            {/* Building Efficiency and Sustainability */}
            <text
              x="10"
              y="150"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="300"
              fontSize="42"
              className="fill-slate-500 dark:fill-slate-400 tracking-wide transition-colors"
            >
              Building Efficiency and Sustainability
            </text>

            {/* Green Wave / Swoosh */}
            <path
              d="M 0 190 C 200 270, 500 240, 800 160 C 900 140, 960 160, 1000 190 C 950 170, 850 155, 750 180 C 450 250, 200 255, 0 190 Z"
              className="fill-[#44b33c]"
            />

            {/* A Service Logic Company */}
            <text
              x="730"
              y="255"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontStyle="italic"
              fontWeight="600"
              fontSize="36"
              className="fill-[#00529b] dark:fill-sky-400 transition-colors"
              textAnchor="middle"
            >
              A Service Logic Company
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
};
