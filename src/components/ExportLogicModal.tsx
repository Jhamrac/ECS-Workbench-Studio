import React from 'react';
import { NiagaraProgram } from '../types/niagara';
import { X, FileCode, FileText, Download, Sparkles } from 'lucide-react';
import { useNiagaraTheme } from '../context/NiagaraThemeContext';

interface ExportLogicModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: NiagaraProgram;
  onExportXml: () => void;
  onExportGuide: () => void;
  onExportJson: () => void;
}

export const ExportLogicModal: React.FC<ExportLogicModalProps> = ({
  isOpen,
  onClose,
  program,
  onExportXml,
  onExportGuide,
  onExportJson,
}) => {
  const { theme, isDark } = useNiagaraTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div
        className={`border rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] transition-colors ${
          isDark
            ? 'bg-[#0f172a] border-slate-700 text-slate-100'
            : 'bg-white border-slate-300 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/20 text-sky-500 border border-sky-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                Export Station Wire Sheet
              </h2>
              <span className="text-xs opacity-75 font-mono">
                {program.title || 'Custom Logic Sequence'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-black/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Form/Body */}
        <div className="p-5 space-y-4 text-xs">
          <p className="text-slate-400 leading-relaxed text-xs">
            Export the current active canvas configuration into direct integration file formats or clean diagnostic documentation. Select your preferred target structure below:
          </p>

          <div className="space-y-2.5">
            {/* Niagara Bog XML */}
            <button
              onClick={() => {
                onExportXml();
                onClose();
              }}
              className={`w-full text-left p-3.5 rounded-xl border transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-start gap-3.5 ${
                isDark
                  ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mt-0.5 shrink-0">
                <FileCode className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>Niagara Bog XML</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    N4 Import
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Generates an XML representation fully structured as standard Niagara Components (slots, properties, link declarations).
                </p>
              </div>
            </button>

            {/* Printable PDF/HTML Manual */}
            <button
              onClick={() => {
                onExportGuide();
                onClose();
              }}
              className={`w-full text-left p-3.5 rounded-xl border transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-start gap-3.5 ${
                isDark
                  ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 mt-0.5 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>Printable Build Manual</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-sky-950 text-sky-300 border border-sky-800">
                    HTML / PDF
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Generates a highly-detailed sequence handbook including block connection points, logic parameters, and commissioning steps.
                </p>
              </div>
            </button>

            {/* JSON Backup */}
            <button
              onClick={() => {
                onExportJson();
                onClose();
              }}
              className={`w-full text-left p-3.5 rounded-xl border transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-start gap-3.5 ${
                isDark
                  ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 mt-0.5 shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>Logic Studio JSON Backup</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                    Raw Backup
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Downloads a complete serializable JSON blueprint of blocks, links, coordinates, and priority array overrides.
                </p>
              </div>
            </button>
          </div>

          <div className="pt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-1.5 rounded-lg font-semibold cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
