export type ProtocolType =
  | 'BACnet/IP'
  | 'BACnet MS/TP'
  | 'Modbus TCP'
  | 'Modbus RTU'
  | 'Niagara Fox'
  | 'MQTT';

export type DeviceStatus = 'ok' | 'down' | 'unackedAlarm' | 'fault' | 'disabled';

export type BacnetObjectType =
  | 'analog-input'
  | 'analog-output'
  | 'analog-value'
  | 'binary-input'
  | 'binary-output'
  | 'binary-value'
  | 'multi-state-input'
  | 'multi-state-output'
  | 'multi-state-value'
  | 'device'
  | 'schedule'
  | 'trend-log'
  | 'loop'
  | 'notification-class';

export interface PriorityArraySlot {
  priority: number;
  value: number | boolean | string | null;
  source?: string;
}

export interface BacnetObject {
  id: string;
  type: BacnetObjectType;
  instance: number;
  name: string;
  description: string;
  presentValue: number | boolean | string;
  units?: string;
  stateText?: string[];
  statusFlags: {
    inAlarm: boolean;
    fault: boolean;
    overridden: boolean;
    outOfService: boolean;
  };
  priorityArray?: PriorityArraySlot[];
  relinquishDefault?: number | boolean | string;
  covIncrement?: number;
  highLimit?: number;
  lowLimit?: number;
  deadband?: number;
  lastUpdated: number;
}

export interface BacnetDevice {
  id: string;
  deviceInstance: number;
  name: string;
  vendorName: string;
  vendorId: number;
  modelName: string;
  firmwareRevision: string;
  protocol: ProtocolType;
  networkNumber: number;
  networkName: string;
  ipAddress?: string;
  port?: number;
  macAddress?: number; // 0-127 for MS/TP
  baudRate?: 9600 | 19200 | 38400 | 76800 | 115200;
  maxMaster?: number;
  maxInfoFrames?: number;
  status: DeviceStatus;
  pingTimeMs: number;
  objects: BacnetObject[];
  bbmdConfigured?: boolean;
  foreignDevice?: boolean;
  location?: string;
  isDiscovered?: boolean;
  lastSeen: number;
}

export interface NetworkTrunk {
  id: string;
  name: string;
  protocol: ProtocolType;
  networkNumber: number;
  interfaceName: string;
  portOrBaud: string;
  status: 'active' | 'degraded' | 'offline';
  deviceCount: number;
  routerDeviceId?: string;
  notes?: string;
}

export type BacnetServiceType =
  | 'Who-Is'
  | 'I-Am'
  | 'Who-Has'
  | 'I-Have'
  | 'ReadProperty'
  | 'ReadPropertyMultiple'
  | 'WriteProperty'
  | 'WritePropertyMultiple'
  | 'SubscribeCOV'
  | 'ConfirmedCOVNotification'
  | 'UnconfirmedCOVNotification'
  | 'TimeSynchronization'
  | 'ReinitializeDevice'
  | 'DeviceCommunicationControl'
  | 'Token'
  | 'PollForMaster'
  | 'BACnet-Error'
  | 'BACnet-Abort'
  | 'BACnet-Reject';

export interface PacketLayerDecode {
  name: string;
  summary: string;
  details: { key: string; value: string | number | boolean }[];
  rawByteRange?: [number, number];
}

export interface CapturedPacket {
  id: string;
  packetNumber: number;
  timestamp: number;
  timeDisplay: string;
  deltaMs: number;
  source: string;
  destination: string;
  protocol: ProtocolType;
  service: BacnetServiceType;
  summary: string;
  lengthBytes: number;
  statusColor: 'green' | 'blue' | 'yellow' | 'red' | 'purple';
  layers: PacketLayerDecode[];
  rawHex: string;
  rawAscii: string;
  plainEnglishExplanation: {
    headline: string;
    description: string;
    technicianAdvice: string;
    severity: 'info' | 'success' | 'warning' | 'error';
  };
}

