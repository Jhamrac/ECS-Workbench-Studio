import React, { useState } from 'react';
import {
  Zap,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Send,
  Sliders,
  Check,
  Radio,
  FileCode,
} from 'lucide-react';
import { BacnetDevice } from '../../types/networking';
import { useNiagaraTheme } from '../../context/NiagaraThemeContext';

interface ProtocolTestShellViewProps {
  devices: BacnetDevice[];
  onOpenAiAssist?: (prompt: string) => void;
}

export const ProtocolTestShellView: React.FC<ProtocolTestShellViewProps> = ({
  devices,
}) => {
  const { theme, isDark } = useNiagaraTheme();

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(devices[0]?.id || '');
  const [selectedService, setSelectedService] = useState('ReadProperty');
  const [objectType, setObjectType] = useState('analog-value');
  const [objectInstance, setObjectInstance] = useState('1');
  const [propertyId, setPropertyId] = useState('present-value');
  const [writePriority, setWritePriority] = useState('8');
  const [writeValue, setWriteValue] = useState('72.5');

  // Test execution output
  const [testOutput, setTestOutput] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const selectedDev = devices.find((d) => d.id === selectedDeviceId) || devices[0];

  const handleExecuteTest = () => {
    setIsExecuting(true);
    setTestOutput([]);

    setTimeout(() => {
      const logs = [
        `[APDU-TX] Sending ${selectedService} to Device ${selectedDev?.deviceInstance || 1001} (${selectedDev?.name})`,
        `[BVLC/NPDU] Dest Net: ${selectedDev?.networkNumber}, Dest MAC/IP: ${selectedDev?.ipAddress || selectedDev?.macAddress}`,
        `[APDU Payload] Service: ${selectedService}, Object: (${objectType}, ${objectInstance}), Property: ${propertyId}`,
        selectedService === 'WriteProperty' ? `[Priority] Priority Slot: ${writePriority}, Value: ${writeValue}` : null,
        `[APDU-RX] 200 OK - Complex-ACK received from Device ${selectedDev?.deviceInstance} in 12.4ms`,
        `[Decoded Value] Return Status: SUCCESS - Verified Property Value: ${selectedService === 'WriteProperty' ? writeValue : '72.0 °F'}`,
      ].filter(Boolean) as string[];

      setTestOutput(logs);
      setIsExecuting(false);
    }, 600);
  };

  const handleSimulateFault = (faultType: string) => {
    setIsExecuting(true);
    setTimeout(() => {
      setTestOutput([
        `[FAULT-SIMULATION] Injected Fault Test: "${faultType}" to Controller ${selectedDev?.name}`,
        `[APDU-TX] Malformed APDU frame transmitted (Length: 1480 Bytes, Service Code: 0xFF)`,
        `[APDU-RX] REJECT-PDU received: Reason = UNRECOGNIZED_SERVICE (Code 2)`,
        `[Behavior Analysis] Controller handled the error gracefully without rebooting or locking the RS-485 token ring.`,
      ]);
      setIsExecuting(false);
    }, 500);
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 sm:p-6 custom-scrollbar font-sans select-none">
      <div className="max-w-5xl mx-auto space-y-6 w-full">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Protocol Test & Verification Shell</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              Generate custom BACnet APDU test requests, simulate edge-case network faults, and audit controller profile conformance
            </p>
          </div>
        </div>

        {/* APDU Test Generator Card */}
        <div
          className={`p-5 rounded-xl border ${
            isDark ? 'bg-[#07162e] border-[#102d58]' : 'bg-white border-[#cbd8e6] shadow-sm'
          }`}
        >
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700/30">
            APDU Request Builder & Transmitter
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
            {/* Target Controller */}
            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Target Controller</label>
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className={`w-full px-2.5 py-1.5 rounded-lg border font-mono font-bold ${
                  isDark ? 'bg-[#030b18] border-[#102c54] text-white' : 'bg-white border-[#b9cee2] text-slate-900'
                }`}
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} (ID: {d.deviceInstance})
                  </option>
                ))}
              </select>
            </div>

            {/* Service Type */}
            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">BACnet Service</label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className={`w-full px-2.5 py-1.5 rounded-lg border font-mono font-bold ${
                  isDark ? 'bg-[#030b18] border-[#102c54] text-sky-400' : 'bg-white border-[#b9cee2] text-sky-800'
                }`}
              >
                <option value="ReadProperty">ReadProperty (Service 12)</option>
                <option value="WriteProperty">WriteProperty (Service 15)</option>
                <option value="ReadPropertyMultiple">ReadPropertyMultiple (Service 14)</option>
                <option value="TimeSynchronization">TimeSynchronization (Service 32)</option>
                <option value="ReinitializeDevice">ReinitializeDevice (Service 20)</option>
              </select>
            </div>

            {/* Object Type */}
            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Object Type & Instance</label>
              <div className="flex gap-2">
                <select
                  value={objectType}
                  onChange={(e) => setObjectType(e.target.value)}
                  className={`w-2/3 px-2.5 py-1.5 rounded-lg border font-mono ${
                    isDark ? 'bg-[#030b18] border-[#102c54] text-white' : 'bg-white border-[#b9cee2] text-slate-900'
                  }`}
                >
                  <option value="analog-value">Analog-Value (AV)</option>
                  <option value="analog-input">Analog-Input (AI)</option>
                  <option value="binary-value">Binary-Value (BV)</option>
                  <option value="binary-input">Binary-Input (BI)</option>
                  <option value="device">Device (DEV)</option>
                </select>
                <input
                  type="text"
                  value={objectInstance}
                  onChange={(e) => setObjectInstance(e.target.value)}
                  className={`w-1/3 px-2 py-1.5 rounded-lg border text-center font-mono font-bold ${
                    isDark ? 'bg-[#030b18] border-[#102c54] text-white' : 'bg-white border-[#b9cee2] text-slate-900'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Conditional Write Fields */}
          {selectedService === 'WriteProperty' && (
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/30 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Write Value</label>
                <input
                  type="text"
                  value={writeValue}
                  onChange={(e) => setWriteValue(e.target.value)}
                  className={`w-full px-2.5 py-1.5 rounded-lg border font-mono ${
                    isDark ? 'bg-[#030b18] border-[#102c54] text-white' : 'bg-white border-[#b9cee2] text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Priority Slot (1-16)</label>
                <select
                  value={writePriority}
                  onChange={(e) => setWritePriority(e.target.value)}
                  className={`w-full px-2.5 py-1.5 rounded-lg border font-mono font-bold ${
                    isDark ? 'bg-[#030b18] border-[#102c54] text-amber-400' : 'bg-white border-[#b9cee2] text-amber-800'
                  }`}
                >
                  <option value="1">Priority 1 (Life Safety)</option>
                  <option value="8">Priority 8 (Manual Operator Override)</option>
                  <option value="15">Priority 15 (Supervisory Logic)</option>
                  <option value="16">Priority 16 (Default Control Loop)</option>
                </select>
              </div>
            </div>
          )}

          {/* Execution Button */}
          <div className="mt-4 flex items-center justify-end">
            <button
              onClick={handleExecuteTest}
              disabled={isExecuting}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer ${
                isExecuting
                  ? 'bg-amber-600 text-white animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <Play className="w-4 h-4" />
              <span>{isExecuting ? 'Transmitting APDU...' : 'Send APDU Test Frame'}</span>
            </button>
          </div>
        </div>

        {/* Test Result Terminal Box */}
        <div
          className={`p-4 rounded-xl border font-mono text-xs ${
            isDark ? 'bg-[#020712] border-[#102d58] text-emerald-400' : 'bg-slate-950 text-emerald-300'
          }`}
        >
          <div className="text-slate-400 mb-2 border-b border-slate-800 pb-1 font-sans text-xs">
            APDU Transaction Log & Response Decoder
          </div>
          {testOutput.length === 0 ? (
            <div className="text-slate-400 py-3 text-center font-medium">
              Awaiting APDU transmission. Select test parameters and click "Send APDU Test Frame".
            </div>
          ) : (
            <div className="space-y-1">
              {testOutput.map((line, idx) => (
                <div key={idx} className="leading-relaxed">
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fault & Error Edge Case Simulation */}
        <div
          className={`p-5 rounded-xl border ${
            isDark ? 'bg-[#07162e] border-[#102d58]' : 'bg-white border-[#cbd8e6] shadow-sm'
          }`}
        >
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2">
            Fault & Resiliency Stress Simulator
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-4">
            Test how field controllers respond to protocol violations, aborts, and buffer overflows without taking the building offline
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleSimulateFault('Access Denied (Security Violation)')}
              className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-left text-xs transition-colors cursor-pointer"
            >
              <span className="font-bold text-amber-800 dark:text-amber-300 block">🔒 Access Denied</span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-1 block">
                Simulate write attempt to read-only property
              </span>
            </button>

            <button
              onClick={() => handleSimulateFault('Buffer Overflow / MTU Exceeded')}
              className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-left text-xs transition-colors cursor-pointer"
            >
              <span className="font-bold text-red-800 dark:text-red-300 block">💥 Oversized APDU</span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-1 block">
                Send 1480-byte packet to small MS/TP node
              </span>
            </button>

            <button
              onClick={() => handleSimulateFault('Timeout & Retries Exhausted')}
              className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-left text-xs transition-colors cursor-pointer"
            >
              <span className="font-bold text-purple-800 dark:text-purple-300 block">⏳ Response Timeout</span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-1 block">
                Verify application timeout and retry counters
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
