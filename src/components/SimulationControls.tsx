import React, { useRef, useState, useEffect } from 'react';
import { NiagaraBlock, NiagaraBlockStatus } from '../types/niagara';
import { InjectedFault } from '../utils/simulationEngine';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Activity,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Maximize2,
  X,
  Zap,
  Thermometer,
  Bookmark,
  TrendingUp,
  Snowflake,
  Flame,
  Moon,
  Save,
  Trash2,
  Check,
  AlertTriangle,
  FastForward,
  GripHorizontal,
} from 'lucide-react';
import { useNiagaraTheme } from '../context/NiagaraThemeContext';

export interface SimPreset {
  id: string;
  name: string;
  category: 'HVAC' | 'Emergency' | 'Custom';
  description: string;
  overrides: Record<string, Record<string, any>>;
}

interface SimulationControlsProps {
  isSimulating: boolean;
  onToggleSimulate: () => void;
  onResetSimulation: () => void;
  simSpeed: number;
  onChangeSpeed: (speed: number) => void;
  onStepTick: () => void;
  enableThermalDynamics: boolean;
  onToggleThermalDynamics: () => void;
  injectedFaults: InjectedFault[];
  onToggleFault: (faultId: string) => void;
  onClearFaults: () => void;
  onApplyPreset: (overrides: Record<string, Record<string, any>>) => void;
  blocks: NiagaraBlock[];
  liveValues: Record<string, Record<string, any>>;
  liveStatuses: Record<string, NiagaraBlockStatus>;
  simulationOverrides: Record<string, Record<string, any>>;
  onValueChange: (blockId: string, slotName: string, newValue: any) => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isSimulating,
  onToggleSimulate,
  onResetSimulation,
  simSpeed,
  onChangeSpeed,
  onStepTick,
  enableThermalDynamics,
  onToggleThermalDynamics,
  injectedFaults,
  onToggleFault,
  onClearFaults,
  onApplyPreset,
  onOpenOscilloscope,
  blocks,
  liveValues,
  liveStatuses,
  simulationOverrides,
  onValueChange,
}) => {
  const { theme, isDark } = useNiagaraTheme();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Collapsible & Dynamic Resizable Bar State
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640;
    }
    return false;
  });
  const [dockHeight, setDockHeight] = useState(145);
  const [isResizing, setIsResizing] = useState(false);

  // Modals state
  const [isExpandedInputsOpen, setIsExpandedInputsOpen] = useState(false);
  const [isFaultModalOpen, setIsFaultModalOpen] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);

  // Custom user presets stored in localStorage
  const [userPresets, setUserPresets] = useState<SimPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');

  // Handle vertical resize dragging
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = window.innerHeight - e.clientY;
      setDockHeight(Math.max(100, Math.min(480, newHeight)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('niagara_sim_user_presets');
      if (saved) {
        setUserPresets(JSON.parse(saved));
      }
    } catch {
      // ignore JSON parse errors
    }
  }, []);

  const saveUserPreset = () => {
    if (!newPresetName.trim()) return;
    const preset: SimPreset = {
      id: `custom_${Date.now()}`,
      name: newPresetName.trim(),
      category: 'Custom',
      description: 'Saved custom simulation test scenario',
      overrides: JSON.parse(JSON.stringify(simulationOverrides)),
    };
    const updated = [preset, ...userPresets];
    setUserPresets(updated);
    localStorage.setItem('niagara_sim_user_presets', JSON.stringify(updated));
    setNewPresetName('');
  };

  const deleteUserPreset = (id: string) => {
    const updated = userPresets.filter((p) => p.id !== id);
    setUserPresets(updated);
    localStorage.setItem('niagara_sim_user_presets', JSON.stringify(updated));
  };

  // Dynamic HVAC & Generic Wire Sheet Test Presets
  const getBuiltInPresets = (): SimPreset[] => {
    const summerOverrides: Record<string, Record<string, any>> = {};
    const winterOverrides: Record<string, Record<string, any>> = {};
    const nightOverrides: Record<string, Record<string, any>> = {};
    const emergencyOverrides: Record<string, Record<string, any>> = {};

    blocks.forEach((b) => {
      const n = b.name.toLowerCase();
      const t = b.type.toLowerCase();

      // Check specific domain block names first
      if (n.includes('oat') || n.includes('outdoor')) {
        summerOverrides[b.id] = { out: 95.0, in: 95.0, in10: 95.0 };
        winterOverrides[b.id] = { out: 15.0, in: 15.0, in10: 15.0 };
        nightOverrides[b.id] = { out: 55.0, in: 55.0, in10: 55.0 };
      } else if (n.includes('space') || n.includes('zone') || n.includes('room')) {
        summerOverrides[b.id] = { out: 78.0, in: 78.0, in10: 78.0 };
        winterOverrides[b.id] = { out: 62.0, in: 62.0, in10: 62.0 };
        nightOverrides[b.id] = { out: 66.0, in: 66.0, in10: 66.0 };
      } else if (n.includes('occ') || n.includes('sched')) {
        summerOverrides[b.id] = { out: true, override: true };
        winterOverrides[b.id] = { out: true, override: true };
        nightOverrides[b.id] = { out: false, override: false };
      } else if (n.includes('freeze') || n.includes('safety') || n.includes('stat') || n.includes('trip')) {
        emergencyOverrides[b.id] = { out: true, in: true, in1: true, alarm: true };
      } else if (n.includes('proof') || n.includes('dp') || n.includes('status')) {
        summerOverrides[b.id] = { out: true, in: true, fallback: true };
        winterOverrides[b.id] = { out: true, in: true, fallback: true };
        nightOverrides[b.id] = { out: false, in: false, fallback: false };
        emergencyOverrides[b.id] = { out: false, in: false, fallback: false };
      } else {
        // Universal fallback logic across ALL blocks on any wire sheet!
        if (t.includes('boolean') || b.inputs.some((i) => i.name.includes('bool'))) {
          summerOverrides[b.id] = { out: true, in: true, fallback: true, in10: true };
          winterOverrides[b.id] = { out: true, in: true, fallback: true, in10: true };
          nightOverrides[b.id] = { out: false, in: false, fallback: false, in10: false };
        } else if (t.includes('numeric') || t.includes('const') || t.includes('point')) {
          summerOverrides[b.id] = { out: 85.0, in: 85.0, fallback: 85.0, in10: 85.0 };
          winterOverrides[b.id] = { out: 30.0, in: 30.0, fallback: 30.0, in10: 30.0 };
          nightOverrides[b.id] = { out: 55.0, in: 55.0, fallback: 55.0, in10: 55.0 };
        }
      }
    });

    return [
      {
        id: 'preset_summer',
        name: '☀️ High Load / Cooling Demand',
        category: 'HVAC',
        description: 'Applies peak summer load, active operational demand & max setpoints across all wire sheet blocks',
        overrides: summerOverrides,
      },
      {
        id: 'preset_winter',
        name: '❄️ Low Ambient / Heating Demand',
        category: 'HVAC',
        description: 'Applies winter freeze temperatures, heating setpoints & low load profiles',
        overrides: winterOverrides,
      },
      {
        id: 'preset_night',
        name: '🌙 Night Setback / Standby',
        category: 'HVAC',
        description: 'Sets schedule & command points to unoccupied setback mode across the station',
        overrides: nightOverrides,
      },
      {
        id: 'preset_emergency',
        name: '🔥 Emergency Alarm & Safety Trip',
        category: 'Emergency',
        description: 'Trips safety switches & forces status inputs to false to test station alarm & lead-lag failovers',
        overrides: emergencyOverrides,
      },
    ];
  };

  const inputBlocks = blocks.filter(
    (b) =>
      b.type.includes('Writable') ||
      b.type.includes('Point') ||
      b.type === 'BooleanSchedule' ||
      b.inputs.some((inp) => inp.name.includes('in') || inp.name === 'fallback')
  );

  const activeFaultsCount = injectedFaults.filter((f) => f.active).length;

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 260;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Render Collapsed Strip
  if (isCollapsed) {
    return (
      <div
        id="niagara-simulation-dock-collapsed"
        className={`border-t shadow-2xl px-3 py-1.5 select-none z-20 flex items-center justify-between transition-all w-full shrink-0 ${
          isDark
            ? 'bg-[#0b101d] border-slate-800 text-slate-200'
            : 'bg-[#f1f5f9] border-[#cbd5e1] text-slate-800'
        }`}
      >
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-mono font-bold shrink-0">
            <Activity className={`w-3.5 h-3.5 ${isSimulating ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
            <span>{isSimulating ? `SIM (${simSpeed}x)` : 'STANDBY'}</span>
          </div>

          <button
            onClick={onToggleSimulate}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer shrink-0 ${
              isSimulating ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
          >
            {isSimulating ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
            <span>{isSimulating ? 'Pause' : 'Run'}</span>
          </button>

          <button
            onClick={onStepTick}
            className={`flex items-center gap-1 border px-2 py-1 rounded-md text-xs cursor-pointer font-semibold shrink-0 ${
              isDark ? 'bg-slate-800 border-slate-700 text-sky-400' : 'bg-white border-slate-300 text-sky-600'
            }`}
          >
            <FastForward className="w-3 h-3" />
            <span>Step</span>
          </button>

          {activeFaultsCount > 0 && (
            <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shrink-0">
              {activeFaultsCount} Active Fault{activeFaultsCount > 1 ? 's' : ''}
            </span>
          )}

          {Object.keys(simulationOverrides).length > 0 && (
            <span className="bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0">
              {Object.keys(simulationOverrides).length} Block Overrides
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <button
            onClick={() => setIsPresetModalOpen(true)}
            className={`flex items-center gap-1 border px-2 py-1 rounded-md text-xs font-semibold cursor-pointer ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-400' : 'bg-white hover:bg-slate-100 border-slate-300 text-amber-600'
            }`}
          >
            <Bookmark className="w-3 h-3" />
            <span>Presets</span>
          </button>

          <button
            onClick={() => setIsCollapsed(false)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs font-bold cursor-pointer transition-all ${
              isDark ? 'bg-sky-950 hover:bg-sky-900 border-sky-700 text-sky-300' : 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-700'
            }`}
            title="Expand Simulator Bar"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span>Expand Bar</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        id="niagara-simulation-dock"
        className={`border-t shadow-2xl select-none z-20 transition-colors w-full flex flex-col relative shrink-0 ${
          isDark
            ? 'bg-[#0b101d] border-slate-800 text-slate-200'
            : 'bg-[#f1f5f9] border-[#cbd5e1] text-slate-800'
        }`}
        style={{ height: `${dockHeight}px` }}
      >
        {/* Top Resize Drag Handle */}
        <div
          onMouseDown={handleMouseDownResize}
          title="Drag up/down to resize simulator dock height"
          className={`h-2.5 w-full flex items-center justify-center cursor-ns-resize group border-b transition-colors shrink-0 ${
            isResizing
              ? 'bg-sky-500/30 border-sky-500'
              : isDark
              ? 'bg-slate-900/90 hover:bg-sky-950/50 border-slate-800'
              : 'bg-slate-200/90 hover:bg-sky-100/60 border-slate-300'
          }`}
        >
          <div className="w-12 h-1 rounded-full bg-slate-500/40 group-hover:bg-sky-400 transition-colors" />
        </div>

        {/* Bar Content */}
        <div className="flex-1 overflow-y-auto p-2.5 flex flex-col justify-between">
        <div className="w-full flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 px-1">
          {/* Left: Sim Engine Status & Playback Speed Controls */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Engine Status Badge */}
            <div
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-mono shrink-0 ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-200'
                  : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              <Activity
                className={`w-3.5 h-3.5 ${
                  isSimulating ? 'text-emerald-500 animate-pulse' : 'text-slate-400'
                }`}
              />
              <span className="font-bold text-[11px] block leading-tight">
                {isSimulating ? `SIM ACTIVE (${simSpeed}x)` : 'ENGINE STANDBY'}
              </span>
            </div>

            {/* Run / Pause */}
            <button
              id="sim-bottom-toggle-btn"
              onClick={onToggleSimulate}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0 ${
                isSimulating
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              {isSimulating ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run</span>
                </>
              )}
            </button>

            {/* Single-Step Tick Button */}
            <button
              onClick={onStepTick}
              title="Advance simulation by 1 step tick"
              className={`flex items-center gap-1 border px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer font-semibold shrink-0 ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-sky-400'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-sky-600'
              }`}
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Step</span>
            </button>

            {/* Speed Multiplier Pills */}
            <div
              className={`flex items-center p-0.5 rounded-lg border text-[11px] font-bold font-mono shrink-0 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-200 border-slate-300'
              }`}
            >
              {[1, 5, 10, 60].map((s) => (
                <button
                  key={s}
                  onClick={() => onChangeSpeed(s)}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                    simSpeed === s
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-xs'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Thermal Physics Feedback Loop Toggle */}
            <button
              onClick={onToggleThermalDynamics}
              title="Toggle dynamic thermal physics feedback loop (AHU/Zone drift)"
              className={`flex items-center gap-1.5 border px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer font-semibold shrink-0 ${
                enableThermalDynamics
                  ? 'bg-emerald-950/80 border-emerald-600/60 text-emerald-400'
                  : isDark
                  ? 'bg-slate-800/80 border-slate-700 text-slate-400'
                  : 'bg-white border-slate-300 text-slate-500'
              }`}
            >
              <Thermometer className="w-3.5 h-3.5" />
              <span>Physics: {enableThermalDynamics ? 'ON' : 'OFF'}</span>
            </button>

            {/* Fault Injection Workbench Button */}
            <button
              onClick={() => setIsFaultModalOpen(true)}
              className={`flex items-center gap-1.5 border px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer font-semibold shrink-0 ${
                activeFaultsCount > 0
                  ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                  : isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-rose-400'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-rose-600'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Faults ({activeFaultsCount})</span>
            </button>

            {/* Presets Scenario Button */}
            <button
              onClick={() => setIsPresetModalOpen(true)}
              className={`flex items-center gap-1.5 border px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer font-semibold shrink-0 ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-400'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-amber-600'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Presets</span>
            </button>

            {/* Reset Overrides */}
            <button
              id="sim-bottom-reset-btn"
              onClick={onResetSimulation}
              title="Reset simulation overrides to default"
              className={`flex items-center gap-1 border px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer font-semibold shrink-0 ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

          {/* Right: Live Inputs Scrollable Bar & Collapse Button */}
          <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0 relative">
            <span className="text-[10px] font-bold uppercase tracking-wider shrink-0 opacity-75 flex items-center gap-1 mr-1">
              <Sliders className="w-3 h-3 text-amber-500" />
              <span className="hidden sm:inline">Inputs:</span>
            </span>

            {inputBlocks.length > 3 && (
              <button
                type="button"
                onClick={() => handleScroll('left')}
                title="Scroll inputs left"
                className={`p-1 rounded-md border shrink-0 cursor-pointer shadow-xs transition-colors ${
                  isDark
                    ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                    : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}

            <div
              ref={scrollContainerRef}
              className="flex-1 flex items-center gap-2 overflow-x-auto py-1 px-1 scroll-smooth scrollbar-thin scrollbar-thumb-slate-600/40"
              style={{ scrollbarWidth: 'thin' }}
            >
              {inputBlocks.length === 0 ? (
                <span className="text-[11px] italic opacity-60 font-mono">
                  No writable input points on wire sheet
                </span>
              ) : (
                inputBlocks.map((block) => {
                  const isBool =
                    block.type.includes('Boolean') || block.type === 'BooleanSchedule';
                  const primarySlot =
                    block.inputs.find(
                      (i) => i.name === 'in' || i.name === 'in10' || i.name === 'fallback'
                    ) || block.inputs[0];
                  const liveVal = liveValues[block.id]?.[primarySlot?.name || 'out'];

                  return (
                    <div
                      key={block.id}
                      className={`flex items-center gap-2 border px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                        isDark
                          ? 'bg-slate-900/95 border-slate-700 hover:border-slate-600'
                          : 'bg-white border-slate-300 hover:border-slate-400 shadow-xs'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 max-w-[100px]">
                        <span
                          className="font-bold text-[11px] truncate"
                          title={`${block.name} (${block.type})`}
                        >
                          {block.name}
                        </span>
                        <span className="text-[9px] opacity-65 truncate font-mono">
                          {primarySlot?.name || 'out'}
                        </span>
                      </div>

                      {isBool ? (
                        <button
                          onClick={() =>
                            onValueChange(
                              block.id,
                              primarySlot?.name || 'out',
                              liveVal === true ? false : true
                            )
                          }
                          title="Toggle live Boolean state"
                          className="p-0.5 rounded cursor-pointer"
                        >
                          {liveVal === true ? (
                            <ToggleRight className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                      ) : (
                        <input
                          type="number"
                          step="1"
                          value={
                            liveVal !== undefined && liveVal !== null ? liveVal : ''
                          }
                          onChange={(e) =>
                            onValueChange(
                              block.id,
                              primarySlot?.name || 'out',
                              e.target.value === '' ? null : parseFloat(e.target.value)
                            )
                          }
                          className={`w-14 px-1.5 py-0.5 text-right rounded border font-mono text-[11px] outline-none ${
                            isDark
                              ? 'bg-slate-950 border-slate-700 text-sky-400 focus:border-amber-500'
                              : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                          }`}
                          placeholder="0"
                        />
                      )}
                    </div>
                  );
                })
              )}
              <div className="w-4 shrink-0" />
            </div>

            {inputBlocks.length > 3 && (
              <button
                type="button"
                onClick={() => handleScroll('right')}
                title="Scroll inputs right"
                className={`p-1 rounded-md border shrink-0 cursor-pointer shadow-xs transition-colors ${
                  isDark
                    ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                    : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                }`}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {inputBlocks.length > 4 && (
              <button
                type="button"
                onClick={() => setIsExpandedInputsOpen(true)}
                title={`View all ${inputBlocks.length} inputs in grid`}
                className={`flex items-center gap-1 border px-2 py-1 rounded-md text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-amber-400'
                    : 'bg-white hover:bg-slate-100 border-slate-300 text-amber-600'
                }`}
              >
                <Maximize2 className="w-3 h-3" />
                <span>All ({inputBlocks.length})</span>
              </button>
            )}

            {/* Collapse Dock Button */}
            <button
              onClick={() => setIsCollapsed(true)}
              title="Collapse Simulator Bar"
              className={`p-1.5 rounded-lg border shrink-0 cursor-pointer transition-colors ml-1 ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-500 hover:text-slate-800'
              }`}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* --- FAULT INJECTION WORKBENCH MODAL --- */}
      {isFaultModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
          <div
            className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${
              isDark
                ? 'bg-[#0c1327] border-slate-700 text-slate-100'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="p-4 border-b flex items-center justify-between bg-rose-950 text-rose-100 border-rose-800">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold">
                  Field Fault Injection & Emergency Breakout Workbench
                </h3>
              </div>
              <button
                onClick={() => setIsFaultModalOpen(false)}
                className="p-1 rounded hover:bg-white/15 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              <p className="text-xs text-slate-400 mb-2">
                Simulate critical field hardware failures, emergency safety trips, and sensor defects to verify system responses:
              </p>

              {injectedFaults.map((fault) => (
                <div
                  key={fault.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    fault.active
                      ? 'bg-rose-950/40 border-rose-600/80'
                      : isDark
                      ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      className={`w-5 h-5 mt-0.5 ${
                        fault.active ? 'text-rose-400 animate-pulse' : 'text-slate-500'
                      }`}
                    />
                    <div>
                      <h4 className="text-xs font-bold">{fault.name}</h4>
                      <p className="text-[11px] opacity-75">{fault.description}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleFault(fault.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      fault.active
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
                        : isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                    }`}
                  >
                    {fault.active ? 'INJECTED' : 'Inject'}
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 border-t flex justify-between items-center bg-slate-950/40">
              <button
                onClick={onClearFaults}
                className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                Clear All Faults
              </button>
              <button
                onClick={() => setIsFaultModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PRESET TEST SCENARIOS MODAL --- */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
          <div
            className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${
              isDark
                ? 'bg-[#0c1327] border-slate-700 text-slate-100'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="p-4 border-b flex items-center justify-between bg-amber-950 text-amber-100 border-amber-800">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold">Preset Simulation Test Scenarios</h3>
              </div>
              <button
                onClick={() => setIsPresetModalOpen(false)}
                className="p-1 rounded hover:bg-white/15 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
              {/* Built-in Presets */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-500 mb-2">
                  Built-in System Scenarios
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {getBuiltInPresets().map((preset) => (
                    <div
                      key={preset.id}
                      className={`p-3 rounded-xl border flex flex-col justify-between gap-2 transition-all ${
                        isDark
                          ? 'bg-slate-900/80 border-slate-800 hover:border-amber-600/50'
                          : 'bg-slate-50 border-slate-200 hover:border-amber-500'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-xs block">{preset.name}</span>
                        <span className="text-[10px] opacity-75 block mt-0.5">
                          {preset.description}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          onApplyPreset(preset.overrides);
                          setIsPresetModalOpen(false);
                        }}
                        className="w-full py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Apply Scenario
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Saved Custom Presets */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-sky-400 mb-2">
                  Saved Custom Test Profiles ({userPresets.length})
                </h4>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="Enter profile name (e.g., Summer Weekend Chill)..."
                    className={`flex-1 px-3 py-1.5 rounded-lg border text-xs outline-none ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-amber-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                    }`}
                  />
                  <button
                    onClick={saveUserPreset}
                    disabled={!newPresetName.trim()}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Current</span>
                  </button>
                </div>

                {userPresets.length === 0 ? (
                  <p className="text-xs italic opacity-50 font-mono">
                    No custom user presets saved yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {userPresets.map((preset) => (
                      <div
                        key={preset.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                          isDark
                            ? 'bg-slate-900/60 border-slate-800'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div>
                          <span className="font-bold text-xs block">{preset.name}</span>
                          <span className="text-[10px] opacity-60">Custom Profile</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              onApplyPreset(preset.overrides);
                              setIsPresetModalOpen(false);
                            }}
                            className="px-2.5 py-1 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Apply
                          </button>
                          <button
                            onClick={() => deleteUserPreset(preset.id)}
                            className="p-1 rounded-md hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 border-t flex justify-end bg-slate-950/40">
              <button
                onClick={() => setIsPresetModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EXPAND ALL INPUTS GRID MODAL --- */}
      {isExpandedInputsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
          <div
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${
              isDark
                ? 'bg-[#0c1327] border-slate-700 text-slate-100'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="p-4 border-b flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold">
                  All Wire Sheet Live Inputs ({inputBlocks.length})
                </h3>
              </div>
              <button
                onClick={() => setIsExpandedInputsOpen(false)}
                className="p-1 rounded hover:bg-white/15 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
              {inputBlocks.map((block) => {
                const isBool =
                  block.type.includes('Boolean') || block.type === 'BooleanSchedule';
                const primarySlot =
                  block.inputs.find(
                    (i) => i.name === 'in' || i.name === 'in10' || i.name === 'fallback'
                  ) || block.inputs[0];
                const liveVal = liveValues[block.id]?.[primarySlot?.name || 'out'];

                return (
                  <div
                    key={block.id}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      isDark
                        ? 'bg-slate-900/80 border-slate-800'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs block">{block.name}</span>
                      <span className="text-[10px] font-mono opacity-70">
                        {block.type} • {primarySlot?.name || 'out'}
                      </span>
                    </div>

                    {isBool ? (
                      <button
                        onClick={() =>
                          onValueChange(
                            block.id,
                            primarySlot?.name || 'out',
                            liveVal === true ? false : true
                          )
                        }
                        className="cursor-pointer"
                      >
                        {liveVal === true ? (
                          <ToggleRight className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-slate-400" />
                        )}
                      </button>
                    ) : (
                      <input
                        type="number"
                        step="1"
                        value={
                          liveVal !== undefined && liveVal !== null ? liveVal : ''
                        }
                        onChange={(e) =>
                          onValueChange(
                            block.id,
                            primarySlot?.name || 'out',
                            e.target.value === '' ? null : parseFloat(e.target.value)
                          )
                        }
                        className={`w-20 px-2 py-1 text-right rounded border font-mono text-xs outline-none ${
                          isDark
                            ? 'bg-slate-950 border-slate-700 text-sky-400 focus:border-amber-500'
                            : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                        }`}
                        placeholder="0"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t flex justify-end bg-slate-950/40">
              <button
                onClick={() => setIsExpandedInputsOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
