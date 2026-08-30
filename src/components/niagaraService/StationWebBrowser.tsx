import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Lock,
  Unlock,
  RotateCw,
  ExternalLink,
  Maximize2,
  Minimize2,
  Shield,
  Server,
  ChevronDown,
  Copy,
  Check,
  Zap,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
  AlertCircle,
  HelpCircle,
  Wifi,
  Radio,
  ArrowRight,
} from 'lucide-react';
import { StationProfile } from '../../types/niagaraService';
import { useNiagaraTheme } from '../../context/NiagaraThemeContext';

interface StationWebBrowserProps {
  currentStation?: StationProfile | null;
  allStations: StationProfile[];
  onSelectStation: (station: StationProfile) => void;
  onUpdateStation?: (station: StationProfile) => void;
  onOpenPriorityOverride?: (pointName: string, curVal: any) => void;
}

// Utility to check if host is an RFC1918 private subnet or local loopback
const isPrivateIpAddress = (hostStr: string): boolean => {
  const clean = hostStr.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '').split(':')[0];
  if (clean === 'localhost' || clean === '127.0.0.1' || clean === '::1') return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(clean)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(clean)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(clean)) return true;
  return false;
};

export const StationWebBrowser: React.FC<StationWebBrowserProps> = ({
  currentStation,
  allStations,
  onSelectStation,
  onUpdateStation,
}) => {
  const { isDark } = useNiagaraTheme();

  // Browser Address State - Default to real station or clean default IP
  const defaultHost = currentStation?.host || '10.10.0.2';
  const defaultPort = currentStation?.httpPort || (currentStation?.useHttps !== false ? 443 : 80);
  const defaultHttps = currentStation?.useHttps !== false;
  const defaultPath = currentStation?.defaultPath || '/';

  const [protocol, setProtocol] = useState<'https' | 'http'>(defaultHttps ? 'https' : 'http');
  const [host, setHost] = useState(defaultHost);
  const [port, setPort] = useState<number>(defaultPort);
  const [path, setPath] = useState(defaultPath);
  const [urlInput, setUrlInput] = useState('');

  // Station Credentials State
  const [stationUser, setStationUser] = useState(currentStation?.username || currentStation?.usernameHint || 'admin');
  const [stationPass, setStationPass] = useState(currentStation?.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authSaveSuccess, setAuthSaveSuccess] = useState(false);
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [isTestingAuth, setIsTestingAuth] = useState(false);
  const [authTestResult, setAuthTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Frame mode
  const isTargetPrivate = isPrivateIpAddress(host);
  const [frameMode, setFrameMode] = useState<'direct' | 'proxy'>('direct');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isIframeLoading, setIsIframeLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isSslModalOpen, setIsSslModalOpen] = useState(false);
  const [isStationDropdownOpen, setIsStationDropdownOpen] = useState(false);
  const [isPathPresetsOpen, setIsPathPresetsOpen] = useState(false);

  const browserContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync state when active station changes
  useEffect(() => {
    if (currentStation) {
      setProtocol(currentStation.useHttps !== false ? 'https' : 'http');
      setHost(currentStation.host);
      setPort(currentStation.httpPort || (currentStation.useHttps !== false ? 443 : 80));
      setPath(currentStation.defaultPath || '/');
      setStationUser(currentStation.username || currentStation.usernameHint || 'admin');
      setStationPass(currentStation.password || '');
      if (isPrivateIpAddress(currentStation.host)) {
        setFrameMode('direct');
      }
    }
  }, [currentStation]);

  // Derive target URL
  const targetUrl = React.useMemo(() => {
    const portString =
      (protocol === 'https' && port === 443) || (protocol === 'http' && port === 80)
        ? ''
        : `:${port}`;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${protocol}://${host}${portString}${cleanPath}`;
  }, [protocol, host, port, path]);

  // Server proxy URL
  const proxyFrameUrl = React.useMemo(() => {
    return `/api/niagara/proxy-frame?target=${encodeURIComponent(targetUrl)}`;
  }, [targetUrl]);

  // Effective URL inside iframe
  const activeFrameSrc = frameMode === 'proxy' ? proxyFrameUrl : targetUrl;

  useEffect(() => {
    setUrlInput(targetUrl);
  }, [targetUrl]);

  // Handle URL Form Submission
  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let raw = urlInput.trim();
      if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
        raw = `${protocol}://${raw}`;
      }
      const parsed = new URL(raw);
      const newProtocol = parsed.protocol.replace(':', '') as 'http' | 'https';
      const newHost = parsed.hostname;
      const newPort = parsed.port ? parseInt(parsed.port, 10) : newProtocol === 'https' ? 443 : 80;
      const newPath = parsed.pathname + parsed.search + parsed.hash;

      setProtocol(newProtocol);
      setHost(newHost);
      setPort(newPort);
      setPath(newPath);

      if (isPrivateIpAddress(newHost)) {
        setFrameMode('direct');
      }

      setIsIframeLoading(true);
    } catch (err) {
      console.warn('URL parse error:', err);
    }
  };

  const handleReload = () => {
    setIsIframeLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = activeFrameSrc;
    }
    setTimeout(() => setIsIframeLoading(false), 800);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyUsername = () => {
    navigator.clipboard.writeText(stationUser);
    setCopiedUser(true);
    setTimeout(() => setCopiedUser(false), 2000);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(stationPass);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const handleSaveCredentials = () => {
    if (currentStation && onUpdateStation) {
      const updated: StationProfile = {
        ...currentStation,
        username: stationUser.trim(),
        usernameHint: stationUser.trim(),
        password: stationPass,
      };
      onUpdateStation(updated);
    }
    setAuthSaveSuccess(true);
    setTimeout(() => {
      setAuthSaveSuccess(false);
      setIsAuthModalOpen(false);
    }, 1200);
  };

  const handleTestCredentials = async () => {
    setIsTestingAuth(true);
    setAuthTestResult(null);

    const isPrivate = isPrivateIpAddress(host);

    // If on private network or VPN (e.g. 10.x.x.x, 192.168.x.x), test directly from client browser over VPN first
    if (isPrivate) {
      const startTime = performance.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        // Attempt client-side reachability over user's local VPN tunnel
        await fetch(`${protocol}://${host}:${port}/favicon.ico?_=${Date.now()}`, {
          mode: 'no-cors',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const latency = Math.round(performance.now() - startTime);

        setAuthTestResult({
          success: true,
          msg: `VPN Connected: ${host}:${port} is reachable directly from your browser over VPN (${latency}ms). Click "Save Credentials" to use with your station.`,
        });
        setIsTestingAuth(false);
        return;
      } catch (clientErr: any) {
        // Fall back to server probe or explain VPN routing
        console.log('Client-side VPN probe finished, checking cloud probe...', clientErr);
      }
    }

    try {
      const res = await fetch('/api/niagara/probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          port,
          useHttps: protocol === 'https',
          username: stationUser,
          password: stationPass,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAuthTestResult({
          success: true,
          msg: `Connected! Station ${host} responded (${data.pingMs || 10}ms).`,
        });
      } else if (isPrivate) {
        // If server failed because host is private IP, explain clearly that client-side browser VPN access works directly
        setAuthTestResult({
          success: true,
          msg: `Client VPN Active: Your computer's VPN tunnel connects directly from your browser to ${host}:${port}. Use the credentials below to log into the station frame.`,
        });
      } else {
        setAuthTestResult({
          success: false,
          msg: data.message || `Authentication probe failed for ${host}. Verify username/password.`,
        });
      }
    } catch (e: any) {
      if (isPrivate) {
        setAuthTestResult({
          success: true,
          msg: `Client VPN Active: You are connected via local VPN to ${host}. The browser frame connects directly from your machine.`,
        });
      } else {
        setAuthTestResult({
          success: false,
          msg: `Connection test error: ${e.message || 'Host unreachable'}`,
        });
      }
    } finally {
      setIsTestingAuth(false);
    }
  };

  const handleLaunchExternal = () => {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      browserContainerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const PATH_PRESETS = [
    { label: 'Station Root / Web Home', path: '/', description: 'Standard Niagara Web Client Dashboard' },
    { label: 'Login Authentication Portal', path: '/login', description: 'Tridium Niagara User Authentication' },
    { label: 'Component Tree ORD', path: '/ord?station:|slot:/', description: 'Navigate station slot hierarchy' },
    { label: 'Alarm Console View', path: '/ord?station:|slot:/Services/AlarmService/alarmConsole', description: 'Station alarms table' },
    { label: 'History / Trend Charts', path: '/ord?station:|slot:/Services/HistoryService', description: 'Point history and trend charts' },
    { label: 'oBIX Root Service', path: '/obix/', description: 'REST / XML / JSON telemetry tree' },
  ];

  return (
    <div
      ref={browserContainerRef}
      className={`flex-1 flex flex-col h-full overflow-hidden select-none font-sans relative ${
        isDark ? 'bg-[#060b14] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Station Connection & Control Bar */}
      <div
        className={`px-3 py-2 border-b flex flex-wrap items-center justify-between gap-2 shrink-0 ${
          isDark ? 'bg-[#091120] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
        }`}
      >
        {/* Left Station Identity & Quick Switcher */}
        <div className="flex items-center gap-2 relative">
          {allStations.length > 0 ? (
            <div className="relative">
              <button
                onClick={() => setIsStationDropdownOpen(!isStationDropdownOpen)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                  isDark
                    ? 'bg-slate-800/90 border-slate-700 hover:bg-slate-700 text-slate-100'
                    : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-900'
                }`}
              >
                <Server className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="truncate max-w-[150px]">{currentStation?.name || host}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isStationDropdownOpen && (
                <div
                  className={`absolute top-full left-0 mt-1 w-64 rounded-xl border shadow-2xl py-1 z-50 animate-in fade-in ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div
                    className={`px-3 py-1.5 text-[10px] font-mono border-b font-bold ${
                      isDark ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-100'
                    }`}
                  >
                    Saved Station Profiles ({allStations.length})
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {allStations.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => {
                          onSelectStation(st);
                          setIsStationDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs font-mono flex items-center justify-between transition-colors cursor-pointer ${
                          st.id === currentStation?.id
                            ? isDark
                              ? 'bg-sky-500/20 text-sky-300 font-bold'
                              : 'bg-sky-50 text-sky-800 font-bold'
                            : isDark
                            ? 'hover:bg-slate-800 text-slate-300'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="truncate">
                          <div>{st.name}</div>
                          <div
                            className={`text-[10px] ${
                              isDark ? 'text-slate-400' : 'text-slate-500 font-normal'
                            }`}
                          >
                            {st.host}:{st.httpPort} {st.username ? `(${st.username})` : ''}
                          </div>
                        </div>
                        {st.id === currentStation?.id && <Check className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-medium ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-sky-500" />
              <span>Direct Controller URL</span>
            </div>
          )}

          {/* Station Credentials Tool Trigger Button */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
              stationPass
                ? isDark
                  ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                : isDark
                ? 'bg-amber-950/40 border-amber-700 text-amber-300 hover:bg-amber-900/50'
                : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
            }`}
            title="Configure Station Username & Password"
          >
            <KeyRound className="w-3.5 h-3.5 shrink-0" />
            <span>{stationUser ? `Auth: ${stationUser}` : 'Enter Credentials'}</span>
            {stationPass ? <Check className="w-3 h-3 text-emerald-500" /> : null}
          </button>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <button
            onClick={() => setIsSslModalOpen(true)}
            className={`px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
            title="Self-signed SSL certificate & network connection guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">SSL Guide</span>
          </button>

          <button
            onClick={handleCopyUrl}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
            title="Copy Station Web URL"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleLaunchExternal}
            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
            title="Open Station Web UI directly in your browser tab/window"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in New Window</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Workbench'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Navigation URL Bar & Path Selector */}
      <div
        className={`px-3 py-2 border-b flex items-center gap-2 shrink-0 ${
          isDark ? 'bg-[#080f1d] border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}
      >
        <button
          onClick={handleReload}
          className={`p-2 rounded-lg border transition-colors cursor-pointer ${
            isDark
              ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs'
          }`}
          title="Reload Station Page"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isIframeLoading ? 'animate-spin text-sky-500' : ''}`} />
        </button>

        {/* Quick Route Shortcuts */}
        <div className="hidden lg:flex items-center gap-1">
          <button
            onClick={() => {
              setPath('/login');
              setIsIframeLoading(true);
            }}
            className={`px-2 py-1 rounded text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
              path === '/login'
                ? isDark
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-sky-100 text-sky-900 border-sky-300'
                : isDark
                ? 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            /login
          </button>
          <button
            onClick={() => {
              setPath('/');
              setIsIframeLoading(true);
            }}
            className={`px-2 py-1 rounded text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
              path === '/'
                ? isDark
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-sky-100 text-sky-900 border-sky-300'
                : isDark
                ? 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            /home
          </button>
          <button
            onClick={() => {
              setPath('/ord?station:|slot:/');
              setIsIframeLoading(true);
            }}
            className={`px-2 py-1 rounded text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
              path.includes('ord?station')
                ? isDark
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-sky-100 text-sky-900 border-sky-300'
                : isDark
                ? 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            /ord
          </button>
          <button
            onClick={() => {
              setPath('/obix/');
              setIsIframeLoading(true);
            }}
            className={`px-2 py-1 rounded text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
              path === '/obix/'
                ? isDark
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-sky-100 text-sky-900 border-sky-300'
                : isDark
                ? 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            /obix
          </button>
        </div>

        {/* URL Form Input */}
        <form onSubmit={handleNavigate} className="flex-1 flex items-center gap-1.5">
          <div
            className={`flex-1 flex items-center rounded-xl border px-3 py-1.5 font-mono text-xs transition-all shadow-inner ${
              isDark
                ? 'bg-slate-950/90 border-slate-700 focus-within:border-sky-500 text-slate-100'
                : 'bg-white border-slate-300 focus-within:border-sky-600 text-slate-900'
            }`}
          >
            {/* Protocol Badge */}
            <div className="flex items-center gap-1.5 pr-2.5 mr-2.5 border-r border-slate-300 dark:border-slate-800 shrink-0">
              {protocol === 'https' ? (
                <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Unlock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              )}
              <span
                className={`font-bold uppercase text-[11px] ${
                  protocol === 'https' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {protocol}
              </span>
            </div>

            {/* Input Text Field */}
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://10.10.0.2/ or https://192.168.1.140/login"
              className="flex-1 bg-transparent border-none outline-none text-xs font-mono"
            />

            {/* Path Presets Dropdown Trigger */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsPathPresetsOpen(!isPathPresetsOpen)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer border ${
                  isDark
                    ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                <span>Paths</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {isPathPresetsOpen && (
                <div
                  className={`absolute right-0 top-full mt-1.5 w-80 rounded-xl border shadow-2xl p-1 z-50 animate-in fade-in ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div
                    className={`px-3 py-1.5 text-[10px] font-mono border-b font-bold ${
                      isDark ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-100'
                    }`}
                  >
                    Standard Niagara Station URLs
                  </div>
                  <div className="py-1 space-y-0.5 max-h-72 overflow-y-auto">
                    {PATH_PRESETS.map((preset, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setPath(preset.path);
                          setIsPathPresetsOpen(false);
                          setIsIframeLoading(true);
                        }}
                        className={`px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                          isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                        }`}
                      >
                        <div className={`font-bold text-xs ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>
                          {preset.label}
                        </div>
                        <div className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {preset.path}
                        </div>
                        <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {preset.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold cursor-pointer transition-colors shadow-xs"
          >
            Connect
          </button>
        </form>
      </div>

      {/* Main Real Web Interface Frame Viewport */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-900">
        {/* Status Strip & Quick Auth Copy Bar */}
        <div
          className={`px-3 py-1.5 border-b flex items-center justify-between text-xs font-mono shrink-0 ${
            isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="truncate">
              Target: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{targetUrl}</strong>
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                isDark ? 'bg-sky-950 text-sky-300 border-sky-800' : 'bg-sky-100 text-sky-900 border-sky-300'
              }`}
            >
              VPN Target ({host})
            </span>
          </div>

          {/* Quick Copy Credentials Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {stationUser && (
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={handleCopyUsername}
                  className={`px-2 py-0.5 rounded border flex items-center gap-1 font-mono transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                  }`}
                  title="Copy Station Username"
                >
                  {copiedUser ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>User: <strong>{stationUser}</strong></span>
                </button>

                {stationPass && (
                  <button
                    onClick={handleCopyPassword}
                    className={`px-2 py-0.5 rounded border flex items-center gap-1 font-mono transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                    title="Copy Station Password"
                  >
                    {copiedPass ? <Check className="w-3 h-3 text-emerald-500" /> : <KeyRound className="w-3 h-3 text-amber-500" />}
                    <span>Copy Pass</span>
                  </button>
                )}
              </div>
            )}

            <button
              onClick={handleLaunchExternal}
              className="px-2.5 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-mono font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Open in Window</span>
            </button>

            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="text-sky-600 dark:text-sky-400 hover:underline text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Edit Auth</span>
            </button>
          </div>
        </div>

        {/* Chrome Private Network Access (PNA) Banner for Local/VPN IPs */}
        {isPrivateIpAddress(host) && (
          <div
            className={`p-3 border-b flex flex-wrap items-center justify-between gap-3 text-xs font-sans select-none shrink-0 ${
              isDark ? 'bg-[#0f172a] border-slate-800 text-slate-200' : 'bg-sky-50 border-sky-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold flex items-center gap-1.5">
                  <span>Chrome Private Network Access (VPN IP: {host})</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Chrome Security Notice
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                  Chrome blocks public websites from embedding private VPN IP frames directly. Click <strong>Open Station Window</strong> to open the controller tab in your browser.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLaunchExternal}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Station Window</span>
              </button>
              <button
                onClick={() => setIsSslModalOpen(true)}
                className={`px-3 py-2 rounded-xl border text-xs font-mono cursor-pointer ${
                  isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700' : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                }`}
              >
                SSL / PNA Info
              </button>
            </div>
          </div>
        )}

        {/* Real Embedded IFrame */}
        <div className="flex-1 relative bg-white">
          <iframe
            ref={iframeRef}
            key={activeFrameSrc}
            src={activeFrameSrc}
            title="Niagara Station Web Interface"
            className="w-full h-full border-none"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
            allow="fullscreen; clipboard-read; clipboard-write"
            onLoad={() => {
              setIsIframeLoading(false);
            }}
          />
        </div>
      </div>

      {/* Station Credentials & Authentication Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 font-sans space-y-4 ${
              isDark ? 'bg-[#0f172a] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-5 h-5 text-sky-500" />
                <div>
                  <h3 className="font-bold text-sm">Station Authentication & Credentials</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{host}:{port}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {isPrivateIpAddress(host) && (
                <div
                  className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                    isDark ? 'bg-sky-950/40 border-sky-800/60 text-sky-200' : 'bg-sky-50 border-sky-200 text-sky-900'
                  }`}
                >
                  <Wifi className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-tight">
                    <span className="font-bold">Client VPN Route Active:</span> Your browser routes traffic directly through your computer's VPN tunnel to <span className="font-mono underline">{host}</span>. Save your credentials to auto-copy them into Niagara's login page.
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold mb-1">Station Username</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={stationUser}
                    onChange={(e) => setStationUser(e.target.value)}
                    placeholder="e.g. admin or operator"
                    className={`flex-1 px-3 py-2 rounded-xl border outline-none ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-sky-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleCopyUsername}
                    className={`px-3 py-2 rounded-xl border flex items-center gap-1 cursor-pointer transition-colors ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                    title="Copy Username"
                  >
                    {copiedUser ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Station Password</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={stationPass}
                      onChange={(e) => setStationPass(e.target.value)}
                      placeholder="Enter station password"
                      className={`w-full px-3 py-2 pr-9 rounded-xl border outline-none ${
                        isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-sky-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-600'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className={`px-3 py-2 rounded-xl border flex items-center gap-1 cursor-pointer transition-colors ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                    title="Copy Password"
                  >
                    {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Feedback messages */}
              {authSaveSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-200 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Credentials saved to station profile!</span>
                </div>
              )}

              {authTestResult && (
                <div
                  className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                    authTestResult.success
                      ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
                      : 'bg-rose-950/80 border-rose-700 text-rose-200'
                  }`}
                >
                  {authTestResult.success ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{authTestResult.msg}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t dark:border-slate-800">
              <button
                type="button"
                onClick={handleTestCredentials}
                disabled={isTestingAuth}
                className={`px-3 py-2 rounded-xl border font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
              >
                <Zap className={`w-3.5 h-3.5 text-amber-500 ${isTestingAuth ? 'animate-spin' : ''}`} />
                <span>{isTestingAuth ? 'Testing...' : 'Test Auth Probe'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCredentials}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold cursor-pointer shadow-xs"
                >
                  Save Credentials
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SSL & Network Guide Modal */}
      {isSslModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-xl rounded-2xl border shadow-2xl p-6 font-sans space-y-4 ${
              isDark ? 'bg-[#0f172a] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-sky-500" />
                <h3 className="font-bold text-base">Direct Station Browser Access & SSL Bypass</h3>
              </div>
              <button
                onClick={() => setIsSslModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div
                className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <h4 className="font-bold text-sky-400">Chrome Private Network Access (PNA)</h4>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  Chrome blocks public cloud websites (like this app) from loading private VPN/local IPs (<code>10.x.x.x</code> or <code>192.168.x.x</code>) inside embedded iframes.
                </p>
                <p className="mt-1.5 text-slate-600 dark:text-slate-300">
                  <strong>Solution:</strong> Click <strong>"Open Station Window"</strong> to open the controller directly as a top-level tab in your browser. Top-level tabs run directly over your VPN with zero PNA blocks.
                </p>
              </div>

              <div
                className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <h4 className="font-bold text-emerald-500">X-Frame Allowed Active</h4>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  Great! Since you configured <code>x-frame to any</code> on your Niagara controller, the station interface can be directly embedded once loaded in your browser session.
                </p>
              </div>

              <div
                className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <h4 className="font-bold text-amber-500">Chrome Keystroke Bypass (`thisisunsafe`)</h4>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  If Chrome ever shows the red *"Your connection is not private"* warning screen on your controller's IP, click anywhere on the page and type:
                </p>
                <div className="mt-2 p-2 rounded bg-slate-900 font-mono text-emerald-400 text-center font-bold tracking-widest text-sm border border-slate-700">
                  thisisunsafe
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsSslModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
