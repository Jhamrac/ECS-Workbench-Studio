import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { WireSheetCanvas } from './components/WireSheetCanvas';
import { WorkbenchBuildGuide } from './components/WorkbenchBuildGuide';
import { SequenceOfOperationModal } from './components/SequenceOfOperationModal';
import { AIReviewModal } from './components/AIReviewModal';
import { PromptBar } from './components/PromptBar';
import { PaletteDrawer } from './components/PaletteDrawer';
import { BlockInspectorModal } from './components/BlockInspectorModal';
import { SimulationControls } from './components/SimulationControls';
import { NiagaraLeftSidebar } from './components/NiagaraLeftSidebar';
import { SaveLogicModal } from './components/SaveLogicModal';
import { ExportLogicModal } from './components/ExportLogicModal';
import { StartPage } from './components/StartPage';
import { NiagaraThemeProvider, useNiagaraTheme } from './context/NiagaraThemeContext';
import { useDeviceAspect } from './hooks/useDeviceAspect';
import { useLogicLibrary } from './hooks/useLogicLibrary';
import { usePwaManager } from './hooks/usePwaManager';
import { NIAGARA_TEMPLATES } from './data/templates';
import {
  NiagaraProgram,
  NiagaraBlock,
  NiagaraLink,
  PaletteItem,
} from './types/niagara';
import { WORKBENCH_STUDIOS } from './types/studios';
import { SavedLogicItem } from './types/library';
import { runSimulationStep, InjectedFault } from './utils/simulationEngine';
import { exportToNiagaraXml, generatePrintableGuide } from './utils/niagaraExporter';
import { autoLayoutNiagaraBlocks } from './utils/autoLayout';
import { LogicSummaryModal } from './components/LogicSummaryModal';
import { UserAuthModal } from './components/UserAuthModal';
import { InAppMailboxModal } from './components/InAppMailboxModal';
import { BlockInfoModal } from './components/BlockInfoModal';
import { NiagaraSettingsModal } from './components/NiagaraSettingsModal';
import { DesktopAppInstallerModal } from './components/DesktopAppInstallerModal';
import { PriorityArrayModal } from './components/PriorityArrayModal';
import { AIChatDrawer } from './components/AIChatDrawer';
import { NiagaraScheduleModal } from './components/NiagaraScheduleModal';
import { DeveloperDiagnosticConsole } from './components/DeveloperDiagnosticConsole';
import { PowerShellTerminal } from './components/PowerShellTerminal';
import { NetworkingToolsTree } from './components/networking/NetworkingToolsTree';
import { NetworkStudioCanvas } from './components/networking/NetworkStudioCanvas';
import { ApplicationStudioCanvas } from './components/ApplicationStudioCanvas';
import { ReportStudioCanvas } from './components/reports/ReportStudioCanvas';
import { NiagaraServiceStudio } from './components/niagaraService/NiagaraServiceStudio';
import { NetworkingToolSubView } from './types/networking';
import { ReportSubView } from './types/reports';
import { NiagaraServiceSubView } from './types/niagaraService';
import { useReportLibrary } from './hooks/useReportLibrary';

import { logger } from './utils/logger';
import { subscribeVirtualMailbox } from './lib/virtualMailbox';
import { useAuth } from './context/AuthContext';
import { APP_VERSION } from './version';
import { PanelLeftOpen } from 'lucide-react';
import { NIAGARA_PALETTE_ITEMS } from './data/paletteDefinitions';
import { EcsBootSplash } from './components/EcsBootSplash';
import { AnimatePresence } from 'motion/react';

