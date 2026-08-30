export type NiagaraServiceSubView =
  | 'connection_manager'
  | 'station_browser';

export interface StationProfile {
  id: string;
  name: string;
  host: string;
  httpPort: number;
  useHttps: boolean;
  stationName: string;
  foxPort: number;
  useFoxs: boolean;
  version: string;
  hardwareModel: 'JACE-8000' | 'JACE-9000' | 'Niagara Supervisor' | 'Edge-10' | 'Cloud VM' | 'Custom Controller';
  description: string;
  location: string;
  defaultPath: string;
  usernameHint?: string;
  username?: string;
  password?: string;
  authType?: 'auto' | 'basic' | 'digest' | 'scram';
  tags: string[];
  favorite?: boolean;
  isRealStation?: boolean;
  lastConnectedAt?: string;
  status: 'online' | 'offline' | 'unreachable' | 'authenticating' | 'connected';
  pingMs?: number;
  customPoints?: StationPointTelemetry[];
}

export interface StationPointTelemetry {
  ord: string;
  name: string;
  type: 'NumericWritable' | 'BooleanWritable' | 'StringWritable' | 'EnumWritable';
  value: string | number | boolean;
  units?: string;
  status: 'ok' | 'override' | 'fault' | 'alarm' | 'down';
  priorityLevel?: number;
  lastUpdated: string;
}

export interface StationAlarmItem {
  id: string;
  sourceOrd: string;
  message: string;
  severity: 'Critical' | 'Major' | 'Minor' | 'Info';
  timestamp: string;
  acknowledged: boolean;
  state: 'Active Unacked' | 'Active Acked' | 'Normal Unacked' | 'Normal Acked';
}
