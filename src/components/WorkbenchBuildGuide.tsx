import React, { useState } from 'react';
import { NiagaraProgram, NiagaraRebuildStep, NiagaraLink } from '../types/niagara';
import {
  CheckSquare,
  Square,
  BookOpen,
  Layers,
  ArrowRight,
  Copy,
  Check,
  Printer,
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  Download,
  CheckCircle2,
  Info,
  X,
  Sliders,
  Terminal,
} from 'lucide-react';
import { useNiagaraTheme } from '../context/NiagaraThemeContext';

interface WorkbenchBuildGuideProps {
  program: NiagaraProgram;
  onToggleStep: (stepNumber: number) => void;
  onExportGuide: () => void;
  onExportXml: () => void;
}

export const WorkbenchBuildGuide: React.FC<WorkbenchBuildGuideProps> = ({
  program,
  onToggleStep,
  onExportGuide,
  onExportXml,
}) => {
  const { theme, isDark } = useNiagaraTheme();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [sooCopied, setSooCopied] = useState(false);
  const [linkSearchTerm, setLinkSearchTerm] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [inspectingStep, setInspectingStep] = useState<NiagaraRebuildStep | null>(null);
  const [completedChecklist, setCompletedChecklist] = useState<Record<number, boolean>>({});

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copySoo = () => {
    navigator.clipboard.writeText(program.sequenceOfOperation);
    setSooCopied(true);
    setTimeout(() => setSooCopied(false), 2000);
  };

  const defaultChecklist = [
    'Verify 24VAC control transformer voltage & chassis ground bonding.',
    'Confirm ECS Workbench Studio / Edge Controller IP configuration & Station License.',
    'Inspect RS-485 MS/TP BACnet communication loop termination and polarity.',
    'Test physical Digital Input dry-contacts & Analog Input sensor resistance.',
    'Verify emergency hardwired freeze-stat and high-static safety cutouts.',
    'Perform point-by-point Hand-Off-Auto (HOA) override test on all Digital Outputs.',
    'Validate PID Loop gain constants (Kp, Ti, Td) under varying HVAC thermal loads.',
    'Verify alarm threshold notifications & email/SMS routing in Alarm Service.',
    'Confirm Trend Log data collection interval and history database retention.',
  ];

  const activeChecklist = program.commissioningChecklist && program.commissioningChecklist.length > 0
    ? program.commissioningChecklist
    : defaultChecklist;

  const toggleChecklistItem = (idx: number) => {
    setCompletedChecklist((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const phases = ['all', 'palette', 'blocks', 'facets', 'links', 'testing'];
  const rebuildStepsList = program?.rebuildSteps || [];
  const linksList = program?.links || [];
  const blocksList = program?.blocks || [];

  const filteredSteps = rebuildStepsList.filter((step) => {
    if (selectedPhase === 'all') return true;
    return step.phase === selectedPhase;
  });

  const completedCount = rebuildStepsList.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / (rebuildStepsList.length || 1)) * 100);

  const filteredLinks = linksList.filter((link) => {
    const sourceBlock = blocksList.find((b) => b.id === link.fromBlockId);
    const targetBlock = blocksList.find((b) => b.id === link.toBlockId);
    const sourceName = sourceBlock ? sourceBlock.name : link.fromBlockId;
    const targetName = targetBlock ? targetBlock.name : link.toBlockId;

    const term = linkSearchTerm.toLowerCase();
    return (
      sourceName.toLowerCase().includes(term) ||
      targetName.toLowerCase().includes(term) ||
      (link.fromSlot || '').toLowerCase().includes(term) ||
      (link.toSlot || '').toLowerCase().includes(term)
    );
  });

  return (
    <div
      id="workbench-build-guide-container"
      className={`flex-1 h-full overflow-y-auto p-4 sm:p-6 space-y-6 select-text transition-colors ${
        isDark ? 'bg-[#080d19] text-slate-100' : 'bg-[#eef2f6] text-slate-900'
      }`}
    >
      {/* Header & Progress Tracker */}
      <div className="max-w-5xl mx-auto space-y-6">
        <div
          className={`border rounded-xl p-5 sm:p-6 shadow-xl relative overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold bg-[#00529b] text-white border border-sky-400/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  In-App Niagara 4 Workbench Build Guide
                </span>
                <span className={`text-xs font-mono font-bold ${isDark ? 'text-slate-300' : 'text-slate-950'}`}>
                  {program.category || 'HVAC / BMS Automation'}
                </span>
              </div>
              <h1 className={`text-xl md:text-2xl font-black ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>
                {program.title}
              </h1>
              <p className={`text-xs sm:text-sm max-w-3xl leading-relaxed font-semibold ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>
                {program.description} — View and complete all step-by-step instructions, property sheet parameters, and wire interconnect tables directly inside the app below.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                id="export-guide-print-btn"
                onClick={onExportGuide}
                className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                }`}
                title="Export or Print HTML Guide"
              >
                <Printer className="w-4 h-4 text-amber-500" />
                <span>Export HTML</span>
              </button>
              <button
                id="export-xml-btn"
                onClick={onExportXml}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold shadow transition-colors cursor-pointer"
                title="Download ECS Workbench Studio Bog XML File"
              >
                <Download className="w-4 h-4" />
                <span>Niagara XML</span>
              </button>
            </div>
          </div>

          {/* Rebuild Progress Bar */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                In-App Manual Build Completion:
              </span>
              <span className={`font-bold font-mono ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                {completedCount} / {program.rebuildSteps.length} Steps ({progressPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Section 1: Sequence of Operation (SOO) Narrative */}
        <div
          id="workbench-soo-container"
          className={`border rounded-xl p-5 shadow-xl space-y-3 ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between gap-3 border-b pb-3 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className={`text-base font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>1. Sequence of Operation (SOO)</h2>
            </div>
            <button
              onClick={copySoo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer shadow-sm"
              title="Copy Sequence of Operation"
            >
              {sooCopied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied SOO</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy SOO Text</span>
                </>
              )}
            </button>
          </div>

          <div className={`text-xs sm:text-sm leading-relaxed font-sans font-semibold whitespace-pre-line p-4 rounded-xl border shadow-inner ${isDark ? 'text-slate-100 bg-slate-950/80 border-slate-800' : 'text-slate-950 bg-slate-50 border-slate-300'}`}>
            {program.sequenceOfOperation || 'No custom Sequence of Operation specified for this Niagara wire sheet.'}
          </div>
        </div>

        {/* Phase Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className={`font-black shrink-0 ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>Filter Phase:</span>
          {phases.map((phase) => (
            <button
              key={phase}
              onClick={() => setSelectedPhase(phase)}
              className={`px-3 py-1.5 rounded-lg uppercase tracking-wider font-extrabold transition-colors cursor-pointer shrink-0 ${
                selectedPhase === phase
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : isDark
                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  : 'bg-white text-slate-950 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              {phase}
            </button>
          ))}
        </div>

        {/* Rebuild Steps Cards */}
        <div className="space-y-4">
          <div className={`text-xs font-black uppercase tracking-wider px-1 ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>
            2. Step-by-Step Workbench Build Instructions ({filteredSteps.length} Steps)
          </div>
          {filteredSteps.map((step) => (
            <div
              key={step.stepNumber}
              onClick={() => setInspectingStep(step)}
              className={`border rounded-xl p-4 sm:p-5 transition-all cursor-pointer shadow-sm group ${
                step.completed
                  ? isDark
                    ? 'bg-emerald-950/30 border-emerald-700/80'
                    : 'bg-emerald-50 border-emerald-400'
                  : isDark
                  ? 'bg-slate-900 border-slate-700 hover:border-amber-500/60'
                  : 'bg-white border-slate-300 hover:border-amber-500/80'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStep(step.stepNumber);
                  }}
                  className="mt-0.5 text-amber-500 hover:text-amber-400 shrink-0 cursor-pointer p-1"
                  title="Toggle Step Completion"
                >
                  {step.completed ? (
                    <CheckSquare className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                  )}
                </button>

                <div className="flex-1 space-y-2.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-[#00529b] text-white font-bold text-xs px-2.5 py-0.5 rounded-md shadow-xs">
                      Step {step.stepNumber}
                    </span>
                    <span className={`font-mono font-black text-xs uppercase ${isDark ? 'text-sky-400' : 'text-[#00529b]'}`}>
                      [Phase: {step.phase}]
                    </span>
                    <h3 className={`font-extrabold text-sm sm:text-base group-hover:text-amber-500 transition-colors ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>
                      {step.title}
                    </h3>
                  </div>

                  <p className={`text-xs sm:text-sm font-semibold leading-relaxed font-sans ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>
                    {step.instruction || (step as any).instructions || ''}
                  </p>

                  {(step.paletteName || step.componentType || step.slotDetails || step.sourceBlock) && (
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono pt-1">
                      {step.paletteName && (
                        <div className="flex items-center gap-1.5">
                          <span className={`font-black font-sans ${isDark ? 'text-slate-300' : 'text-slate-950'}`}>Palette:</span>
                          <code className={`px-2 py-0.5 rounded border font-black ${isDark ? 'bg-slate-800 text-slate-100 border-slate-700' : 'bg-slate-900 text-slate-100 border-slate-950'}`}>
                            {step.paletteName}
                          </code>
                        </div>
                      )}

                      {step.componentType && (
                        <div className="flex items-center gap-1.5">
                          <span className={`font-black font-sans ${isDark ? 'text-slate-300' : 'text-slate-950'}`}>Component Type:</span>
                          <code className={`px-2 py-0.5 rounded border font-black ${isDark ? 'bg-slate-800 text-sky-300 border-slate-700' : 'bg-[#00529b] text-white border-sky-900'}`}>
                            {step.componentType}
                          </code>
                        </div>
                      )}

                      {step.slotDetails && (
                        <div className="flex items-center gap-1.5">
                          <span className={`font-black font-sans ${isDark ? 'text-slate-300' : 'text-slate-950'}`}>Details / Slots:</span>
                          <code className={`px-2 py-0.5 rounded border font-black ${isDark ? 'bg-slate-800 text-amber-300 border-slate-700' : 'bg-amber-600 text-white border-amber-700'}`}>
                            {step.slotDetails}
                          </code>
                        </div>
                      )}

                      {step.sourceBlock && (
                        <div className="flex items-center gap-1.5">
                          <span className={`font-black font-sans ${isDark ? 'text-slate-300' : 'text-slate-950'}`}>Link:</span>
                          <span className={`font-black ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>{step.sourceBlock}</span>
                          {step.targetBlock && (
                            <>
                              <span className="text-amber-500 font-black">➔</span>
                              <span className={`font-black ${isDark ? 'text-sky-300' : 'text-sky-800'}`}>{step.targetBlock}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {step.tips && (
                    <div className={`border rounded-lg p-3 text-xs flex items-start gap-2.5 mt-2 shadow-xs ${isDark ? 'bg-emerald-950/60 border-emerald-800 text-emerald-100' : 'bg-emerald-100 border-emerald-400 text-slate-950'}`}>
                      <span className="text-base shrink-0">💡</span>
                      <span className="leading-relaxed font-medium">
                        <strong className={`font-black ${isDark ? 'text-emerald-200' : 'text-emerald-950'}`}>Tridium Tip:</strong> {step.tips}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Master Links Interconnect Table */}
        <div
          id="workbench-links-interconnect-table"
          className={`border rounded-xl p-5 shadow-xl space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-950'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className={`text-base font-extrabold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>
                <Layers className="w-5 h-5 text-amber-500" />
                <span>3. Niagara Link Wiring Table ({filteredLinks.length} Links)</span>
              </h2>
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-950'}`}>
                Exact source slot to target slot connections for Workbench Link Editor
              </span>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Filter link connections..."
                value={linkSearchTerm}
                onChange={(e) => setLinkSearchTerm(e.target.value)}
                className={`w-full border rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none font-mono ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-amber-500'
                    : 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-600 focus:border-amber-500 font-bold'
                }`}
              />
            </div>
          </div>

          <div className="overflow-x-auto border rounded-lg border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead
                className={`${
                  isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-100 text-slate-950'
                } border-b border-slate-200 dark:border-slate-800`}
              >
                <tr>
                  <th className={`p-2.5 font-black ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>Source Component</th>
                  <th className={`p-2.5 font-black ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>Source Slot</th>
                  <th className={`p-2.5 font-black text-center ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>➔</th>
                  <th className={`p-2.5 font-black ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>Target Component</th>
                  <th className={`p-2.5 font-black ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>Target Slot</th>
                  <th className={`p-2.5 font-black ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>Signal Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredLinks.map((link) => {
                  const srcBlock = program.blocks.find((b) => b.id === link.fromBlockId);
                  const tgtBlock = program.blocks.find((b) => b.id === link.toBlockId);
                  return (
                    <tr
                      key={link.id}
                      className={
                        isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-100/80'
                      }
                    >
                      <td className={`p-2.5 font-black ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>
                        {srcBlock?.name || link.fromBlockId}
                      </td>
                      <td className="p-2.5">
                        <span className={`font-black px-2 py-0.5 rounded text-[11px] border ${isDark ? 'bg-rose-950/80 text-rose-300 border-rose-800' : 'bg-rose-100 text-rose-950 border-rose-400'}`}>
                          {link.fromSlot}
                        </span>
                      </td>
                      <td className="p-2.5 text-center text-amber-500 font-black">
                        ➔
                      </td>
                      <td className={`p-2.5 font-black ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>
                        {tgtBlock?.name || link.toBlockId}
                      </td>
                      <td className="p-2.5">
                        <span className={`font-black px-2 py-0.5 rounded text-[11px] border ${isDark ? 'bg-sky-950/80 text-sky-300 border-sky-800' : 'bg-sky-100 text-sky-950 border-sky-400'}`}>
                          {link.toSlot}
                        </span>
                      </td>
                    <td className="p-2.5">
                      {(() => {
                        const sig = (link.signalType || 'boolean').toLowerCase();
                        let sigClass = 'bg-gray-200 text-gray-950 border-gray-400';
                        if (sig === 'boolean') sigClass = 'bg-emerald-100 text-emerald-950 border-emerald-400 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-700';
                        else if (sig === 'numeric' || sig === 'double') sigClass = 'bg-purple-100 text-purple-950 border-purple-400 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-700';
                        else if (sig === 'enum') sigClass = 'bg-orange-100 text-orange-950 border-orange-400 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-700';
                        else if (sig === 'string') sigClass = 'bg-gray-200 text-gray-950 border-gray-400 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600';
                        return (
                          <span className={`px-2 py-0.5 rounded text-[11px] font-black border uppercase ${sigClass}`}>
                            {link.signalType || 'boolean'}
                          </span>
                        );
                      })()}
                    </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Component & Property Sheet Parameter Schedule */}
        <div
          id="workbench-component-schedule-table"
          className={`border rounded-xl p-5 shadow-xl space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className={`text-base font-extrabold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>
                <Sliders className="w-5 h-5 text-amber-500" />
                <span>4. Component & Property Sheet Parameter Schedule</span>
              </h2>
              <p className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-950'}`}>
                Complete list of station components, palette jar paths, slot pins, and Property Sheet settings
              </p>
            </div>
            <span className="text-xs font-mono font-black bg-[#00529b] text-white px-3 py-1 rounded-full border border-sky-400/40 shadow-xs">
              {program.blocks.length} Blocks Total
            </span>
          </div>

          <div className="overflow-x-auto border rounded-lg border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead
                className={`${
                  isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-100 text-slate-950'
                } border-b border-slate-200 dark:border-slate-800`}
              >
                <tr>
                  <th className={`p-2.5 font-black ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>#</th>
                  <th className={`p-2.5 font-black ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>Block Name</th>
                  <th className={`p-2.5 font-black ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>Type / Class</th>
                  <th className={`p-2.5 font-black ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>Palette Jar</th>
                  <th className={`p-2.5 font-black ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>Input Slots</th>
                  <th className={`p-2.5 font-black ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>Output Slots</th>
                  <th className={`p-2.5 font-black ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>Property Sheet Config</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {(program?.blocks || []).map((block, idx) => {
                  const propsSummary = Object.entries(block.properties || {})
                    .filter(([k, v]) => v !== undefined && v !== null && k !== 'notes')
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(', ');

                  return (
                    <tr
                      key={block.id}
                      className={isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-100/80'}
                    >
                      <td className={`p-2.5 font-bold ${isDark ? 'text-slate-300' : 'text-slate-950'}`}>{idx + 1}</td>
                      <td className={`p-2.5 font-black ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{block.name}</td>
                      <td className={`p-2.5 font-bold ${isDark ? 'text-sky-300' : 'text-[#00529b]'}`}>{block.type}</td>
                      <td className={`p-2.5 font-bold ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>{block.palette}</td>
                      <td className="p-2.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(block.inputs || []).map((i) => {
                            const t = (i.type || 'boolean').toLowerCase();
                            let c = isDark ? 'bg-gray-800 text-gray-200 border-gray-600' : 'bg-gray-200 text-gray-950 border-gray-400';
                            if (t === 'boolean') c = isDark ? 'bg-emerald-950 text-emerald-200 border-emerald-700' : 'bg-emerald-100 text-emerald-950 border-emerald-400';
                            else if (t === 'numeric') c = isDark ? 'bg-purple-950 text-purple-200 border-purple-700' : 'bg-purple-100 text-purple-950 border-purple-400';
                            else if (t === 'enum') c = isDark ? 'bg-orange-950 text-orange-200 border-orange-700' : 'bg-orange-100 text-orange-950 border-orange-400';
                            return (
                              <span
                                key={i.name}
                                className={`font-black px-1.5 py-0.5 rounded text-[10px] border ${c}`}
                              >
                                {i.name} ({t.substring(0, 3)})
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-2.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(block.outputs || []).map((o) => {
                            const t = (o.type || 'boolean').toLowerCase();
                            let c = isDark ? 'bg-gray-800 text-gray-200 border-gray-600' : 'bg-gray-200 text-gray-950 border-gray-400';
                            if (t === 'boolean') c = isDark ? 'bg-emerald-950 text-emerald-200 border-emerald-700' : 'bg-emerald-100 text-emerald-950 border-emerald-400';
                            else if (t === 'numeric') c = isDark ? 'bg-purple-950 text-purple-200 border-purple-700' : 'bg-purple-100 text-purple-950 border-purple-400';
                            else if (t === 'enum') c = isDark ? 'bg-orange-950 text-orange-200 border-orange-700' : 'bg-orange-100 text-orange-950 border-orange-400';
                            return (
                              <span
                                key={o.name}
                                className={`font-black px-1.5 py-0.5 rounded text-[10px] border ${c}`}
                              >
                                {o.name} ({t.substring(0, 3)})
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className={`p-2.5 font-bold max-w-xs truncate ${isDark ? 'text-slate-100' : 'text-slate-950'}`} title={propsSummary}>
                        {propsSummary || 'Standard Defaults'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: Field Commissioning & Safety Checklist */}
        <div
          id="workbench-commissioning-checklist"
          className={`border rounded-xl p-5 shadow-xl space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-950'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
            <div>
              <h2 className={`text-base font-extrabold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>5. Field Commissioning & Safety Verification Checklist</span>
              </h2>
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-950'}`}>
                Interactive verification procedure for BMS controls startup engineers
              </span>
            </div>
            <span className="text-xs font-mono font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 px-3 py-1 rounded-full">
              {Object.values(completedChecklist).filter(Boolean).length} / {activeChecklist.length} Verified
            </span>
          </div>

          <div className="space-y-2">
            {activeChecklist.map((item, idx) => {
              const isChecked = !!completedChecklist[idx];
              return (
                <div
                  key={idx}
                  onClick={() => toggleChecklistItem(idx)}
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all select-none ${
                    isChecked
                      ? isDark
                        ? 'bg-emerald-950/40 border-emerald-700 text-emerald-100'
                        : 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                      : isDark
                      ? 'bg-slate-800/90 border-slate-700 hover:border-amber-500/60 text-slate-100'
                      : 'bg-slate-50 border-slate-300 hover:border-amber-500/80 text-slate-950 font-bold'
                  }`}
                >
                  <button
                    type="button"
                    className="text-amber-500 hover:text-amber-400 shrink-0 cursor-pointer"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  <span className={`text-xs sm:text-sm font-semibold leading-relaxed ${isChecked ? 'line-through opacity-80' : isDark ? 'text-slate-100' : 'text-slate-950'}`}>
                    {item}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Detail Inspector Modal */}
      {inspectingStep && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-xl rounded-2xl border shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200 ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-500">
                  Step {inspectingStep.stepNumber}
                </span>
                <span className="text-xs uppercase font-bold tracking-wider opacity-75">
                  Phase: {inspectingStep.phase}
                </span>
              </div>
              <button
                onClick={() => setInspectingStep(null)}
                className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h2 className={`text-lg font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>{inspectingStep.title}</h2>
              <p className={`text-sm sm:text-base font-semibold leading-relaxed p-4 rounded-xl border shadow-inner ${isDark ? 'text-slate-100 bg-slate-950 border-slate-800' : 'text-slate-950 bg-slate-100 border-slate-300'}`}>
                {inspectingStep.instruction || inspectingStep.instructions}
              </p>

              {inspectingStep.tips && (
                <div className={`border rounded-xl p-3 text-xs sm:text-sm font-medium leading-relaxed ${isDark ? 'bg-emerald-950/80 border-emerald-700 text-emerald-100' : 'bg-emerald-100 border-emerald-400 text-emerald-950'}`}>
                  <strong className={`font-black ${isDark ? 'text-emerald-200' : 'text-emerald-950'}`}>💡 Tridium Tip: </strong>
                  {inspectingStep.tips}
                </div>
              )}

              {inspectingStep.workbenchPath && (
                <div className="space-y-1.5 pt-2">
                  <span className={`text-xs font-black flex items-center gap-1.5 ${isDark ? 'text-sky-300' : 'text-[#00529b]'}`}>
                    <Terminal className="w-3.5 h-3.5" />
                    Tridium Workbench ORD Path / Navigation:
                  </span>
                  <div className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border font-mono text-xs ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-200 border-slate-300'}`}>
                    <code className={`font-black break-all ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>{inspectingStep.workbenchPath}</code>
                    <button
                      onClick={() => copyToClipboard(inspectingStep.workbenchPath || '', 999)}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-xs font-bold transition-colors shrink-0 flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-black/10 dark:border-white/10">
              <button
                onClick={() => {
                  onToggleStep(inspectingStep.stepNumber);
                  setInspectingStep({
                    ...inspectingStep,
                    completed: !inspectingStep.completed,
                  });
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  inspectingStep.completed
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {inspectingStep.completed ? (
                  <>
                    <CheckSquare className="w-4 h-4" />
                    <span>Marked Complete</span>
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4" />
                    <span>Mark Step Complete</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setInspectingStep(null)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
