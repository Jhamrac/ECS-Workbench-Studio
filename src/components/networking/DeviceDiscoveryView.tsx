import React, { useState, useMemo } from 'react';
import {
  Search,
  Radio,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Network,
  Cpu,
  Layers,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  SlidersHorizontal,
  Edit2,
  Check,
  X,
  Zap,
  Info,
  Filter,
  Download,
  Eye,
} from 'lucide-react';
import {
  BacnetDevice,
  BacnetObject,
  NetworkTrunk,
  ProtocolType,
} from '../../types/networking';
import { useNiagaraTheme } from '../../context/NiagaraThemeContext';

interface DeviceDiscoveryViewProps {
  devices: BacnetDevice[];
  trunks: NetworkTrunk[];
  isDiscovering: boolean;
  onRunDiscovery: (lowLimit?: number, highLimit?: number, network?: number) => void;
  selectedDevice: BacnetDevice | null;
  onSelectDevice: (device: BacnetDevice | null) => void;
  onUpdateObjectValue: (
    deviceId: string,
    objectId: string,
    value: number | boolean | string,
    priority?: number
  ) => void;
  onRelinquishPriority: (deviceId: string, objectId: string, priority: number) => void;
  onOpenAiAssist?: (prompt: string) => void;
}

export const DeviceDiscoveryView: React.FC<DeviceDiscoveryViewProps> = ({
  devices,
  trunks,
  isDiscovering,
  onRunDiscovery,
  selectedDevice,
  onSelectDevice,
  onUpdateObjectValue,
  onRelinquishPriority,
}) => {
  const { theme, isDark } = useNiagaraTheme();

  // Local View Modes: 'split' (Table + Inspector) or 'topology' (Visual Map) or 'trend' (Live Graph)
  const [activeTab, setActiveTab] = useState<'explorer' | 'topology' | 'trend'>('explorer');
  const [searchFilter, setSearchFilter] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<string>('all');
  const [editingSlot, setEditingSlot] = useState<{ objectId: string; priority: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [selectedTrendPointIds, setSelectedTrendPointIds] = useState<string[]>(['jace_obj_1', 'rtu1_obj_1']);

  // Discovery Filter Range
  const [lowRange, setLowRange] = useState<number>(0);
  const [highRange, setHighRange] = useState<number>(4194303);
  const [targetNetwork, setTargetNetwork] = useState<number>(0); // 0 = all

  // Filtered Devices
  const filteredDevices = useMemo(() => {
    return devices.filter((dev) => {
      const matchesSearch =
        dev.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        dev.deviceInstance.toString().includes(searchFilter) ||
        dev.vendorName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (dev.ipAddress && dev.ipAddress.includes(searchFilter)) ||
        (dev.macAddress !== undefined && dev.macAddress.toString().includes(searchFilter));

      const matchesProtocol =
        protocolFilter === 'all' || dev.protocol === protocolFilter;

      return matchesSearch && matchesProtocol;
    });
  }, [devices, searchFilter, protocolFilter]);

  // Handle priority write
  const handleSavePrioritySlot = (objectId: string, priority: number) => {
    if (!selectedDevice) return;
    const numVal = parseFloat(editValue);
    const finalVal = isNaN(numVal) ? editValue : numVal;
    onUpdateObjectValue(selectedDevice.id, objectId, finalVal, priority);
    setEditingSlot(null);
    setEditValue('');
  };

  // Selected Device Objects
  const currentObjects = selectedDevice?.objects || [];

  return (
    <div className="h-full flex flex-col overflow-hidden font-sans select-none">
      {/* Top Discovery Control Bar */}
      <div
        className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-[#081a36] border-[#0e274b]' : 'bg-[#eaf2fb] border-[#cbd8e6]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-black/10 dark:bg-black/40 rounded-lg p-0.5 border border-slate-300 dark:border-slate-700/60">
            <button
              onClick={() => setActiveTab('explorer')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'explorer'
                  ? 'bg-[#00529b] text-white shadow-xs'
                  : isDark
                  ? 'text-slate-300 hover:text-white'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              Device & Point Explorer
            </button>
            <button
              onClick={() => setActiveTab('topology')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'topology'
                  ? 'bg-[#00529b] text-white shadow-xs'
                  : isDark
                  ? 'text-slate-300 hover:text-white'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              Network Topology Map
            </button>
            <button
              onClick={() => setActiveTab('trend')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'trend'
                  ? 'bg-[#00529b] text-white shadow-xs'
                  : isDark
                  ? 'text-slate-300 hover:text-white'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              Live Point Trend
            </button>
          </div>

          <div className="h-4 w-px bg-slate-400 dark:bg-slate-700/60 hidden sm:block" />

          {/* Quick Stats */}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-700 dark:text-slate-300 font-semibold">Online:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{devices.length} Devices</span>
            <span className="text-slate-400 dark:text-slate-600">|</span>
            <span className="text-slate-700 dark:text-slate-300 font-semibold">Trunks:</span>
            <span className="font-bold text-sky-600 dark:text-sky-400">{trunks.length} Channels</span>
          </div>
        </div>

        {/* Discovery Triggers & Range */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-slate-700 dark:text-slate-300">
            <span className="font-semibold">Range:</span>
            <input
              type="number"
              value={lowRange}
              onChange={(e) => setLowRange(parseInt(e.target.value) || 0)}
              className={`w-16 px-1.5 py-0.5 rounded border text-center font-mono font-bold ${
                isDark ? 'bg-[#030b18] border-[#102c54] text-white' : 'bg-white border-[#94a3b8] text-slate-900'
              }`}
            />
            <span>to</span>
            <input
              type="number"
              value={highRange}
              onChange={(e) => setHighRange(parseInt(e.target.value) || 4194303)}
              className={`w-20 px-1.5 py-0.5 rounded border text-center font-mono font-bold ${
                isDark ? 'bg-[#030b18] border-[#102c54] text-white' : 'bg-white border-[#94a3b8] text-slate-900'
              }`}
            />
          </div>

          <button
            onClick={() => onRunDiscovery(lowRange, highRange, targetNetwork)}
            disabled={isDiscovering}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
              isDiscovering
                ? 'bg-amber-600 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDiscovering ? 'animate-spin' : ''}`} />
            <span>{isDiscovering ? 'Broadcasting Who-Is...' : 'Scan Network (Who-Is)'}</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'explorer' && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Discovered Devices Table */}
          <div
            className={`${selectedDevice ? 'hidden md:flex' : 'flex'} w-full md:w-1/2 lg:w-5/12 flex-col border-r overflow-hidden ${
              isDark ? 'bg-[#06142a] border-[#0e274b]' : 'bg-[#f8fafc] border-[#cbd8e6]'
            }`}
          >
            {/* Filter Row */}
            <div
              className={`p-2.5 border-b flex items-center gap-2 ${
                isDark ? 'bg-[#081a36] border-[#0e274b]' : 'bg-[#edf4fb] border-[#cbd8e6]'
              }`}
            >
              <div
                className={`flex-1 flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs ${
                  isDark
                    ? 'bg-[#030b18] border-[#102c54] text-slate-200'
                    : 'bg-white border-[#b9cee2] text-slate-900'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter devices (Name, ID, IP, MAC)..."
                  className="w-full bg-transparent outline-none text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <select
                value={protocolFilter}
                onChange={(e) => setProtocolFilter(e.target.value)}
                className={`px-2 py-1 rounded-md border text-xs font-mono font-bold cursor-pointer ${
                  isDark
                    ? 'bg-[#030b18] border-[#102c54] text-slate-200'
                    : 'bg-white border-[#b9cee2] text-slate-900'
                }`}
              >
                <option value="all">All Protocols</option>
                <option value="BACnet/IP">BACnet/IP</option>
                <option value="BACnet MS/TP">BACnet MS/TP</option>
                <option value="Modbus TCP">Modbus TCP</option>
              </select>
            </div>

            {/* Devices List Table */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-300 dark:divide-slate-700/40 custom-scrollbar">
              {filteredDevices.length === 0 ? (
                <div className="p-8 text-center text-slate-600 dark:text-slate-300">
                  <Radio className="w-8 h-8 mx-auto mb-2 opacity-40 text-sky-500 animate-pulse" />
                  <p className="font-bold text-xs">No devices matched the filter</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Click "Scan Network (Who-Is)" to broadcast a new discovery
                  </p>
                </div>
              ) : (
                filteredDevices.map((dev) => {
                  const isSelected = selectedDevice?.id === dev.id;
                  const isMstp = dev.protocol === 'BACnet MS/TP';

                  return (
                    <div
                      key={dev.id}
                      onClick={() => onSelectDevice(dev)}
                      className={`p-3 cursor-pointer transition-all ${
                        isSelected
                          ? isDark
                            ? 'bg-[#00529b]/30 border-l-4 border-l-[#0080ff]'
                            : 'bg-sky-100 border-l-4 border-l-sky-600'
                          : isDark
                          ? 'hover:bg-slate-800/50'
                          : 'hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                dev.status === 'ok'
                                  ? 'bg-emerald-500'
                                  : dev.status === 'unackedAlarm'
                                  ? 'bg-amber-500 animate-ping'
                                  : 'bg-red-500'
                              }`}
                            />
                            <span className="font-extrabold text-xs text-sky-700 dark:text-sky-300 truncate">
                              {dev.name}
                            </span>
                            <span
                              className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded border font-bold ${
                                isMstp
                                  ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/40'
                                  : 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/40'
                              }`}
                            >
                              {dev.protocol}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate mt-0.5">
                            {dev.vendorName} • {dev.modelName}
                          </p>
                        </div>

                        {/* Device Instance ID Badge */}
                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800/40">
                            Dev: {dev.deviceInstance}
                          </span>
                        </div>
                      </div>

                      {/* Addressing & Ping Details Strip */}
                      <div className="mt-2 flex items-center justify-between text-[10.5px] font-mono text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          {isMstp ? (
                            <span className="font-semibold">MAC: {dev.macAddress} @ {dev.baudRate} Baud</span>
                          ) : (
                            <span className="font-semibold">IP: {dev.ipAddress}:{dev.port}</span>
                          )}
                          <span>Net: {dev.networkNumber}</span>
                        </div>

                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span>{dev.pingTimeMs}ms</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Helper Bar */}
            <div
              className={`p-2 border-t text-[10.5px] font-medium flex items-center justify-between ${
                isDark ? 'bg-[#040e1e] border-[#0e274b] text-slate-300' : 'bg-[#e5effa] border-[#cbd8e6] text-slate-800'
              }`}
            >
              <span>Showing {filteredDevices.length} of {devices.length} controllers</span>
            </div>
          </div>

          {/* Right Column: Selected Device Property Sheet & 16-Level Priority Array */}
          <div
            className={`${selectedDevice ? 'flex' : 'hidden md:flex'} w-full md:w-1/2 lg:w-7/12 flex flex-col overflow-hidden ${
              isDark ? 'bg-[#051124]' : 'bg-white'
            }`}
          >
            {selectedDevice ? (
              <div className="h-full flex flex-col overflow-hidden">
                {/* Device Header Profile Card */}
                <div
                  className={`p-3.5 border-b flex items-center justify-between gap-3 shrink-0 ${
                    isDark ? 'bg-[#091e3d] border-[#0e274b]' : 'bg-[#e9f2fb] border-[#cbd8e6]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Back Button on Mobile */}
                    <button
                      onClick={() => onSelectDevice(null)}
                      className="md:hidden p-1.5 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors mr-1 cursor-pointer"
                      title="Back to devices list"
                    >
                      <ArrowLeft className="w-4 h-4 text-slate-800 dark:text-slate-200" />
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                          {selectedDevice.name}
                        </h3>
                        <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                          [{selectedDevice.deviceInstance}]
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5 truncate">
                        {selectedDevice.vendorName} • Model: {selectedDevice.modelName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Device Properties & Objects View */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {/* Object Points Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                        <span>Discovered BACnet Objects ({currentObjects.length})</span>
                      </h4>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                        Click any point to view or write to 16-Level Priority Array
                      </span>
                    </div>

                    {currentObjects.length === 0 ? (
                      <div className="p-6 text-center border border-dashed rounded-lg text-slate-600 dark:text-slate-400 border-slate-400 dark:border-slate-700">
                        <p className="text-xs font-bold">No points discovered on this controller</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Click "Scan Network" to poll objects via ReadPropertyMultiple
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {currentObjects.map((obj) => {
                          const isNumeric = typeof obj.presentValue === 'number';
                          const isBoolean = typeof obj.presentValue === 'boolean';

                          return (
                            <div
                              key={obj.id}
                              className={`p-3 rounded-lg border transition-all ${
                                isDark
                                  ? 'bg-[#081b36] border-[#102d58] hover:border-sky-500/50'
                                  : 'bg-[#f4f9ff] border-[#c0d4ea] hover:border-sky-400'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[10px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800/40">
                                      {obj.type}:{obj.instance}
                                    </span>
                                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                      {obj.name}
                                    </span>
                                    {obj.statusFlags.inAlarm && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-900/60 text-red-300 border border-red-700 animate-pulse">
                                        IN ALARM
                                      </span>
                                    )}
                                    {obj.statusFlags.overridden && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300 border border-purple-700">
                                        OVERRIDDEN
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-0.5">{obj.description}</p>
                                </div>

                                {/* Present Value Card */}
                                <div className="text-right shrink-0">
                                  <div className="font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                                    {isBoolean
                                      ? obj.presentValue
                                        ? 'ACTIVE (ON)'
                                        : 'INACTIVE (OFF)'
                                      : `${obj.presentValue} ${obj.units || ''}`}
                                  </div>
                                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono font-semibold">Present_Value</span>
                                </div>
                              </div>

                              {/* Priority Array Inspector Accordion if present */}
                              {obj.priorityArray && (
                                <div className="mt-3 pt-2 border-t border-slate-300 dark:border-slate-700/40">
                                  <div className="flex items-center justify-between text-[10.5px] mb-1.5">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                      <SlidersHorizontal className="w-3 h-3 text-amber-500" />
                                      <span>16-Level Priority Array</span>
                                    </span>
                                    <span className="text-slate-600 dark:text-slate-400 font-mono text-[9.5px] font-medium">
                                      Relinquish Default: {String(obj.relinquishDefault ?? 'None')}
                                    </span>
                                  </div>

                                  {/* 16 Slots Grid */}
                                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 font-mono text-[10px]">
                                    {obj.priorityArray.map((slot) => {
                                      const hasValue = slot.value !== null && slot.value !== undefined;
                                      const isSlotEditing =
                                        editingSlot?.objectId === obj.id &&
                                        editingSlot?.priority === slot.priority;

                                      return (
                                        <div
                                          key={slot.priority}
                                          className={`p-1 rounded border text-center transition-all ${
                                            hasValue
                                              ? slot.priority === 8
                                                ? 'bg-purple-100 dark:bg-purple-950/60 border-purple-400 dark:border-purple-500 text-purple-900 dark:text-purple-300 font-bold'
                                                : slot.priority === 1
                                                ? 'bg-red-100 dark:bg-red-950/60 border-red-400 dark:border-red-500 text-red-900 dark:text-red-300 font-bold'
                                                : 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-500 text-emerald-900 dark:text-emerald-300 font-bold'
                                              : isDark
                                              ? 'bg-black/30 border-slate-800 text-slate-400'
                                              : 'bg-slate-100 border-slate-300 text-slate-600'
                                          }`}
                                        >
                                          <div className="text-[8.5px] opacity-80 font-bold">
                                            Pri {slot.priority}
                                            {slot.priority === 8 ? ' (Man)' : slot.priority === 1 ? ' (Emer)' : ''}
                                          </div>

                                          {isSlotEditing ? (
                                            <div className="mt-0.5 flex items-center gap-0.5">
                                              <input
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                placeholder="Val"
                                                className="w-full text-[9px] bg-black text-white px-0.5 rounded outline-none border border-sky-400"
                                                autoFocus
                                              />
                                              <button
                                                onClick={() => handleSavePrioritySlot(obj.id, slot.priority)}
                                                className="text-emerald-400 hover:text-emerald-300"
                                              >
                                                <Check className="w-2.5 h-2.5" />
                                              </button>
                                              <button
                                                onClick={() => setEditingSlot(null)}
                                                className="text-red-400 hover:text-red-300"
                                              >
                                                <X className="w-2.5 h-2.5" />
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="font-bold text-[10px] truncate mt-0.5">
                                              {hasValue ? String(slot.value) : 'null'}
                                            </div>
                                          )}

                                          {/* Quick Write / Relinquish Controls */}
                                          {!isSlotEditing && (
                                            <div className="mt-0.5 flex items-center justify-center gap-1 opacity-80 hover:opacity-100">
                                              <button
                                                onClick={() => {
                                                  setEditingSlot({ objectId: obj.id, priority: slot.priority });
                                                  setEditValue(hasValue ? String(slot.value) : '1');
                                                }}
                                                title={`Write to Priority ${slot.priority}`}
                                                className="text-sky-600 dark:text-sky-400 hover:text-sky-300 cursor-pointer font-bold"
                                              >
                                                <Edit2 className="w-2 h-2" />
                                              </button>
                                              {hasValue && (
                                                <button
                                                  onClick={() => onRelinquishPriority(selectedDevice.id, obj.id, slot.priority)}
                                                  title={`Relinquish (Release) Priority ${slot.priority}`}
                                                  className="text-red-600 dark:text-red-400 hover:text-red-300 cursor-pointer font-bold"
                                                >
                                                  <X className="w-2 h-2" />
                                                </button>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-700 dark:text-slate-300">
                <Network className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-3" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200">No Controller Selected</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mt-1">
                  Select a discovered BACnet controller from the left table to inspect its properties,
                  points, and 16-level priority array.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Network Topology Map View */}
      {activeTab === 'topology' && (
        <div
          className={`flex-1 p-6 overflow-y-auto custom-scrollbar ${
            isDark ? 'bg-[#040e1d]' : 'bg-[#f0f6fc]'
          }`}
        >
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Network className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Facility Field Bus & IP Topology Diagram</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                  Visual multi-drop bus & star topology showing JACE routing between BACnet/IP and RS-485 MS/TP channels
                </p>
              </div>
            </div>

            {/* Trunks & Connected Nodes Diagram */}
            <div className="space-y-6">
              {trunks.map((trunk) => {
                const trunkDevices = devices.filter((d) => d.networkNumber === trunk.networkNumber);
                const isMstp = trunk.protocol === 'BACnet MS/TP';

                return (
                  <div
                    key={trunk.id}
                    className={`p-4 rounded-xl border ${
                      isDark
                        ? 'bg-[#07162e] border-[#102d58]'
                        : 'bg-white border-[#cbd8e6] shadow-sm'
                    }`}
                  >
                    {/* Trunk Header */}
                    <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-700/30 pb-3 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-2 rounded-lg font-bold text-xs ${
                            isMstp
                              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40'
                              : 'bg-sky-100 dark:bg-sky-500/20 text-sky-900 dark:text-sky-300 border border-sky-300 dark:border-sky-500/40'
                          }`}
                        >
                          {trunk.protocol}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{trunk.name}</h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono font-medium">
                            Network #{trunk.networkNumber} • Interface: {trunk.interfaceName} • {trunk.portOrBaud}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {trunkDevices.length} Connected Nodes
                        </span>
                      </div>
                    </div>

                    {/* Visual Bus Strip / Daisy Chain */}
                    <div className="relative">
                      {/* Horizontal Bus Wire */}
                      <div className="absolute top-1/2 left-4 right-4 h-1 bg-gradient-to-r from-sky-600 via-emerald-500 to-amber-500 -translate-y-1/2 rounded-full opacity-60 z-0" />

                      {/* Nodes Grid */}
                      <div className="relative z-10 flex items-center gap-4 overflow-x-auto py-3 px-2 custom-scrollbar">
                        {trunkDevices.map((dev) => {
                          const isDevSelected = selectedDevice?.id === dev.id;

                          return (
                            <div
                              key={dev.id}
                              onClick={() => {
                                onSelectDevice(dev);
                                setActiveTab('explorer');
                              }}
                              className={`p-3 rounded-lg border shrink-0 w-48 cursor-pointer transition-all hover:scale-105 ${
                                isDevSelected
                                  ? 'bg-[#00529b] border-sky-400 text-white shadow-lg'
                                  : isDark
                                  ? 'bg-[#091f3e] border-[#183a6f] hover:border-sky-500 text-slate-200'
                                  : 'bg-slate-50 border-slate-300 hover:border-sky-500 text-slate-900'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {isMstp ? `MAC: ${dev.macAddress}` : `ID: ${dev.deviceInstance}`}
                                </span>
                                <span className="text-slate-600 dark:text-slate-400 font-medium">{dev.pingTimeMs}ms</span>
                              </div>

                              <div className="font-bold text-xs truncate" title={dev.name}>
                                {dev.name}
                              </div>
                              <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate mt-0.5 font-medium">
                                {dev.modelName}
                              </p>

                              <div className="mt-2 pt-1 border-t border-slate-300 dark:border-white/10 flex items-center justify-between text-[9px]">
                                <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{dev.objects.length} Objects</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase">{dev.status}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Live Point Trend View */}
      {activeTab === 'trend' && (
        <div
          className={`flex-1 p-6 overflow-y-auto custom-scrollbar ${
            isDark ? 'bg-[#040e1d]' : 'bg-[#f0f6fc]'
          }`}
        >
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Real-Time BACnet Point Oscilloscope & Trend Monitor</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Live multi-point time series stream with instant value updates
                </p>
              </div>
            </div>

            {/* Simulated Live Waveforms */}
            <div
              className={`p-6 rounded-xl border ${
                isDark ? 'bg-[#07162e] border-[#102d58]' : 'bg-white border-[#cbd8e6]'
              }`}
            >
              <div className="h-64 flex items-center justify-center border border-dashed rounded-lg border-slate-400 dark:border-slate-700/50 relative overflow-hidden bg-slate-950">
                {/* Background Grid Lines */}
                <div className="absolute inset-0 grid grid-cols-8 grid-rows-4 opacity-20 pointer-events-none">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div key={i} className="border border-sky-500" />
                  ))}
                </div>

                {/* Oscilloscope SVG Waves */}
                <svg className="w-full h-full p-4" viewBox="0 0 500 150">
                  {/* Outdoor Temp Wave (Blue) */}
                  <path
                    d="M 0,75 Q 75,50 150,75 T 300,75 T 450,75 L 500,75"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                  />
                  {/* Supply Air Temp Wave (Green) */}
                  <path
                    d="M 0,90 Q 60,60 120,90 T 240,90 T 360,90 T 480,90 L 500,90"
                    fill="none"
                    stroke="#4ade80"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                  {/* Static Pressure Wave (Amber) */}
                  <path
                    d="M 0,40 Q 50,45 100,40 T 200,40 T 300,40 T 400,40 L 500,40"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                  />
                </svg>

                <div className="absolute top-3 right-3 flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1 text-sky-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Outdoor Temp: 72.4°F
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Supply Temp: 55.2°F
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Static Press: 1.45 in.wg
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
