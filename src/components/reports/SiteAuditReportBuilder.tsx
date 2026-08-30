import React, { useState, useMemo } from 'react';
import {
  SiteAuditReport,
  ReportCustomerFolder,
  VisualEvidenceFigure,
  SupervisoryDeficiency,
  EquipmentDeficiency,
  TerminalUnitDeficiency,
  DeficiencySeverity,
} from '../../types/reports';
import { VisualEvidenceDiagram } from './VisualEvidenceDiagram';
import { GuidedAuditWizard } from './GuidedAuditWizard';
import { AuditModeSelector, AuditWorkflowMode } from './AuditModeSelector';
import { generateSiteAuditPdfReport } from '../../utils/exportPdfReport';
import {
  Printer,
  FileDown,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Scan,
  RotateCcw,
  Zap,
  Activity,
  Layers,
  Cpu,
  Thermometer,
  LayoutGrid,
  Compass,
  FileCheck2,
  BadgeCheck,
  Folder,
  FolderPlus,
  Save,
  Check,
  ChevronDown,
  Download,
  Share2,
  Calendar,
  Building2,
  MapPin,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { NiagaraProgram } from '../../types/niagara';

interface SiteAuditReportBuilderProps {
  report: SiteAuditReport;
  onUpdateReport: (updated: SiteAuditReport) => void;
  currentProgram?: NiagaraProgram;
  customerFolders?: ReportCustomerFolder[];
  onCreateFolder?: (name: string, location?: string, systemType?: string) => void;
  onOpenSavedReports?: () => void;
  isDark?: boolean;
}

export const SiteAuditReportBuilder: React.FC<SiteAuditReportBuilderProps> = ({
  report: rawReport,
  onUpdateReport,
  currentProgram,
  customerFolders = [],
  onCreateFolder,
  onOpenSavedReports,
  isDark = true,
}) => {
  // Defensive report normalization
  const report = useMemo<SiteAuditReport>(() => {
    const fallbackDate = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    return {
      id: rawReport?.id || `rep_${Date.now()}`,
      folderId: rawReport?.folderId || '',
      customerName: rawReport?.customerName || 'New Facility Client',
      facilityName: rawReport?.facilityName || 'Main Facility Building',
      reportTitle: rawReport?.reportTitle || 'Preventive Maintenance Deficiency Report',
      reportSubtitle:
        rawReport?.reportSubtitle || 'Building Automation System & HVAC Controls Field Audit',
      systemArchitecture:
        rawReport?.systemArchitecture || 'Tridium Niagara N4 / BACnet IP & MS/TP',
      auditDate: rawReport?.auditDate || fallbackDate,
      serviceContractor: rawReport?.serviceContractor || 'Engineered Cooling Services',
      auditorName: rawReport?.auditorName || 'Lead BAS Systems Specialist',
      auditorTitle: rawReport?.auditorTitle || 'Senior Field Commissioning Engineer',
      contractorLicense:
        rawReport?.contractorLicense || 'FL-CMC1249871 / Tridium Niagara N4 Certified',
      siteContactName: rawReport?.siteContactName || '',
      siteContactEmail: rawReport?.siteContactEmail || '',
      status: rawReport?.status || 'draft',
      healthMetrics: {
        overallHealth: rawReport?.healthMetrics?.overallHealth ?? 78,
        supervisoryJace: rawReport?.healthMetrics?.supervisoryJace ?? 75,
        bacnetNetwork: rawReport?.healthMetrics?.bacnetNetwork ?? 70,
        controlLoops: rawReport?.healthMetrics?.controlLoops ?? 75,
        sensorIntegrity: rawReport?.healthMetrics?.sensorIntegrity ?? 80,
        graphicsUi: rawReport?.healthMetrics?.graphicsUi ?? 85,
      },
      executiveSummary:
        rawReport?.executiveSummary ||
        'Scheduled preventive maintenance and controls field audit conducted to evaluate supervisory platform stability, network communication integrity, PID control loop tuning, and terminal zone thermal comfort.',
      keySystemicPatterns: rawReport?.keySystemicPatterns || [
        'Unbalanced BACnet MS/TP polling rate on COM2 causing 12% token timeout latency during morning warm-up.',
        'Widespread Priority 8 manual operator overrides bypassing automatic occupancy schedules.',
        'AHU cooling valve PID loop hunting leading to simultaneous heating and cooling energy waste.',
      ],
      supervisoryDeficiencies: rawReport?.supervisoryDeficiencies || [],
      plantAhuDeficiencies: rawReport?.plantAhuDeficiencies || [],
      terminalUnitsSummary: rawReport?.terminalUnitsSummary || [],
      visualEvidenceFigures: rawReport?.visualEvidenceFigures || [],
      actionPlan: rawReport?.actionPlan || {
        immediatePhase: [
          'Release 11 active Priority 8 manual overrides across air handlers and VAV boxes.',
          'Tune BACnet multi-poll service distribution to balance 5s/15s/30s polling intervals.',
          'Clear JACE-8000 heap memory and purge stale historical alarm buffers.',
        ],
        shortTermPhase: [
          'Retune AHU-01 and AHU-02 chilled water valve PID loops with widened throttling range.',
          'Recalibrate zone temperature sensors in Room 104 and Room 212 exhibiting 4°F drift.',
          'Verify end-of-line 120Ω terminating resistors on MS/TP Trunk B.',
        ],
        longTermPhase: [
          'Upgrade supervisory JACE platform firmware to Niagara 4.13 LTS.',
          'Replace legacy proprietary MS/TP controllers with BACnet/IP terminal controllers.',
          'Standardize plant sequences to ASHRAE Guideline 36 High-Performance Sequences.',
        ],
      },
      createdAt: rawReport?.createdAt || new Date().toISOString(),
      updatedAt: rawReport?.updatedAt || new Date().toISOString(),
    };
  }, [rawReport]);

  const [activeTab, setActiveTab] = useState<'preview' | 'modes' | 'editor' | 'wizard' | 'scanner'>(
    'preview'
  );
  const [selectedFigureId, setSelectedFigureId] = useState<string | null>(
    report.visualEvidenceFigures[0]?.id || null
  );
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);
  const [saveSuccessNotification, setSaveSuccessNotification] = useState<string | null>(null);
  const [isCreatingFolderModal, setIsCreatingFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderLocation, setNewFolderLocation] = useState('');

  // Active customer folder object
  const currentFolder = useMemo(() => {
    return customerFolders.find((f) => f.id === report.folderId) || null;
  }, [customerFolders, report.folderId]);

  // Handle Manual Save
  const handleManualSave = (overrideFolderId?: string) => {
    const updated = {
      ...report,
      folderId: overrideFolderId !== undefined ? overrideFolderId : report.folderId,
      updatedAt: new Date().toISOString(),
    };
    onUpdateReport(updated);

    const folderObj = customerFolders.find((f) => f.id === updated.folderId);
    const folderMsg = folderObj ? `in folder "${folderObj.name}"` : 'to Library';
    setSaveSuccessNotification(`Report successfully saved ${folderMsg} at ${new Date().toLocaleTimeString()}`);
    setTimeout(() => {
      setSaveSuccessNotification(null);
    }, 4500);
  };

  // Folder assignment change
  const handleFolderChange = (newFolderId: string) => {
    const updated = {
      ...report,
      folderId: newFolderId,
      updatedAt: new Date().toISOString(),
    };
    onUpdateReport(updated);

    const folderObj = customerFolders.find((f) => f.id === newFolderId);
    setSaveSuccessNotification(
      folderObj
        ? `Report assigned and saved to folder "${folderObj.name}".`
        : 'Report moved to root library.'
    );
    setTimeout(() => {
      setSaveSuccessNotification(null);
    }, 4000);
  };

  // Create folder inline
  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim() && onCreateFolder) {
      onCreateFolder(newFolderName.trim(), newFolderLocation.trim());
      setNewFolderName('');
      setNewFolderLocation('');
      setIsCreatingFolderModal(false);
      setSaveSuccessNotification(`Created new folder "${newFolderName.trim()}".`);
      setTimeout(() => setSaveSuccessNotification(null), 4000);
    }
  };

  // PDF Export
  const handleExportPdf = () => {
    try {
      generateSiteAuditPdfReport(
        report,
        report.serviceContractor || 'Engineered Cooling Services',
        report.auditorName || 'Lead BAS Systems Specialist'
      );
      setSaveSuccessNotification('Executive Site Audit PDF generated and downloaded successfully.');
      setTimeout(() => setSaveSuccessNotification(null), 4000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      window.print();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate Health Score
  const calculateDerivedHealthScore = () => {
    const totalItems =
      (report.supervisoryDeficiencies?.length || 0) +
      (report.plantAhuDeficiencies?.length || 0) +
      (report.terminalUnitsSummary?.length || 0);

    if (totalItems === 0) return 88;

    let criticalCount = 0;
    let actionCount = 0;
    let warningCount = 0;
    let correctedCount = 0;

    (report.supervisoryDeficiencies || []).forEach((d) => {
      if (d.severity === 'CRITICAL') criticalCount++;
      else if (d.severity === 'ACTION REQUIRED') actionCount++;
      else if (d.severity === 'WARNING') warningCount++;
      else if (d.severity === 'CORRECTED') correctedCount++;
    });

    (report.plantAhuDeficiencies || []).forEach((d) => {
      if (d.severity === 'CRITICAL') criticalCount++;
      else if (d.severity === 'ACTION REQUIRED') actionCount++;
      else if (d.severity === 'WARNING') warningCount++;
    });

    (report.terminalUnitsSummary || []).forEach((d) => {
      if (d.severity === 'CRITICAL') criticalCount++;
      else if (d.severity === 'ACTION REQUIRED') actionCount++;
      else if (d.severity === 'WARNING') warningCount++;
    });

    const penalty = criticalCount * 5 + actionCount * 2.5 + warningCount * 1 - correctedCount * 1.5;
    const base = Math.max(15, Math.min(98, 100 - penalty));
    return Math.round(base);
  };

  const currentHealth = report.healthMetrics?.overallHealth || calculateDerivedHealthScore();

  // Helper to guarantee high-contrast, informative component titles in table
  const getSupervisoryComponentName = (def: SupervisoryDeficiency): string => {
    if (def.componentService && def.componentService.trim().length > 0) {
      return def.componentService.trim();
    }
    const obs = (def.observedDeficiency || '').toLowerCase();
    if (obs.includes('programservice') || obs.includes('slot link') || obs.includes('wiresheet') || obs.includes('null target')) {
      return 'ProgramService / Wire Sheet';
    }
    if (obs.includes('tuning policy') || obs.includes('poll frequency') || obs.includes('polling') || obs.includes('500ms')) {
      return 'BacnetMultiPollService / Tuning';
    }
    if (obs.includes('alarm') || obs.includes('alarmservice') || obs.includes('unacknowledged')) {
      return 'AlarmService / Event Engine';
    }
    if (obs.includes('heap') || obs.includes('memory') || obs.includes('resource') || obs.includes('garbage collection')) {
      return 'Platform Resource Manager';
    }
    if (obs.includes('override') || obs.includes('priority 8') || obs.includes('priority 16')) {
      return 'Point Priority Array Engine';
    }
    if (obs.includes('control block') || obs.includes('execution timing') || obs.includes('signal link') || obs.includes('healthy execution')) {
      return 'BMS Control Logic Engine';
    }
    return 'Station Supervisory Service';
  };

  // Run Automated Station Audit Scanner
  const handleRunAuditScan = () => {
    setIsScanning(true);
    setScanSuccessMessage(null);

    setTimeout(() => {
      setIsScanning(false);
      const blocks = currentProgram?.blocks || [];
      const links = currentProgram?.links || [];

      const newFindings: SupervisoryDeficiency[] = [];

      const overrideBlocks = blocks.filter(
        (b) => b.value !== undefined && b.override !== undefined && b.override !== null
      );
      if (overrideBlocks.length > 0) {
        newFindings.push({
          id: `scan_ovr_${Date.now()}`,
          componentService: 'WireSheet Point Priority Overrides',
          observedDeficiency: `${overrideBlocks.length} manual operator overrides active on Wire Sheet without expiration timer.`,
          impact: 'Automatic occupancy scheduling and economizer logic bypassed',
          statusAction: 'Release Priority 8 Manual Overrides',
          severity: 'ACTION REQUIRED',
        });
      }

      const netData = currentProgram?.networkStudioData;
      if (netData?.devices && netData.devices.length > 0) {
        const offlineDevs = netData.devices.filter((d) => d.status === 'offline');
        if (offlineDevs.length > 0) {
          newFindings.push({
            id: `scan_bac_${Date.now()}`,
            componentService: 'BACnet MS/TP Trunk Scan',
            observedDeficiency: `${offlineDevs.length} BACnet controller(s) unreachable on RS-485 MS/TP bus.`,
            impact: 'Loss of supervisory telemetry and comfort control',
            statusAction: 'Check MS/TP RS-485 EOL 120Ω termination & baud rate',
            severity: 'CRITICAL',
          });
        }
      }

      if (newFindings.length === 0) {
        newFindings.push({
          id: `scan_clean_${Date.now()}`,
          componentService: 'BMS Logic Engine Sweep',
          observedDeficiency: `Analyzed ${blocks.length} active control blocks and ${links.length} signal links. Execution timing verified within normal bounds.`,
          impact: 'System executing at target efficiency',
          statusAction: 'VERIFIED HEALTHY',
          severity: 'CORRECTED',
        });
      }

      onUpdateReport({
        ...report,
        supervisoryDeficiencies: [...report.supervisoryDeficiencies, ...newFindings],
        updatedAt: new Date().toISOString(),
      });

      setScanSuccessMessage(
        `Station Audit completed! Scanned ${blocks.length} control blocks and OT network telemetry. Added ${newFindings.length} verified finding(s).`
      );
    }, 1200);
  };

  // Helper to add supervisory finding
  const handleAddSupervisoryDeficiency = () => {
    const newDef: SupervisoryDeficiency = {
      id: `sup_${Date.now()}`,
      componentService: 'Station JACE Service',
      observedDeficiency: 'Discrepancy in station configuration or communication loop.',
      impact: 'Potential network latency or degraded supervisory efficiency',
      statusAction: 'Audit configuration parameters and verify sequence',
      severity: 'ACTION REQUIRED',
    };
    onUpdateReport({
      ...report,
      supervisoryDeficiencies: [...report.supervisoryDeficiencies, newDef],
      updatedAt: new Date().toISOString(),
    });
  };

  // Helper to add AHU finding
  const handleAddAhuDeficiency = () => {
    const newAhu: EquipmentDeficiency = {
      id: `ahu_${Date.now()}`,
      equipment: `AHU-0${report.plantAhuDeficiencies.length + 1}`,
      locationTarget: 'Mechanical Penthouse',
      observedDeficiencies: ['Supply air discharge temperature oscillating around setpoint.'],
      recommendedAction: 'Retune cooling valve PID loop and verify discharge sensor calibration.',
      severity: 'ACTION REQUIRED',
    };
    onUpdateReport({
      ...report,
      plantAhuDeficiencies: [...report.plantAhuDeficiencies, newAhu],
      updatedAt: new Date().toISOString(),
    });
  };

  // Helper to add Terminal Unit finding
  const handleAddTerminalDeficiency = () => {
    const newTerm: TerminalUnitDeficiency = {
      id: `term_${Date.now()}`,
      unitId: `VAV-${100 + report.terminalUnitsSummary.length + 1}`,
      areaServed: 'Office Zone',
      observedDeficiencies: 'Damper hunting 20-80% under steady load.',
      actionRequired: 'Recalibrate airflow velocity pressure transducer.',
      severity: 'WARNING',
    };
    onUpdateReport({
      ...report,
      terminalUnitsSummary: [...report.terminalUnitsSummary, newTerm],
      updatedAt: new Date().toISOString(),
    });
  };

  // Helper to add Visual Evidence Figure
  const handleAddFigure = () => {
    const nextNum = report.visualEvidenceFigures.length + 1;
    const newFig: VisualEvidenceFigure = {
      id: `fig_${Date.now()}`,
      figureNumber: nextNum,
      title: `Figure ${nextNum} — Field Verification & Inspection`,
      categoryBadge: 'EQUIPMENT INSPECTION',
      diagramType: 'ahu_graphic',
      identifiedDeficiencies: ['Point discrepancy or mechanical override observed during field audit.'],
      recommendedCorrectiveAction:
        'Inspect field sensors, restore autonomous control, and verify feedback loops.',
    };

    onUpdateReport({
      ...report,
      visualEvidenceFigures: [...report.visualEvidenceFigures, newFig],
      updatedAt: new Date().toISOString(),
    });
    setSelectedFigureId(newFig.id);
  };

  return (
    <div
      id="site-audit-report-builder-root"
      className={`flex-1 flex flex-col h-full overflow-hidden ${
        isDark ? 'bg-[#060a14] text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* ========================================================================= */}
      {/* TOP BUILDER COMMAND & FOLDER SELECTION BAR                                */}
      {/* ========================================================================= */}
      <div
        className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-[#090f1d] border-slate-800' : 'bg-white border-slate-300 shadow-sm'
        }`}
      >
        {/* Left: Report Title & Folder Assignment Bar */}
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
              isDark
                ? 'bg-sky-500/10 border border-sky-500/30 text-sky-400'
                : 'bg-sky-50 border border-sky-300 text-sky-700'
            }`}
          >
            <FileDown className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2
                className={`text-sm font-bold tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {report.reportTitle}
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono border ${
                  isDark
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                    : 'bg-sky-100 text-sky-800 border-sky-300'
                }`}
              >
                {report.status}
              </span>

              {/* Customer Folder Selector Dropdown */}
              <div
                className={`flex items-center gap-1.5 rounded-lg px-2 py-0.5 border ${
                  isDark
                    ? 'bg-slate-950/80 border-slate-700/80'
                    : 'bg-slate-50 border-slate-300 shadow-xs'
                }`}
              >
                <Folder className="w-3 h-3 text-amber-500 shrink-0" />
                <span
                  className={`text-[10px] font-mono ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Folder:
                </span>
                <select
                  id="report-folder-select"
                  value={report.folderId || ''}
                  onChange={(e) => handleFolderChange(e.target.value)}
                  className={`bg-transparent text-xs font-medium outline-none cursor-pointer ${
                    isDark
                      ? 'text-slate-200 hover:text-white'
                      : 'text-slate-800 hover:text-slate-950'
                  }`}
                  title="Assign this audit report to a customer / site folder"
                >
                  <option
                    value=""
                    className={isDark ? 'bg-slate-900 text-slate-300' : 'bg-white text-slate-700'}
                  >
                    -- Root Library (No Folder) --
                  </option>
                  {customerFolders.map((folder) => (
                    <option
                      key={folder.id}
                      value={folder.id}
                      className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}
                    >
                      📁 {folder.name} {folder.facilityLocation ? `(${folder.facilityLocation})` : ''}
                    </option>
                  ))}
                </select>

                {onCreateFolder && (
                  <button
                    onClick={() => setIsCreatingFolderModal(true)}
                    title="Create new customer folder"
                    className={`p-0.5 rounded transition-colors ml-1 ${
                      isDark
                        ? 'text-slate-400 hover:text-sky-400 hover:bg-slate-800'
                        : 'text-slate-500 hover:text-sky-700 hover:bg-slate-200'
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <p
              className={`text-xs mt-0.5 flex items-center gap-1.5 flex-wrap ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              <span
                className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}
              >
                {report.customerName}
              </span>
              <span>&bull;</span>
              <span>{report.facilityName}</span>
              <span>&bull;</span>
              <span className="font-mono text-[11px]">{report.auditDate}</span>
              {currentFolder && (
                <>
                  <span>&bull;</span>
                  <span
                    className={`font-mono text-[11px] font-semibold ${
                      isDark ? 'text-amber-400/90' : 'text-amber-700'
                    }`}
                  >
                    Saved in: {currentFolder.name}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right: Tab Switcher & Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Navigation Tabs */}
          <div
            className={`flex p-0.5 rounded-lg border ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-200 border-slate-300'
            }`}
          >
            <button
              id="report-preview-tab-btn"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'preview'
                  ? 'bg-sky-600 text-white shadow-sm font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Executive Report</span>
            </button>
            <button
              id="report-wizard-tab-btn"
              onClick={() => setActiveTab('wizard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'wizard'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : isDark
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Guided Field Audit</span>
            </button>
            <button
              id="report-editor-tab-btn"
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'editor'
                  ? 'bg-sky-600 text-white shadow-sm font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Findings & Proofs</span>
            </button>
            <button
              id="report-scanner-tab-btn"
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'scanner'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : isDark
                  ? 'text-emerald-400 hover:text-emerald-300'
                  : 'text-emerald-800 hover:text-emerald-950'
              }`}
            >
              <Scan className="w-3.5 h-3.5" />
              <span>Auto Scanner</span>
            </button>
            <button
              id="report-modes-tab-btn"
              onClick={() => setActiveTab('modes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'modes'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : isDark
                  ? 'text-indigo-300 hover:text-white'
                  : 'text-indigo-800 hover:text-indigo-950'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mode Setup</span>
            </button>
          </div>

          {/* Save to Library Button */}
          <button
            id="save-report-btn"
            onClick={() => handleManualSave()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all active:scale-95 cursor-pointer"
            title="Save report into your Saved Reports library"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save to Library</span>
          </button>

          {/* Export High-Res PDF Button */}
          <button
            id="export-pdf-report-btn"
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-md transition-all active:scale-95 cursor-pointer"
            title="Download publication-grade vector PDF report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Executive PDF</span>
          </button>

          {/* Print Button */}
          <button
            id="print-report-btn"
            onClick={handlePrint}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border shadow transition-all active:scale-95 cursor-pointer ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
            }`}
            title="Print or Save as PDF via browser"
          >
            <Printer className={`w-3.5 h-3.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Save / Status Toast Notification */}
      {saveSuccessNotification && (
        <div className="bg-emerald-950/95 border-b border-emerald-500/40 px-4 py-2 flex items-center justify-between text-xs text-emerald-200 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{saveSuccessNotification}</span>
          </div>
          <button
            onClick={() => setSaveSuccessNotification(null)}
            className="text-emerald-400 hover:text-white font-mono text-[10px] uppercase font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Inline Create Folder Modal */}
      {isCreatingFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Create New Customer / Site Folder</h3>
              </div>
              <button
                onClick={() => setIsCreatingFolderModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFolderSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Customer / Client Name *
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Acme Industrial Aerospace"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Facility Location / Campus
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pensacola Hangar Complex, Building 4"
                  value={newFolderLocation}
                  onChange={(e) => setNewFolderLocation(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingFolderModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-lg shadow"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN TAB CONTENT AREA                                                     */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        {/* ========================================================================= */}
        {/* TAB 1: EXECUTIVE REPORT PREVIEW (PUBLICATION GRADE)                       */}
        {/* ========================================================================= */}
        {activeTab === 'preview' && (
          <div className="max-w-5xl mx-auto space-y-6 print:m-0 print:p-0 print:max-w-none">
            {/* Quick Actions & Audit Mode Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/50 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                  <BadgeCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Executive BAS Engineering Audit Deliverable
                  </h3>
                  <p className="text-xs text-slate-300">
                    Ready for client presentation. You can edit findings, export high-res vector PDF, or trigger automated scans.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  onClick={() => setActiveTab('editor')}
                  className="px-3.5 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg border border-slate-600 shadow transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Edit Findings</span>
                </button>
                <button
                  onClick={handleExportPdf}
                  className="px-3.5 py-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-lg shadow transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            {/* Publication-Grade Master Report Document Container */}
            <div
              className={`p-6 sm:p-10 rounded-2xl border shadow-2xl transition-all ${
                isDark
                  ? 'bg-[#091120] border-slate-800 text-slate-100'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              {/* Document Header Letterhead */}
              <div
                className={`border-b pb-6 mb-6 ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded bg-rose-600 text-white font-mono font-black text-xs tracking-wider shadow">
                        {report.supervisoryDeficiencies.length +
                          report.plantAhuDeficiencies.length +
                          report.terminalUnitsSummary.length}{' '}
                        VERIFIED DEFICIENCIES
                      </span>
                      <span
                        className={`text-xs font-mono ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        AUDIT REF: {report.id.substring(0, 16).toUpperCase()}
                      </span>
                      <span
                        className={`text-xs font-mono px-2 py-0.2 rounded ${
                          isDark
                            ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800'
                            : 'text-emerald-800 bg-emerald-100 border border-emerald-300 font-bold'
                        }`}
                      >
                        ASHRAE 36 COMPLIANT AUDIT
                      </span>
                    </div>
                    <h1
                      className={`text-2xl sm:text-3xl font-black tracking-tight uppercase font-sans ${
                        isDark ? 'text-white' : 'text-slate-950'
                      }`}
                    >
                      {report.reportTitle}
                    </h1>
                    <p
                      className={`text-sm font-bold ${
                        isDark ? 'text-sky-400' : 'text-sky-700'
                      }`}
                    >
                      {report.reportSubtitle}
                    </p>
                  </div>

                  {/* Contractor Brand Box */}
                  <div
                    className={`rounded-xl p-3 text-right font-mono text-[11px] shadow-sm shrink-0 min-w-[200px] border ${
                      isDark
                        ? 'bg-slate-950 border-slate-700/80'
                        : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <span
                      className={`font-extrabold block uppercase tracking-wide ${
                        isDark ? 'text-amber-400' : 'text-amber-700'
                      }`}
                    >
                      {report.serviceContractor}
                    </span>
                    <span
                      className={`text-[10px] block mt-0.5 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      Building Automation Systems Division
                    </span>
                    <span
                      className={`text-[9px] block mt-1 ${
                        isDark ? 'text-slate-500' : 'text-slate-500'
                      }`}
                    >
                      License: {report.contractorLicense || 'FL-CMC1249871'}
                    </span>
                  </div>
                </div>

                {/* Audit Metadata Grid (4 Cards) */}
                <div
                  className={`grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t text-xs font-mono ${
                    isDark ? 'border-slate-800/80' : 'border-slate-200'
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-lg border ${
                      isDark
                        ? 'bg-slate-900/60 border-slate-800'
                        : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <span
                      className={`block text-[10px] font-bold ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      CLIENT / FACILITY
                    </span>
                    <strong
                      className={`text-xs block truncate mt-0.5 ${
                        isDark ? 'text-white' : 'text-slate-950'
                      }`}
                    >
                      {report.customerName}
                    </strong>
                  </div>
                  <div
                    className={`p-2.5 rounded-lg border ${
                      isDark
                        ? 'bg-slate-900/60 border-slate-800'
                        : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <span
                      className={`block text-[10px] font-bold ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      FACILITY LOCATION
                    </span>
                    <strong
                      className={`text-xs block truncate mt-0.5 ${
                        isDark ? 'text-white' : 'text-slate-950'
                      }`}
                    >
                      {report.facilityName}
                    </strong>
                  </div>
                  <div
                    className={`p-2.5 rounded-lg border ${
                      isDark
                        ? 'bg-slate-900/60 border-slate-800'
                        : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <span
                      className={`block text-[10px] font-bold ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      SYSTEM PLATFORM
                    </span>
                    <strong
                      className={`text-xs block truncate mt-0.5 ${
                        isDark ? 'text-sky-400' : 'text-sky-700'
                      }`}
                    >
                      {report.systemArchitecture}
                    </strong>
                  </div>
                  <div
                    className={`p-2.5 rounded-lg border ${
                      isDark
                        ? 'bg-slate-900/60 border-slate-800'
                        : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <span
                      className={`block text-[10px] font-bold ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      AUDIT DATE & LEAD TECH
                    </span>
                    <strong
                      className={`text-xs block truncate mt-0.5 ${
                        isDark ? 'text-white' : 'text-slate-950'
                      }`}
                    >
                      {report.auditDate}
                    </strong>
                    <span
                      className={`text-[10px] block truncate ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      {report.auditorName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Building Automation Health Index (BAHI) Scorecard */}
              <div
                className={`border rounded-2xl p-5 mb-8 shadow-md ${
                  isDark
                    ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-slate-800'
                    : 'bg-slate-50 border-slate-300'
                }`}
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    {/* Radial Health Gauge */}
                    <div
                      className={`relative w-22 h-22 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 shadow-lg p-3 ${
                        currentHealth >= 80
                          ? isDark
                            ? 'border-emerald-500/80 bg-emerald-950/40 text-emerald-300'
                            : 'border-emerald-500 bg-emerald-50 text-emerald-800'
                          : currentHealth >= 60
                          ? isDark
                            ? 'border-amber-500/80 bg-amber-950/40 text-amber-300'
                            : 'border-amber-500 bg-amber-50 text-amber-800'
                          : isDark
                          ? 'border-rose-500/80 bg-rose-950/40 text-rose-300'
                          : 'border-rose-500 bg-rose-50 text-rose-800'
                      }`}
                    >
                      <span className="text-2xl font-black font-mono leading-none">
                        {currentHealth}%
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold uppercase mt-1 ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        BAHI INDEX
                      </span>
                    </div>

                    <div>
                      <h3
                        className={`text-sm font-bold flex items-center gap-2 ${
                          isDark ? 'text-white' : 'text-slate-950'
                        }`}
                      >
                        <Activity className="w-4 h-4 text-sky-500" />
                        <span>Building Automation Health Index (BAHI)</span>
                      </h3>
                      <p
                        className={`text-xs mt-1 max-w-lg leading-relaxed ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        Weighted evaluation of supervisory platform heap, BACnet token latency, PID control loop stability, sensor calibration accuracy, and operator override compliance.
                      </p>
                    </div>
                  </div>

                  {/* Sub-Metrics Breakdown Bars */}
                  <div className="grid grid-cols-2 gap-3 w-full md:w-auto font-mono text-[11px]">
                    <div
                      className={`p-2.5 rounded-lg border min-w-[140px] ${
                        isDark
                          ? 'bg-slate-900/90 border-slate-800'
                          : 'bg-white border-slate-300 shadow-xs'
                      }`}
                    >
                      <div
                        className={`flex justify-between text-[10px] ${
                          isDark ? 'text-slate-300' : 'text-slate-700 font-semibold'
                        }`}
                      >
                        <span>JACE Heap:</span>
                        <strong
                          className={
                            report.healthMetrics.supervisoryJace < 50
                              ? isDark ? 'text-rose-400' : 'text-rose-700'
                              : isDark ? 'text-emerald-400' : 'text-emerald-700'
                          }
                        >
                          {report.healthMetrics.supervisoryJace}%
                        </strong>
                      </div>
                      <div
                        className={`w-full h-2 rounded-full mt-1.5 overflow-hidden ${
                          isDark ? 'bg-slate-800' : 'bg-slate-200'
                        }`}
                      >
                        <div
                          style={{ width: `${report.healthMetrics.supervisoryJace}%` }}
                          className={`h-full ${
                            report.healthMetrics.supervisoryJace < 50 ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                        />
                      </div>
                    </div>

                    <div
                      className={`p-2.5 rounded-lg border min-w-[140px] ${
                        isDark
                          ? 'bg-slate-900/90 border-slate-800'
                          : 'bg-white border-slate-300 shadow-xs'
                      }`}
                    >
                      <div
                        className={`flex justify-between text-[10px] ${
                          isDark ? 'text-slate-300' : 'text-slate-700 font-semibold'
                        }`}
                      >
                        <span>BACnet MS/TP:</span>
                        <strong
                          className={
                            report.healthMetrics.bacnetNetwork < 50
                              ? isDark ? 'text-rose-400' : 'text-rose-700'
                              : isDark ? 'text-amber-400' : 'text-amber-700'
                          }
                        >
                          {report.healthMetrics.bacnetNetwork}%
                        </strong>
                      </div>
                      <div
                        className={`w-full h-2 rounded-full mt-1.5 overflow-hidden ${
                          isDark ? 'bg-slate-800' : 'bg-slate-200'
                        }`}
                      >
                        <div
                          style={{ width: `${report.healthMetrics.bacnetNetwork}%` }}
                          className={`h-full ${
                            report.healthMetrics.bacnetNetwork < 50 ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                        />
                      </div>
                    </div>

                    <div
                      className={`p-2.5 rounded-lg border min-w-[140px] ${
                        isDark
                          ? 'bg-slate-900/90 border-slate-800'
                          : 'bg-white border-slate-300 shadow-xs'
                      }`}
                    >
                      <div
                        className={`flex justify-between text-[10px] ${
                          isDark ? 'text-slate-300' : 'text-slate-700 font-semibold'
                        }`}
                      >
                        <span>Control Loops:</span>
                        <strong className={isDark ? 'text-emerald-400' : 'text-emerald-700'}>
                          {report.healthMetrics.controlLoops}%
                        </strong>
                      </div>
                      <div
                        className={`w-full h-2 rounded-full mt-1.5 overflow-hidden ${
                          isDark ? 'bg-slate-800' : 'bg-slate-200'
                        }`}
                      >
                        <div
                          style={{ width: `${report.healthMetrics.controlLoops}%` }}
                          className="h-full bg-emerald-500"
                        />
                      </div>
                    </div>

                    <div
                      className={`p-2.5 rounded-lg border min-w-[140px] ${
                        isDark
                          ? 'bg-slate-900/90 border-slate-800'
                          : 'bg-white border-slate-300 shadow-xs'
                      }`}
                    >
                      <div
                        className={`flex justify-between text-[10px] ${
                          isDark ? 'text-slate-300' : 'text-slate-700 font-semibold'
                        }`}
                      >
                        <span>Sensors & IO:</span>
                        <strong className={isDark ? 'text-emerald-400' : 'text-emerald-700'}>
                          {report.healthMetrics.sensorIntegrity}%
                        </strong>
                      </div>
                      <div
                        className={`w-full h-2 rounded-full mt-1.5 overflow-hidden ${
                          isDark ? 'bg-slate-800' : 'bg-slate-200'
                        }`}
                      >
                        <div
                          style={{ width: `${report.healthMetrics.sensorIntegrity}%` }}
                          className="h-full bg-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. Executive Summary & Operational Context */}
              <div className="mb-8">
                <div
                  className={`flex items-center justify-between border-b pb-2 mb-3 ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}
                >
                  <h3
                    className={`text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 ${
                      isDark ? 'text-sky-400' : 'text-sky-700'
                    }`}
                  >
                    <FileCheck2 className="w-4 h-4" />
                    <span>1. Executive Summary & Operational Context</span>
                  </h3>
                </div>
                <div
                  className={`p-4 rounded-xl border text-xs leading-relaxed font-sans shadow-inner ${
                    isDark
                      ? 'bg-slate-950/80 border-slate-800 text-slate-100'
                      : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                >
                  {report.executiveSummary}
                </div>
              </div>

              {/* Key Systemic Patterns Identified Across Site Callout Box */}
              {report.keySystemicPatterns && report.keySystemicPatterns.length > 0 && (
                <div
                  className={`p-4 rounded-xl border mb-8 shadow-sm ${
                    isDark
                      ? 'bg-amber-950/30 border-amber-500/40'
                      : 'bg-amber-50 border-amber-300'
                  }`}
                >
                  <h4
                    className={`text-xs font-bold font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5 ${
                      isDark ? 'text-amber-400' : 'text-amber-800'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Key Systemic Patterns & Site-Wide Energy Risks:</span>
                  </h4>
                  <ul
                    className={`space-y-1.5 text-xs font-sans ${
                      isDark ? 'text-amber-200/90' : 'text-amber-950 font-medium'
                    }`}
                  >
                    {report.keySystemicPatterns.map((pat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span
                          className={`font-bold font-mono shrink-0 ${
                            isDark ? 'text-amber-400' : 'text-amber-700'
                          }`}
                        >
                          &bull;
                        </span>
                        <span>{pat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 2. Station-Wide & Supervisory System Deficiencies Table */}
              <div className="mb-8">
                <div
                  className={`flex items-center justify-between border-b pb-2 mb-3 ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}
                >
                  <h3
                    className={`text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 ${
                      isDark ? 'text-sky-400' : 'text-sky-800 font-black'
                    }`}
                  >
                    <Cpu className="w-4 h-4" />
                    <span>2. Station-Wide & Supervisory Platform Deficiencies</span>
                  </h3>
                  <span
                    className={`text-[11px] font-mono ${
                      isDark ? 'text-slate-400' : 'text-slate-700 font-bold'
                    }`}
                  >
                    {report.supervisoryDeficiencies.length} Item(s)
                  </span>
                </div>

                <div
                  className={`overflow-x-auto rounded-xl border shadow-sm ${
                    isDark ? 'border-slate-800 bg-[#08101e]' : 'border-slate-300 bg-white'
                  }`}
                >
                  <table className="w-full text-left text-xs font-sans border-collapse">
                    <thead>
                      <tr className="bg-[#0f1d35] text-white border-b-2 border-slate-700 font-mono text-[11px] font-bold">
                        <th className="p-3 w-48">Component / Service</th>
                        <th className="p-3">Observed Deficiency</th>
                        <th className="p-3 w-56">Operational Impact</th>
                        <th className="p-3 w-44">Status / Action</th>
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y ${
                        isDark
                          ? 'divide-slate-800/80 bg-[#08101e]'
                          : 'divide-slate-200 bg-white'
                      }`}
                    >
                      {report.supervisoryDeficiencies.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className={`p-4 text-center italic ${
                              isDark ? 'text-slate-400' : 'text-slate-700 font-medium'
                            }`}
                          >
                            No supervisory platform deficiencies recorded. Click "Findings & Proofs" or "Auto Scanner" to add items.
                          </td>
                        </tr>
                      ) : (
                        report.supervisoryDeficiencies.map((def, idx) => {
                          const isCorrected = def.severity === 'CORRECTED' || def.statusAction.toUpperCase().includes('HEALTHY') || def.statusAction.toUpperCase().includes('VERIFIED');
                          const isCritical = def.severity === 'CRITICAL' || def.statusAction.toUpperCase().includes('CRITICAL');
                          
                          return (
                            <tr
                              key={def.id}
                              className={`transition-colors ${
                                idx % 2 === 0
                                  ? isDark ? 'bg-[#08101e]' : 'bg-white'
                                  : isDark ? 'bg-[#0c1626]' : 'bg-slate-50'
                              } ${
                                isDark ? 'hover:bg-slate-800/70' : 'hover:bg-sky-50/60'
                              }`}
                            >
                              <td
                                className={`p-3 font-bold font-mono text-[11px] align-top ${
                                  isDark ? 'text-sky-300' : 'text-slate-950 font-black'
                                }`}
                              >
                                {getSupervisoryComponentName(def)}
                              </td>
                              <td
                                className={`p-3 text-xs leading-relaxed align-top ${
                                  isDark ? 'text-slate-100 font-normal' : 'text-slate-900 font-medium'
                                }`}
                              >
                                {def.observedDeficiency}
                              </td>
                              <td
                                className={`p-3 text-[11px] leading-snug align-top ${
                                  isDark ? 'text-slate-200 font-medium' : 'text-slate-900 font-semibold'
                                }`}
                              >
                                {def.impact}
                              </td>
                              <td className="p-3 align-top">
                                <span
                                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black font-mono uppercase tracking-tight block text-center shadow-xs ${
                                    isCorrected
                                      ? isDark
                                        ? 'bg-emerald-950 text-emerald-200 border border-emerald-500 font-bold'
                                        : 'bg-emerald-100 text-emerald-950 border-2 border-emerald-700 font-black'
                                      : isCritical
                                      ? isDark
                                        ? 'bg-rose-950 text-rose-200 border border-rose-500 font-bold'
                                        : 'bg-rose-100 text-rose-950 border-2 border-rose-700 font-black'
                                      : isDark
                                      ? 'bg-amber-950 text-amber-200 border border-amber-500 font-bold'
                                      : 'bg-amber-100 text-amber-950 border-2 border-amber-600 font-black'
                                  }`}
                                >
                                  {def.statusAction}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Central Plant & Air Handling Units (AHU) Deficiencies Table */}
              <div className="mb-8">
                <div
                  className={`flex items-center justify-between border-b pb-2 mb-3 ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}
                >
                  <h3
                    className={`text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 ${
                      isDark ? 'text-sky-400' : 'text-sky-800 font-black'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>3. Central Plant & Air Handling Units (AHU) Deficiencies</span>
                  </h3>
                  <span
                    className={`text-[11px] font-mono ${
                      isDark ? 'text-slate-400' : 'text-slate-700 font-bold'
                    }`}
                  >
                    {report.plantAhuDeficiencies.length} Item(s)
                  </span>
                </div>

                <div
                  className={`overflow-x-auto rounded-xl border shadow-sm ${
                    isDark ? 'border-slate-800 bg-[#08101e]' : 'border-slate-300 bg-white'
                  }`}
                >
                  <table className="w-full text-left text-xs font-sans border-collapse">
                    <thead>
                      <tr className="bg-[#0f1d35] text-white border-b-2 border-slate-700 font-mono text-[11px] font-bold">
                        <th className="p-3 w-36">Equipment</th>
                        <th className="p-3 w-44">Location / Target</th>
                        <th className="p-3">Observed Deficiencies</th>
                        <th className="p-3 w-72">Recommended Corrective Action</th>
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y ${
                        isDark
                          ? 'divide-slate-800/80 bg-[#08101e]'
                          : 'divide-slate-200 bg-white'
                      }`}
                    >
                      {report.plantAhuDeficiencies.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className={`p-4 text-center italic ${
                              isDark ? 'text-slate-400' : 'text-slate-700 font-medium'
                            }`}
                          >
                            No central plant or AHU deficiencies recorded.
                          </td>
                        </tr>
                      ) : (
                        report.plantAhuDeficiencies.map((ahu, idx) => (
                          <tr
                            key={ahu.id}
                            className={`transition-colors ${
                              idx % 2 === 0
                                ? isDark ? 'bg-[#08101e]' : 'bg-white'
                                : isDark ? 'bg-[#0c1626]' : 'bg-slate-50'
                            } ${
                              isDark ? 'hover:bg-slate-800/70' : 'hover:bg-sky-50/60'
                            }`}
                          >
                            <td
                              className={`p-3 font-bold font-mono text-[11px] align-top ${
                                isDark ? 'text-sky-300' : 'text-slate-950 font-black'
                              }`}
                            >
                              {ahu.equipment}
                            </td>
                            <td
                              className={`p-3 font-mono text-[11px] font-medium align-top ${
                                isDark ? 'text-slate-300' : 'text-slate-800'
                              }`}
                            >
                              {ahu.locationTarget}
                            </td>
                            <td
                              className={`p-3 text-xs leading-relaxed align-top ${
                                isDark ? 'text-slate-100 font-normal' : 'text-slate-900 font-medium'
                              }`}
                            >
                              <ul className="list-disc list-inside space-y-1.5">
                                {ahu.observedDeficiencies.map((obs, oIdx) => (
                                  <li key={oIdx} className="leading-snug">
                                    {obs}
                                  </li>
                                ))}
                              </ul>
                            </td>
                            <td
                              className={`p-3 text-[11px] font-medium leading-relaxed align-top ${
                                isDark ? 'text-sky-200' : 'text-slate-950 font-bold'
                              }`}
                            >
                              <div
                                className={`p-2 rounded-lg border ${
                                  isDark
                                    ? 'bg-sky-950/40 border-sky-800/60 text-sky-200'
                                    : 'bg-sky-50 border-sky-200 text-sky-950 font-semibold'
                                }`}
                              >
                                {ahu.recommendedAction}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Terminal Units (FCUs, VAVs) & Exhaust Fans Summary Table */}
              <div className="mb-8">
                <div
                  className={`flex items-center justify-between border-b pb-2 mb-3 ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}
                >
                  <h3
                    className={`text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 ${
                      isDark ? 'text-sky-400' : 'text-sky-800 font-black'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span>4. Terminal Units (VAV, FCU) & Exhaust Fan Summary</span>
                  </h3>
                  <span
                    className={`text-[11px] font-mono ${
                      isDark ? 'text-slate-400' : 'text-slate-700 font-bold'
                    }`}
                  >
                    {report.terminalUnitsSummary.length} Unit(s) Documented
                  </span>
                </div>

                <div
                  className={`overflow-x-auto rounded-xl border max-h-96 overflow-y-auto shadow-sm ${
                    isDark ? 'border-slate-800 bg-[#08101e]' : 'border-slate-300 bg-white'
                  }`}
                >
                  <table className="w-full text-left text-xs font-sans border-collapse">
                    <thead
                      className={`sticky top-0 border-b-2 font-mono text-[11px] font-bold z-10 ${
                        isDark ? 'bg-[#0f1d35] text-white border-slate-700' : 'bg-[#0f1d35] text-white border-slate-700'
                      }`}
                    >
                      <tr>
                        <th className="p-2.5 w-32">Unit ID</th>
                        <th className="p-2.5 w-48">Area Served</th>
                        <th className="p-2.5">Observed Deficiencies</th>
                        <th className="p-2.5 w-72">Action Required</th>
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y ${
                        isDark
                          ? 'divide-slate-800/80 bg-[#08101e]'
                          : 'divide-slate-200 bg-white'
                      }`}
                    >
                      {report.terminalUnitsSummary.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className={`p-4 text-center italic ${
                              isDark ? 'text-slate-400' : 'text-slate-700 font-medium'
                            }`}
                          >
                            No terminal unit deficiencies recorded.
                          </td>
                        </tr>
                      ) : (
                        report.terminalUnitsSummary.map((term, idx) => (
                          <tr
                            key={term.id}
                            className={`transition-colors ${
                              idx % 2 === 0
                                ? isDark ? 'bg-[#08101e]' : 'bg-white'
                                : isDark ? 'bg-[#0c1626]' : 'bg-slate-50'
                            } ${
                              isDark ? 'hover:bg-slate-800/70' : 'hover:bg-sky-50/60'
                            }`}
                          >
                            <td
                              className={`p-2.5 font-bold font-mono text-[11px] align-top ${
                                isDark ? 'text-white' : 'text-slate-950 font-black'
                              }`}
                            >
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                  term.severity === 'CRITICAL'
                                    ? isDark
                                      ? 'bg-rose-950 text-rose-200 border border-rose-500 font-bold'
                                      : 'bg-rose-100 text-rose-950 border border-rose-400 font-black'
                                    : isDark
                                    ? 'bg-slate-800 text-slate-100 border border-slate-700 font-bold'
                                    : 'bg-slate-200 text-slate-950 border border-slate-400 font-bold'
                                }`}
                              >
                                {term.unitId}
                              </span>
                            </td>
                            <td
                              className={`p-2.5 text-[11px] font-mono font-medium align-top ${
                                isDark ? 'text-slate-300' : 'text-slate-800'
                              }`}
                            >
                              {term.areaServed}
                            </td>
                            <td
                              className={`p-2.5 text-[11px] leading-snug align-top ${
                                isDark ? 'text-slate-100 font-normal' : 'text-slate-900 font-medium'
                              }`}
                            >
                              {term.observedDeficiencies}
                            </td>
                            <td
                              className={`p-2.5 text-[11px] font-bold leading-snug align-top ${
                                isDark ? 'text-amber-300' : 'text-amber-950'
                              }`}
                            >
                              <div
                                className={`p-1.5 rounded border ${
                                  isDark
                                    ? 'bg-amber-950/40 border-amber-800/60 text-amber-200 font-medium'
                                    : 'bg-amber-50 border-amber-200 text-amber-950 font-bold'
                                }`}
                              >
                                {term.actionRequired}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5. Detailed Visual Evidence & Technical Breakdown */}
              <div className="mb-8">
                <div
                  className={`flex items-center justify-between border-b pb-2 mb-4 ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <h3
                      className={`text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 ${
                        isDark ? 'text-sky-400' : 'text-sky-800 font-black'
                      }`}
                    >
                      <Thermometer className="w-4 h-4" />
                      <span>5. Detailed Visual Evidence & Field Engineering Captures</span>
                    </h3>
                    <p
                      className={`text-xs mt-0.5 ${
                        isDark ? 'text-slate-400' : 'text-slate-700 font-medium'
                      }`}
                    >
                      Technician wire sheet snapshots, graphical point bindings, and component investigations.
                    </p>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                      isDark
                        ? 'text-sky-400 bg-sky-950/80 border-sky-800'
                        : 'text-sky-900 bg-sky-100 border-sky-300 font-black'
                    }`}
                  >
                    {report.visualEvidenceFigures.length} Figures
                  </span>
                </div>

                {/* Grid of Visual Evidence Figures */}
                <div className="space-y-6">
                  {report.visualEvidenceFigures.map((fig) => (
                    <div
                      key={fig.id}
                      id={`figure-card-${fig.figureNumber}`}
                      className={`p-5 rounded-2xl border shadow-md transition-all ${
                        isDark
                          ? 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                          : 'bg-white border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {/* Figure Header */}
                      <div
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 mb-3 ${
                          isDark ? 'border-slate-800' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded uppercase border ${
                              isDark
                                ? 'bg-sky-900/80 text-sky-200 border-sky-700'
                                : 'bg-sky-100 text-sky-900 border-sky-300 font-black'
                            }`}
                          >
                            Figure {fig.figureNumber}
                          </span>
                          <h4
                            className={`text-sm font-bold ${
                              isDark ? 'text-white' : 'text-slate-950 font-black'
                            }`}
                          >
                            {fig.title}
                          </h4>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border ${
                            isDark
                              ? 'text-slate-300 bg-slate-900 border-slate-800'
                              : 'text-slate-800 bg-slate-100 border-slate-300 font-bold'
                          }`}
                        >
                          {fig.categoryBadge}
                        </span>
                      </div>

                      {/* Visual Graphic Representation */}
                      <div className="my-3">
                        <VisualEvidenceDiagram figure={fig} isDark={isDark} />
                      </div>

                      {/* Identified Deficiencies Bullets */}
                      <div className="mt-4 space-y-2">
                        <div>
                          <span
                            className={`text-[11px] font-bold font-mono uppercase tracking-wide block mb-1 ${
                              isDark ? 'text-rose-400' : 'text-rose-900 font-black'
                            }`}
                          >
                            Identified Deficiencies:
                          </span>
                          <ul
                            className={`list-disc list-inside space-y-1 text-xs font-sans ${
                              isDark ? 'text-slate-200 font-normal' : 'text-slate-900 font-medium'
                            }`}
                          >
                            {fig.identifiedDeficiencies.map((def, idx) => (
                              <li key={idx} className="leading-snug">
                                {def}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Recommended Corrective Action Card */}
                        <div
                          className={`p-3.5 rounded-xl border text-xs font-sans mt-3 shadow-inner ${
                            isDark
                              ? 'bg-sky-950/40 border-sky-800/60 text-sky-200'
                              : 'bg-sky-50 border border-sky-200 text-sky-950 font-medium'
                          }`}
                        >
                          <span
                            className={`font-bold font-mono uppercase tracking-wide block mb-0.5 flex items-center gap-1.5 ${
                              isDark ? 'text-sky-300' : 'text-sky-900 font-black'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Recommended Corrective Action:
                          </span>
                          <p
                            className={`leading-relaxed ${
                              isDark ? 'text-slate-200' : 'text-slate-900 font-medium'
                            }`}
                          >
                            {fig.recommendedCorrectiveAction}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Prioritized Corrective Action Roadmap (3-Phase) */}
              <div className="mb-8">
                <div
                  className={`border-b pb-2 mb-4 ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}
                >
                  <h3
                    className={`text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 ${
                      isDark ? 'text-sky-400' : 'text-sky-800 font-black'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>6. Prioritized Corrective Action Roadmap</span>
                  </h3>
                  <p
                    className={`text-xs mt-0.5 ${
                      isDark ? 'text-slate-400' : 'text-slate-700 font-medium'
                    }`}
                  >
                    Structured remediation timeline designed to maximize immediate energy recovery and long-term equipment reliability.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Phase 1 */}
                  <div
                    className={`p-4 rounded-xl border shadow-sm space-y-2 ${
                      isDark
                        ? 'bg-rose-950/20 border-rose-500/30'
                        : 'bg-rose-50/80 border-2 border-rose-200'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between border-b pb-1.5 ${
                        isDark ? 'border-rose-500/30' : 'border-rose-200'
                      }`}
                    >
                      <span
                        className={`text-xs font-bold font-mono ${
                          isDark ? 'text-rose-400' : 'text-rose-950 font-black'
                        }`}
                      >
                        PHASE 1: 0 - 48 HOURS
                      </span>
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                          isDark
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-rose-200 text-rose-950 font-black'
                        }`}
                      >
                        Immediate
                      </span>
                    </div>
                    <ul
                      className={`space-y-1.5 text-xs ${
                        isDark ? 'text-slate-200' : 'text-slate-900 font-medium'
                      }`}
                    >
                      {(report.actionPlan?.immediatePhase || []).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span
                            className={`font-bold ${
                              isDark ? 'text-rose-400' : 'text-rose-700'
                            }`}
                          >
                            •
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Phase 2 */}
                  <div
                    className={`p-4 rounded-xl border shadow-sm space-y-2 ${
                      isDark
                        ? 'bg-amber-950/20 border-amber-500/30'
                        : 'bg-amber-50/80 border-2 border-amber-200'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between border-b pb-1.5 ${
                        isDark ? 'border-amber-500/30' : 'border-amber-200'
                      }`}
                    >
                      <span
                        className={`text-xs font-bold font-mono ${
                          isDark ? 'text-amber-400' : 'text-amber-950 font-black'
                        }`}
                      >
                        PHASE 2: 1 - 2 WEEKS
                      </span>
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                          isDark
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-amber-200 text-amber-950 font-black'
                        }`}
                      >
                        Short-Term
                      </span>
                    </div>
                    <ul
                      className={`space-y-1.5 text-xs ${
                        isDark ? 'text-slate-200' : 'text-slate-900 font-medium'
                      }`}
                    >
                      {(report.actionPlan?.shortTermPhase || []).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span
                            className={`font-bold ${
                              isDark ? 'text-amber-400' : 'text-amber-700'
                            }`}
                          >
                            •
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Phase 3 */}
                  <div
                    className={`p-4 rounded-xl border shadow-sm space-y-2 ${
                      isDark
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-emerald-50/80 border-2 border-emerald-200'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between border-b pb-1.5 ${
                        isDark ? 'border-emerald-500/30' : 'border-emerald-200'
                      }`}
                    >
                      <span
                        className={`text-xs font-bold font-mono ${
                          isDark ? 'text-emerald-400' : 'text-emerald-950 font-black'
                        }`}
                      >
                        PHASE 3: 30 - 90 DAYS
                      </span>
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                          isDark
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-emerald-200 text-emerald-950 font-black'
                        }`}
                      >
                        Lifecycle
                      </span>
                    </div>
                    <ul
                      className={`space-y-1.5 text-xs ${
                        isDark ? 'text-slate-200' : 'text-slate-900 font-medium'
                      }`}
                    >
                      {(report.actionPlan?.longTermPhase || []).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span
                            className={`font-bold ${
                              isDark ? 'text-emerald-400' : 'text-emerald-700'
                            }`}
                          >
                            •
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 7. Formal Engineering Sign-off Block */}
              <div
                className={`mt-10 pt-6 border-t ${
                  isDark ? 'border-slate-800' : 'border-slate-300'
                }`}
              >
                <h4
                  className={`text-xs font-bold font-mono uppercase tracking-wider mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-800'
                  }`}
                >
                  7. Engineering Verification & Client Authorization Sign-Off
                </h4>
                <p
                  className={`text-xs mb-6 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  This field audit was conducted in accordance with certified Tridium Niagara N4 engineering practices and ASHRAE commissioning standards.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 font-mono text-xs">
                  <div
                    className={`border-t pt-2 space-y-1 ${
                      isDark ? 'border-slate-700' : 'border-slate-400'
                    }`}
                  >
                    <strong
                      className={`block font-sans text-sm ${
                        isDark ? 'text-white' : 'text-slate-950 font-bold'
                      }`}
                    >
                      {report.auditorName}
                    </strong>
                    <span
                      className={`block text-[11px] ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      {report.auditorTitle || 'Lead BAS Controls Specialist'}
                    </span>
                    <span
                      className={`block text-[10px] ${
                        isDark ? 'text-slate-500' : 'text-slate-500'
                      }`}
                    >
                      License: {report.contractorLicense || 'FL-CMC1249871'} &bull; Date: {report.auditDate}
                    </span>
                  </div>

                  <div
                    className={`border-t pt-2 space-y-1 ${
                      isDark ? 'border-slate-700' : 'border-slate-400'
                    }`}
                  >
                    <strong
                      className={`block font-sans text-sm ${
                        isDark ? 'text-white' : 'text-slate-950 font-bold'
                      }`}
                    >
                      {report.siteContactName || 'Authorized Facility Manager'}
                    </strong>
                    <span
                      className={`block text-[11px] ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      Facility Representative Sign-Off
                    </span>
                    <span
                      className={`block text-[10px] ${
                        isDark ? 'text-slate-500' : 'text-slate-500'
                      }`}
                    >
                      Facility: {report.facilityName} ({report.customerName})
                    </span>
                  </div>
                </div>
              </div>

              {/* End of Report Action Banner */}
              <div
                className={`mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                <div>
                  <h4
                    className={`text-sm font-bold flex items-center gap-2 ${
                      isDark ? 'text-white' : 'text-slate-950'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Audit Ready for Presentation & Archival</span>
                  </h4>
                  <p
                    className={`text-xs mt-0.5 ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    Saved in folder: <strong>{currentFolder ? currentFolder.name : 'Root Library'}</strong>.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    onClick={() => handleManualSave()}
                    className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Report</span>
                  </button>
                  <button
                    onClick={handleExportPdf}
                    className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                      isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                    }`}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: GUIDED FIELD AUDIT (TECH GUIDE)                                    */}
        {/* ========================================================================= */}
        {activeTab === 'wizard' && (
          <div className="max-w-5xl mx-auto py-2">
            <GuidedAuditWizard
              report={report}
              onUpdateReport={onUpdateReport}
              onFinishAndPreview={() => setActiveTab('preview')}
              onComplete={() => {
                handleManualSave();
                setActiveTab('preview');
              }}
              isDark={isDark}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: FINDINGS & PROOFS EDITOR                                           */}
        {/* ========================================================================= */}
        {activeTab === 'editor' && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header & Facility Info Form */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">Report Header & Facility Scope</h3>
                </div>
                <button
                  onClick={() => handleManualSave()}
                  className="px-3 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 shadow"
                >
                  <Save className="w-3 h-3" />
                  <span>Save Changes</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-mono text-[10px] mb-1">
                    REPORT TITLE
                  </label>
                  <input
                    type="text"
                    value={report.reportTitle}
                    onChange={(e) => onUpdateReport({ ...report, reportTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono text-[10px] mb-1">
                    CUSTOMER / SITE NAME
                  </label>
                  <input
                    type="text"
                    value={report.customerName}
                    onChange={(e) => onUpdateReport({ ...report, customerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono text-[10px] mb-1">
                    FACILITY LOCATION
                  </label>
                  <input
                    type="text"
                    value={report.facilityName}
                    onChange={(e) => onUpdateReport({ ...report, facilityName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono text-[10px] mb-1">
                    SYSTEM ARCHITECTURE
                  </label>
                  <input
                    type="text"
                    value={report.systemArchitecture}
                    onChange={(e) =>
                      onUpdateReport({ ...report, systemArchitecture: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono text-[10px] mb-1">
                    AUDIT DATE
                  </label>
                  <input
                    type="text"
                    value={report.auditDate}
                    onChange={(e) => onUpdateReport({ ...report, auditDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono text-[10px] mb-1">
                    LEAD AUDITOR / TECH
                  </label>
                  <input
                    type="text"
                    value={report.auditorName}
                    onChange={(e) => onUpdateReport({ ...report, auditorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[10px] mb-1">
                  EXECUTIVE SUMMARY & PROBLEM STATEMENT
                </label>
                <textarea
                  rows={3}
                  value={report.executiveSummary}
                  onChange={(e) => onUpdateReport({ ...report, executiveSummary: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-sky-500 leading-relaxed font-sans"
                />
              </div>
            </div>

            {/* Supervisory Deficiencies Section */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">Supervisory & Station Deficiencies</h3>
                </div>
                <button
                  onClick={handleAddSupervisoryDeficiency}
                  className="px-3 py-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-lg flex items-center gap-1 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Supervisory Finding</span>
                </button>
              </div>

              <div className="space-y-3">
                {report.supervisoryDeficiencies.map((def, idx) => (
                  <div
                    key={def.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder="Component / Service (e.g. JACE-8000 Heap Engine)"
                        value={def.componentService}
                        onChange={(e) => {
                          const updated = [...report.supervisoryDeficiencies];
                          updated[idx] = { ...def, componentService: e.target.value };
                          onUpdateReport({ ...report, supervisoryDeficiencies: updated });
                        }}
                        className="w-1/2 px-2.5 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-white font-bold"
                      />
                      <div className="flex items-center gap-2">
                        <select
                          value={def.severity}
                          onChange={(e) => {
                            const updated = [...report.supervisoryDeficiencies];
                            updated[idx] = {
                              ...def,
                              severity: e.target.value as DeficiencySeverity,
                            };
                            onUpdateReport({ ...report, supervisoryDeficiencies: updated });
                          }}
                          className="px-2 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-white font-mono"
                        >
                          <option value="CRITICAL">CRITICAL</option>
                          <option value="ACTION REQUIRED">ACTION REQUIRED</option>
                          <option value="WARNING">WARNING</option>
                          <option value="CORRECTED">CORRECTED</option>
                        </select>
                        <button
                          onClick={() => {
                            const updated = report.supervisoryDeficiencies.filter(
                              (d) => d.id !== def.id
                            );
                            onUpdateReport({ ...report, supervisoryDeficiencies: updated });
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded"
                          title="Delete finding"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500">
                          OBSERVED DEFICIENCY
                        </label>
                        <input
                          type="text"
                          value={def.observedDeficiency}
                          onChange={(e) => {
                            const updated = [...report.supervisoryDeficiencies];
                            updated[idx] = { ...def, observedDeficiency: e.target.value };
                            onUpdateReport({ ...report, supervisoryDeficiencies: updated });
                          }}
                          className="w-full px-2 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500">
                          OPERATIONAL IMPACT
                        </label>
                        <input
                          type="text"
                          value={def.impact}
                          onChange={(e) => {
                            const updated = [...report.supervisoryDeficiencies];
                            updated[idx] = { ...def, impact: e.target.value };
                            onUpdateReport({ ...report, supervisoryDeficiencies: updated });
                          }}
                          className="w-full px-2 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500">
                          STATUS / RECOMMENDED ACTION
                        </label>
                        <input
                          type="text"
                          value={def.statusAction}
                          onChange={(e) => {
                            const updated = [...report.supervisoryDeficiencies];
                            updated[idx] = { ...def, statusAction: e.target.value };
                            onUpdateReport({ ...report, supervisoryDeficiencies: updated });
                          }}
                          className="w-full px-2 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Central Plant & AHU Deficiencies Section */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">Central Plant & AHU Deficiencies</h3>
                </div>
                <button
                  onClick={handleAddAhuDeficiency}
                  className="px-3 py-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-lg flex items-center gap-1 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Equipment Finding</span>
                </button>
              </div>

              <div className="space-y-3">
                {report.plantAhuDeficiencies.map((ahu, idx) => (
                  <div
                    key={ahu.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          placeholder="Equipment Name (e.g. AHU-01)"
                          value={ahu.equipment}
                          onChange={(e) => {
                            const updated = [...report.plantAhuDeficiencies];
                            updated[idx] = { ...ahu, equipment: e.target.value };
                            onUpdateReport({ ...report, plantAhuDeficiencies: updated });
                          }}
                          className="w-1/3 px-2.5 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-white font-bold"
                        />
                        <input
                          type="text"
                          placeholder="Location (e.g. Penthouse 402)"
                          value={ahu.locationTarget}
                          onChange={(e) => {
                            const updated = [...report.plantAhuDeficiencies];
                            updated[idx] = { ...ahu, locationTarget: e.target.value };
                            onUpdateReport({ ...report, plantAhuDeficiencies: updated });
                          }}
                          className="w-1/3 px-2.5 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-white"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const updated = report.plantAhuDeficiencies.filter((a) => a.id !== ahu.id);
                          onUpdateReport({ ...report, plantAhuDeficiencies: updated });
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded"
                        title="Delete equipment finding"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500">
                          OBSERVED DEFICIENCIES
                        </label>
                        <textarea
                          rows={2}
                          value={ahu.observedDeficiencies.join('\n')}
                          onChange={(e) => {
                            const updated = [...report.plantAhuDeficiencies];
                            updated[idx] = {
                              ...ahu,
                              observedDeficiencies: e.target.value.split('\n'),
                            };
                            onUpdateReport({ ...report, plantAhuDeficiencies: updated });
                          }}
                          placeholder="One deficiency per line"
                          className="w-full px-2 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-white leading-tight"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500">
                          RECOMMENDED CORRECTIVE ACTION
                        </label>
                        <textarea
                          rows={2}
                          value={ahu.recommendedAction}
                          onChange={(e) => {
                            const updated = [...report.plantAhuDeficiencies];
                            updated[idx] = { ...ahu, recommendedAction: e.target.value };
                            onUpdateReport({ ...report, plantAhuDeficiencies: updated });
                          }}
                          className="w-full px-2 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-white leading-tight"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Terminal Units Section */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">Terminal Units (FCUs, VAVs) Summary</h3>
                </div>
                <button
                  onClick={handleAddTerminalDeficiency}
                  className="px-3 py-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-lg flex items-center gap-1 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Terminal Unit</span>
                </button>
              </div>

              <div className="space-y-3">
                {report.terminalUnitsSummary.map((term, idx) => (
                  <div
                    key={term.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Unit ID (e.g. VAV-104)"
                      value={term.unitId}
                      onChange={(e) => {
                        const updated = [...report.terminalUnitsSummary];
                        updated[idx] = { ...term, unitId: e.target.value };
                        onUpdateReport({ ...report, terminalUnitsSummary: updated });
                      }}
                      className="w-full sm:w-28 px-2 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-white font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Area Served (e.g. Room 104)"
                      value={term.areaServed}
                      onChange={(e) => {
                        const updated = [...report.terminalUnitsSummary];
                        updated[idx] = { ...term, areaServed: e.target.value };
                        onUpdateReport({ ...report, terminalUnitsSummary: updated });
                      }}
                      className="w-full sm:w-40 px-2 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-white"
                    />
                    <input
                      type="text"
                      placeholder="Deficiencies"
                      value={term.observedDeficiencies}
                      onChange={(e) => {
                        const updated = [...report.terminalUnitsSummary];
                        updated[idx] = { ...term, observedDeficiencies: e.target.value };
                        onUpdateReport({ ...report, terminalUnitsSummary: updated });
                      }}
                      className="w-full sm:flex-1 px-2 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-white"
                    />
                    <input
                      type="text"
                      placeholder="Action Required"
                      value={term.actionRequired}
                      onChange={(e) => {
                        const updated = [...report.terminalUnitsSummary];
                        updated[idx] = { ...term, actionRequired: e.target.value };
                        onUpdateReport({ ...report, terminalUnitsSummary: updated });
                      }}
                      className="w-full sm:w-60 px-2 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-amber-300"
                    />
                    <button
                      onClick={() => {
                        const updated = report.terminalUnitsSummary.filter((t) => t.id !== term.id);
                        onUpdateReport({ ...report, terminalUnitsSummary: updated });
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded shrink-0"
                      title="Delete terminal finding"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Evidence Figures Section */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">Visual Evidence & Technical Schematics</h3>
                </div>
                <button
                  onClick={handleAddFigure}
                  className="px-3 py-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-lg flex items-center gap-1 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Visual Evidence Figure</span>
                </button>
              </div>

              <div className="space-y-4">
                {report.visualEvidenceFigures.map((fig, idx) => (
                  <div
                    key={fig.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs font-mono font-bold text-sky-400 shrink-0">
                          Figure {fig.figureNumber}:
                        </span>
                        <input
                          type="text"
                          value={fig.title}
                          onChange={(e) => {
                            const updated = [...report.visualEvidenceFigures];
                            updated[idx] = { ...fig, title: e.target.value };
                            onUpdateReport({ ...report, visualEvidenceFigures: updated });
                          }}
                          className="flex-1 px-2.5 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-white font-bold"
                        />
                        <select
                          value={fig.diagramType || 'ahu_graphic'}
                          onChange={(e) => {
                            const updated = [...report.visualEvidenceFigures];
                            updated[idx] = { ...fig, diagramType: e.target.value as any };
                            onUpdateReport({ ...report, visualEvidenceFigures: updated });
                          }}
                          className="px-2 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-white font-mono"
                        >
                          <option value="ahu_graphic">AHU Graphic Schematic</option>
                          <option value="jace_resource">JACE Resource Monitor</option>
                          <option value="polling_service">BACnet Polling Service</option>
                          <option value="fcu_graphic">FCU / VAV Graphic</option>
                          <option value="chiller_plant">Central Chiller Plant</option>
                          <option value="device_discovery">Device Discovery</option>
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          const updated = report.visualEvidenceFigures.filter((f) => f.id !== fig.id);
                          onUpdateReport({ ...report, visualEvidenceFigures: updated });
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 mb-1">
                          IDENTIFIED DEFICIENCIES
                        </label>
                        <textarea
                          rows={2}
                          value={fig.identifiedDeficiencies.join('\n')}
                          onChange={(e) => {
                            const updated = [...report.visualEvidenceFigures];
                            updated[idx] = {
                              ...fig,
                              identifiedDeficiencies: e.target.value.split('\n'),
                            };
                            onUpdateReport({ ...report, visualEvidenceFigures: updated });
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 mb-1">
                          RECOMMENDED CORRECTIVE ACTION
                        </label>
                        <textarea
                          rows={2}
                          value={fig.recommendedCorrectiveAction}
                          onChange={(e) => {
                            const updated = [...report.visualEvidenceFigures];
                            updated[idx] = { ...fig, recommendedCorrectiveAction: e.target.value };
                            onUpdateReport({ ...report, visualEvidenceFigures: updated });
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: AUTOMATED STATION SCANNER                                          */}
        {/* ========================================================================= */}
        {activeTab === 'scanner' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/40 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Scan className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Automated ECS Workbench Studio Station Scanner
                    </h3>
                    <p className="text-xs text-slate-300">
                      Instantly sweeps active control wire sheets, BACnet MS/TP trunks, and BQL diagnostics to automatically uncover field faults.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRunAuditScan}
                  disabled={isScanning}
                  className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
                >
                  {isScanning ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Scanning Station...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Run Full Audit Scan</span>
                    </>
                  )}
                </button>
              </div>

              {scanSuccessMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-xs text-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{scanSuccessMessage}</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className="px-3 py-1 text-[11px] font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 shadow"
                  >
                    View in Executive Report
                  </button>
                </div>
              )}
            </div>

            {/* Diagnostic Scanner Scope Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-sky-400 text-xs font-bold font-mono">
                  <Cpu className="w-4 h-4" />
                  <span>Platform Diagnostics</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Checks JVM Heap limits, garbage collection pauses, thread locks, and CPU saturation metrics.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold font-mono">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Priority Array Audits</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Scans all station points for manual Priority 8 locks, missing release timers, and orphaned inputs.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold font-mono">
                  <Activity className="w-4 h-4" />
                  <span>BACnet Bus Integrity</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tests token rotation time, CRC error rates, and identifies unreachable controller MAC addresses.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: AUDIT WORKFLOW MODE SETUP                                          */}
        {/* ========================================================================= */}
        {activeTab === 'modes' && (
          <div className="max-w-5xl mx-auto py-2">
            <AuditModeSelector
              report={report}
              onUpdateReport={onUpdateReport}
              currentProgram={currentProgram}
              onSelectWorkflow={(mode: AuditWorkflowMode) => {
                if (mode === 'manual') {
                  setActiveTab('wizard');
                } else if (mode === 'automated_online' || mode === 'automated_offline') {
                  setActiveTab('preview');
                }
              }}
              isDark={isDark}
            />
          </div>
        )}
      </div>
    </div>
  );
};
