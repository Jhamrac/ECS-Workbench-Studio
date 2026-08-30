import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Save,
  BookOpen,
  FileCode,
  FileText,
  Download,
  Upload,
  Share2,
  LayoutGrid,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FolderOpen,
  HelpCircle,
  Layers,
  Wrench,
  CheckCircle2,
  Menu,
  X,
  Sliders,
  Sun,
  Moon,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Search,
  Home,
  Monitor,
  Smartphone,
  Tablet,
  Grid,
  Zap,
  Cpu,
  Boxes,
  Cloud,
  User as UserIcon,
  Mail,
  Settings,
  MessageSquare,
  Radio,
  Activity,
  ShieldCheck,
  Terminal,
  Globe,
  FileSpreadsheet,
  Database,
  Undo2,
  Redo2,
  Scissors,
  Copy,
  Clipboard,
  Trash2,
  Wand2,
  PlusCircle,
  StepForward,
  SlidersHorizontal,
  Bot,
  Plus,
  Laptop,
} from 'lucide-react';
import { NIAGARA_TEMPLATES } from '../data/templates';
import { NiagaraProgram, PaletteItem } from '../types/niagara';
import { WORKBENCH_STUDIOS, WorkbenchStudio } from '../types/studios';
import { useNiagaraTheme } from '../context/NiagaraThemeContext';
import { useAuth } from '../context/AuthContext';
import { DeviceAspectInfo } from '../hooks/useDeviceAspect';
import { EcsLogo } from './EcsLogo';

// Tooltip Toolbar Icon Component
interface ToolbarIconProps {
  id?: string;
  icon: React.ReactNode;
  title: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  highlight?: 'green' | 'blue' | 'amber' | 'purple' | 'red';
  badge?: string | number;
}

