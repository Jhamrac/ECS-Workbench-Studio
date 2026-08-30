import React, { useState } from 'react';
import {
  Terminal,
  Play,
  Pause,
  Trash2,
  Download,
  Send,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { SerialLogEntry } from '../../types/networking';
import { useNiagaraTheme } from '../../context/NiagaraThemeContext';

interface SerialTerminalViewProps {
  logs: SerialLogEntry[];
  onClearLogs: () => void;
  onSendSerialFrame: (hexString: string, port: string, baud: number) => void;
  onOpenAiAssist?: (prompt: string) => void;
}

export const SerialTerminalView: React.FC<SerialTerminalViewProps> = ({
  logs,
  onClearLogs,
  onSendSerialFrame,
}) => {
  const { theme, isDark } = useNiagaraTheme();

  const [selectedPort, setSelectedPort] = useState('COM1 (RS-485 Port A)');
  const [baudRate, setBaudRate] = useState<number>(38400);
  const [dataBits, setDataBits] = useState('8');
  const [parity, setParity] = useState('None');
  const [stopBits, setStopBits] = useState('1');
  const [customHexInput, setCustomHexInput] = useState('55 FF 00 02 01 00 00 3E');
  const [isPaused, setIsPaused] = useState(false);

  const handleSend = () => {
    if (!customHexInput.trim()) return;
    onSendSerialFrame(customHexInput.trim(), selectedPort, baudRate);
  };

  const handlePreset = (presetHex: string) => {
    setCustomHexInput(presetHex);
    onSendSerialFrame(presetHex, selectedPort, baudRate);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden font-sans select-none">
      {/* Top Serial COM Configuration Bar */}
      <div
        className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-[#081a36] border-[#0e274b]' : 'bg-[#eaf2fb] border-[#cbd8e6]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 font-bold text-sky-700 dark:text-sky-400">
            <Terminal className="w-4 h-4" />
            <span>Port:</span>
          </div>

          <select
            value={selectedPort}
            onChange={(e) => setSelectedPort(e.target.value)}
            className={`px-2 py-1 rounded border text-xs font-mono font-bold ${
              isDark ? 'bg-[#030b18] border-[#102c54] text-white' : 'bg-white border-[#b9cee2] text-slate-900'
            }`}
          >
            <option value="COM1 (RS-485 Port A)">COM1 (RS-485 Port A / Trunk 1)</option>
            <option value="COM2 (RS-485 Port B)">COM2 (RS-485 Port B / Trunk 2)</option>
            <option value="COM3 (Modbus RTU)">COM3 (Modbus RTU RS-485)</option>
          </select>

          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-400 font-semibold">
            <span>Baud:</span>
            <select
              value={baudRate}
              onChange={(e) => setBaudRate(parseInt(e.target.value))}
              className={`px-2 py-1 rounded border text-xs font-mono font-bold ${
                isDark ? 'bg-[#030b18] border-[#102c54] text-emerald-400' : 'bg-white border-[#b9cee2] text-emerald-700'
              }`}
            >
              <option value={9600}>9600</option>
              <option value={19200}>19200</option>
              <option value={38400}>38400</option>
              <option value={76800}>76800</option>
              <option value={115200}>115200</option>
            </select>
          </div>

          <div className="hidden sm:flex items-center gap-1 font-mono text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            <span>Params: {dataBits}-{parity[0]}-{stopBits}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 cursor-pointer ${
              isPaused
                ? 'bg-amber-600 text-white'
                : isDark
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume' : 'Freeze'}</span>
          </button>

          <button
            onClick={onClearLogs}
            title="Clear terminal buffer"
            className="p-1.5 rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-red-500 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Terminal Output Window */}
      <div
        className={`flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed custom-scrollbar ${
          isDark ? 'bg-[#020712] text-emerald-400' : 'bg-slate-950 text-emerald-300'
        }`}
      >
        <div className="text-slate-400 mb-3 border-b border-slate-800 pb-2 text-[11px] font-sans">
          === Connected to {selectedPort} at {baudRate} Baud (8-N-1) === Live Raw Hex & Interpreted Stream ===
        </div>

        {logs.length === 0 ? (
          <div className="text-slate-400 py-8 text-center font-medium">
            No serial bytes received. Transmit a frame or ensure baud rate matches controllers.
          </div>
        ) : (
          <div className="space-y-1.5">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 hover:bg-slate-900/60 p-0.5 rounded">
                <span className="text-slate-400 shrink-0 select-none">
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>
                <span
                  className={`font-bold shrink-0 px-1 rounded text-[10px] ${
                    log.direction === 'TX'
                      ? 'bg-sky-950 text-sky-400 border border-sky-800'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}
                >
                  {log.direction}
                </span>
                <span className="text-amber-300 font-bold shrink-0">{log.rawHex}</span>
                <span className="text-slate-500 select-none">|</span>
                <span className="text-slate-200 font-sans">{log.interpretedFrame}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Frame Injector Bar */}
      <div
        className={`p-3 border-t flex flex-col gap-2 shrink-0 ${
          isDark ? 'bg-[#081a36] border-[#0e274b]' : 'bg-[#edf4fb] border-[#cbd8e6]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-sans">
          <span className="font-bold text-slate-700 dark:text-slate-400">Quick Test Injection Presets:</span>
          <button
            onClick={() => handlePreset('55 FF 00 02 01 00 00 3E')}
            className={`px-2 py-0.5 rounded border font-mono text-[10px] font-semibold cursor-pointer ${
              isDark
                ? 'bg-black/20 hover:bg-black/40 border-slate-700 text-sky-300'
                : 'bg-white hover:bg-sky-50 border-sky-300 text-sky-800 shadow-xs'
            }`}
          >
            Token [MAC 1 → 2]
          </button>
          <button
            onClick={() => handlePreset('55 FF 01 03 01 00 00 48')}
            className={`px-2 py-0.5 rounded border font-mono text-[10px] font-semibold cursor-pointer ${
              isDark
                ? 'bg-black/20 hover:bg-black/40 border-slate-700 text-amber-300'
                : 'bg-white hover:bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
            }`}
          >
            Poll For Master [1 → 3]
          </button>
          <button
            onClick={() => handlePreset('01 03 00 00 00 02 C4 0B')}
            className={`px-2 py-0.5 rounded border font-mono text-[10px] font-semibold cursor-pointer ${
              isDark
                ? 'bg-black/20 hover:bg-black/40 border-slate-700 text-purple-300'
                : 'bg-white hover:bg-purple-50 border-purple-300 text-purple-900 shadow-xs'
            }`}
          >
            Modbus Read Regs [40001-40002]
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono ${
              isDark ? 'bg-[#030b18] border-[#102c54] text-white' : 'bg-white border-[#b9cee2] text-slate-900'
            }`}
          >
            <span className="text-slate-600 dark:text-slate-400 font-sans font-bold">HEX TX:</span>
            <input
              type="text"
              value={customHexInput}
              onChange={(e) => setCustomHexInput(e.target.value)}
              placeholder="Enter space-separated hex bytes (e.g. 55 FF 00 02 01 00 00 3E)..."
              className="w-full bg-transparent outline-none font-mono text-xs text-amber-700 dark:text-amber-300 font-bold placeholder:text-slate-400"
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
          </div>

          <button
            onClick={handleSend}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Transmit Frame</span>
          </button>
        </div>
      </div>
    </div>
  );
};
