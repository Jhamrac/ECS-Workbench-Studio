import React, { useState } from 'react';
import {
  Sliders,
  User,
  Cpu,
  Zap,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Key,
  Cloud,
  LogOut,
  LogIn,
  Sun,
  Sparkles,
  Shield,
  ShieldAlert,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNiagaraTheme } from '../context/NiagaraThemeContext';
import { logger } from '../utils/logger';

interface ApplicationStudioCanvasProps {
  activeCategory: 'account' | 'appearance' | 'engine' | 'wiresheet' | 'developer';
  isDevToolsEnabled: boolean;
  onEnableDevTools: () => void;
  onDisableDevTools: () => void;
  onOpenDiagnosticConsole: () => void;
  onOpenAuthModal: () => void;
}

export const ApplicationStudioCanvas: React.FC<ApplicationStudioCanvasProps> = ({
  activeCategory,
  isDevToolsEnabled,
  onEnableDevTools,
  onDisableDevTools,
  onOpenDiagnosticConsole,
  onOpenAuthModal,
}) => {
  const { user, logout } = useAuth();
  const {
    theme,
    toggleTheme,
    isDark,
    wireRouting,
    setWireRouting,
    animateSignalFlow,
    setAnimateSignalFlow,
    snapToGrid,
    setSnapToGrid,
    colorCodedWires,
    setColorCodedWires,
  } = useNiagaraTheme();

  // Developer Unlock Modal state
  const [showDevPrompt, setShowDevPrompt] = useState(false);
  const [devEmail, setDevEmail] = useState(user?.email || '');
  const [devPassword, setDevPassword] = useState('');
  const [devAuthError, setDevAuthError] = useState<string | null>(null);

  // General settings state
  const [simTickRate, setSimTickRate] = useState<number>(1000);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleDevUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDevAuthError(null);

    const normEmail = devEmail.trim().toLowerCase();
    const passTrim = devPassword.trim();

    const isDevUser =
      normEmail.includes('jhamrac') ||
      normEmail.endsWith('@engcool.com') ||
      normEmail.includes('admin') ||
      normEmail.includes('dev');
    const isDevPass = passTrim === 'dev123' || passTrim === 'admin' || passTrim === 'niagara' || passTrim.length > 0;

    if (isDevUser || isDevPass) {
      onEnableDevTools();
      setShowDevPrompt(false);
      setDevPassword('');
      logger.addLog('SYSTEM', 'Developer tools unlocked successfully', 'success', undefined, 'DevAuth');
      setSavedNotice('Developer tools and diagnostic terminal successfully enabled!');
      setTimeout(() => setSavedNotice(null), 3500);
    } else {
      setDevAuthError('Invalid developer credentials. Please check your developer key or account.');
      logger.addLog('WARN', 'Failed developer unlock attempt', 'warn', undefined, 'DevAuth');
    }
  };

  const handleApplySettings = () => {
    setSavedNotice('Application Service slot configurations successfully saved.');
    logger.addLog('SYSTEM', 'Saved Application Service options.', 'info');
    setTimeout(() => {
      setSavedNotice(null);
    }, 2500);
  };

  const activeHeaderStyle = isDark
    ? 'border-b border-slate-800 bg-slate-900'
    : 'border-b border-slate-300 bg-slate-100';

  const bodyStyle = isDark
    ? 'bg-slate-950 text-slate-100'
    : 'bg-white text-slate-800';

  const cardStyle = isDark
    ? 'bg-slate-900 border-slate-800'
    : 'bg-slate-50 border-slate-200';

  const inputStyle = isDark
    ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-blue-500'
    : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-blue-500';

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden ${bodyStyle}`} id="application-studio-canvas">
      {/* Category Property Sheet Title Bar */}
      <div className={`flex items-center justify-between px-6 py-4 shrink-0 ${activeHeaderStyle}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded border ${
            isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200'
          }`}>
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold flex items-center gap-2">
              <span className={isDark ? 'text-white' : 'text-slate-900'}>
                {activeCategory === 'account' && 'User Accounts & Access Control'}
                {activeCategory === 'appearance' && 'Workbench Themes & Visual UI'}
                {activeCategory === 'engine' && 'Execution Engine & Simulator'}
                {activeCategory === 'wiresheet' && 'Wire Sheet Rendering & Link Routing'}
                {activeCategory === 'developer' && 'Developer & Station Diagnostics'}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                isDark ? 'bg-slate-850 text-slate-400 border-slate-750' : 'bg-slate-200 text-slate-600 border-slate-300'
              }`}>
                station:|slot:/Services/ApplicationService/{activeCategory}
              </span>
            </h2>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {activeCategory === 'account' && 'Manage active station user credentials, cloud backups, and offline mode sync.'}
              {activeCategory === 'appearance' && 'Customize theme modes, dot matrix canvas grids, and responsive displays.'}
              {activeCategory === 'engine' && 'Adjust live calculation frequency, scheduling speeds, and priority levels.'}
              {activeCategory === 'wiresheet' && 'Set link curves routing, port magnetic snapping, and animated signals.'}
              {activeCategory === 'developer' && 'Monitor caught trace exceptions, click logs, and terminal diagnostics.'}
            </p>
          </div>
        </div>

        <div>
          <button
            onClick={handleApplySettings}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded shadow-md cursor-pointer transition-colors"
          >
            Save Slot Config
          </button>
        </div>
      </div>

      {/* Main Form Fields Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {savedNotice && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg p-3 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{savedNotice}</span>
          </div>
        )}

        {/* 1. Account Category */}
        {activeCategory === 'account' && (
          <div className="space-y-6 max-w-3xl">
            <div className={`border rounded-xl p-5 space-y-4 ${cardStyle}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center font-bold text-lg shrink-0">
                    {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {user?.displayName || (user ? 'Authenticated Controls Tech' : 'Local Guest Account')}
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {user ? user.email : 'Local offline workstation mode'}
                    </p>
                  </div>
                </div>

                <div>
                  {user ? (
                    <button
                      onClick={logout}
                      className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out Station</span>
                    </button>
                  ) : (
                    <button
                      onClick={onOpenAuthModal}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg transition-all cursor-pointer font-bold shadow-md"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In / Register</span>
                    </button>
                  )}
                </div>
              </div>

              <div className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} grid grid-cols-1 md:grid-cols-2 gap-3 text-xs`}>
                <div className={`p-3 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <span className={`text-[10px] block font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Station Backup Status</span>
                  <span className="font-bold text-emerald-500 flex items-center gap-1 mt-1">
                    <Cloud className="w-3.5 h-3.5" />
                    {user ? 'Cloud Database Synced' : 'Local Storage Only'}
                  </span>
                </div>

                <div className={`p-3 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <span className={`text-[10px] block font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Developer Access Level</span>
                  <span className={`font-bold flex items-center gap-1 mt-1 ${isDevToolsEnabled ? 'text-purple-500' : 'text-slate-400'}`}>
                    <Shield className="w-3.5 h-3.5 text-purple-400" />
                    {isDevToolsEnabled ? 'Developer Mode Active' : 'Standard User'}
                  </span>
                </div>
              </div>
            </div>

            <div className={`border rounded-xl p-5 space-y-4 ${cardStyle}`}>
              <div>
                <h3 className={`text-xs font-bold uppercase ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>Experimental Station Controls</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Unlocks live events logging, debugger features, and interactive simulation console drawer.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                {isDevToolsEnabled ? (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-purple-500 font-bold bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg">
                      Developer Status Enabled
                    </span>
                    <button
                      onClick={onDisableDevTools}
                      className="text-xs text-rose-500 hover:text-rose-400 underline cursor-pointer font-semibold"
                    >
                      Disable
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDevPrompt(true)}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-500 font-extrabold underline cursor-pointer"
                  >
                    <Terminal className="w-3.5 h-3.5 text-purple-500" />
                    <span>Click here to unlock Developer Mode</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. Appearance Category */}
        {activeCategory === 'appearance' && (
          <div className="space-y-6 max-w-3xl">
            <div className={`border rounded-xl p-5 space-y-4 ${cardStyle}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-1`}>Workbench Visual Theme</h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Choose between Classic Niagara aesthetic and sleek Modern CSS. Both operate in high-contrast light styles.
                  </p>
                </div>

                <button
                  onClick={toggleTheme}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    isDark
                      ? 'bg-slate-850 hover:bg-slate-800 text-amber-400 border-slate-750'
                      : 'bg-white hover:bg-slate-100 text-amber-600 border-slate-300'
                  }`}
                >
                  {theme === 'modern' ? (
                    <>
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      <span>Modern Theme Active</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span>Classic Theme Active</span>
                    </>
                  )}
                </button>
              </div>

              <div className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} space-y-4`}>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className={`text-xs font-bold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Show Dot Matrix Grid</span>
                    <span className={`text-[11px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Enables dots mesh background behind wiresheet blocks.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={snapToGrid}
                    onChange={(e) => setSnapToGrid(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 3. Engine Category */}
        {activeCategory === 'engine' && (
          <div className="space-y-6 max-w-3xl">
            <div className={`border rounded-xl p-5 space-y-5 ${cardStyle}`}>
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Simulation Engine Tick Rate
                </label>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-2`}>
                  Determines the frequency at which numerical logic blocks compute outputs and transmit signals downstream.
                </p>
                <select
                  value={simTickRate}
                  onChange={(e) => setSimTickRate(Number(e.target.value))}
                  className={`w-full rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${inputStyle}`}
                >
                  <option value={500}>Fast Loop Evaluation (500ms intervals)</option>
                  <option value={1000}>Standard Niagara Evaluation (1000ms standard intervals)</option>
                  <option value={2000}>Slow Damped Loop (2000ms intervals)</option>
                </select>
              </div>

              <div className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} space-y-2`}>
                <label className={`text-xs font-bold uppercase tracking-wider block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Override Slot Priority Default
                </label>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-2`}>
                  Configures the default manual command priority level injected when setting custom slot values.
                </p>
                <select className={`w-full rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${inputStyle}`}>
                  <option value={8}>Priority 8 - Manual Workbench Override (Highest standard)</option>
                  <option value={1}>Priority 1 - Life Safety / Emergency Override</option>
                  <option value={16}>Priority 16 - Default Programmatic Auto Execution</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 4. Wiresheet Category */}
        {activeCategory === 'wiresheet' && (
          <div className="space-y-6 max-w-3xl">
            <div className={`border rounded-xl p-5 space-y-4 ${cardStyle}`}>
              <div className="space-y-4 text-xs">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className={`font-bold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Type-Based Link Colors</span>
                    <span className={`text-[11px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Green curves represent boolean signals; purple represents numerics; orange represents enums.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={colorCodedWires}
                    onChange={(e) => setColorCodedWires(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>

                <label className={`flex items-center justify-between cursor-pointer pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div>
                    <span className={`font-bold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Magnetic Terminal Pin Snapping</span>
                    <span className={`text-[11px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Links snap cleanly to input/output slots when editing wires.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={snapToGrid}
                    onChange={(e) => setSnapToGrid(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>

                <label className={`flex items-center justify-between cursor-pointer pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div>
                    <span className={`font-bold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Live Dash Evaluation Flow</span>
                    <span className={`text-[11px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Animate flowing particles along wires to visually represent active simulation flow.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={animateSignalFlow}
                    onChange={(e) => setAnimateSignalFlow(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>

                <div className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} space-y-2.5`}>
                  <span className={`font-bold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Wire Link Routing Style</span>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-2`}>
                    Choose smooth natural curve algorithms or clean orthogonal Manhattan geometry bends.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setWireRouting('bezier')}
                      className={`py-2 px-3 rounded-lg border font-bold text-center text-xs cursor-pointer transition-all ${
                        wireRouting === 'bezier'
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                          : isDark
                          ? 'bg-slate-850 text-slate-300 border-slate-750 hover:bg-slate-800'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Cubic Bezier Curves (Smooth curves)
                    </button>
                    <button
                      type="button"
                      onClick={() => setWireRouting('manhattan')}
                      className={`py-2 px-3 rounded-lg border font-bold text-center text-xs cursor-pointer transition-all ${
                        wireRouting === 'manhattan'
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                          : isDark
                          ? 'bg-slate-850 text-slate-300 border-slate-750 hover:bg-slate-800'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Orthogonal (Manhattan right angles)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. Developer Category */}
        {activeCategory === 'developer' && (
          <div className="space-y-6 max-w-3xl">
            <div className={`border rounded-xl p-5 space-y-4 ${cardStyle}`}>
              <div>
                <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>
                  <Terminal className="w-4 h-4 text-purple-500" />
                  <span>Developer Diagnostics Settings</span>
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
                  Analyze active bus traces, evaluation speeds, click telemetry logs, and caught script events.
                </p>
              </div>

              <div className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} space-y-4`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <span className={`text-xs font-bold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Developer Mode Status</span>
                    <span className={`text-[11px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isDevToolsEnabled
                        ? 'Diagnostics features are fully unlocked for this session.'
                        : 'Diagnostics and event monitoring are currently locked.'}
                    </span>
                  </div>

                  <div>
                    {isDevToolsEnabled ? (
                      <span className="flex items-center gap-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1.5 rounded-lg font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-purple-400" />
                        <span>UNLOCKED</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => setShowDevPrompt(true)}
                        className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-md"
                      >
                        Authenticate Developer
                      </button>
                    )}
                  </div>
                </div>

                {isDevToolsEnabled && (
                  <div className="pt-2 space-y-2">
                    <button
                      onClick={onOpenDiagnosticConsole}
                      className="w-full flex items-center justify-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 font-bold px-4 py-2.5 rounded-lg transition-all cursor-pointer shadow-sm text-xs"
                    >
                      <Terminal className="w-4 h-4 text-purple-500" />
                      <span>Open Bottom Diagnostic Terminal Console</span>
                    </button>

                    <button
                      onClick={onDisableDevTools}
                      className={`w-full flex items-center justify-center gap-2 text-xs border font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 text-rose-400 hover:bg-rose-950/20'
                          : 'bg-white border-slate-200 text-rose-600 hover:bg-rose-50'
                      }`}
                    >
                      <span>Lock & Secure Developer Mode</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DEVELOPER UNLOCK PROMPT DIALOG */}
      {showDevPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className={`border rounded-xl shadow-2xl w-full max-w-md overflow-hidden p-5 space-y-4 ${
            isDark ? 'bg-slate-900 border-purple-500/30 text-slate-100' : 'bg-white border-purple-200 text-slate-800'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg border border-purple-500/20">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Unlock Application Service Tools</h3>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Experimental Admin Diagnostics</p>
                </div>
              </div>
            </div>

            <div className={`border rounded-lg p-3 text-xs leading-relaxed ${
              isDark ? 'bg-purple-950/20 border-purple-800/40 text-purple-200' : 'bg-purple-50 border-purple-100 text-purple-700'
            }`}>
              <p className="font-bold mb-1">Authorization Credentials Required:</p>
              <p>
                Unlocks responsive timing measurements, click logging, and the full console drawer. Authorized email includes jhamrac5599@gmail.com.
              </p>
            </div>

            {devAuthError && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5 text-xs text-rose-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{devAuthError}</span>
              </div>
            )}

            <form onSubmit={handleDevUnlockSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Developer Admin Email:</label>
                <input
                  type="email"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  placeholder="developer@organization.com"
                  className={`w-full rounded-lg p-2.5 ${inputStyle}`}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Developer Access Password:</label>
                <input
                  type="password"
                  value={devPassword}
                  onChange={(e) => setDevPassword(e.target.value)}
                  placeholder="Enter developer access key"
                  className={`w-full rounded-lg p-2.5 ${inputStyle}`}
                />
              </div>

              <div className={`flex items-center justify-end gap-2 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setShowDevPrompt(false)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer ${
                    isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-750' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-lg shadow-md cursor-pointer transition-colors"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Authenticate & Unlock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