const ToolbarIconButton: React.FC<ToolbarIconProps> = ({
  id,
  icon,
  title,
  shortcut,
  onClick,
  disabled = false,
  active = false,
  highlight,
  badge,
}) => {
  const { isDark } = useNiagaraTheme();
  const tooltipText = shortcut ? `${title} (${shortcut})` : title;

  return (
    <div className="relative group flex items-center justify-center">
      <button
        id={id}
        onClick={onClick}
        disabled={disabled}
        title={tooltipText}
        className={`p-1.5 rounded-md transition-all flex items-center justify-center relative cursor-pointer select-none ${
          disabled
            ? 'opacity-30 cursor-not-allowed text-slate-400 dark:text-slate-600'
            : active
            ? highlight === 'green'
              ? 'bg-emerald-600/20 text-emerald-500 dark:text-emerald-400 ring-1 ring-emerald-500/50 shadow-sm'
              : highlight === 'amber'
              ? 'bg-amber-500/20 text-amber-500 dark:text-amber-300 ring-1 ring-amber-500/50 shadow-sm'
              : 'bg-[#00529b]/20 text-[#00529b] dark:text-sky-400 ring-1 ring-sky-500/50 shadow-sm'
            : isDark
            ? 'text-slate-300 hover:text-white hover:bg-slate-800/80 active:bg-slate-700/80'
            : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200 active:bg-slate-300'
        }`}
      >
        <span className="w-4 h-4 flex items-center justify-center">{icon}</span>
        {badge !== undefined && (
          <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full px-1 min-w-[14px] text-center shadow">
            {badge}
          </span>
        )}
      </button>

      {/* Floating Micro-Tooltip */}
      <div className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 z-[100] px-2.5 py-1 bg-slate-950/95 dark:bg-slate-900/95 text-slate-100 text-[11px] rounded-md shadow-2xl border border-slate-700/80 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1.5 font-sans font-medium tracking-tight">
        <span>{title}</span>
        {shortcut && (
          <span className="bg-slate-800 dark:bg-slate-950 text-slate-300 px-1.5 py-0.5 rounded text-[9px] font-mono border border-slate-700">
            {shortcut}
          </span>
        )}
        {/* Little Caret Arrow */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-950/95 dark:bg-slate-900/95 rotate-45 border-l border-t border-slate-700/80" />
      </div>
    </div>
  );
};

// 1px Subtle Vertical Divider
const ToolbarDivider: React.FC = () => (
  <div className="w-[1px] h-4 bg-slate-300/80 dark:bg-slate-700/70 mx-1 shrink-0" />
);

interface NavbarProps {
  currentProgram: NiagaraProgram;
  onSelectTemplate: (template: NiagaraProgram) => void;
  isSimulating: boolean;
  onToggleSimulate: () => void;
  onResetSimulation: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onAutoLayout: () => void;
  activeView: 'home' | 'wiresheet' | 'guide' | 'soo' | 'troubleshoot';
  setActiveView: (view: 'home' | 'wiresheet' | 'guide' | 'soo' | 'troubleshoot') => void;
  activeStudioId?: string;
  onSelectStudio?: (studioId: string) => void;
  activeNetworkSubView?: string;
  onSelectNetworkSubView?: (subView: any) => void;
  activeReportSubView?: string;
  onSelectReportSubView?: (subView: any) => void;
  networkDeviceCount?: number;
  networkPacketCount?: number;
  networkHealthScore?: number;
  isNetworkDiscovering?: boolean;
  onRunNetworkDiscovery?: () => void;
  isNetworkCapturing?: boolean;
  onToggleNetworkCapture?: () => void;
  isPaletteOpen: boolean;
  onTogglePalette: () => void;
  isNavTreeOpen: boolean;
  onToggleNavTree: () => void;
  onExportGuide: () => void;
  onExportXml: () => void;
  onExportJson: () => void;
  onOpenPrompt: () => void;
  onOpenSummary?: () => void;
  onOpenSaveModal?: () => void;
  isInstallable?: boolean;
  onPromptInstall?: () => void;
  isOnline?: boolean;
  aspectInfo: DeviceAspectInfo;
  onOpenAuthModal?: () => void;
  onOpenAiChat?: () => void;
  onToggleTerminal?: () => void;
  isTerminalOpen?: boolean;
  onOpenSettings?: () => void;
  onOpenNetworkAiAssist?: () => void;
  onOpenDesktopInstaller?: () => void;
  lastSyncedAt?: string | null;

  // New Global & Context Toolbar Props
  canGoBack?: boolean;
  canGoForward?: boolean;
  onNavigateBack?: () => void;
  onNavigateForward?: () => void;
  onRefresh?: () => void;

  // WireSheet Context Actions
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  hasSelectedBlock?: boolean;
  hasSelectedLink?: boolean;
  hasClipboard?: boolean;
  onStepTick?: () => void;
  onOpenOverride?: () => void;
  onQuickAddBlock?: (type: string) => void;
  onImportFile?: (file: File) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProgram,
  onSelectTemplate,
  isSimulating,
  onToggleSimulate,
  onResetSimulation,
  zoom,
  onZoomIn,
  onZoomOut,
  onFitView,
  onAutoLayout,
  activeView,
  setActiveView,
  activeStudioId = 'wiresheet',
  onSelectStudio,
  activeNetworkSubView = 'discovery',
  activeReportSubView = 'saved_reports',
  onSelectReportSubView,
  onSelectNetworkSubView,
  networkDeviceCount = 10,
  networkPacketCount = 124,
  networkHealthScore = 98,
  isNetworkDiscovering = false,
  onRunNetworkDiscovery,
  isNetworkCapturing = true,
  onToggleNetworkCapture,
  isPaletteOpen,
  onTogglePalette,
  isNavTreeOpen,
  onToggleNavTree,
  onExportGuide,
  onExportXml,
  onExportJson,
  onOpenPrompt,
  onOpenSummary,
  onOpenSaveModal,
  isInstallable = false,
  onPromptInstall,
  isOnline = true,
  aspectInfo,
  onOpenAuthModal,
  onOpenAiChat,
  onToggleTerminal,
  isTerminalOpen = true,
  onOpenSettings,
  onOpenNetworkAiAssist,
  onOpenDesktopInstaller,
  lastSyncedAt,

  // Global navigation & refresh
  canGoBack = false,
  canGoForward = false,
  onNavigateBack,
  onNavigateForward,
  onRefresh,

  // WireSheet Operations
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onDelete,
  hasSelectedBlock = false,
  hasSelectedLink = false,
  hasClipboard = false,
  onStepTick,
  onOpenOverride,
  onQuickAddBlock,
  onImportFile,
}) => {
  const { theme, toggleTheme, isDark } = useNiagaraTheme();
  const { user, isSyncing } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger file import dialog
  const handleTriggerImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportFile) {
      onImportFile(file);
    }
    // reset input so same file can be selected again
    e.target.value = '';
  };

  const isWireSheetContext = activeStudioId === 'wiresheet' && activeView === 'wiresheet';
  const isNetworkContext = activeStudioId === 'network';
  const isReportContext = activeStudioId === 'report';

  return (
    <header
      id="niagara-workbench-header"
      className={`border-b select-none shadow-md z-30 transition-colors ${
        isDark
          ? 'bg-[#07152b] text-slate-100 border-[#0f2d59]'
          : 'bg-[#f8fafc] text-slate-800 border-[#cbd5e1]'
      }`}
    >
      {/* Hidden File Input for JSON / Station Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".json,.xml,.bog"
        className="hidden"
      />

      {/* Level 1: Workbench Studio Brand & Status Bar */}
      <div
        className={`flex items-center justify-between px-3 py-1.5 text-xs border-b ${
          isDark
            ? 'bg-[#040e1f] border-[#0c2344] text-slate-300'
            : 'bg-[#004e8c] border-[#003d6e] text-white'
        }`}
      >
        {/* Left Brand */}
        <div className="flex items-center gap-2.5">
          <EcsLogo variant="circle" className="w-6 h-6 shrink-0 drop-shadow-sm" isDark={isDark} />
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
              <span>ECS Workbench Studio</span>
            </h1>
          </div>

          {/* Clean Offline/Online Status */}
          <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono pl-2 border-l border-white/20">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#44b33c]' : 'bg-amber-400'}`} />
            <span className="font-semibold text-white/90">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        {/* Right side global actions */}
        <div className="flex items-center gap-2">
          {/* Install Desktop App */}
          {isInstallable && onPromptInstall && (
            <button
              id="pwa-install-app-btn"
              onClick={onPromptInstall}
              title="Install ECS Workbench as a standalone desktop app"
              className="hidden sm:flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-2.5 py-1 rounded shadow-sm text-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          {/* PowerShell & Command Terminal Toggle */}
          {onToggleTerminal && (
            <button
              id="header-powershell-terminal-btn"
              onClick={onToggleTerminal}
              title={isTerminalOpen ? 'Hide Bottom PowerShell Terminal' : 'Open Bottom PowerShell Terminal'}
              className={`px-2.5 py-1 rounded border text-xs flex items-center gap-1.5 font-bold cursor-pointer transition-all shadow-sm ${
                isTerminalOpen
                  ? 'bg-slate-800 hover:bg-slate-700 text-sky-300 border-sky-600/70'
                  : isDark
                  ? 'bg-[#081f3e] hover:bg-[#0c2b54] text-slate-200 border-[#183a6f]'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline text-[11px]">Terminal</span>
            </button>
          )}

          {/* Studio Copilot AI Drawer */}
          {onOpenAiChat && (
            <button
              id="header-ai-chat-btn"
              onClick={onOpenAiChat}
              title="Open Studio Copilot - Intelligent Controls & Automation Assistant"
              className={`px-2.5 py-1 rounded border text-xs flex items-center gap-1.5 font-bold cursor-pointer transition-all shadow-sm ${
                isDark
                  ? 'bg-gradient-to-r from-sky-900 to-indigo-950 hover:from-sky-800 hover:to-indigo-900 text-sky-200 border-sky-700/60'
                  : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white border-sky-400'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-300 fill-sky-300/30" />
              <span className="hidden sm:inline text-[11px]">Studio Copilot</span>
            </button>
          )}

          {/* Native Desktop App & Automated Build Hub */}
          {onOpenDesktopInstaller && (
            <button
              id="header-desktop-installer-btn"
              onClick={onOpenDesktopInstaller}
              title="Native Windows Desktop App & Automated GitHub Releases"
              className={`px-2.5 py-1 rounded border text-xs flex items-center gap-1.5 font-bold cursor-pointer transition-all shadow-sm ${
                isDark
                  ? 'bg-slate-800/80 hover:bg-slate-700 text-sky-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              <Laptop className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden md:inline text-[11px]">Desktop App</span>
            </button>
          )}

          {/* Cloud Sync & User Account Button */}
          {onOpenAuthModal && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                id="header-cloud-account-btn"
                onClick={onOpenAuthModal}
                title={user ? `Logged in as ${user.email}` : 'Sign in to sync your station programs across devices'}
                className={`px-2.5 py-1 rounded border text-xs flex items-center gap-1.5 font-bold cursor-pointer transition-all ${
                  user
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-sm'
                    : 'bg-sky-600 hover:bg-sky-500 text-white border-sky-400 shadow-sm'
                }`}
              >
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                ) : user ? (
                  <Cloud className="w-3.5 h-3.5 text-emerald-200 fill-emerald-200/30" />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-sky-200" />
                )}
                <span className="hidden sm:inline text-[11px]">
                  {user ? user.displayName?.split(' ')[0] || 'Cloud Active' : 'Account'}
                </span>
              </button>

              {user && lastSyncedAt && (
                <span
                  title={`Database last synchronized at ${lastSyncedAt}`}
                  className="hidden md:inline-flex items-center gap-1 bg-emerald-950/40 border border-emerald-800/40 rounded px-2 py-1 text-[10px] font-mono text-emerald-400 font-semibold shrink-0"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>Synced: {lastSyncedAt}</span>
                </span>
              )}
            </div>
          )}

          {/* Mobile menu toggle */}
          {aspectInfo.isMobile && (
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-1 rounded border cursor-pointer ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-[#00386b] border-white/30 text-white'
              }`}
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Level 2: Authentic Icon-Only Toolbar with Micro-Dividers & Interactive Tooltips */}
      <div
        className={`hidden sm:flex items-center px-3 py-1.5 border-b font-mono text-xs select-none gap-0.5 relative z-20 ${
          isDark ? 'bg-[#051326] border-[#0e274b]' : 'bg-[#f1f5f9] border-[#cbd5e1]'
        }`}
      >
        {/* ============================================================ */}
        {/* 1. ALWAYS VISIBLE GROUP: Back, Forward, Refresh, Home, AI Assist */}
        {/* ============================================================ */}
        <ToolbarIconButton
          id="toolbar-back-btn"
          icon={<ArrowLeft className="w-3.5 h-3.5" />}
          title="Back"
          shortcut="Alt+Left"
          onClick={onNavigateBack || (() => {})}
          disabled={!canGoBack}
        />

        <ToolbarIconButton
          id="toolbar-forward-btn"
          icon={<ArrowRight className="w-3.5 h-3.5" />}
          title="Forward"
          shortcut="Alt+Right"
          onClick={onNavigateForward || (() => {})}
          disabled={!canGoForward}
        />

        <ToolbarIconButton
          id="toolbar-refresh-btn"
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          title="Refresh View & Sync"
          shortcut="F5"
          onClick={onRefresh || onFitView}
        />

        <ToolbarIconButton
          id="toolbar-home-btn"
          icon={<Home className="w-3.5 h-3.5" />}
          title="Home Starting View"
          shortcut="Alt+H"
          active={activeView === 'home'}
          onClick={() => {
            if (onSelectStudio) onSelectStudio('wiresheet');
            setActiveView('home');
          }}
        />

        <ToolbarIconButton
          id="toolbar-ai-assist-btn"
          icon={<Sparkles className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" />}
          title="AI Controls Assist"
          shortcut="Ctrl+K"
          highlight="blue"
          onClick={onOpenPrompt}
        />

        {/* ============================================================ */}
        {/* 2. CONTEXT-AWARE: WIRE SHEET / LOGIC STUDIO TOOLS */}
        {/* ============================================================ */}
        {isWireSheetContext && (
          <>
            <ToolbarDivider />

            {/* Import / Open */}
            <ToolbarIconButton
              id="toolbar-import-btn"
              icon={<FolderOpen className="w-3.5 h-3.5 text-amber-500" />}
              title="Import / Open (JSON / Station)"
              shortcut="Ctrl+O"
              onClick={handleTriggerImport}
            />

            {/* Export */}
            <div className="relative">
              <ToolbarIconButton
                id="toolbar-export-btn"
                icon={<Upload className="w-3.5 h-3.5 text-sky-500" />}
                title="Export WireSheet / Niagara JSON"
                shortcut="Ctrl+S"
                onClick={onExportJson}
              />
            </div>

            <ToolbarDivider />

            {/* Undo / Redo */}
            <ToolbarIconButton
              id="toolbar-undo-btn"
              icon={<Undo2 className="w-3.5 h-3.5" />}
              title="Undo"
              shortcut="Ctrl+Z"
              onClick={onUndo || (() => {})}
              disabled={!canUndo}
            />

            <ToolbarIconButton
              id="toolbar-redo-btn"
              icon={<Redo2 className="w-3.5 h-3.5" />}
              title="Redo"
              shortcut="Ctrl+Y"
              onClick={onRedo || (() => {})}
              disabled={!canRedo}
            />

            <ToolbarDivider />

            {/* Cut / Copy / Paste */}
            <ToolbarIconButton
              id="toolbar-cut-btn"
              icon={<Scissors className="w-3.5 h-3.5" />}
              title="Cut Block"
              shortcut="Ctrl+X"
              onClick={onCut || (() => {})}
              disabled={!hasSelectedBlock}
            />

            <ToolbarIconButton
              id="toolbar-copy-btn"
              icon={<Copy className="w-3.5 h-3.5" />}
              title="Copy Block"
              shortcut="Ctrl+C"
              onClick={onCopy || (() => {})}
              disabled={!hasSelectedBlock}
            />

            <ToolbarIconButton
              id="toolbar-paste-btn"
              icon={<Clipboard className="w-3.5 h-3.5" />}
              title="Paste Block"
              shortcut="Ctrl+V"
              onClick={onPaste || (() => {})}
              disabled={!hasClipboard}
            />

            {/* Delete */}
            <ToolbarIconButton
              id="toolbar-delete-btn"
              icon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
              title="Delete Selected"
              shortcut="Del"
              onClick={onDelete || (() => {})}
              disabled={!hasSelectedBlock && !hasSelectedLink}
            />

            <ToolbarDivider />

            {/* Auto-Arrange / Tidy Lines */}
            <ToolbarIconButton
              id="toolbar-auto-arrange-btn"
              icon={<Wand2 className="w-3.5 h-3.5 text-sky-400" />}
              title="Auto-Arrange & Tidy Lines"
              shortcut="Ctrl+Shift+L"
              onClick={onAutoLayout}
            />

            {/* Quick Add Component Dropdown */}
            <div className="relative">
              <ToolbarIconButton
                id="toolbar-quick-add-btn"
                icon={<PlusCircle className="w-3.5 h-3.5 text-emerald-400" />}
                title="Quick Add Component"
                shortcut="Alt+A"
                onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
                active={isQuickAddOpen}
              />

              {/* Quick Add Dropdown Popover */}
              {isQuickAddOpen && (
                <div
                  className={`absolute top-full mt-1.5 left-0 z-50 w-56 rounded-lg shadow-2xl border p-1.5 animate-in fade-in slide-in-from-top-2 duration-150 ${
                    isDark
                      ? 'bg-[#08182f] border-[#183a6f] text-slate-100 shadow-sky-950/80'
                      : 'bg-white border-slate-300 text-slate-800 shadow-xl'
                  }`}
                >
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/50 mb-1">
                    Quick Insert Component
                  </div>

                  <div className="space-y-0.5">
                    {[
                      { type: 'And', label: 'Boolean AND Gate', cat: 'Logic' },
                      { type: 'Or', label: 'Boolean OR Gate', cat: 'Logic' },
                      { type: 'Not', label: 'Boolean NOT Inverter', cat: 'Logic' },
                      { type: 'NumericWritable', label: 'Numeric Setpoint Writable', cat: 'Points' },
                      { type: 'BooleanWritable', label: 'Boolean Command Writable', cat: 'Points' },
                      { type: 'LoopPoint', label: 'PID Loop Controller', cat: 'Control' },
                      { type: 'Ramp', label: 'Numeric Ramp Generator', cat: 'Util' },
                      { type: 'Add', label: 'Math Add Block', cat: 'Math' },
                      { type: 'Multiply', label: 'Math Multiply Block', cat: 'Math' },
                      { type: 'LeadLagCycle', label: 'Lead/Lag Staging', cat: 'Control' },
                      { type: 'OneShot', label: 'Pulse Trigger / OneShot', cat: 'Util' },
                    ].map((item) => (
                      <button
                        key={item.type}
                        onClick={() => {
                          if (onQuickAddBlock) onQuickAddBlock(item.type);
                          setIsQuickAddOpen(false);
                        }}
                        className={`w-full px-2 py-1.5 rounded text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                          isDark
                            ? 'hover:bg-sky-600/20 hover:text-sky-300 text-slate-200'
                            : 'hover:bg-sky-50 hover:text-sky-800 text-slate-700'
                        }`}
                      >
                        <span className="truncate">{item.label}</span>
                        <span className="text-[10px] font-mono text-slate-400 ml-2">
                          {item.cat}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <ToolbarDivider />

            {/* Live Simulation Run/Pause */}
            <ToolbarIconButton
              id="toolbar-sim-play-pause-btn"
              icon={
                isSimulating ? (
                  <Pause className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-slate-400" />
                )
              }
              title={isSimulating ? 'Pause Live Simulation' : 'Run Live Simulation'}
              shortcut="Space"
              highlight="green"
              active={isSimulating}
              onClick={onToggleSimulate}
            />

            {/* Step Tick */}
            <ToolbarIconButton
              id="toolbar-step-tick-btn"
              icon={<StepForward className="w-3.5 h-3.5 text-amber-400" />}
              title="Step Tick (Advance 1 Cycle)"
              shortcut="Ctrl+."
              onClick={onStepTick || (() => {})}
            />

            {/* Override / Force Point */}
            <ToolbarIconButton
              id="toolbar-override-point-btn"
              icon={<Zap className="w-3.5 h-3.5 text-amber-400" />}
              title="Override / Force Point (16-Level Priority)"
              shortcut="Ctrl+E"
              onClick={onOpenOverride || (() => {})}
            />
          </>
        )}

        {/* ============================================================ */}
        {/* 3. CONTEXT-AWARE: NETWORK STUDIO TOOLS */}
        {/* ============================================================ */}
        {isNetworkContext && (
          <>
            <ToolbarDivider />

            <ToolbarIconButton
              id="toolbar-network-discovery-btn"
              icon={<Radio className={`w-3.5 h-3.5 ${isNetworkDiscovering ? 'animate-pulse text-sky-400' : 'text-sky-400'}`} />}
              title="Run Device Discovery Scan"
              shortcut="Ctrl+D"
              active={isNetworkDiscovering}
              highlight="blue"
              onClick={onRunNetworkDiscovery || (() => {})}
            />

            <ToolbarIconButton
              id="toolbar-network-capture-btn"
              icon={<Activity className={`w-3.5 h-3.5 ${isNetworkCapturing ? 'text-amber-400' : 'text-slate-400'}`} />}
              title={isNetworkCapturing ? 'Pause Packet Sniffer' : 'Start Packet Sniffer'}
              shortcut="Ctrl+P"
              active={isNetworkCapturing}
              highlight="amber"
              onClick={onToggleNetworkCapture || (() => {})}
            />

            <ToolbarIconButton
              id="toolbar-network-diagnostics-btn"
              icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
              title="Health & Packet Diagnostics"
              onClick={() => {
                if (onSelectNetworkSubView) onSelectNetworkSubView('health_diagnostics');
              }}
              active={activeNetworkSubView === 'health_diagnostics'}
            />

            <ToolbarIconButton
              id="toolbar-network-terminal-btn"
              icon={<Terminal className="w-3.5 h-3.5 text-indigo-400" />}
              title="RS-485 Serial Terminal Console"
              onClick={() => {
                if (onSelectNetworkSubView) onSelectNetworkSubView('serial_terminal');
              }}
              active={activeNetworkSubView === 'serial_terminal'}
            />
          </>
        )}

        {/* ============================================================ */}
        {/* 4. CONTEXT-AWARE: REPORT SERVICE TOOLS */}
        {/* ============================================================ */}
        {isReportContext && (
          <>
            <ToolbarDivider />

            <ToolbarIconButton
              id="toolbar-report-new-btn"
              icon={<FileText className="w-3.5 h-3.5 text-sky-400" />}
              title="New Site Audit Report"
              shortcut="Ctrl+N"
              onClick={() => {
                if (onSelectReportSubView) onSelectReportSubView('site_audit_builder');
              }}
              active={activeReportSubView === 'site_audit_builder'}
            />

            <ToolbarIconButton
              id="toolbar-report-export-btn"
              icon={<Download className="w-3.5 h-3.5 text-emerald-400" />}
              title="Export Report (PDF / CSV)"
              shortcut="Ctrl+E"
              onClick={onExportGuide}
            />
          </>
        )}
      </div>

      {/* Mobile Slide-down Options Drawer */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-[#040e1f] text-slate-100 border-b border-slate-800 p-4 space-y-4 font-sans shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-top duration-200">
          
          {/* Mobile Studio Switcher */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              Active Studio Environment
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (onSelectStudio) onSelectStudio('wiresheet');
                  setActiveView('wiresheet');
                  setIsMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  activeStudioId === 'wiresheet'
                    ? 'bg-[#00529b] text-white border-sky-400 shadow-sm'
                    : 'bg-[#0a172e] border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4 text-sky-400" />
                <span>Logic Studio</span>
              </button>
              <button
                onClick={() => {
                  if (onSelectStudio) onSelectStudio('network');
                  setIsMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  activeStudioId === 'network'
                    ? 'bg-[#00529b] text-white border-sky-400 shadow-sm'
                    : 'bg-[#0a172e] border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <Globe className="w-4 h-4 text-[#44b33c]" />
                <span>Network Studio</span>
              </button>
              <button
                onClick={() => {
                  if (onSelectStudio) onSelectStudio('report');
                  setIsMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  activeStudioId === 'report'
                    ? 'bg-[#00529b] text-white border-sky-400 shadow-sm'
                    : 'bg-[#0a172e] border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Report Service</span>
              </button>
              <button
                onClick={() => {
                  if (onSelectStudio) onSelectStudio('application');
                  setIsMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  activeStudioId === 'application'
                    ? 'bg-[#00529b] text-white border-sky-400 shadow-sm'
                    : 'bg-[#0a172e] border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4 text-purple-400" />
                <span>Application Studio</span>
              </button>
            </div>
          </div>

          {/* System Utilities */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              System Utilities
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (onOpenAuthModal) onOpenAuthModal();
                  setIsMobileMenuOpen(false);
                }}
                className={`p-2 rounded-lg text-xs font-bold flex items-center gap-2 bg-[#0a172e] border border-slate-800 cursor-pointer ${
                  user ? 'text-emerald-400 border-emerald-800/60' : 'text-slate-300'
                }`}
              >
                <Cloud className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">{user ? 'My Cloud Station' : 'Login / Cloud Sync'}</span>
              </button>

              <button
                onClick={() => {
                  if (onOpenSettings) onOpenSettings();
                  setIsMobileMenuOpen(false);
                }}
                className="p-2 rounded-lg text-xs font-bold flex items-center gap-2 bg-[#0a172e] border border-slate-800 text-slate-300 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Preferences</span>
              </button>

              <button
                onClick={() => {
                  toggleTheme();
                }}
                className="p-2 rounded-lg text-xs font-bold flex items-center gap-2 bg-[#0a172e] border border-slate-800 text-slate-300 cursor-pointer"
              >
                {theme === 'modern' ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Modern Theme</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Classic Theme</span>
                  </>
                )}
              </button>

              {isInstallable && onPromptInstall ? (
                <button
                  onClick={() => {
                    onPromptInstall();
                    setIsMobileMenuOpen(false);
                  }}
                  className="p-2 rounded-lg text-xs font-bold flex items-center gap-2 bg-sky-500 text-slate-950 border border-sky-400 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span>Install App</span>
                </button>
              ) : (
                <div className="p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-[#0a172e]/50 border border-slate-800/40 text-slate-400">
                  <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="truncate">{isOnline ? 'Online Engine' : 'Offline Mode'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
