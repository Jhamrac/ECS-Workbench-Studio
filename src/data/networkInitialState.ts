import {
  BacnetDevice,
  BacnetObject,
  CapturedPacket,
  CommissioningSnapshot,
  NetworkHealthMetrics,
  NetworkTrunk,
  SerialLogEntry,
} from '../types/networking';

export const INITIAL_TRUNKS: NetworkTrunk[] = [];

export const INITIAL_DEVICES: BacnetDevice[] = [];

export const INITIAL_PACKETS: CapturedPacket[] = [];

export const INITIAL_HEALTH_METRICS: NetworkHealthMetrics = {
  healthScore: 100,
  grade: 'A+',
  totalPacketsPerSecond: 0,
  broadcastRatioPercent: 0,
  tokenRingRotationLatencyMs: 0,
  crcErrorCount: 0,
  retryCount: 0,
  duplicateDeviceIds: [],
  duplicateMacAddresses: [],
  missingMacGaps: [],
  broadcastStormActive: false,
  warnings: [],
};

export const INITIAL_SERIAL_LOGS: SerialLogEntry[] = [];

export const INITIAL_SNAPSHOTS: CommissioningSnapshot[] = [];

export const INITIAL_MODBUS_GATEWAYS: any[] = [];

