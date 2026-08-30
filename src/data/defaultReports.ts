import { SiteAuditReport, ReportCustomerFolder, AuditFieldGuideSection } from '../types/reports';

export const DEFAULT_CUSTOMER_FOLDERS: ReportCustomerFolder[] = [];

export const INITIAL_SAVED_REPORTS: SiteAuditReport[] = [];

// Master Step-by-Step Field Audit Guidelines for Technicians
export const AUDIT_FIELD_GUIDELINES: AuditFieldGuideSection[] = [
  {
    step: 'facility_scope',
    title: '1. Facility & Station Scope Setup',
    subtitle: 'Establish site baseline, contractor credentials, and station architecture.',
    whereToCapture: 'Customer Site Contract, ECS Workbench Studio Welcome / License View, or JACE Label Plate.',
    whenToCapture: 'Upon arrival at the site prior to connecting to the BMS local network.',
    whatToCapture: [
      'Full Customer Organization & Building/Facility Name',
      'Site Address & Specific Building / Wing / Hangar Identifier',
      'Niagara N4 Version & Host Model (e.g. JACE-8000, Supervisor, Edge 10)',
      'Field Bus Architecture (e.g. BACnet IP backbone, MS/TP trunk 38400 baud, LonWorks, Modbus TCP)',
      'Lead Auditor Name, Professional License #, and Site Facility Contact Info',
    ],
    howToCapture: [
      'Open ECS Workbench Studio -> Connect to Studio -> Go to station:|slot:/ -> Note Host ID & Build in bottom status bar.',
      'Confirm customer primary point of contact for sign-off review at end of audit.',
    ],
    commonFaults: [
      {
        title: 'Outdated Niagara Firmware',
        description: 'JACE running obsolete N4.4 or older release vulnerable to security flaws.',
        severity: 'WARNING',
        fix: 'Recommend upgrading to current Niagara LTS release.',
      },
      {
        title: 'Missing License Options',
        description: 'Device limit or point count license reaching 95%+ capacity.',
        severity: 'ACTION REQUIRED',
        fix: 'Order expanded point pack license upgrade.',
      },
    ],
  },
  {
    step: 'platform_jace',
    title: '2. Supervisory & Platform Health Audit',
    subtitle: 'Inspect JACE CPU, Heap memory, Worker queues, and Polling services.',
    whereToCapture: 'ECS Workbench Studio -> Services -> Platform Resource Manager & Drivers Poll Service.',
    whenToCapture: 'During peak operational occupancy (10:00 AM - 2:00 PM) when all schedules & loops are active.',
    whatToCapture: [
      'CPU Usage Percentage & Average Core Spike Rate',
      'Heap Memory: Available Free MB vs Maximum Heap Limit (Target: >30% free)',
      'Write Worker Queue capacity vs total writable points (Target: >= 1.5x capacity)',
      'Bacnet Polling Service distribution (Target: Tiered Fast/Normal/Slow policies, not flat 5s)',
      'Active Manual Overrides (Priority 8 & Priority 16 locks across all controllers)',
      'Station Application Director logs for recurring Java exception crashes',
    ],
    howToCapture: [
      'Open Station -> Services -> right-click Spy -> select /platform or /resourceManager.',
      'Check Write Worker Queue size under Drivers -> BacnetNetwork -> LocalDevice -> Worker.',
      'Query all Priority 8 overrides using BQL: "select * from control:ControlPoint where out.value.activePriority == 8".',
    ],
    commonFaults: [
      {
        title: 'JACE Heap Memory Starvation (<20% free)',
        description: 'Heavy polling or leaky custom components filling available heap RAM.',
        severity: 'CRITICAL',
        fix: 'Tune Bacnet poll policies to 15s/60s and enable COV; purge unneeded history records.',
      },
      {
        title: 'Write Worker Queue Overflow (Default 1,000)',
        description: 'Station has >1,200 writable points with default 1,000 queue size causing dropped writes.',
        severity: 'ACTION REQUIRED',
        fix: 'Increase Write Worker Queue capacity to 1.5x total writable point count.',
      },
      {
        title: 'Long-Term Manual Overrides (Priority 8)',
        description: 'Technicians locked setpoints months ago, defeating automated energy setbacks.',
        severity: 'ACTION REQUIRED',
        fix: 'Audit all overridden points, fix root mechanical issue, and release to Priority None.',
      },
    ],
  },
  {
    step: 'bacnet_network',
    title: '3. BACnet & Field Network Bus Audit',
    subtitle: 'Verify RS-485 MS/TP trunks, IP routers, token health, and communication packet integrity.',
    whereToCapture: 'Drivers -> BacnetNetwork -> Device Manager & Spy -> /bacnet/comm.',
    whenToCapture: 'Mid-morning while global polling loops and graphic users are active.',
    whatToCapture: [
      'Total Discovered Devices vs Online / Offline Status',
      'MS/TP Token Rotation Time (Target: <300ms per 32-device trunk at 38400 baud)',
      'APDU Timeout & Retry Count (Target: <2% error rate)',
      'Duplicate Device Instances or MAC ID collisions on the bus',
      'Physical RS-485 EOL (End-of-Line) termination resistor and shield grounding health',
    ],
    howToCapture: [
      'Open Bacnet Device Manager -> click "Ping All" -> record offline count.',
      'Use Spy tool on BacnetPort to inspect packet counters, cyclic redundancy check (CRC) errors, and retries.',
      'Measure DC voltage across MS/TP (+) and (-) with multimeter (Target: 2.5V - 3.5V differential).',
    ],
    commonFaults: [
      {
        title: 'Offline BACnet Controllers on MS/TP Bus',
        description: 'Controllers dropping offline intermittently due to line reflections or loose terminal screws.',
        severity: 'CRITICAL',
        fix: 'Check 120-ohm EOL resistors at both physical line ends and verify daisy-chain topology.',
      },
      {
        title: 'High APDU Retries & Network Congestion',
        description: 'More than 5% of BACnet read requests timing out and retrying.',
        severity: 'ACTION REQUIRED',
        fix: 'Increase APDU Timeout to 3000ms and Max Master setting on all controllers.',
      },
    ],
  },
  {
    step: 'central_plant',
    title: '4. Central Plant & Air Handling Units (AHUs)',
    subtitle: 'Evaluate Chillers, Boilers, Primary Pumps, and Large Central Air Handlers.',
    whereToCapture: 'AHU WireSheets, Px Graphic Views, Chiller/Boiler Plant Room Control Panels.',
    whenToCapture: 'During transition between morning warm-up and peak cooling, and under load changes.',
    whatToCapture: [
      'Supply Air Temp (SAT) vs Setpoint Stability (Check for PID hunting ±3°F)',
      'Duct Static Pressure (SP) vs Setpoint & VFD Fan Speed modulation',
      'Economizer Mixed Air Damper position vs Outdoor Air Temp / Enthalpy lockout',
      'Chilled Water & Hot Water modulating valve stroke performance and delta-T',
      'Freeze stat switch integrity, dirty filter differential pressure switches, and safety interlocks',
    ],
    howToCapture: [
      'Open AHU WireSheet or Graphic -> observe SAT and Static Pressure trend logs over 10-15 minutes.',
      'Command cooling valve to 0%, 50%, 100% from Niagara and physically verify actuator travels full stroke.',
      'Check sensor calibration against handheld calibrated digital thermometer in discharge duct.',
    ],
    commonFaults: [
      {
        title: 'Supply Air Temp Loop Hunting (PID Oscillation)',
        description: 'Cooling valve cycling rapidly from 0% to 100%, causing equipment wear and fluctuating comfort.',
        severity: 'CRITICAL',
        fix: 'Increase Loop Integral time (Ti) and widen proportional band (Throttling Range).',
      },
      {
        title: 'Economizer Damper Mechanically Binding / Stuck',
        description: 'Damper actuator binding, preventing free cooling and driving up chiller power consumption.',
        severity: 'CRITICAL',
        fix: 'Inspect linkage rod, lubricate blade bushings, or replace failed Belimo actuator.',
      },
      {
        title: 'Static Pressure Transmitter Calibration Drift',
        description: 'Sensor reads false 1.8 in. w.g. while actual static is 0.9 in. w.g., starving terminal VAVs.',
        severity: 'ACTION REQUIRED',
        fix: 'Zero-calibrate sensor transducer and clean pitot tube sensing orifices.',
      },
    ],
  },
  {
    step: 'terminal_units',
    title: '5. Terminal Units & Zone Comfort Audit',
    subtitle: 'Sample VAV boxes, Fan Coil Units (FCUs), Unit Heaters, and Exhaust Fans.',
    whereToCapture: 'Niagara Terminal Unit point lists, VAV summary tables, Zone graphic displays.',
    whenToCapture: 'During occupied periods when occupants are present and setpoints are active.',
    whatToCapture: [
      'Zone Temperature vs Active Cooling/Heating Setpoint (Flag any deviation >2.5°F)',
      'Actual Airflow CFM vs Minimum & Maximum Airflow Setpoints',
      'Simultaneous Heating & Cooling (e.g. electric heat ON while cooling valve >20%)',
      'Stuck damper actuators or failed reheat modulating valves',
      'Ghost writes at Priority 16 or permanent Priority 8 overrides locking room mode',
    ],
    howToCapture: [
      'Sample a minimum of 15-20% of all terminal units across each floor and thermal exposure.',
      'Export a Niagara BQL query of all ZoneTemp, ClgSp, HtgSp, DamperPos, and HeatStage points.',
      'Walk physical zones with laser infrared or calibrated digital thermometer to check room sensor accuracy.',
    ],
    commonFaults: [
      {
        title: 'Simultaneous Heating & Cooling in Zone',
        description: 'Electric heat stage energized while chilled water valve is open, wasting immense energy.',
        severity: 'CRITICAL',
        fix: 'Correct dual-setpoint deadband in wire sheet and adjust interlock logic.',
      },
      {
        title: 'VAV Airflow Pickup Tubing Disconnected / 0 CFM',
        description: 'Flow sensor reading 0 CFM, causing box damper to open 100% and over-cool space.',
        severity: 'ACTION REQUIRED',
        fix: 'Reattach clear plastic pitot pickup tubes and zero-calibrate differential sensor.',
      },
      {
        title: 'Ghost Priority 16 Unoccupied Mode Write',
        description: 'Uncommanded background write forcing terminal box into unoccupied heating mode.',
        severity: 'CRITICAL',
        fix: 'Trace point source in Niagara Wire Sheet, clear Priority 16 slot, and relink schedule block.',
      },
    ],
  },
  {
    step: 'visual_evidence',
    title: '6. Photographic & Graphical Evidence Proof',
    subtitle: 'Capture screenshots of wire sheets, Px graphics, priority arrays, and physical panel wiring.',
    whereToCapture: 'Niagara Workbench Screen Capture, Tridium Px Views, On-site smartphone camera.',
    whenToCapture: 'As you identify each major deficiency during steps 2 through 5.',
    whatToCapture: [
      'Niagara Wire Sheet point property sheets showing Priority Arrays with rogue writes',
      'Px Graphics displaying out-of-control PID oscillations, alarm banners, or broken unbound widgets',
      'Physical control panel wiring photos (e.g. broken BACnet shield drains, loose 24VAC transformer lugs)',
      'Damaged damper linkages or leaking chilled water valve packing glands',
    ],
    howToCapture: [
      'Take screenshot in Niagara Workbench (Win+Shift+S or PrtScn) -> Upload/Paste into Visual Evidence builder.',
      'Add visual callout pins and highlight boxes pointing directly to the problem areas.',
      'Include exact Station Slot ORD address, detailed observed symptoms, and field-tested resolution steps.',
    ],
    commonFaults: [
      {
        title: 'Unbound Graphic Widget Displaying Blank',
        description: 'Px graphic widget lost binding link to hardware point, confusing facility operators.',
        severity: 'WARNING',
        fix: 'Re-bind widget ord property to correct station point path.',
      },
    ],
  },
  {
    step: 'executive_summary',
    title: '7. Health Score Index & Prioritized Action Plan',
    subtitle: 'Synthesize audit findings into an executive briefing for Facility Directors and Owners.',
    whereToCapture: 'Synthesized automatically from logged deficiencies and inspector conclusions.',
    whenToCapture: 'Final step before concluding the on-site audit and exporting the deliverable.',
    whatToCapture: [
      'Building Automation Health Index (BAHI) calculated score & category breakdown',
      'Executive Summary narrative highlighting systemic risks (energy waste, comfort, equipment lifetime)',
      'Key Systemic Pattern summary points',
      'Prioritized 3-Phase Action Plan (Immediate 24-48h, Short-term 1-2 weeks, Long-term Capital)',
      'Formal contractor licensing and engineering sign-off credentials',
    ],
    howToCapture: [
      'Use the 1-Click "Synthesize Executive Findings" tool to automatically generate professional narrative.',
      'Review calculated BAHI health index score and adjust weighting if needed.',
      'Print or export as high-resolution PDF for client presentation.',
    ],
    commonFaults: [
      {
        title: 'Vague Action Plan Items',
        description: 'Listing generic advice like "tune system" instead of specific engineering steps.',
        severity: 'INFO',
        fix: 'Ensure action items specify exact component IDs, parameter values, and timeframes.',
      },
    ],
  },
];

