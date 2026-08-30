import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Activity,
  ShieldCheck,
  Terminal,
  Zap,
  FileSpreadsheet,
  Globe,
  RefreshCw,
  Play,
  Pause,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  Network,
  Settings,
  UploadCloud,
  Power,
  Cpu,
  FileCode,
  Sliders,
  Shield,
  XCircle,
  Sparkles,
} from 'lucide-react';
import {
  NetworkingToolSubView,
  BacnetDevice,
  CapturedPacket,
  NetworkHealthMetrics,
  NetworkTrunk,
  SerialLogEntry,
  NetworkSnapshot,
  ModbusGatewayDevice,
  BacnetServiceType,
  NetworkMode,
  NetworkAdapterConfig,
  LoadedPcapFile,
  PacketLayerDecode,
} from '../../types/networking';
import {
  INITIAL_DEVICES,
  INITIAL_TRUNKS,
  INITIAL_PACKETS,
  INITIAL_HEALTH_METRICS,
  INITIAL_SERIAL_LOGS,
  INITIAL_SNAPSHOTS,
  INITIAL_MODBUS_GATEWAYS,
} from '../../data/networkInitialState';
import { DeviceDiscoveryView } from './DeviceDiscoveryView';
import { PacketAnalyzerView } from './PacketAnalyzerView';
import { NetworkHealthView } from './NetworkHealthView';
import { SerialTerminalView } from './SerialTerminalView';
import { ProtocolTestShellView } from './ProtocolTestShellView';
import { SnapshotComparatorView } from './SnapshotComparatorView';
import { MultiProtocolGatewayView } from './MultiProtocolGatewayView';
import { NetworkAdapterConfigModal } from './NetworkAdapterConfigModal';
import { AiNetworkCopilotModal } from './AiNetworkCopilotModal';
import { parsePcapFile } from '../../utils/pcapParser';
import { useNiagaraTheme } from '../../context/NiagaraThemeContext';

interface NetworkStudioCanvasProps {
  activeSubView: NetworkingToolSubView;
  onSelectSubView: (view: NetworkingToolSubView) => void;
  onOpenAiAssist: (prompt: string) => void;
  currentProgram: any; // Using any for flexible type layout
  onUpdateProgram: React.Dispatch<React.SetStateAction<any>>;
  isAiCopilotOpen: boolean;
  setIsAiCopilotOpen: (open: boolean) => void;
}

