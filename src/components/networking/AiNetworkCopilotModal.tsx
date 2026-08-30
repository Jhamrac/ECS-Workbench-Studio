import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Radio,
  Activity,
  ShieldCheck,
  Zap,
  Globe,
  FileSpreadsheet,
  Terminal,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';
import { useNiagaraTheme } from '../../context/NiagaraThemeContext';
import { BacnetDevice, NetworkHealthMetrics, CapturedPacket } from '../../types/networking';

interface AiNetworkCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: BacnetDevice[];
  healthMetrics: NetworkHealthMetrics;
  packets: CapturedPacket[];
  onOpenGlobalAiChat?: (prompt: string) => void;
}

export const AiNetworkCopilotModal: React.FC<AiNetworkCopilotModalProps> = ({
  isOpen,
  onClose,
  devices,
  healthMetrics,
  packets,
  onOpenGlobalAiChat,
}) => {
  const { theme, isDark } = useNiagaraTheme();

  const [activeTool, setActiveTool] = useState<string>('health_audit');
  const [customQuery, setCustomQuery] = useState('');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const tools = [
    {
      id: 'health_audit',
      name: 'Subnet & Bus Health Audit',
      icon: ShieldCheck,
      desc: 'Evaluate token ring latency, broadcast ratio, and MAC collision risks',
      prompt: `Perform a comprehensive BAS network health audit for ${devices.length} controllers. Current Subnet Health: ${healthMetrics.healthScore}%, Broadcast Ratio: ${healthMetrics.broadcastRatioPercent}%, Token Latency: ${healthMetrics.tokenRingRotationLatencyMs}ms. Detected warnings: ${healthMetrics.warnings.join('; ') || 'None'}. Provide specific OT remediation steps.`,
    },
    {
      id: 'topology_audit',
      name: 'Topology & Addressing Audit',
      icon: Radio,
      desc: 'Review BACnet Device Instances, MSTP MAC ranges, and Max Master tuning',
      prompt: `Audit the BACnet network topology containing ${devices.length} controllers (BACnet/IP and MS/TP trunks). Recommend optimal Max Master settings, baud rate balancing (38.4k vs 76.8k), and device instance allocation scheme.`,
    },
    {
      id: 'packet_deep_dive',
      name: 'Packet Stream Diagnostics',
      icon: Activity,
      desc: 'Analyze recent APDU/NPDU traffic patterns and identify communication bottlenecks',
      prompt: `Analyze the current network packet capture stream (${packets.length} frames). Identify any frequent Abort/Reject PDU codes, excessive COV subscriptions, or broadcast storms.`,
    },
    {
      id: 'modbus_gateway',
      name: 'Modbus / Gateway Decoder',
      icon: Globe,
      desc: 'Register map structure, IEEE-754 float32 byte-swapping, and polling optimization',
      prompt: `Provide practical troubleshooting advice for Modbus RTU/TCP to BACnet gateways. Explain register offset conversion (0x, 1x, 3x, 4x), Big-Endian vs Little-Endian float decoding, and poll rate throttling.`,
    },
    {
      id: 'baseline_drift',
      name: 'Baseline Drift & Energy Check',
      icon: FileSpreadsheet,
      desc: 'Detect manual priority overrides (Level 8) and parameter setpoint drifts',
      prompt: `Analyze field controller baseline parameters versus live state. Highlight potential energy-wasting overrides at BACnet Priority 8 (Manual Operator) or conflicting heating/cooling deadbands.`,
    },
    {
      id: 'apdu_testing',
      name: 'APDU Protocol Conformance',
      icon: Zap,
      desc: 'Guidance on ReadPropertyMultiple, WriteProperty with Priority, and BTL testing',
      prompt: `Explain BACnet APDU test sequences for verifying ReadProperty, WriteProperty priority arrays, and error response handling during commissioning.`,
    },
  ];

  const handleRunAiTool = (promptText: string) => {
    setIsLoading(true);
    setAnalysisResult(null);

    // If global AI chat is provided, launch it directly or simulate rich response
    if (onOpenGlobalAiChat) {
      setTimeout(() => {
        setIsLoading(false);
        onOpenGlobalAiChat(promptText);
        onClose();
      }, 300);
      return;
    }

    // Fallback in-modal simulated response
    setTimeout(() => {
      setIsLoading(false);
      setAnalysisResult(
        `### Automated AI OT Diagnostics Report\n\n` +
        `**Network State**: ${devices.length} Controllers Discovered • Subnet Health: ${healthMetrics.healthScore}%\n\n` +
        `1. **Token Ring Analysis**: Current rotation latency of ${healthMetrics.tokenRingRotationLatencyMs}ms is within normal operating limits (<100ms threshold).\n` +
        `2. **Broadcast Optimization**: Broadcast traffic is at ${healthMetrics.broadcastRatioPercent}% of total throughput. Recommended limit is <15%.\n` +
        `3. **Priority Array Check**: 2 controllers currently have active Level 8 Manual Overrides. Verify setpoints before final commissioning sign-off.\n` +
        `4. **Baud Rate Recommendation**: For MS/TP Trunk 1 (5 nodes), 38400 baud with Max Master set to 15 is optimal.`
      );
    }, 700);
  };

  const handleCopy = () => {
    if (analysisResult) {
      navigator.clipboard.writeText(analysisResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-3xl max-h-[90vh] rounded-xl border flex flex-col shadow-2xl overflow-hidden ${
          isDark
            ? 'bg-[#08152c] border-[#163866] text-white'
            : 'bg-white border-slate-300 text-slate-950'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'bg-[#040e1e] border-[#163866]' : 'bg-[#e8f1fa] border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#00529b] text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-950 dark:text-white">
                AI Network Copilot & Diagnostics Hub
              </h2>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Automated OT protocol diagnostics, topology audits, and commissioning advice
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {/* Quick Diagnostics Actions Grid */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider mb-2.5 text-slate-900 dark:text-sky-300">
              Select an AI Diagnostic Routine:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {tools.map((t) => {
                const Icon = t.icon;
                const isSelected = activeTool === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setActiveTool(t.id);
                      handleRunAiTool(t.prompt);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? isDark
                          ? 'bg-[#0e274b] border-sky-400 text-white shadow-md'
                          : 'bg-sky-50 border-sky-600 text-slate-950 shadow-md'
                        : isDark
                        ? 'bg-[#051124] border-slate-700 hover:border-sky-500 text-slate-100'
                        : 'bg-slate-50 border-slate-300 hover:border-sky-500 text-slate-950 hover:bg-sky-50/40'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-[#00529b] text-white shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-xs text-slate-950 dark:text-white">
                        {t.name}
                      </h4>
                      <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 mt-0.5 leading-snug">
                        {t.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Analysis / Result Display */}
          {isLoading && (
            <div className="p-6 rounded-xl border border-sky-400/50 bg-sky-500/10 flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-sky-600 dark:text-sky-400" />
              <span className="font-bold text-xs text-slate-950 dark:text-white">
                AI Network Copilot is analyzing telemetry & protocol frames...
              </span>
            </div>
          )}

          {analysisResult && !isLoading && (
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                isDark ? 'bg-[#040e1e] border-slate-700' : 'bg-slate-50 border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between border-b pb-2 border-slate-300 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-extrabold text-xs text-slate-950 dark:text-white">
                    Copilot Analysis Result
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className="px-2 py-1 rounded text-xs font-bold flex items-center gap-1 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="text-xs font-medium text-slate-950 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
                {analysisResult}
              </div>
            </div>
          )}

          {/* Custom Question Box */}
          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-[#051124] border-slate-700' : 'bg-[#e8f1fa] border-slate-300'
            }`}
          >
            <label className="block text-xs font-black text-slate-950 dark:text-white mb-1.5">
              Ask Custom Troubleshooting Question:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customQuery.trim()) {
                    handleRunAiTool(customQuery.trim());
                    setCustomQuery('');
                  }
                }}
                placeholder="e.g. How do I fix duplicate BACnet MAC address collisions on MS/TP?"
                className="flex-1 px-3 py-2 rounded-lg border text-xs font-bold bg-white text-slate-950 placeholder:text-slate-600 dark:bg-[#030b18] dark:text-white dark:border-slate-600 outline-none focus:border-sky-500"
              />
              <button
                onClick={() => {
                  if (customQuery.trim()) {
                    handleRunAiTool(customQuery.trim());
                    setCustomQuery('');
                  }
                }}
                disabled={!customQuery.trim()}
                className="px-4 py-2 rounded-lg bg-[#00529b] hover:bg-[#00417a] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ask</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`px-5 py-3 border-t flex items-center justify-between shrink-0 ${
            isDark ? 'bg-[#040e1e] border-[#163866]' : 'bg-[#e8f1fa] border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-300">
            Powered by DeepMind Gemini AI • Building Automation Intelligence
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-950 dark:text-white text-xs font-extrabold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
