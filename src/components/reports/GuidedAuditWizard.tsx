import React, { useState } from 'react';
import {
  SiteAuditReport,
  AuditWizardStep,
  SupervisoryDeficiency,
  EquipmentDeficiency,
  TerminalUnitDeficiency,
  VisualEvidenceFigure,
} from '../../types/reports';
import { AUDIT_FIELD_GUIDELINES } from '../../data/defaultReports';
import {
  Building2,
  Cpu,
  Radio,
  Layers,
  Thermometer,
  FileCheck2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Compass,
  FileText,
  Scan,
  BookOpen,
} from 'lucide-react';

interface GuidedAuditWizardProps {
  report: SiteAuditReport;
  onUpdateReport: (updated: SiteAuditReport) => void;
  onCloseWizard?: () => void;
  onFinishAndPreview?: () => void;
  onComplete?: () => void;
  isDark?: boolean;
}

export const GuidedAuditWizard: React.FC<GuidedAuditWizardProps> = ({
  report,
  onUpdateReport,
  onCloseWizard,
  onFinishAndPreview,
  onComplete,
  isDark = true,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'guide' | 'form' | 'faults'>('guide');

  const handleFinish = () => {
    onUpdateReport({
      ...report,
      updatedAt: new Date().toISOString(),
    });
    if (onComplete) {
      onComplete();
    } else if (onFinishAndPreview) {
      onFinishAndPreview();
    }
  };

  const steps = AUDIT_FIELD_GUIDELINES;
  const currentStep = steps[activeStepIndex] || steps[0];

  // Helper to add deficiency from fault library
  const handleAddPredefinedFault = (fault: {
    title: string;
    description: string;
    severity: any;
    fix: string;
  }) => {
    if (currentStep.step === 'platform_jace') {
      const newSup: SupervisoryDeficiency = {
        id: `sup_${Date.now()}`,
        componentService: fault.title,
        observedDeficiency: fault.description,
        impact: 'Systemic degradation & platform instability',
        statusAction: fault.fix,
        severity: fault.severity,
      };
      onUpdateReport({
        ...report,
        supervisoryDeficiencies: [...(report.supervisoryDeficiencies || []), newSup],
      });
    } else if (currentStep.step === 'bacnet_network') {
      const newSup: SupervisoryDeficiency = {
        id: `net_${Date.now()}`,
        componentService: `BACnet MS/TP: ${fault.title}`,
        observedDeficiency: fault.description,
        impact: 'Field token latency and packet loss',
        statusAction: fault.fix,
        severity: fault.severity,
      };
      onUpdateReport({
        ...report,
        supervisoryDeficiencies: [...(report.supervisoryDeficiencies || []), newSup],
      });
    } else if (currentStep.step === 'central_plant') {
      const newAhu: EquipmentDeficiency = {
        id: `plant_${Date.now()}`,
        equipment: 'AHU_01 / Central Plant Loop',
        locationTarget: 'Main Mechanical Penthouse',
        observedDeficiencies: [fault.description],
        recommendedAction: fault.fix,
        severity: fault.severity,
      };
      onUpdateReport({
        ...report,
        plantAhuDeficiencies: [...(report.plantAhuDeficiencies || []), newAhu],
      });
    } else if (currentStep.step === 'terminal_units') {
      const newTerm: TerminalUnitDeficiency = {
        id: `term_${Date.now()}`,
        unitId: 'FCU_02 / VAV_104',
        areaServed: 'Office Zone / Lab 102',
        observedDeficiencies: fault.description,
        actionRequired: fault.fix,
        severity: fault.severity,
      };
      onUpdateReport({
        ...report,
        terminalUnitsSummary: [...(report.terminalUnitsSummary || []), newTerm],
      });
    } else if (currentStep.step === 'visual_evidence') {
      const newFig: VisualEvidenceFigure = {
        id: `fig_${Date.now()}`,
        figureNumber: (report.visualEvidenceFigures?.length || 0) + 1,
        title: `${fault.title} - Wire Sheet & Graphic Capture`,
        categoryBadge: 'FIELD AUDIT EVIDENCE',
        diagramType: 'fcu_graphic',
        slotOrdPath: 'station:|slot:/Drivers/BacnetNetwork/FCU02/Points/ActiveMode',
        identifiedDeficiencies: [fault.description],
        recommendedCorrectiveAction: fault.fix,
        annotations: [
          { id: 'ann_1', x: 40, y: 40, type: 'badge', label: fault.title.toUpperCase() },
        ],
      };
      onUpdateReport({
        ...report,
        visualEvidenceFigures: [...(report.visualEvidenceFigures || []), newFig],
      });
    }
  };

  // 1-Click Executive Findings Auto-Synthesizer
  const handleAutoSynthesizeExecutiveReport = () => {
    const supCount = report.supervisoryDeficiencies.length;
    const plantCount = report.plantAhuDeficiencies.length;
    const termCount = report.terminalUnitsSummary.length;
    const totalDeficiencies = supCount + plantCount + termCount;

    const criticalItems = [
      ...report.supervisoryDeficiencies.filter((d) => d.severity === 'CRITICAL'),
      ...report.plantAhuDeficiencies.filter((d) => d.severity === 'CRITICAL'),
      ...report.terminalUnitsSummary.filter((d) => d.severity === 'CRITICAL'),
    ];

    const generatedSummary =
      totalDeficiencies === 0
        ? `During this scheduled preventive maintenance inspection at ${report.facilityName}, all evaluated systems (supervisory platform, BACnet field communication trunks, central plant AHUs, and sampled terminal zones) were verified operating within normal design parameters. No critical faults or active manual overrides were detected.`
        : `During this scheduled PM inspection at ${report.facilityName}, field auditors identified ${totalDeficiencies} actionable deficiencies across supervisory platform configurations, field communication networks, and terminal HVAC equipment. Notably, ${criticalItems.length} critical items require immediate remediation to prevent energy waste, premature actuator degradation, and occupant thermal discomfort. This report delivers an engineering breakdown and visual evidence package.`;

    const generatedPatterns: string[] = [];
    if (report.supervisoryDeficiencies.some((d) => d.observedDeficiency.toLowerCase().includes('override') || d.observedDeficiency.toLowerCase().includes('priority 8') || d.observedDeficiency.toLowerCase().includes('priority 16'))) {
      generatedPatterns.push('Manual Priority Overrides & Ghost Writes: Multiple points locked in emergency manual positions, bypassing automated setback schedules.');
    }
    if (report.supervisoryDeficiencies.some((d) => d.observedDeficiency.toLowerCase().includes('heap') || d.observedDeficiency.toLowerCase().includes('poll'))) {
      generatedPatterns.push('Supervisory Polling Saturation: Polling rates concentrated on short 5-second intervals, straining JACE heap memory and worker queues.');
    }
    if (report.plantAhuDeficiencies.some((d) => d.observedDeficiencies.some((o) => o.toLowerCase().includes('hunt') || o.toLowerCase().includes('pid')))) {
      generatedPatterns.push('Unstable Control Loops (PID Hunting): Central air handler modulating valves oscillating rapidly around setpoints, inducing mechanical strain.');
    }
    if (report.terminalUnitsSummary.some((d) => d.observedDeficiencies.toLowerCase().includes('simultaneous') || d.observedDeficiencies.toLowerCase().includes('heat'))) {
      generatedPatterns.push('Simultaneous Heating & Cooling: Terminal zones energizing reheat stages concurrently with open chilled water valves.');
    }
    if (generatedPatterns.length === 0) {
      generatedPatterns.push('Station Firmware & Licensing: Baseline configuration verified against Niagara N4 best practices.');
    }

    // Action plan generator
    const immediate = [
      'Release all stale Priority 8 manual operator overrides to restore automated schedule control.',
      'Clear rogue Priority 16 writes on terminal fan coils and reheat controllers.',
      'Recalibrate drifting temperature and airflow sensors identified with >3°F offset.',
    ];
    const shortTerm = [
      'Implement tiered BACnet polling policies (Fast: 2s, Normal: 15s, Slow: 60s) to relieve JACE memory load.',
      'Retune PID loop gains (increase Integral time) on oscillating AHU cooling and heating valves.',
      'Repair or replace binding damper linkages and check End-of-Line termination resistors.',
    ];
    const longTerm = [
      'Schedule Niagara N4 LTS firmware update to ensure security and station stability.',
      'Standardize Px graphics across all terminal zone controllers.',
    ];

    // Compute Health metrics
    const penalty = criticalItems.length * 8 + (totalDeficiencies - criticalItems.length) * 4;
    const computedOverall = Math.max(25, Math.min(100, 100 - penalty));

    onUpdateReport({
      ...report,
      executiveSummary: generatedSummary,
      keySystemicPatterns: generatedPatterns,
      actionPlan: {
        immediatePhase: immediate,
        shortTermPhase: shortTerm,
        longTermPhase: longTerm,
      },
      healthMetrics: {
        overallHealth: computedOverall,
        supervisoryJace: Math.max(30, 100 - report.supervisoryDeficiencies.length * 12),
        bacnetNetwork: Math.max(35, 100 - (criticalItems.length > 0 ? 25 : 5)),
        controlLoops: Math.max(40, 100 - report.plantAhuDeficiencies.length * 15),
        sensorIntegrity: Math.max(35, 100 - report.terminalUnitsSummary.length * 10),
        graphicsUi: Math.max(50, 100 - report.visualEvidenceFigures.length * 8),
      },
      status: 'completed',
    });
  };

  const getStepIcon = (step: AuditWizardStep) => {
    switch (step) {
      case 'facility_scope':
        return Building2;
      case 'platform_jace':
        return Cpu;
      case 'bacnet_network':
        return Radio;
      case 'central_plant':
        return Layers;
      case 'terminal_units':
        return Thermometer;
      case 'visual_evidence':
        return Scan;
      case 'executive_summary':
        return ShieldCheck;
      default:
        return FileText;
    }
  };

  return (
    <div
      id="guided-audit-wizard-root"
      className={`flex-1 flex flex-col h-full overflow-hidden ${
        isDark ? 'bg-[#080d1a] text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Wizard Header with Progress */}
      <div
        className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-[#060b16] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 font-mono font-bold text-sm">
            {activeStepIndex + 1}/7
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                <span>Field Audit Technician Guide</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono">
                  Step-by-Step
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400">{currentStep.title}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {onFinishAndPreview && (
            <button
              onClick={onFinishAndPreview}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-all"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Preview Executive Report</span>
            </button>
          )}
          {onCloseWizard && (
            <button
              onClick={onCloseWizard}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Close Guide
            </button>
          )}
        </div>
      </div>

      {/* Step Navigation Pill Bar */}
      <div
        className={`px-4 py-2 border-b overflow-x-auto flex items-center gap-2 shrink-0 ${
          isDark ? 'bg-[#0a1122] border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}
      >
        {steps.map((step, idx) => {
          const StepIcon = getStepIcon(step.step);
          const isActive = idx === activeStepIndex;
          const isCompleted = idx < activeStepIndex;

          return (
            <button
              key={step.step}
              onClick={() => setActiveStepIndex(idx)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-sm font-semibold'
                  : isCompleted
                  ? isDark
                    ? 'bg-slate-850 text-emerald-400 hover:bg-slate-800 border border-emerald-900/40'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  : isDark
                  ? 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 border border-slate-800'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <StepIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : isCompleted ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{idx + 1}. {step.title.split('. ')[1] || step.title}</span>
              {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Main Step Workspace Content (Two-column layout on wide screens) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Comprehensive Technician Field Handbook & Guidance (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Step Banner Card */}
          <div
            className={`p-4 rounded-xl border ${
              isDark
                ? 'bg-gradient-to-r from-sky-950/40 via-slate-900 to-slate-900 border-sky-900/50'
                : 'bg-gradient-to-r from-sky-50 to-white border-sky-200'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400">
                  Field Guide Checklist
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-0.5">{currentStep.title}</h3>
                <p className="text-xs text-slate-300 mt-1">{currentStep.subtitle}</p>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-sky-950/80 border border-sky-800 text-sky-300 text-xs font-mono font-semibold shrink-0">
                Step {activeStepIndex + 1} of 7
              </div>
            </div>

            {/* Where & When to Capture Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800">
              <div className="flex items-start gap-2 text-xs">
                <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-300 block font-mono text-[10px] uppercase text-amber-400">
                    Where to Capture:
                  </span>
                  <span className="text-slate-300 text-xs">{currentStep.whereToCapture}</span>
                </div>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-300 block font-mono text-[10px] uppercase text-sky-400">
                    When to Capture:
                  </span>
                  <span className="text-slate-300 text-xs">{currentStep.whenToCapture}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: WHAT to Capture */}
          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#0b1220] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                What to Capture & Inspect
              </h4>
            </div>
            <ul className="space-y-2">
              {currentStep.whatToCapture.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-2 rounded-lg border border-slate-800/60"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0 mt-1.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section: HOW to Capture */}
          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#0b1220] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs font-mono">
                ⚙
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                How to Capture (Workbench & Station Steps)
              </h4>
            </div>
            <ol className="space-y-2">
              {currentStep.howToCapture.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/60"
                >
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-sans leading-relaxed">{item}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Section: Common Field Faults & 1-Click Injection */}
          {currentStep.commonFaults && currentStep.commonFaults.length > 0 && (
            <div
              className={`p-4 rounded-xl border ${
                isDark ? 'bg-[#0b1220] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Common Field Faults (1-Click Quick Add to Report)
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Click + Add to Log Finding</span>
              </div>

              <div className="space-y-2.5">
                {currentStep.commonFaults.map((fault, fIdx) => (
                  <div
                    key={fIdx}
                    className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-sky-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                            fault.severity === 'CRITICAL'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : fault.severity === 'ACTION REQUIRED'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-yellow-950 text-yellow-300 border border-yellow-800'
                          }`}
                        >
                          {fault.severity}
                        </span>
                        <h5 className="font-semibold text-xs text-slate-200 truncate">
                          {fault.title}
                        </h5>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                        {fault.description}
                      </p>
                      <div className="text-[10px] text-sky-400 font-mono mt-1">
                        Recommended Action: {fault.fix}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddPredefinedFault(fault)}
                      className="px-2.5 py-1.5 rounded-md bg-sky-600/30 hover:bg-sky-600 text-sky-200 hover:text-white border border-sky-500/40 text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Report</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Step Data Input Form & Live Findings Review (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Step Interactive Editor Form */}
          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#0b1220] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span>Captured Data for Step {activeStepIndex + 1}</span>
              </h4>
            </div>

            {/* Form content customized per step */}
            {activeStepIndex === 0 && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    Customer Organization
                  </label>
                  <input
                    type="text"
                    value={report.customerName}
                    onChange={(e) => onUpdateReport({ ...report, customerName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    placeholder="e.g. Baptist Health / Apex Logistics"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    Facility / Building Location
                  </label>
                  <input
                    type="text"
                    value={report.facilityName}
                    onChange={(e) => onUpdateReport({ ...report, facilityName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    placeholder="e.g. Medical Plaza Tower 1 / Distribution Center"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                      System Architecture
                    </label>
                    <input
                      type="text"
                      value={report.systemArchitecture}
                      onChange={(e) => onUpdateReport({ ...report, systemArchitecture: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                      placeholder="e.g. Niagara N4 / JACE-8000"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                      Audit Date
                    </label>
                    <input
                      type="text"
                      value={report.auditDate}
                      onChange={(e) => onUpdateReport({ ...report, auditDate: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                      placeholder="e.g. August 26, 2026"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                      Lead Auditor Name
                    </label>
                    <input
                      type="text"
                      value={report.auditorName}
                      onChange={(e) => onUpdateReport({ ...report, auditorName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                      Auditor Title / Role
                    </label>
                    <input
                      type="text"
                      value={report.auditorTitle}
                      onChange={(e) => onUpdateReport({ ...report, auditorTitle: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Steps 1 & 2: Supervisory & BACnet Deficiencies */}
            {(activeStepIndex === 1 || activeStepIndex === 2) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">
                    Logged Findings ({report.supervisoryDeficiencies.length})
                  </span>
                  <button
                    onClick={() => {
                      const newSup: SupervisoryDeficiency = {
                        id: `sup_${Date.now()}`,
                        componentService: activeStepIndex === 1 ? 'Station Resource' : 'BACnet Network',
                        observedDeficiency: 'Observed non-standard field configuration.',
                        impact: 'Operational degradation',
                        statusAction: 'ACTION REQUIRED',
                        severity: 'ACTION REQUIRED',
                      };
                      onUpdateReport({
                        ...report,
                        supervisoryDeficiencies: [...report.supervisoryDeficiencies, newSup],
                      });
                    }}
                    className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Custom</span>
                  </button>
                </div>

                {report.supervisoryDeficiencies.length === 0 ? (
                  <div className="p-4 text-center border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
                    No findings recorded yet. Use the Common Faults on the left or click Add Custom.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {report.supervisoryDeficiencies.map((d, dIdx) => (
                      <div
                        key={d.id || dIdx}
                        className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={d.componentService}
                            onChange={(e) => {
                              const next = [...report.supervisoryDeficiencies];
                              next[dIdx] = { ...next[dIdx], componentService: e.target.value };
                              onUpdateReport({ ...report, supervisoryDeficiencies: next });
                            }}
                            className="bg-transparent font-semibold text-xs text-sky-300 focus:outline-none flex-1"
                            placeholder="Component / Service Name"
                          />
                          <button
                            onClick={() => {
                              const next = report.supervisoryDeficiencies.filter((_, i) => i !== dIdx);
                              onUpdateReport({ ...report, supervisoryDeficiencies: next });
                            }}
                            className="text-slate-500 hover:text-rose-400 text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={d.observedDeficiency}
                          onChange={(e) => {
                            const next = [...report.supervisoryDeficiencies];
                            next[dIdx] = { ...next[dIdx], observedDeficiency: e.target.value };
                            onUpdateReport({ ...report, supervisoryDeficiencies: next });
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-sky-500 resize-none"
                          placeholder="Observed deficiency description..."
                        />
                        <input
                          type="text"
                          value={d.statusAction}
                          onChange={(e) => {
                            const next = [...report.supervisoryDeficiencies];
                            next[dIdx] = { ...next[dIdx], statusAction: e.target.value };
                            onUpdateReport({ ...report, supervisoryDeficiencies: next });
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] font-mono text-emerald-300 focus:outline-none"
                          placeholder="Recommended action..."
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Central Plant / AHUs */}
            {activeStepIndex === 3 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">
                    Plant & AHU Findings ({report.plantAhuDeficiencies.length})
                  </span>
                  <button
                    onClick={() => {
                      const newAhu: EquipmentDeficiency = {
                        id: `ahu_${Date.now()}`,
                        equipment: 'AHU_01',
                        locationTarget: 'Mechanical Room',
                        observedDeficiencies: ['Supply temperature loop hunting.'],
                        recommendedAction: 'Retune PID loop gains.',
                        severity: 'ACTION REQUIRED',
                      };
                      onUpdateReport({
                        ...report,
                        plantAhuDeficiencies: [...report.plantAhuDeficiencies, newAhu],
                      });
                    }}
                    className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Equipment</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {report.plantAhuDeficiencies.map((item, aIdx) => (
                    <div
                      key={item.id || aIdx}
                      className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={item.equipment}
                          onChange={(e) => {
                            const next = [...report.plantAhuDeficiencies];
                            next[aIdx] = { ...next[aIdx], equipment: e.target.value };
                            onUpdateReport({ ...report, plantAhuDeficiencies: next });
                          }}
                          className="bg-transparent font-semibold text-xs text-sky-300 focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            const next = report.plantAhuDeficiencies.filter((_, i) => i !== aIdx);
                            onUpdateReport({ ...report, plantAhuDeficiencies: next });
                          }}
                          className="text-slate-500 hover:text-rose-400 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={item.locationTarget}
                        onChange={(e) => {
                          const next = [...report.plantAhuDeficiencies];
                          next[aIdx] = { ...next[aIdx], locationTarget: e.target.value };
                          onUpdateReport({ ...report, plantAhuDeficiencies: next });
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-400 focus:outline-none"
                        placeholder="Location (e.g. Penthouse Fan Room)"
                      />
                      <textarea
                        rows={2}
                        value={item.observedDeficiencies.join('\n')}
                        onChange={(e) => {
                          const next = [...report.plantAhuDeficiencies];
                          next[aIdx] = {
                            ...next[aIdx],
                            observedDeficiencies: e.target.value.split('\n').filter((x) => x.trim()),
                          };
                          onUpdateReport({ ...report, plantAhuDeficiencies: next });
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-[11px] text-slate-300 resize-none focus:outline-none"
                        placeholder="Observed equipment defects (one per line)..."
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Terminal Units */}
            {activeStepIndex === 4 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">
                    Sampled Terminal Units ({report.terminalUnitsSummary.length})
                  </span>
                  <button
                    onClick={() => {
                      const newTerm: TerminalUnitDeficiency = {
                        id: `term_${Date.now()}`,
                        unitId: 'FCU_01',
                        areaServed: 'Office Zone',
                        observedDeficiencies: 'Cooling valve stuck at 100% position.',
                        actionRequired: 'Inspect actuator linkage.',
                        severity: 'ACTION REQUIRED',
                      };
                      onUpdateReport({
                        ...report,
                        terminalUnitsSummary: [...report.terminalUnitsSummary, newTerm],
                      });
                    }}
                    className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Terminal Box</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {report.terminalUnitsSummary.map((t, tIdx) => (
                    <div
                      key={t.id || tIdx}
                      className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={t.unitId}
                            onChange={(e) => {
                              const next = [...report.terminalUnitsSummary];
                              next[tIdx] = { ...next[tIdx], unitId: e.target.value };
                              onUpdateReport({ ...report, terminalUnitsSummary: next });
                            }}
                            className="bg-transparent font-semibold text-xs text-sky-300 focus:outline-none w-24"
                            placeholder="Unit ID"
                          />
                          <input
                            type="text"
                            value={t.areaServed}
                            onChange={(e) => {
                              const next = [...report.terminalUnitsSummary];
                              next[tIdx] = { ...next[tIdx], areaServed: e.target.value };
                              onUpdateReport({ ...report, terminalUnitsSummary: next });
                            }}
                            className="bg-transparent text-xs text-slate-400 focus:outline-none flex-1"
                            placeholder="Area Served"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const next = report.terminalUnitsSummary.filter((_, i) => i !== tIdx);
                            onUpdateReport({ ...report, terminalUnitsSummary: next });
                          }}
                          className="text-slate-500 hover:text-rose-400 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={t.observedDeficiencies}
                        onChange={(e) => {
                          const next = [...report.terminalUnitsSummary];
                          next[tIdx] = { ...next[tIdx], observedDeficiencies: e.target.value };
                          onUpdateReport({ ...report, terminalUnitsSummary: next });
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-[11px] text-slate-300 resize-none focus:outline-none"
                        placeholder="Observed deficiency..."
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Visual Evidence */}
            {activeStepIndex === 5 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">
                    Evidence Diagrams ({report.visualEvidenceFigures.length})
                  </span>
                  <button
                    onClick={() => {
                      const newFig: VisualEvidenceFigure = {
                        id: `fig_${Date.now()}`,
                        figureNumber: report.visualEvidenceFigures.length + 1,
                        title: 'FCU Wire Sheet & Point Priority Array Conflict',
                        categoryBadge: 'FCU02 (AVIONICS LAB 102)',
                        diagramType: 'fcu_graphic',
                        slotOrdPath: 'station:|slot:/Drivers/BacnetNetwork/FCU02/Points/OccupancyMode',
                        identifiedDeficiencies: [
                          'Ghost write at Priority 16 forcing unit into Unoccupied Heat mode.',
                        ],
                        recommendedCorrectiveAction:
                          'Clear Priority 16 write in Niagara Wire Sheet.',
                        annotations: [
                          { id: 'ann_1', x: 30, y: 35, type: 'badge', label: 'PRIORITY 16 GHOST WRITE' },
                        ],
                      };
                      onUpdateReport({
                        ...report,
                        visualEvidenceFigures: [...report.visualEvidenceFigures, newFig],
                      });
                    }}
                    className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Figure</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {report.visualEvidenceFigures.map((fig, fIdx) => (
                    <div
                      key={fig.id || fIdx}
                      className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={fig.title}
                          onChange={(e) => {
                            const next = [...report.visualEvidenceFigures];
                            next[fIdx] = { ...next[fIdx], title: e.target.value };
                            onUpdateReport({ ...report, visualEvidenceFigures: next });
                          }}
                          className="bg-transparent font-semibold text-xs text-sky-300 focus:outline-none flex-1"
                        />
                        <button
                          onClick={() => {
                            const next = report.visualEvidenceFigures.filter((_, i) => i !== fIdx);
                            onUpdateReport({ ...report, visualEvidenceFigures: next });
                          }}
                          className="text-slate-500 hover:text-rose-400 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={fig.slotOrdPath}
                        onChange={(e) => {
                          const next = [...report.visualEvidenceFigures];
                          next[fIdx] = { ...next[fIdx], slotOrdPath: e.target.value };
                          onUpdateReport({ ...report, visualEvidenceFigures: next });
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] font-mono text-slate-400 focus:outline-none"
                        placeholder="station:|slot:/Drivers/..."
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 6: Executive Summary & 1-Click Synthesis */}
            {activeStepIndex === 6 && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-sky-950/40 border border-sky-800/80">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                      <span>1-Click Findings Synthesizer</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                    Automatically computes the Building Automation Health Index (BAHI), compiles key systemic patterns, and structures a 3-phase action plan.
                  </p>
                  <button
                    onClick={handleAutoSynthesizeExecutiveReport}
                    className="w-full py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Synthesize Executive Findings</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    Overall Health Score Index (0-100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={report.healthMetrics.overallHealth}
                    onChange={(e) =>
                      onUpdateReport({
                        ...report,
                        healthMetrics: {
                          ...report.healthMetrics,
                          overallHealth: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Step Navigation Next / Back Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              disabled={activeStepIndex === 0}
              onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
              className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                activeStepIndex === 0
                  ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous Step</span>
            </button>

            {activeStepIndex < steps.length - 1 ? (
              <button
                onClick={() => setActiveStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span>Continue to Step {activeStepIndex + 2}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all uppercase tracking-wider"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Audit & Review Report</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
