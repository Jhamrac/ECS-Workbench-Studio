import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Download,
  Github,
  Zap,
  CheckCircle,
  Terminal,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Laptop,
  Globe,
  Settings,
  ArrowRight,
  Info,
  Package,
} from 'lucide-react';
import { useNiagaraTheme } from '../context/NiagaraThemeContext';

interface DesktopAppInstallerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopAppInstallerModal: React.FC<DesktopAppInstallerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isDark } = useNiagaraTheme();
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [appInfo, setAppInfo] = useState<{ isDesktop: boolean; version: string; platform: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'github' | 'powershell'>('overview');

  useEffect(() => {
    // Check if running inside Electron desktop container
    if ((window as any).electronAPI) {
      (window as any).electronAPI.getAppInfo().then((info: any) => {
        setAppInfo(info);
      }).catch(() => {
        setAppInfo({ isDesktop: false, version: '1.0.0', platform: 'web' });
      });
    } else {
      setAppInfo({ isDesktop: false, version: '1.0.0', platform: 'web' });
    }
  }, []);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(label);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden font-sans flex flex-col max-h-[90vh] ${
          isDark ? 'bg-[#0f172a] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base font-mono flex items-center gap-2">
                <span>Native Windows Desktop App & Automated Build Hub</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                    appInfo?.isDesktop
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  }`}
                >
                  {appInfo?.isDesktop ? 'DESKTOP APP ACTIVE' : 'WEB PREVIEW MODE'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Automated Electron + GitHub Actions Build Pipeline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className={`flex border-b px-5 shrink-0 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-100/50'}`}>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 font-mono text-xs font-bold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'overview'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            How It Works (Zero Manual Effort)
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`px-4 py-2.5 font-mono text-xs font-bold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'github'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            GitHub Automated Build Setup
          </button>
          <button
            onClick={() => setActiveTab('powershell')}
            className={`px-4 py-2.5 font-mono text-xs font-bold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'powershell'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Native PowerShell Engine
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-5 font-sans flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs font-mono">
              {/* Highlight Card */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  isDark ? 'bg-sky-950/40 border-sky-800/60 text-sky-200' : 'bg-sky-50 border-sky-200 text-sky-900'
                }`}
              >
                <Zap className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div className="space-y-1 leading-relaxed">
                  <h4 className="font-bold text-sm">You Prompt in AI Studio — GitHub Builds Your Windows App!</h4>
                  <p className="text-[11px] text-slate-300">
                    You keep using AI Studio just like you always have! Whenever you ask for new features, bug fixes, or UI changes, your project on GitHub automatically triggers a <strong>cloud Virtual Machine</strong> that compiles a fresh <code>WorkbenchStudio-Installer.exe</code> installer for your computer.
                  </p>
                </div>
              </div>

              {/* 3 Step Automated Workflow */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className={`p-3.5 rounded-xl border space-y-2 ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 font-bold text-sky-400">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-500/30 text-center text-xs leading-5">1</span>
                    <span>Edit in AI Studio</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Ask for any features or changes in conversational chat. Changes render live in the web preview instantly.
                  </p>
                </div>

                <div className={`p-3.5 rounded-xl border space-y-2 ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-center text-xs leading-5">2</span>
                    <span>Automated GitHub CI/CD</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    GitHub Actions spins up a Windows cloud runner, compiles Electron, and attaches the <code>.exe</code> installer to GitHub Releases.
                  </p>
                </div>

                <div className={`p-3.5 rounded-xl border space-y-2 ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 font-bold text-amber-400">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 text-center text-xs leading-5">3</span>
                    <span>Silent Auto-Update</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    When you open the installed Desktop App on your PC, <code>electron-updater</code> silently applies the newest version in seconds!
                  </p>
                </div>
              </div>

              {/* Benefits Checklist */}
              <div className={`p-4 rounded-xl border space-y-2 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="font-bold text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Key Advantages of Native Desktop Electron Build</span>
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Real Windows PowerShell & CMD (`ipconfig /all`)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Direct TCP socket connections to local JACEs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Zero browser CORS or PNA security blocks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Lists your actual PC network adapters & VPN</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'github' && (
            <div className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-200">How to Enable GitHub Automated Build & Releases</h4>
                <p className="text-[11px] text-slate-400">
                  Follow these 2 simple steps once to connect your GitHub repository:
                </p>
              </div>

              <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2 font-bold text-sky-400">
                  <Package className="w-4 h-4" />
                  <span>Step 1: Export Project to GitHub</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  In AI Studio, click <strong>Settings</strong> (top right) → <strong>Export to GitHub</strong>. Enter your GitHub repository name (e.g. <code>niagara-workbench-studio</code>).
                </p>

                <div className="pt-2 border-t dark:border-slate-800 flex items-center gap-2 font-bold text-emerald-400">
                  <Github className="w-4 h-4" />
                  <span>Step 2: GitHub Actions Runs Automatically!</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  We created <code>.github/workflows/build-installer.yml</code> in your repository. GitHub automatically builds <code>WorkbenchStudio-Installer.exe</code> and posts it under <strong>Releases</strong>.
                </p>
              </div>

              {/* Package.json & Command Cheat Sheet */}
              <div className={`p-3.5 rounded-xl border space-y-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300">Manual Local Build Command (Optional)</span>
                  <button
                    onClick={() => handleCopy('npm run dist', 'cmd1')}
                    className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCmd === 'cmd1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd === 'cmd1' ? 'Copied' : 'Copy Command'}</span>
                  </button>
                </div>
                <code className="block p-2 rounded bg-black/60 text-emerald-400 text-[11px] font-mono">
                  npm run dist
                </code>
                <p className="text-[10px] text-slate-400">
                  Compiles local Windows <code>.exe</code> installer inside <code>dist-electron/</code> folder.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'powershell' && (
            <div className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-200">Native Windows PowerShell Integration</h4>
                <p className="text-[11px] text-slate-400">
                  When running in the installed Electron Desktop App, commands in the Terminal Studio execute directly on your PC's native PowerShell engine!
                </p>
              </div>

              <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <Terminal className="w-4 h-4" />
                  <span>Native OS IPC Bridge (`electronAPI.execPowerShell`)</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Commands like <code>Get-NetIPAddress</code>, <code>Test-NetConnection 10.10.0.2 -Port 80</code>, <code>ipconfig /all</code>, and BACnet UDP socket queries bind directly to your PC's hardware network adapters.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between shrink-0 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Info className="w-4 h-4 text-sky-400 shrink-0" />
            <span>AI Studio web preview continues working normally for chat edits!</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold cursor-pointer"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
