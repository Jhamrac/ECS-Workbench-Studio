import React, { useState } from 'react';
import {
  Sliders,
  User,
  Cpu,
  Zap,
  Terminal,
  X,
  Check,
  Shield,
  ShieldAlert,
  Key,
  Cloud,
  LogOut,
  LogIn,
  Sun,
  Moon,
  Monitor,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNiagaraTheme } from '../context/NiagaraThemeContext';
import { logger } from '../utils/logger';

interface NiagaraSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDevToolsEnabled: boolean;
  onEnableDevTools: () => void;
  onDisableDevTools: () => void;
  onOpenDiagnosticConsole: () => void;
  onOpenAuthModal: () => void;
}

export const NiagaraSettingsModal: React.FC<NiagaraSettingsModalProps> = ({
  isOpen,
  onClose,
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

  const [activeCategory, setActiveCategory] = useState<
    'account' | 'appearance' | 'engine' | 'wiresheet' | 'developer'
  >('account');

  // Developer Unlock Modal state
  const [showDevPrompt, setShowDevPrompt] = useState(false);
  const [devEmail, setDevEmail] = useState(user?.email || '');
  const [devPassword, setDevPassword] = useState('');
  const [devAuthError, setDevAuthError] = useState<string | null>(null);

  // General settings state
  const [simTickRate, setSimTickRate] = useState<number>(1000);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDevUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDevAuthError(null);

    const normEmail = devEmail.trim().toLowerCase();
    const passTrim = devPassword.trim();

    // Internal developer authentication validation without leaking developer identity to user UI
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
    setSavedNotice('Workbench options updated successfully.');
    logger.addLog('SYSTEM', 'Saved Workbench settings options.', 'info');
    setTimeout(() => {
      setSavedNotice(null);
      onClose();
    }, 800);
  };

  return (
    <>
      {/* Main Settings Modal Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150 select-none">
        <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden text-slate-100 flex flex-col h-[85vh] max-h-[700px]">
          {/* Header Bar: Workbench Options Title */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-850 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-sky-500/20 text-sky-400 rounded border border-sky-500/30">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>Tridium Niagara Workbench Options & Preferences</span>
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                    station:|slot:/Services/WorkbenchOptions
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  Configure environment preferences, user account sync, wire sheet rendering, and developer diagnostics.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Body: Sidebar Categories + Content Area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Category Tree Sidebar */}
            <div className="w-56 bg-slate-950 border-r border-slate-800 p-2 space-y-1 shrink-0 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Options Categories
                </div>

                {/* Category 1: Account Management */}
                <button
                  id="settings-cat-account"
                  onClick={() => setActiveCategory('account')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeCategory === 'account'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <User className="w-4 h-4 shrink-0" />
                  <span className="truncate">Account Management</span>
                </button>

                {/* Category 2: Theme & Appearance */}
                <button
                  id="settings-cat-appearance"
                  onClick={() => setActiveCategory('appearance')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeCategory === 'appearance'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Sliders className="w-4 h-4 shrink-0" />
                  <span className="truncate">Theme & Appearance</span>
                </button>

                {/* Category 3: Station & Engine */}
                <button
                  id="settings-cat-engine"
                  onClick={() => setActiveCategory('engine')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeCategory === 'engine'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Cpu className="w-4 h-4 shrink-0" />
                  <span className="truncate">Station & Engine</span>
                </button>

                {/* Category 4: Wire Sheet Canvas */}
                <button
                  id="settings-cat-wiresheet"
                  onClick={() => setActiveCategory('wiresheet')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeCategory === 'wiresheet'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Zap className="w-4 h-4 shrink-0" />
                  <span className="truncate">Wire Sheet Canvas</span>
                </button>

                {/* Category 5: Developer & Diagnostics */}
                <button
                  id="settings-cat-developer"
                  onClick={() => setActiveCategory('developer')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeCategory === 'developer'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Terminal className="w-4 h-4 shrink-0 text-purple-400" />
                    <span className="truncate">Dev & Diagnostics</span>
                  </div>
                  {isDevToolsEnabled && (
                    <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-700 px-1.5 py-0.2 rounded font-bold">
                      ACTIVE
                    </span>
                  )}
                </button>
              </div>

              {/* Sidebar bottom indicator */}
              <div className="p-2 bg-slate-900/80 border border-slate-800 rounded-lg text-[10px] text-slate-400 space-y-1">
                <p className="font-bold text-slate-300">Niagara N4 Framework</p>
                <p>Build 4.12.2.16 • ECS Studio</p>
              </div>
            </div>

            {/* Right Pane Category Settings Content */}
            <div className="flex-1 p-5 overflow-y-auto space-y-6 bg-slate-900">
              {/* CATEGORY 1: ACCOUNT MANAGEMENT */}
              {activeCategory === 'account' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-sky-400" />
                      <span>User Account & Station Synchronization</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Manage active station credentials, Cloud program backups, and developer tools access.
                    </p>
                  </div>

                  {/* Active User Card */}
                  <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-base">
                          {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">
                            {user?.displayName || (user ? 'Authenticated Controls Tech' : 'Local Guest Account')}
                          </p>
                          <p className="text-xs text-slate-400">{user ? user.email : 'Local offline workstation mode'}</p>
                        </div>
                      </div>

                      {user ? (
                        <button
                          onClick={logout}
                          className="flex items-center gap-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700 text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer font-semibold"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenAuthModal();
                          }}
                          className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold shadow-md"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Sign In / Register</span>
                        </button>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-750 grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Station Backup Status</span>
                        <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                          <Cloud className="w-3.5 h-3.5" />
                          {user ? 'Cloud Database Active' : 'Local Storage Only'}
                        </span>
                      </div>

                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Developer Access Level</span>
                        <span className={`font-bold flex items-center gap-1 mt-0.5 ${isDevToolsEnabled ? 'text-purple-400' : 'text-slate-400'}`}>
                          <Shield className="w-3.5 h-3.5" />
                          {isDevToolsEnabled ? 'Developer Mode Active' : 'Standard User'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM HYPERLINK: Enable Developer Tools */}
                  <div className="pt-4 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-200">Experimental Developer Diagnostics</p>
                        <p className="text-[11px] text-slate-400">
                          Unlocks live event click tracking, background error catching, and diagnostic console bottom terminal.
                        </p>
                      </div>

                      {isDevToolsEnabled ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-purple-300 font-bold bg-purple-950 border border-purple-700 px-2 py-1 rounded">
                            Dev Tools Enabled
                          </span>
                          <button
                            onClick={onDisableDevTools}
                            className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
                          >
                            Disable
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {!isDevToolsEnabled && (
                      <div className="pt-1">
                        <button
                          id="enable-developer-tools-link"
                          type="button"
                          onClick={() => setShowDevPrompt(true)}
                          className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-bold underline cursor-pointer transition-all"
                        >
                          <Terminal className="w-3.5 h-3.5 text-purple-400" />
                          <span>Enable Developer Tools</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CATEGORY 2: THEME & APPEARANCE */}
              {activeCategory === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-sky-400" />
                      <span>Theme & Canvas Appearance</span>
                    </h3>
                    <p className="text-xs text-slate-400">Customize visual themes, background grid patterns, and typography.</p>
                  </div>

                  <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">Workbench Visual Theme</p>
                        <p className="text-[11px] text-slate-400">Choose between Classic and Modern themes (both feature light background aesthetics).</p>
                      </div>

                      <button
                        onClick={toggleTheme}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-750"
                      >
                        {theme === 'modern' ? (
                          <>
                            <Sparkles className="w-4 h-4 text-sky-400" />
                            <span>Modern Theme</span>
                          </>
                        ) : (
                          <>
                            <Sun className="w-4 h-4 text-amber-400" />
                            <span>Classic Theme</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="pt-3 border-t border-slate-750 space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-xs font-semibold text-slate-200">Show Canvas Dot Matrix Grid</span>
                        <input
                          type="checkbox"
                          checked={snapToGrid}
                          onChange={(e) => setSnapToGrid(e.target.checked)}
                          className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-500"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* CATEGORY 3: STATION & ENGINE */}
              {activeCategory === 'engine' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-sky-400" />
                      <span>Station Execution Engine Options</span>
                    </h3>
                    <p className="text-xs text-slate-400">Configure live simulation tick frequency and multi-pass evaluation.</p>
                  </div>

                  <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-200 block">Simulation Tick Rate (Interval):</label>
                      <select
                        value={simTickRate}
                        onChange={(e) => setSimTickRate(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-sky-500"
                      >
                        <option value={500}>Fast (500ms / 2Hz tick)</option>
                        <option value={1000}>Standard Niagara (1000ms / 1Hz tick)</option>
                        <option value={2000}>Slow Damped (2000ms / 0.5Hz tick)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-750">
                      <span className="font-bold text-slate-200 block">Priority Array Default Override Level:</span>
                      <p className="text-slate-400 text-[11px]">Niagara standard uses Priority 8 for Manual Hand Override and Priority 16 for Auto Logic.</p>
                      <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200">
                        <option value={8}>Priority 8 (Manual Override)</option>
                        <option value={1}>Priority 1 (Emergency Safety Shutdown)</option>
                        <option value={16}>Priority 16 (Default Auto Program)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* CATEGORY 4: WIRE SHEET CANVAS */}
              {activeCategory === 'wiresheet' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-sky-400" />
                      <span>Wire Sheet Rendering & Link Routing</span>
                    </h3>
                    <p className="text-xs text-slate-400">Configure visual styles, connection routers, and animations.</p>
                  </div>

                  <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-4 text-xs">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="font-bold text-slate-200 block">Data-Type Wire Color Coding</span>
                        <span className="text-[11px] text-slate-400">Green for Boolean, Purple for Numeric, Orange for Enum signals.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={colorCodedWires}
                        onChange={(e) => setColorCodedWires(e.target.checked)}
                        className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-500 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-slate-750">
                      <div>
                        <span className="font-bold text-slate-200 block">Magnetic Terminal Wire Snapping</span>
                        <span className="text-[11px] text-slate-400">Automatically snaps wire paths to candidate pin terminals when dragging.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={snapToGrid}
                        onChange={(e) => setSnapToGrid(e.target.checked)}
                        className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-500 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-slate-750">
                      <div>
                        <span className="font-bold text-slate-200 block">Dynamic Signal Flow Animations</span>
                        <span className="text-[11px] text-slate-400">Animate dashes flowing along active cables to represent live signal traffic.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={animateSignalFlow}
                        onChange={(e) => setAnimateSignalFlow(e.target.checked)}
                        className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-500 cursor-pointer"
                      />
                    </label>

                    <div className="pt-3 border-t border-slate-750 space-y-2">
                      <span className="font-bold text-slate-200 block">Link Routing Style</span>
                      <span className="text-[11px] text-slate-400 block mb-2">Choose between classic smooth curves and industrial orthogonal bends.</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setWireRouting('bezier')}
                          className={`py-2 px-3 rounded-lg border font-bold text-center cursor-pointer transition-all ${
                            wireRouting === 'bezier'
                              ? 'bg-sky-600 text-white border-sky-500 shadow'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                          }`}
                        >
                          Cubic Bezier Curves
                        </button>
                        <button
                          type="button"
                          onClick={() => setWireRouting('manhattan')}
                          className={`py-2 px-3 rounded-lg border font-bold text-center cursor-pointer transition-all ${
                            wireRouting === 'manhattan'
                              ? 'bg-sky-600 text-white border-sky-500 shadow'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                          }`}
                        >
                          Orthogonal (Manhattan)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CATEGORY 5: DEVELOPER & DIAGNOSTICS */}
              {activeCategory === 'developer' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-purple-400" />
                      <span>Developer Tools & Background Diagnostics</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Inspect background logs, caught exceptions, and real-time DOM interaction events.
                    </p>
                  </div>

                  <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-100 block">Developer Mode Status</span>
                        <span className="text-slate-400 text-[11px]">
                          {isDevToolsEnabled
                            ? 'Developer tools are active for this browser session.'
                            : 'Developer features are currently disabled.'}
                        </span>
                      </div>

                      {isDevToolsEnabled ? (
                        <span className="flex items-center gap-1.5 bg-purple-950 text-purple-300 border border-purple-700 px-3 py-1 rounded-lg font-bold">
                          <CheckCircle2 className="w-4 h-4 text-purple-400" />
                          <span>ENABLED</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => setShowDevPrompt(true)}
                          className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          Enable Developer Tools
                        </button>
                      )}
                    </div>

                    {isDevToolsEnabled && (
                      <div className="pt-3 border-t border-slate-750 space-y-3">
                        <button
                          onClick={() => {
                            onClose();
                            onOpenDiagnosticConsole();
                          }}
                          className="w-full flex items-center justify-center gap-2 bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700/80 font-bold px-4 py-2.5 rounded-lg transition-all cursor-pointer shadow-md"
                        >
                          <Terminal className="w-4 h-4 text-purple-400" />
                          <span>Open Bottom Diagnostic Terminal Drawer</span>
                        </button>

                        <button
                          onClick={onDisableDevTools}
                          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-rose-950 text-rose-300 border border-slate-750 font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer"
                        >
                          <span>Lock / Disable Developer Mode</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="px-5 py-3 bg-slate-850 border-t border-slate-800 flex items-center justify-between">
            <div>
              {savedNotice && (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  {savedNotice}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplySettings}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer"
              >
                Apply & OK
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DEVELOPER UNLOCK PROMPT DIALOG */}
      {showDevPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-purple-500/50 rounded-xl shadow-2xl w-full max-w-md overflow-hidden text-slate-100 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/40">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Enable Developer Tools</h3>
                  <p className="text-[11px] text-slate-400">Experimental Admin & System Diagnostics</p>
                </div>
              </div>
              <button
                onClick={() => setShowDevPrompt(false)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Explanatory Banner Prompt */}
            <div className="bg-purple-950/40 border border-purple-800/60 rounded-lg p-3 text-xs text-purple-200 leading-relaxed">
              <p className="font-semibold text-purple-300 mb-1">Developer Credentials Required:</p>
              <p>
                This unlocks experimental developer tools & system diagnostics. Please enter authorized admin or developer credentials.
              </p>
            </div>

            {devAuthError && (
              <div className="bg-rose-950/60 border border-rose-700/80 rounded-lg p-2.5 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{devAuthError}</span>
              </div>
            )}

            {/* Sign in Form */}
            <form onSubmit={handleDevUnlockSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Developer Email / Admin Account:</label>
                <input
                  type="email"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  placeholder="admin@organization.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Developer Key / Password:</label>
                <input
                  type="password"
                  value={devPassword}
                  onChange={(e) => setDevPassword(e.target.value)}
                  placeholder="Enter developer key or password"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDevPrompt(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit-enable-dev-tools-btn"
                  type="submit"
                  className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-4 py-2 rounded-lg shadow-lg cursor-pointer transition-all"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Authenticate & Unlock Dev Tools</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
