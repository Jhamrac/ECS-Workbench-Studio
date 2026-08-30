import React, { useEffect, useRef } from 'react';
import { NiagaraBlock, NiagaraLink } from '../types/niagara';
import {
  Layers,
  Settings,
  Calendar,
  Trash2,
  Copy,
  PlusCircle,
  LayoutGrid,
  Maximize2,
  Sliders,
  RotateCcw,
  Check,
  X,
  Link2Off,
  Radio,
  Download,
} from 'lucide-react';

export interface ContextMenuState {
  x: number;
  y: number;
  canvasX: number;
  canvasY: number;
  targetType: 'block' | 'link' | 'canvas';
  block?: NiagaraBlock;
  link?: NiagaraLink;
}

interface NiagaraContextMenuProps {
  menu: ContextMenuState | null;
  onClose: () => void;
  onOpenInspector?: (block: NiagaraBlock) => void;
  onOpenPriorityArray?: (block: NiagaraBlock) => void;
  onOpenScheduleEditor?: (block: NiagaraBlock) => void;
  onDeleteBlock?: (blockId: string) => void;
  onDuplicateBlock?: (block: NiagaraBlock) => void;
  onOverrideBlockValue?: (blockId: string, value: any) => void;
  onRelinquishBlock?: (blockId: string) => void;
  onDeleteLink?: (linkId: string) => void;
  onAddBlockAtPosition?: (x: number, y: number) => void;
  onAutoLayout?: () => void;
  onResetZoom?: () => void;
  onOpenExport?: () => void;
}