export interface NetworkHealthMetrics {
  healthScore: number; // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  totalPacketsPerSecond: number;
  broadcastRatioPercent: number;
  tokenRingRotationLatencyMs: number;
  crcErrorCount: number;
  retryCount: number;
  duplicateDeviceIds: { deviceId: number; devices: string[] }[];
  duplicateMacAddresses: { mac: number; trunk: string; devices: string[] }[];
  missingMacGaps: { trunk: string; gapStart: number; gapEnd: number }[];
  broadcastStormActive: boolean;
  warnings: string[];
}

export interface SerialLogEntry {
  id: string;
  timestamp: number;
  direction: 'TX' | 'RX';
  port: string;
  baudRate: number;
  rawHex: string;
  rawAscii: string;
  interpretedFrame: string;
}

export interface CommissioningSnapshot {
  id: string;
  title: string;
  timestamp: number;
  deviceCount: number;
  pointCount: number;
  devices: BacnetDevice[];
  notes: string;
}

export type NetworkSnapshot = CommissioningSnapshot;

export interface ModbusGatewayDevice {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  slaveId: number;
  protocol: 'Modbus TCP' | 'Modbus RTU' | 'Niagara Fox' | 'MQTT';
  status: 'online' | 'offline' | 'timeout' | 'crc_error';
  holdingRegisters: { address: number; name: string; value: number | string; units?: string; description?: string }[];
  discreteInputs?: { address: number; name: string; state: boolean }[];
  coils?: { address: number; name: string; state: boolean }[];
}

export interface SnapshotDiffItem {
  id: string;
  type: 'device_added' | 'device_removed' | 'device_offline' | 'value_changed' | 'config_mismatch';
  deviceName: string;
  objectName?: string;
  property?: string;
  baselineValue: string | number;
  liveValue: string | number;
  severity: 'info' | 'warning' | 'danger';
}

export interface ApduTestProfile {
  id: string;
  name: string;
  targetDeviceId: string;
  service: BacnetServiceType;
  objectType: BacnetObjectType;
  instance: number;
  property: string;
  valueToWrite?: string | number;
  priority?: number;
  status: 'idle' | 'running' | 'pass' | 'fail';
  latencyMs?: number;
  responseSummary?: string;
  plainExplanation?: string;
}

export type NetworkingToolSubView =
  | 'discovery'
  | 'packet_analyzer'
  | 'health_diagnostics'
  | 'serial_terminal'
  | 'protocol_test'
  | 'snapshot_diff'
  | 'multi_protocol';

export type NetworkMode = 'disconnected' | 'live_adapter' | 'pcap_file' | 'sandbox_demo';

export type NetworkConnectionState = 'unbound' | 'binding' | 'bound' | 'listening' | 'scanning' | 'error';

export interface NetworkInterfaceInfo {
  id: string;
  name: string;
  displayName: string;
  type: 'ethernet' | 'wifi' | 'loopback' | 'virtual';
  macAddress: string;
  ipAddress: string;
  subnetMask: string;
  broadcastAddress: string;
  isUp: boolean;
}

export interface NetworkAdapterConfig {
  mode: NetworkMode;
  interfaceId: string;
  ipAddress: string;
  subnetMask: string;
  broadcastAddress: string;
  defaultGateway: string;
  udpPort: number; // e.g. 47808 (0xBAC0)
  bacnetNetworkNumber: number;
  localDeviceInstance: number;
  localDeviceName: string;
  bbmdEnabled: boolean;
  bbmdIp: string;
  bbmdPort: number;
  bbmdTtl: number;
  serialPort: string;
  baudRate: 9600 | 19200 | 38400 | 76800 | 115200;
  dataBits: 8;
  parity: 'none' | 'even' | 'odd';
  stopBits: 1 | 2;
  maxMaster: number;
  maxInfoFrames: number;
  discoveryRange: {
    startIp: string;
    endIp: string;
    deviceInstanceLow: number;
    deviceInstanceHigh: number;
    timeoutMs: number;
  };
}

export interface LoadedPcapFile {
  fileName: string;
  fileSizeBytes: number;
  loadedAt: number;
  packetCount: number;
  timeSpanSecs: number;
  protocolsDetected: string[];
  devicesDiscoveredCount: number;
}