export function createBlankSiteAuditReport(
  folderId?: string,
  customerName?: string,
  facilityName?: string
): SiteAuditReport {
  return {
    id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    folderId: folderId || '',
    customerName: customerName || 'New Customer / Site',
    facilityName: facilityName || 'Main Facility Building',
    reportTitle: 'Preventive Maintenance Deficiency Report',
    reportSubtitle: 'Building Automation System & HVAC Controls Field Audit',
    systemArchitecture: 'Tridium Niagara N4 / BACnet IP & MS/TP',
    auditDate: new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
    serviceContractor: 'Engineered Cooling Services',
    auditorName: 'Lead BAS Systems Specialist',
    auditorTitle: 'Senior Field Commissioning Engineer',
    contractorLicense: 'FL-CMC1249871 / Tridium Niagara N4 Certified',
    siteContactName: '',
    siteContactEmail: '',
    status: 'draft',
    healthMetrics: {
      overallHealth: 100,
      supervisoryJace: 100,
      bacnetNetwork: 100,
      controlLoops: 100,
      sensorIntegrity: 100,
      graphicsUi: 100,
    },
    executiveSummary:
      'Scheduled preventive maintenance and controls field audit conducted to evaluate supervisory platform stability, network communication integrity, PID control loop tuning, and terminal zone thermal comfort.',
    keySystemicPatterns: [],
    supervisoryDeficiencies: [],
    plantAhuDeficiencies: [],
    terminalUnitsSummary: [],
    visualEvidenceFigures: [],
    actionPlan: {
      immediatePhase: [],
      shortTermPhase: [],
      longTermPhase: [],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
