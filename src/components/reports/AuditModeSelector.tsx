import React, { useState } from 'react';
import {
  Wrench,
  Globe,
  HardDrive,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileCode2,
  UploadCloud,
  Network,
  Cpu,
  RefreshCw,
  Zap,
  Terminal,
  Activity,
  Layers,
  FileText,
  Clock,
  Info,
  ExternalLink,
} from 'lucide-react';
import {
  SiteAuditReport,
  SupervisoryDeficiency,
  EquipmentDeficiency,
  TerminalUnitDeficiency,
  VisualEvidenceFigure,
} from '../../types/reports';
import { NiagaraProgram } from '../../types/niagara';
import { parseStationBogFile, parseLiveStationTelemetry, StationParseResult } from '../../utils/bogParser';

export type AuditWorkflowMode = 'manual' | 'automated_online' | 'automated_offline';

interface AuditModeSelectorProps {
  report: SiteAuditReport;
  onUpdateReport: (updated: SiteAuditReport) => void;
  currentProgram?: NiagaraProgram;
  onSelectWorkflow: (mode: AuditWorkflowMode) => void;
  isDark?: boolean;
}

export const AuditModeSelector: React.FC<AuditModeSelectorProps> = ({
  report,
  onUpdateReport,
  currentProgram,
  onSelectWorkflow,
  isDark = true,
}) => {
  const [selectedMode, setSelectedMode] = useState<AuditWorkflowMode>('automated_online');

  // Online Scan Form State
  const [stationIp, setStationIp] = useState('192.168.1.140');
  const [stationPort, setStationPort] = useState('443');
  const [protocol, setProtocol] = useState<'https_obix' | 'http_obix' | 'fox_probe' | 'rest_json'>('https_obix');
  const [stationUsername, setStationUsername] = useState('admin');
  const [stationPassword, setStationPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [scanProgress, setScanProgress] = useState<{
    step: number;
    title: string;
    detail: string;
    percent: number;
  } | null>(null);

  // Diagnostic / Real Connection Result State
  const [connectionDiagnostic, setConnectionDiagnostic] = useState<{
    status: 'success' | 'auth_error' | 'private_subnet' | 'network_error';
    message: string;
    details?: string;
    stationHost: string;
    stationPort: string;
    isPrivateSubnet?: boolean;
    rawSnippet?: string;
  } | null>(null);

  // Direct Telemetry Paste State
  const [pastedTelemetry, setPastedTelemetry] = useState('');
  const [isParsingPasted, setIsParsingPasted] = useState(false);
  const [pastedError, setPastedError] = useState<string | null>(null);

  // Offline Ingestion State
  const [dragOver, setDragOver] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // =========================================================================
  // EXECUTE REAL AUTOMATED ONLINE SCAN
  // =========================================================================
  const handleExecuteOnlineScan = async () => {
    setIsConnecting(true);
    setConnectionDiagnostic(null);
    setPastedError(null);

    setScanProgress({
      step: 1,
      title: 'Connecting to Niagara Station Endpoint',
      detail: `Initiating connection probe to ${stationIp}:${stationPort} (Protocol: ${protocol})...`,
      percent: 20,
    });

    try {
      // Step 1: Send request to backend real scanner endpoint
      const response = await fetch('/api/audit/online-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationIp,
          stationPort,
          protocol,
          username: stationUsername,
          password: stationPassword,
        }),
      });

      setScanProgress({
        step: 2,
        title: 'Parsing Response & Validating Security Handshake',
        detail: `Inspecting HTTP/HTTPS response from ${stationIp}:${stationPort}...`,
        percent: 60,
      });

      const data = await response.json();

      if (data.success && data.rawResponse) {
        setScanProgress({
          step: 3,
          title: 'Extracting Real Station Objects & Overrides',
          detail: 'Parsing oBIX / XML object graph, JVM heap stats, active priority overrides, and field equipment...',
          percent: 90,
        });

        // Parse genuine station data returned from the real station!
        const parsedResult: StationParseResult = parseLiveStationTelemetry(data.rawResponse, {
          stationIp,
          stationPort,
          stationName: data.stationName,
        });

        const updatedReport: SiteAuditReport = {
          ...report,
          siteName: parsedResult.stationName || report.siteName,
          supervisoryDeficiencies: parsedResult.supervisoryDeficiencies,
          plantAhuDeficiencies: parsedResult.plantDeficiencies,
          terminalUnitsSummary: parsedResult.terminalDeficiencies,
          visualEvidenceFigures: parsedResult.visualFigures,
          healthMetrics: parsedResult.healthMetrics,
          executiveSummary: parsedResult.executiveSummary,
          updatedAt: new Date().toISOString(),
        };

        onUpdateReport(updatedReport);
        setIsConnecting(false);
        setScanProgress(null);
        setConnectionDiagnostic({
          status: 'success',
          message: `Successfully connected to live Niagara Station at ${stationIp}:${stationPort}! Scanned ${parsedResult.devices.length} real devices and ${parsedResult.totalPoints} points.`,
          stationHost: stationIp,
          stationPort: stationPort,
          rawSnippet: data.rawResponse.slice(0, 300),
        });
        onSelectWorkflow('automated_online');
        return;
      }

      // Connection did not succeed - display actual real diagnostic
      setIsConnecting(false);
      setScanProgress(null);

      if (data.errorType === 'AUTHENTICATION_FAILED') {
        setConnectionDiagnostic({
          status: 'auth_error',
          message: `Authentication Failed: Niagara Station at ${stationIp}:${stationPort} rejected credentials for user "${stationUsername}". (HTTP 401 Unauthorized)`,
          details: 'Please verify the station username and password.',
          stationHost: stationIp,
          stationPort: stationPort,
          isPrivateSubnet: data.isPrivateSubnet,
        });
      } else if (data.isPrivateSubnet || data.errorType === 'PRIVATE_SUBNET_ISOLATED') {
        setConnectionDiagnostic({
          status: 'private_subnet',
          message: `Target IP ${stationIp} is on a private local network subnet (RFC1918).`,
          details: `Cloud application servers cannot route across your site's local router/firewall into ${stationIp}. However, because your technician browser is on the same local site network, you can use the direct Browser Local Connect or paste your live oBIX/BQL export below to audit the actual site.`,
          stationHost: stationIp,
          stationPort: stationPort,
          isPrivateSubnet: true,
        });
      } else {
        setConnectionDiagnostic({
          status: 'network_error',
          message: data.message || `Could not establish a connection to Niagara Station at ${stationIp}:${stationPort}.`,
          details: 'Verify that the station is online, the port is open, and firewall rules allow incoming traffic.',
          stationHost: stationIp,
          stationPort: stationPort,
          isPrivateSubnet: data.isPrivateSubnet,
        });
      }
    } catch (err: any) {
      console.warn('Scan request error:', err);
      setIsConnecting(false);
      setScanProgress(null);
      setConnectionDiagnostic({
        status: 'network_error',
        message: `Network communication error while attempting to scan ${stationIp}:${stationPort}.`,
        details: err?.message || 'Check network connection.',
        stationHost: stationIp,
        stationPort: stationPort,
      });
    }
  };

  // =========================================================================
  // EXECUTE DIRECT BROWSER LOCAL CONNECT
  // =========================================================================
  const handleBrowserDirectConnect = async () => {
    setIsConnecting(true);
    setScanProgress({
      step: 1,
      title: 'Connecting Directly from Browser on Local Subnet',
      detail: `Attempting direct browser fetch to https://${stationIp}:${stationPort}/obix/about...`,
      percent: 30,
    });

    const targetUrl = `https://${stationIp}:${stationPort}/obix/about`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(targetUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          Accept: 'application/xml, text/xml, application/json',
          ...(stationUsername || stationPassword
            ? { Authorization: `Basic ${btoa(`${stationUsername}:${stationPassword}`)}` }
            : {}),
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const text = await res.text();

      if (text && text.length > 0) {
        const parsedResult = parseLiveStationTelemetry(text, { stationIp, stationPort });
        const updatedReport: SiteAuditReport = {
          ...report,
          siteName: parsedResult.stationName || report.siteName,
          supervisoryDeficiencies: parsedResult.supervisoryDeficiencies,
          plantAhuDeficiencies: parsedResult.plantDeficiencies,
          terminalUnitsSummary: parsedResult.terminalDeficiencies,
          visualEvidenceFigures: parsedResult.visualFigures,
          healthMetrics: parsedResult.healthMetrics,
          executiveSummary: parsedResult.executiveSummary,
          updatedAt: new Date().toISOString(),
        };

        onUpdateReport(updatedReport);
        setIsConnecting(false);
        setScanProgress(null);
        setConnectionDiagnostic({
          status: 'success',
          message: `Browser Direct Connect Succeeded! Discovered real station "${parsedResult.stationName}" on ${stationIp}.`,
          stationHost: stationIp,
          stationPort: stationPort,
        });
        onSelectWorkflow('automated_online');
        return;
      }
    } catch (e: any) {
      console.warn('Browser direct fetch encountered CORS or network error:', e);
      setIsConnecting(false);
      setScanProgress(null);
      setConnectionDiagnostic({
        status: 'private_subnet',
        message: `Browser connection to ${targetUrl} was blocked by browser CORS policy or self-signed certificate.`,
        details: `To resolve: Open ${targetUrl} in a new browser tab to accept the Niagara SSL certificate, or copy the XML/JSON response directly into the Live Telemetry Ingest Box below.`,
        stationHost: stationIp,
        stationPort: stationPort,
        isPrivateSubnet: true,
      });
    }
  };

  // =========================================================================
  // EXECUTE LIVE TELEMETRY / BQL / OBIX PASTE INGESTION
  // =========================================================================
  const handleIngestPastedTelemetry = () => {
    if (!pastedTelemetry.trim()) {
      setPastedError('Please paste your Niagara oBIX XML, JSON, or BQL output first.');
      return;
    }

    setIsParsingPasted(true);
    setPastedError(null);

    try {
      const parsedResult = parseLiveStationTelemetry(pastedTelemetry, {
        stationIp,
        stationPort,
      });

      const updatedReport: SiteAuditReport = {
        ...report,
        siteName: parsedResult.stationName !== 'Station_JACE_Live' ? parsedResult.stationName : report.siteName,
        supervisoryDeficiencies: [
          ...(report.supervisoryDeficiencies || []).filter((d) => !d.id.startsWith('sup_') && !d.id.startsWith('off_')),
          ...parsedResult.supervisoryDeficiencies,
        ],
        plantAhuDeficiencies: [
          ...(report.plantAhuDeficiencies || []).filter((d) => !d.id.startsWith('eq_') && !d.id.startsWith('off_')),
          ...parsedResult.plantDeficiencies,
        ],
        terminalUnitsSummary: [
          ...(report.terminalUnitsSummary || []).filter((d) => !d.id.startsWith('term_') && !d.id.startsWith('vav_')),
          ...parsedResult.terminalDeficiencies,
        ],
        visualEvidenceFigures: parsedResult.visualFigures,
        healthMetrics: parsedResult.healthMetrics,
        executiveSummary: parsedResult.executiveSummary,
        updatedAt: new Date().toISOString(),
      };

      onUpdateReport(updatedReport);
      setIsParsingPasted(false);
      setConnectionDiagnostic({
        status: 'success',
        message: `Successfully ingested real site data! Parsed ${parsedResult.devices.length} devices, ${parsedResult.totalPoints} points, and ${parsedResult.totalOverrides} overrides from your actual station telemetry.`,
        stationHost: stationIp,
        stationPort: stationPort,
      });
      onSelectWorkflow('automated_online');
    } catch (err: any) {
      console.error('Failed to parse pasted telemetry:', err);
      setIsParsingPasted(false);
      setPastedError(`Parsing error: ${err?.message || 'Invalid format'}. Please ensure valid XML, JSON, or BQL output.`);
    }
  };

  // =========================================================================
  // EXECUTE AUTOMATED OFFLINE BOG INGESTION
  // =========================================================================
  const handleFileUpload = async (file: File) => {
    setIsParsingFile(true);
    setUploadedFileName(file.name);

    try {
      // Deep station file parsing with full DOM/XML object hierarchy, polling policies, and PX graphic generation
      const parseResult = await parseStationBogFile(file);

      // Map parsed station result to full SiteAuditReport state
      const updatedReport: SiteAuditReport = {
        ...report,
        siteName: parseResult.stationName || report.siteName,
        supervisoryDeficiencies: [
          ...(report.supervisoryDeficiencies || []).filter((d) => !d.id.startsWith('sup_') && !d.id.startsWith('off_')),
          ...parseResult.supervisoryDeficiencies,
        ],
        plantAhuDeficiencies: [
          ...(report.plantAhuDeficiencies || []).filter((d) => !d.id.startsWith('eq_') && !d.id.startsWith('off_')),
          ...parseResult.plantDeficiencies,
        ],
        terminalUnitsSummary: [
          ...(report.terminalUnitsSummary || []).filter((d) => !d.id.startsWith('term_') && !d.id.startsWith('vav_')),
          ...parseResult.terminalDeficiencies,
        ],
        visualEvidenceFigures: parseResult.visualFigures,
        healthMetrics: parseResult.healthMetrics,
        executiveSummary: parseResult.executiveSummary,
        updatedAt: new Date().toISOString(),
      };

      onUpdateReport(updatedReport);
      setIsParsingFile(false);
      onSelectWorkflow('automated_offline');
    } catch (err) {
      console.error('Failed to parse station file:', err);
      setIsParsingFile(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header / Intro Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 shadow-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                Audit Execution Modes
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {report.siteName} • {report.reportTitle}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans">
              Choose Your Site Audit Method
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>Est. Time: 30s – 15m</span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Select how you want to collect data and generate this engineering report. You can run an{' '}
          <strong className="text-sky-300 font-semibold">Automated Online Scan</strong> directly from the JACE, ingest a{' '}
          <strong className="text-emerald-300 font-semibold">Station File (.bog/.dist) Offline</strong>, or use the{' '}
          <strong className="text-amber-300 font-semibold">Step-by-Step Guided Manual Protocol</strong>.
        </p>
      </div>

      {/* 3 Core Workflow Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ========================================================================= */}
        {/* OPTION 1: AUTOMATED ONLINE SITE AUDIT                                     */}
        {/* ========================================================================= */}
        <div
          id="mode-card-automated-online"
          onClick={() => setSelectedMode('automated_online')}
          className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            selectedMode === 'automated_online'
              ? 'bg-gradient-to-b from-sky-950/40 via-slate-900 to-slate-900 border-sky-400 shadow-xl shadow-sky-950/40 ring-2 ring-sky-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Globe className="w-6 h-6" />
              </div>
              <span className="px-2 py-0.5 text-[9.5px] font-mono font-bold rounded-full bg-sky-950 text-sky-300 border border-sky-800 flex items-center gap-1">
                <Zap className="w-3 h-3 text-sky-400" />
                Fastest (30s)
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>Automated Online Site Audit</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Connect live to the Niagara JACE or Supervisor via Fox / REST. Automatically queries BQL tables, memory heap, BACnet trunks, and locked overrides.
              </p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="text-[11px] font-medium text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Zero manual entry required</span>
              </div>
              <div className="text-[11px] font-medium text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Auto-captures station resource health</span>
              </div>
              <div className="text-[11px] font-medium text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Auto-generates visual figures & scores</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-mono text-sky-400 font-semibold">Live Station Connect</span>
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
              selectedMode === 'automated_online'
                ? 'border-sky-400 bg-sky-500 text-slate-950'
                : 'border-slate-700'
            }`}>
              {selectedMode === 'automated_online' && <CheckCircle2 className="w-3.5 h-3.5" />}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* OPTION 2: AUTOMATED OFFLINE SITE AUDIT                                    */}
        {/* ========================================================================= */}
        <div
          id="mode-card-automated-offline"
          onClick={() => setSelectedMode('automated_offline')}
          className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            selectedMode === 'automated_offline'
              ? 'bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-400 shadow-xl shadow-emerald-950/40 ring-2 ring-emerald-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <HardDrive className="w-6 h-6" />
              </div>
              <span className="px-2 py-0.5 text-[9.5px] font-mono font-bold rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                100% Offline
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>Automated Offline Site Audit</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Ingest an ECS Workbench Studio backup file (<code className="text-emerald-400 font-mono">.bog</code> or <code className="text-emerald-400 font-mono">.dist</code>). Perfect for high-security facilities where live network connections are prohibited.
              </p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="text-[11px] font-medium text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>No live IP network access needed</span>
              </div>
              <div className="text-[11px] font-medium text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Parses slot links & tuning policies</span>
              </div>
              <div className="text-[11px] font-medium text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Works on air-gapped technician laptops</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-mono text-emerald-400 font-semibold">Drop .bog / .dist File</span>
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
              selectedMode === 'automated_offline'
                ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                : 'border-slate-700'
            }`}>
              {selectedMode === 'automated_offline' && <CheckCircle2 className="w-3.5 h-3.5" />}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* OPTION 3: MANUAL SITE AUDIT (GUIDED PROTOCOL)                            */}
        {/* ========================================================================= */}
        <div
          id="mode-card-manual-audit"
          onClick={() => setSelectedMode('manual')}
          className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            selectedMode === 'manual'
              ? 'bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 border-amber-400 shadow-xl shadow-amber-950/40 ring-2 ring-amber-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Wrench className="w-6 h-6" />
              </div>
              <span className="px-2 py-0.5 text-[9.5px] font-mono font-bold rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                Technician Guided
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>Manual Site Audit</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Step-by-step field walkthrough with explicit instructions for What, How, When, and Where to inspect equipment, upload field photos, and customize text.
              </p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="text-[11px] font-medium text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>7 structured field audit stages</span>
              </div>
              <div className="text-[11px] font-medium text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Custom defect & photo uploads</span>
              </div>
              <div className="text-[11px] font-medium text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Fine-grain control over all sections</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-mono text-amber-400 font-semibold">Interactive Field Wizard</span>
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
              selectedMode === 'manual'
                ? 'border-amber-400 bg-amber-500 text-slate-950'
                : 'border-slate-700'
            }`}>
              {selectedMode === 'manual' && <CheckCircle2 className="w-3.5 h-3.5" />}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE CONFIGURATION DRAWER BASED ON SELECTED MODE                   */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl space-y-6">
        {/* OPTION A: ONLINE SCAN LAUNCHPAD */}
        {selectedMode === 'automated_online' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Globe className="w-5 h-5 text-sky-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">Live Station Connection Parameters</h4>
                  <p className="text-xs text-slate-400">Specify the JACE / Supervisor host and port to query real station telemetry.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value as any)}
                  className="text-xs font-mono bg-slate-950 text-sky-300 border border-slate-700 px-2.5 py-1 rounded-lg outline-none focus:border-sky-500"
                >
                  <option value="https_obix">HTTPS (oBIX REST / Port 443)</option>
                  <option value="http_obix">HTTP (oBIX REST / Port 80)</option>
                  <option value="rest_json">Niagara REST JSON API</option>
                  <option value="fox_probe">Fox Protocol Probe (Port 1911/5011)</option>
                </select>
              </div>
            </div>

            {/* Diagnostic Result Banner (Displays authentic results, errors, and private subnet guidance) */}
            {connectionDiagnostic && (
              <div
                className={`p-4 rounded-xl border space-y-3 animate-in fade-in ${
                  connectionDiagnostic.status === 'success'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100'
                    : connectionDiagnostic.status === 'auth_error'
                    ? 'bg-red-950/40 border-red-500/40 text-red-100'
                    : connectionDiagnostic.status === 'private_subnet'
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-100'
                    : 'bg-slate-950 border-slate-700 text-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {connectionDiagnostic.status === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : connectionDiagnostic.status === 'auth_error' ? (
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1 flex-1">
                    <h5 className="text-xs font-bold font-mono uppercase tracking-wider">
                      {connectionDiagnostic.status === 'success'
                        ? 'Live Connection Succeeded'
                        : connectionDiagnostic.status === 'auth_error'
                        ? 'Station Authentication Rejected'
                        : connectionDiagnostic.status === 'private_subnet'
                        ? 'Private Local Subnet Notice'
                        : 'Network Scan Result'}
                    </h5>
                    <p className="text-xs leading-relaxed">{connectionDiagnostic.message}</p>
                    {connectionDiagnostic.details && (
                      <p className="text-[11px] opacity-85 leading-relaxed pt-1 font-mono">{connectionDiagnostic.details}</p>
                    )}
                  </div>
                </div>

                {/* If Private Subnet, Offer Direct Browser Connect and Quick Links */}
                {connectionDiagnostic.isPrivateSubnet && (
                  <div className="pt-2 border-t border-amber-500/20 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleBrowserDirectConnect}
                      className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow transition-all flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Direct Browser Connect (Local LAN)</span>
                    </button>
                    <a
                      href={`https://${stationIp}:${stationPort}/obix/about`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700 transition-all flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                      <span>Open https://{stationIp}:{stationPort}/obix/ in New Tab</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {scanProgress ? (
              <div className="p-6 rounded-xl bg-slate-950 border border-sky-500/30 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono text-sky-300">
                    <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                    <span>Step {scanProgress.step} of 4: {scanProgress.title}</span>
                  </div>
                  <span className="font-mono font-bold text-sky-400">{scanProgress.percent}%</span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500 rounded-full"
                    style={{ width: `${scanProgress.percent}%` }}
                  />
                </div>

                <p className="text-xs text-slate-400 font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  &gt; {scanProgress.detail}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-400">JACE Station IP / Host</label>
                  <input
                    type="text"
                    value={stationIp}
                    onChange={(e) => setStationIp(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                    placeholder="192.168.1.140 or domain"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-400">Port</label>
                  <input
                    type="text"
                    value={stationPort}
                    onChange={(e) => setStationPort(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                    placeholder="443, 80, or 1911"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-400">Niagara Username</label>
                  <input
                    type="text"
                    value={stationUsername}
                    onChange={(e) => setStationUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                    placeholder="admin"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-400">Station Password</label>
                  <input
                    type="password"
                    value={stationPassword}
                    onChange={(e) => setStationPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                    placeholder="Enter station password"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Queries real station oBIX objects, BACnet points, and platform heap.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="btn-run-online-scan"
                  disabled={isConnecting}
                  onClick={handleExecuteOnlineScan}
                  className="px-6 py-2.5 text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl shadow-lg shadow-sky-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Probing Station Live...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Launch Automated Online Scan</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Instant Live Telemetry Ingest Box (Allows pasting live XML / JSON / BQL if cloud connection is blocked) */}
            <div className="pt-5 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-sky-400" />
                  <h5 className="text-xs font-bold text-slate-200">
                    Direct Live Station Telemetry Ingestion (oBIX XML, JSON, or BQL)
                  </h5>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Paste live output from station /obix/ or Workbench BQL
                </span>
              </div>

              <textarea
                value={pastedTelemetry}
                onChange={(e) => {
                  setPastedTelemetry(e.target.value);
                  setPastedError(null);
                }}
                rows={3}
                placeholder="Paste live XML from https://<ip>/obix/about or BQL point query here to immediately generate report from real site data..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl text-xs font-mono text-slate-200 outline-none resize-y"
              />

              {pastedError && (
                <p className="text-xs text-red-400 font-mono flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{pastedError}</span>
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={isParsingPasted || !pastedTelemetry.trim()}
                  onClick={handleIngestPastedTelemetry}
                  className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg border border-slate-700 transition-all flex items-center gap-1.5"
                >
                  {isParsingPasted ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileCode2 className="w-3.5 h-3.5 text-sky-400" />}
                  <span>Ingest Live Telemetry & Build Audit</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OPTION B: OFFLINE FILE INGESTION LAUNCHPAD */}
        {selectedMode === 'automated_offline' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">ECS Workbench Studio Backup Ingestion</h4>
                  <p className="text-xs text-slate-400">Drag & drop your exported Workbench studio file (.bog or .dist) for instant offline analysis.</p>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2 py-1 rounded border border-emerald-800">
                Zero Network Traffic
              </span>
            </div>

            {isParsingFile ? (
              <div className="p-8 rounded-xl bg-slate-950 border border-emerald-500/30 text-center space-y-3 animate-in fade-in">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Decompressing and Parsing {uploadedFileName}...</h4>
                <p className="text-xs text-slate-400 font-mono max-w-md mx-auto">
                  Decoding slot hierarchies, component property sheets, tuning policies, and wire sheet link cascades...
                </p>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const files = e.dataTransfer.files;
                  if (files && files.length > 0) {
                    handleFileUpload(files[0]);
                  }
                }}
                className={`p-8 rounded-2xl border-2 border-dashed transition-all text-center space-y-4 ${
                  dragOver
                    ? 'border-emerald-400 bg-emerald-950/30 scale-[1.01]'
                    : 'border-slate-700 bg-slate-950/60 hover:border-slate-600'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">
                    Drag and drop your <code className="text-emerald-400 font-mono">config.bog</code> or <code className="text-emerald-400 font-mono">station.dist</code> file here
                  </h4>
                  <p className="text-xs text-slate-400">or click below to choose a file from your hard drive</p>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <label className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer border border-slate-700 transition-colors">
                    <span>Browse Local Files</span>
                    <input
                      type="file"
                      accept=".bog,.dist,.xml,.json"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const mockFile = new File(['mock bog content'], `${report.siteName.toLowerCase().replace(/\s+/g, '_')}_station.bog`, {
                        type: 'application/octet-stream',
                      });
                      handleFileUpload(mockFile);
                    }}
                    className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-md transition-all active:scale-95"
                  >
                    Use Station Demo Backup (.bog)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* OPTION C: MANUAL GUIDED PROTOCOL LAUNCHPAD */}
        {selectedMode === 'manual' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Wrench className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">Manual Field Inspection Protocol</h4>
                  <p className="text-xs text-slate-400">Walk through the 7 standard audit checkpoints to manually record findings and photos.</p>
                </div>
              </div>
              <span className="text-xs font-mono text-amber-400 bg-amber-950 px-2 py-1 rounded border border-amber-800">
                7 Step Protocol
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs text-slate-300">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-mono text-amber-400 block font-bold">STAGE 1 & 2</span>
                <span className="font-semibold text-white">JACE Heap & Platform</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-mono text-amber-400 block font-bold">STAGE 3</span>
                <span className="font-semibold text-white">BACnet Bus & Polling</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-mono text-amber-400 block font-bold">STAGE 4 & 5</span>
                <span className="font-semibold text-white">AHU & Plant Control</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-mono text-amber-400 block font-bold">STAGE 6 & 7</span>
                <span className="font-semibold text-white">VAVs & Priority Locks</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                id="btn-launch-manual-wizard"
                onClick={() => onSelectWorkflow('manual')}
                className="px-6 py-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center gap-2"
              >
                <span>Launch Guided Manual Audit</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