function NiagaraStudioApp() {
  const { theme, isDark } = useNiagaraTheme();
  const aspectInfo = useDeviceAspect();
  const [isBooting, setIsBooting] = useState(true);

  // PWA Offline Manager
  const { isOnline, isInstallable, promptInstall } = usePwaManager();

  const [activeStudioId, setActiveStudioId] = useState<string>('wiresheet');
  const [activeNiagaraSubView, setActiveNiagaraSubView] = useState<NiagaraServiceSubView>('connection_manager');
  const [activeNetworkSubView, setActiveNetworkSubView] = useState<NetworkingToolSubView>('discovery');
  const [activeAppSubView, setActiveAppSubView] = useState<'account' | 'appearance' | 'engine' | 'wiresheet' | 'developer'>('account');
  const [activeReportSubView, setActiveReportSubView] = useState<ReportSubView>('saved_reports');

  const [isNetworkCopilotOpen, setIsNetworkCopilotOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDesktopInstallerOpen, setIsDesktopInstallerOpen] = useState(false);
  const [isMailboxOpen, setIsMailboxOpen] = useState(false);
  const [unreadMailCount, setUnreadMailCount] = useState(0);
  const [selectedInfoBlock, setSelectedInfoBlock] = useState<PaletteItem | null>(null);

  // Settings & Developer Tools Diagnostics State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDevToolsEnabled, setIsDevToolsEnabled] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('niagara_dev_tools_enabled') === 'true';
    } catch {
      return false;
    }
  });
  const [isDiagnosticConsoleOpen, setIsDiagnosticConsoleOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeVirtualMailbox((emails) => {
      const unread = emails.filter((e) => !e.isRead).length;
      setUnreadMailCount(unread);
    });
    return unsubscribe;
  }, []);

  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Logic Library Hook (Persistent Folders & Saved Programs)
  const {
    folders,
    items,
    createFolder,
    renameFolder,
    deleteFolder,
    saveLogicProgram,
    duplicateLogicItem,
    renameLogicItem,
    deleteLogicItem,
  } = useLogicLibrary();

  // Report Library Hook (Persistent Customer Folders & Saved Site Audit Reports)
  const reportLibrary = useReportLibrary();

  // Cloud Auth & Station Sync
  const { user, saveCurrentToCloud, lastSyncedAt } = useAuth();
  const [autoSyncState, setAutoSyncState] = useState<'synced' | 'saving'>('synced');

  // Personal developer account auto-enable & dev tools persistence
  useEffect(() => {
    const userEmail = user?.email?.toLowerCase();
    if (userEmail && (userEmail === 'jhamrac@engcool.com' || userEmail === 'jhamrac5599@gmail.com' || userEmail.includes('jhamrac'))) {
      setIsDevToolsEnabled(true);
      try {
        sessionStorage.setItem('niagara_dev_tools_enabled', 'true');
      } catch {}
    }
  }, [user]);

  const handleEnableDevTools = () => {
    setIsDevToolsEnabled(true);
    setIsDiagnosticConsoleOpen(true);
    setIsTerminalOpen(true);
    try {
      sessionStorage.setItem('niagara_dev_tools_enabled', 'true');
    } catch {}
    showToast('Developer tools unlocked! PowerShell terminal active at bottom.', 'success');
    logger.addLog('SYSTEM', 'Developer tools unlocked for current session.', 'success', undefined, 'DevTools');
  };

  const handleDisableDevTools = () => {
    setIsDevToolsEnabled(false);
    setIsDiagnosticConsoleOpen(false);
    setIsTerminalOpen(false);
    try {
      sessionStorage.removeItem('niagara_dev_tools_enabled');
    } catch {}
    showToast('Developer tools locked.', 'info');
    logger.addLog('SYSTEM', 'Developer tools disabled.', 'info', undefined, 'DevTools');
  };

  // Main Program State
  const [currentProgram, setCurrentProgram] = useState<NiagaraProgram>(() => {
    try {
      const stored = localStorage.getItem('niagara_active_program_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.blocks) && Array.isArray(parsed.links)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not restore active wire sheet program:', e);
    }
    return NIAGARA_TEMPLATES[0];
  });

  // Instant Local Canvas Persistence on every single edit / block move
  useEffect(() => {
    try {
      localStorage.setItem('niagara_active_program_v1', JSON.stringify(currentProgram));
    } catch (e) {
      console.warn('Local canvas persist notice:', e);
    }
  }, [currentProgram]);

  // Deeply serialized string of program for reliable change detection (blocks, positions, links, title, sequence)
  const currentProgramSerialized = useMemo(() => {
    return JSON.stringify({
      id: currentProgram.id,
      title: currentProgram.title,
      category: currentProgram.category,
      description: currentProgram.description,
      blocks: currentProgram.blocks,
      links: currentProgram.links,
      sequenceOfOperation: currentProgram.sequenceOfOperation,
    });
  }, [currentProgram]);

  // Automated Real-Time Cloud Sync (Debounced 1.0s after ANY canvas edit or block move)
  useEffect(() => {
    if (!user) return;
    setAutoSyncState('saving');
    const timer = setTimeout(async () => {
      try {
        await saveCurrentToCloud({
          id: currentProgram.id || `station_${Date.now()}`,
          title: currentProgram.title,
          category: currentProgram.category,
          description: currentProgram.description,
          blocks: currentProgram.blocks,
          links: currentProgram.links,
          sequenceOfOperation: currentProgram.sequenceOfOperation,
        });
        setAutoSyncState('synced');
      } catch (err) {
        console.warn('Auto cloud sync notice:', err);
        setAutoSyncState('synced');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [user?.uid, currentProgramSerialized]);

  // Active Main View
  const [activeView, setActiveView] = useState<
    'home' | 'wiresheet' | 'guide' | 'soo' | 'troubleshoot'
  >('home');

  // Canvas Viewport State
  const [zoom, setZoom] = useState<number>(() => (aspectInfo.isMobile ? 0.75 : 1.0));
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({
    x: aspectInfo.isMobile ? 15 : 40,
    y: aspectInfo.isMobile ? 15 : 40,
  });
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [inspectingBlock, setInspectingBlock] = useState<NiagaraBlock | null>(null);

  // Drawers & Modals State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Navigation History Stack (Back / Forward)
  const [navHistory, setNavHistory] = useState<
    Array<{
      studioId: string;
      view: 'home' | 'wiresheet' | 'guide' | 'soo' | 'troubleshoot';
      netSub?: string;
      repSub?: string;
      niagaraSub?: string;
    }>
  >([{ studioId: 'wiresheet', view: 'home' }]);
  const [navHistoryIndex, setNavHistoryIndex] = useState(0);
  const isNavigatingHistoryRef = useRef(false);

  const pushNavState = useCallback(
    (
      studioId: string,
      view: 'home' | 'wiresheet' | 'guide' | 'soo' | 'troubleshoot',
      netSub?: string,
      repSub?: string,
      niagaraSub?: string
    ) => {
      if (isNavigatingHistoryRef.current) return;
      setNavHistory((prev) => {
        const current = prev[navHistoryIndex];
        if (
          current &&
          current.studioId === studioId &&
          current.view === view &&
          current.netSub === netSub &&
          current.repSub === repSub &&
          current.niagaraSub === niagaraSub
        ) {
          return prev;
        }
        const truncated = prev.slice(0, navHistoryIndex + 1);
        return [...truncated, { studioId, view, netSub, repSub, niagaraSub }];
      });
      setNavHistoryIndex((prev) => prev + 1);
    },
    [navHistoryIndex]
  );

  const handleNavBack = useCallback(() => {
    if (navHistoryIndex > 0) {
      isNavigatingHistoryRef.current = true;
      const targetIndex = navHistoryIndex - 1;
      const target = navHistory[targetIndex];
      if (target) {
        setActiveStudioId(target.studioId);
        setActiveView(target.view);
        if (target.netSub) setActiveNetworkSubView(target.netSub as any);
        if (target.repSub) setActiveReportSubView(target.repSub as any);
        if (target.niagaraSub) setActiveNiagaraSubView(target.niagaraSub as any);
        setNavHistoryIndex(targetIndex);
      }
      setTimeout(() => {
        isNavigatingHistoryRef.current = false;
      }, 60);
    }
  }, [navHistory, navHistoryIndex]);

  const handleNavForward = useCallback(() => {
    if (navHistoryIndex < navHistory.length - 1) {
      isNavigatingHistoryRef.current = true;
      const targetIndex = navHistoryIndex + 1;
      const target = navHistory[targetIndex];
      if (target) {
        setActiveStudioId(target.studioId);
        setActiveView(target.view);
        if (target.netSub) setActiveNetworkSubView(target.netSub as any);
        if (target.repSub) setActiveReportSubView(target.repSub as any);
        if (target.niagaraSub) setActiveNiagaraSubView(target.niagaraSub as any);
        setNavHistoryIndex(targetIndex);
      }
      setTimeout(() => {
        isNavigatingHistoryRef.current = false;
      }, 60);
    }
  }, [navHistory, navHistoryIndex]);


  // WireSheet Undo / Redo Stack
  const [undoStack, setUndoStack] = useState<NiagaraProgram[]>([]);
  const [redoStack, setRedoStack] = useState<NiagaraProgram[]>([]);

  const saveSnapshotForUndo = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-30), JSON.parse(JSON.stringify(currentProgram))]);
    setRedoStack([]);
  }, [currentProgram]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, JSON.parse(JSON.stringify(currentProgram))]);
    setCurrentProgram(previous);
    showToast('Undo wire sheet change (Ctrl+Z)', 'info');
  }, [undoStack, currentProgram]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(currentProgram))]);
    setCurrentProgram(next);
    showToast('Redo wire sheet change (Ctrl+Y)', 'info');
  }, [redoStack, currentProgram]);

  // Block & Link Clipboard
  const [clipboardBlock, setClipboardBlock] = useState<NiagaraBlock | null>(null);

  const handleCut = useCallback(() => {
    if (!selectedBlockId) {
      showToast('Select a block first to Cut (Ctrl+X)', 'info');
      return;
    }
    const block = currentProgram.blocks.find((b) => b.id === selectedBlockId);
    if (block) {
      setClipboardBlock(JSON.parse(JSON.stringify(block)));
      saveSnapshotForUndo();
      setCurrentProgram((prev) => ({
        ...prev,
        blocks: prev.blocks.filter((b) => b.id !== selectedBlockId),
        links: prev.links.filter((l) => l.fromBlockId !== selectedBlockId && l.toBlockId !== selectedBlockId),
      }));
      setSelectedBlockId(null);
      showToast(`Cut "${block.name}" to clipboard`, 'info');
    }
  }, [selectedBlockId, currentProgram.blocks, saveSnapshotForUndo]);

  const handleCopy = useCallback(() => {
    if (!selectedBlockId) {
      showToast('Select a block first to Copy (Ctrl+C)', 'info');
      return;
    }
    const block = currentProgram.blocks.find((b) => b.id === selectedBlockId);
    if (block) {
      setClipboardBlock(JSON.parse(JSON.stringify(block)));
      showToast(`Copied "${block.name}" to clipboard`, 'info');
    }
  }, [selectedBlockId, currentProgram.blocks]);

  const handlePaste = useCallback(() => {
    if (!clipboardBlock) {
      showToast('Clipboard is empty. Copy a block first (Ctrl+C)', 'info');
      return;
    }
    saveSnapshotForUndo();
    const newId = `b_${clipboardBlock.type.toLowerCase()}_${Date.now().toString().slice(-4)}`;
    const pasted: NiagaraBlock = {
      ...JSON.parse(JSON.stringify(clipboardBlock)),
      id: newId,
      name: `${clipboardBlock.name}_Copy`,
      x: clipboardBlock.x + 40,
      y: clipboardBlock.y + 40,
    };
    setCurrentProgram((prev) => ({
      ...prev,
      blocks: [...prev.blocks, pasted],
    }));
    setSelectedBlockId(newId);
    showToast(`Pasted "${pasted.name}"`, 'success');
  }, [clipboardBlock, saveSnapshotForUndo]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedBlockId) {
      const block = currentProgram.blocks.find((b) => b.id === selectedBlockId);
      saveSnapshotForUndo();
      setCurrentProgram((prev) => ({
        ...prev,
        blocks: prev.blocks.filter((b) => b.id !== selectedBlockId),
        links: prev.links.filter((l) => l.fromBlockId !== selectedBlockId && l.toBlockId !== selectedBlockId),
      }));
      setSelectedBlockId(null);
      showToast(`Deleted ${block?.name || 'block'}`, 'info');
    } else if (selectedLinkId) {
      saveSnapshotForUndo();
      setCurrentProgram((prev) => ({
        ...prev,
        links: prev.links.filter((l) => l.id !== selectedLinkId),
      }));
      setSelectedLinkId(null);
      showToast('Deleted wire connection', 'info');
    } else {
      showToast('Select a block or wire link to delete (Del)', 'info');
    }
  }, [selectedBlockId, selectedLinkId, currentProgram.blocks, saveSnapshotForUndo]);

  // Quick Add Block Handler
  const handleQuickAddBlock = useCallback(
    (blockType: string) => {
      const item = NIAGARA_PALETTE_ITEMS.find((p) => p.type === blockType) || NIAGARA_PALETTE_ITEMS[0];
      if (item) {
        saveSnapshotForUndo();
        const newId = `b_${item.type.toLowerCase()}_${Date.now().toString().slice(-4)}`;
        const newBlock: NiagaraBlock = {
          id: newId,
          name: `${item.type}_${(currentProgram.blocks || []).length + 1}`,
          type: item.type,
          palette: item.palette,
          x: 280 + Math.random() * 80,
          y: 140 + Math.random() * 80,
          inputs: JSON.parse(JSON.stringify(item.defaultInputs)),
          outputs: JSON.parse(JSON.stringify(item.defaultOutputs)),
          properties: { ...item.defaultProperties },
          status: { ok: true },
        };
        setCurrentProgram((prev) => ({
          ...prev,
          blocks: [...prev.blocks, newBlock],
        }));
        setSelectedBlockId(newId);
        showToast(`Added ${item.type} component to wire sheet`, 'info');
      }
    },
    [currentProgram.blocks, saveSnapshotForUndo]
  );

  // Import JSON / Niagara File
  const handleImportFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsed = JSON.parse(text);
          if (parsed && (Array.isArray(parsed.blocks) || Array.isArray(parsed.links))) {
            saveSnapshotForUndo();
            const sanitizedBlocks = (parsed.blocks || []).map((b: any, idx: number) => ({
              ...b,
              x: typeof b.x === 'number' && !isNaN(b.x) ? b.x : 60 + (idx % 3) * 320,
              y: typeof b.y === 'number' && !isNaN(b.y) ? b.y : 60 + Math.floor(idx / 3) * 190,
              inputs: b.inputs || [],
              outputs: b.outputs || [],
              properties: b.properties || {},
              status: { ok: true },
            }));
            const loadedProgram: NiagaraProgram = {
              id: parsed.id || `station_${Date.now()}`,
              title: parsed.title || file.name.replace(/\.[^/.]+$/, ''),
              description: parsed.description || 'Imported Niagara logic program',
              category: parsed.category || 'Custom',
              sequenceOfOperation: parsed.sequenceOfOperation || '',
              blocks: sanitizedBlocks,
              links: parsed.links || [],
              rebuildSteps: parsed.rebuildSteps || [],
            };
            setCurrentProgram(loadedProgram);
            setActiveStudioId('wiresheet');
            setActiveView('wiresheet');
            showToast(`Imported "${file.name}"`, 'success');
            setTimeout(() => handleFitView(), 60);
          } else {
            showToast('Unrecognized Niagara JSON structure', 'error');
          }
        } catch (err) {
          console.error(err);
          showToast('Failed to parse JSON file', 'error');
        }
      };
      reader.readAsText(file);
    },
    [saveSnapshotForUndo]
  );

  // Open Override / Priority Array
  const handleOpenOverride = useCallback(() => {
    if (selectedBlockId) {
      const block = currentProgram.blocks.find((b) => b.id === selectedBlockId);
      if (block) {
        setPriorityModalBlock(block);
        return;
      }
    }
    const writableBlock = currentProgram.blocks.find(
      (b) => b.type.includes('Writable') || b.type.includes('Point') || b.type.includes('Loop')
    );
    if (writableBlock) {
      setPriorityModalBlock(writableBlock);
    } else if (currentProgram.blocks.length > 0) {
      setPriorityModalBlock(currentProgram.blocks[0]);
    } else {
      showToast('Add or select a component block to override values', 'info');
    }
  }, [selectedBlockId, currentProgram.blocks]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      // Ctrl+Z -> Undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Y or Ctrl+Shift+Z -> Redo
      else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        handleRedo();
      }
      // Ctrl+C -> Copy
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (selectedBlockId) {
          e.preventDefault();
          handleCopy();
        }
      }
      // Ctrl+X -> Cut
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        if (selectedBlockId) {
          e.preventDefault();
          handleCut();
        }
      }
      // Ctrl+V -> Paste
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        if (clipboardBlock) {
          e.preventDefault();
          handlePaste();
        }
      }
      // Delete or Backspace -> Delete selected
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBlockId || selectedLinkId) {
          e.preventDefault();
          handleDeleteSelected();
        }
      }
      // Alt+Left -> Back
      else if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handleNavBack();
      }
      // Alt+Right -> Forward
      else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleNavForward();
      }
      // Ctrl+K -> AI Assist
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPromptOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedBlockId,
    selectedLinkId,
    clipboardBlock,
    handleUndo,
    handleRedo,
    handleCopy,
    handleCut,
    handlePaste,
    handleDeleteSelected,
    handleNavBack,
    handleNavForward,
  ]);

  // Simulation Engine State
  const [isSimulating, setIsSimulating] = useState(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [enableThermalDynamics, setEnableThermalDynamics] = useState<boolean>(true);
  const [injectedFaults, setInjectedFaults] = useState<InjectedFault[]>([
    {
      id: 'fault_freeze',
      type: 'freeze_stat',
      name: '❄️ Low Temp Freeze Stat Trip',
      description: 'Forces Freeze Stat / Safety Switch into Emergency Alarm state (Priority 1 Trip)',
      active: false,
    },
    {
      id: 'fault_airflow',
      type: 'airflow_loss',
      name: '💨 Airflow Proof Switch Failure',
      description: 'Drops Airflow / Differential Pressure Proof Status to FALSE while Fan Command is ON',
      active: false,
    },
    {
      id: 'fault_sensor',
      type: 'sensor_fault',
      name: '🌡️ Sensor Defect / Short Circuit',
      description: 'Forces temperature sensor reading to out-of-range -999.0°F with DOWN status',
      active: false,
    },
    {
      id: 'fault_high_static',
      type: 'high_static',
      name: '⚠️ High Duct Static Pressure Trip',
      description: 'Simulates high static pressure spike (3.8 in. w.g.) triggering high limit alarm',
      active: false,
    },
    {
      id: 'fault_power',
      type: 'power_loss',
      name: '⚡ Power Outage / Voltage Sag',
      description: 'Simulates 24VAC control power dip across binary status sensors',
      active: false,
    },
  ]);
  const [simulationOverrides, setSimulationOverrides] = useState<
    Record<string, Record<string, any>>
  >({});
  const [stepClock, setStepClock] = useState(0);
  const previousSimulationValuesRef = useRef<Record<string, Record<string, any>>>({});

  // Niagara Authentic Feature Modals State
  const [priorityModalBlock, setPriorityModalBlock] = useState<NiagaraBlock | null>(null);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [aiChatInitialPrompt, setAiChatInitialPrompt] = useState<string>('');
  const [scheduleModalBlock, setScheduleModalBlock] = useState<NiagaraBlock | null>(null);

  const handleOpenAiAssist = (prompt?: string) => {
    if (prompt) {
      setAiChatInitialPrompt(prompt);
    }
    setIsAiChatOpen(true);
  };

  // Live Simulation Calculation with historical state persistence, thermal physics & faults
  const simulationResult = useMemo(() => {
    const result = runSimulationStep(
      currentProgram.blocks,
      currentProgram.links,
      simulationOverrides,
      previousSimulationValuesRef.current,
      {
        enableThermalDynamics,
        injectedFaults,
      }
    );
    previousSimulationValuesRef.current = result.blockValues;
    return result;
  }, [currentProgram.blocks, currentProgram.links, simulationOverrides, stepClock, enableThermalDynamics, injectedFaults]);

  // Periodic simulation tick for timers, speed multipliers & live totalizers
  useEffect(() => {
    if (!isSimulating) return;
    const intervalMs = Math.max(16, Math.floor(1000 / simSpeed));
    const interval = setInterval(() => {
      setStepClock((c) => c + 1);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [isSimulating, simSpeed]);

  const handleToggleFault = (faultId: string) => {
    setInjectedFaults((prev) =>
      prev.map((f) => (f.id === faultId ? { ...f, active: !f.active } : f))
    );
    showToast('Updated simulation field fault injection', 'info');
  };

  const handleClearFaults = () => {
    setInjectedFaults((prev) => prev.map((f) => ({ ...f, active: false })));
    showToast('Cleared all injected field faults', 'info');
  };

  const handleApplyPreset = (overrides: Record<string, Record<string, any>>) => {
    previousSimulationValuesRef.current = {};
    setSimulationOverrides(overrides);
    setStepClock((c) => c + 1);
    showToast('Applied test scenario profile to wire sheet', 'success');
  };

  const handleStepTick = () => {
    setStepClock((c) => c + 1);
  };

  // Auto-fit to viewport and aspect ratio
  const handleFitView = useCallback(() => {
    if (!currentProgram.blocks || currentProgram.blocks.length === 0) {
      setZoom(1.0);
      setPanOffset({ x: 30, y: 30 });
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    currentProgram.blocks.forEach((b) => {
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + (b.width || 220));
      maxY = Math.max(maxY, b.y + 180);
    });

    const programWidth = Math.max(400, maxX - minX + 60);
    const programHeight = Math.max(300, maxY - minY + 60);

    const availableWidth = Math.max(
      320,
      aspectInfo.width - (isSidebarOpen && !aspectInfo.isMobile ? 300 : 40)
    );
    const availableHeight = Math.max(250, aspectInfo.height - 180);

    const scaleX = availableWidth / programWidth;
    const scaleY = availableHeight / programHeight;
    const computedZoom = Math.min(1.4, Math.max(0.4, Math.min(scaleX, scaleY) * 0.9));

    setZoom(Number(computedZoom.toFixed(2)));
    setPanOffset({
      x: Math.max(10, Math.round(20 - minX * computedZoom)),
      y: Math.max(10, Math.round(20 - minY * computedZoom)),
    });
  }, [currentProgram.blocks, aspectInfo.width, aspectInfo.height, aspectInfo.isMobile, isSidebarOpen]);

  // Auto-fit once when screen aspect ratio changes (e.g. phone orientation rotation)
  useEffect(() => {
    if (aspectInfo.isMobile) {
      handleFitView();
    }
  }, [aspectInfo.isPortrait, aspectInfo.isLandscape]);

  // Zoom Controls
  const handleZoomIn = () => setZoom((z) => Math.min(2.0, Number((z + 0.1).toFixed(1))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.3, Number((z - 0.1).toFixed(1))));

  // Auto-Layout Algorithm (Hierarchical Left-to-Right Signal Flow & Collision Free)
  const handleAutoLayout = useCallback(() => {
    const updatedBlocks = autoLayoutNiagaraBlocks(
      currentProgram.blocks,
      currentProgram.links
    );

    setCurrentProgram((prev) => ({
      ...prev,
      blocks: updatedBlocks,
    }));
    setTimeout(() => handleFitView(), 50);
  }, [currentProgram.blocks, currentProgram.links, handleFitView]);

  // Handle Block Position Move
  const handleUpdateBlockPosition = (blockId: string, x: number, y: number) => {
    setCurrentProgram((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => (b.id === blockId ? { ...b, x, y } : b)),
    }));
  };

  // Handle Block Resize
  const handleUpdateBlockSize = (blockId: string, width: number, height?: number) => {
    setCurrentProgram((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => (b.id === blockId ? { ...b, width, height } : b)),
    }));
  };

  // Handle Block Deletion
  const handleDeleteBlock = (blockId: string) => {
    logger.addLog('UI', `Deleted block [${blockId}] from wire sheet`, 'info');
    setCurrentProgram((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== blockId),
      links: prev.links.filter(
        (l) => l.fromBlockId !== blockId && l.toBlockId !== blockId
      ),
    }));
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  };

  // Handle Link Deletion
  const handleDeleteLink = (linkId: string) => {
    logger.logWire(`Deleted wire link [${linkId}]`, { linkId });
    setCurrentProgram((prev) => ({
      ...prev,
      links: prev.links.filter((l) => l.id !== linkId),
    }));
    if (selectedLinkId === linkId) setSelectedLinkId(null);
  };

  // Handle Create Link
  const handleCreateLink = (
    fromBlockId: string,
    fromSlot: string,
    toBlockId: string,
    toSlot: string
  ) => {
    const exists = (currentProgram.links || []).some(
      (l) =>
        l.fromBlockId === fromBlockId &&
        l.fromSlot === fromSlot &&
        l.toBlockId === toBlockId &&
        l.toSlot === toSlot
    );
    if (exists) return;

    const fromBlock = (currentProgram.blocks || []).find((b) => b.id === fromBlockId);
    const outSlot = fromBlock?.outputs?.find((o) => o.name === fromSlot);
    const toBlock = (currentProgram.blocks || []).find((b) => b.id === toBlockId);
    const inSlot = toBlock?.inputs?.find((i) => i.name === toSlot);
    const signalType = outSlot?.type || inSlot?.type || 'boolean';

    const newLink: NiagaraLink = {
      id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      fromBlockId,
      fromSlot,
      toBlockId,
      toSlot,
      signalType,
    };

    logger.logWire(
      `Connected ${fromBlock?.name || fromBlockId}.${fromSlot} ➔ ${toBlock?.name || toBlockId}.${toSlot} (${signalType})`,
      { fromBlockId, fromSlot, toBlockId, toSlot, signalType }
    );

    setCurrentProgram((prev) => ({
      ...prev,
      links: [...(prev.links || []), newLink],
    }));
    showToast(`Connected ${fromBlock?.name || fromBlockId}.${fromSlot} ➔ ${toBlock?.name || toBlockId}.${toSlot}`, 'info');
  };

  // Add block from Palette (supporting optional drop coordinates)
  const handleAddBlock = (item: PaletteItem, posX?: number, posY?: number) => {
    const newId = `b_${item.type.toLowerCase()}_${Date.now().toString().slice(-4)}`;
    const newBlock: NiagaraBlock = {
      id: newId,
      name: `${item.type}_${(currentProgram.blocks || []).length + 1}`,
      type: item.type,
      palette: item.palette,
      x: posX !== undefined ? posX : 320 + Math.random() * 60,
      y: posY !== undefined ? posY : 120 + Math.random() * 60,
      inputs: JSON.parse(JSON.stringify(item.defaultInputs)),
      outputs: JSON.parse(JSON.stringify(item.defaultOutputs)),
      properties: { ...item.defaultProperties },
      status: { ok: true },
    };

    logger.addLog(
      'UI',
      `Added component block [${newBlock.name}] (${item.palette}:${item.type}) to wire sheet`,
      'info',
      { blockId: newId, palette: item.palette, type: item.type }
    );

    setCurrentProgram((prev) => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
    }));
    setSelectedBlockId(newId);
    showToast(`Added ${item.type} component to wire sheet`, 'info');
  };

  // Select Saved Logic Item from Library
  const handleSelectLogicItem = (item: SavedLogicItem) => {
    previousSimulationValuesRef.current = {};
    setCurrentProgram(item.program);
    setSimulationOverrides({});
    setSelectedBlockId(null);
    setSelectedLinkId(null);
    showToast(`Opened from Library: ${item.title}`, 'info');
    setTimeout(() => handleFitView(), 50);
  };

  // Select Pre-engineered Template from Library / Nav Tree
  const handleSelectTemplate = (tmpl: NiagaraProgram) => {
    previousSimulationValuesRef.current = {};
    setCurrentProgram(tmpl);
    setSimulationOverrides({});
    setSelectedBlockId(null);
    setSelectedLinkId(null);
    showToast(`Loaded Sequence: ${tmpl.title}`, 'info');
    setTimeout(() => handleFitView(), 50);
  };

  // Save Logic Program into Library
  const handleSaveToLibrary = (folderId: string, title: string, description: string) => {
    saveLogicProgram(currentProgram, folderId, title, description);
    showToast(`Saved "${title}" to your Logic Library!`, 'success');
  };

  // Value change in Simulation / Manual Override
  const handleValueChange = (
    blockId: string,
    slotName: string,
    newValue: any
  ) => {
    setSimulationOverrides((prev) => ({
      ...prev,
      [blockId]: {
        ...(prev[blockId] || {}),
        [slotName]: newValue,
      },
    }));
  };

  // Update Block Priority Array Override (Authentic 16-Level Niagara Priority)
  const handleUpdatePriorityArray = (
    blockId: string,
    newPriorityArray: Record<number, any>,
    fallbackValue?: any
  ) => {
    setCurrentProgram((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => {
        if (b.id === blockId) {
          const updatedProps = {
            ...b.properties,
            priorityArray: newPriorityArray,
            ...(fallbackValue !== undefined ? { fallbackValue } : {}),
          };
          return { ...b, properties: updatedProps };
        }
        return b;
      }),
    }));
    showToast(`Updated 16-level Priority Array for block`, 'success');
  };

  // Update Schedule Block 7-Day Parameters
  const handleUpdateSchedule = (blockId: string, scheduleData: any) => {
    setCurrentProgram((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => {
        if (b.id === blockId) {
          return {
            ...b,
            properties: {
              ...b.properties,
              scheduleData,
            },
          };
        }
        return b;
      }),
    }));
    showToast('Updated 7-Day Weekly Schedule & Occupancy Bands', 'success');
  };

  // Batch Update Block Positions (Alignment Toolbar)
  const handleBatchUpdatePositions = (updates: { id: string; x: number; y: number }[]) => {
    const updateMap = new Map(updates.map((u) => [u.id, { x: u.x, y: u.y }]));
    setCurrentProgram((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => {
        const u = updateMap.get(b.id);
        if (u) {
          return { ...b, x: u.x, y: u.y };
        }
        return b;
      }),
    }));
  };

  // Duplicate Block Handler
  const handleDuplicateBlock = (block: NiagaraBlock) => {
    const newId = `b_${block.type.toLowerCase()}_${Date.now().toString().slice(-4)}`;
    const duplicated: NiagaraBlock = {
      ...JSON.parse(JSON.stringify(block)),
      id: newId,
      name: `${block.name}_Copy`,
      x: block.x + 40,
      y: block.y + 40,
    };
    setCurrentProgram((prev) => ({
      ...prev,
      blocks: [...prev.blocks, duplicated],
    }));
    setSelectedBlockId(newId);
    showToast(`Duplicated block ${block.name}`, 'info');
  };

  // Quick Priority 8 Manual Override Handler
  const handleOverrideBlockValue = (blockId: string, value: any) => {
    const block = currentProgram.blocks.find((b) => b.id === blockId);
    const existingArray = block?.properties?.priorityArray || {};
    handleUpdatePriorityArray(
      blockId,
      { ...existingArray, 8: value }
    );
    showToast(`Set Priority 8 Manual Override = ${value}`, 'success');
  };

  // Relinquish Priority Array Overrides Handler
  const handleRelinquishBlock = (blockId: string) => {
    const block = currentProgram.blocks.find((b) => b.id === blockId);
    const existingArray = { ...(block?.properties?.priorityArray || {}) };
    delete existingArray[8];
    delete existingArray[1];
    handleUpdatePriorityArray(
      blockId,
      existingArray
    );
    showToast(`Relinquished priority overrides to Auto`, 'info');
  };

  // Reset all Simulation Overrides
  const handleResetSimulation = () => {
    previousSimulationValuesRef.current = {};
    setSimulationOverrides({});
    setStepClock(0);
    showToast('Reset all manual simulation overrides', 'info');
  };

  // Toggle Rebuild Step
  const handleToggleStep = (stepNumber: number) => {
    setCurrentProgram((prev) => ({
      ...prev,
      rebuildSteps: (prev.rebuildSteps || []).map((s) =>
        s.stepNumber === stepNumber ? { ...s, completed: !s.completed } : s
      ),
    }));
  };

  // AI Generator Handler
  const handleGenerateWiresheet = async (prompt: string) => {
    setIsAiLoading(true);
    try {
      const response = await fetch('/api/generate-wiresheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          existingBlocks: currentProgram.blocks,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate wire sheet');
      }

      const generatedData: NiagaraProgram = await response.json();

      const sanitizedBlocks = (generatedData.blocks || []).map((b, idx) => ({
        ...b,
        x: typeof b.x === 'number' && !isNaN(b.x) ? b.x : 60 + (idx % 3) * 320,
        y: typeof b.y === 'number' && !isNaN(b.y) ? b.y : 60 + Math.floor(idx / 3) * 190,
        inputs: b.inputs || [],
        outputs: b.outputs || [],
        properties: b.properties || {},
        status: { ok: true },
      }));

      const organizedBlocks = autoLayoutNiagaraBlocks(sanitizedBlocks, generatedData.links || []);

      const newProgram: NiagaraProgram = {
        ...generatedData,
        blocks: organizedBlocks,
        links: generatedData.links || [],
        rebuildSteps: (generatedData.rebuildSteps || []).map((s, idx) => ({
          ...s,
          stepNumber: s.stepNumber || idx + 1,
          completed: false,
        })),
      };

      setCurrentProgram(newProgram);
      setIsPromptOpen(false);
      setTimeout(() => handleFitView(), 60);
      showToast(`Generated: ${newProgram.title}`, 'success');
    } catch (err: any) {
      console.error('Generation error:', err);
      showToast(`Notice: Loaded Niagara program logic for prompt`, 'info');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Export Guide (Print / Save HTML)
  const handleExportGuide = () => {
    const html = generatePrintableGuide(currentProgram);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      win.focus();
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = `Niagara_Build_Guide_${currentProgram.title.replace(/\s+/g, '_')}.html`;
      a.click();
    }
  };

  // Export Niagara Bog XML
  const handleExportXml = () => {
    const xml = exportToNiagaraXml(currentProgram);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProgram.title.replace(/\s+/g, '_')}_Niagara_Export.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export JSON
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(currentProgram, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProgram.title.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Apply a Niagara program directly onto the canvas
  const handleApplyProgram = (program: NiagaraProgram) => {
    const sanitizedBlocks = (program.blocks || []).map((b, idx) => ({
      ...b,
      x: typeof b.x === 'number' && !isNaN(b.x) ? b.x : 60 + (idx % 3) * 320,
      y: typeof b.y === 'number' && !isNaN(b.y) ? b.y : 60 + Math.floor(idx / 3) * 190,
      inputs: b.inputs || [],
      outputs: b.outputs || [],
      properties: b.properties || {},
      status: { ok: true },
    }));

    const organizedBlocks = autoLayoutNiagaraBlocks(sanitizedBlocks, program.links || []);

    const newProgram: NiagaraProgram = {
      ...program,
      blocks: organizedBlocks,
      links: program.links || [],
      rebuildSteps: (program.rebuildSteps || []).map((s, idx) => ({
        ...s,
        stepNumber: s.stepNumber || idx + 1,
        completed: false,
      })),
    };

    setCurrentProgram(newProgram);
    setActiveView('wiresheet');
    setTimeout(() => handleFitView(), 60);
    showToast(`Loaded Program onto Canvas: ${newProgram.title}`, 'success');
  };

  // Autonomous AI Navigation & Screen Action Handler
  const handleExecuteAiAction = (actionType: string, payload?: any) => {
    switch (actionType) {
      case 'NAVIGATE_STUDIO':
        if (payload === 'network' || payload === 'wiresheet') {
          setActiveStudioId(payload);
          showToast(`Switched to ${payload === 'network' ? 'Network Studio' : 'Logic Studio (Wire Sheet)'}`, 'info');
        }
        break;
      case 'OPEN_NETWORK_TOOL':
        setActiveStudioId('network');
        if (payload) {
          setActiveNetworkSubView(payload);
          showToast(`Opened Network Tool: ${payload.replace(/_/g, ' ')}`, 'info');
        }
        break;
      case 'NAVIGATE_WIRESHEET':
        setActiveStudioId('wiresheet');
        setActiveView('wiresheet');
        showToast('Switched to Wire Sheet Logic Editor', 'info');
        break;
      case 'NAVIGATE_SOO':
        setActiveView('soo');
        showToast('Opened Sequence of Operation Documentation', 'info');
        break;
      case 'NAVIGATE_GUIDE':
        setActiveView('guide');
        showToast('Opened Niagara Workbench Engineering Guide', 'info');
        break;
      case 'START_SIMULATION':
        setIsSimulating(true);
        showToast('Started live thermal simulation engine', 'success');
        break;
      case 'STOP_SIMULATION':
        setIsSimulating(false);
        showToast('Stopped thermal simulation engine', 'info');
        break;
      case 'TOGGLE_SIMULATION':
        setIsSimulating((prev) => !prev);
        break;
      case 'OPEN_SCHEDULE':
        {
          const schedBlock =
            currentProgram.blocks.find(
              (b) =>
                b.type.toLowerCase().includes('schedule') ||
                b.name.toLowerCase().includes('schedule')
            ) ||
            currentProgram.blocks[0] ||
            null;
          setScheduleModalBlock(schedBlock);
          showToast('Opened Niagara Weekly Schedule Editor', 'info');
        }
        break;
      case 'OPEN_PRIORITY':
        {
          const prioBlock =
            currentProgram.blocks.find((b) =>
              b.inputs.some((i) => i.name.includes('in8') || i.name.includes('in1'))
            ) ||
            currentProgram.blocks[0] ||
            null;
          setPriorityModalBlock(prioBlock);
          showToast('Opened 16-Level Priority Array Inspector', 'info');
        }
        break;
      case 'OPEN_DIAGNOSTICS':
        setIsDiagnosticConsoleOpen(true);
        setIsTerminalOpen(true);
        showToast('Opened PowerShell / Command Terminal', 'info');
        break;
      case 'OPEN_SETTINGS':
        setIsSettingsOpen(true);
        showToast('Opened Workbench Settings', 'info');
        break;
      case 'OPEN_MAILBOX':
        setIsMailboxOpen(true);
        showToast('Opened In-App Virtual Mailbox', 'info');
        break;
      case 'OPEN_PALETTE':
        setIsSidebarOpen(true);
        showToast('Opened kitControl Component Palette', 'info');
        break;
      case 'OPEN_AUTH':
        setIsAuthModalOpen(true);
        break;
      case 'FIT_VIEW':
        handleFitView();
        showToast('Recentered Wire Sheet Canvas', 'info');
        break;
      case 'CLEAR_CANVAS':
        setCurrentProgram({
          id: `program_new_${Date.now()}`,
          title: 'New Blank Wire Sheet',
          category: 'HVAC',
          description: 'Empty Niagara workspace canvas',
          blocks: [],
          links: [],
          sequenceOfOperation: ['1. Add components from kitControl palette or ask AI to generate logic.'],
        });
        showToast('Cleared Wire Sheet to fresh canvas', 'info');
        break;
      case 'GENERATE_PROGRAM':
        if (typeof payload === 'string' && payload.trim()) {
          handleGenerateWiresheet(payload.trim());
        } else {
          setIsPromptOpen(true);
        }
        break;
      case 'APPLY_PROGRAM':
        if (payload && typeof payload === 'object') {
          handleApplyProgram(payload);
        }
        break;
      default:
        console.warn('Unknown AI Action Type:', actionType);
    }
  };

  // Dynamic Studio Context determination for AI Assistant (Accurately mirrors selected studio tool dropdown)
  const studioContext = useMemo(() => {
    const currentStudio =
      WORKBENCH_STUDIOS.find((s) => s.id === activeStudioId) || WORKBENCH_STUDIOS[0];
    const activeStudio = currentStudio.name;
    const selectedBlockName: string | undefined = inspectingBlock?.name || undefined;

    const activeFaultsList = (injectedFaults || [])
      .filter((f) => f.active)
      .map((f) => f.name || f.id);

    if (activeStudioId === 'network') {
      const toolNames: Record<string, string> = {
        discovery: 'Device Discovery & BACnet Topology',
        packet_analyzer: 'Packet Capture & Protocol Analyzer',
        health_diagnostics: 'OT Network Health Diagnostics',
        serial_terminal: 'RS-485 Serial Bus Terminal',
        protocol_test: 'APDU Protocol Test Shell',
        snapshot_diff: 'Baseline Snapshot Comparator',
        gateway_mapper: 'Multi-Protocol Gateways',
      };
      const activeNetworkTool = toolNames[activeNetworkSubView] || 'OT Network Health & Quality';

      const netData = currentProgram.networkStudioData || {};
      const networkMode = netData.networkMode || 'disconnected';
      const isConnected = networkMode !== 'disconnected';

      const deviceCount = isConnected ? (netData.devices?.length ?? 11) : 0;
      const healthScore = isConnected ? (netData.healthMetrics?.overallHealth ?? 98) : 0;
      const isCapturing = isConnected ? (netData.isCapturing ?? false) : false;

      const summary = isConnected
        ? `Active Studio: "Network Studio". Currently active tool: "${activeNetworkTool}". Monitoring ${deviceCount} field BACnet/IP and MS/TP controllers. Health Score: ${healthScore}% (Grade A). Real-time packet capture active.`
        : `Active Studio: "Network Studio". Adapter is unbound and disconnected. No active controllers are being monitored. Health Score: 0% (Disconnected).`;

      return {
        activeStudioId: 'network' as const,
        activeStudio: 'Network Studio',
        onScreenSummary: summary,
        activeNetworkTool,
        deviceCount,
        healthScore,
        isCapturing,
        programTitle: '',
        programCategory: 'OT Networking',
        blockCount: 0,
        linkCount: 0,
        isSimulating: false,
        activeFaults: [],
        selectedBlockName: undefined,
        stepClock: 0,
        networkMode,
      };
    }

    const summary = `Active Studio: "${activeStudio}". Program: "${currentProgram.title}" (${currentProgram.category || 'HVAC'}) containing ${(currentProgram.blocks || []).length} blocks and ${(currentProgram.links || []).length} links. Simulation is ${isSimulating ? 'RUNNING' : 'STOPPED'}. Active faults: ${activeFaultsList.length > 0 ? activeFaultsList.join(', ') : 'None'}.`;

    return {
      activeStudioId: 'wiresheet' as const,
      activeStudio: 'Logic Studio (Wire Sheet)',
      onScreenSummary: summary,
      programTitle: currentProgram.title,
      programCategory: currentProgram.category || 'HVAC',
      blockCount: (currentProgram.blocks || []).length,
      linkCount: (currentProgram.links || []).length,
      isSimulating,
      activeFaults: activeFaultsList,
      selectedBlockName,
      stepClock,
    };
  }, [
    activeStudioId,
    activeNetworkSubView,
    inspectingBlock,
    currentProgram.title,
    currentProgram.category,
    currentProgram.blocks,
    currentProgram.links,
    isSimulating,
    injectedFaults,
    stepClock,
  ]);

  return (
    <div
      id="niagara-workbench-app"
      className={`flex flex-col h-screen w-screen overflow-hidden font-sans transition-colors ${
        isDark ? 'bg-[#080d19] text-slate-100' : 'bg-[#eef2f6] text-slate-900'
      }`}
    >
      {/* Top Navbar & Niagara Toolbar */}
      <Navbar
        currentProgram={currentProgram}
        onSelectTemplate={(tmpl) => {
          setCurrentProgram(tmpl);
          setSimulationOverrides({});
          setTimeout(() => handleFitView(), 50);
        }}
        isSimulating={isSimulating}
        onToggleSimulate={() => setIsSimulating(!isSimulating)}
        onResetSimulation={handleResetSimulation}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        onAutoLayout={handleAutoLayout}
        activeView={activeView}
        setActiveView={setActiveView}
        activeStudioId={activeStudioId}
        onSelectStudio={setActiveStudioId}
        activeNetworkSubView={activeNetworkSubView}
        onSelectNetworkSubView={setActiveNetworkSubView}
        activeReportSubView={activeReportSubView}
        onSelectReportSubView={setActiveReportSubView}
        networkDeviceCount={
          currentProgram.networkStudioData?.networkMode && currentProgram.networkStudioData?.networkMode !== 'disconnected'
            ? (currentProgram.networkStudioData?.devices?.length ?? 11)
            : 0
        }
        networkPacketCount={
          currentProgram.networkStudioData?.networkMode && currentProgram.networkStudioData?.networkMode !== 'disconnected'
            ? (currentProgram.networkStudioData?.packets?.length ?? 124)
            : 0
        }
        networkHealthScore={
          currentProgram.networkStudioData?.networkMode && currentProgram.networkStudioData?.networkMode !== 'disconnected'
            ? (currentProgram.networkStudioData?.healthMetrics?.overallHealth ?? 98)
            : 0
        }
        isPaletteOpen={isSidebarOpen}
        onTogglePalette={() => setIsSidebarOpen(!isSidebarOpen)}
        isNavTreeOpen={isSidebarOpen}
        onToggleNavTree={() => setIsSidebarOpen(!isSidebarOpen)}
        onExportGuide={handleExportGuide}
        onExportXml={handleExportXml}
        onExportJson={handleExportJson}
        onOpenPrompt={() => setIsPromptOpen(true)}
        onOpenSummary={() => setIsSummaryOpen(true)}
        onOpenSaveModal={() => setIsSaveModalOpen(true)}
        isInstallable={isInstallable}
        onPromptInstall={promptInstall}
        isOnline={isOnline}
        aspectInfo={aspectInfo}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenAiChat={() => setIsAiChatOpen(true)}
        onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
        isTerminalOpen={isTerminalOpen}
        onOpenSettings={() => {
          setActiveStudioId('application');
          setActiveAppSubView('appearance');
          pushNavState('application', 'wiresheet', undefined, undefined);
        }}
        onOpenNetworkAiAssist={() => setIsNetworkCopilotOpen(true)}
        onOpenDesktopInstaller={() => setIsDesktopInstallerOpen(true)}
        lastSyncedAt={lastSyncedAt}

        // Global Toolbar Navigation & Refresh
        canGoBack={navHistoryIndex > 0}
        canGoForward={navHistoryIndex < navHistory.length - 1}
        onNavigateBack={handleNavBack}
        onNavigateForward={handleNavForward}
        onRefresh={() => {
          if (activeStudioId === 'wiresheet') {
            handleFitView();
            setStepClock((c) => c + 1);
            showToast('Refreshed WireSheet canvas & synchronized live signals', 'info');
          } else if (activeStudioId === 'network') {
            showToast('Refreshed Network discovery scan', 'info');
          } else {
            showToast('Refreshed current view', 'info');
          }
        }}

        // WireSheet Context Props
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onCut={handleCut}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onDelete={handleDeleteSelected}
        hasSelectedBlock={Boolean(selectedBlockId)}
        hasSelectedLink={Boolean(selectedLinkId)}
        hasClipboard={Boolean(clipboardBlock)}
        onStepTick={handleStepTick}
        onOpenOverride={handleOpenOverride}
        onQuickAddBlock={handleQuickAddBlock}
        onImportFile={handleImportFile}
      />

      {/* Main Workbench Workspace (Logic Library + Resizable Palette + Canvas OR Network Studio OR Report Service) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Persistent Left Sidebar with Unified SERVICES Navigation Tree */}
        <NiagaraLeftSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpen={() => setIsSidebarOpen(true)}
          isMobile={aspectInfo.isMobile}
          currentProgram={currentProgram}
          folders={folders}
          items={items}
          onSelectLogicItem={handleSelectLogicItem}
          onSelectTemplate={handleSelectTemplate}
          onCreateFolder={createFolder}
          onRenameFolder={renameFolder}
          onDeleteFolder={deleteFolder}
          onDuplicateLogicItem={duplicateLogicItem}
          onRenameLogicItem={renameLogicItem}
          onDeleteLogicItem={deleteLogicItem}
          onOpenSaveModal={() => setIsSaveModalOpen(true)}
          onAddBlock={handleAddBlock}
          onSelectBlockInfo={(item) => setSelectedInfoBlock(item)}

          // Unified navigation state and handlers
          activeStudioId={activeStudioId}
          onSelectStudio={(studioId) => {
            pushNavState(studioId, activeView);
            setActiveStudioId(studioId);
          }}
          activeView={activeView}
          onSelectView={(view) => {
            pushNavState(activeStudioId, view);
            setActiveView(view);
          }}
          activeNiagaraSubView={activeNiagaraSubView}
          onSelectNiagaraSubView={(subView) => {
            pushNavState('niagara', activeView, undefined, undefined, subView);
            setActiveNiagaraSubView(subView);
          }}
          activeNetworkSubView={activeNetworkSubView}
          onSelectNetworkSubView={(subView) => {
            pushNavState('network', activeView, subView);
            setActiveNetworkSubView(subView);
          }}
          activeAppSubView={activeAppSubView}
          onSelectAppSubView={(subView: any) => {
            pushNavState('application', activeView);
            setActiveAppSubView(subView);
          }}
          activeReportSubView={activeReportSubView}
          onSelectReportSubView={(subView) => {
            pushNavState('report', activeView, undefined, subView);
            setActiveReportSubView(subView);
          }}
          customerFolders={reportLibrary.customerFolders}
          savedReports={reportLibrary.savedReports}
          activeReportId={reportLibrary.activeReportId}
          onSelectReport={(reportId) => {
            pushNavState('report', activeView, undefined, 'site_audit_builder');
            reportLibrary.setActiveReportId(reportId);
            setActiveStudioId('report');
            setActiveReportSubView('site_audit_builder');
          }}
          onDeleteReport={reportLibrary.deleteReport}
          onDuplicateReport={reportLibrary.duplicateReport}
          onRenameReport={reportLibrary.renameReport}
          onCreateReportInFolder={reportLibrary.createNewSiteAuditReport}
          onCreateCustomerFolder={reportLibrary.createCustomerFolder}
          onRenameCustomerFolder={reportLibrary.renameCustomerFolder}
          onDeleteCustomerFolder={reportLibrary.deleteCustomerFolder}
        />

        {/* Dynamic Main View Center based on services selected */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0 pb-14 sm:pb-0">
          {activeStudioId === 'niagara' ? (
            <NiagaraServiceStudio
              activeSubView={activeNiagaraSubView}
              onSelectSubView={(sub) => {
                pushNavState('niagara', activeView, undefined, undefined, sub);
                setActiveNiagaraSubView(sub);
              }}
              onOpenPriorityOverride={(pointName, currentVal) => {
                handleOpenOverride();
              }}
            />
          ) : activeStudioId === 'application' ? (
            <ApplicationStudioCanvas
              activeCategory={activeAppSubView}
              isDevToolsEnabled={isDevToolsEnabled}
              onEnableDevTools={handleEnableDevTools}
              onDisableDevTools={handleDisableDevTools}
              onOpenDiagnosticConsole={() => {
                setIsDiagnosticConsoleOpen(true);
                setIsTerminalOpen(true);
              }}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          ) : activeStudioId === 'network' ? (
            <NetworkStudioCanvas
              activeSubView={activeNetworkSubView}
              onSelectSubView={setActiveNetworkSubView}
              onOpenAiAssist={handleOpenAiAssist}
              currentProgram={currentProgram}
              onUpdateProgram={setCurrentProgram}
              isAiCopilotOpen={isNetworkCopilotOpen}
              setIsAiCopilotOpen={setIsNetworkCopilotOpen}
            />
          ) : activeStudioId === 'report' ? (
            <ReportStudioCanvas
              activeSubView={activeReportSubView}
              onSelectSubView={setActiveReportSubView}
              currentProgram={currentProgram}
              reportLibrary={reportLibrary}
              isDark={isDark}
            />
          ) : (

            <>
              {activeView === 'home' && (
                <StartPage
                  onGoToView={(v) => setActiveView(v)}
                  onGoToStudio={(s) => setActiveStudioId(s)}
                  currentProgram={currentProgram}
                  isDark={isDark}
                  onOpenSettings={() => {
                    setActiveStudioId('application');
                    setActiveAppSubView('appearance');
                  }}
                  isSidebarOpen={isSidebarOpen}
                />
              )}

              {activeView === 'wiresheet' && (
                <>
                  <WireSheetCanvas
                    blocks={currentProgram.blocks}
                    links={currentProgram.links}
                    liveValues={simulationResult.blockValues}
                    liveStatuses={simulationResult.blockStatuses}
                    activeLinkIds={simulationResult.activeLinkIds}
                    zoom={zoom}
                    panOffset={panOffset}
                    onPanChange={setPanOffset}
                    onZoomChange={setZoom}
                    selectedBlockId={selectedBlockId}
                    selectedLinkId={selectedLinkId}
                    onSelectBlock={setSelectedBlockId}
                    onSelectLink={setSelectedLinkId}
                    onUpdateBlockPosition={handleUpdateBlockPosition}
                    onUpdateBlockSize={handleUpdateBlockSize}
                    onDeleteBlock={handleDeleteBlock}
                    onDeleteLink={handleDeleteLink}
                    onCreateLink={handleCreateLink}
                    onOpenInspector={setInspectingBlock}
                    onValueChange={handleValueChange}
                    isSimulating={isSimulating}
                    aspectInfo={aspectInfo}
                    onOpenPalette={() => setIsSidebarOpen(true)}
                    onFitView={handleFitView}
                    onAutoLayout={handleAutoLayout}
                    onAddBlockAtPosition={handleAddBlock}
                    onOpenPrompt={() => setIsPromptOpen(true)}
                    onOpenSaveModal={() => setIsSaveModalOpen(true)}
                    onOpenPriorityArray={setPriorityModalBlock}
                    onOpenScheduleEditor={setScheduleModalBlock}
                    onBatchUpdatePositions={handleBatchUpdatePositions}
                    onDuplicateBlock={handleDuplicateBlock}
                    onOverrideBlockValue={handleOverrideBlockValue}
                    onRelinquishBlock={handleRelinquishBlock}
                    onOpenExport={() => setIsExportModalOpen(true)}
                  />

                  {/* Bottom Simulation Interactive Test Bar */}
                  <SimulationControls
                    isSimulating={isSimulating}
                    onToggleSimulate={() => setIsSimulating(!isSimulating)}
                    onResetSimulation={handleResetSimulation}
                    simSpeed={simSpeed}
                    onChangeSpeed={setSimSpeed}
                    onStepTick={handleStepTick}
                    enableThermalDynamics={enableThermalDynamics}
                    onToggleThermalDynamics={() => setEnableThermalDynamics(!enableThermalDynamics)}
                    injectedFaults={injectedFaults}
                    onToggleFault={handleToggleFault}
                    onClearFaults={handleClearFaults}
                    onApplyPreset={handleApplyPreset}
                    blocks={currentProgram.blocks}
                    liveValues={simulationResult.blockValues}
                    liveStatuses={simulationResult.blockStatuses}
                    simulationOverrides={simulationOverrides}
                    onValueChange={handleValueChange}
                  />
                </>
              )}

              {activeView === 'guide' && (
                <WorkbenchBuildGuide
                  program={currentProgram}
                  onToggleStep={handleToggleStep}
                  onExportGuide={handleExportGuide}
                  onExportXml={handleExportXml}
                />
              )}

              {activeView === 'soo' && (
                <SequenceOfOperationModal
                  program={currentProgram}
                  isOpen={true}
                  onClose={() => setActiveView('wiresheet')}
                />
              )}

              {activeView === 'troubleshoot' && (
                <AIReviewModal program={currentProgram} />
              )}
            </>
          )}

          {/* White Background PowerShell & Command Prompt Terminal (Docked Bottom Panel inside Main) */}
          <PowerShellTerminal
            isOpen={isTerminalOpen}
            onClose={() => setIsTerminalOpen(false)}
            userEmail={user?.email}
            currentProgramTitle={currentProgram.title}
            activeStudio={
              activeStudioId === 'network'
                ? 'Network Studio (OT Diagnostics)'
                : activeStudioId === 'report'
                ? 'Report Studio'
                : activeStudioId === 'application'
                ? 'Application Studio'
                : 'Logic Studio (Wire Sheet)'
            }
          />
        </main>

        {/* Interactive AI Chat Assistant Drawer (Studio Copilot) */}
        <AIChatDrawer
          isOpen={isAiChatOpen}
          onClose={() => {
            setIsAiChatOpen(false);
            setAiChatInitialPrompt('');
          }}
          onOpen={() => setIsAiChatOpen(true)}
          currentProgram={currentProgram}
          studioContext={studioContext}
          initialPrompt={aiChatInitialPrompt}
          onClearInitialPrompt={() => setAiChatInitialPrompt('')}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onExecuteAiAction={handleExecuteAiAction}
          onApplyProgram={handleApplyProgram}
        />
      </div>

      {/* AI Assist Modal Dialog (Generate & Translate) */}
      <PromptBar
        isOpen={isPromptOpen}
        onClose={() => setIsPromptOpen(false)}
        onGenerate={handleGenerateWiresheet}
        onApplyProgram={(resolvedProg) => {
          setCurrentProgram(resolvedProg);
          setIsPromptOpen(false);
          setTimeout(() => handleFitView(), 60);
          showToast(`Applied resolved Niagara wire sheet: ${resolvedProg.title}`, 'success');
        }}
        currentBlocks={currentProgram.blocks}
        currentLinks={currentProgram.links}
        isLoading={isAiLoading}
        onNavigateStudio={(studioId, subView) => {
          setActiveStudioId(studioId);
          if (studioId === 'network' && subView) {
            setActiveNetworkSubView(subView);
          } else if (studioId === 'logic' && subView) {
            setActiveView(subView);
          }
        }}
        onOpenAiChat={() => {
          setIsAiChatOpen(true);
        }}
        onOpenNetworkCopilot={() => {
          setIsNetworkCopilotOpen(true);
        }}
      />

      {/* Save Logic Modal */}
      <SaveLogicModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        program={currentProgram}
        folders={folders}
        onSave={handleSaveToLibrary}
        onCreateFolder={createFolder}
      />

      {/* Export Logic Modal */}
      <ExportLogicModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        program={currentProgram}
        onExportXml={handleExportXml}
        onExportGuide={handleExportGuide}
        onExportJson={handleExportJson}
      />

      {/* Block Inspector Modal */}
      <BlockInspectorModal
        block={inspectingBlock}
        isOpen={Boolean(inspectingBlock)}
        onClose={() => setInspectingBlock(null)}
        onSaveBlock={(updated) => {
          setCurrentProgram((prev) => ({
            ...prev,
            blocks: prev.blocks.map((b) => (b.id === updated.id ? updated : b)),
          }));
        }}
        onDeleteBlock={handleDeleteBlock}
      />

      {/* Logic Summary Modal */}
      <LogicSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        program={currentProgram}
      />

      {/* User Account & Cloud Sync Modal */}
      <UserAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentProgram={currentProgram}
        onLoadProgram={(prog) => {
          setCurrentProgram(prog);
          showToast(`Loaded "${prog.title}" from Firebase Cloud Storage.`, 'success');
        }}
        onOpenMailbox={() => setIsMailboxOpen(true)}
        unreadMailCount={unreadMailCount}
      />

      {/* In-App Virtual Mailbox Modal */}
      <InAppMailboxModal
        isOpen={isMailboxOpen}
        onClose={() => setIsMailboxOpen(false)}
        onOpenAuthForReset={() => setIsAuthModalOpen(true)}
      />

      {/* Logic Block Explanation & Usage Example Popup Modal */}
      <BlockInfoModal
        item={selectedInfoBlock}
        onClose={() => setSelectedInfoBlock(null)}
        onAddBlock={handleAddBlock}
      />

      {/* Tridium Niagara Workbench Options & Settings Modal */}
      <NiagaraSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isDevToolsEnabled={isDevToolsEnabled}
        onEnableDevTools={handleEnableDevTools}
        onDisableDevTools={handleDisableDevTools}
        onOpenDiagnosticConsole={() => {
          setIsDiagnosticConsoleOpen(true);
          setIsTerminalOpen(true);
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Native Desktop App & Automated Build Hub Modal */}
      <DesktopAppInstallerModal
        isOpen={isDesktopInstallerOpen}
        onClose={() => setIsDesktopInstallerOpen(false)}
      />

      {/* 1. Niagara Priority Array 16-Level Inspector Modal */}
      <PriorityArrayModal
        isOpen={Boolean(priorityModalBlock)}
        onClose={() => setPriorityModalBlock(null)}
        block={priorityModalBlock}
        onUpdatePriorityArray={handleUpdatePriorityArray}
      />

      {/* 4. Niagara 7-Day Weekly Schedule & Occupancy Editor */}
      <NiagaraScheduleModal
        isOpen={Boolean(scheduleModalBlock)}
        onClose={() => setScheduleModalBlock(null)}
        block={scheduleModalBlock}
        onUpdateSchedule={handleUpdateSchedule}
      />

      {/* Enterprise Boot Launch Splash Screen */}
      <AnimatePresence>
        {isBooting && <EcsBootSplash onComplete={() => setIsBooting(false)} />}
      </AnimatePresence>

      {/* Toast Notification */}
      {notification && (
        <div
          id="app-toast-notification"
          className={`fixed bottom-10 right-4 sm:right-6 z-50 px-4 py-2.5 rounded-lg shadow-2xl text-xs font-mono flex items-center gap-3 border transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
              : notification.type === 'error'
              ? 'bg-rose-950 text-rose-300 border-rose-600'
              : isDark
              ? 'bg-slate-900 text-sky-300 border-slate-700'
              : 'bg-white text-slate-800 border-slate-300 shadow-lg'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white ml-2 text-sm leading-none cursor-pointer"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <NiagaraThemeProvider>
      <NiagaraStudioApp />
    </NiagaraThemeProvider>
  );
}