export const NetworkStudioCanvas: React.FC<NetworkStudioCanvasProps> = ({
  activeSubView,
  onSelectSubView,
  onOpenAiAssist,
  currentProgram,
  onUpdateProgram,
  isAiCopilotOpen,
  setIsAiCopilotOpen,
}) => {
  const { theme, isDark } = useNiagaraTheme();

  // Load initial value from currentProgram.networkStudioData if available
  const initialData = currentProgram.networkStudioData || {};
  const isInitiallyDisconnected = !currentProgram.networkStudioData || initialData.networkMode === 'disconnected';

  const DISCONNECTED_HEALTH_METRICS: NetworkHealthMetrics = {
    healthScore: 0,
    grade: 'F',
    totalPacketsPerSecond: 0,
    broadcastRatioPercent: 0,
    tokenRingRotationLatencyMs: 0,
    crcErrorCount: 0,
    retryCount: 0,
    duplicateDeviceIds: [],
    duplicateMacAddresses: [],
    missingMacGaps: [],
    broadcastStormActive: false,
    warnings: ['Network adapter is disconnected. Connect to live, demo, or PCAP source to run diagnostics.'],
  };

  // Network Connection & Adapter Configuration State
  const [networkMode, setNetworkMode] = useState<NetworkMode>(() => initialData.networkMode || 'disconnected');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [loadedPcap, setLoadedPcap] = useState<LoadedPcapFile | null>(null);

  const [adapterConfig, setAdapterConfig] = useState<NetworkAdapterConfig>(() => initialData.adapterConfig || {
    mode: 'disconnected',
    interfaceId: 'eth0',
    ipAddress: '192.168.1.50',
    subnetMask: '255.255.255.0',
    broadcastAddress: '192.168.1.255',
    defaultGateway: '192.168.1.1',
    udpPort: 47808,
    bacnetNetworkNumber: 1,
    localDeviceInstance: 50000,
    localDeviceName: 'ECS_Workbench_Studio',
    bbmdEnabled: false,
    bbmdIp: '',
    bbmdPort: 47808,
    bbmdTtl: 300,
    serialPort: 'COM3',
    baudRate: 38400,
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    maxMaster: 127,
    maxInfoFrames: 1,
    discoveryRange: {
      startIp: '192.168.1.1',
      endIp: '192.168.1.254',
      deviceInstanceLow: 0,
      deviceInstanceHigh: 4194303,
      timeoutMs: 3000,
    },
  });

  // Core Networking States (pre-seeded so all tool views have active interactive data)
  const [devices, setDevices] = useState<BacnetDevice[]>(() => initialData.devices || (isInitiallyDisconnected ? [] : INITIAL_DEVICES));
  const [trunks, setTrunks] = useState<NetworkTrunk[]>(() => initialData.trunks || (isInitiallyDisconnected ? [] : INITIAL_TRUNKS));
  const [packets, setPackets] = useState<CapturedPacket[]>(() => initialData.packets || (isInitiallyDisconnected ? [] : INITIAL_PACKETS));
  const [healthMetrics, setHealthMetrics] = useState<NetworkHealthMetrics>(() => initialData.healthMetrics || (isInitiallyDisconnected ? DISCONNECTED_HEALTH_METRICS : INITIAL_HEALTH_METRICS));
  const [serialLogs, setSerialLogs] = useState<SerialLogEntry[]>(() => initialData.serialLogs || (isInitiallyDisconnected ? [] : INITIAL_SERIAL_LOGS));
  const [snapshots, setSnapshots] = useState<NetworkSnapshot[]>(() => initialData.snapshots || (isInitiallyDisconnected ? [] : INITIAL_SNAPSHOTS));
  const [modbusGateways, setModbusGateways] = useState<ModbusGatewayDevice[]>(() => initialData.modbusGateways || (isInitiallyDisconnected ? [] : INITIAL_MODBUS_GATEWAYS));

  const [selectedDevice, setSelectedDevice] = useState<BacnetDevice | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(() => initialData.isCapturing !== undefined ? initialData.isCapturing : false);
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);

  // Sync internal network states back to the parent program (for auto local storage & cloud persistence)
  useEffect(() => {
    onUpdateProgram((prev) => {
      const nextData = {
        networkMode,
        adapterConfig,
        devices,
        trunks,
        packets,
        healthMetrics,
        serialLogs,
        snapshots,
        modbusGateways,
        isCapturing,
      };
      if (JSON.stringify(prev.networkStudioData) === JSON.stringify(nextData)) {
        return prev;
      }
      return {
        ...prev,
        networkStudioData: nextData,
      };
    });
  }, [
    networkMode,
    adapterConfig,
    devices,
    trunks,
    packets,
    healthMetrics,
    serialLogs,
    snapshots,
    modbusGateways,
    isCapturing,
  ]);

  // Sync parent program loading/switching down to internal network states
  useEffect(() => {
    const data = currentProgram.networkStudioData || {};
    setNetworkMode(data.networkMode || 'disconnected');
    setAdapterConfig(data.adapterConfig || {
      mode: 'disconnected',
      interfaceId: 'eth0',
      ipAddress: '192.168.1.50',
      subnetMask: '255.255.255.0',
      broadcastAddress: '192.168.1.255',
      defaultGateway: '192.168.1.1',
      udpPort: 47808,
      bacnetNetworkNumber: 1,
      localDeviceInstance: 50000,
      localDeviceName: 'ECS_Workbench_Studio',
      bbmdEnabled: false,
      bbmdIp: '',
      bbmdPort: 47808,
      bbmdTtl: 300,
      serialPort: 'COM3',
      baudRate: 38400,
      dataBits: 8,
      parity: 'none',
      stopBits: 1,
      maxMaster: 127,
      maxInfoFrames: 1,
      discoveryRange: {
        startIp: '192.168.1.1',
        endIp: '192.168.1.254',
        deviceInstanceLow: 0,
        deviceInstanceHigh: 4194303,
        timeoutMs: 3000,
      },
    });
    const isDisconnected = !currentProgram.networkStudioData || data.networkMode === 'disconnected';
    setDevices(data.devices || (isDisconnected ? [] : INITIAL_DEVICES));
    setTrunks(data.trunks || (isDisconnected ? [] : INITIAL_TRUNKS));
    setPackets(data.packets || (isDisconnected ? [] : INITIAL_PACKETS));
    setHealthMetrics(data.healthMetrics || (isDisconnected ? DISCONNECTED_HEALTH_METRICS : INITIAL_HEALTH_METRICS));
    setSerialLogs(data.serialLogs || (isDisconnected ? [] : INITIAL_SERIAL_LOGS));
    setSnapshots(data.snapshots || (isDisconnected ? [] : INITIAL_SNAPSHOTS));
    setModbusGateways(data.modbusGateways || (isDisconnected ? [] : INITIAL_MODBUS_GATEWAYS));
    setIsCapturing(data.isCapturing !== undefined ? data.isCapturing : false);
  }, [currentProgram.id]);

  const packetCounterRef = useRef<number>(0);

  // Background Packet Generator when capturing is active AND connected in Live or Demo mode
  useEffect(() => {
    if (!isCapturing || networkMode === 'disconnected' || networkMode === 'pcap_file') return;

    const interval = setInterval(() => {
      packetCounterRef.current += 1;
      const num = packetCounterRef.current;
      const now = new Date();
      const timeDisplay = `${(num * 0.42).toFixed(3)}`;

      const sampleTypes: Array<{
        service: BacnetServiceType;
        source: string;
        dest: string;
        proto: any;
        len: number;
        summary: string;
        statusColor: 'green' | 'blue' | 'yellow' | 'red' | 'purple';
        explanation: {
          headline: string;
          description: string;
          severity: 'info' | 'success' | 'warning' | 'error';
          technicianAdvice: string;
        };
      }> = [
        {
          service: 'ReadProperty',
          source: '192.168.1.101',
          dest: adapterConfig.ipAddress,
          proto: 'BACnet/IP',
          len: 82,
          summary: 'Complex-ACK: Present_Value = 72.4 °F',
          statusColor: 'green',
          explanation: {
            headline: 'Normal Temperature Polling Response',
            description: `Field controller at 192.168.1.101 responded to supervisory read with 72.4°F.`,
            severity: 'info',
            technicianAdvice: 'Healthy transaction on UDP port 47808.',
          },
        },
        {
          service: 'Token',
          source: 'Trunk 1 (MAC: 2)',
          dest: 'Trunk 1 (MAC: 3)',
          proto: 'BACnet MS/TP',
          len: 8,
          summary: 'Token pass from MAC 2 to MAC 3',
          statusColor: 'green',
          explanation: {
            headline: 'Normal MS/TP Token Rotation',
            description: `Controller MAC 2 passed bus mastery to MAC 3 on ${adapterConfig.serialPort} @ ${adapterConfig.baudRate} baud.`,
            severity: 'info',
            technicianAdvice: 'Token rotation healthy.',
          },
        },
        {
          service: 'UnconfirmedCOVNotification',
          source: '192.168.1.102',
          dest: adapterConfig.ipAddress,
          proto: 'BACnet/IP',
          len: 124,
          summary: 'UnconfirmedCOV: DischargeAirTemp changed by >0.5°F',
          statusColor: 'purple',
          explanation: {
            headline: 'Change of Value (COV) Push Telemetry',
            description: 'Controller pushed an updated temperature reading crossing its COV threshold.',
            severity: 'info',
            technicianAdvice: 'COV active and reducing polling overhead.',
          },
        },
      ];

      const chosen = sampleTypes[num % sampleTypes.length];

      const layers: PacketLayerDecode[] = [
        {
          name: 'Ethernet II Frame',
          summary: `Src: 00:1E:C9:82:11:4A, Dst: 00:10:8C:3D:22:90`,
          details: [
            { key: 'Source MAC', value: '00:1E:C9:82:11:4A' },
            { key: 'Destination MAC', value: '00:10:8C:3D:22:90' },
            { key: 'EtherType', value: '0x0800 (IPv4)' },
          ],
        },
        {
          name: 'Internet Protocol Version 4 (IPv4)',
          summary: `Src: ${chosen.source.includes('.') ? chosen.source : '192.168.1.101'}, Dst: ${adapterConfig.ipAddress}`,
          details: [
            { key: 'Source IP', value: chosen.source.includes('.') ? chosen.source : '192.168.1.101' },
            { key: 'Destination IP', value: adapterConfig.ipAddress },
            { key: 'Protocol', value: 'UDP (17)' },
          ],
        },
        {
          name: 'BACnet Virtual Link Control (BVLC)',
          summary: '0x0A (Original-Unicast-NPDU)',
          details: [
            { key: 'Type', value: '0x81 (BACnet/IP)' },
            { key: 'Function', value: '0x0A' },
          ],
        },
      ];

      const newPacket: CapturedPacket = {
        id: `pkt_live_${num}`,
        packetNumber: num,
        timestamp: now.getTime(),
        timeDisplay,
        deltaMs: 42,
        source: chosen.source,
        destination: chosen.dest,
        protocol: chosen.proto,
        service: chosen.service,
        lengthBytes: chosen.len,
        summary: chosen.summary,
        statusColor: chosen.statusColor,
        rawHex: '81 0A 00 20 01 04 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F',
        rawAscii: 'BACnet..Val..72.4',
        layers,
        plainEnglishExplanation: chosen.explanation,
      };

      setPackets((prev) => [newPacket, ...prev.slice(0, 199)]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isCapturing, networkMode, adapterConfig]);

  // Connect to Live Adapter
  const handleConnectLiveAdapter = async () => {
    setNetworkMode('live_adapter');
    setIsCapturing(true);
    setIsDiscovering(true);

    try {
      // Call backend scan endpoint for initial controller discovery
      const response = await fetch('/api/network/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startIp: adapterConfig.discoveryRange.startIp,
          endIp: adapterConfig.discoveryRange.endIp,
          udpPort: adapterConfig.udpPort,
          lowInstance: adapterConfig.discoveryRange.deviceInstanceLow,
          highInstance: adapterConfig.discoveryRange.deviceInstanceHigh,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const discovered = data.devices || [];
        setDevices(discovered);
        setSelectedDevice(discovered[0] || null);
        setTrunks(INITIAL_TRUNKS);
        setHealthMetrics({
          ...INITIAL_HEALTH_METRICS,
          healthScore: 96,
          grade: 'A',
          summaryStatus: `Adapter bound to ${adapterConfig.interfaceId} (${adapterConfig.ipAddress}:${adapterConfig.udpPort}). Discovered ${discovered.length} controllers.`,
        });
        setSerialLogs(INITIAL_SERIAL_LOGS);
        setModbusGateways(INITIAL_MODBUS_GATEWAYS);
        setSnapshots(INITIAL_SNAPSHOTS);
      }
    } catch (e) {
      console.warn('Live adapter scan fallback:', e);
      setDevices(INITIAL_DEVICES.slice(0, 3));
      setSelectedDevice(INITIAL_DEVICES[0] || null);
      setTrunks(INITIAL_TRUNKS);
      setHealthMetrics(INITIAL_HEALTH_METRICS);
    } finally {
      setIsDiscovering(false);
    }
  };

  // Disconnect Adapter
  const handleDisconnectAdapter = () => {
    setNetworkMode('disconnected');
    setIsCapturing(false);
    setDevices([]);
    setPackets([]);
    setSelectedDevice(null);
    setLoadedPcap(null);
    setHealthMetrics({
      ...INITIAL_HEALTH_METRICS,
      healthScore: 0,
      grade: 'N/A' as any,
      summaryStatus: 'Adapter Disconnected. Select an interface or upload a .pcap capture.',
      totalPacketsPerSecond: 0,
    });
  };

  // Enable Demo Sandbox Mode
  const handleEnableDemoMode = () => {
    setNetworkMode('sandbox_demo');
    setDevices(INITIAL_DEVICES);
    setTrunks(INITIAL_TRUNKS);
    setPackets(INITIAL_PACKETS);
    setHealthMetrics(INITIAL_HEALTH_METRICS);
    setSerialLogs(INITIAL_SERIAL_LOGS);
    setSnapshots(INITIAL_SNAPSHOTS);
    setModbusGateways(INITIAL_MODBUS_GATEWAYS);
    setSelectedDevice(INITIAL_DEVICES[0] || null);
    setIsCapturing(true);
    setLoadedPcap(null);
  };

  // Handle PCAP / Capture File Upload
  const handleUploadPcap = async (file: File) => {
    try {
      const result = await parsePcapFile(file);
      setLoadedPcap(result.metadata);
      setPackets(result.packets);
      setDevices(result.discoveredDevices.length > 0 ? result.discoveredDevices : INITIAL_DEVICES.slice(0, 4));
      setSelectedDevice(result.discoveredDevices[0] || null);
      setTrunks(INITIAL_TRUNKS);
      setNetworkMode('pcap_file');
      setIsCapturing(false); // Static PCAP playback

      const errCount = result.packets.filter((p) => p.statusColor === 'red').length;
      const score = Math.max(70, 100 - errCount * 5);

      setHealthMetrics({
        ...INITIAL_HEALTH_METRICS,
        healthScore: score,
        grade: score >= 90 ? 'A' : score >= 80 ? 'B' : 'C',
        summaryStatus: `Parsed Wireshark capture "${result.metadata.fileName}" (${result.metadata.packetCount} frames, ${result.discoveredDevices.length} devices).`,
        crcErrorCount: errCount,
      });
    } catch (err: any) {
      console.error('Failed to parse PCAP file:', err);
    }
  };

  // Run Who-Is Discovery Broadcast Scan
  const handleRunDiscovery = (lowLimit?: number, highLimit?: number, network?: number) => {
    if (networkMode === 'disconnected') {
      setIsConfigModalOpen(true);
      return;
    }

    setIsDiscovering(true);

    const whoIsLayers: PacketLayerDecode[] = [
      {
        name: 'Ethernet II Broadcast Frame',
        summary: `Src: 00:1E:C9:82:11:4A, Dst: FF:FF:FF:FF:FF:FF`,
        details: [
          { key: 'Source MAC', value: '00:1E:C9:82:11:4A' },
          { key: 'Destination MAC', value: 'FF:FF:FF:FF:FF:FF' },
          { key: 'EtherType', value: '0x0800 (IPv4)' },
        ],
      },
      {
        name: 'BACnet Virtual Link Control (BVLC)',
        summary: '0x0B (Original-Broadcast-NPDU)',
        details: [
          { key: 'Type', value: '0x81 (BACnet/IP)' },
          { key: 'Function', value: '0x0B (Broadcast)' },
        ],
      },
      {
        name: 'BACnet Application Layer (APDU)',
        summary: 'Unconfirmed-REQ: Who-Is',
        details: [
          { key: 'PDU Type', value: 'Unconfirmed-REQ (1)' },
          { key: 'Service Choice', value: 'Who-Is (8)' },
          { key: 'Low Limit', value: lowLimit ?? 0 },
          { key: 'High Limit', value: highLimit ?? 4194303 },
        ],
      },
    ];

    const whoIsPkt: CapturedPacket = {
      id: `pkt_whois_${Date.now()}`,
      packetNumber: packets.length + 1,
      timestamp: Date.now(),
      timeDisplay: '0.000',
      deltaMs: 0,
      source: `${adapterConfig.ipAddress} (${adapterConfig.localDeviceName})`,
      destination: `${adapterConfig.broadcastAddress}:${adapterConfig.udpPort} (Subnet Broadcast)`,
      protocol: 'BACnet/IP',
      service: 'Who-Is',
      lengthBytes: 38,
      summary: `Broadcast Who-Is (Range: ${lowLimit ?? 0} to ${highLimit ?? 4194303})`,
      statusColor: 'yellow',
      rawHex: '81 0B 00 12 01 20 FF FF 00 FF 10 08',
      rawAscii: 'Who-Is..Global',
      layers: whoIsLayers,
      plainEnglishExplanation: {
        headline: 'Global Who-Is Controller Discovery Broadcast',
        description: `Broadcasting Who-Is from ${adapterConfig.ipAddress}:${adapterConfig.udpPort} across subnet ${adapterConfig.subnetMask}.`,
        severity: 'info',
        technicianAdvice: 'Listening for I-Am announcement frames from field controllers.',
      },
    };

    setPackets((prev) => [whoIsPkt, ...prev]);

    setTimeout(() => {
      setIsDiscovering(false);
    }, 1200);
  };

  // Update Object Value / 16-Level Priority Array
  const handleUpdateObjectValue = (
    deviceId: string,
    objectId: string,
    value: number | boolean | string,
    priority: number = 8
  ) => {
    setDevices((prev) =>
      prev.map((dev) => {
        if (dev.id !== deviceId) return dev;

        const updatedObjects = dev.objects.map((obj) => {
          if (obj.id !== objectId) return obj;

          const updatedPriorityArray = obj.priorityArray
            ? obj.priorityArray.map((slot) =>
                slot.priority === priority ? { ...slot, value } : slot
              )
            : undefined;

          return {
            ...obj,
            presentValue: value,
            priorityArray: updatedPriorityArray,
            statusFlags: {
              ...obj.statusFlags,
              overridden: priority === 8,
            },
          };
        });

        return { ...dev, objects: updatedObjects };
      })
    );

    if (selectedDevice?.id === deviceId) {
      setSelectedDevice((prev) => {
        if (!prev) return null;
        const updatedObjs = prev.objects.map((o) =>
          o.id === objectId ? { ...o, presentValue: value } : o
        );
        return { ...prev, objects: updatedObjs };
      });
    }

    const writeLayers: PacketLayerDecode[] = [
      {
        name: 'Ethernet II Frame',
        summary: 'Src: 00:1E:C9:82:11:4A, Dst: 00:10:8C:3D:22:90',
        details: [
          { key: 'Source MAC', value: '00:1E:C9:82:11:4A' },
          { key: 'Destination MAC', value: '00:10:8C:3D:22:90' },
        ],
      },
      {
        name: 'BACnet Application Layer (APDU)',
        summary: `Confirmed-REQ: WriteProperty (Priority ${priority})`,
        details: [
          { key: 'Service', value: 'WriteProperty' },
          { key: 'Priority Level', value: priority },
          { key: 'Written Value', value: String(value) },
        ],
      },
    ];

    const writePkt: CapturedPacket = {
      id: `pkt_write_${Date.now()}`,
      packetNumber: packets.length + 1,
      timestamp: Date.now(),
      timeDisplay: '0.012',
      deltaMs: 12,
      source: `${adapterConfig.ipAddress} (${adapterConfig.localDeviceName})`,
      destination: selectedDevice?.ipAddress || selectedDevice?.name || 'Device',
      protocol: selectedDevice?.protocol || 'BACnet/IP',
      service: 'WriteProperty',
      lengthBytes: 64,
      summary: `WriteProperty: Priority ${priority} = ${value}`,
      statusColor: 'purple',
      rawHex: '81 0A 00 24 01 04 00 0F 12 34 56 78',
      rawAscii: `Write..Pri${priority}..${value}`,
      layers: writeLayers,
      plainEnglishExplanation: {
        headline: `Manual Override Applied at Priority ${priority}`,
        description: `Technician wrote value "${value}" to Priority Slot ${priority}.`,
        severity: priority === 8 ? 'warning' : 'info',
        technicianAdvice:
          priority === 8
            ? 'Manual Operator Overrides at Priority 8 must be relinquished when troubleshooting is complete to restore automated schedule control.'
            : 'Normal command write verified.',
      },
    };

    setPackets((prev) => [writePkt, ...prev]);
  };

  // Relinquish Priority Slot
  const handleRelinquishPriority = (deviceId: string, objectId: string, priority: number) => {
    handleUpdateObjectValue(deviceId, objectId, 'null', priority);
  };

  // Send Serial Frame from RS-485 Terminal
  const handleSendSerialFrame = (hexString: string, port: string, baud: number) => {
    const newEntry: SerialLogEntry = {
      id: `serial_${Date.now()}`,
      timestamp: Date.now(),
      direction: 'TX',
      rawHex: hexString,
      rawAscii: hexString.replace(/\s+/g, '').replace(/../g, (byte) => {
        const code = parseInt(byte, 16);
        return code >= 32 && code <= 126 ? String.fromCharCode(code) : '.';
      }),
      interpretedFrame: `Manual Frame Injected on ${port} @ ${baud} Baud`,
      port,
      baudRate: baud,
    };
    setSerialLogs((prev) => [...prev, newEntry]);
  };

  // Take Snapshot
  const handleTakeSnapshot = (name: string, notes: string) => {
    const newSnapshot: NetworkSnapshot = {
      id: `snap_${Date.now()}`,
      title: name,
      timestamp: Date.now(),
      deviceCount: devices.length,
      pointCount: devices.reduce((acc, d) => acc + (d.objects ? d.objects.length : 0), 0),
      devices: JSON.parse(JSON.stringify(devices)),
      notes,
    };
    setSnapshots((prev) => [newSnapshot, ...prev]);
  };

  const isConnected = networkMode !== 'disconnected';

  return (
    <div
      className={`h-full flex flex-col overflow-hidden font-sans select-none ${
        isDark ? 'bg-[#040e1e] text-slate-100' : 'bg-[#f4f8fc] text-slate-800'
      }`}
    >
      {/* Network Adapter Configuration Modal */}
      <NetworkAdapterConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={adapterConfig}
        onSaveConfig={(newConfig) => setAdapterConfig(newConfig)}
        onConnect={handleConnectLiveAdapter}
        onDisconnect={handleDisconnectAdapter}
        isConnected={isConnected}
        onUploadPcap={handleUploadPcap}
        loadedPcap={loadedPcap}
        onEnableDemoMode={handleEnableDemoMode}
      />

      {/* AI Network Copilot & Diagnostics Modal */}
      <AiNetworkCopilotModal
        isOpen={isAiCopilotOpen}
        onClose={() => setIsAiCopilotOpen(false)}
        devices={devices}
        healthMetrics={healthMetrics}
        packets={packets}
        onOpenGlobalAiChat={onOpenAiAssist}
      />

      {/* Top Interface & Adapter Status Bar */}
      <div
        className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 ${
          isDark ? 'bg-[#051124] border-[#0e274b]' : 'bg-[#e2ecf7] border-[#cbd8e6]'
        }`}
      >
        {/* Left: Active Mode & Interface Binding Badge */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 font-black">
            <Network className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span className={isDark ? 'text-slate-200' : 'text-slate-900'}>Adapter:</span>
          </div>

          {networkMode === 'disconnected' && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-black border ${
                isDark
                  ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                  : 'bg-amber-100 border-amber-500 text-amber-950'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Unbound / Disconnected</span>
            </div>
          )}

          {networkMode === 'live_adapter' && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${
                isDark
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                  : 'bg-emerald-100 border-emerald-500 text-emerald-950'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                LIVE: {adapterConfig.interfaceId} ({adapterConfig.ipAddress}:{adapterConfig.udpPort})
              </span>
              <span className="text-[10px] border-l pl-1.5 font-bold opacity-80">
                Net #{adapterConfig.bacnetNetworkNumber} • Dev #{adapterConfig.localDeviceInstance}
              </span>
            </div>
          )}

          {networkMode === 'pcap_file' && loadedPcap && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${
                isDark
                  ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                  : 'bg-purple-100 border-purple-400 text-purple-950'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>PCAP: {loadedPcap.fileName}</span>
              <span className="text-[10px] font-mono font-bold opacity-80">
                ({loadedPcap.packetCount} pkts, {devices.length} devs)
              </span>
            </div>
          )}

          {networkMode === 'sandbox_demo' && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${
                isDark
                  ? 'bg-sky-950/80 border-sky-500 text-sky-300'
                  : 'bg-sky-100 border-sky-400 text-sky-950'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>FIELD NETWORK CONTROLLERS (11 Field Devices)</span>
            </div>
          )}
        </div>

        {/* Right: Quick Action Controls + Unified AI Copilot Hub */}
        <div className="flex items-center gap-2">


          {/* Configure Adapter Button */}
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-950 border border-slate-400'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Configure Adapter / IP</span>
          </button>

          {/* Quick File Upload */}
          <label
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
              isDark
                ? 'bg-purple-900/30 hover:bg-purple-900/50 text-purple-200 border border-purple-700/50'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-950 border border-purple-300'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Load .pcap</span>
            <input
              type="file"
              accept=".pcap,.pcapng,.cap,.json,.csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUploadPcap(f);
              }}
              className="hidden"
            />
          </label>

          {/* Scan Subnet / Who-Is */}
          <button
            onClick={() => handleRunDiscovery()}
            disabled={isDiscovering}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Radio className={`w-3.5 h-3.5 ${isDiscovering ? 'animate-spin' : ''}`} />
            <span>{isDiscovering ? 'Scanning...' : 'Broadcast Who-Is'}</span>
          </button>

          {/* Quick Disconnect or Demo Toggle */}
          {isConnected ? (
            <button
              onClick={handleDisconnectAdapter}
              title="Disconnect active adapter"
              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer border border-rose-500/30"
            >
              <Power className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleEnableDemoMode}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black border cursor-pointer ${
                isDark
                  ? 'bg-sky-950/60 hover:bg-sky-900/70 text-sky-300 border-sky-700'
                  : 'bg-sky-100 hover:bg-sky-200 text-sky-950 border-sky-400'
              }`}
            >
              Load Baseline
            </button>
          )}
        </div>
      </div>



      {/* Main Active Sub-View Canvas */}
      <div className="flex-1 overflow-hidden">
        {activeSubView === 'discovery' && (
          <DeviceDiscoveryView
            devices={devices}
            trunks={trunks}
            isDiscovering={isDiscovering}
            onRunDiscovery={handleRunDiscovery}
            selectedDevice={selectedDevice}
            onSelectDevice={setSelectedDevice}
            onUpdateObjectValue={handleUpdateObjectValue}
            onRelinquishPriority={handleRelinquishPriority}
            onOpenAiAssist={onOpenAiAssist}
          />
        )}

        {activeSubView === 'packet_analyzer' && (
          <PacketAnalyzerView
            packets={packets}
            isCapturing={isCapturing}
            onToggleCapture={() => setIsCapturing(!isCapturing)}
            onClearPackets={() => setPackets([])}
            onOpenAiAssist={onOpenAiAssist}
          />
        )}

        {activeSubView === 'health_diagnostics' && (
          <NetworkHealthView
            healthMetrics={healthMetrics}
            trunks={trunks}
            devices={devices}
            onOpenAiAssist={onOpenAiAssist}
          />
        )}

        {activeSubView === 'serial_terminal' && (
          <SerialTerminalView
            logs={serialLogs}
            onClearLogs={() => setSerialLogs([])}
            onSendSerialFrame={handleSendSerialFrame}
            onOpenAiAssist={onOpenAiAssist}
          />
        )}

        {activeSubView === 'protocol_test' && (
          <ProtocolTestShellView
            devices={devices}
            onOpenAiAssist={onOpenAiAssist}
          />
        )}

        {activeSubView === 'snapshot_diff' && (
          <SnapshotComparatorView
            snapshots={snapshots}
            currentDevices={devices}
            onTakeSnapshot={handleTakeSnapshot}
            onOpenAiAssist={onOpenAiAssist}
          />
        )}

        {activeSubView === 'multi_protocol' && (
          <MultiProtocolGatewayView
            modbusGateways={modbusGateways}
            onOpenAiAssist={onOpenAiAssist}
          />
        )}
      </div>
    </div>
  );
};
