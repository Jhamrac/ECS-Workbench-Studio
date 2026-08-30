import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Cpu, Terminal, Radio, Sparkles, CheckCircle2, Play, RefreshCw } from 'lucide-react';

interface EcsBootSplashProps {
  onComplete?: () => void;
  autoDismiss?: boolean;
}

export const EcsBootSplash: React.FC<EcsBootSplashProps> = ({ onComplete, autoDismiss = true }) => {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const steps = [
    { text: 'Loading Niagara 4 Framework Core...', icon: Cpu },
    { text: 'Initializing Station Drivers (BACnet, LonWorks, Modbus)...', icon: Radio },
    { text: 'Securing Credentials & SSL Tunneling...', icon: ShieldCheck },
    { text: 'Binding WireSheet Canvas & Graphics Renderers...', icon: Terminal },
    { text: 'Syncing Local Station Database & Point Views...', icon: Sparkles },
    { text: 'Workbench Studio Ready. Opening workspace...', icon: CheckCircle2 }
  ];

  useEffect(() => {
    let currentP = 0;
    const interval = setInterval(() => {
      currentP += 2;
      if (currentP > 100) {
        currentP = 100;
        clearInterval(interval);
        setIsFinished(true);
        if (autoDismiss) {
          setTimeout(() => {
            onComplete?.();
          }, 600);
        }
      }
      setProgress(currentP);

      // Determine step index based on progress
      const stepIdx = Math.min(
        Math.floor((currentP / 100) * steps.length),
        steps.length - 1
      );
      setCurrentStepIndex(stepIdx);
    }, 45);

    return () => clearInterval(interval);
  }, [autoDismiss, onComplete]);

  const StepIcon = steps[currentStepIndex].icon;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/95 backdrop-blur-md font-sans text-white p-4">
      {/* Background Animated Grids & Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(10,82,156,0.25)_0,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Main Splash Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-xl rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 p-8 shadow-2xl shadow-blue-950/60 overflow-hidden"
      >
        {/* Decorative Top/Bottom Accent Waves */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0A529C] via-[#39A935] to-[#0A529C]" />
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {/* Custom ECS Circular Logo Badge */}
            <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#0A529C] shadow-lg shadow-blue-600/30 border-2 border-white/20 overflow-hidden flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-10 h-10 fill-current text-white">
                <circle cx="50" cy="50" r="48" fill="#0A529C" />
                <path d="M10 52 C 35 47, 65 55, 90 50" stroke="#39A935" strokeWidth="5" strokeLinecap="round" fill="none" />
                <text x="50" y="44" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="28" fill="#FFFFFF" textAnchor="middle">ECS</text>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Workbench <span className="text-[#39A935]">Studio</span>
              </h1>
              <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mt-0.5">
                Engineered Cooling Services &bull; Controls
              </p>
            </div>
          </div>
          <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-wider uppercase">
            Enterprise Edition
          </div>
        </div>

        {/* Live Diagnostics Card */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 backdrop-blur-sm mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-[#39A935] border border-emerald-500/20">
                <StepIcon className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-mono block">SYSTEM INITIALIZATION</span>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentStepIndex}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-sm font-medium text-slate-200"
                  >
                    {steps[currentStepIndex].text}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
            <span className="text-base font-bold font-mono text-[#39A935] pl-2">
              {progress}%
            </span>
          </div>
        </div>

        {/* Progress Bar Track */}
        <div className="relative w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-6">
          <motion.div
            className="h-full bg-gradient-to-r from-[#0A529C] to-[#39A935] shadow-[0_0_12px_rgba(57,169,53,0.8)]"
            style={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut' }}
          />
        </div>

        {/* Footer Meta */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            A Service Logic Company
          </span>
          <span>v1.0.4 &bull; Station Host Ready</span>
        </div>

        {/* Optional Skip Button if auto-dismiss is disabled */}
        {!autoDismiss && isFinished && (
          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => onComplete?.()}
              className="px-5 py-2 rounded-lg bg-[#39A935] hover:bg-emerald-600 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              Enter Studio <Play className="w-4 h-4 fill-current" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
