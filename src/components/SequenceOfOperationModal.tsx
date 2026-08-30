import React, { useState } from 'react';
import { NiagaraProgram } from '../types/niagara';
import { FileCode, Copy, Check, X, Printer, Sparkles } from 'lucide-react';

interface SequenceOfOperationModalProps {
  program: NiagaraProgram;
  isOpen: boolean;
  onClose: () => void;
}

export const SequenceOfOperationModal: React.FC<SequenceOfOperationModalProps> = ({
  program,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(program.sequenceOfOperation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-950 text-slate-100 p-6 space-y-6 select-text">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  Sequence of Operation (SOO) Specification
                </h1>
                <span className="text-xs text-slate-400">
                  {program.title} • Engineering Submittal Narrative
                </span>
              </div>
            </div>

            <button
              id="copy-soo-btn"
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Narrative</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
            {program.sequenceOfOperation}
          </div>

          <div className="bg-slate-850 border border-slate-750 rounded-lg p-4 text-xs text-slate-400 space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              HVAC Controls Engineering Note:
            </h4>
            <p>
              This Sequence of Operation matches the logic programmed on the Niagara Wire Sheet. All priority arrays, timers, deadbands, and safety freeze stats are configured in accordance with ASHRAE Guideline 36 standard control sequences.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
