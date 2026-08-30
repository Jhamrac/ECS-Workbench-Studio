import React from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Grid,
  Layers,
  ArrowLeftRight,
  ArrowUpDown,
} from 'lucide-react';
import { NiagaraBlock } from '../types/niagara';
import { useNiagaraTheme } from '../context/NiagaraThemeContext';

interface WireSheetAlignmentToolbarProps {
  selectedBlockIds: string[];
  blocks: NiagaraBlock[];
  onBatchUpdatePositions: (updates: { id: string; x: number; y: number }[]) => void;
}

export const WireSheetAlignmentToolbar: React.FC<WireSheetAlignmentToolbarProps> = ({
  selectedBlockIds,
  blocks,
  onBatchUpdatePositions,
}) => {
  const { theme, isDark } = useNiagaraTheme();

  if (selectedBlockIds.length < 2) return null;

  const targetBlocks = blocks.filter((b) => selectedBlockIds.includes(b.id));
  if (targetBlocks.length < 2) return null;

  // Align Left
  const handleAlignLeft = () => {
    const minX = Math.min(...targetBlocks.map((b) => b.x));
    const updates = targetBlocks.map((b) => ({ id: b.id, x: minX, y: b.y }));
    onBatchUpdatePositions(updates);
  };

  // Align Center X
  const handleAlignCenterX = () => {
    const avgCenterX =
      targetBlocks.reduce((acc, b) => acc + b.x + (b.width || 170) / 2, 0) / targetBlocks.length;
    const updates = targetBlocks.map((b) => ({
      id: b.id,
      x: Math.round(avgCenterX - (b.width || 170) / 2),
      y: b.y,
    }));
    onBatchUpdatePositions(updates);
  };

  // Align Right
  const handleAlignRight = () => {
    const maxRight = Math.max(...targetBlocks.map((b) => b.x + (b.width || 170)));
    const updates = targetBlocks.map((b) => ({
      id: b.id,
      x: maxRight - (b.width || 170),
      y: b.y,
    }));
    onBatchUpdatePositions(updates);
  };

  // Align Top
  const handleAlignTop = () => {
    const minY = Math.min(...targetBlocks.map((b) => b.y));
    const updates = targetBlocks.map((b) => ({ id: b.id, x: b.x, y: minY }));
    onBatchUpdatePositions(updates);
  };

  // Align Center Y
  const handleAlignCenterY = () => {
    const avgCenterY =
      targetBlocks.reduce((acc, b) => acc + b.y + (b.height || 140) / 2, 0) / targetBlocks.length;
    const updates = targetBlocks.map((b) => ({
      id: b.id,
      x: b.x,
      y: Math.round(avgCenterY - (b.height || 140) / 2),
    }));
    onBatchUpdatePositions(updates);
  };

  // Align Bottom
  const handleAlignBottom = () => {
    const maxBottom = Math.max(...targetBlocks.map((b) => b.y + (b.height || 140)));
    const updates = targetBlocks.map((b) => ({
      id: b.id,
      x: b.x,
      y: maxBottom - (b.height || 140),
    }));
    onBatchUpdatePositions(updates);
  };

  // Distribute Horizontally
  const handleDistributeHorizontal = () => {
    const sorted = [...targetBlocks].sort((a, b) => a.x - b.x);
    const minX = sorted[0].x;
    const maxX = sorted[sorted.length - 1].x;
    const step = (maxX - minX) / (sorted.length - 1);

    const updates = sorted.map((b, idx) => ({
      id: b.id,
      x: Math.round(minX + idx * step),
      y: b.y,
    }));
    onBatchUpdatePositions(updates);
  };

  // Distribute Vertically
  const handleDistributeVertical = () => {
    const sorted = [...targetBlocks].sort((a, b) => a.y - b.y);
    const minY = sorted[0].y;
    const maxY = sorted[sorted.length - 1].y;
    const step = (maxY - minY) / (sorted.length - 1);

    const updates = sorted.map((b, idx) => ({
      id: b.id,
      x: b.x,
      y: Math.round(minY + idx * step),
    }));
    onBatchUpdatePositions(updates);
  };

  // Snap Selected to 20px Grid
  const handleSnapToGrid = () => {
    const updates = targetBlocks.map((b) => ({
      id: b.id,
      x: Math.round(b.x / 20) * 20,
      y: Math.round(b.y / 20) * 20,
    }));
    onBatchUpdatePositions(updates);
  };

  return (
    <div
      className={`fixed top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 p-1.5 rounded-lg shadow-2xl border text-xs font-mono transition-all animate-in slide-in-from-top duration-200 ${
        isDark ? 'bg-[#0f1d32]/95 border-[#1c3358] text-slate-200' : 'bg-white/95 border-slate-300 text-slate-800'
      }`}
    >
      <div className="flex items-center gap-1 px-2 border-r border-slate-300 dark:border-slate-700">
        <Layers className="w-3.5 h-3.5 text-[#44b33c]" />
        <span className="font-bold text-[11px] font-sans">{selectedBlockIds.length} Selected</span>
      </div>

      {/* Horizontal Alignments */}
      <div className="flex items-center gap-0.5 px-1 border-r border-slate-300 dark:border-slate-700">
        <button
          onClick={handleAlignLeft}
          title="Align Left Edges"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleAlignCenterX}
          title="Align Horizontal Center"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleAlignRight}
          title="Align Right Edges"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Vertical Alignments */}
      <div className="flex items-center gap-0.5 px-1 border-r border-slate-300 dark:border-slate-700">
        <button
          onClick={handleAlignTop}
          title="Align Top Edges"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <AlignStartVertical className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleAlignCenterY}
          title="Align Vertical Center"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <AlignCenterVertical className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleAlignBottom}
          title="Align Bottom Edges"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <AlignEndVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Distribution */}
      <div className="flex items-center gap-0.5 px-1 border-r border-slate-300 dark:border-slate-700">
        <button
          onClick={handleDistributeHorizontal}
          title="Distribute Horizontally"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDistributeVertical}
          title="Distribute Vertically"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Snap to Grid */}
      <button
        onClick={handleSnapToGrid}
        title="Snap All Selected Blocks to 20px Grid"
        className="flex items-center gap-1 px-2 py-1 rounded bg-[#00529b] hover:bg-[#00386b] text-white font-sans font-bold text-[11px] transition-colors ml-1 cursor-pointer"
      >
        <Grid className="w-3 h-3" />
        <span>Grid Snap</span>
      </button>
    </div>
  );
};
