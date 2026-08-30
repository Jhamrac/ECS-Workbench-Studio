export type ReportStatus = 'draft' | 'in_review' | 'completed' | 'published';
export type DeficiencySeverity = 'CRITICAL' | 'ACTION REQUIRED' | 'CORRECTED' | 'WARNING' | 'INFO';

export interface ReportHealthMetrics {
  overallHealth: number; // 0 - 100
  supervisoryJace: number; // 0 - 100
  bacnetNetwork: number; // 0 - 100
  controlLoops: number; // 0 - 100
  sensorIntegrity: number; // 0 - 100
  graphicsUi: number; // 0 - 100
}

export interface SupervisoryDeficiency {
  id: string;
  componentService: string; // e.g. "Write Worker Queue", "Bacnet Multi Poll Service"
  observedDeficiency: string;
  impact: string;
  statusAction: string;
  severity: DeficiencySeverity;
}

export interface EquipmentDeficiency {
  id: string;
  equipment: string; // e.g. "Chiller 1 / CHWS", "AHU_01"
  locationTarget: string; // e.g. "Central Plant", "Room 111"
  observedDeficiencies: string[];
  recommendedAction: string;
  severity?: DeficiencySeverity;
}

export interface TerminalUnitDeficiency {
  id: string;
  unitId: string; // e.g. "FCU_01", "VAV_01", "EF-2"
  areaServed: string;
  observedDeficiencies: string;
  actionRequired: string;
  severity?: DeficiencySeverity;
}

export interface VisualEvidenceAnnotation {
  id: string;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  type: 'box' | 'arrow' | 'badge';
  label?: string;
  width?: number; // percentage
  height?: number; // percentage
}

export interface VisualEvidenceFigure {
  id: string;
  figureNumber: number;
  title: string;
  categoryBadge: string; // e.g. "JACE / STATION RESOURCES", "AHU_01 (AREA SERVED: ROOM 111)"
  imageUrl?: string;
  diagramType?:
    | 'jace_resource'
    | 'polling_service'
    | 'app_director'
    | 'device_discovery'
    | 'chiller_plant'
    | 'ahu_graphic'
    | 'fcu_graphic'
    | 'vav_graphic'
    | 'exhaust_fan'
    | 'custom';
  slotOrdPath?: string;
  identifiedDeficiencies: string[];
  recommendedCorrectiveAction: string;
  annotations?: VisualEvidenceAnnotation[];
}

export interface ReportActionPlan {
  immediatePhase: string[]; // Next 24-48 Hours
  shortTermPhase: string[]; // Next 1-2 Weeks
  longTermPhase: string[]; // Planned Capital / Modernization
}

export interface SiteAuditReport {
  id: string;
  folderId: string; // ID of customer folder
  customerName: string; // e.g. "Acme Industrial"
  facilityName: string; // e.g. "Main Production Facility"
  reportTitle: string; // e.g. "Preventive Maintenance Deficiency Report"
  reportSubtitle: string; // e.g. "Building Automation System & HVAC Controls Field Audit"
  systemArchitecture: string; // e.g. "Tridium Niagara N4 / BACnet IP & MS/TP"
  auditDate: string; // e.g. "August 26, 2026"
  serviceContractor: string; // e.g. "Engineered Cooling Services"
  auditorName: string; // e.g. "Lead BAS Systems Specialist"
  auditorTitle?: string;
  contractorLicense?: string;
  siteContactName?: string;
  siteContactEmail?: string;
  status: ReportStatus;
  healthMetrics: ReportHealthMetrics;
  executiveSummary: string;
  keySystemicPatterns: string[];
  supervisoryDeficiencies: SupervisoryDeficiency[];
  plantAhuDeficiencies: EquipmentDeficiency[];
  terminalUnitsSummary: TerminalUnitDeficiency[];
  visualEvidenceFigures: VisualEvidenceFigure[];
  actionPlan?: ReportActionPlan;
  createdAt: string;
  updatedAt: string;
}

export interface ReportCustomerFolder {
  id: string;
  name: string; // e.g. "Customer Site Name"
  facilityLocation: string; // e.g. "Pensacola Campus, Bldg 4"
  primaryContact?: string;
  systemType: string; // e.g. "Tridium N4 JACE-8000"
  color: string;
  createdAt: string;
  updatedAt: string;
}

export type ReportSubView = 'saved_reports' | 'site_audit_builder' | 'guided_audit_wizard' | 'polling_report' | 'energy_audit';

export type AuditWizardStep =
  | 'facility_scope'
  | 'platform_jace'
  | 'bacnet_network'
  | 'central_plant'
  | 'terminal_units'
  | 'visual_evidence'
  | 'executive_summary';

export interface AuditFieldGuideSection {
  step: AuditWizardStep;
  title: string;
  subtitle: string;
  whatToCapture: string[];
  howToCapture: string[];
  whenToCapture: string;
  whereToCapture: string;
  commonFaults: {
    title: string;
    description: string;
    severity: DeficiencySeverity;
    fix: string;
  }[];
}
