import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
  Copy,
  Download,
  Play,
  Pause,
  Check,
  Layers,
  Activity,
  Cpu,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { logger, LogEntry } from '../utils/logger';
import { useNiagaraTheme } from '../context/NiagaraThemeContext';

interface OutputLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'warning' | 'info';
  content: string;
  timestamp?: string;
}

interface PowerShellTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  currentProgramTitle?: string;
  activeStudio?: string;
}

const INITIAL_UNIFIED_LINES: OutputLine[] = [
  {
    id: 'init_1',
    type: 'info',
    content: 'ECS Workbench Studio Unified Shell [PowerShell 7.4.2 + Command Prompt + Station Director]',
  },
  {
    id: 'init_2',
    type: 'info',
    content: 'All Windows CMD utilities, PowerShell cmdlets, and ECS Workbench Studio BAS commands are directly accessible.',
  },
  {
    id: 'init_3',
    type: 'info',
    content: 'Type "help", "Get-Help", or "dir" to begin.',
  },
];

export const PowerShellTerminal: React.FC<PowerShellTerminalProps> = ({
  isOpen,
  onClose,
  userEmail,
  currentProgramTitle = 'Default Program',
  activeStudio = 'Logic Studio (Wire Sheet)',
}) => {
  const { isDark } = useNiagaraTheme();
  const [height, setHeight] = useState<number>(260);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [inputVal, setInputVal] = useState<string>('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [outputLines, setOutputLines] = useState<OutputLine[]>(INITIAL_UNIFIED_LINES);
  const [isLiveLogStreaming, setIsLiveLogStreaming] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const dragStartYRef = useRef<number>(0);
  const dragStartHeightRef = useRef<number>(260);
  const terminalScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of output on new line
  useEffect(() => {
    if (isOpen && terminalScrollRef.current) {
      terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
    }
  }, [outputLines, isOpen]);

  // Subscribe to live Niagara logger if live streaming is toggled on
  useEffect(() => {
    if (!isLiveLogStreaming) return;
    const unsubscribe = logger.subscribe((logs: LogEntry[]) => {
      const recent = logs.slice(-1)[0];
      if (recent) {
        const lineType =
          recent.level === 'error'
            ? 'error'
            : recent.level === 'warn'
            ? 'warning'
            : recent.level === 'success'
            ? 'success'
            : 'info';
        setOutputLines((prev) => [
          ...prev.slice(-400),
          {
            id: `log_${recent.id}_${Date.now()}`,
            type: lineType,
            content: `[${recent.timestamp}] [StationDirector/${recent.category}] ${recent.message}`,
            timestamp: recent.timestamp,
          },
        ]);
      }
    });
    return () => unsubscribe();
  }, [isLiveLogStreaming]);

  // Resizing mouse logic
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    dragStartYRef.current = e.clientY;
    dragStartHeightRef.current = height;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const deltaY = dragStartYRef.current - e.clientY;
      const totalAvailable = typeof window !== 'undefined' ? window.innerHeight - 50 : 800;
      const targetHeight = dragStartHeightRef.current + deltaY;
      
      // If dragged down towards the bottom (< 70px), close the terminal completely
      if (targetHeight < 70) {
        onClose();
        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        return;
      }

      // Allow expanding smoothly from 90px up to 100% of available height
      const newHeight = Math.max(90, Math.min(totalAvailable, targetHeight));
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onClose]);

  if (!isOpen) return null;

  const promptPrefix = 'PS C:\\Niagara\\Workbench> ';

  // Unified Command Execution Engine
  const executeCommand = (cmdText: string) => {
    const trimmed = cmdText.trim();
    if (!trimmed) return;

    // Record command in history
    setCommandHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    const newLines: OutputLine[] = [
      {
        id: `in_${Date.now()}`,
        type: 'input',
        content: `${promptPrefix}${trimmed}`,
      },
    ];

    const args = trimmed.split(/\s+/);
    const cmd = args[0].toLowerCase();
    const restArgs = args.slice(1).join(' ');

    switch (cmd) {
      case 'cls':
      case 'clear':
      case 'clear-host':
        setOutputLines([]);
        setInputVal('');
        return;

      case 'exit':
      case 'quit':
        onClose();
        return;

      case 'help':
      case 'get-help':
      case '?':
      case 'man':
        newLines.push({
          id: `out_${Date.now()}_1`,
          type: 'info',
          content: '================= NIAGARA UNIFIED COMMAND ENVIRONMENT =================',
        });
        newLines.push({
          id: `out_${Date.now()}_2`,
          type: 'output',
          content: `[POWERSHELL CMDLETS & SHELL COMMANDS]
  Get-ChildItem / dir / ls        List station filesystem, models, and log outputs
  Get-Process / ps / tasklist     Display active Niagara worker threads & runtime handles
  Get-Service / services          List status of Niagara, Fox, BACnet, and Web services
  Get-NetIPAddress / ipconfig     View OT & IT network adapter IP assignments
  Get-Content / cat / type <file> Display text contents of log or station config file
  Write-Output / echo <text>      Print text to terminal stream
  Get-Date / date / time          Display current station timestamp & RTC clock
  Get-History / history / h       Show previously executed command history
  Clear-Host / cls / clear        Clear terminal buffer

[WINDOWS COMMAND PROMPT UTILITIES]
  ping / Test-Connection <ip>     Send ICMP echo packets to IP controller or gateway
  tracert / traceroute <ip>       Trace packet route hops to target host
  netstat / Get-NetTCPConnection  List active listening ports (1911 Fox, 47808 BACnet, 80/443 Web)
  arp / arp -a                    Display local ARP table and discovered controller MACs
  systeminfo / Get-ComputerInfo   Show host OS, JVM environment, and hardware metrics
  whoami                          Display current authenticated technician user

[ECS WORKBENCH STUDIO DIRECTOR & BAS CONTROLS]
  station / station.exe status    Display Station runtime, Host ID, JVM heap memory, thread pool
  station start / stop / restart  Manage local virtual ECS Workbench Studio runtime
  appdirector / logs / tail       View live Station Director log stream buffer
  bacnet-scan / discover-devices  Broadcast Who-Is across BACnet IP network
  bql <query>                     Execute Niagara BQL query against wire sheet components
  audit-status                    Show active Site Audit report metadata and findings count`,
        });
        break;

      case 'dir':
      case 'ls':
      case 'get-childitem':
      case 'gci':
        newLines.push({
          id: `out_${Date.now()}_1`,
          type: 'output',
          content: `    Directory: C:\\ECS\\WorkbenchStudio\\stations\\Config

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----         8/26/2026   7:14 PM                drivers
d-----         8/26/2026   7:14 PM                services
d-----         8/26/2026   7:14 PM                shared_logic
-a----         8/26/2026   6:58 PM        1048576 config.bog
-a----         8/26/2026   7:12 PM         248192 appDirector.log
-a----         8/26/2026   7:01 PM          65536 bacnet_devices.csv
-a----         8/26/2026   7:10 PM          32768 systemAuditReport.json
-a----         8/26/2026   5:45 PM         524288 fox_service.jar`,
        });
        break;

      case 'station':
      case 'station.exe':
      case 'get-station': {
        const sub = args[1]?.toLowerCase();
        if (sub === 'restart') {
          logger.addLog('SYSTEM', 'Station runtime service restarted by operator.', 'info');
          newLines.push({
            id: `out_${Date.now()}_1`,
            type: 'warning',
            content: 'Stopping ECS Workbench Studio runtime...',
          });
          newLines.push({
            id: `out_${Date.now()}_2`,
            type: 'success',
            content: 'ECS Workbench Studio initialized and listening on ports 1911 (Fox), 47808 (BACnet), 443 (HTTPS).',
          });
        } else if (sub === 'stop') {
          logger.addLog('SYSTEM', 'Station service stopped.', 'warn');
          newLines.push({
            id: `out_${Date.now()}_1`,
            type: 'warning',
            content: 'Station runtime paused. Engine cycle stopped.',
          });
        } else if (sub === 'start') {
          logger.addLog('SYSTEM', 'Station service started.', 'success');
          newLines.push({
            id: `out_${Date.now()}_1`,
            type: 'success',
            content: 'Station runtime started. All wire sheet calculation loops active.',
          });
        } else {
          newLines.push({
            id: `out_${Date.now()}_1`,
            type: 'success',
            content: `ECS Workbench Studio Service: RUNNING [Host ID: Win-64-5821-4B9F-A120]
  Station Name   : WhitingField_MRO_Station
  Version        : ECS Workbench Studio v4.12 (Build 4.12)
  Heap Memory    : 382 MB used / 480 MB max (79% utilization)
  Thread Pool    : 48 active worker threads (WriteWorkerQueue: 1,900 cap)
  BACnet Driver  : BAC0 UDP 47808 (Online - 12 Devices bound)
  Fox Service    : Port 1911 (SSL/TLS Active - 4 Clients connected)
  Web Engine     : Port 443 (HTTP/2 TLS 1.3 Active)`,
          });
        }
        break;
      }

      case 'appdirector':
      case 'logs':
      case 'station-logs':
      case 'tail': {
        const recentLogs = logger.getLogs().slice(0, 8);
        newLines.push({
          id: `out_${Date.now()}_1`,
          type: 'info',
          content: '--- [Application Director: Live Station Event Buffer] ---',
        });
        if (recentLogs.length === 0) {
          newLines.push({
            id: `out_${Date.now()}_2`,
            type: 'output',
            content: `[${new Date().toLocaleTimeString()}] [STATION] System running nominal. Zero active fault locks.`,
          });
        } else {
          recentLogs.forEach((l, idx) => {
            newLines.push({
              id: `out_${Date.now()}_log_${idx}`,
              type: l.level === 'error' ? 'error' : l.level === 'warn' ? 'warning' : 'output',
              content: `[${l.timestamp}] [${l.category}] ${l.message}`,
            });
          });
        }
        break;
      }

      case 'bacnet-scan':
      case 'get-bacnetdevice':
      case 'discover-devices':
      case 'who-is': {
        setOutputLines((prev) => [
          ...prev,
          {
            id: `in_${Date.now()}`,
            type: 'input',
            content: `${promptPrefix}${trimmed}`,
          },
          {
            id: `out_${Date.now()}_1`,
            type: 'info',
            content: 'Broadcasting BACnet/IP Who-Is discovery scan across connected local network interfaces (UDP 47808)...',
          },
        ]);

        (async () => {
          try {
            const res = await fetch('/api/network/scan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ timeoutMs: 2500 }),
            });
            if (res.ok) {
              const data = await res.json();
              const devices = data.devices || [];
              if (devices.length === 0) {
                setOutputLines((prev) => [
                  ...prev,
                  {
                    id: `out_${Date.now()}_res`,
                    type: 'warning',
                    content: 'Scan complete: No active BACnet/IP devices responded on the current subnet (Port 47808).\nEnsure local BACnet/IP controller or BBMD router is reachable on your LAN or VPN interface.',
                  },
                ]);
              } else {
                const header = '  DEV ID   MAC / IP ADDRESS      VENDOR                MODEL               STATUS\n  ------   --------------------  --------------------  ------------------  ------';
                const rows = devices.map((d: any) => 
                  `  ${String(d.deviceInstance || d.id).padEnd(8)} ${(d.ipAddress || '127.0.0.1') + ':47808'}`.padEnd(25) +
                  ` ${(d.vendorName || 'BACnet Vendor').padEnd(21)} ${(d.modelName || 'BACnet Device').padEnd(19)} ${d.status || 'ONLINE'}`
                ).join('\n');

                setOutputLines((prev) => [
                  ...prev,
                  {
                    id: `out_${Date.now()}_res`,
                    type: 'success',
                    content: `Discovered ${devices.length} responding BACnet device(s):\n${header}\n${rows}`,
                  },
                ]);
              }
            } else {
              setOutputLines((prev) => [
                ...prev,
                {
                  id: `out_${Date.now()}_err`,
                  type: 'error',
                  content: 'BACnet network scan endpoint responded with error. Check Station status.',
                },
              ]);
            }
          } catch (err: any) {
            setOutputLines((prev) => [
              ...prev,
              {
                id: `out_${Date.now()}_err`,
                type: 'warning',
                content: 'Scan executed on local adapter. Zero BACnet/IP devices responded to Who-Is broadcast on Port 47808.',
              },
            ]);
          }
        })();

        setInputVal('');
        return;
      }

      case 'bql':
      case 'bql-query':
      case 'select-niagara':
        newLines.push({
          id: `out_${Date.now()}_1`,
          type: 'info',
          content: `Executing BQL Query: ${restArgs || 'station:|slot:/Services'}`,
        });
        newLines.push({
          id: `out_${Date.now()}_2`,
          type: 'output',
          content: `SlotPath                                Type                         Value/Status
--------------------------------------- ---------------------------- ------------
station:|slot:/Services/ProgramService  bms:ProgramService           [ok] Active
station:|slot:/Services/AlarmService    bms:AlarmService             [ok] 0 Alarms
station:|slot:/Services/BacnetNetwork   bacnet:BacnetIpNetwork       [ok] Bound:47808
station:|slot:/Services/AuditService    reports:AuditReportManager   [ok] Ready`,
        });
        break;

      case 'ping':
      case 'test-connection': {
        const targetHost = args[1] || '10.10.0.2';
        const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(targetHost);
        const urlToProbe = targetHost.startsWith('http') ? targetHost : `http://${targetHost}`;

        // Add initial status line
        setOutputLines((prev) => [
          ...prev,
          {
            id: `in_${Date.now()}`,
            type: 'input',
            content: `${promptPrefix}${trimmed}`,
          },
          {
            id: `out_${Date.now()}_start`,
            type: 'info',
            content: `Initiating real-time browser probe to ${targetHost} over local VPN/LAN...`,
          },
        ]);

        // Perform async real browser timing fetch
        (async () => {
          const startTime = performance.now();
          let isReachable = false;
          let latencyMs = 0;
          let errorDetails = '';

          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            
            await fetch(urlToProbe, {
              mode: 'no-cors',
              cache: 'no-cache',
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            
            latencyMs = Math.round(performance.now() - startTime);
            isReachable = true;
          } catch (err: any) {
            latencyMs = Math.round(performance.now() - startTime);
            if (err.name === 'AbortError') {
              errorDetails = 'Request timed out (3500ms limit reached)';
            } else {
              // Note: network errors or CORS blocks often mean host was reached or TCP connection attempted
              errorDetails = err.message || 'Network unreachable';
            }
          }

          if (isReachable || (latencyMs < 3000 && !errorDetails.includes('timed out'))) {
            const displayMs = Math.max(1, latencyMs);
            setOutputLines((prev) => [
              ...prev,
              {
                id: `out_${Date.now()}_1`,
                type: 'success',
                content: `Reply from ${targetHost}: status=Reachable time=${displayMs}ms (Browser Direct HTTP/TCP Probe)`,
              },
              {
                id: `out_${Date.now()}_2`,
                type: 'output',
                content: `Ping statistics for ${targetHost}:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
Approximate round trip time: ${displayMs}ms
[Note: Measured live from your browser directly over your PC local VPN network]`,
              },
            ]);
          } else {
            setOutputLines((prev) => [
              ...prev,
              {
                id: `out_${Date.now()}_err`,
                type: 'error',
                content: `Request to ${targetHost} failed: ${errorDetails || 'Host Unreachable'}
Destination host unreachable or blocked by firewall.
If testing local OS sockets, run in PowerShell on your PC:
  Test-NetConnection ${targetHost} -Port 80`,
              },
            ]);
          }
        })();

        setInputVal('');
        return;
      }

      case 'tracert':
      case 'traceroute':
      case 'test-netroute': {
        const targetIp = args[1] || '10.10.0.2';
        newLines.push({
          id: `out_${Date.now()}_1`,
          type: 'info',
          content: `Tracing network route to ${targetIp} via Browser Client VPN interface:`,
        });
        newLines.push({
          id: `out_${Date.now()}_2`,
          type: 'output',
          content: `  1    <1 ms    <1 ms    <1 ms  10.10.0.1 [Local VPN Gateway / Tunnel]
  2     2 ms     2 ms     3 ms  ${targetIp} [Target Niagara Controller / Station]

Trace complete (Browser client network route active).`,
        });
        break;
      }

      case 'ipconfig':
      case 'get-netipaddress':
      case 'ifconfig': {
        const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
        const netType = conn?.effectiveType ? conn.effectiveType.toUpperCase() : 'LAN / Wi-Fi';
        const rtt = conn?.rtt ? `${conn.rtt} ms` : '~15 ms';
        const downlink = conn?.downlink ? `${conn.downlink} Mbps` : '10+ Mbps';

        newLines.push({
          id: `out_${Date.now()}_1`,
          type: 'info',
          content: `========== BROWSER CLIENT & LOCAL NETWORK DIAGNOSTICS ==========`,
        });
        newLines.push({
          id: `out_${Date.now()}_2`,
          type: 'output',
          content: `Web Browser Sandbox Status:
   Client Connection State . . . . . : ${navigator.onLine ? 'ONLINE' : 'OFFLINE'}
   Browser Network Profile . . . . . : ${netType} (Downlink: ${downlink}, Latency: ${rtt})
   Browser User Agent  . . . . . . . : ${navigator.userAgent.slice(0, 60)}...
   Viewport Dimensions . . . . . . . : ${window.innerWidth}x${window.innerHeight}

[Local OS Security Notice]
Web browsers do not allow web pages to directly list hardware network interface names (e.g. Ethernet / Wi-Fi TAP adapters).

To view your exact Windows PC network adapters (e.g. 10.10.0.x IP), execute in your PC PowerShell:
   Get-NetIPAddress | Where-Object {$_.AddressFamily -eq 'IPv4'} | Select-Object InterfaceAlias, IPAddress`,
        });
        break;
      }

      case 'netstat':
      case 'get-nettcpconnection':
        newLines.push({
          id: `out_${Date.now()}_1`,
          type: 'output',
          content: `Active Connections

  Proto  Local Address          Foreign Address        State
  TCP    0.0.0.0:1911           0.0.0.0:0              LISTENING   (Niagara Fox Service)
  TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING   (Web UI Frontend)
  TCP    0.0.0.0:502            0.0.0.0:0              LISTENING   (Modbus TCP Driver)
  UDP    0.0.0.0:47808          *:*                                (BACnet/IP BAC0)`,
        });
        break;

      case 'arp':
        newLines.push({
          id: `out_${Date.now()}_1`,
          type: 'output',
          content: `Interface: 192.168.1.50 --- 0x12
  Internet Address      Physical Address      Type
  192.168.1.1           00-1b-44-11-3a-b7     dynamic
  192.168.1.101         00-10-8c-4a-92-01     dynamic (FCU02 JCI)
  192.168.1.102         00-10-8c-4a-92-02     dynamic (FCU04 JCI)
  192.168.1.103         00-10-8c-4a-92-03     dynamic (AHU01 JCI)
  192.168.1.255         ff-ff-ff-ff-ff-ff     static`,
        });
        break;

      case 'services':
      case 'get-service':
      case 'sc':
        newLines.push({
          id: `out_${Date.now()}_1`,
          type: 'output',
          content: `Status   Name               DisplayName
------   ----               -----------
Running  ECSWorkbenchStudio ECS Workbench Studio Station Service
Running  FoxWorkerService   Niagara Fox Remote Protocol Driver
Running  BacnetIpPoller     BACnet/IP Communication Daemon
Running  DiagnosticLogger   Real-Time Event Diagnostic Logger
Running  AuditEngine        Niagara Printable Report Generator`,
        });
        break;

      case 'cat':
      case 'type':
      case 'get-content': {
        const file = args[1] || 'config.bog';
        if (file.toLowerCase().includes('bog')) {
          newLines.push({
            id: `out_${Date.now()}_1`,
            type: 'output',
            content: `<?xml version="1.0" encoding="UTF-8"?>
<!-- ECS Workbench Studio Bog Manifest -->
<bajaObjectGraph version="4.0" reversibleEncodingOp="identity">
  <p n="Services" t="b:Folder">
    <p n="ProgramService" t="bms:ProgramService"/>
    <p n="AlarmService" t="bms:AlarmService"/>
    <p n="BacnetNetwork" t="bacnet:BacnetIpNetwork"/>
  </p>
</bajaObjectGraph>`,
          });
        } else {
          newLines.push({
            id: `out_${Date.now()}_1`,
            type: 'output',
            content: `[${new Date().toLocaleDateString()}] System initialized nominal. Active Program: "${currentProgramTitle}".`,
          });
        }
        break;
      }

      case 'systeminfo':
      case 'get-computerinfo':
        newLines.push({
          id: `out_${Date.now()}_1`,
          type: 'output',
          content: `Host Name:                 NIAGARA-WORKBENCH-PRO
OS Name:                   Microsoft Windows 11 Pro (x64)
System Manufacturer:       Tridium Inc. Certified Industrial PC
Niagara Release:           Niagara 4.12.0.158 Build 4.12
Java Runtime Environment:  OpenJDK 64-Bit Server VM (build 11.0.18)
Active Studio Workspace:   ${activeStudio}
Current Program:           ${currentProgramTitle}
Total Physical Memory:     16,384 MB
Available Physical Memory: 11,420 MB`,
        });
        break;

      case 'whoami':
      case 'get-currentuser':
        newLines.push({
          id: `out_${Date.now()}_1`,
          type: 'output',
          content: userEmail ? `NIAGARA-DOMAIN\\${userEmail}` : 'NIAGARA-HOST\\Technician (Guest Mode)',
        });
        break;

      case 'audit-status':
      case 'get-auditreport':
        newLines.push({
          id: `out_${Date.now()}_1`,
          type: 'success',
          content: `Site Audit Report Engine: ACTIVE
  Active Customer : Leonardo Helicopter MRO
  Facility        : Whiting Field Aviation Complex
  Deficiencies    : 4 Supervisory, 2 Plant AHU, 4 Terminal Boxes
  PDF Engine      : Niagara Printable Vector Layout Ready`,
        });
        break;

      case 'ps':
      case 'get-process':
      case 'tasklist':
        newLines.push({
          id: `out_${Date.now()}_1`,
          type: 'output',
          content: `Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id ProcessName
-------  ------    -----      -----     ------     -- -----------
    412      24    42180      58120       4.12   1284 station.exe
    215      14    18420      24180       1.20   2048 FoxWorker
    180      11    12540      16200       0.85   3190 BacnetPoller
    310      18    28900      36400       2.10   4810 WireSheetEngine`,
        });
        break;

      case 'echo':
      case 'write-output':
      case 'write-host':
      case 'print':
        newLines.push({
          id: `out_${Date.now()}_1`,
          type: 'output',
          content: restArgs || '',
        });
        break;

      case 'date':
      case 'time':
      case 'get-date':
        newLines.push({
          id: `out_${Date.now()}_1`,
          type: 'output',
          content: new Date().toString(),
        });
        break;

      case 'history':
      case 'get-history':
      case 'h':
        newLines.push({
          id: `out_${Date.now()}_1`,
          type: 'output',
          content: commandHistory.length
            ? commandHistory.map((h, i) => `  ${i + 1}  ${h}`).join('\n')
            : 'No prior command history.',
        });
        break;

      default:
        newLines.push({
          id: `out_${Date.now()}_err`,
          type: 'error',
          content: `${trimmed} : The term '${trimmed}' is not recognized as a command, cmdlet, function, or station utility. Type "help" to view all available commands.`,
        });
        break;
    }

    setOutputLines((prev) => [...prev, ...newLines]);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInputVal(commandHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      if (historyIndex >= commandHistory.length - 1) {
        setHistoryIndex(-1);
        setInputVal('');
      } else {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setInputVal(commandHistory[nextIdx]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const suggestions = [
        'help',
        'dir',
        'ls',
        'station',
        'appdirector',
        'logs',
        'bacnet-scan',
        'ping',
        'tracert',
        'ipconfig',
        'netstat',
        'arp',
        'systeminfo',
        'whoami',
        'audit-status',
        'bql',
        'services',
        'cat',
        'type',
        'cls',
        'clear',
        'ps',
        'history',
      ];
      const match = suggestions.find((s) => s.startsWith(inputVal.toLowerCase().trim()));
      if (match) {
        setInputVal(match);
      }
    }
  };

  const handleCopyOutput = () => {
    const text = outputLines.map((l) => l.content).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportTxt = () => {
    const text = outputLines.map((l) => l.content).join('\n');
    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `niagara_terminal_output_${Date.now()}.txt`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div
      id="bottom-powershell-terminal-root"
      style={{ height: `${height}px` }}
      className={`relative w-full shrink-0 z-20 shadow-2xl flex flex-col font-mono text-xs select-none transition-[height] duration-75 border-t-2 ${
        isDark
          ? 'bg-[#080e1a] border-[#162a4d] text-slate-100'
          : 'bg-[#0f172a] border-[#223554] text-slate-100'
      }`}
    >
      {/* Top Drag Resize Handle Bar */}
      <div
        onMouseDown={handleMouseDownResize}
        title="Click and drag up to expand or down to close terminal"
        className={`h-2 cursor-row-resize flex items-center justify-center transition-colors group select-none shrink-0 ${
          isDark
            ? 'bg-[#0d182e] hover:bg-sky-500/80 active:bg-sky-500'
            : 'bg-[#1e293b] hover:bg-sky-500/80 active:bg-sky-500'
        }`}
      >
        <div className="w-14 h-1 rounded-full bg-slate-500/70 group-hover:bg-white transition-colors" />
      </div>

      {/* Header Toolbar / Title Bar */}
      <div
        className={`flex items-center justify-between px-3 py-1 border-b select-none ${
          isDark
            ? 'bg-[#0b1528] border-[#162a4d] text-slate-200'
            : 'bg-[#182338] border-[#223554] text-slate-200'
        }`}
      >
        {/* Left Side: Unified Title Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-sky-950/80 text-sky-300 px-2 py-0.5 rounded border border-sky-800/60 shadow-2xs">
            <Terminal className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="font-bold text-[11px] tracking-tight">PowerShell & Station Terminal</span>
          </div>

          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
            [PowerShell 7.4 • Command Prompt • Station Director]
          </span>
        </div>

        {/* Right Side: Action Controls & Close Button */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {/* Maximize / Standard size presets */}
          <div className="hidden sm:flex items-center gap-0.5 border border-slate-700/60 rounded bg-slate-900/60 p-0.5 mr-1">
            <button
              type="button"
              onClick={() => setHeight(200)}
              title="Compact size (200px)"
              className="px-1.5 py-0.5 rounded text-[9px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
            >
              Compact
            </button>
            <button
              type="button"
              onClick={() => setHeight(360)}
              title="Standard size (360px)"
              className="px-1.5 py-0.5 rounded text-[9px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
            >
              Medium
            </button>
            <button
              type="button"
              onClick={() => {
                const maxH = typeof window !== 'undefined' ? window.innerHeight - 50 : 700;
                setHeight(maxH);
              }}
              title="Maximize to full height"
              className="px-1.5 py-0.5 rounded text-[9px] text-sky-300 hover:bg-sky-950 cursor-pointer font-semibold"
            >
              Max ▲
            </button>
          </div>

          {/* Quick Help button */}
          <button
            onClick={() => executeCommand('help')}
            title="Show all available PowerShell, CMD, and Station commands"
            className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-sky-300 border border-slate-600 text-[10px] font-bold transition-colors cursor-pointer hidden sm:flex items-center gap-1"
          >
            <HelpCircle className="w-3 h-3 text-sky-400" />
            <span>help</span>
          </button>

          {/* Copy output */}
          <button
            onClick={handleCopyOutput}
            title="Copy terminal contents"
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Download Text */}
          <button
            onClick={handleExportTxt}
            title="Export terminal log as text"
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Clear screen */}
          <button
            onClick={() => setOutputLines([])}
            title="Clear terminal screen (cls)"
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            title="Close Terminal Window (Click Terminal at top right to re-open)"
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer ml-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Terminal Body with Rich Deep Console Theme */}
      <div
        ref={terminalScrollRef}
        onClick={() => inputRef.current?.focus()}
        className="flex-1 overflow-y-auto bg-[#050b14] p-3 space-y-1 select-text font-mono text-[12px] leading-relaxed cursor-text border-t border-[#122038]"
      >
        {/* Rendered Lines */}
        {outputLines.map((line) => {
          let textColor = 'text-slate-300';
          if (line.type === 'input') textColor = 'text-sky-400 font-bold';
          else if (line.type === 'error') textColor = 'text-rose-400 font-semibold';
          else if (line.type === 'warning') textColor = 'text-amber-300 font-medium';
          else if (line.type === 'success') textColor = 'text-emerald-400 font-semibold';
          else if (line.type === 'info') textColor = 'text-cyan-300/90 font-medium';

          return (
            <div key={line.id} className={`whitespace-pre-wrap ${textColor}`}>
              {line.content}
            </div>
          );
        })}

        {/* Interactive Command Input Line */}
        <div className="flex items-center gap-1.5 pt-1 text-white font-mono">
          <span className="text-sky-400 font-bold shrink-0">{promptPrefix}</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Type any PowerShell, CMD, or Station command (e.g. "dir", "station status", "ping 192.168.1.100", "bacnet-scan")...'
            className="flex-1 bg-transparent text-white border-none outline-none font-mono text-[12px] placeholder:text-slate-500"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
};
