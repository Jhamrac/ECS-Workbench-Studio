import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Folder,
  FolderOpen,
  FolderPlus,
  Save,
  Plus,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  FileCode,
  Layers,
  Trash2,
  Edit2,
  Copy,
  Download,
  MoreVertical,
  X,
  GripHorizontal,
  Package,
  Cpu,
  Sliders,
  Check,
  Sparkles,
  ArrowRight,
  Info,
  PanelLeftClose,
  PanelLeftOpen,
  Database,
  Globe,
  BookOpen,
  Terminal,
  Activity,
  ShieldCheck,
  FileSpreadsheet,
  Radio,
  User,
  ClipboardList,
  FileText,
  Building2,
  Server,
  Zap,
} from 'lucide-react';

import { NiagaraProgram, PaletteItem } from '../types/niagara';
import { LibraryFolder, SavedLogicItem } from '../types/library';
import { ReportCustomerFolder, SiteAuditReport } from '../types/reports';
import { NIAGARA_PALETTE_ITEMS } from '../data/paletteDefinitions';
import { NIAGARA_TEMPLATES } from '../data/templates';
import { useNiagaraTheme } from '../context/NiagaraThemeContext';

interface NiagaraLeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  isMobile: boolean;
  currentProgram: NiagaraProgram;
  folders: LibraryFolder[];
  items: SavedLogicItem[];
  onSelectLogicItem: (item: SavedLogicItem) => void;
  onSelectTemplate?: (tmpl: NiagaraProgram) => void;
  onCreateFolder: (name: string, parentId?: string | null) => LibraryFolder;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onDuplicateLogicItem: (itemId: string) => void;
  onRenameLogicItem: (itemId: string, newTitle: string) => void;
  onDeleteLogicItem: (itemId: string) => void;
  onOpenSaveModal: () => void;
  onAddBlock: (item: PaletteItem) => void;
  onSelectBlockInfo?: (item: PaletteItem) => void;

  // New navigation states
  activeStudioId: string;
  onSelectStudio: (studioId: string) => void;
  activeView: 'wiresheet' | 'guide' | 'soo' | 'troubleshoot';
  onSelectView: (view: 'wiresheet' | 'guide' | 'soo' | 'troubleshoot') => void;
  activeNiagaraSubView?: string;
  onSelectNiagaraSubView?: (subView: any) => void;
  activeNetworkSubView: string;
  onSelectNetworkSubView: (subView: any) => void;
  activeAppSubView?: string;
  onSelectAppSubView?: (subView: string) => void;
  activeReportSubView?: string;
  onSelectReportSubView?: (subView: any) => void;
  customerFolders?: ReportCustomerFolder[];
  savedReports?: SiteAuditReport[];
  activeReportId?: string;
  onSelectReport?: (reportId: string) => void;
  onDeleteReport?: (reportId: string) => void;
  onDuplicateReport?: (reportId: string) => void;
  onRenameReport?: (reportId: string, newTitle: string) => void;
  onCreateReportInFolder?: (folderId?: string) => void;
  onCreateCustomerFolder?: (name: string, location?: string) => void;
  onRenameCustomerFolder?: (folderId: string, name: string) => void;
  onDeleteCustomerFolder?: (folderId: string) => void;
}

