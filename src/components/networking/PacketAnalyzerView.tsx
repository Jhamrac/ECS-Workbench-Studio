import React, { useState, useMemo } from 'react';
import {
  Activity,
  Play,
  Pause,
  Trash2,
  Download,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  Info,
  HelpCircle,
  FileCode,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { CapturedPacket, ProtocolType } from '../../types/networking';
import { useNiagaraTheme } from '../../context/NiagaraThemeContext';

interface PacketAnalyzerViewProps {
  packets: CapturedPacket[];
  isCapturing: boolean;
  onToggleCapture: () => void;
  onClearPackets: () => void;
  onOpenAiAssist?: (prompt: string) => void;
}

export const PacketAnalyzerView: React.FC<PacketAnalyzerViewProps> = ({
  packets,
  isCapturing,
  onToggleCapture,
  onClearPackets,
}) => {
  const { theme, isDark } = useNiagaraTheme();

  const [selectedPacketId, setSelectedPacketId] = useState<string>(packets[0]?.id || '');
  const [filterText, setFilterText] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [expandedLayers, setExpandedLayers] = useState<Set<number>>(new Set([0, 1, 2, 3]));

  // Selected Packet
  const selectedPacket = useMemo(() => {
    return packets.find((p) => p.id === selectedPacketId) || packets[0] || null;
  }, [packets, selectedPacketId]);

  // Filtered Packets
  const filteredPackets = useMemo(() => {
    return packets.filter((p) => {
      const matchesText =
        filterText === '' ||
        p.summary.toLowerCase().includes(filterText.toLowerCase()) ||
        p.source.toLowerCase().includes(filterText.toLowerCase()) ||
        p.destination.toLowerCase().includes(filterText.toLowerCase()) ||
        p.service.toLowerCase().includes(filterText.toLowerCase()) ||
        p.packetNumber.toString().includes(filterText);

      const matchesProtocol =
        protocolFilter === 'all' || p.protocol === protocolFilter;

      const matchesService =
        serviceFilter === 'all' || p.service === serviceFilter;

      return matchesText && matchesProtocol && matchesService;
    });
  }, [packets, filterText, protocolFilter, serviceFilter]);

  const toggleLayer = (index: number) => {
    setExpandedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Export PCAP simulation
  const handleExportPcap = () => {
    const pcapHeader = 'BACnet Virtual Packet Capture File - Formatted for Wireshark & OptigoVN\n';
    const packetDump = packets
      .map(
        (p) =>
          `[#${p.packetNumber}] Time:${p.timeDisplay}s Delta:${p.deltaMs}ms Proto:${p.protocol} Service:${p.service}\nSrc: ${p.source} -> Dst: ${p.destination}\nHex: ${p.rawHex}\n`
      )
      .join('\n');
    const blob = new Blob([pcapHeader + packetDump], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bacnet_capture_${Date.now()}.pcap`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = 'Packet,Time,Delta(ms),Source,Destination,Protocol,Service,Length(B),Summary\n';
    const rows = packets
      .map(
        (p) =>
          `"${p.packetNumber}","${p.timeDisplay}","${p.deltaMs}","${p.source}","${p.destination}","${p.protocol}","${p.service}","${p.lengthBytes}","${p.summary.replace(/"/g, '""')}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bacnet_packets_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden font-sans select-none">
      {/* Top Protocol Filter & Capture Control Bar */}
      <div
        className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-2 shrink-0 ${
          isDark ? 'bg-[#081a36] border-[#0e274b]' : 'bg-[#eaf2fb] border-[#cbd8e6]'
        }`}
      >
        {/* Filter Input with Wireshark-Style Expression Syntax */}
        <div className="flex-1 flex items-center gap-2 min-w-[280px]">
          <div
            className={`flex-1 flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono ${
              isDark
                ? 'bg-[#030b18] border-[#102c54] text-slate-200'
                : 'bg-white border-[#b9cee2] text-slate-800'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder='Filter packets: e.g. "Who-Is", "ReadProperty", "192.168.1.101", "MAC: 1"...'
              className="w-full bg-transparent outline-none text-xs"
            />
            {filterText && (
              <button
                onClick={() => setFilterText('')}
                className="text-slate-400 hover:text-white"
              >
                ×
              </button>
            )}
          </div>

          <select
            value={protocolFilter}
            onChange={(e) => setProtocolFilter(e.target.value)}
            className={`px-2 py-1 rounded-md border text-xs font-mono cursor-pointer ${
              isDark ? 'bg-[#030b18] border-[#102c54] text-slate-200' : 'bg-white border-[#b9cee2]'
            }`}
          >
            <option value="all">All Protocols</option>
            <option value="BACnet/IP">BACnet/IP</option>
            <option value="BACnet MS/TP">BACnet MS/TP</option>
            <option value="Modbus TCP">Modbus TCP</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleCapture}
            className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
              isCapturing
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isCapturing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isCapturing ? 'Pause Capture' : 'Start Capture'}</span>
          </button>

          <button
            onClick={onClearPackets}
            title="Clear capture buffer"
            className="p-1.5 rounded-md border text-slate-600 dark:text-slate-400 hover:text-red-500 cursor-pointer border-slate-300 dark:border-slate-700/50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700/40" />

          <button
            onClick={handleExportPcap}
            title="Export as Wireshark PCAP format"
            className="px-2.5 py-1 rounded-md border text-xs font-bold flex items-center gap-1 bg-[#00529b] hover:bg-[#003e75] text-white cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export .pcap</span>
          </button>
        </div>
      </div>

      {/* Main 3-Pane Wireshark Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Pane 1: Packet Summary Table (Top Half) */}
        <div
          className={`h-1/2 border-b overflow-y-auto custom-scrollbar font-mono text-[11px] ${
            isDark ? 'bg-[#051124] border-[#0e274b]' : 'bg-white border-[#cbd8e6]'
          }`}
        >
          <table className="w-full text-left border-collapse">
            <thead
              className={`sticky top-0 z-10 border-b select-none font-bold ${
                isDark
                  ? 'bg-[#091f3e] border-[#102d58] text-slate-200'
                  : 'bg-[#e2eefb] border-[#cbd8e6] text-slate-900'
              }`}
            >
              <tr>
                <th className="py-1.5 px-2 w-14">No.</th>
                <th className="py-1.5 px-2 w-20">Time</th>
                <th className="py-1.5 px-2 w-16">Delta</th>
                <th className="py-1.5 px-2 w-44">Source</th>
                <th className="py-1.5 px-2 w-44">Destination</th>
                <th className="py-1.5 px-2 w-28">Protocol</th>
                <th className="py-1.5 px-2 w-36">Service / PDU</th>
                <th className="py-1.5 px-2 w-14">Len</th>
                <th className="py-1.5 px-2">Info Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/20">
              {filteredPackets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-600 dark:text-slate-400 font-sans text-xs font-medium">
                    No packets in buffer matching the current filter.
                  </td>
                </tr>
              ) : (
                filteredPackets.map((pkt) => {
                  const isSelected = selectedPacket?.id === pkt.id;

                  // Color row background according to protocol / status
                  let rowColor = '';
                  if (isSelected) {
                    rowColor = isDark ? 'bg-[#00529b] text-white font-bold' : 'bg-sky-200 text-sky-950 font-bold';
                  } else if (pkt.statusColor === 'green') {
                    rowColor = isDark ? 'hover:bg-emerald-950/30 text-emerald-300' : 'hover:bg-emerald-50 text-emerald-950';
                  } else if (pkt.statusColor === 'yellow') {
                    rowColor = isDark ? 'hover:bg-amber-950/30 text-amber-300' : 'hover:bg-amber-50 text-amber-950';
                  } else if (pkt.statusColor === 'red') {
                    rowColor = isDark ? 'hover:bg-red-950/30 text-red-300' : 'hover:bg-red-50 text-red-950';
                  } else if (pkt.statusColor === 'purple') {
                    rowColor = isDark ? 'hover:bg-purple-950/30 text-purple-300' : 'hover:bg-purple-50 text-purple-950';
                  } else {
                    rowColor = isDark ? 'hover:bg-slate-800/40 text-slate-200' : 'hover:bg-slate-100 text-slate-900';
                  }

                  return (
                    <tr
                      key={pkt.id}
                      onClick={() => setSelectedPacketId(pkt.id)}
                      className={`cursor-pointer transition-colors ${rowColor}`}
                    >
                      <td className="py-1 px-2">{pkt.packetNumber}</td>
                      <td className="py-1 px-2">{pkt.timeDisplay}</td>
                      <td className="py-1 px-2">{pkt.deltaMs > 0 ? `+${pkt.deltaMs}ms` : '0ms'}</td>
                      <td className="py-1 px-2 truncate max-w-[180px]">{pkt.source}</td>
                      <td className="py-1 px-2 truncate max-w-[180px]">{pkt.destination}</td>
                      <td className="py-1 px-2 font-bold">{pkt.protocol}</td>
                      <td className="py-1 px-2 truncate font-bold">{pkt.service}</td>
                      <td className="py-1 px-2">{pkt.lengthBytes}</td>
                      <td className="py-1 px-2 truncate max-w-[360px]">{pkt.summary}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pane 2 & 3: Bottom Half Split (Plain-English Summary + Dissector Tree + Raw Hex Dump) */}
        <div
          className={`h-1/2 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-300 dark:divide-slate-700/30 overflow-hidden ${
            isDark ? 'bg-[#040e1e]' : 'bg-[#f4f8fc]'
          }`}
        >
          {/* Left Sub-Pane: Plain English Translation Card & Dissector Tree */}
          <div className="w-full md:w-7/12 flex flex-col overflow-hidden">
            {selectedPacket ? (
              <div className="h-full flex flex-col overflow-hidden">
                {/* Technician-First: Plain English Helper Card */}
                <div
                  className={`p-3 border-b flex items-start gap-2.5 shrink-0 ${
                    selectedPacket.plainEnglishExplanation.severity === 'warning'
                      ? 'bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/40 text-amber-950 dark:text-amber-200'
                      : selectedPacket.plainEnglishExplanation.severity === 'error'
                      ? 'bg-red-100 dark:bg-red-950/40 border-red-300 dark:border-red-800/40 text-red-950 dark:text-red-200'
                      : isDark
                      ? 'bg-[#091f3e] border-[#102d58] text-sky-200'
                      : 'bg-sky-50 border-sky-200 text-sky-950'
                  }`}
                >
                  <div className="p-1 rounded bg-black/10 dark:bg-black/20 shrink-0 mt-0.5">
                    <Info className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-xs">
                      {selectedPacket.plainEnglishExplanation.headline}
                    </h4>
                    <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed font-medium">
                      {selectedPacket.plainEnglishExplanation.description}
                    </p>
                    <p className="text-[10.5px] font-mono opacity-90 mt-1">
                      💡 <strong>Field Advice:</strong> {selectedPacket.plainEnglishExplanation.technicianAdvice}
                    </p>
                  </div>
                </div>

                {/* Dissector Layer Accordion */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar font-mono text-[11px]">
                  <h5 className="font-sans font-bold text-[11px] uppercase tracking-wider text-slate-800 dark:text-slate-300 mb-2">
                    Packet Protocol Dissector Tree
                  </h5>

                  {selectedPacket.layers.map((layer, idx) => {
                    const isExpanded = expandedLayers.has(idx);

                    return (
                      <div
                        key={idx}
                        className={`rounded border overflow-hidden ${
                          isDark ? 'border-slate-800 bg-[#06142a]' : 'border-slate-300 bg-white'
                        }`}
                      >
                        <div
                          onClick={() => toggleLayer(idx)}
                          className={`p-2 flex items-center justify-between cursor-pointer ${
                            isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            )}
                            <span className="font-bold text-xs text-sky-700 dark:text-sky-400">{layer.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-600 dark:text-slate-300 truncate max-w-[240px] font-medium">
                            {layer.summary}
                          </span>
                        </div>

                        {isExpanded && (
                          <div
                            className={`p-2 border-t space-y-1 text-[10.5px] ${
                              isDark ? 'border-slate-800/80 bg-black/20' : 'border-slate-200 bg-slate-50'
                            }`}
                          >
                            {layer.details.map((detail, dIdx) => (
                              <div key={dIdx} className="flex items-center justify-between">
                                <span className="text-slate-600 dark:text-slate-400 font-medium">{detail.key}:</span>
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  {String(detail.value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-6 text-center text-slate-600 dark:text-slate-400 font-sans text-xs font-medium">
                Select a packet to decode its layer hierarchy
              </div>
            )}
          </div>

          {/* Right Sub-Pane: Raw Hex & ASCII Payload Dump */}
          <div className="w-full md:w-5/12 flex flex-col overflow-hidden">
            <div
              className={`p-2 border-b flex items-center justify-between shrink-0 ${
                isDark ? 'bg-[#091f3e] border-[#102d58]' : 'bg-[#e2eefb] border-[#cbd8e6]'
              }`}
            >
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-200">
                Raw Byte Payload Dump
              </span>
              <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 font-bold">
                {selectedPacket ? `${selectedPacket.lengthBytes} Bytes` : '0 Bytes'}
              </span>
            </div>

            <div
              className={`flex-1 p-3 overflow-y-auto font-mono text-[11px] leading-relaxed custom-scrollbar ${
                isDark ? 'bg-[#020712] text-emerald-400' : 'bg-slate-900 text-emerald-300'
              }`}
            >
              {selectedPacket ? (
                <div>
                  <div className="text-slate-400 mb-2 font-medium">
                    0000 0001 0002 0003 0004 0005 0006 0007 | ASCII
                  </div>
                  <div className="whitespace-pre-wrap font-mono">
                    {selectedPacket.rawHex}
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800 text-sky-400 font-bold">
                    ASCII: {selectedPacket.rawAscii}
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 font-medium">No packet data loaded</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
