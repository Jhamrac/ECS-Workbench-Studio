import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  Loader2,
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  FileDown,
  RefreshCw,
  X,
  Lightbulb,
  Zap,
  Check,
  Image as ImageIcon,
  Layers,
  Network,
  MessageSquare,
} from 'lucide-react';
import { generateTranslationPdfReport } from '../utils/exportPdfReport';
import { NiagaraProgram, NiagaraTranslationReport, NiagaraBlock, NiagaraLink } from '../types/niagara';

interface PromptBarProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => Promise<void>;
  onApplyProgram?: (program: NiagaraProgram) => void;
  currentBlocks?: NiagaraBlock[];
  currentLinks?: NiagaraLink[];
  isLoading: boolean;
  onNavigateStudio?: (studioId: 'logic' | 'network', subView?: any) => void;
  onOpenAiChat?: () => void;
  onOpenNetworkCopilot?: () => void;
}

const SAMPLE_PROMPTS = [
  {
    title: 'Dual Chilled Water Pumps',
    desc: 'Runtime alternation, DP flow failure detection, and auto-failover to standby lag pump.',
  },
  {
    title: 'AHU Economizer Loop',
    desc: 'PID mixed air control with 38°F low-limit freeze stat safety override and minimum 20% OA damper position.',
  },
  {
    title: 'Boiler OAT Reset Curve',
    desc: '180°F at 10°F outdoor air down to 120°F at 60°F OAT with Warm Weather Shut Down interlock.',
  },
  {
    title: 'VAV Box with Reheat',
    desc: 'Pressure-independent CFM cooling airflow setpoint reset (300 to 1200 CFM) with modulating HW reheat PID.',
  },
  {
    title: 'After-Hours Lighting',
    desc: 'Weekly schedule with 2-hour pushbutton override timer and 10-minute flicker warning before sweep.',
  },
  {
    title: 'Multi-Stage DX Cooling',
    desc: 'Compressor lead/lag sequencer with 3-minute minimum run and minimum off anti-short-cycle timers.',
  },
  {
    title: 'Cooling Tower VFD PID',
    desc: 'Basin temperature control modulating fan speed to maintain 75°F condenser water with low-temp bypass.',
  },
  {
    title: 'Exhaust Fan Current Switch',
    desc: 'Current switch run status monitoring with 30-second delay-on-make alarm latch and manual reset.',
  },
];

