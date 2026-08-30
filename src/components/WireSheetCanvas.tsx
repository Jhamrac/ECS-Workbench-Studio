import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NiagaraBlock, NiagaraLink, NiagaraBlockStatus, DataType } from '../types/niagara';
import { NiagaraBlockNode } from './NiagaraBlockNode';
import { WireSvgRenderer } from './WireSvgRenderer';
import { WireSheetMinimap } from './WireSheetMinimap';
import { WireSheetAlignmentToolbar } from './WireSheetAlignmentToolbar';
import { NiagaraContextMenu, ContextMenuState } from './NiagaraContextMenu';
import { useNiagaraTheme } from '../context/NiagaraThemeContext';
import { DeviceAspectInfo } from '../hooks/useDeviceAspect';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Plus,
  Sparkles,
  Save,
  Zap,
  Trash2,
  X,
} from 'lucide-react';

interface WireSheetCanvasProps {
  blocks: NiagaraBlock[];
  links: NiagaraLink[];
  liveValues: Record<string, Record<string, any>>;
  liveStatuses: Record<string, NiagaraBlockStatus>;
  activeLinkIds: Set<string>;
  zoom: number;
  panOffset: { x: number; y: number };
  onPanChange: (offset: { x: number; y: number }) => void;
  onZoomChange: (zoom: number | ((prev: number) => number)) => void;
  selectedBlockId: string | null;
  selectedLinkId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  onSelectLink: (linkId: string | null) => void;
  onUpdateBlockPosition: (blockId: string, x: number, y: number) => void;
  onUpdateBlockSize?: (blockId: string, width: number, height?: number) => void;
  onDeleteBlock: (blockId: string) => void;
  onDeleteLink: (linkId: string) => void;
  onCreateLink: (fromBlockId: string, fromSlot: string, toBlockId: string, toSlot: string) => void;
  onOpenInspector: (block: NiagaraBlock) => void;
  onValueChange: (blockId: string, slotName: string, newValue: any) => void;
  isSimulating: boolean;
  aspectInfo: DeviceAspectInfo;
  onOpenPalette: () => void;
  onFitView: () => void;
  onAutoLayout: () => void;
  onAddBlockAtPosition?: (item: any, x: number, y: number) => void;
  onOpenPrompt?: () => void;
  onOpenSaveModal?: () => void;
  onOpenPriorityArray?: (block: NiagaraBlock) => void;
  onOpenScheduleEditor?: (block: NiagaraBlock) => void;
  onBatchUpdatePositions?: (updates: { id: string; x: number; y: number }[]) => void;
  onDuplicateBlock?: (block: NiagaraBlock) => void;
  onOverrideBlockValue?: (blockId: string, value: any) => void;
  onRelinquishBlock?: (blockId: string) => void;
  onOpenExport?: () => void;
}

