export type DataType = 'boolean' | 'numeric' | 'enum' | 'string' | 'status';

export interface Slot {
  name: string;
  type: DataType;
  value?: any;
  fallback?: any;
  unit?: string;
  label?: string;
  description?: string;
  isOverridden?: boolean;
  priority?: number; // 1-16 for Niagara priority array
}

export interface BlockProperty {
  [key: string]: any;
  action?: 'direct' | 'reverse';
  proportionalConstant?: number; // Kp
  integralTime?: number; // Ti (seconds)
  derivativeTime?: number; // Td (seconds)
  deadband?: number;
  highLimit?: number;
  lowLimit?: number;
  inputLow?: number;
  inputHigh?: number;
  outputLow?: number;
  outputHigh?: number;
  timePeriod?: number; // seconds
  units?: string;
  precision?: number;
  notes?: string;
  defaultOutput?: any;
  priorityArray?: Record<number, any>; // 1 to 16 slot overrides
  fallbackValue?: any;
  weeklySchedule?: Record<string, { start: string; end: string; val: any }[]>; // Day -> Array of occupied intervals
}

export interface NiagaraBlockStatus {
  ok: boolean;
  overridden?: boolean;
  fault?: boolean;
  down?: boolean;
  unackedAlarm?: boolean;
  disabled?: boolean;
}

export interface NiagaraBlock {
  id: string;
  name: string;
  type: string; // e.g. LoopPoint, LeadLagCycle, BooleanWritable, And, Or, Reset, etc.
  palette: string; // e.g. kitControl:control, baja:points, alarm:alarm
  category?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  inputs: Slot[];
  outputs: Slot[];
  properties: BlockProperty;
  status: NiagaraBlockStatus;
  comment?: string;
  customColor?: string;
}

export interface NiagaraLink {
  id: string;
  fromBlockId: string;
  fromSlot: string;
  toBlockId: string;
  toSlot: string;
  signalType?: DataType;
  color?: string;
  label?: string;
}

export interface NiagaraRebuildStep {
  stepNumber: number;
  phase: 'palette' | 'blocks' | 'facets' | 'links' | 'testing';
  title: string;
  instruction: string;
  paletteName?: string;
  componentType?: string;
  sourceBlock?: string;
  targetBlock?: string;
  slotDetails?: string;
  tips?: string;
  completed?: boolean;
}

export interface NiagaraProgram {
  id?: string;
  title: string;
  description: string;
  category?: string;
  sequenceOfOperation: string;
  blocks: NiagaraBlock[];
  links: NiagaraLink[];
  rebuildSteps: NiagaraRebuildStep[];
  commissioningChecklist?: string[];
  version?: string;
  lastModified?: string;
}

export interface PaletteItem {
  type: string;
  palette: string;
  category: 'Logic' | 'Math' | 'Switches' | 'Timers' | 'HVAC & Control' | 'Points & Writable' | 'Alarm' | 'Schedule' | 'Conversion';
  label: string;
  description: string;
  defaultInputs: Slot[];
  defaultOutputs: Slot[];
  defaultProperties: BlockProperty;
  color?: string;
}

export interface SimulationState {
  isRunning: boolean;
  speed: number; // 0.5x, 1x, 2x, 5x
  stepCount: number;
  liveValues: Record<string, Record<string, any>>; // blockId -> { slotName: value }
  liveStatuses: Record<string, NiagaraBlockStatus>;
  activeLinkIds: Set<string>;
}

export interface NiagaraTranslationIssue {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedComponent?: string;
}

export interface NiagaraTranslationResolution {
  summary: string;
  beforeExplanation: string;
  afterExplanation: string;
  whyRequired: string;
  resolvedProgram: NiagaraProgram;
}

export interface NiagaraTranslationReport {
  systemTitle: string;
  summary: string;
  detailedExplanation: string;
  hasIssues: boolean;
  issues: NiagaraTranslationIssue[];
  resolution?: NiagaraTranslationResolution;
}
