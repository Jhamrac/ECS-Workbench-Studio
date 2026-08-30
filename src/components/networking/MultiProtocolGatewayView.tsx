import React, { useState } from 'react';
import {
  Globe,
  Radio,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap,
  RotateCw,
  Edit2,
  Check,
  X,
  FileCode,
  Layers,
} from 'lucide-react';
import { ModbusGatewayDevice } from '../../types/networking';
import { useNiagaraTheme } from '../../context/NiagaraThemeContext';

interface MultiProtocolGatewayViewProps {
  modbusGateways: ModbusGatewayDevice[];
  onOpenAiAssist?: (prompt: string) => void;
}

export const MultiProtocolGatewayView: React.FC<MultiProtocolGatewayViewProps> = ({
  modbusGateways,
}) => {
  const { theme, isDark } = useNiagaraTheme();

  const [activeTab, setActiveTab] = useState<'modbus' | 'fox' | 'mqtt'>('modbus');
  const [selectedGatewayId, setSelectedGatewayId] = useState<string>(modbusGateways[0]?.id || '');
  const [endianness, setEndianness] = useState<'big' | 'little' | 'byte_swap'>('big');

  const selectedGateway =
    modbusGateways.find((g) => g.id === selectedGatewayId) || modbusGateways[0];

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 sm:p-6 custom-scrollbar font-sans select-none">
      <div className="max-w-6xl mx-auto space-y-6 w-full">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <span>Multi-Protocol Field Gateways & Studio Interconnect</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              Modbus TCP/RTU register mappings, ECS Workbench Studio FoxS links, and IoT MQTT telemetry
            </p>
          </div>

          {/* Sub-protocol Selector */}
          <div className="flex items-center bg-slate-200 dark:bg-black/20 rounded-lg p-0.5 border border-slate-300 dark:border-slate-700/40">
            <button
              onClick={() => setActiveTab('modbus')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'modbus'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Modbus TCP / RTU
            </button>
            <button
              onClick={() => setActiveTab('fox')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'fox'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Niagara Fox / FoxS
            </button>
            <button
              onClick={() => setActiveTab('mqtt')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'mqtt'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              MQTT & IoT Telemetry
            </button>
          </div>
        </div>

        {/* Tab 1: Modbus TCP & RTU Register Map */}
        {activeTab === 'modbus' && (
          <div className="space-y-4">
            {/* Gateway Card */}
            <div
              className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                isDark ? 'bg-[#07162e] border-[#102d58]' : 'bg-white border-[#cbd8e6] shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-400">Gateway:</span>
                <select
                  value={selectedGatewayId}
                  onChange={(e) => setSelectedGatewayId(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                    isDark ? 'bg-[#030b18] border-[#102c54] text-cyan-300' : 'bg-white border-[#b9cee2] text-cyan-900'
                  }`}
                >
                  {modbusGateways.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.ipAddress}:{g.port}) - Unit ID {g.unitId}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-400 font-medium">
                  <span>Endianness:</span>
                  <select
                    value={endianness}
                    onChange={(e) => setEndianness(e.target.value as any)}
                    className={`px-2 py-1 rounded border text-xs font-mono ${
                      isDark ? 'bg-[#030b18] border-[#102c54] text-white' : 'bg-white border-[#b9cee2] text-slate-900'
                    }`}
                  >
                    <option value="big">Big Endian (AB CD - Standard)</option>
                    <option value="little">Little Endian (CD AB)</option>
                    <option value="byte_swap">Byte Swap (BA DC)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modbus Register Table */}
            <div
              className={`p-5 rounded-xl border ${
                isDark ? 'bg-[#07162e] border-[#102d58]' : 'bg-white border-[#cbd8e6] shadow-sm'
              }`}
            >
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700/30 flex items-center justify-between">
                <span>Modbus Register Map ({selectedGateway?.registers.length} Poll Points)</span>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  Unit ID: {selectedGateway?.unitId} | Polling: {selectedGateway?.pollRateSeconds}s
                </span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700/40 text-slate-700 dark:text-slate-400 font-bold text-[11px]">
                      <th className="py-2 px-3">Address</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Register Name</th>
                      <th className="py-2 px-3">Data Format</th>
                      <th className="py-2 px-3">Multiplier / Scale</th>
                      <th className="py-2 px-3">Raw Value</th>
                      <th className="py-2 px-3">Scaled Engineering Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700/20">
                    {selectedGateway?.registers.map((reg) => (
                      <tr
                        key={reg.id}
                        className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}
                      >
                        <td className="py-2.5 px-3 font-bold text-cyan-700 dark:text-cyan-400">{reg.address}</td>
                        <td className="py-2.5 px-3 uppercase text-slate-700 dark:text-slate-300 font-sans font-semibold">
                          {reg.type}
                        </td>
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-slate-200">
                          {reg.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-medium">{reg.dataType}</td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-medium">x{reg.scaleFactor}</td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-400 font-semibold">{reg.rawValue}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-700 dark:text-emerald-400">
                          {reg.scaledValue} {reg.units}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Niagara Fox & FoxS Links */}
        {activeTab === 'fox' && (
          <div
            className={`p-5 rounded-xl border ${
              isDark ? 'bg-[#07162e] border-[#102d58]' : 'bg-white border-[#cbd8e6] shadow-sm'
            }`}
          >
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700/30 flex items-center justify-between">
              <span>ECS Workbench Studio Fox / FoxS Interconnect Status</span>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">Port 4911 (TLS Enabled)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700/40 bg-slate-50 dark:bg-black/20 space-y-2">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-900 dark:text-slate-200">Campus-Central-Supervisor</span>
                  <span className="text-emerald-700 dark:text-emerald-400">LINK ONLINE</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                  URI: foxs://10.10.0.5:4911 | Ping: 4.2ms | SSL Cert: Valid until 2029
                </p>
                <div className="text-[11px] text-slate-700 dark:text-slate-400 font-medium">
                  Synced Components: 48 Niagara Points (Global Heat/Cool Setpoint, Fire Alarm Status)
                </div>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700/40 bg-slate-50 dark:bg-black/20 space-y-2">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-900 dark:text-slate-200">Chiller-Plant-JACE</span>
                  <span className="text-emerald-700 dark:text-emerald-400">LINK ONLINE</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                  URI: foxs://10.10.0.12:4911 | Ping: 2.8ms | SSL Cert: Valid
                </p>
                <div className="text-[11px] text-slate-700 dark:text-slate-400 font-medium">
                  Synced Components: Chilled Water Supply Temp, Lead Chiller Enable, Total kW
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: MQTT Telemetry Broker */}
        {activeTab === 'mqtt' && (
          <div
            className={`p-5 rounded-xl border ${
              isDark ? 'bg-[#07162e] border-[#102d58]' : 'bg-white border-[#cbd8e6] shadow-sm'
            }`}
          >
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700/30 flex items-center justify-between">
              <span>MQTT IoT Telemetry Stream (Sparkplug B / JSON)</span>
              <span className="text-xs font-mono text-sky-700 dark:text-sky-400 font-bold">Broker: tcp://10.10.0.1:1883</span>
            </h3>

            <div className="p-3 rounded-lg font-mono text-xs bg-[#020712] text-emerald-400 leading-relaxed border border-slate-800">
              <p className="text-slate-400 mb-1">=== Live Topic Feed ===</p>
              <div className="space-y-1">
                <div>
                  <span className="text-sky-400">spBv1.0/Campus/DDATA/AHU-1: </span>
                  {`{"timestamp": 1740000000, "metrics": [{"name": "SupplyTemp", "value": 55.4}, {"name": "FanSpeed", "value": 85.0}]}`}
                </div>
                <div>
                  <span className="text-sky-400">spBv1.0/Campus/DDATA/Chiller-Lead: </span>
                  {`{"timestamp": 1740000001, "metrics": [{"name": "EnteringChW", "value": 54.0}, {"name": "LeavingChW", "value": 44.0}]}`}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