export const PromptBar: React.FC<PromptBarProps> = ({
  isOpen,
  onClose,
  onGenerate,
  onApplyProgram,
  currentBlocks = [],
  currentLinks = [],
  isLoading,
  onNavigateStudio,
  onOpenAiChat,
  onOpenNetworkCopilot,
}) => {
  const [activeCategory, setActiveCategory] = useState<'logic' | 'network' | 'general'>('logic');
  const [activeTab, setActiveTab] = useState<'generate' | 'translate' | 'audit'>('generate');

  // Generate tab state
  const [promptText, setPromptText] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);

  // Translate tab state
  const [translateNotes, setTranslateNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewData, setFilePreviewData] = useState<string | null>(null);
  const [fileTextContent, setFileTextContent] = useState<string | null>(null);
  const [useCanvasAsSource, setUseCanvasAsSource] = useState(false);

  const [isTranslating, setIsTranslating] = useState(false);
  const [translationReport, setTranslationReport] = useState<NiagaraTranslationReport | null>(null);
  const [showResolution, setShowResolution] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  // Cycle loading status text
  useEffect(() => {
    if (!isLoading && !isTranslating) {
      setLoadingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % 4);
    }, 1400);
    return () => clearInterval(interval);
  }, [isLoading, isTranslating]);

  if (!isOpen) return null;

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim() || isLoading) return;
    await onGenerate(promptText.trim());
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUseCanvasAsSource(false);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setFilePreviewData(evt.target?.result as string);
        setFileTextContent(null);
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setFileTextContent(evt.target?.result as string);
        setFilePreviewData(null);
      };
      reader.readAsText(file);
    }
  };

  const handleTranslateSubmit = async () => {
    setIsTranslating(true);
    setTranslationReport(null);
    setShowResolution(false);
    setIsApplied(false);

    try {
      const payload: any = {
        notes: translateNotes,
        fileName: selectedFile?.name || (useCanvasAsSource ? 'Current Workspace Canvas' : 'Logic Program'),
      };

      if (filePreviewData) {
        payload.imageData = filePreviewData;
      }
      if (fileTextContent) {
        payload.fileContent = fileTextContent;
      }
      if (useCanvasAsSource || (!selectedFile && currentBlocks.length > 0)) {
        payload.blocks = currentBlocks;
        payload.links = currentLinks;
      }

      const res = await fetch('/api/translate-wiresheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Translation request failed');
      }

      const result: NiagaraTranslationReport = await res.json();
      setTranslationReport(result);
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleApplyResolution = () => {
    if (translationReport?.resolution?.resolvedProgram && onApplyProgram) {
      onApplyProgram(translationReport.resolution.resolvedProgram);
      setIsApplied(true);
    }
  };

  const handleExportPdf = () => {
    if (translationReport) {
      generateTranslationPdfReport(translationReport);
    }
  };

  const loadingMessages = [
    'Parsing Sequence of Operation (SOO)...',
    'Selecting standard kitControl & baja palette blocks...',
    'Mapping input/output slots (in1..in16, out, setpoints, priority arrays)...',
    'Generating step-by-step ECS Workbench Studio wire sheet instructions...',
  ];

  const translateLoadingMessages = [
    'Scanning logic screenshot & block signal pathways...',
    'Interpreting palette blocks, loop actions & setpoints...',
    'Auditing for short-cycling hazards, missing freeze stats & wiring errors...',
    'Synthesizing before & after resolution engineering report...',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 sm:p-6 md:p-8 animate-in fade-in duration-150">
      {/* Outer Modal Container */}
      <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl w-full max-w-5xl xl:max-w-6xl h-[90vh] max-h-[860px] overflow-hidden text-slate-800 flex flex-col">
        
        {/* Main Body (Sidebar + Content Pane) */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          
          {/* Left Navigation Sidebar */}
          <div className="w-full md:w-64 lg:w-72 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 text-slate-700">
            {/* Logo / Header */}
            <div className="p-4 border-b border-slate-200 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 shadow-sm shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black text-slate-900 truncate">ECS AI Assist</h3>
                <p className="text-[11px] text-slate-500 font-medium truncate">Intelligent BAS Services Hub</p>
              </div>
            </div>
            
            {/* Service Navigation Buttons */}
            <div className="p-3 space-y-2 flex-1 overflow-y-auto">
              <button
                onClick={() => setActiveCategory('logic')}
                className={`w-full text-left p-3 rounded-xl flex items-start gap-3 transition-all cursor-pointer ${
                  activeCategory === 'logic'
                    ? 'bg-sky-50 border border-sky-200 text-sky-950 font-semibold shadow-xs'
                    : 'border border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${activeCategory === 'logic' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'}`}>
                  <Zap className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-tight mb-1 text-slate-900">Logic Studio AI</div>
                  <div className="text-[11px] text-slate-500 leading-snug font-normal">Draft sequences, translate logic files, and design controls.</div>
                </div>
              </button>
              
              <button
                onClick={() => setActiveCategory('network')}
                className={`w-full text-left p-3 rounded-xl flex items-start gap-3 transition-all cursor-pointer ${
                  activeCategory === 'network'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-950 font-semibold shadow-xs'
                    : 'border border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${activeCategory === 'network' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  <Network className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-tight mb-1 text-slate-900">Network Studio AI</div>
                  <div className="text-[11px] text-slate-500 leading-snug font-normal">Scan BACnet networks, decode packets, and run diagnostics.</div>
                </div>
              </button>
              
              <button
                onClick={() => setActiveCategory('general')}
                className={`w-full text-left p-3 rounded-xl flex items-start gap-3 transition-all cursor-pointer ${
                  activeCategory === 'general'
                    ? 'bg-purple-50 border border-purple-200 text-purple-950 font-semibold shadow-xs'
                    : 'border border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${activeCategory === 'general' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-tight mb-1 text-slate-900">BMS Expert Chat</div>
                  <div className="text-[11px] text-slate-500 leading-snug font-normal">Ask hardware questions, lookup guidelines, and draft drivers.</div>
                </div>
              </button>
            </div>
            
            {/* Version / System info */}
            <div className="p-3 border-t border-slate-200 text-[11px] text-slate-500 bg-slate-50 flex items-center justify-between">
              <span className="font-mono text-slate-400">v4.12.0</span>
              <span className="font-semibold text-slate-600">ECS Workbench Copilot</span>
            </div>
          </div>
          
          {/* Right Main Content Pane */}
          <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
            
            {/* Header Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50 shrink-0">
              <div className="min-w-0 pr-4">
                <h2 className="text-base font-extrabold text-slate-900 truncate">
                  {activeCategory === 'logic' ? 'Logic Studio Services' : activeCategory === 'network' ? 'Network Studio Services' : 'BMS Integration Assistant'}
                </h2>
                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                  {activeCategory === 'logic' 
                    ? 'Draft custom wire sheet programming, translate logic drawings, or audit setups for compliance.' 
                    : activeCategory === 'network' 
                    ? 'Capture BACnet device listings, diagnose communication timing, and analyze Modbus register sequences.' 
                    : 'Get specialized technical advice, terminal configuration steps, and wiring schematics.'}
                </p>
              </div>
              
              <button
                onClick={onClose}
                disabled={isLoading || isTranslating}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-200/70 transition-colors cursor-pointer shrink-0"
                title="Close AI Assist"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Selection Row (Logic Studio category) */}
            {activeCategory === 'logic' && (
              <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 overflow-x-auto shrink-0">
                <button
                  id="ai-assist-tab-generate"
                  type="button"
                  onClick={() => setActiveTab('generate')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                    activeTab === 'generate'
                      ? 'border-amber-500 text-slate-900 bg-white shadow-xs'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Draft Custom Wire Sheet</span>
                </button>

                <button
                  id="ai-assist-tab-translate"
                  type="button"
                  onClick={() => setActiveTab('translate')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                    activeTab === 'translate'
                      ? 'border-emerald-500 text-slate-900 bg-white shadow-xs'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                  }`}
                >
                  <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Translate &amp; Troubleshoot Logic</span>
                </button>

                <button
                  id="ai-assist-tab-audit"
                  type="button"
                  onClick={() => setActiveTab('audit')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                    activeTab === 'audit'
                      ? 'border-purple-500 text-slate-900 bg-white shadow-xs'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>Safety &amp; Standards Audit</span>
                </button>
              </div>
            )}

            {/* Scrollable Tab Content Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              
              {/* TAB 1: GENERATE LOGIC */}
              {activeCategory === 'logic' && activeTab === 'generate' && (
                <div className="space-y-6 max-w-4xl">
                  <form onSubmit={handleGenerateSubmit} className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Describe the HVAC sequence or controls scenario you want to draft:
                    </label>
                    <div className="relative">
                      <textarea
                        id="ai-prompt-textarea"
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        placeholder="e.g. I need a dual pump controller where Pump 1 and Pump 2 alternate weekly or switch over if a pump fails its flow proof switch, with life safety emergency stop override on Priority 1..."
                        rows={4}
                        disabled={isLoading}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/80 focus:border-amber-500 transition-all resize-none shadow-xs font-medium leading-relaxed"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                        Outputs standard controller blocks (LoopPoint, LeadLag, Writable, Logic) &amp; wire links.
                      </span>

                      <button
                        id="generate-wiresheet-submit-btn"
                        type="submit"
                        disabled={!promptText.trim() || isLoading}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                            <span>Drafting Wire Sheet...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Draft onto Wiresheet</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Loading Status */}
                  {isLoading && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-900 text-xs animate-pulse shadow-xs">
                      <Loader2 className="w-5 h-5 animate-spin text-amber-600 shrink-0" />
                      <span className="font-semibold text-sm">{loadingMessages[loadingStep]}</span>
                    </div>
                  )}

                  {/* Quick Preset HVAC Examples */}
                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between text-xs text-slate-600 font-bold uppercase tracking-wider">
                      <span>Or select a pre-verified HVAC sequence to build:</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {SAMPLE_PROMPTS.map((sample, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPromptText(`${sample.title}: ${sample.desc}`)}
                          disabled={isLoading}
                          className="text-left bg-slate-50 hover:bg-sky-50/70 hover:border-sky-300 border border-slate-200 p-3 rounded-xl text-slate-700 transition-all cursor-pointer group shadow-2xs"
                        >
                          <div className="font-bold text-xs text-slate-900 group-hover:text-sky-700 flex items-center gap-1.5 mb-1">
                            <span className="text-amber-500">💡</span>
                            <span>Example {idx + 1}: {sample.title}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-normal">
                            {sample.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TRANSLATE & TROUBLESHOOT LOGIC */}
              {activeCategory === 'logic' && activeTab === 'translate' && (
                <div className="space-y-6 max-w-4xl">
                  {/* File / Image Upload Box */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Upload a drawing, screenshot, or program file to analyze:
                    </label>

                    <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500/70 rounded-2xl p-5 bg-slate-50/60 transition-all text-center">
                      <input
                        type="file"
                        id="translate-file-input"
                        accept="image/*,.json,.txt,.xml,.pdf,.csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      {selectedFile ? (
                        <div className="flex items-center justify-between bg-white border border-slate-200 p-3.5 rounded-xl text-left shadow-xs">
                          <div className="flex items-center gap-3 overflow-hidden">
                            {filePreviewData ? (
                              <img
                                src={filePreviewData}
                                alt="Preview"
                                className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0 border border-emerald-100">
                                <FileText className="w-6 h-6" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{selectedFile.name}</p>
                              <p className="text-xs text-slate-500 font-medium">
                                {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'File'}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null);
                              setFilePreviewData(null);
                              setFileTextContent(null);
                            }}
                            className="text-slate-400 hover:text-rose-500 p-2 rounded-lg hover:bg-slate-100 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : useCanvasAsSource ? (
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-left shadow-xs">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200">
                              <Zap className="w-5 h-5 animate-pulse" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-emerald-900">Using Active Wire Sheet Canvas</p>
                              <p className="text-xs text-emerald-700 font-medium">
                                Analyzing {currentBlocks.length} blocks and {currentLinks.length} wire links currently loaded.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setUseCanvasAsSource(false)}
                            className="text-xs text-slate-600 hover:text-slate-900 underline cursor-pointer font-bold px-2 py-1"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <div className="py-4 space-y-3">
                          <div className="flex justify-center gap-3 text-slate-400">
                            <div className="p-3.5 bg-white rounded-full text-emerald-600 border border-slate-200 shadow-sm">
                              <Upload className="w-6 h-6" />
                            </div>
                          </div>
                          <div>
                            <label
                              htmlFor="translate-file-input"
                              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-all shadow-sm"
                            >
                              <ImageIcon className="w-4 h-4" />
                              <span>Browse Image / File Screenshot</span>
                            </label>
                            <p className="text-xs text-slate-500 font-medium mt-2">
                              Supports Wire Sheet Screenshots, PNG, JPG, JSON, or TXT logic exports.
                            </p>
                          </div>

                          {currentBlocks.length > 0 && (
                            <div className="pt-2 border-t border-slate-200">
                              <button
                                type="button"
                                onClick={() => setUseCanvasAsSource(true)}
                                className="inline-flex items-center gap-1.5 text-xs text-sky-700 hover:text-sky-800 font-bold bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                <span>Or Analyze Current Canvas Wire Sheet ({currentBlocks.length} blocks)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Technician Context / Notes */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Additional Notes or Known Symptoms (Optional):
                    </label>
                    <textarea
                      value={translateNotes}
                      onChange={(e) => setTranslateNotes(e.target.value)}
                      placeholder="e.g. Customer reports damper oscillates every 10 minutes, or compressor fails to start during heavy demand call..."
                      rows={2}
                      disabled={isTranslating}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none shadow-xs font-medium"
                    />
                  </div>

                  {/* Action Submit Button */}
                  <div className="flex justify-end pt-1">
                    <button
                      id="translate-wiresheet-submit-btn"
                      type="button"
                      onClick={handleTranslateSubmit}
                      disabled={isTranslating || (!selectedFile && !useCanvasAsSource && currentBlocks.length === 0)}
                      className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer"
                    >
                      {isTranslating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Analyzing &amp; Translating Logic...</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4" />
                          <span>Run Logic Analyzer &amp; Interpreter</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Loading Indicator */}
                  {isTranslating && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-800 text-xs animate-pulse shadow-xs">
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-600 shrink-0" />
                      <span className="font-semibold text-sm">{translateLoadingMessages[loadingStep]}</span>
                    </div>
                  )}

                  {/* TRANSLATION REPORT RESULTS */}
                  {translationReport && !isTranslating && (
                    <div className="space-y-5 pt-4 border-t border-slate-200 animate-in fade-in duration-200">
                      {/* Executive Header Card */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                            System Logic Translation Result
                          </span>
                          <button
                            type="button"
                            onClick={handleExportPdf}
                            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            <span>Export PDF Customer Report</span>
                          </button>
                        </div>

                        <h3 className="text-base font-bold text-slate-900">{translationReport.systemTitle}</h3>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">{translationReport.summary}</p>

                        {translationReport.detailedExplanation && (
                          <div className="mt-2 pt-3 border-t border-slate-200 text-xs text-slate-600 leading-relaxed font-normal">
                            <p className="font-bold text-slate-800 mb-1">How This Logic Works:</p>
                            <p className="whitespace-pre-line">{translationReport.detailedExplanation}</p>
                          </div>
                        )}
                      </div>

                      {/* Identified Issues & Hazards Section */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span>Detected Issues &amp; Operational Risks ({translationReport.issues?.length || 0}):</span>
                        </h4>

                        {(!translationReport.hasIssues || !translationReport.issues || translationReport.issues.length === 0) ? (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-2.5 text-xs text-emerald-800 font-bold">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>No short-cycling bugs or severe logic errors detected in this programming!</span>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {translationReport.issues.map((issue, idx) => {
                              const severityBadge =
                                issue.severity === 'critical'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : issue.severity === 'high'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-sky-50 text-sky-800 border-sky-200';

                              return (
                                <div
                                  key={issue.id || idx}
                                  className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs shadow-xs"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                      <span>Issue #{idx + 1}:</span>
                                      <span>{issue.title}</span>
                                    </span>
                                    <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded border ${severityBadge}`}>
                                      {issue.severity}
                                    </span>
                                  </div>
                                  <p className="text-slate-600 leading-relaxed font-normal">{issue.description}</p>
                                  {issue.affectedComponent && (
                                    <p className="text-[11px] text-slate-500 font-medium">
                                      <span className="font-bold text-slate-700">Affected Component: </span>
                                      {issue.affectedComponent}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* RESOLUTION SECTION BUTTON & EXPANDABLE CARD */}
                      {translationReport.resolution && (
                        <div className="space-y-3 pt-2">
                          {!showResolution ? (
                            <button
                              type="button"
                              onClick={() => setShowResolution(true)}
                              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 font-bold text-xs px-4 py-3 rounded-xl shadow-md transition-all cursor-pointer"
                            >
                              <Zap className="w-4 h-4 fill-amber-950 text-amber-950 animate-pulse" />
                              <span>Resolve Issues &amp; View Before/After Changes</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          ) : (
                            <div className="bg-slate-50 border border-emerald-300 rounded-2xl p-5 space-y-4 animate-in slide-in-from-top duration-200 shadow-xs">
                              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <h4 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Resolution &amp; Proposed Fixes</span>
                                </h4>
                                <span className="text-[11px] text-slate-500 font-bold">Before &amp; After Audit</span>
                              </div>

                              <p className="text-xs text-slate-700 font-bold">{translationReport.resolution.summary}</p>

                              {/* Before vs After Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-1">
                                  <span className="font-bold text-rose-800 uppercase tracking-wider text-[10px] block">
                                    BEFORE (Current Setup):
                                  </span>
                                  <p className="text-rose-900 leading-relaxed font-medium">
                                    {translationReport.resolution.beforeExplanation}
                                  </p>
                                </div>

                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1">
                                  <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px] block">
                                    AFTER (Corrected Setup):
                                  </span>
                                  <p className="text-emerald-900 leading-relaxed font-medium">
                                    {translationReport.resolution.afterExplanation}
                                  </p>
                                </div>
                              </div>

                              {/* Why This Had to Happen */}
                              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs space-y-1">
                                <span className="font-bold text-amber-800 block">
                                  Why Changes Were Required Before Implementation:
                                </span>
                                <p className="text-amber-950 leading-relaxed font-medium">
                                  {translationReport.resolution.whyRequired}
                                </p>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                                <button
                                  type="button"
                                  onClick={handleExportPdf}
                                  className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
                                >
                                  <FileDown className="w-4 h-4 text-sky-600" />
                                  <span>Download Customer PDF</span>
                                </button>

                                {onApplyProgram && translationReport.resolution.resolvedProgram && (
                                  <button
                                    type="button"
                                    onClick={handleApplyResolution}
                                    disabled={isApplied}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer ${
                                      isApplied
                                        ? 'bg-emerald-800 cursor-default'
                                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                                    }`}
                                  >
                                    {isApplied ? (
                                      <>
                                        <Check className="w-4 h-4 text-white" />
                                        <span>Applied to Canvas!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Zap className="w-4 h-4 text-amber-300" />
                                        <span>Apply Fixed Logic to Canvas</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: COMPLIANCE AUDIT */}
              {activeCategory === 'logic' && activeTab === 'audit' && (
                <div className="space-y-4 max-w-4xl animate-in fade-in duration-200">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-200 shadow-sm">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Safety &amp; Standards Audit</h3>
                        <p className="text-xs text-slate-500 font-medium">Audit wire sheet logic for short-cycling protection, proper deadbands, and ASHRAE compliance.</p>
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      The automated auditor evaluates your logic against industry engineering practices and ASHRAE Guideline 36 rules. It validates:
                    </p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-slate-600 pl-4 list-disc font-medium">
                      <li>Anti-short cycling timers for heavy compressors and condensing equipment.</li>
                      <li>Coil-freeze safety cutouts interlocking direct-digital logic blocks.</li>
                      <li>Proportional band deadbands preventing simultaneous heating &amp; cooling loop overrides.</li>
                      <li>Critical latch proofs for fan &amp; pump flow status proof switches.</li>
                    </ul>
                    
                    <div className="pt-3 border-t border-slate-200 flex justify-end">
                      <button
                        onClick={() => {
                          onNavigateStudio?.('logic', 'troubleshoot');
                          onClose();
                        }}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        <span>Launch Safety Audit Workspace</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CATEGORY: NETWORK */}
              {activeCategory === 'network' && (
                <div className="space-y-4 max-w-4xl animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 gap-4">
                    {/* Service 1: Packet Sequence Decoder */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
                      <div className="space-y-1 max-w-2xl">
                        <h4 className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 text-emerald-600" />
                          <span>Packet Sequence Decoder</span>
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          Paste hex sequences or upload raw bus captures. Decodes packet headers, checks CRC-16 integrity, and isolates serial communications timing issues.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          onNavigateStudio?.('network', 'packet_analyzer');
                          onClose();
                        }}
                        className="shrink-0 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-all shadow-xs"
                      >
                        Launch Analyzer
                      </button>
                    </div>

                    {/* Service 2: Device Discovery Simulator */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
                      <div className="space-y-1 max-w-2xl">
                        <h4 className="text-sm font-bold text-sky-700 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-sky-600" />
                          <span>Device Discovery Simulator</span>
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          Simulate subnet IP scanning &amp; Who-Is discovery. Reconstructs vendor controller profiles, lists discoverable objects, and maps BACnet bindings.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          onNavigateStudio?.('network', 'discovery');
                          onClose();
                        }}
                        className="shrink-0 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-all shadow-xs"
                      >
                        Launch Scanner
                      </button>
                    </div>

                    {/* Service 3: Network Health Advisor */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
                      <div className="space-y-1 max-w-2xl">
                        <h4 className="text-sm font-bold text-amber-700 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Network Health Advisor</span>
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          Troubleshoot physical RS-485 network noise levels, detect duplicate device ID conflicts, and review network configuration recommendations.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          onNavigateStudio?.('network', 'health_diagnostics');
                          onOpenNetworkCopilot?.();
                          onClose();
                        }}
                        className="shrink-0 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl shadow cursor-pointer transition-all"
                      >
                        Launch Advisor
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CATEGORY: GENERAL */}
              {activeCategory === 'general' && (
                <div className="space-y-4 animate-in fade-in duration-200 h-full flex flex-col justify-center py-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-4 max-w-xl mx-auto shadow-2xs">
                    <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl border border-purple-200 flex items-center justify-center mx-auto text-xl font-bold shadow-sm">
                      <Sparkles className="w-7 h-7 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-slate-950">BMS Expert Chat</h3>
                      <p className="text-xs text-slate-500 font-medium">A specialized assistant for quick technical advice, terminal configuration steps, and wiring schematics.</p>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      Discuss hardware setups, Modbus register maps, legacy migration paths, or get help writing controller configuration scripts.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          onOpenAiChat?.();
                          onClose();
                        }}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md cursor-pointer transition-all"
                      >
                        <span>Open Interactive AI Chat Drawer</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer (Cleanly docked inside the modal container) */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
          <span className="font-semibold text-slate-600">
            Powered by Google Gemini • ECS BAS Knowledge Engine
          </span>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 cursor-pointer font-bold px-3 py-1 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
