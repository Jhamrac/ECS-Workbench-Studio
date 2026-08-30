import React, { useState } from 'react';
import {
  Search,
  Radio,
  Activity,
  Layers,
  Terminal,
  Cpu,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Folder,
  FolderOpen,
  Wifi,
  Globe,
  Sliders,
  FileSpreadsheet,
  AlertTriangle,
  Play,
  Pause,
  ArrowRight,
  ShieldCheck,
  Zap,
  PanelLeftClose,
} from 'lucide-react';
import { NetworkingToolSubView } from '../../types/networking';
import { useNiagaraTheme } from '../../context/NiagaraThemeContext';

interface NetworkingToolsTreeProps {
  activeSubView: NetworkingToolSubView;
  onSelectSubView: (view: NetworkingToolSubView) => void;
  deviceCount?: number;
  packetCount?: number;
  healthScore?: number;
  isCapturing?: boolean;
  onToggleCapture?: () => void;
  onRunDiscovery?: () => void;
  isDiscovering?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenAiAssist?: () => void;
}

interface ToolCategory {
  id: string;
  name: string;
  subView: NetworkingToolSubView;
  icon: React.FC<{ className?: string }>;
  description: string;
  items: {
    id: string;
    label: string;
    subView: NetworkingToolSubView;
    plainDesc: string;
  }[];
}

