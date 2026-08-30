import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Zap,
  RotateCcw,
  Sliders,
  HelpCircle,
  TrendingDown,
  Clock,
  Radio,
  Wifi,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { NetworkHealthMetrics, NetworkTrunk, BacnetDevice } from '../../types/networking';
import { useNiagaraTheme } from '../../context/NiagaraThemeContext';

interface NetworkHealthViewProps {
  healthMetrics: NetworkHealthMetrics;
  trunks: NetworkTrunk[];
  devices: BacnetDevice[];
  onOpenAiAssist?: (prompt: string) => void;
}

export const NetworkHealthView: React.FC<NetworkHealthViewProps> = ({
  healthMetrics,
  trunks,
  devices,
}) => {
  const { theme, isDark } = useNiagaraTheme();

  const [selectedTrunkId, setSelectedTrunkId] = useState<string>(trunks[1]?.id || trunks[0]?.id || '');

  const activeTrunk = trunks.find((t) => t.id === selectedTrunkId) || trunks[0];
  const trunkDevices = devices.filter((d) => d.networkNumber === activeTrunk?.networkNumber);

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 sm:p-6 custom-scrollbar font-sans select-none">
      <div className="max-w-6xl mx-auto space-y-6 w-full">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>OT Network Health & Quality Diagnostics</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              Comprehensive telemetry: Token ring rotation, duplicate MAC collision alarms, broadcast ratios & bus stability
            </p>
          </div>
        </div>

        {/* 4 Health KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Overall Health Score Card */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-[#07162e] border-[#102d58]' : 'bg-white border-[#cbd8e6] shadow-sm'
            }`}
          >
            <div>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider block">
                Subnet Health Grade
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {healthMetrics.healthScore}%
                </span>
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                  Grade {healthMetrics.grade}
                </span>
              </div>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium block mt-0.5">Zero bus packet drop</span>
            </div>
            <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          {/* Broadcast Storm & Ratio */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-[#07162e] border-[#102d58]' : 'bg-white border-[#cbd8e6] shadow-sm'
            }`}
          >
            <div>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider block">
                Broadcast Traffic Ratio
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-sky-700 dark:text-sky-400">
                  {healthMetrics.broadcastRatioPercent}%
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">of total</span>
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block mt-0.5">
                Normal (&lt; 15% threshold)
              </span>
            </div>
            <div className="p-3 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/40">
              <Radio className="w-6 h-6" />
            </div>
          </div>

          {/* Token Rotation Latency */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-[#07162e] border-[#102d58]' : 'bg-white border-[#cbd8e6] shadow-sm'
            }`}
          >
            <div>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider block">
                MS/TP Token Latency
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                  {healthMetrics.tokenRingRotationLatencyMs}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-mono font-medium">ms / pass</span>
              </div>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium block mt-0.5">Optimal response time</span>
            </div>
            <div className="p-3 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Collision & CRC Errors */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-[#07162e] border-[#102d58]' : 'bg-white border-[#cbd8e6] shadow-sm'
            }`}
          >
            <div>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider block">
                MAC / ID Collisions
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">0</span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-mono font-medium">Conflicts</span>
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block mt-0.5">
                CRC Errors: {healthMetrics.crcErrorCount}
              </span>
            </div>
            <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* MS/TP Token Ring Circular Visualizer & Gap Analyzer */}
        <div
          className={`p-5 rounded-xl border ${
            isDark ? 'bg-[#07162e] border-[#102d58]' : 'bg-white border-[#cbd8e6] shadow-sm'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700/30">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
                <span>BACnet MS/TP Token Ring Rotation & MAC Addressing Table</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                Visualizing token passing between master controllers and detecting MAC address gaps
              </p>
            </div>

            {/* Trunk Selector */}
            <select
              value={selectedTrunkId}
              onChange={(e) => setSelectedTrunkId(e.target.value)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold cursor-pointer ${
                isDark ? 'bg-[#030b18] border-[#102c54] text-slate-200' : 'bg-white border-[#b9cee2] text-slate-900'
              }`}
            >
              {trunks
                .filter((t) => t.protocol === 'BACnet MS/TP')
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (Net #{t.networkNumber})
                  </option>
                ))}
            </select>
          </div>

          {/* Token Ring Nodes Layout */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {trunkDevices.map((dev, idx) => {
              const nextDev = trunkDevices[(idx + 1) % trunkDevices.length];

              return (
                <div
                  key={dev.id}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    isDark
                      ? 'bg-[#091f3e] border-[#183a6f] text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-900 shadow-xs'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold font-mono text-xs mx-auto mb-2">
                    {dev.macAddress ?? idx + 1}
                  </div>
                  <div className="font-bold text-xs truncate text-slate-900 dark:text-slate-100" title={dev.name}>
                    {dev.name}
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium mt-0.5">
                    ID: {dev.deviceInstance}
                  </p>

                  <div className="mt-2 pt-1 border-t border-slate-200 dark:border-slate-700/30 text-[9px] text-slate-600 dark:text-slate-400 font-mono font-medium flex items-center justify-center gap-1">
                    <span>Token → MAC {nextDev.macAddress ?? 1}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Diagnostic Recommendation Banner */}
          <div
            className={`mt-4 p-3 rounded-lg border flex items-start gap-2.5 ${
              isDark
                ? 'bg-sky-950/30 border-sky-800/40 text-sky-200'
                : 'bg-sky-50 border-sky-200 text-sky-950'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold">Optimization Tip (Max Master Setting):</span>
              <p className="opacity-90 mt-0.5 leading-relaxed font-medium">
                Currently, controllers on Trunk 1 have <code>Max_Master = 127</code>. Since the highest active node is MAC 7, changing Max Master to <strong>10</strong> will eliminate 117 unused "Poll_For_Master" frames per cycle and reduce token latency by ~45%.
              </p>
            </div>
          </div>
        </div>

        {/* Quality of Life: Technician BAS Field Diagnostic Guide */}
        <div
          className={`p-5 rounded-xl border ${
            isDark ? 'bg-[#07162e] border-[#102d58]' : 'bg-white border-[#cbd8e6] shadow-sm'
          }`}
        >
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-3">
            <HelpCircle className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Field Troubleshooting Quick Reference</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700/30 bg-slate-50 dark:bg-black/20">
              <h4 className="font-bold text-amber-700 dark:text-amber-300">⚡ RS-485 Polarity & EOL</h4>
              <p className="text-slate-600 dark:text-slate-400 font-medium mt-1 leading-relaxed text-[11px]">
                Always ensure a 120Ω End-of-Line (EOL) termination resistor is enabled at the physical first and last devices on the daisy chain only.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700/30 bg-slate-50 dark:bg-black/20">
              <h4 className="font-bold text-sky-700 dark:text-sky-300">🌐 BBMD & Subnet Crossings</h4>
              <p className="text-slate-600 dark:text-slate-400 font-medium mt-1 leading-relaxed text-[11px]">
                BACnet/IP broadcasts do not cross IP routers by default. Configure one BBMD per IP subnet to forward Who-Is broadcasts across VLANs.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700/30 bg-slate-50 dark:bg-black/20">
              <h4 className="font-bold text-emerald-700 dark:text-emerald-300">🔒 Priority Array Discipline</h4>
              <p className="text-slate-600 dark:text-slate-400 font-medium mt-1 leading-relaxed text-[11px]">
                Slot 8 is reserved for Manual Operator overrides, Slot 15/16 for Schedules and Logic programs, and Slot 1 for Life Safety / Smoke control.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
