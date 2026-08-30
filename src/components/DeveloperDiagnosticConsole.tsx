import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  X,
  Minus,
  Maximize2,
  Trash2,
  Copy,
  Download,
  Pause,
  Play,
  Filter,
  Search,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Cpu,
  Zap,
  GripHorizontal,
} from 'lucide-react';
import { logger, LogEntry, LogCategory, LogLevel } from '../utils/logger';

interface DeveloperDiagnosticConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  developerEmail?: string;
}

export const DeveloperDiagnosticConsole: React.FC<DeveloperDiagnosticConsoleProps> = ({
  isOpen,
  onClose,
  developerEmail,
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [height, setHeight] = useState<number>(240); // default height in px
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPaused, setIsPaused] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const dragStartYRef = useRef<number>(0);
  const dragStartHeightRef = useRef<number>(240);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPaused) return;
    const unsubscribe = logger.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return () => unsubscribe();
  }, [isPaused]);

  // Resizing logic
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    dragStartYRef.current = e.clientY;
    dragStartHeightRef.current = height;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const deltaY = dragStartYRef.current - e.clientY;
      const newHeight = Math.max(140, Math.min(650, dragStartHeightRef.current + deltaY));
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  if (!isOpen) return null;

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (selectedCategory !== 'ALL' && log.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMsg = log.message.toLowerCase().includes(q);
      const matchCat = log.category.toLowerCase().includes(q);
      const matchSrc = (log.source || '').toLowerCase().includes(q);
      return matchMsg || matchCat || matchSrc;
    }
    return true;
  });

  const errorCount = logs.filter((l) => l.level === 'error' || l.category === 'ERROR').length;
  const warnCount = logs.filter((l) => l.level === 'warn' || l.category === 'WARN').length;

  const handleCopyLogs = () => {
    const text = filteredLogs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.category}] [${l.level.toUpperCase()}] ${l.message}${
            l.details ? `\n  Details: ${JSON.stringify(l.details)}` : ''
          }`
      )
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `niagara_dev_diagnostics_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getCategoryBadgeStyle = (cat: LogCategory, level: LogLevel) => {
    if (level === 'error' || cat === 'ERROR') {
      return 'bg-rose-950 text-rose-300 border-rose-700 font-bold';
    }
    if (level === 'warn' || cat === 'WARN') {
      return 'bg-amber-950 text-amber-300 border-amber-700 font-bold';
    }
    switch (cat) {
      case 'WIRE':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'ENGINE':
        return 'bg-cyan-950 text-cyan-300 border-cyan-800';
      case 'AI':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'UI':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      default:
        return 'bg-sky-950 text-sky-300 border-sky-800';
    }
  };

  return (
    <div
      id="dev-diagnostic-console-root"
      style={{ height: isMinimized ? '38px' : `${height}px` }}
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950 border-t-2 border-slate-700 shadow-2xl flex flex-col font-mono text-xs select-none transition-all duration-75"
    >
      {/* Top Drag Handle Bar */}
      <div
        onMouseDown={handleMouseDown}
        title="Drag up or down to adjust console window height"
        className="h-2 bg-slate-900 hover:bg-sky-600/60 cursor-ns-resize flex items-center justify-center transition-colors group"
      >
        <GripHorizontal className="w-6 h-3 text-slate-600 group-hover:text-sky-300" />
      </div>

      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-slate-200">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-purple-950/80 border border-purple-700/60 text-purple-300 px-2 py-0.5 rounded text-[11px] font-bold">
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>DEV DIAGNOSTICS CONSOLE</span>
          </div>

          <span className="text-[10px] text-slate-400 hidden sm:inline">
            Session: <strong className="text-purple-300">{developerEmail || 'Active Developer Mode'}</strong>
          </span>

          {errorCount > 0 && (
            <span className="flex items-center gap-1 bg-rose-900/80 border border-rose-700 text-rose-200 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
              <AlertOctagon className="w-3 h-3" />
              {errorCount} {errorCount === 1 ? 'Error' : 'Errors'}
            </span>
          )}

          {warnCount > 0 && (
            <span className="flex items-center gap-1 bg-amber-950/80 border border-amber-700 text-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              {warnCount} Warnings
            </span>
          )}
        </div>

        {/* Toolbar & Filter Actions */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative hidden md:flex items-center">
            <Search className="w-3 h-3 text-slate-500 absolute left-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="bg-slate-950 border border-slate-700 text-slate-200 text-[11px] pl-6 pr-2 py-0.5 rounded focus:outline-none focus:border-sky-500 w-36"
            />
          </div>

          {/* Pause / Live Stream toggle */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Resume live log stream' : 'Pause log stream'}
            className={`px-2 py-0.5 rounded border text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
              isPaused
                ? 'bg-amber-950 text-amber-300 border-amber-700'
                : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            {isPaused ? <Play className="w-3 h-3 text-amber-400" /> : <Pause className="w-3 h-3 text-sky-400" />}
            <span>{isPaused ? 'PAUSED' : 'LIVE'}</span>
          </button>

          {/* Copy Logs */}
          <button
            onClick={handleCopyLogs}
            title="Copy logs to clipboard"
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJson}
            title="Download JSON log report"
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Clear Logs */}
          <button
            onClick={() => logger.clearLogs()}
            title="Clear all logs"
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Minimize / Maximize */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand Console' : 'Minimize Console'}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            title="Close Developer Diagnostics Console"
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Category Chips Bar (when expanded) */}
      {!isMinimized && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 border-b border-slate-800/80 text-[10px] overflow-x-auto">
          <span className="text-slate-500 uppercase font-bold text-[9px]">Filter:</span>
          {[
            { id: 'ALL', label: 'ALL', count: logs.length },
            { id: 'ERROR', label: 'ERROR', count: logs.filter((l) => l.level === 'error' || l.category === 'ERROR').length },
            { id: 'WARN', label: 'WARN', count: logs.filter((l) => l.level === 'warn' || l.category === 'WARN').length },
            { id: 'UI', label: 'UI', count: logs.filter((l) => l.category === 'UI').length },
            { id: 'WIRE', label: 'WIRE', count: logs.filter((l) => l.category === 'WIRE').length },
            { id: 'ENGINE', label: 'ENGINE', count: logs.filter((l) => l.category === 'ENGINE').length },
            { id: 'AI', label: 'AI', count: logs.filter((l) => l.category === 'AI').length },
            { id: 'SYSTEM', label: 'SYSTEM', count: logs.filter((l) => l.category === 'SYSTEM').length },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2 py-0.5 rounded border transition-all cursor-pointer font-bold flex items-center gap-1 ${
                selectedCategory === cat.id
                  ? 'bg-sky-600 text-white border-sky-400 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`px-1 rounded text-[9px] ${
                  selectedCategory === cat.id
                    ? 'bg-sky-800 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
          <span className="ml-auto text-slate-500 text-[10px]">
            Showing {filteredLogs.length} of {logs.length} entries
          </span>
        </div>
      )}

      {/* Main Logs Table / Stream List */}
      {!isMinimized && (
        <div ref={logContainerRef} className="flex-1 overflow-y-auto bg-[#020712] p-2 space-y-1 select-text font-mono">
          {filteredLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-600 text-xs py-6">
              <span>No diagnostic events match current filter. Interact with the wire sheet to capture live logs.</span>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const badgeStyle = getCategoryBadgeStyle(log.category, log.level);

              return (
                <div
                  key={log.id}
                  className={`border rounded p-1.5 transition-colors text-[11px] ${
                    log.level === 'error' || log.category === 'ERROR'
                      ? 'bg-rose-950/40 border-rose-800/70 text-rose-200'
                      : log.level === 'warn' || log.category === 'WARN'
                      ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                      : 'bg-slate-900/70 border-slate-800/80 text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start gap-2 cursor-pointer" onClick={() => setExpandedLogId(isExpanded ? null : log.id)}>
                    {/* Timestamp */}
                    <span className="text-slate-500 font-mono text-[10px] shrink-0 pt-0.5">{log.timestamp}</span>

                    {/* Category Pill */}
                    <span className={`px-1.5 py-0.2 rounded border text-[9px] uppercase shrink-0 ${badgeStyle}`}>
                      {log.category}
                    </span>

                    {/* Message Body */}
                    <span className="flex-1 font-mono leading-tight break-words">{log.message}</span>

                    {/* Details toggle chevron */}
                    {log.details && (
                      <span className="text-slate-500 hover:text-slate-300 p-0.5 shrink-0">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </span>
                    )}
                  </div>

                  {/* Expandable JSON Details or Error Hint */}
                  {isExpanded && log.details && (
                    <div className="mt-2 p-2 bg-slate-950 border border-slate-800 rounded text-[10px] overflow-x-auto text-sky-300 space-y-1">
                      <p className="text-slate-400 font-bold uppercase text-[9px]">Diagnostic Context Data:</p>
                      <pre className="whitespace-pre-wrap">{JSON.stringify(log.details, null, 2)}</pre>

                      {(log.level === 'error' || log.category === 'ERROR') && (
                        <div className="mt-2 pt-2 border-t border-slate-800 text-emerald-400">
                          <p className="font-bold flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span>Developer Explanation & Action Plan:</span>
                          </p>
                          <p className="text-slate-300 text-[10.5px]">
                            Check wire link signal compatibility (e.g. Boolean out to Boolean in), ensure target block exists, or verify network permissions.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
