export type StudioId = 'wiresheet' | 'network' | 'report' | 'niagara' | 'application';

export interface WorkbenchStudio {
  id: StudioId;
  name: string;
  category: string;
  description: string;
  isReady: boolean;
}

export const WORKBENCH_STUDIOS: WorkbenchStudio[] = [
  {
    id: 'wiresheet',
    name: 'Logic Studio',
    category: 'Engineering Suite',
    description: 'Visual block programming, live simulation, wiring & logic design',
    isReady: true,
  },
  {
    id: 'niagara',
    name: 'Niagara Service',
    category: 'Real-World Station & Live Site Suite',
    description: 'Direct station IP connection, embedded station web browser, Fox/FoxS bridge, and real site profiles',
    isReady: true,
  },
  {
    id: 'network',
    name: 'Network Studio',
    category: 'Field Bus & Protocol Suite',
    description: 'BACnet/IP, MS/TP token rings, packet capture & dissector, device discovery, traffic diagnostics, and serial terminal',
    isReady: true,
  },
  {
    id: 'report',
    name: 'Report Service',
    category: 'Field Audit & Diagnostics Suite',
    description: 'Saved customer reports, site audit report builder, visual evidence captures, and station health scoring',
    isReady: true,
  },
  {
    id: 'application',
    name: 'Application Studio',
    category: 'System Service Suite',
    description: 'User accounts, visual theme workbench settings, and simulation engine options',
    isReady: true,
  },
];

