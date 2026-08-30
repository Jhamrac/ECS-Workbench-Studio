import React, { useState } from 'react';
import { NiagaraProgram } from '../types/niagara';
import {
  FileText,
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  Layers,
  Cpu,
  Workflow,
  Copy,
  Check,
} from 'lucide-react';
import { useNiagaraTheme } from '../context/NiagaraThemeContext';

interface LogicSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: NiagaraProgram;
}

export const LogicSummaryModal: React.FC<LogicSummaryModalProps> = ({
  isOpen,
  onClose,
  program,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Identify block categories
  const blocksList = program?.blocks || [];
  const linksList = program?.links || [];

  const inputs = blocksList.filter(
    (b) =>
      b.type.toLowerCase().includes('writable') ||
      b.type.toLowerCase().includes('point') ||
      (b.inputs || []).length <= 1
  );
  const logicAndControl = blocksList.filter(
    (b) =>
      b.type === 'LoopPoint' ||
      b.type === 'LeadLagCycle' ||
      b.type === 'Reset' ||
      b.type === 'And' ||
      b.type === 'Or' ||
      b.type === 'Not' ||
      b.type === 'Add' ||
      b.type === 'Subtract' ||
      b.type === 'BooleanSwitch' ||
      b.type === 'NumericSwitch' ||
      b.type === 'OneShot' ||
      b.type === 'BooleanDelay' ||
      b.type === 'MinOnHand'
  );
  const alarmsAndOutputs = blocksList.filter(
    (b) =>
      b.type.toLowerCase().includes('alarm') ||
      (b.outputs || []).some((o) => o.name?.toLowerCase().includes('cmd') || o.name?.toLowerCase().includes('out'))
  );

  const handleCopySummary = () => {
    const text = `=== NIAGARA 4 LOGIC SUMMARY: ${program?.title || 'Untitled'} ===
Category: ${program?.category || 'HVAC / Controls'}
Summary: ${program?.description || ''}

--- SEQUENCE OF OPERATION ---
${program?.sequenceOfOperation || ''}

--- ACTIVE WIRE SHEET BLOCKS (${blocksList.length} Total) ---
${blocksList.map((b) => `• [${b.type}] ${b.name} (${b.palette})`).join('\n')}

--- SIGNAL LINKS (${linksList.length} Wires) ---
${linksList.map((l) => `• ${l.fromBlockId}.${l.fromSlot} ➔ ${l.toBlockId}.${l.toSlot}`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="border border-slate-400 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] bg-white text-black">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-300 bg-slate-100 text-black">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-sky-600 text-white shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-black">Wire Sheet Logic Summary</h2>
                <span className="text-[10px] bg-sky-200 border border-sky-400 text-black font-black px-2 py-0.5 rounded-full">
                  {program.category || 'Controls Logic'}
                </span>
              </div>
              <p className="text-xs text-black font-bold">{program.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              title="Copy Summary to Clipboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black border border-slate-300 transition-all cursor-pointer bg-white hover:bg-slate-100 text-black"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-black" />}
              <span>{copied ? 'Copied!' : 'Copy Brief'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-black hover:bg-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5 text-sm text-black bg-white">
          {/* Executive Overview */}
          <div className="border border-sky-300 rounded-xl p-4 space-y-2 bg-sky-50 text-black">
            <div className="flex items-center gap-2 text-xs font-black text-black uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-sky-700 stroke-[2.5]" />
              <span className="text-black font-black">What This Logic Does</span>
            </div>
            <p className="leading-relaxed text-xs sm:text-sm text-black font-medium">{program.description}</p>
          </div>

          {/* Sequence of Operation Section */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
              <Workflow className="w-4 h-4 text-amber-700 stroke-[2.5]" />
              <span className="text-black font-black">How the Logic Works (Sequence of Operation)</span>
            </h3>
            <div className="border border-slate-300 rounded-xl p-4 text-xs sm:text-sm font-mono whitespace-pre-wrap leading-relaxed bg-slate-50 text-black font-medium">
              {program.sequenceOfOperation ||
                '1. Inputs and sensor signals enter through Writable points on the left.\n2. Conditionals, setpoint resets, and PID loops evaluate values.\n3. Output commands are modulated and dispatched to hardware actuators.'}
            </div>
          </div>

          {/* Architecture & Signal Flow Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-black">
            {/* 1. Inputs & Proofs */}
            <div className="border border-slate-300 rounded-lg p-3.5 space-y-2 bg-slate-50 text-black">
              <div className="flex items-center justify-between">
                <span className="font-black text-black uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-700 stroke-[2.5]" />
                  1. Inputs & Status
                </span>
                <span className="font-mono text-[10px] font-black text-black">{inputs.length} blocks</span>
              </div>
              <p className="text-[11px] text-black font-medium">
                Physical sensor inputs, priority array overrides (Pri 1-16), and setpoint requests.
              </p>
              <div className="space-y-1 pt-1 font-mono text-[10px]">
                {inputs.slice(0, 4).map((b) => (
                  <div key={b.id} className="truncate text-black font-bold">
                    • {b.name} <span className="text-black font-normal">({b.type})</span>
                  </div>
                ))}
                {inputs.length > 4 && <div className="text-black font-bold text-[9px]">+ {inputs.length - 4} more</div>}
              </div>
            </div>

            {/* 2. Control Loops & Math */}
            <div className="border border-slate-300 rounded-lg p-3.5 space-y-2 bg-slate-50 text-black">
              <div className="flex items-center justify-between">
                <span className="font-black text-black uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-amber-700 stroke-[2.5]" />
                  2. Decision & Control
                </span>
                <span className="font-mono text-[10px] font-black text-black">{logicAndControl.length} blocks</span>
              </div>
              <p className="text-[11px] text-black font-medium">
                PID LoopPoints, reset schedules, lead/lag alternation, delays, and logic gates.
              </p>
              <div className="space-y-1 pt-1 font-mono text-[10px]">
                {logicAndControl.slice(0, 4).map((b) => (
                  <div key={b.id} className="truncate text-black font-bold">
                    • {b.name} <span className="text-black font-normal">({b.type})</span>
                  </div>
                ))}
                {logicAndControl.length > 4 && <div className="text-black font-bold text-[9px]">+ {logicAndControl.length - 4} more</div>}
              </div>
            </div>

            {/* 3. Outputs & Alarms */}
            <div className="border border-slate-300 rounded-lg p-3.5 space-y-2 bg-slate-50 text-black">
              <div className="flex items-center justify-between">
                <span className="font-black text-black uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" />
                  3. Outputs & Safety
                </span>
                <span className="font-mono text-[10px] font-black text-black">{alarmsAndOutputs.length} blocks</span>
              </div>
              <p className="text-[11px] text-black font-medium">
                Actuator modulation, equipment start/stop relays, and latching fault alarms.
              </p>
              <div className="space-y-1 pt-1 font-mono text-[10px]">
                {alarmsAndOutputs.slice(0, 4).map((b) => (
                  <div key={b.id} className="truncate text-black font-bold">
                    • {b.name} <span className="text-black font-normal">({b.type})</span>
                  </div>
                ))}
                {alarmsAndOutputs.length > 4 && <div className="text-black font-bold text-[9px]">+ {alarmsAndOutputs.length - 4} more</div>}
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="border border-slate-300 rounded-lg px-4 py-2.5 flex items-center justify-between text-xs font-mono bg-slate-100 text-black font-bold">
            <div className="flex items-center gap-4">
              <span>
                Blocks: <strong className="text-black font-black">{program.blocks.length}</strong>
              </span>
              <span>
                Wires/Links: <strong className="text-black font-black">{program.links.length}</strong>
              </span>
              <span>
                Workbench Steps: <strong className="text-black font-black">{program.rebuildSteps.length}</strong>
              </span>
            </div>
            <span className="text-[11px] text-black font-bold">Ready for Niagara Workbench N4/AX</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-300 bg-slate-100 flex items-center justify-between">
          <span className="text-xs text-black font-bold">
            Use the <strong>Workbench Build Guide</strong> tab for step-by-step block replication.
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-600 text-white font-black text-xs shadow-md transition-colors cursor-pointer"
          >
            Close Summary
          </button>
        </div>
      </div>
    </div>
  );
};