export const NiagaraLeftSidebar: React.FC<NiagaraLeftSidebarProps> = ({
  isOpen,
  onClose,
  onOpen,
  isMobile,
  currentProgram,
  folders,
  items,
  onSelectLogicItem,
  onSelectTemplate,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onDuplicateLogicItem,
  onRenameLogicItem,
  onDeleteLogicItem,
  onOpenSaveModal,
  onAddBlock,
  onSelectBlockInfo,

  activeStudioId,
  onSelectStudio,
  activeView,
  onSelectView,
  activeNiagaraSubView = 'station_browser',
  onSelectNiagaraSubView,
  activeNetworkSubView,
  onSelectNetworkSubView,
  activeAppSubView = 'account',
  onSelectAppSubView,
  activeReportSubView = 'saved_reports',
  onSelectReportSubView,
  customerFolders = [],
  savedReports = [],
  activeReportId,
  onSelectReport,
  onDeleteReport,
  onDuplicateReport,
  onRenameReport,
  onCreateReportInFolder,
  onCreateCustomerFolder,
  onRenameCustomerFolder,
  onDeleteCustomerFolder,
}) => {
  const { theme, isDark } = useNiagaraTheme();

  // Accordion Expansion States
  const [isServicesExpanded, setIsServicesExpanded] = useState(true);
  const [isLibraryExpanded, setIsLibraryExpanded] = useState(false);
  const [isPaletteExpanded, setIsPaletteExpanded] = useState(true);

  // SERVICES child nodes expansion states
  const [isNiagaraServiceExpanded, setIsNiagaraServiceExpanded] = useState(true);
  const [isLogicServiceExpanded, setIsLogicServiceExpanded] = useState(true);
  const [isNetworkServiceExpanded, setIsNetworkServiceExpanded] = useState(true);
  const [isReportServiceExpanded, setIsReportServiceExpanded] = useState(true);
  const [isSavedReportsFolderExpanded, setIsSavedReportsFolderExpanded] = useState(true);
  const [isApplicationServiceExpanded, setIsApplicationServiceExpanded] = useState(true);
  const [expandedCustomerFolders, setExpandedCustomerFolders] = useState<Record<string, boolean>>({});


  // Right-click context menu state
  const [reportContextMenu, setReportContextMenu] = useState<{
    type: 'report' | 'folder';
    id: string;
    name: string;
    x: number;
    y: number;
    folderId?: string;
  } | null>(null);

  // Rename modal / inline state
  const [renamingItem, setRenamingItem] = useState<{
    type: 'report' | 'folder';
    id: string;
    currentName: string;
  } | null>(null);
  const [renameInputValue, setRenameInputValue] = useState('');

  // Delete confirmation modal state
  const [deletingItem, setDeletingItem] = useState<{
    type: 'report' | 'folder';
    id: string;
    name: string;
  } | null>(null);

  // Close context menu on outside click or escape
  useEffect(() => {
    const handleGlobalClick = () => setReportContextMenu(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setReportContextMenu(null);
        setRenamingItem(null);
        setDeletingItem(null);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Resizable Width State (default 288px, supports 0px up to 100% full screen)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('niagara_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 80 && parsed <= 3000) return parsed;
      }
    } catch (e) {}
    return 288;
  });
  const [isResizingWidth, setIsResizingWidth] = useState(false);

  const currentSidebarWidthRef = useRef<number>(sidebarWidth);
  currentSidebarWidthRef.current = sidebarWidth;

  // Window resize effect for sidebar width
  useEffect(() => {
    if (!isResizingWidth) return;

    const handleMouseMove = (e: MouseEvent) => {
      const currentX = e.clientX;
      // If dragged close to the left edge (< 60px), snap to 0 (will close on mouseup)
      if (currentX < 60) {
        currentSidebarWidthRef.current = 0;
        setSidebarWidth(0);
        return;
      }
      const maxAllowedWidth = typeof window !== 'undefined' ? window.innerWidth : 1400;
      const newWidth = Math.max(100, Math.min(maxAllowedWidth, currentX));
      currentSidebarWidthRef.current = newWidth;
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingWidth(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      const latest = currentSidebarWidthRef.current;
      if (latest === 0 || latest < 75) {
        setSidebarWidth(288);
        onClose();
      } else {
        try {
          localStorage.setItem('niagara_sidebar_width', latest.toString());
        } catch (e) {}
      }
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingWidth, onClose]);

  const handleWidthResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingWidth(true);
  };

  // Drag open directly from the closed expand tab
  const handleTabMouseDownToOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onOpen();
    const initialWidth = Math.max(120, e.clientX);
    setSidebarWidth(initialWidth);
    setIsResizingWidth(true);
  };

  // Resizable Splitter State (ratio 0.0 to 1.0, 0 = palette full / tree collapsed, 1 = tree full / palette collapsed)
  const [splitRatio, setSplitRatio] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('niagara_sidebar_split_ratio');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0.0 && parsed <= 1.0) return parsed;
      }
    } catch (e) {}
    return 0.52;
  });

  const sidebarContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingSplitter, setIsDraggingSplitter] = useState(false);

  // Vertical Splitter effect
  useEffect(() => {
    if (!isDraggingSplitter) return;

    const handleSplitterMouseMove = (e: MouseEvent) => {
      if (!sidebarContainerRef.current) return;
      const rect = sidebarContainerRef.current.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const rawRatio = relativeY / rect.height;
      const newRatio = Math.max(0.0, Math.min(1.0, rawRatio <= 0.04 ? 0 : rawRatio >= 0.96 ? 1 : rawRatio));
      setSplitRatio(newRatio);
    };

    const handleSplitterMouseUp = () => {
      setIsDraggingSplitter(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setSplitRatio((latest) => {
        try {
          localStorage.setItem('niagara_sidebar_split_ratio', latest.toString());
        } catch (e) {}
        return latest;
      });
    };

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleSplitterMouseMove);
    window.addEventListener('mouseup', handleSplitterMouseUp);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleSplitterMouseMove);
      window.removeEventListener('mouseup', handleSplitterMouseUp);
    };
  }, [isDraggingSplitter]);

  // Search Terms
  const [librarySearch, setLibrarySearch] = useState('');
  const [paletteSearch, setPaletteSearch] = useState('');

  // Expanded Folders in Library & Palette
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['f_hydronics', 'f_ahu', 'f_boilers', 'f_vav', 'f_lighting', 'f_custom'])
  );

  const [expandedPaletteModules, setExpandedPaletteModules] = useState<Set<string>>(
    new Set([
      'kitControl',
      'kitControl:logic',
      'kitControl:control',
      'kitControl:timers',
      'kitControl:math',
      'kitControl:switches',
      'baja',
      'baja:points',
      'alarm',
      'alarm:alarm',
      'schedule',
      'schedule:schedule',
    ])
  );

  // Editing state for folders/items inline rename
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameFolderName, setRenameFolderName] = useState('');
  const [renamingItemId, setRenamingItemId] = useState<string | null>(null);
  const [renameItemTitle, setRenameItemTitle] = useState('');

  // Inline New Folder Input state
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderNameInput, setNewFolderNameInput] = useState('');

  // Item Action Popover / Menu
  const [activeItemMenuId, setActiveItemMenuId] = useState<string | null>(null);

  const handleSplitterMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingSplitter(true);
  };

  const handleSplitterTouchStart = (e: React.TouchEvent) => {
    setIsDraggingSplitter(true);
  };

  // Toggle Folder in Library
  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Toggle Palette Module
  const togglePaletteModule = (moduleId: string) => {
    setExpandedPaletteModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  // Create folder inline submit
  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderNameInput.trim()) return;
    const created = onCreateFolder(newFolderNameInput.trim());
    setExpandedFolders((prev) => new Set(prev).add(created.id));
    setNewFolderNameInput('');
    setIsAddingFolder(false);
  };

  // Rename folder submit
  const handleRenameFolderSubmit = (folderId: string) => {
    if (renameFolderName.trim()) {
      onRenameFolder(folderId, renameFolderName.trim());
    }
    setRenamingFolderId(null);
  };

  // Rename item submit
  const handleRenameItemSubmit = (itemId: string) => {
    if (renameItemTitle.trim()) {
      onRenameLogicItem(itemId, renameItemTitle.trim());
    }
    setRenamingItemId(null);
  };

  // Filter Library Items by search
  const filteredItems = items.filter((item) => {
    if (!librarySearch) return true;
    const term = librarySearch.toLowerCase();
    return (
      item.title.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.category?.toLowerCase().includes(term) ||
      item.tags?.some((t) => t.toLowerCase().includes(term))
    );
  });

  // Filter Palette Items by search
  const filteredPaletteItems = NIAGARA_PALETTE_ITEMS.filter((item) => {
    if (!paletteSearch) return true;
    const term = paletteSearch.toLowerCase();
    return (
      item.label.toLowerCase().includes(term) ||
      item.type.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.palette.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term)
    );
  });

  // Group Palette items by Module -> Category
  const paletteHierarchy = React.useMemo(() => {
    const modules: Record<string, Record<string, PaletteItem[]>> = {
      kitControl: {
        'kitControl:logic': [],
        'kitControl:math': [],
        'kitControl:switches': [],
        'kitControl:timers': [],
        'kitControl:control': [],
      },
      baja: {
        'baja:points': [],
      },
      alarm: {
        'alarm:alarm': [],
      },
      schedule: {
        'schedule:schedule': [],
      },
    };

    filteredPaletteItems.forEach((item) => {
      const [mod, sub] = item.palette.split(':');
      if (modules[mod] && modules[mod][item.palette]) {
        modules[mod][item.palette].push(item);
      } else {
        if (!modules[mod]) modules[mod] = {};
        if (!modules[mod][item.palette]) modules[mod][item.palette] = [];
        modules[mod][item.palette].push(item);
      }
    });

    return modules;
  }, [filteredPaletteItems]);

  // When collapsed, render a prominent collapsible expand tab/button on the left margin
  if (!isOpen) {
    return (
      <div className="relative shrink-0 flex items-center h-full z-30 select-none animate-in fade-in duration-150">
        <button
          id="sidebar-expand-btn"
          onClick={onOpen}
          onMouseDown={handleTabMouseDownToOpen}
          title="Click or Drag right to open Services & Navigation Tree"
          className={`my-auto h-36 px-2 py-3 rounded-r-xl border-y border-r shadow-2xl flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer hover:scale-105 active:scale-95 select-none group ${
            isDark
              ? 'bg-[#07152b] hover:bg-[#0b254d] active:bg-[#0f2c59] text-slate-100 border-[#183a6f] shadow-sky-950/80 ring-1 ring-sky-500/30'
              : 'bg-white hover:bg-[#f0f6fc] active:bg-[#e2e8f0] text-[#004e8c] border-[#cbd5e1] shadow-lg ring-1 ring-black/10'
          }`}
        >
          <div className="p-1 rounded-md bg-sky-500/15 group-hover:bg-sky-500/25 transition-colors">
            <PanelLeftOpen className="w-4 h-4 text-[#44b33c] group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider [writing-mode:vertical-lr] rotate-180 text-sky-400 dark:text-sky-300 group-hover:text-white whitespace-nowrap">
            SERVICES
          </span>
          <div className="w-1.5 h-3.5 rounded-full bg-sky-500/50 group-hover:bg-sky-400 transition-colors mt-0.5" />
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Semi-transparent Backdrop Overlay */}
      {isMobile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 animate-in fade-in duration-150"
          onClick={onClose}
        />
      )}

      <aside
        id="niagara-unified-sidebar"
        ref={sidebarContainerRef}
        style={isMobile ? undefined : { width: `${sidebarWidth}px` }}
        className={`${
          isMobile
            ? 'fixed inset-y-0 left-0 z-50 w-80 max-w-[88vw] shadow-2xl animate-in slide-in-from-left duration-200'
            : 'relative shrink-0'
        } flex flex-col border-r h-full overflow-hidden select-none transition-colors ${
          isDark
            ? 'bg-[#0b101d] border-slate-800 text-slate-200'
            : 'bg-[#f1f5f9] border-[#cbd5e1] text-slate-800'
        }`}
      >
        {/* Resize width handle on desktop */}
        {!isMobile && (
          <div
            onMouseDown={handleWidthResizeMouseDown}
            className="absolute right-0 top-0 bottom-0 w-3 -mr-1.5 cursor-col-resize hover:bg-sky-500/30 active:bg-sky-500/50 z-40 flex items-center justify-center group select-none transition-colors"
            title="Drag to resize sidebar width"
          >
            <div className="w-0.5 h-12 rounded-full bg-slate-500/40 group-hover:bg-sky-400 group-active:bg-sky-400 transition-colors" />
          </div>
        )}
        {/* ================= SECTION 1: SERVICES NAV TREE ================= */}
        <div
          className={`flex flex-col overflow-hidden min-h-0 ${isDark ? 'border-slate-800' : 'border-[#cbd5e1]'}`}
          style={
            isMobile
              ? undefined
              : {
                  height:
                    splitRatio <= 0.05
                      ? '34px'
                      : splitRatio >= 0.95
                      ? 'calc(100% - 40px)'
                      : `calc(${splitRatio * 100}% - 4px)`,
                }
          }
        >
          {/* Services Section Header */}
          <div
            onClick={() => {
              if (splitRatio <= 0.05) setSplitRatio(0.52);
            }}
            className={`flex items-center justify-between px-3 py-2 select-none shrink-0 border-b classic-header ${
              splitRatio <= 0.05 ? 'cursor-pointer hover:bg-sky-500/10' : ''
            } ${
              isDark
                ? 'bg-gradient-to-r from-slate-900 to-slate-850 border-slate-800 text-slate-200'
                : 'bg-gradient-to-r from-slate-200 to-slate-100 border-[#cbd5e1] text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs tracking-wider uppercase">
              <Database className="w-3.5 h-3.5 text-sky-500 shrink-0 animate-pulse" />
              <span>SERVICES</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-emerald-500 bg-emerald-950/40 px-1 rounded border border-emerald-800/40 font-bold shrink-0">ACTIVE STATION</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                title="Collapse Sidebar"
                className="p-1 rounded hover:bg-slate-700/30 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer shrink-0"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Services Nav Tree Content */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-2 font-mono text-xs select-none">
              
              {/* Application Service Node */}
              <div className="space-y-0.5">
                <div
                  onClick={() => setIsApplicationServiceExpanded(!isApplicationServiceExpanded)}
                  className={`flex items-center justify-between py-1 px-1.5 rounded cursor-pointer transition-colors ${
                    isDark
                      ? 'text-slate-200 hover:bg-slate-800/80 font-bold'
                      : 'text-slate-800 hover:bg-slate-200/80 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-slate-400 shrink-0">
                      {isApplicationServiceExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </span>
                    <Sliders className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="font-mono text-[11px] truncate uppercase tracking-tight text-blue-400 dark:text-blue-300">Application Service</span>
                  </div>
                </div>

                {isApplicationServiceExpanded && (
                  <div className="pl-3 space-y-0.5 border-l border-blue-500/20 ml-2.5 my-0.5">
                    {[
                      { id: 'account', label: 'User Accounts & Access', icon: User, ord: 'station:|slot:/Services/ApplicationService/account' },
                      { id: 'appearance', label: 'Workbench Themes & UI', icon: Sliders, ord: 'station:|slot:/Services/ApplicationService/appearance' },
                      { id: 'engine', label: 'Simulation Engine Config', icon: Cpu, ord: 'station:|slot:/Services/ApplicationService/engine' },
                      { id: 'wiresheet', label: 'Wire Sheet Rendering', icon: Layers, ord: 'station:|slot:/Services/ApplicationService/wiresheet' },
                      { id: 'developer', label: 'Developer Terminal', icon: Terminal, ord: 'station:|slot:/Services/ApplicationService/developer' },
                    ].map((sub) => {
                      const isActive = activeStudioId === 'application' && activeAppSubView === sub.id;
                      const SubIcon = sub.icon;
                      return (
                        <div
                          key={sub.id}
                          onClick={() => {
                            onSelectStudio('application');
                            if (onSelectAppSubView) onSelectAppSubView(sub.id);
                            if (isMobile) onClose();
                          }}
                          className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition-all ${
                            isActive
                              ? isDark
                                ? 'bg-blue-950/70 text-blue-200 font-semibold border-l-2 border-blue-400 shadow-sm'
                                : 'bg-blue-100 text-blue-900 font-semibold border-l-2 border-blue-600 shadow-sm'
                              : isDark
                              ? 'text-slate-300 hover:bg-slate-800/60'
                              : 'text-slate-700 hover:bg-slate-200/60'
                          }`}
                          title={sub.ord}
                        >
                          <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                          <div className="min-w-0 flex-1">
                            <span className="font-sans text-[11px] block truncate leading-tight">{sub.label}</span>
                            <span className="text-[8px] font-mono opacity-50 block truncate tracking-tight">{sub.ord}</span>
                          </div>
                          {isActive && (
                            <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-blue-500 text-slate-950 shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Logic Service Node */}
              <div className="space-y-0.5">
                <div
                  onClick={() => setIsLogicServiceExpanded(!isLogicServiceExpanded)}
                  className={`flex items-center justify-between py-1 px-1.5 rounded cursor-pointer transition-colors ${
                    isDark
                      ? 'text-slate-200 hover:bg-slate-800/80 font-bold'
                      : 'text-slate-800 hover:bg-slate-200/80 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-slate-400 shrink-0">
                      {isLogicServiceExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </span>
                    <Cpu className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span className="font-mono text-[11px] truncate uppercase tracking-tight text-purple-400 dark:text-purple-300">Logic Service</span>
                  </div>
                </div>

                {isLogicServiceExpanded && (
                  <div className="pl-3 space-y-1.5 border-l border-purple-500/20 ml-2.5 my-0.5">
                    
                    {/* Collapsible Logic Library Sub-Folder */}
                    <div className="space-y-0.5">
                      <div
                        className={`group flex items-center justify-between py-1 px-1.5 rounded cursor-pointer transition-all ${
                          isDark ? 'text-slate-200 hover:bg-slate-850/80 font-bold' : 'text-slate-800 hover:bg-slate-200/80 font-bold'
                        }`}
                        onClick={() => setIsLibraryExpanded(!isLibraryExpanded)}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="text-slate-400 shrink-0">
                            {isLibraryExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </span>
                          {isLibraryExpanded ? (
                            <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
                          ) : (
                            <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          )}
                          <span className="truncate font-sans text-xs flex-1 text-amber-500 dark:text-amber-400 uppercase tracking-wide">
                            Logic Library
                          </span>
                        </div>
                        
                        {/* Inline save and folder-plus action icons next to Logic Library */}
                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            id="library-save-active-btn-sidebar"
                            onClick={onOpenSaveModal}
                            title="Save active wire sheet"
                            className={`p-1 rounded cursor-pointer text-slate-400 hover:text-emerald-400 ${
                              isDark ? 'hover:bg-slate-800/80' : 'hover:bg-slate-200'
                            }`}
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id="library-add-folder-btn-sidebar"
                            onClick={() => {
                              setIsLibraryExpanded(true);
                              setIsAddingFolder(true);
                            }}
                            title="Create new library folder"
                            className={`p-1 rounded cursor-pointer text-slate-400 hover:text-amber-400 ${
                              isDark ? 'hover:bg-slate-800/80' : 'hover:bg-slate-200'
                            }`}
                          >
                            <FolderPlus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Content of Logic Library Sub-Folder */}
                      {isLibraryExpanded && (
                        <div className="pl-3 space-y-1.5 border-l border-amber-500/20 ml-2.5 my-1.5">
                          
                          {/* Active Wire Sheet canvas item */}
                          <div
                            onClick={() => {
                              onSelectStudio('wiresheet');
                              onSelectView('wiresheet');
                              if (isMobile) onClose();
                            }}
                            className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition-all ${
                              activeStudioId === 'wiresheet' && activeView === 'wiresheet'
                                ? isDark
                                  ? 'bg-sky-950/70 text-sky-200 font-semibold border-l-2 border-sky-400 shadow-sm'
                                  : 'bg-sky-100 text-sky-900 font-semibold border-l-2 border-sky-600 shadow-sm'
                                : isDark
                                ? 'text-slate-300 hover:bg-slate-800/60'
                                : 'text-slate-700 hover:bg-slate-200/60'
                            }`}
                            title="station:|slot:/Services/LogicService/wireSheet"
                          >
                            <FileCode className={`w-3.5 h-3.5 shrink-0 ${activeStudioId === 'wiresheet' && activeView === 'wiresheet' ? 'text-sky-400' : 'text-slate-400'}`} />
                            <div className="min-w-0 flex-1">
                              <span className="font-sans text-[11px] block truncate leading-tight font-bold">Active Wire Sheet</span>
                              <span className="text-[8px] font-mono opacity-50 block truncate tracking-tight">station:|slot:/Services/LogicService/wireSheet</span>
                            </div>
                            {activeStudioId === 'wiresheet' && activeView === 'wiresheet' && (
                              <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-sky-500 text-slate-950 shrink-0">
                                Active
                              </span>
                            )}
                          </div>

                          {/* Library Search Bar */}
                          <div className="px-1.5">
                            <div className="relative">
                              <Search className="w-2.5 h-2.5 absolute left-2 top-1.5 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Search library..."
                                value={librarySearch}
                                onChange={(e) => setLibrarySearch(e.target.value)}
                                className={`w-full text-[10px] pl-6 pr-2 py-0.5 rounded border font-mono outline-none ${
                                  isDark
                                    ? 'bg-slate-950 border-slate-700 text-slate-200 focus:border-amber-500'
                                    : 'bg-white border-slate-300 text-slate-800 focus:border-amber-500'
                                }`}
                              />
                              {librarySearch && (
                                <button
                                  type="button"
                                  onClick={() => setLibrarySearch('')}
                                  className="absolute right-1.5 top-0.5 text-slate-400 hover:text-white text-[10px]"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Inline Add Folder Input Form */}
                          {isAddingFolder && (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (newFolderNameInput.trim()) {
                                  onCreateFolder(newFolderNameInput.trim(), null);
                                  setNewFolderNameInput('');
                                  setIsAddingFolder(false);
                                }
                              }}
                              className={`p-1.5 border rounded flex items-center gap-1 ${
                                isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-300'
                              }`}
                            >
                              <Folder className="w-3 h-3 text-amber-500 shrink-0" />
                              <input
                                type="text"
                                autoFocus
                                placeholder="Folder name..."
                                value={newFolderNameInput}
                                onChange={(e) => setNewFolderNameInput(e.target.value)}
                                className={`flex-1 text-[10px] px-1 py-0.5 rounded border outline-none font-sans ${
                                  isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'
                                }`}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') setIsAddingFolder(false);
                                }}
                              />
                            </form>
                          )}

                          {/* Pre-engineered Templates Folder */}
                          <div className="space-y-0.5">
                            <div
                              className={`group flex items-center justify-between py-0.5 px-1.5 rounded cursor-pointer hover:bg-slate-800/80`}
                              onClick={() => toggleFolder('f_preengineered')}
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <span className="text-slate-400 shrink-0">
                                  {expandedFolders.has('f_preengineered') ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
                                </span>
                                <Folder className="w-3 h-3 text-sky-400 shrink-0" />
                                <span className="truncate font-sans font-bold text-[10px] text-sky-400 dark:text-sky-300 uppercase tracking-wide">
                                  Templates
                                </span>
                              </div>
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-sky-950 text-sky-300 border border-sky-850">
                                {NIAGARA_TEMPLATES.length}
                              </span>
                            </div>

                            {expandedFolders.has('f_preengineered') && (
                              <div className="pl-3.5 space-y-0.5 border-l border-sky-500/20 ml-2 my-0.5">
                                {NIAGARA_TEMPLATES.map((tmpl) => {
                                  const isActive = currentProgram.title === tmpl.title;
                                  return (
                                    <div
                                      key={tmpl.title}
                                      onClick={() => {
                                        if (onSelectTemplate) onSelectTemplate(tmpl);
                                        onSelectStudio('wiresheet');
                                        onSelectView('wiresheet');
                                      }}
                                      className={`flex items-center gap-1.5 py-0.5 px-1 rounded cursor-pointer transition-all ${
                                        isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                                      }`}
                                    >
                                      <FileCode className="w-3 h-3 shrink-0" />
                                      <span className="truncate text-[10px]">{tmpl.title}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Saved Canvases Folders & Items */}
                          {folders.map((folder) => {
                            const isFolderExpanded = expandedFolders.has(folder.id);
                            const folderItems = items.filter((item) => item.folderId === folder.id);
                            const matchesFolderSearch =
                              !librarySearch ||
                              folder.name.toLowerCase().includes(librarySearch.toLowerCase()) ||
                              folderItems.some((it) => it.title.toLowerCase().includes(librarySearch.toLowerCase()));

                            if (!matchesFolderSearch) return null;

                            return (
                              <div key={folder.id} className="space-y-0.5">
                                <div
                                  className="group flex items-center justify-between py-0.5 px-1.5 rounded cursor-pointer hover:bg-slate-800"
                                  onClick={() => toggleFolder(folder.id)}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <span className="text-slate-400 shrink-0">
                                      {isFolderExpanded ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
                                    </span>
                                    <Folder className="w-3 h-3 text-amber-500 shrink-0" />
                                    {renamingFolderId === folder.id ? (
                                      <input
                                        type="text"
                                        autoFocus
                                        value={renameFolderName}
                                        onChange={(e) => setRenameFolderName(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        onBlur={() => {
                                          if (renameFolderName.trim()) onRenameFolder(folder.id, renameFolderName.trim());
                                          setRenamingFolderId(null);
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            if (renameFolderName.trim()) onRenameFolder(folder.id, renameFolderName.trim());
                                            setRenamingFolderId(null);
                                          }
                                        }}
                                        className="text-[10px] w-full bg-slate-950 text-white rounded px-1 font-sans"
                                      />
                                    ) : (
                                      <span className="truncate text-[10px] font-sans">{folder.name}</span>
                                    )}
                                  </div>
                                  {/* Folder buttons */}
                                  <div className="hidden group-hover:flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => {
                                        setRenamingFolderId(folder.id);
                                        setRenameFolderName(folder.name);
                                      }}
                                      className="p-0.5 text-slate-400 hover:text-white rounded hover:bg-slate-700/50"
                                    >
                                      <Edit2 className="w-2.5 h-2.5" />
                                    </button>
                                    <button onClick={() => onDeleteFolder(folder.id)} className="p-0.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-700/50">
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                </div>

                                {isFolderExpanded && (
                                  <div className="pl-3.5 space-y-0.5 border-l border-amber-500/20 ml-2">
                                    {folderItems.length === 0 ? (
                                      <span className="text-[9px] text-slate-500 italic block pl-1">Empty folder</span>
                                    ) : (
                                      folderItems.map((item) => {
                                        if (librarySearch && !item.title.toLowerCase().includes(librarySearch.toLowerCase())) return null;
                                        return (
                                          <div
                                            key={item.id}
                                            onClick={() => {
                                              onSelectLogicItem(item);
                                              onSelectStudio('wiresheet');
                                              onSelectView('wiresheet');
                                              if (isMobile) onClose();
                                            }}
                                            className="group flex items-center justify-between py-0.5 px-1 rounded cursor-pointer hover:bg-slate-850"
                                          >
                                            <div className="flex items-center gap-1 min-w-0 flex-1">
                                              <FileCode className="w-3 h-3 text-amber-500 shrink-0" />
                                              {renamingItemId === item.id ? (
                                                <input
                                                  type="text"
                                                  autoFocus
                                                  value={renameItemTitle}
                                                  onChange={(e) => setRenameItemTitle(e.target.value)}
                                                  onClick={(e) => e.stopPropagation()}
                                                  onBlur={() => {
                                                    if (renameItemTitle.trim()) onRenameLogicItem(item.id, renameItemTitle.trim());
                                                    setRenamingItemId(null);
                                                  }}
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                      if (renameItemTitle.trim()) onRenameLogicItem(item.id, renameItemTitle.trim());
                                                      setRenamingItemId(null);
                                                    }
                                                  }}
                                                  className="text-[10px] w-full bg-slate-950 text-white rounded px-1 font-sans"
                                                />
                                              ) : (
                                                <span className="truncate text-[10px] font-sans">{item.title}</span>
                                              )}
                                            </div>
                                            <div className="hidden group-hover:flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                                              <button
                                                onClick={() => {
                                                  setRenamingItemId(item.id);
                                                  setRenameItemTitle(item.title);
                                                }}
                                                className="p-0.5 text-slate-400 hover:text-white rounded hover:bg-slate-700/50"
                                              >
                                                <Edit2 className="w-2.5 h-2.5" />
                                              </button>
                                              <button onClick={() => onDeleteLogicItem(item.id)} className="p-0.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-700/50">
                                                <Trash2 className="w-2.5 h-2.5" />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Standard Service Sub-views */}
                    {[
                      { id: 'guide', label: 'Workbench Build Guide', icon: BookOpen, ord: 'station:|slot:/Services/LogicService/buildGuide', action: () => { onSelectStudio('wiresheet'); onSelectView('guide'); } },
                    ].map((sub) => {
                      const isActive = activeStudioId === 'wiresheet' && activeView === sub.id;
                      const SubIcon = sub.icon;
                      return (
                        <div
                          key={sub.id}
                          onClick={() => {
                            sub.action();
                            if (isMobile) onClose();
                          }}
                          className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition-all ${
                            isActive
                              ? isDark
                                ? 'bg-sky-950/70 text-sky-200 font-semibold border-l-2 border-sky-400 shadow-sm'
                                : 'bg-sky-100 text-sky-900 font-semibold border-l-2 border-sky-600 shadow-sm'
                              : isDark
                              ? 'text-slate-300 hover:bg-slate-800/60'
                              : 'text-slate-700 hover:bg-slate-200/60'
                          }`}
                          title={sub.ord}
                        >
                          <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                          <div className="min-w-0 flex-1">
                            <span className="font-sans text-[11px] block truncate leading-tight">{sub.label}</span>
                            <span className="text-[8px] font-mono opacity-50 block truncate tracking-tight">{sub.ord}</span>
                          </div>
                          {isActive && (
                            <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-sky-500 text-slate-950 shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                      );
                    })}

                  </div>
                )}
              </div>

              {/* Network Service Node */}
              <div className="space-y-0.5">
                <div
                  onClick={() => setIsNetworkServiceExpanded(!isNetworkServiceExpanded)}
                  className={`flex items-center justify-between py-1 px-1.5 rounded cursor-pointer transition-colors ${
                    isDark
                      ? 'text-slate-200 hover:bg-slate-800/80 font-bold'
                      : 'text-slate-800 hover:bg-slate-200/80 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-slate-400 shrink-0">
                      {isNetworkServiceExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </span>
                    <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="font-mono text-[11px] truncate uppercase tracking-tight text-emerald-400 dark:text-emerald-300">Network Service</span>
                  </div>
                </div>

                {isNetworkServiceExpanded && (
                  <div className="pl-3 space-y-0.5 border-l border-emerald-500/20 ml-2.5 my-0.5">
                    {[
                      { id: 'discovery', label: 'Device Discovery', icon: Radio, ord: 'station:|slot:/Services/NetworkService/deviceDiscovery' },
                      { id: 'packet_analyzer', label: 'Packet Analyzer', icon: Activity, ord: 'station:|slot:/Services/NetworkService/packetAnalyzer' },
                      { id: 'health_diagnostics', label: 'Health Diagnostics', icon: ShieldCheck, ord: 'station:|slot:/Services/NetworkService/healthDiagnostics' },
                      { id: 'serial_terminal', label: 'RS-485 Terminal', icon: Terminal, ord: 'station:|slot:/Services/NetworkService/serialTerminal' },
                      { id: 'protocol_test', label: 'Protocol Test Shell', icon: Cpu, ord: 'station:|slot:/Services/NetworkService/protocolTestShell' },
                      { id: 'snapshot_diff', label: 'Snapshot Diff Tool', icon: FileSpreadsheet, ord: 'station:|slot:/Services/NetworkService/snapshotDiff' },
                      { id: 'multi_protocol', label: 'Multi-Protocol Gateway', icon: Layers, ord: 'station:|slot:/Services/NetworkService/multiProtocolGateway' },
                    ].map((sub) => {
                      const isActive = activeStudioId === 'network' && activeNetworkSubView === sub.id;
                      const SubIcon = sub.icon;
                      return (
                        <div
                          key={sub.id}
                          onClick={() => {
                            onSelectStudio('network');
                            onSelectNetworkSubView(sub.id);
                            if (isMobile) onClose();
                          }}
                          className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition-all ${
                            isActive
                              ? isDark
                                ? 'bg-emerald-950/70 text-emerald-200 font-semibold border-l-2 border-emerald-400 shadow-sm'
                                : 'bg-emerald-100 text-emerald-900 font-semibold border-l-2 border-emerald-600 shadow-sm'
                              : isDark
                              ? 'text-slate-300 hover:bg-slate-800/60'
                              : 'text-slate-700 hover:bg-slate-200/60'
                          }`}
                          title={sub.ord}
                        >
                          <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                          <div className="min-w-0 flex-1">
                            <span className="font-sans text-[11px] block truncate leading-tight">{sub.label}</span>
                            <span className="text-[8px] font-mono opacity-50 block truncate tracking-tight">{sub.ord}</span>
                          </div>
                          {isActive && (
                            <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-emerald-500 text-slate-950 shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Niagara Service Node (Real-World Sites & Workbenches) */}
              <div className="space-y-0.5">
                <div
                  onClick={() => setIsNiagaraServiceExpanded(!isNiagaraServiceExpanded)}
                  className={`flex items-center justify-between py-1 px-1.5 rounded cursor-pointer transition-colors ${
                    isDark
                      ? 'text-slate-200 hover:bg-slate-800/80 font-bold'
                      : 'text-slate-800 hover:bg-slate-200/80 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-slate-400 shrink-0">
                      {isNiagaraServiceExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </span>
                    <Server className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="font-mono text-[11px] truncate uppercase tracking-tight text-sky-400 dark:text-sky-300">Niagara Service</span>
                  </div>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800/60">
                    Real Sites
                  </span>
                </div>

                {isNiagaraServiceExpanded && (
                  <div className="pl-3 space-y-0.5 border-l border-sky-500/20 ml-2.5 my-0.5">
                    {[
                      { id: 'connection_manager', label: 'Station Manager', icon: Server, ord: 'station:|slot:/Services/NiagaraService/stationManager' },
                      { id: 'station_browser', label: 'Web Interface', icon: Globe, ord: 'station:|slot:/Services/NiagaraService/webInterface' },
                    ].map((sub) => {
                      const isActive = activeStudioId === 'niagara' && activeNiagaraSubView === sub.id;
                      const SubIcon = sub.icon;
                      return (
                        <div
                          key={sub.id}
                          onClick={() => {
                            onSelectStudio('niagara');
                            if (onSelectNiagaraSubView) onSelectNiagaraSubView(sub.id);
                            if (isMobile) onClose();
                          }}
                          className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition-all ${
                            isActive
                              ? isDark
                                ? 'bg-sky-950/70 text-sky-200 font-semibold border-l-2 border-sky-400 shadow-sm'
                                : 'bg-sky-100 text-sky-900 font-semibold border-l-2 border-sky-600 shadow-sm'
                              : isDark
                              ? 'text-slate-300 hover:bg-slate-800/60'
                              : 'text-slate-700 hover:bg-slate-200/60'
                          }`}
                          title={sub.ord}
                        >
                          <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                          <div className="min-w-0 flex-1">
                            <span className="font-sans text-[11px] block truncate leading-tight">{sub.label}</span>
                            <span className="text-[8px] font-mono opacity-50 block truncate tracking-tight">{sub.ord}</span>
                          </div>
                          {isActive && (
                            <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-sky-500 text-slate-950 shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Report Service Node */}
              <div className="space-y-0.5">
                <div
                  onClick={() => setIsReportServiceExpanded(!isReportServiceExpanded)}
                  className={`flex items-center justify-between py-1 px-1.5 rounded cursor-pointer transition-colors ${
                    isDark
                      ? 'text-slate-200 hover:bg-slate-800/80 font-bold'
                      : 'text-slate-800 hover:bg-slate-200/80 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-slate-400 shrink-0">
                      {isReportServiceExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </span>
                    <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="font-mono text-[11px] truncate uppercase tracking-tight text-sky-400 dark:text-sky-300">Report Service</span>
                  </div>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800/60">
                    {savedReports.length} reports
                  </span>
                </div>

                {isReportServiceExpanded && (
                  <div className="pl-3 space-y-1 border-l border-sky-500/20 ml-2.5 my-0.5">
                    
                    {/* Collapsible Saved Reports Sub-Folder with Customer Folders */}
                    <div className="space-y-0.5">
                      <div
                        className={`group flex items-center justify-between py-1 px-1.5 rounded cursor-pointer transition-all ${
                          activeStudioId === 'report' && activeReportSubView === 'saved_reports'
                            ? isDark
                              ? 'bg-sky-950/70 text-sky-200 font-semibold border-l-2 border-sky-400'
                              : 'bg-sky-100 text-sky-900 font-semibold border-l-2 border-sky-600'
                            : isDark
                            ? 'text-slate-300 hover:bg-slate-800/60'
                            : 'text-slate-700 hover:bg-slate-200/60'
                        }`}
                        onClick={() => {
                          onSelectStudio('report');
                          if (onSelectReportSubView) onSelectReportSubView('saved_reports');
                          if (isMobile) onClose();
                        }}
                      >
                        <div
                          className="flex items-center gap-1.5 min-w-0 flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsSavedReportsFolderExpanded(!isSavedReportsFolderExpanded);
                          }}
                        >
                          <span className="text-slate-400 shrink-0">
                            {isSavedReportsFolderExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </span>
                          {isSavedReportsFolderExpanded ? (
                            <FolderOpen className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          ) : (
                            <Folder className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="font-sans text-[11px] block truncate font-medium">Saved Reports Library</span>
                            <span className="text-[8px] font-mono opacity-50 block truncate tracking-tight">station:|slot:/Services/ReportService/savedReports</span>
                          </div>
                        </div>

                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                          {customerFolders.length} sites
                        </span>
                      </div>

                      {/* Customer / Site Sub-Folders Tree */}
                      {isSavedReportsFolderExpanded && (
                        <div className="pl-2.5 space-y-1 border-l border-slate-700/50 ml-2.5 my-0.5">
                          {customerFolders.map((folder) => {
                            const folderReports = savedReports.filter((r) => r.folderId === folder.id);
                            const isFolderExpanded = !!expandedCustomerFolders[folder.id];

                            return (
                              <div key={folder.id} className="space-y-0.5">
                                {/* Folder Row */}
                                <div
                                  onClick={() => {
                                    setExpandedCustomerFolders((prev) => ({
                                      ...prev,
                                      [folder.id]: !prev[folder.id],
                                    }));
                                  }}
                                  onContextMenu={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setReportContextMenu({
                                      type: 'folder',
                                      id: folder.id,
                                      name: folder.name,
                                      x: Math.min(window.innerWidth - 200, e.clientX),
                                      y: Math.min(window.innerHeight - 150, e.clientY),
                                    });
                                  }}
                                  className="group flex items-center justify-between py-1 px-1 rounded cursor-pointer hover:bg-slate-800/60 text-slate-300 text-[10.5px] transition-colors"
                                  title={`Right-click to manage ${folder.name}`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <span className="text-slate-500 hover:text-slate-300 shrink-0">
                                      {isFolderExpanded ? (
                                        <ChevronDown className="w-2.5 h-2.5" />
                                      ) : (
                                        <ChevronRight className="w-2.5 h-2.5" />
                                      )}
                                    </span>
                                    <div
                                      style={{ backgroundColor: folder.color || '#38bdf8' }}
                                      className="w-2 h-2 rounded-full shrink-0"
                                    />
                                    <span className="truncate font-sans font-semibold text-slate-200">{folder.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="text-[8px] font-mono px-1 rounded bg-slate-800 text-slate-400">
                                      {folderReports.length}
                                    </span>
                                  </div>
                                </div>

                                {/* Child Reports under this Customer Folder */}
                                {isFolderExpanded && (
                                  <div className="pl-3 space-y-0.5 border-l border-sky-500/20 ml-2 my-0.5">
                                    {folderReports.length === 0 ? (
                                      <div className="py-1 px-1.5 text-[9px] text-slate-500 italic font-mono flex items-center justify-between">
                                        <span>No reports yet</span>
                                        {onCreateReportInFolder && (
                                          <button
                                            onClick={() => onCreateReportInFolder(folder.id)}
                                            className="text-[9px] text-sky-400 hover:text-sky-300 font-semibold"
                                          >
                                            + New
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      folderReports.map((rep) => {
                                        const isRepActive = activeStudioId === 'report' && activeReportId === rep.id;
                                        return (
                                          <div
                                            key={rep.id}
                                            onClick={() => {
                                              if (onSelectReport) onSelectReport(rep.id);
                                              onSelectStudio('report');
                                              if (onSelectReportSubView) onSelectReportSubView('site_audit_builder');
                                              if (isMobile) onClose();
                                            }}
                                            onContextMenu={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              setReportContextMenu({
                                                type: 'report',
                                                id: rep.id,
                                                name: rep.reportTitle,
                                                folderId: folder.id,
                                                x: Math.min(window.innerWidth - 220, e.clientX),
                                                y: Math.min(window.innerHeight - 200, e.clientY),
                                              });
                                            }}
                                            className={`group flex items-center justify-between py-1 px-1.5 rounded cursor-pointer transition-all ${
                                              isRepActive
                                                ? 'bg-sky-900/60 text-sky-200 border-l-2 border-sky-400 font-semibold'
                                                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                                            }`}
                                            title="Right-click for options (Delete, Rename, Duplicate)"
                                          >
                                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                              <ClipboardList className={`w-3 h-3 shrink-0 ${isRepActive ? 'text-sky-400' : 'text-slate-400'}`} />
                                              <div className="min-w-0 flex-1">
                                                <span className="text-[10px] truncate block font-sans">{rep.reportTitle}</span>
                                                <span className="text-[8px] font-mono opacity-50 block truncate">{rep.auditDate}</span>
                                              </div>
                                            </div>
                                            <span
                                              className={`text-[8px] font-mono px-1 py-0.2 rounded shrink-0 ${
                                                (rep.healthMetrics?.overallHealth ?? 75) >= 80
                                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                                                  : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                                              }`}
                                            >
                                              {rep.healthMetrics?.overallHealth ?? 75}%
                                            </span>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Report Service Builders & Diagnostics Sub-tools */}
                    {[
                      {
                        id: 'site_audit_builder',
                        label: 'Site Audit Report Builder',
                        icon: ClipboardList,
                        ord: 'station:|slot:/Services/ReportService/siteAuditBuilder',
                      },
                    ].map((sub) => {
                      const isActive = activeStudioId === 'report' && activeReportSubView === sub.id;
                      const SubIcon = sub.icon;
                      return (
                        <div
                          key={sub.id}
                          onClick={() => {
                            onSelectStudio('report');
                            if (onSelectReportSubView) onSelectReportSubView(sub.id);
                            if (isMobile) onClose();
                          }}
                          className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition-all ${
                            isActive
                              ? isDark
                                ? 'bg-sky-950/70 text-sky-200 font-semibold border-l-2 border-sky-400 shadow-sm'
                                : 'bg-sky-100 text-sky-900 font-semibold border-l-2 border-sky-600 shadow-sm'
                              : isDark
                              ? 'text-slate-300 hover:bg-slate-800/60'
                              : 'text-slate-700 hover:bg-slate-200/60'
                          }`}
                          title={sub.ord}
                        >
                          <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                          <div className="min-w-0 flex-1">
                            <span className="font-sans text-[11px] block truncate leading-tight">{sub.label}</span>
                            <span className="text-[8px] font-mono opacity-50 block truncate tracking-tight">{sub.ord}</span>
                          </div>
                          {isActive && (
                            <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-sky-500 text-slate-950 shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
        </div>

        {/* ================= VERTICAL SPLITTER RESIZER ================= */}
        {!isMobile && (
          <div
            onMouseDown={handleSplitterMouseDown}
            onTouchStart={handleSplitterTouchStart}
            className={`h-3 relative flex items-center justify-between px-2 cursor-row-resize select-none shrink-0 z-30 border-y transition-colors group ${
              isDark
                ? 'bg-slate-900 border-slate-800 hover:bg-sky-950 hover:border-sky-700/60'
                : 'bg-slate-200 border-slate-300 hover:bg-sky-100 hover:border-sky-400'
            }`}
            title="Drag up or down to resize Palette height (Double click to reset 50/50)"
            onDoubleClick={() => setSplitRatio(0.52)}
          >
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSplitRatio(0.05);
                }}
                title="Maximize Palette"
                className="text-[9px] px-1 rounded hover:bg-sky-500/20 text-slate-400 hover:text-sky-300 cursor-pointer"
              >
                ▲ Palette
              </button>
            </div>
            <div className="w-12 h-1 rounded-full bg-slate-500/50 group-hover:bg-sky-400 group-active:bg-sky-400 transition-colors" />
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSplitRatio(0.95);
                }}
                title="Maximize Services Tree"
                className="text-[9px] px-1 rounded hover:bg-sky-500/20 text-slate-400 hover:text-sky-300 cursor-pointer"
              >
                Services ▼
              </button>
            </div>
          </div>
        )}

        {/* ================= SECTION 3: NIAGARA PALETTE ================= */}
        <div
          className="flex flex-col overflow-hidden min-h-0"
          style={
            isMobile
              ? undefined
              : {
                  height:
                    splitRatio >= 0.95
                      ? '34px'
                      : splitRatio <= 0.05
                      ? 'calc(100% - 40px)'
                      : `calc(${(1 - splitRatio) * 100}% - 4px)`,
                }
          }
        >
          {/* Palette Section Header */}
          <div
            onClick={() => {
              if (splitRatio >= 0.95) setSplitRatio(0.52);
            }}
            className={`flex items-center justify-between px-3 py-2 select-none shrink-0 border-b classic-header ${
              splitRatio >= 0.95 ? 'cursor-pointer hover:bg-sky-500/10' : ''
            } ${
              isDark
                ? 'bg-gradient-to-r from-slate-900 to-slate-850 border-slate-800 text-slate-200'
                : 'bg-gradient-to-r from-slate-200 to-slate-100 border-[#cbd5e1] text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs tracking-wider uppercase">
              <Package className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span>NIAGARA PALETTE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-400 shrink-0">{NIAGARA_PALETTE_ITEMS.length} blocks</span>
            </div>
          </div>

          {/* Palette Content */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              {/* Palette Search Input */}
              <div
                className={`p-2 border-b shrink-0 ${
                  isDark ? 'border-slate-800 bg-slate-900/40' : 'border-[#cbd5e1] bg-slate-100'
                }`}
              >
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search palette blocks..."
                    value={paletteSearch}
                    onChange={(e) => setPaletteSearch(e.target.value)}
                    className={`w-full text-xs pl-7 pr-2 py-1 rounded border font-mono outline-none ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-sky-500'
                        : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-sky-500'
                    }`}
                  />
                  {paletteSearch && (
                    <button
                      onClick={() => setPaletteSearch('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Palette Hierarchy tree */}
              <div className="flex-1 overflow-y-auto p-1.5 space-y-1 font-mono text-xs select-none">
                {(() => {
                  // Filter and compile palette hierarchy
                  const filteredPaletteItems = NIAGARA_PALETTE_ITEMS.filter(
                    (item) =>
                      !paletteSearch ||
                      item.type.toLowerCase().includes(paletteSearch.toLowerCase()) ||
                      item.label.toLowerCase().includes(paletteSearch.toLowerCase()) ||
                      item.description.toLowerCase().includes(paletteSearch.toLowerCase())
                  );

                  const paletteHierarchy: Record<string, Record<string, PaletteItem[]>> = {};
                  filteredPaletteItems.forEach((item) => {
                    const parts = item.palette.split(':');
                    const mod = parts[0] || 'kitControl';
                    if (mod && parts[1]) {
                      if (!paletteHierarchy[mod]) paletteHierarchy[mod] = {};
                      if (!paletteHierarchy[mod][item.palette]) paletteHierarchy[mod][item.palette] = [];
                      paletteHierarchy[mod][item.palette].push(item);
                    }
                  });

                  return Object.entries(paletteHierarchy).map(([moduleName, subcategories]) => {
                    const isModuleExpanded = expandedPaletteModules.has(moduleName);
                    const totalBlocksInModule = Object.values(subcategories).reduce((acc, arr) => acc + arr.length, 0);

                    if (totalBlocksInModule === 0) return null;

                    return (
                      <div key={moduleName} className="space-y-0.5">
                        {/* Module Header (kitControl, baja) */}
                        <div
                          onClick={() => togglePaletteModule(moduleName)}
                          className={`flex items-center justify-between py-1 px-1.5 rounded cursor-pointer transition-colors ${
                            isDark ? 'text-slate-200 hover:bg-slate-800 font-bold' : 'text-slate-800 hover:bg-slate-200 font-bold'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className="text-slate-400">
                              {isModuleExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            </span>
                            <Package className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            <span className="font-mono text-xs truncate">{moduleName}.jar</span>
                          </div>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                              isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {totalBlocksInModule}
                          </span>
                        </div>

                        {/* Subcategories (kitControl:logic, kitControl:control, etc.) */}
                        {isModuleExpanded && (
                          <div className="pl-3 space-y-0.5 border-l border-slate-700/40 ml-2 my-0.5">
                            {Object.entries(subcategories).map(([subPaletteName, blockList]) => {
                              const isSubExpanded = expandedPaletteModules.has(subPaletteName);
                              const subLabel = subPaletteName.split(':')[1] || subPaletteName;

                              if (blockList.length === 0) return null;

                              return (
                                <div key={subPaletteName} className="space-y-0.5">
                                  <div
                                    onClick={() => togglePaletteModule(subPaletteName)}
                                    className={`flex items-center justify-between py-0.5 px-1.5 rounded cursor-pointer transition-colors ${
                                      isDark ? 'text-slate-300 hover:bg-slate-800/60' : 'text-slate-700 hover:bg-slate-200/60'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1 min-w-0 flex-1">
                                      <span className="text-slate-400">
                                        {isSubExpanded ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
                                      </span>
                                      <Folder className="w-3 h-3 text-amber-400/80 shrink-0" />
                                      <span className="font-mono text-[11px] truncate uppercase font-semibold">{subLabel}</span>
                                    </div>
                                    <span className="text-[9px] opacity-60 font-mono">{blockList.length}</span>
                                  </div>

                                  {/* Blocks */}
                                  {isSubExpanded && (
                                    <div className="pl-3 space-y-1 my-0.5">
                                      {blockList.map((item) => (
                                        <div
                                          key={item.type}
                                          draggable
                                          onDragStart={(e) => {
                                            e.dataTransfer.setData('application/json', JSON.stringify(item));
                                          }}
                                          onClick={() => onSelectBlockInfo && onSelectBlockInfo(item)}
                                          className={`group flex items-center justify-between p-1 rounded border transition-all cursor-pointer ${
                                            isDark
                                              ? 'bg-slate-900/80 border-slate-800 hover:border-amber-500/60 hover:bg-slate-850'
                                              : 'bg-white border-slate-200 hover:border-amber-500/80 hover:bg-slate-50'
                                          }`}
                                          title={`${item.label} (${item.description})`}
                                        >
                                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color || '#38bdf8' }} />
                                            <div className="min-w-0 flex-1">
                                              <span className="font-mono font-bold text-[11px] flex items-center gap-1 truncate group-hover:text-amber-500 transition-colors">
                                                <span>{item.type}</span>
                                                <Info className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100 text-sky-400 shrink-0" />
                                              </span>
                                              <span className="text-[9px] opacity-60 font-sans block truncate leading-none">{item.label}</span>
                                            </div>
                                          </div>
                                          <button
                                            id={`sidebar-add-${item.type}`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onAddBlock(item);
                                            }}
                                            className="p-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-sm shrink-0 cursor-pointer ml-1"
                                          >
                                            <Plus className="w-2.5 h-2.5 stroke-[3]" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
        </div>

        {/* Floating Right-Click Context Menu for Reports & Folders */}
        {reportContextMenu && (
          <div
            style={{
              position: 'fixed',
              top: `${reportContextMenu.y}px`,
              left: `${reportContextMenu.x}px`,
              zIndex: 9999,
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-56 bg-slate-900 text-slate-100 rounded-xl shadow-2xl border border-slate-700/80 py-1.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 font-sans"
          >
            <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-mono text-slate-400 truncate flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
              <span className="truncate">{reportContextMenu.name}</span>
            </div>

            {reportContextMenu.type === 'report' ? (
              <div className="py-1 text-xs">
                <button
                  onClick={() => {
                    if (onSelectReport) onSelectReport(reportContextMenu.id);
                    onSelectStudio('report');
                    if (onSelectReportSubView) onSelectReportSubView('site_audit_builder');
                    setReportContextMenu(null);
                    if (isMobile) onClose();
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-sky-600 hover:text-white transition-colors"
                >
                  <ClipboardList className="w-3.5 h-3.5 text-sky-400" />
                  <span>Open in Report Studio</span>
                </button>

                {onDuplicateReport && (
                  <button
                    onClick={() => {
                      onDuplicateReport(reportContextMenu.id);
                      setReportContextMenu(null);
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-800 transition-colors text-slate-200"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Duplicate Report</span>
                  </button>
                )}

                {onRenameReport && (
                  <button
                    onClick={() => {
                      setRenamingItem({
                        type: 'report',
                        id: reportContextMenu.id,
                        currentName: reportContextMenu.name,
                      });
                      setRenameInputValue(reportContextMenu.name);
                      setReportContextMenu(null);
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-800 transition-colors text-slate-200"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Rename Report</span>
                  </button>
                )}

                <div className="my-1 border-t border-slate-800" />

                {onDeleteReport && (
                  <button
                    onClick={() => {
                      setDeletingItem({
                        type: 'report',
                        id: reportContextMenu.id,
                        name: reportContextMenu.name,
                      });
                      setReportContextMenu(null);
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-rose-950/80 text-rose-400 hover:text-rose-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span className="font-semibold">Delete Report</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="py-1 text-xs">
                {onCreateReportInFolder && (
                  <button
                    onClick={() => {
                      onCreateReportInFolder(reportContextMenu.id);
                      onSelectStudio('report');
                      if (onSelectReportSubView) onSelectReportSubView('site_audit_builder');
                      setReportContextMenu(null);
                      if (isMobile) onClose();
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-sky-600 hover:text-white transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-sky-400" />
                    <span>New Report in this Site</span>
                  </button>
                )}

                {onRenameCustomerFolder && (
                  <button
                    onClick={() => {
                      setRenamingItem({
                        type: 'folder',
                        id: reportContextMenu.id,
                        currentName: reportContextMenu.name,
                      });
                      setRenameInputValue(reportContextMenu.name);
                      setReportContextMenu(null);
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-800 transition-colors text-slate-200"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Rename Site Folder</span>
                  </button>
                )}

                <div className="my-1 border-t border-slate-800" />

                {onDeleteCustomerFolder && (
                  <button
                    onClick={() => {
                      setDeletingItem({
                        type: 'folder',
                        id: reportContextMenu.id,
                        name: reportContextMenu.name,
                      });
                      setReportContextMenu(null);
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-rose-950/80 text-rose-400 hover:text-rose-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span className="font-semibold">Delete Site Folder</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Rename Modal Dialog */}
        {renamingItem && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            onClick={() => setRenamingItem(null)}
          >
            <div
              className="bg-slate-900 border border-slate-700 rounded-xl p-5 w-full max-w-sm shadow-2xl space-y-4 font-sans text-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-sm">
                  Rename {renamingItem.type === 'report' ? 'Report' : 'Site Folder'}
                </h3>
              </div>

              <input
                type="text"
                autoFocus
                value={renameInputValue}
                onChange={(e) => setRenameInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && renameInputValue.trim()) {
                    if (renamingItem.type === 'report' && onRenameReport) {
                      onRenameReport(renamingItem.id, renameInputValue.trim());
                    } else if (renamingItem.type === 'folder' && onRenameCustomerFolder) {
                      onRenameCustomerFolder(renamingItem.id, renameInputValue.trim());
                    }
                    setRenamingItem(null);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500 font-sans"
              />

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRenamingItem(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (renameInputValue.trim()) {
                      if (renamingItem.type === 'report' && onRenameReport) {
                        onRenameReport(renamingItem.id, renameInputValue.trim());
                      } else if (renamingItem.type === 'folder' && onRenameCustomerFolder) {
                        onRenameCustomerFolder(renamingItem.id, renameInputValue.trim());
                      }
                      setRenamingItem(null);
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg shadow"
                >
                  Save Name
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingItem && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            onClick={() => setDeletingItem(null)}
          >
            <div
              className="bg-slate-900 border border-rose-900/60 rounded-xl p-5 w-full max-w-sm shadow-2xl space-y-4 font-sans text-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 text-rose-400">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-bold text-sm">
                  Delete {deletingItem.type === 'report' ? 'Site Audit Report' : 'Site Folder'}?
                </h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-white font-semibold">"{deletingItem.name}"</strong>? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeletingItem(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (deletingItem.type === 'report' && onDeleteReport) {
                      onDeleteReport(deletingItem.id);
                    } else if (deletingItem.type === 'folder' && onDeleteCustomerFolder) {
                      onDeleteCustomerFolder(deletingItem.id);
                    }
                    setDeletingItem(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-md transition-all active:scale-95"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