export const NiagaraContextMenu: React.FC<NiagaraContextMenuProps> = ({
  menu,
  onClose,
  onOpenInspector,
  onOpenPriorityArray,
  onOpenScheduleEditor,
  onDeleteBlock,
  onDuplicateBlock,
  onOverrideBlockValue,
  onRelinquishBlock,
  onDeleteLink,
  onAddBlockAtPosition,
  onAutoLayout,
  onResetZoom,
  onOpenExport,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (menu) {
      window.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menu, onClose]);

  if (!menu) return null;

  // Position adjustments to prevent overflowing browser window
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const menuWidth = 230;
  const menuHeight = 320;

  const adjustedX = menu.x + menuWidth > windowWidth ? windowWidth - menuWidth - 10 : menu.x;
  const adjustedY = menu.y + menuHeight > windowHeight ? windowHeight - menuHeight - 10 : menu.y;

  const isWritable =
    menu.block &&
    (menu.block.type.includes('Writable') ||
      menu.block.palette?.includes('points') ||
      menu.block.type.includes('Point') ||
      menu.block.properties?.priorityArray !== undefined ||
      menu.block.properties?.fallbackValue !== undefined);
  const isSchedule = menu.block && menu.block.type.includes('Schedule');

  return (
    <div
      ref={menuRef}
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      className="fixed z-50 w-60 rounded-xl bg-slate-900 border-2 border-slate-600 text-slate-100 shadow-2xl backdrop-blur-md text-xs py-2 font-sans divide-y divide-slate-800 animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      {/* 1. Context Menu Header (Niagara Wire Sheet Context) */}
      <div className="px-3 py-1.5 text-xs font-black text-slate-100 uppercase tracking-wider flex items-center justify-between bg-slate-800/80">
        <span className="truncate max-w-[140px]">
          {menu.targetType === 'block' && menu.block
            ? menu.block.name
            : menu.targetType === 'link'
            ? 'Wire Link'
            : 'Wire Sheet Canvas'}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-600 text-white font-mono font-bold">
          N4 Context
        </span>
      </div>

      {/* 2. Block Target Menu Options */}
      {menu.targetType === 'block' && menu.block && (
        <div className="py-1">
          {/* Priority Array Inspector */}
          {isWritable && onOpenPriorityArray && (
            <button
              onClick={() => {
                onOpenPriorityArray(menu.block!);
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-amber-500/20 hover:text-amber-300 text-amber-200 transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>16-Level Priority Array...</span>
            </button>
          )}

          {/* Quick Override Options for Writables */}
          {isWritable && onOverrideBlockValue && (
            <div className="px-3 py-1 bg-slate-800/50 my-1 rounded-sm">
              <div className="text-[9px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Radio className="w-3 h-3 text-sky-400" /> Priority 8 Manual Override:
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    onOverrideBlockValue(menu.block!.id, true);
                    onClose();
                  }}
                  className="flex-1 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-800 text-emerald-300 border border-emerald-700 font-bold text-[10px] flex items-center justify-center gap-1"
                >
                  <Check className="w-2.5 h-2.5" /> True
                </button>
                <button
                  onClick={() => {
                    onOverrideBlockValue(menu.block!.id, false);
                    onClose();
                  }}
                  className="flex-1 py-0.5 rounded bg-rose-950/80 hover:bg-rose-800 text-rose-300 border border-rose-700 font-bold text-[10px] flex items-center justify-center gap-1"
                >
                  <X className="w-2.5 h-2.5" /> False
                </button>
                {onRelinquishBlock && (
                  <button
                    onClick={() => {
                      onRelinquishBlock(menu.block!.id);
                      onClose();
                    }}
                    title="Relinquish Priority Overrides to Auto"
                    className="py-0.5 px-1.5 rounded bg-amber-950/80 hover:bg-amber-800 text-amber-300 border border-amber-700 font-bold text-[10px]"
                  >
                    Auto
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Schedule Editor */}
          {isSchedule && onOpenScheduleEditor && (
            <button
              onClick={() => {
                onOpenScheduleEditor(menu.block!);
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-sky-500/20 hover:text-sky-300 text-sky-200 transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <span>7-Day Schedule Editor...</span>
            </button>
          )}

          {/* Property Sheet / Inspector */}
          {onOpenInspector && (
            <button
              onClick={() => {
                onOpenInspector(menu.block!);
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Property Sheet...</span>
            </button>
          )}

          {/* Duplicate Block */}
          {onDuplicateBlock && (
            <button
              onClick={() => {
                onDuplicateBlock(menu.block!);
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Duplicate Block</span>
            </button>
          )}

          {/* Delete Block */}
          {onDeleteBlock && (
            <button
              onClick={() => {
                onDeleteBlock(menu.block!.id);
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-rose-500/20 hover:text-rose-300 text-rose-300 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Delete Block</span>
            </button>
          )}
        </div>
      )}

      {/* 3. Link/Wire Target Options */}
      {menu.targetType === 'link' && menu.link && (
        <div className="py-1">
          {onDeleteLink && (
            <button
              onClick={() => {
                onDeleteLink(menu.link!.id);
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-rose-500/20 hover:text-rose-300 text-rose-300 transition-colors cursor-pointer"
            >
              <Link2Off className="w-3.5 h-3.5 text-rose-400" />
              <span>Delete Connection Wire</span>
            </button>
          )}
        </div>
      )}

      {/* 4. Canvas Background Context Options */}
      {menu.targetType === 'canvas' && (
        <div className="py-1">
          {onAddBlockAtPosition && (
            <button
              onClick={() => {
                onAddBlockAtPosition(menu.canvasX, menu.canvasY);
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-sky-500/20 hover:text-sky-300 text-sky-200 transition-colors cursor-pointer font-medium"
            >
              <PlusCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>Add Block Here...</span>
            </button>
          )}

          {onAutoLayout && (
            <button
              onClick={() => {
                onAutoLayout();
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
              <span>Auto-Arrange Layout</span>
            </button>
          )}

          {onResetZoom && (
            <button
              onClick={() => {
                onResetZoom();
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Pan & Zoom</span>
            </button>
          )}

          {onOpenExport && (
            <button
              id="context-menu-export-btn"
              onClick={() => {
                onOpenExport();
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-sky-500/20 hover:text-sky-300 text-sky-200 border-t border-slate-800/80 transition-colors cursor-pointer font-semibold"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Export Wire Sheet...</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