export const WireSheetCanvas: React.FC<WireSheetCanvasProps> = ({
  blocks,
  links,
  liveValues,
  liveStatuses,
  activeLinkIds,
  zoom,
  panOffset,
  onPanChange,
  onZoomChange,
  selectedBlockId,
  selectedLinkId,
  onSelectBlock,
  onSelectLink,
  onUpdateBlockPosition,
  onUpdateBlockSize,
  onDeleteBlock,
  onDeleteLink,
  onCreateLink,
  onOpenInspector,
  onValueChange,
  isSimulating,
  aspectInfo,
  onOpenPalette,
  onFitView,
  onAutoLayout,
  onAddBlockAtPosition,
  onOpenPrompt,
  onOpenSaveModal,
  onOpenPriorityArray,
  onOpenScheduleEditor,
  onBatchUpdatePositions,
  onDuplicateBlock,
  onOverrideBlockValue,
  onRelinquishBlock,
  onOpenExport,
}) => {
  const { theme, isDark } = useNiagaraTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Dragging & Gesture states
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialPinchDist, setInitialPinchDist] = useState<number | null>(null);
  const [initialPinchZoom, setInitialPinchZoom] = useState<number>(1);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isLinkManagerOpen, setIsLinkManagerOpen] = useState(false);

  // Resizing states
  const [resizingBlockId, setResizingBlockId] = useState<string | null>(null);
  const [resizeStartSize, setResizeStartSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [resizeStartPos, setResizeStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // In-progress Wire State
  const [tempWire, setTempWire] = useState<{
    fromBlockId: string;
    fromSlot: string;
    fromKind: 'output' | 'input';
    fromDataType?: DataType;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    dragDist: number;
  } | null>(null);

  const [highlightedSlot, setHighlightedSlot] = useState<{
    blockId: string;
    slotName: string;
    kind: 'input' | 'output';
  } | null>(null);

  // Translucent Box-Marquee Selection states
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<{ x: number; y: number } | null>(null);
  const [multiSelectedBlockIds, setMultiSelectedBlockIds] = useState<string[]>([]);

  // Sync prop selectedBlockId to local selection
  useEffect(() => {
    if (selectedBlockId) {
      setMultiSelectedBlockIds((prev) => {
        if (prev.includes(selectedBlockId)) return prev;
        return [selectedBlockId];
      });
    } else {
      setMultiSelectedBlockIds([]);
    }
  }, [selectedBlockId]);

  // Helper to compute slot pin coordinates in canvas space
  const getSlotTerminalCoords = useCallback(
    (blockId: string, slotName: string, isInput: boolean) => {
      const block = blocks.find((b) => b.id === blockId);
      if (!block) return null;

      const blockWidth = block.width || 220;
      const headerHeight = 36;
      const slotRowHeight = 22;

      const blockInputs = block.inputs || [];
      const blockOutputs = block.outputs || [];

      if (isInput) {
        const slotIndex = blockInputs.findIndex((inp) => inp.name === slotName);
        const safeIndex = slotIndex >= 0 ? slotIndex : 0;
        const overallIndex = blockOutputs.length + safeIndex;
        const x = block.x;
        const y = block.y + headerHeight + overallIndex * slotRowHeight + (slotRowHeight / 2);
        return { x, y };
      } else {
        const slotIndex = blockOutputs.findIndex((out) => out.name === slotName);
        const safeIndex = slotIndex >= 0 ? slotIndex : 0;
        const overallIndex = safeIndex;
        const x = block.x + blockWidth;
        const y = block.y + headerHeight + overallIndex * slotRowHeight + (slotRowHeight / 2);
        return { x, y };
      }
    },
    [blocks]
  );

  // Helper to find slot target element under pointer
  const getSlotUnderPoint = useCallback((clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    if (!el) return null;

    const slotEl = el.closest('[data-slot-block-id]') as HTMLElement | null;
    if (!slotEl) return null;

    const blockId = slotEl.getAttribute('data-slot-block-id');
    const slotName = slotEl.getAttribute('data-slot-name');
    const kind = slotEl.getAttribute('data-slot-kind') as 'input' | 'output' | null;
    const type = slotEl.getAttribute('data-slot-type') as DataType | null;

    if (blockId && slotName && kind) {
      return { blockId, slotName, kind, type };
    }
    return null;
  }, []);

  // Complete a wire connection safely
  const completeWire = useCallback(
    (targetBlockId: string, targetSlot: string, targetKind: 'input' | 'output') => {
      if (!tempWire) return;

      // Cannot connect slot to itself or within same block if inappropriate
      if (tempWire.fromBlockId === targetBlockId) {
        setTempWire(null);
        setHighlightedSlot(null);
        return;
      }

      if (tempWire.fromKind === 'output' && targetKind === 'input') {
        onCreateLink(tempWire.fromBlockId, tempWire.fromSlot, targetBlockId, targetSlot);
      } else if (tempWire.fromKind === 'input' && targetKind === 'output') {
        onCreateLink(targetBlockId, targetSlot, tempWire.fromBlockId, tempWire.fromSlot);
      }

      setTempWire(null);
      setHighlightedSlot(null);
    },
    [tempWire, onCreateLink]
  );

  // Global Mouse / Pointer release and move listeners
  useEffect(() => {
    const handleGlobalRelease = (e: MouseEvent | TouchEvent) => {
      if (isPanning) {
        setIsPanning(false);
      }
      if (draggingBlockId) {
        setDraggingBlockId(null);
      }
      if (resizingBlockId) {
        setResizingBlockId(null);
      }

      if (marqueeStart) {
        setMarqueeStart(null);
        setMarqueeEnd(null);
        // If we multi-selected a single block, propagate it as the main selected block
        if (multiSelectedBlockIds.length === 1) {
          onSelectBlock(multiSelectedBlockIds[0]);
        } else if (multiSelectedBlockIds.length > 1) {
          // Keep multi-selection active local state, select the first one in parent
          onSelectBlock(multiSelectedBlockIds[0]);
        }
      }

      if (tempWire) {
        // Find if released over a target slot
        let clientX = 0;
        let clientY = 0;
        if ('touches' in e && e.changedTouches.length > 0) {
          clientX = e.changedTouches[0].clientX;
          clientY = e.changedTouches[0].clientY;
        } else if ('clientX' in e) {
          clientX = e.clientX;
          clientY = e.clientY;
        }

        const slotInfo = getSlotUnderPoint(clientX, clientY);
        if (slotInfo && slotInfo.blockId !== tempWire.fromBlockId && slotInfo.kind !== tempWire.fromKind) {
          completeWire(slotInfo.blockId, slotInfo.slotName, slotInfo.kind);
          return;
        }

        // If user dragged more than 10px and dropped in empty space, cancel
        if (tempWire.dragDist > 10) {
          setTempWire(null);
          setHighlightedSlot(null);
        }
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        onPanChange({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
        return;
      }

      // Handle multi-block marquee selection bounding checks
      if (marqueeStart) {
        setMarqueeEnd({ x: e.clientX, y: e.clientY });

        if (!containerRef.current) return;
        const canvasRect = containerRef.current.getBoundingClientRect();

        const wStart = {
          x: (marqueeStart.x - canvasRect.left - panOffset.x) / zoom,
          y: (marqueeStart.y - canvasRect.top - panOffset.y) / zoom,
        };
        const wEnd = {
          x: e.clientX - canvasRect.left - panOffset.x / zoom, // rough pointer coord
          y: e.clientY - canvasRect.top - panOffset.y / zoom,
        };

        // Real precise world-space coordinates
        const wx1 = (marqueeStart.x - canvasRect.left - panOffset.x) / zoom;
        const wy1 = (marqueeStart.y - canvasRect.top - panOffset.y) / zoom;
        const wx2 = (e.clientX - canvasRect.left - panOffset.x) / zoom;
        const wy2 = (e.clientY - canvasRect.top - panOffset.y) / zoom;

        const xMin = Math.min(wx1, wx2);
        const xMax = Math.max(wx1, wx2);
        const yMin = Math.min(wy1, wy2);
        const yMax = Math.max(wy1, wy2);

        const newlySelected: string[] = [];
        blocks.forEach((block) => {
          const bWidth = block.width || 220;
          const bHeight = block.height || 140;
          const intersects =
            block.x < xMax &&
            block.x + bWidth > xMin &&
            block.y < yMax &&
            block.y + bHeight > yMin;

          if (intersects) {
            newlySelected.push(block.id);
          }
        });

        setMultiSelectedBlockIds(newlySelected);
        return;
      }

      if (!containerRef.current) return;
      const canvasRect = containerRef.current.getBoundingClientRect();

      const mouseCanvasX = (e.clientX - canvasRect.left - panOffset.x) / zoom;
      const mouseCanvasY = (e.clientY - canvasRect.top - panOffset.y) / zoom;

      // Handle block resizing
      if (resizingBlockId) {
        const dx = mouseCanvasX - resizeStartPos.x;
        const dy = mouseCanvasY - resizeStartPos.y;
        const newWidth = Math.max(140, Math.round((resizeStartSize.width + dx) / 10) * 10);
        const newHeight = Math.max(60, Math.round((resizeStartSize.height + dy) / 10) * 10);
        onUpdateBlockSize?.(resizingBlockId, newWidth, newHeight);
        return;
      }

      // Handle block dragging with 10px snap-to-grid
      if (draggingBlockId) {
        const newX = Math.round((mouseCanvasX - dragOffset.x) / 10) * 10;
        const newY = Math.round((mouseCanvasY - dragOffset.y) / 10) * 10;
        onUpdateBlockPosition(draggingBlockId, newX, newY);
        return;
      }

      // Handle wire drawing & magnetic pin snapping
      if (tempWire) {
        const slotInfo = getSlotUnderPoint(e.clientX, e.clientY);
        let curX = mouseCanvasX;
        let curY = mouseCanvasY;

        if (
          slotInfo &&
          slotInfo.blockId !== tempWire.fromBlockId &&
          slotInfo.kind !== tempWire.fromKind
        ) {
          // Snap wire end to target pin!
          const coords = getSlotTerminalCoords(
            slotInfo.blockId,
            slotInfo.slotName,
            slotInfo.kind === 'input'
          );
          if (coords) {
            curX = coords.x;
            curY = coords.y;
          }
          setHighlightedSlot({
            blockId: slotInfo.blockId,
            slotName: slotInfo.slotName,
            kind: slotInfo.kind,
          });
        } else {
          setHighlightedSlot(null);
        }

        setTempWire((prev) =>
          prev
            ? {
                ...prev,
                currentX: curX,
                currentY: curY,
                dragDist: prev.dragDist + 1,
              }
            : null
        );
      }
    };

    window.addEventListener('mouseup', handleGlobalRelease);
    window.addEventListener('pointerup', handleGlobalRelease);
    window.addEventListener('touchend', handleGlobalRelease);
    window.addEventListener('touchcancel', handleGlobalRelease);

    if (isPanning || draggingBlockId || resizingBlockId || tempWire || marqueeStart) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
    }

    return () => {
      window.removeEventListener('mouseup', handleGlobalRelease);
      window.removeEventListener('pointerup', handleGlobalRelease);
      window.removeEventListener('touchend', handleGlobalRelease);
      window.removeEventListener('touchcancel', handleGlobalRelease);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [
    isPanning,
    draggingBlockId,
    resizingBlockId,
    resizeStartSize,
    resizeStartPos,
    tempWire,
    panStart,
    panOffset,
    zoom,
    dragOffset,
    onPanChange,
    onUpdateBlockPosition,
    onUpdateBlockSize,
    getSlotUnderPoint,
    getSlotTerminalCoords,
    completeWire,
    marqueeStart,
    marqueeEnd,
    blocks,
    multiSelectedBlockIds,
    onSelectBlock,
  ]);

  // Helper to check if event target is an interactive child or block
  const isInteractiveTarget = (target: HTMLElement | null): boolean => {
    if (!target) return false;
    return !!target.closest('[id^="niagara-block-"], button, input, select, textarea, [data-interactive="true"]');
  };

  // Mouse pan or marquee selection on empty canvas
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // If tempWire active and user clicks canvas, cancel wiring
    if (tempWire) {
      setTempWire(null);
      setHighlightedSlot(null);
      return;
    }

    if (isInteractiveTarget(e.target as HTMLElement)) return;

    if (e.button === 1 || (e.button === 0 && isSpacePressed)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      onSelectBlock(null);
      onSelectLink(null);
    } else if (e.button === 0) {
      // Start translucent marquee box selection
      setMarqueeStart({ x: e.clientX, y: e.clientY });
      setMarqueeEnd({ x: e.clientX, y: e.clientY });
      setMultiSelectedBlockIds([]);
      onSelectBlock(null);
      onSelectLink(null);
    }
  };

  // Block Mouse Down for positioning
  const handleBlockMouseDown = (e: React.MouseEvent, block: NiagaraBlock) => {
    if (isSpacePressed || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    if (e.button !== 0) return;

    e.stopPropagation();
    onSelectBlock(block.id);
    onSelectLink(null);
    setDraggingBlockId(block.id);

    const canvasRect = containerRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const mouseCanvasX = (e.clientX - canvasRect.left - panOffset.x) / zoom;
    const mouseCanvasY = (e.clientY - canvasRect.top - panOffset.y) / zoom;

    setDragOffset({
      x: mouseCanvasX - block.x,
      y: mouseCanvasY - block.y,
    });
  };

  // Touch Handlers for Mobile & Tablet
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      setInitialPinchDist(dist);
      setInitialPinchZoom(zoom);
      setIsPanning(false);
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (!isInteractiveTarget(e.target as HTMLElement)) {
        if (tempWire) {
          setTempWire(null);
          setHighlightedSlot(null);
          return;
        }
        setIsPanning(true);
        setPanStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
        onSelectBlock(null);
        onSelectLink(null);
      }
    }
  };

  // Wheel zoom & pan listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const zoomDelta = -e.deltaY * 0.0015;
        onZoomChange((prevZoom) => {
          return Math.min(2.0, Math.max(0.3, Number((prevZoom + zoomDelta).toFixed(2))));
        });
      } else {
        onPanChange({
          x: panOffset.x - (e.shiftKey ? e.deltaY : e.deltaX),
          y: panOffset.y - (e.shiftKey ? e.deltaX : e.deltaY),
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [panOffset, onPanChange, onZoomChange]);

  // Spacebar pan listener & Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTempWire(null);
        setHighlightedSlot(null);
      }
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        setIsSpacePressed(true);
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        if (selectedBlockId) {
          onDeleteBlock(selectedBlockId);
        } else if (selectedLinkId) {
          onDeleteLink(selectedLinkId);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedBlockId, selectedLinkId, onDeleteBlock, onDeleteLink]);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDist !== null) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const factor = dist / initialPinchDist;
      const newZoom = Math.min(2.0, Math.max(0.3, Number((initialPinchZoom * factor).toFixed(2))));
      onZoomChange(newZoom);
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (isPanning) {
        onPanChange({
          x: touch.clientX - panStart.x,
          y: touch.clientY - panStart.y,
        });
        return;
      }

      const canvasRect = containerRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const mouseCanvasX = (touch.clientX - canvasRect.left - panOffset.x) / zoom;
      const mouseCanvasY = (touch.clientY - canvasRect.top - panOffset.y) / zoom;

      if (resizingBlockId) {
        const dx = mouseCanvasX - resizeStartPos.x;
        const dy = mouseCanvasY - resizeStartPos.y;
        const newWidth = Math.max(140, Math.round((resizeStartSize.width + dx) / 10) * 10);
        const newHeight = Math.max(60, Math.round((resizeStartSize.height + dy) / 10) * 10);
        onUpdateBlockSize?.(resizingBlockId, newWidth, newHeight);
      }

      if (draggingBlockId) {
        const newX = Math.round((mouseCanvasX - dragOffset.x) / 10) * 10;
        const newY = Math.round((mouseCanvasY - dragOffset.y) / 10) * 10;
        onUpdateBlockPosition(draggingBlockId, newX, newY);
      }

      if (tempWire) {
        const slotInfo = getSlotUnderPoint(touch.clientX, touch.clientY);
        let curX = mouseCanvasX;
        let curY = mouseCanvasY;

        if (
          slotInfo &&
          slotInfo.blockId !== tempWire.fromBlockId &&
          slotInfo.kind !== tempWire.fromKind
        ) {
          const coords = getSlotTerminalCoords(
            slotInfo.blockId,
            slotInfo.slotName,
            slotInfo.kind === 'input'
          );
          if (coords) {
            curX = coords.x;
            curY = coords.y;
          }
          setHighlightedSlot({
            blockId: slotInfo.blockId,
            slotName: slotInfo.slotName,
            kind: slotInfo.kind,
          });
        } else {
          setHighlightedSlot(null);
        }

        setTempWire((prev) =>
          prev
            ? {
                ...prev,
                currentX: curX,
                currentY: curY,
                dragDist: prev.dragDist + 1,
              }
            : null
        );
      }
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    setInitialPinchDist(null);
    setDraggingBlockId(null);
    setResizingBlockId(null);
  };

  const handleBlockTouchStart = (e: React.TouchEvent, block: NiagaraBlock) => {
    if (e.touches.length === 1) {
      e.stopPropagation();
      const touch = e.touches[0];
      onSelectBlock(block.id);
      onSelectLink(null);
      setDraggingBlockId(block.id);

      const canvasRect = containerRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const mouseCanvasX = (touch.clientX - canvasRect.left - panOffset.x) / zoom;
      const mouseCanvasY = (touch.clientY - canvasRect.top - panOffset.y) / zoom;

      setDragOffset({
        x: mouseCanvasX - block.x,
        y: mouseCanvasY - block.y,
      });
    }
  };

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, block: NiagaraBlock) => {
    e.stopPropagation();
    if ('preventDefault' in e) e.preventDefault();
    onSelectBlock(block.id);
    onSelectLink(null);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const canvasRect = containerRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const mouseCanvasX = (clientX - canvasRect.left - panOffset.x) / zoom;
    const mouseCanvasY = (clientY - canvasRect.top - panOffset.y) / zoom;

    setResizingBlockId(block.id);
    setResizeStartSize({
      width: block.width || 220,
      height: block.height || (36 + ((block.inputs || []).length + (block.outputs || []).length) * 22),
    });
    setResizeStartPos({
      x: mouseCanvasX,
      y: mouseCanvasY,
    });
  };

  // Start wire from output OR input pin
  const handleStartWire = (
    blockId: string,
    slotName: string,
    slotKind: 'output' | 'input',
    dataType: DataType,
    clientX: number,
    clientY: number
  ) => {
    // If tempWire already exists, check if this is a click-to-connect destination
    if (tempWire) {
      if (tempWire.fromBlockId !== blockId && tempWire.fromKind !== slotKind) {
        completeWire(blockId, slotName, slotKind);
        return;
      }
      // If clicking same pin again, cancel
      setTempWire(null);
      setHighlightedSlot(null);
      return;
    }

    const coords = getSlotTerminalCoords(blockId, slotName, slotKind === 'input');
    const canvasRect = containerRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const startX = coords
      ? coords.x
      : (clientX - canvasRect.left - panOffset.x) / zoom;
    const startY = coords
      ? coords.y
      : (clientY - canvasRect.top - panOffset.y) / zoom;

    setTempWire({
      fromBlockId: blockId,
      fromSlot: slotName,
      fromKind: slotKind,
      fromDataType: dataType,
      startX,
      startY,
      currentX: startX,
      currentY: startY,
      dragDist: 0,
    });
  };

  // Drop wire on pin
  const handleDropWire = (targetBlockId: string, targetSlot: string, targetKind: 'output' | 'input') => {
    if (!tempWire) return;
    completeWire(targetBlockId, targetSlot, targetKind);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;
      const item = JSON.parse(data);
      const canvasRect = containerRef.current?.getBoundingClientRect();
      if (!canvasRect) return;
      const x = Math.max(20, Math.round((e.clientX - canvasRect.left - panOffset.x) / zoom / 10) * 10);
      const y = Math.max(20, Math.round((e.clientY - canvasRect.top - panOffset.y) / zoom / 10) * 10);
      if (onAddBlockAtPosition) {
        onAddBlockAtPosition(item, x, y);
      }
    } catch (err) {
      console.error('Failed to parse dropped palette item', err);
    }
  };

  return (
    <div
      ref={containerRef}
      id="wiresheet-canvas-container"
      data-canvas-bg="true"
      onMouseDown={handleCanvasMouseDown}
      onContextMenu={(e) => {
        // Prevent default browser context menu
        e.preventDefault();
        const bounds = containerRef.current?.getBoundingClientRect();
        const canvasX = (e.clientX - (bounds?.left || 0) - panOffset.x) / zoom;
        const canvasY = (e.clientY - (bounds?.top || 0) - panOffset.y) / zoom;
        setContextMenu({
          x: e.clientX,
          y: e.clientY,
          canvasX,
          canvasY,
          targetType: 'canvas',
        });
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative flex-1 h-full w-full overflow-hidden select-none touch-none ${
        isPanning ? 'cursor-grabbing' : isSpacePressed ? 'cursor-grab' : 'cursor-default'
      } ${isDark ? 'bg-[#080f1d]' : 'bg-[#e2e8f0]'}`}
      style={{
        backgroundImage: isDark
          ? `linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`
          : `linear-gradient(to right, rgba(0, 0, 0, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.08) 1px, transparent 1px)`,
        backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
        backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
      }}
    >
      {/* Translucent Marquee Selection Rectangle Box overlay */}
      {marqueeStart && marqueeEnd && (
        <div
          className="absolute border border-sky-500 bg-sky-500/15 rounded pointer-events-none z-20 shadow-[0_0_8px_rgba(56,189,248,0.25)]"
          style={{
            left: Math.min(marqueeStart.x, marqueeEnd.x) - (containerRef.current?.getBoundingClientRect().left || 0),
            top: Math.min(marqueeStart.y, marqueeEnd.y) - (containerRef.current?.getBoundingClientRect().top || 0),
            width: Math.abs(marqueeStart.x - marqueeEnd.x),
            height: Math.abs(marqueeStart.y - marqueeEnd.y),
          }}
        />
      )}
      {/* Canvas Zoom & Pan Container Layer */}
      <div
        className="absolute inset-0 origin-top-left pointer-events-auto"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          width: '5000px',
          height: '4000px',
        }}
      >
        {/* Wire SVG Connection Lines Layer */}
        <WireSvgRenderer
          links={links}
          blocks={blocks}
          activeLinkIds={activeLinkIds}
          selectedLinkId={selectedLinkId}
          onSelectLink={onSelectLink}
          onDeleteLink={onDeleteLink}
          onContextMenuLink={(e, link) => {
            setContextMenu({
              x: e.clientX,
              y: e.clientY,
              canvasX: (e.clientX - panOffset.x) / zoom,
              canvasY: (e.clientY - panOffset.y) / zoom,
              targetType: 'link',
              link,
            });
          }}
          tempWire={tempWire}
          zoom={zoom}
        />

        {/* Niagara Blocks Component Nodes */}
        {(blocks || []).map((block) => (
          <div
            key={block.id}
            onMouseDown={(e) => handleBlockMouseDown(e, block)}
            onTouchStart={(e) => handleBlockTouchStart(e, block)}
          >
            <NiagaraBlockNode
              block={block}
              liveValues={liveValues[block.id] || {}}
              liveStatus={liveStatuses[block.id] || { ok: true }}
              isSelected={selectedBlockId === block.id || multiSelectedBlockIds.includes(block.id)}
              onSelect={onSelectBlock}
              onDelete={onDeleteBlock}
              onOpenInspector={onOpenInspector}
              onOpenPriorityArray={onOpenPriorityArray}
              onOpenScheduleEditor={onOpenScheduleEditor}
              onContextMenu={(e, blk) => {
                onSelectBlock(blk.id);
                setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  canvasX: (e.clientX - panOffset.x) / zoom,
                  canvasY: (e.clientY - panOffset.y) / zoom,
                  targetType: 'block',
                  block: blk,
                });
              }}
              onStartWire={handleStartWire}
              onDropWire={handleDropWire}
              onValueChange={onValueChange}
              isSimulating={isSimulating}
              isTouch={aspectInfo.isTouch}
              highlightedSlot={highlightedSlot}
              onResizeStart={handleResizeStart}
            />
          </div>
        ))}
      </div>



      {/* In-Progress Wire Helper Notification Banner */}
      {tempWire && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3.5 py-1.5 rounded-full shadow-2xl border backdrop-blur-md bg-sky-950/90 border-sky-400 text-white animate-in fade-in duration-150">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          <span className="text-xs font-mono">
            Wiring from <strong className="text-amber-300">{tempWire.fromSlot}</strong> ({tempWire.fromKind}) — click destination pin or drag to connect
          </span>
          <button
            onClick={() => {
              setTempWire(null);
              setHighlightedSlot(null);
            }}
            className="ml-2 text-sky-300 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded bg-sky-900/60 cursor-pointer"
          >
            Cancel (Esc)
          </button>
        </div>
      )}

      {/* Floating Selected Wire Delete Banner (Top Center) */}
      {selectedLinkId && (() => {
        const selLink = links.find((l) => l.id === selectedLinkId);
        if (!selLink) return null;
        const fromBlock = blocks.find((b) => b.id === selLink.fromBlockId);
        const toBlock = blocks.find((b) => b.id === selLink.toBlockId);

        return (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-3.5 py-2 rounded-xl shadow-2xl border backdrop-blur-md bg-red-950/90 border-red-500 text-white animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-slate-200">Wire:</span>
              <span className="text-amber-300 font-bold">
                {fromBlock?.name || selLink.fromBlockId}.{selLink.fromSlot}
              </span>
              <span className="text-red-400 font-bold">➔</span>
              <span className="text-amber-300 font-bold">
                {toBlock?.name || selLink.toBlockId}.{selLink.toSlot}
              </span>
            </div>

            <button
              id="banner-delete-wire-btn"
              onClick={() => onDeleteLink(selLink.id)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3 py-1 rounded-lg cursor-pointer flex items-center gap-1 shadow-md border border-red-400/30 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Wire</span>
            </button>

            <button
              onClick={() => onSelectLink(null)}
              className="text-slate-300 hover:text-white text-xs px-2 py-1 rounded cursor-pointer font-bold"
              title="Deselect Wire"
            >
              ✕
            </button>
          </div>
        );
      })()}

      {/* Wire Link Management Modal */}
      {isLinkManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className={`w-full max-w-xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[85vh] ${
              isDark
                ? 'bg-[#07152b] border-[#183a6f] text-slate-100'
                : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            <div className="px-4 py-3 border-b flex items-center justify-between bg-[#00529b] text-white">
              <div className="flex items-center gap-2">
                <Zap className="w-4.5 h-4.5 text-amber-300" />
                <h3 className="font-bold text-sm">Wire Sheet Interconnects ({links.length})</h3>
              </div>
              <button
                onClick={() => setIsLinkManagerOpen(false)}
                className="p-1 text-white/80 hover:text-white rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {(links || []).length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-mono">
                  No wire connections on this Wire Sheet.
                </div>
              ) : (
                (links || []).map((link) => {
                  const fromBlock = (blocks || []).find((b) => b.id === link.fromBlockId);
                  const toBlock = (blocks || []).find((b) => b.id === link.toBlockId);
                  const isSelected = selectedLinkId === link.id;

                  return (
                    <div
                      key={link.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 font-mono text-xs transition-colors ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 text-amber-200'
                          : isDark
                          ? 'bg-[#0b1b36] border-[#163868] hover:border-slate-500'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sky-400">
                            {fromBlock?.name || link.fromBlockId}
                          </span>
                          <span className="text-slate-400 text-[10px]">.{link.fromSlot}</span>
                          <span className="text-amber-400 font-bold">➔</span>
                          <span className="font-bold text-emerald-400">
                            {toBlock?.name || link.toBlockId}
                          </span>
                          <span className="text-slate-400 text-[10px]">.{link.toSlot}</span>
                        </div>
                        <div className="mt-1">
                          {(() => {
                            const sig = (link.signalType || 'boolean').toLowerCase();
                            let c = 'bg-gray-600 text-white';
                            if (sig === 'boolean') c = 'bg-emerald-600 text-white';
                            else if (sig === 'numeric' || sig === 'double') c = 'bg-purple-600 text-white';
                            else if (sig === 'enum') c = 'bg-orange-600 text-white';
                            else if (sig === 'string') c = 'bg-gray-600 text-white';
                            return (
                              <span className={`text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded ${c}`}>
                                Signal: {link.signalType || 'boolean'}
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onDeleteLink(link.id);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 shadow-sm shrink-0"
                        title="Delete wire connection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t flex justify-between items-center text-xs font-mono opacity-80">
              <span>Select or delete any wire link</span>
              <button
                onClick={() => setIsLinkManagerOpen(false)}
                className="px-4 py-1.5 rounded-lg font-bold bg-slate-700 hover:bg-slate-600 text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Canvas Quick Info Pill (Bottom Left) */}
      <div
        className={`hidden sm:flex absolute bottom-3 left-3 text-[11px] font-mono px-3 py-1.5 rounded-lg shadow-lg items-center gap-3 backdrop-blur-md pointer-events-none border ${
          isDark
            ? 'bg-slate-900/90 border-slate-700 text-slate-300'
            : 'bg-white/90 border-slate-300 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-semibold">{blocks.length} Blocks</span>
        </div>
        <div className="w-[1px] h-3 bg-slate-400/40"></div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-500"></span>
          <span className="font-semibold">{links.length} Links</span>
        </div>
        <div className="w-[1px] h-3 bg-slate-400/40"></div>
        <span className="opacity-80">
          {aspectInfo.isTouch
            ? 'Touch pins to wire • Drag block to position'
            : 'Drag/click output or input pin to wire • Double click block to inspect'}
        </span>
      </div>

      {/* Responsive Floating Controls (Bottom Right - Zoom / Fit) */}
      <div
        id="floating-canvas-controls"
        className={`absolute bottom-3 right-3 flex items-center gap-1.5 p-1 rounded-xl shadow-xl border backdrop-blur-md z-30 ${
          isDark
            ? 'bg-slate-900/95 border-slate-700 text-slate-200'
            : 'bg-white/95 border-slate-300 text-slate-800'
        }`}
      >
        <button
          onClick={() => onZoomChange((z) => Math.min(2.0, Number((z + 0.1).toFixed(1))))}
          title="Zoom In (+)"
          className={`p-2 rounded-lg cursor-pointer transition-colors ${
            isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
          }`}
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <span className="text-[10px] font-mono font-bold px-1 text-slate-400">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => onZoomChange((z) => Math.max(0.3, Number((z - 0.1).toFixed(1))))}
          title="Zoom Out (-)"
          className={`p-2 rounded-lg cursor-pointer transition-colors ${
            isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
          }`}
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={onFitView}
          title="Auto Fit to Device Aspect Ratio"
          className={`p-2 rounded-lg cursor-pointer transition-colors text-sky-500 ${
            isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
          }`}
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Wire Sheet Interactive Minimap */}
      <WireSheetMinimap
        blocks={blocks}
        links={links}
        panOffset={panOffset}
        zoom={zoom}
        containerWidth={containerRef.current?.clientWidth || 1200}
        containerHeight={containerRef.current?.clientHeight || 800}
        onPanChange={onPanChange}
        selectedBlockId={selectedBlockId}
        onSelectBlock={(id) => onSelectBlock(id)}
      />

      {/* Wire Sheet Alignment Toolbar for multi-selected blocks */}
      {multiSelectedBlockIds.length > 1 && onBatchUpdatePositions && (
        <WireSheetAlignmentToolbar
          selectedBlockIds={multiSelectedBlockIds}
          blocks={blocks}
          onBatchUpdatePositions={onBatchUpdatePositions}
        />
      )}

      {/* Floating Niagara Right-Click Context Menu */}
      <NiagaraContextMenu
        menu={contextMenu}
        onClose={() => setContextMenu(null)}
        onOpenInspector={onOpenInspector}
        onOpenPriorityArray={onOpenPriorityArray}
        onOpenScheduleEditor={onOpenScheduleEditor}
        onDeleteBlock={onDeleteBlock}
        onDuplicateBlock={onDuplicateBlock}
        onOverrideBlockValue={onOverrideBlockValue}
        onRelinquishBlock={onRelinquishBlock}
        onDeleteLink={onDeleteLink}
        onAddBlockAtPosition={(x, y) => {
          onOpenPalette();
        }}
        onAutoLayout={onAutoLayout}
        onResetZoom={onFitView}
        onOpenExport={onOpenExport}
      />
    </div>
  );
};