export const NetworkingToolsTree: React.FC<NetworkingToolsTreeProps> = ({
  activeSubView,
  onSelectSubView,
  deviceCount = 10,
  packetCount = 124,
  healthScore = 98,
  isCapturing = true,
  onToggleCapture,
  onRunDiscovery,
  isDiscovering = false,
  onClose,
}) => {
  const { theme, isDark } = useNiagaraTheme();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Folders start completely collapsed
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const categories: ToolCategory[] = [
    {
      id: 'cat_discovery',
      name: 'Device & Object Discovery',
      subView: 'discovery',
      icon: Radio,
      description: 'Who-Is / I-Am scan, interactive topology map, 16-level priority arrays, and live point trends',
      items: [
        {
          id: 'item_whois',
          label: 'Network Who-Is / I-Am Discovery',
          subView: 'discovery',
          plainDesc: 'Scan subnet or serial trunks for new or existing controllers',
        },
        {
          id: 'item_topology',
          label: 'Interactive Topology & Bus Map',
          subView: 'discovery',
          plainDesc: 'Visual star & daisy-chain trunk layout with live ping status',
        },
        {
          id: 'item_objects',
          label: 'Object & Property Sheet Inspector',
          subView: 'discovery',
          plainDesc: 'View and override analog/binary points with priority array release',
        },
        {
          id: 'item_trend',
          label: 'Real-Time Point Trend Monitor',
          subView: 'discovery',
          plainDesc: 'Multi-point live time-series wave grapher',
        },
      ],
    },
    {
      id: 'cat_analyzer',
      name: 'Packet Capture & Protocol Analyzer',
      subView: 'packet_analyzer',
      icon: Activity,
      description: 'Live BVLC/NPDU/APDU packet stream with plain-English service decoder and PCAP export',
      items: [
        {
          id: 'item_stream',
          label: 'Live Packet Capture Stream',
          subView: 'packet_analyzer',
          plainDesc: 'Rolling buffer of all network transactions with filter bar',
        },
        {
          id: 'item_dissector',
          label: 'APDU / NPDU / BVLC Dissector',
          subView: 'packet_analyzer',
          plainDesc: 'Expandable OSI layer decode with synchronized hex highlighting',
        },
        {
          id: 'item_plain_english',
          label: 'Plain-English Service Decoder',
          subView: 'packet_analyzer',
          plainDesc: 'Human explanations of what each packet means and why it happened',
        },
        {
          id: 'item_pcap_export',
          label: 'PCAP & CSV Capture Export',
          subView: 'packet_analyzer',
          plainDesc: 'Export live capture buffer directly as .pcap or spreadsheet',
        },
      ],
    },
    {
      id: 'cat_health',
      name: 'Network Health & Traffic Diagnostics',
      subView: 'health_diagnostics',
      icon: ShieldCheck,
      description: 'Subnet health scoring, duplicate ID / MAC collision detector, and MS/TP token ring analyzer',
      items: [
        {
          id: 'item_health_score',
          label: 'Subnet Health Score & KPIs',
          subView: 'health_diagnostics',
          plainDesc: 'Real-time grading of bus quality, retry rates, and bandwidth',
        },
        {
          id: 'item_collisions',
          label: 'Duplicate ID & MAC Collision Detector',
          subView: 'health_diagnostics',
          plainDesc: 'Instant flags for overlapping Device IDs or conflicting MACs',
        },
        {
          id: 'item_token_ring',
          label: 'MS/TP Token Ring Gap Analyzer',
          subView: 'health_diagnostics',
          plainDesc: 'Token pass visualization, missing node gaps, and CRC errors',
        },
        {
          id: 'item_broadcast_storm',
          label: 'Broadcast Storm & Bandwidth Gauge',
          subView: 'health_diagnostics',
          plainDesc: 'Monitors broadcast-to-unicast ratio to prevent network flooding',
        },
      ],
    },
    {
      id: 'cat_terminal',
      name: 'Serial Bus & RS-485 Terminal',
      subView: 'serial_terminal',
      icon: Terminal,
      description: 'RS-485 terminal console with raw hex/ASCII stream, baud switcher, and command injector',
      items: [
        {
          id: 'item_rs485_console',
          label: 'RS-485 Serial Console',
          subView: 'serial_terminal',
          plainDesc: 'Direct serial interface with 9600 to 115200 baud selector',
        },
        {
          id: 'item_raw_hex',
          label: 'Raw Hex & ASCII Stream (55 FF)',
          subView: 'serial_terminal',
          plainDesc: 'Live byte-by-byte serial dump with frame interpretation',
        },
        {
          id: 'item_injector',
          label: 'Frame & Command Injector',
          subView: 'serial_terminal',
          plainDesc: 'Send custom hex frames or test strings directly to any bus node',
        },
      ],
    },
    {
      id: 'cat_testing',
      name: 'Protocol Verification & Testing',
      subView: 'protocol_test',
      icon: Zap,
      description: 'APDU test frame generator, fault/error response simulator, and profile verifier',
      items: [
        {
          id: 'item_apdu_test',
          label: 'APDU Test Frame Generator',
          subView: 'protocol_test',
          plainDesc: 'Send forced ReadProperty, WriteProperty, or TimeSync frames',
        },
        {
          id: 'item_fault_simulator',
          label: 'Fault & Error Response Simulator',
          subView: 'protocol_test',
          plainDesc: 'Simulate buffer overflow, write-access-denied, and timeout reactions',
        },
        {
          id: 'item_btl_profiles',
          label: 'Device Profile Verification',
          subView: 'protocol_test',
          plainDesc: 'Check device compliance against standard BACnet profiles',
        },
      ],
    },
    {
      id: 'cat_snapshot',
      name: 'Snapshot & Config Comparator',
      subView: 'snapshot_diff',
      icon: FileSpreadsheet,
      description: 'Capture commissioning baseline snapshots and compare side-by-side with live field state',
      items: [
        {
          id: 'item_baseline_cap',
          label: 'Commissioning Baseline Snapshot',
          subView: 'snapshot_diff',
          plainDesc: 'Save a permanent record of all devices, firmware, and points',
        },
        {
          id: 'item_live_diff',
          label: 'Live vs. Baseline Comparison Diff',
          subView: 'snapshot_diff',
          plainDesc: 'Highlights added devices, missing controllers, and altered parameters',
        },
        {
          id: 'item_ede_tool',
          label: 'Engineering Data Exchange (EDE)',
          subView: 'snapshot_diff',
          plainDesc: 'Import and export standard engineering point schedules',
        },
      ],
    },
    {
      id: 'cat_gateways',
      name: 'Multi-Protocol Gateways',
      subView: 'multi_protocol',
      icon: Globe,
      description: 'Modbus TCP/RTU register explorer, Niagara Fox/FoxS interconnect, and MQTT telemetry',
      items: [
        {
          id: 'item_modbus_reg',
          label: 'Modbus TCP / RTU Gateway',
          subView: 'multi_protocol',
          plainDesc: 'Register poll tables, coil statuses, and float endianness converter',
        },
        {
          id: 'item_fox_interconnect',
          label: 'ECS Workbench Studio Interconnect (Fox)',
          subView: 'multi_protocol',
          plainDesc: 'Studio-to-station Fox link ping and certificate status',
        },
        {
          id: 'item_mqtt_broker',
          label: 'MQTT Telemetry Broker',
          subView: 'multi_protocol',
          plainDesc: 'IoT topic tree explorer with JSON payload inspector',
        },
      ],
    },
  ];

  const toggleCategory = (catId: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const filteredCategories = categories
    .map((cat) => {
      const matchesCat =
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchTerm.toLowerCase());
      const filteredItems = cat.items.filter(
        (item) =>
          item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.plainDesc.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (matchesCat || filteredItems.length > 0) {
        return {
          ...cat,
          items: filteredItems.length > 0 ? filteredItems : cat.items,
        };
      }
      return null;
    })
    .filter(Boolean) as ToolCategory[];

  return (
    <div
      className={`h-full flex flex-col select-none font-sans text-xs border-r ${
        isDark
          ? 'bg-[#051124] border-[#0e274b] text-slate-100'
          : 'bg-[#f4f8fc] border-[#cbd8e6] text-slate-900'
      }`}
    >
      {/* Header Banner */}
      <div
        className={`px-3 py-2.5 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'bg-[#071832] border-[#0e274b]' : 'bg-[#e5effa] border-[#cbd8e6]'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded bg-[#00529b] text-white shrink-0">
            <Radio className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-extrabold text-[12px] uppercase tracking-wider text-sky-950 dark:text-sky-300 truncate">
              Networking Tools
            </h2>
            <p className="text-[10px] text-slate-900 dark:text-slate-200 font-bold truncate">
              BAS Protocols & Diagnostics
            </p>
          </div>
        </div>

        {/* Collapsible Sidebar Button */}
        {onClose && (
          <button
            id="networking-sidebar-collapse-btn"
            onClick={onClose}
            title="Collapse Nav Tree"
            className={`p-1 rounded cursor-pointer transition-colors shrink-0 ${
              isDark
                ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Action Strip (Run Who-Is Discovery + Toggle Capture) */}
      <div
        className={`px-3 py-2 border-b grid grid-cols-2 gap-1.5 shrink-0 ${
          isDark ? 'bg-[#081b38] border-[#0e274b]' : 'bg-[#edf4fb] border-[#cbd8e6]'
        }`}
      >
        <button
          onClick={onRunDiscovery}
          disabled={isDiscovering}
          className={`px-2 py-1.5 rounded font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
            isDiscovering
              ? 'bg-amber-600 text-white animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
          title="Broadcast Who-Is across all subnets to discover connected devices"
        >
          <RefreshCw className={`w-3 h-3 ${isDiscovering ? 'animate-spin' : ''}`} />
          <span>{isDiscovering ? 'Scanning...' : 'Run Who-Is'}</span>
        </button>

        <button
          onClick={onToggleCapture}
          className={`px-2 py-1.5 rounded font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
            isCapturing
              ? 'bg-sky-600 hover:bg-sky-500 text-white'
              : isDark
              ? 'bg-slate-700 hover:bg-slate-600 text-white'
              : 'bg-slate-300 hover:bg-slate-400 text-slate-950'
          }`}
          title="Start or pause real-time packet capture on all virtual network ports"
        >
          {isCapturing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          <span>{isCapturing ? 'Capturing' : 'Capture'}</span>
        </button>
      </div>

      {/* Search Input Filter */}
      <div className="p-2 shrink-0">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${
            isDark
              ? 'bg-[#030b18] border-[#102c54] text-white focus-within:border-sky-400'
              : 'bg-white border-[#94a3b8] text-slate-950 focus-within:border-sky-600'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-slate-800 dark:text-slate-200 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search networking tools..."
            className="w-full bg-transparent outline-none text-[11px] font-bold text-slate-950 dark:text-white placeholder:text-slate-600 dark:placeholder:text-slate-300"
          />
        </div>
      </div>

      {/* Scrollable Tool Categories & Items */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1.5 custom-scrollbar">
        {filteredCategories.map((cat) => {
          const isExpanded = expandedCats.has(cat.id) || searchTerm.length > 0;
          const isCatActive = activeSubView === cat.subView;
          const CatIcon = cat.icon;

          return (
            <div
              key={cat.id}
              className={`rounded-lg border transition-colors overflow-hidden ${
                isCatActive
                  ? isDark
                    ? 'border-sky-400 bg-[#0a234a]'
                    : 'border-sky-500 bg-[#e8f2fc]'
                  : isDark
                  ? 'border-slate-700 bg-[#07152b]'
                  : 'border-slate-300 bg-white shadow-xs'
              }`}
            >
              {/* Category Header */}
              <div
                onClick={() => toggleCategory(cat.id)}
                className={`p-2 flex items-center justify-between cursor-pointer transition-colors ${
                  isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSubView(cat.subView);
                    }}
                    className={`p-1.5 rounded-md shrink-0 ${
                      isCatActive
                        ? 'bg-[#00529b] text-white'
                        : isDark
                        ? 'bg-slate-800 text-slate-100'
                        : 'bg-slate-200 text-slate-900'
                    }`}
                  >
                    <CatIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate text-left">
                    <span className="font-extrabold text-[11px] block truncate text-slate-950 dark:text-white">
                      {cat.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-800 dark:text-slate-200" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-800 dark:text-slate-200" />
                  )}
                </div>
              </div>

              {/* Sub-Items List */}
              {isExpanded && (
                <div
                  className={`border-t px-1.5 py-1 space-y-0.5 ${
                    isDark ? 'border-slate-700 bg-[#040e1d]' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  {cat.items.map((item) => {
                    const isItemActive = activeSubView === item.subView;

                    return (
                      <button
                        key={item.id}
                        onClick={() => onSelectSubView(item.subView)}
                        className={`w-full text-left p-1.5 rounded-md flex flex-col gap-0.5 transition-colors cursor-pointer ${
                          isItemActive
                            ? isDark
                              ? 'bg-sky-900/60 text-white border border-sky-400'
                              : 'bg-sky-100 text-sky-950 border border-sky-400'
                            : isDark
                            ? 'hover:bg-slate-800 text-slate-100 border border-transparent'
                            : 'hover:bg-slate-200 text-slate-950 border border-transparent'
                        }`}
                      >
                        <span className="font-extrabold text-[11px] truncate text-slate-950 dark:text-white">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-slate-800 dark:text-slate-200 font-semibold line-clamp-1">
                          {item.plainDesc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Network Quick Health Strip */}
      <div
        className={`p-2.5 border-t text-[10px] flex items-center justify-between shrink-0 font-mono ${
          isDark ? 'bg-[#040e1e] border-[#0e274b]' : 'bg-[#e5effa] border-[#cbd8e6]'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-950 dark:text-slate-200 font-bold">Virtual BAS Bus</span>
        </div>
        <div className="font-extrabold text-emerald-700 dark:text-emerald-400">47808 (BAC0)</div>
      </div>
    </div>
  );
};
