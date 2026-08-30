import React, { useState } from 'react';
import { NiagaraBlock, NiagaraBlockStatus, DataType } from '../types/niagara';
import {
  Settings,
  Trash2,
  Sliders,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Activity,
  Zap,
  Clock,
  Layers,
  CircleDot,
  Calendar,
  Shuffle,
  Binary,
} from 'lucide-react';
import { useNiagaraTheme } from '../context/NiagaraThemeContext';

interface NiagaraBlockNodeProps {
  block: NiagaraBlock;
  liveValues: Record<string, any>;
  liveStatus: NiagaraBlockStatus;
  isSelected: boolean;
  onSelect: (blockId: string) => void;
  onDelete: (blockId: string) => void;
  onOpenInspector: (block: NiagaraBlock) => void;
  onOpenPriorityArray?: (block: NiagaraBlock) => void;
  onOpenScheduleEditor?: (block: NiagaraBlock) => void;
  onContextMenu?: (e: React.MouseEvent, block: NiagaraBlock) => void;
  onStartWire: (
    blockId: string,
    slotName: string,
    slotKind: 'output' | 'input',
    dataType: DataType,
    clientX: number,
    clientY: number
  ) => void;
  onDropWire: (blockId: string, slotName: string, slotKind: 'output' | 'input') => void;
  onValueChange: (blockId: string, slotName: string, newValue: any) => void;
  isSimulating: boolean;
  isTouch?: boolean;
  highlightedSlot?: { blockId: string; slotName: string; kind: 'input' | 'output' } | null;
  onResizeStart?: (e: React.MouseEvent | React.TouchEvent, block: NiagaraBlock) => void;
}

export const NiagaraBlockNode: React.FC<NiagaraBlockNodeProps> = ({
  block,
  liveValues,
  liveStatus,
  isSelected,
  onSelect,
  onDelete,
  onOpenInspector,
  onOpenPriorityArray,
  onOpenScheduleEditor,
  onContextMenu,
  onStartWire,
  onDropWire,
  onValueChange,
  isTouch = false,
  highlightedSlot,
  onResizeStart,
}) => {
  const { theme, isDark } = useNiagaraTheme();
  const width = block.width || 220;

  // Determine Niagara Palette Header & Border Colors & LED Bulb color
  const getPaletteTheme = () => {
    const palette = (block.palette || '').toLowerCase();
    const type = (block.type || '').toLowerCase();

    // Default Niagara AX/4 steel blue & green LED colors
    if (palette.includes('points') || type.includes('writable') || type.includes('point')) {
      return {
        headerBg: 'bg-gradient-to-b from-[#c6d9f1] to-[#adc5e7] border-black text-black font-black',
        icon: <Layers className="w-3.5 h-3.5 shrink-0 text-slate-800" />,
        badgeText: 'baja:Point',
        ledColor: '#b57edc', // Purple LED for points/writables
      };
    }
    if (
      palette.includes('logic') ||
      type === 'and' ||
      type === 'or' ||
      type === 'not' ||
      type === 'xor' ||
      type === 'lessthan' ||
      type === 'greaterthan' ||
      type === 'equal' ||
      type === 'notequal' ||
      type === 'between' ||
      type === 'srlatch' ||
      type === 'flipflop'
    ) {
      return {
        headerBg: 'bg-gradient-to-b from-[#ddebf7] to-[#bdd7ee] border-black text-black font-black',
        icon: <Zap className="w-3.5 h-3.5 shrink-0 text-slate-800" />,
        badgeText: 'kitControl:Logic',
        ledColor: '#00ff00', // Green LED for logic blocks
      };
    }
    if (
      palette.includes('math') ||
      type === 'add' ||
      type === 'subtract' ||
      type === 'multiply' ||
      type === 'divide' ||
      type === 'min' ||
      type === 'max' ||
      type === 'average' ||
      type === 'abs' ||
      type === 'round' ||
      type === 'limit' ||
      type === 'scale'
    ) {
      return {
        headerBg: 'bg-gradient-to-b from-[#fff2cc] to-[#ffe699] border-black text-black font-black',
        icon: <Activity className="w-3.5 h-3.5 shrink-0 text-slate-800" />,
        badgeText: 'kitControl:Math',
        ledColor: '#00ff00',
      };
    }
    if (palette.includes('switches') || type.includes('switch') || type.includes('demux') || type.includes('multiplexer')) {
      return {
        headerBg: 'bg-gradient-to-b from-[#fce4d6] to-[#f8cbad] border-black text-black font-black',
        icon: <Shuffle className="w-3.5 h-3.5 shrink-0 text-slate-800" />,
        badgeText: 'kitControl:Switch',
        ledColor: '#00ff00',
      };
    }
    if (palette.includes('timers') || type.includes('delay') || type === 'oneshot' || type.includes('hand') || type.includes('pulse')) {
      return {
        headerBg: 'bg-gradient-to-b from-[#e1d5e7] to-[#d4b9da] border-black text-black font-black',
        icon: <Clock className="w-3.5 h-3.5 shrink-0 text-slate-800" />,
        badgeText: 'kitControl:Timer',
        ledColor: '#b57edc',
      };
    }
    if (
      palette.includes('control') ||
      type === 'looppoint' ||
      type === 'reset' ||
      type === 'leadlagcycle' ||
      type === 'leadlagn' ||
      type === 'tstat' ||
      type === 'stagepoint' ||
      type === 'ramp' ||
      type === 'dewpoint' ||
      type === 'enthalpy'
    ) {
      return {
        headerBg: 'bg-gradient-to-b from-[#f2f2f2] to-[#d9d9d9] border-black text-black font-black',
        icon: <Sliders className="w-3.5 h-3.5 shrink-0 text-slate-800" />,
        badgeText: 'kitControl:HVAC',
        ledColor: '#00ff00', // Green LED for HVAC/PID components
      };
    }
    if (palette.includes('alarm')) {
      return {
        headerBg: 'bg-gradient-to-b from-[#fce4d6] to-[#fbc4b7] border-black text-black font-black',
        icon: <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-slate-800" />,
        badgeText: 'alarm:Alarm',
        ledColor: '#ff0000', // Red LED for alarms
      };
    }
    if (palette.includes('schedule')) {
      return {
        headerBg: 'bg-gradient-to-b from-[#d2e0dc] to-[#b3cdc6] border-black text-black font-black',
        icon: <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-800" />,
        badgeText: 'schedule:Schedule',
        ledColor: '#00ff00',
      };
    }
    if (palette.includes('conversion')) {
      return {
        headerBg: 'bg-gradient-to-b from-[#e2d5f3] to-[#ccb9eb] border-black text-black font-black',
        icon: <Binary className="w-3.5 h-3.5 shrink-0 text-slate-800" />,
        badgeText: 'kitControl:Convert',
        ledColor: '#00ff00',
      };
    }

    return {
      headerBg: 'bg-gradient-to-b from-[#e1e2e5] to-[#c7c8cc] border-black text-black font-black',
      icon: <CircleDot className="w-3.5 h-3.5 shrink-0 text-slate-800" />,
      badgeText: 'baja:Component',
      ledColor: '#00ff00',
    };
  };

  const pTheme = getPaletteTheme();

  // Format Niagara AX-style values
  const formatSlotValue = (val: any, type: DataType, isInput: boolean) => {
    if (val === null || val === undefined) {
      return isInput ? '- {null}' : '{null}';
    }
    if (typeof val === 'boolean') {
      return val ? 'true {ok}' : 'false {ok}';
    }
    if (typeof val === 'number') {
      const formatted = Number.isInteger(val) ? val.toFixed(1) : val.toFixed(2);
      // Outputs show @ def by default unless overridden
      const suffix = isInput ? ' {ok}' : ' {ok} @ def';
      return `${formatted}${suffix}`;
    }
    return `${String(val)} {ok}`;
  };

  const outputs = block.outputs || [];
  const inputs = block.inputs || [];

  return (
    <div
      id={`niagara-block-${block.id}`}
      data-block-id={block.id}
      data-block-name={block.name}
      style={{
        transform: `translate(${block.x}px, ${block.y}px)`,
        width: `${width}px`,
        height: block.height ? `${block.height}px` : undefined,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(block.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpenInspector(block);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e, block);
      }}
      className={`absolute select-none font-sans text-xs group cursor-move transition-shadow duration-100 ${
        isSelected
          ? 'outline outline-2 outline-amber-500 z-30 shadow-[4px_4px_12px_rgba(0,0,0,0.35)]'
          : 'z-10 shadow-[2px_2px_0px_rgba(0,0,0,0.4)]'
      } ${
        isDark ? 'border border-slate-700 bg-[#091322] text-slate-100' : 'border border-black bg-[#f8fafc] text-black'
      } flex flex-col overflow-hidden`}
    >
      {/* Block Header (Classic Niagara AX/4 Gradient with Sharp Edges) */}
      <div
        className={`px-2 py-1 flex items-center justify-between border-b ${isDark ? 'border-slate-700' : 'border-black'} h-9 select-none ${pTheme.headerBg}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {pTheme.icon}
          <div className="min-w-0 flex-1">
            <h4
              className="font-bold text-[11px] leading-none text-black truncate tracking-wide"
              title={block.name}
            >
              {block.name}
            </h4>
            <span className="text-[9px] text-black/75 font-sans leading-none mt-0.5 truncate block capitalize">
              {block.type}
            </span>
          </div>
        </div>

        {/* Action Buttons & Niagara Status LED Circle */}
        <div className="flex items-center gap-1 shrink-0 ml-1.5">
          {/* Quick Inspector Gear */}
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onOpenInspector(block);
            }}
            title="Configure Properties"
            className="text-black/75 hover:text-black p-0.5 hover:bg-black/10 cursor-pointer"
          >
            <Settings className="w-3 h-3" />
          </button>

          {/* Delete Block */}
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(block.id);
            }}
            title="Delete Block"
            className="text-black/75 hover:text-red-600 p-0.5 hover:bg-black/10 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>

          {/* Authentic Round Status Bulb (Glows based on type) */}
          <div
            title={`Status LED (${block.type})`}
            className="w-3 h-3 rounded-full border border-black shadow-[inset_1px_1px_1px_rgba(255,255,255,0.6)] ml-1"
            style={{ backgroundColor: pTheme.ledColor }}
          />
        </div>
      </div>

      {/* Unified Stacked Slots Grid Container */}
      <div className={`flex flex-col flex-1 font-sans select-none overflow-y-auto min-h-0 ${
        isDark ? 'bg-[#091322] text-slate-200' : 'bg-[#f8fafc] text-black'
      }`}>
        
        {/* Render ALL OUTPUTS FIRST (Soft grey/blue rows) */}
        {outputs.map((slot) => {
          const currentVal = liveValues[slot.name];
          const isSlotHighlighted =
            highlightedSlot?.blockId === block.id &&
            highlightedSlot?.slotName === slot.name &&
            highlightedSlot?.kind === 'output';

          return (
            <div
              key={slot.name}
              id={`slot-out-${block.id}-${slot.name}`}
              data-slot-block-id={block.id}
              data-slot-name={slot.name}
              data-slot-kind="output"
              data-slot-type={slot.type}
              className={`group/slot w-full h-[22px] flex items-center border-b ${
                isDark ? 'border-slate-800' : 'border-black'
              } text-[11px] relative select-none transition-colors ${
                isDark
                  ? isSlotHighlighted
                    ? 'bg-sky-900/80 text-sky-200 font-semibold'
                    : 'bg-[#0f1f38] text-slate-200 hover:bg-[#152a4d]'
                  : isSlotHighlighted
                  ? 'bg-[#82a6f5] font-semibold text-black'
                  : 'bg-[#d2dcf0] hover:bg-[#c3cbe0] text-black'
              }`}
            >
              {/* Left Column: Output Slot Name */}
              <div className={`w-[45%] h-full flex items-center pl-1.5 pr-1 border-r ${
                isDark ? 'border-slate-800 text-slate-100' : 'border-black text-black'
              } font-bold truncate select-none`}>
                {slot.name}
              </div>

              {/* Right Column: Live Output Value */}
              <div className={`w-[55%] h-full flex items-center pl-1.5 pr-2 font-mono ${
                isDark ? 'text-sky-300' : 'text-black'
              } truncate select-none`}>
                {formatSlotValue(currentVal, slot.type, false)}
              </div>

              {/* Invisible Overlay Hit-Zone for Output Terminal (at right boundary) */}
              <div
                title={`Output Pin: ${slot.name}`}
                data-slot-pin="true"
                data-slot-block-id={block.id}
                data-slot-name={slot.name}
                data-slot-kind="output"
                data-slot-type={slot.type}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  onStartWire(block.id, slot.name, 'output', slot.type, rect.left + rect.width / 2, rect.top + rect.height / 2);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  const touch = e.touches[0];
                  onStartWire(block.id, slot.name, 'output', slot.type, touch.clientX, touch.clientY);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDropWire(block.id, slot.name, 'output');
                }}
                className={`absolute right-0 top-0 bottom-0 w-3.5 cursor-crosshair ${
                  isDark ? 'hover:bg-white/15' : 'hover:bg-black/15'
                } flex items-center justify-center z-20`}
              >
                {/* Tiny target terminal circle appears on hover */}
                <div className={`w-1.5 h-1.5 rounded-full border ${
                  isDark ? 'border-slate-900 bg-purple-400' : 'border-black bg-purple-500'
                } opacity-0 group-hover/slot:opacity-100 transition-opacity`} />
              </div>
            </div>
          );
        })}

        {/* Render ALL INPUTS SECOND */}
        {inputs.map((slot) => {
          const currentVal = liveValues[slot.name];
          const isSlotHighlighted =
            highlightedSlot?.blockId === block.id &&
            highlightedSlot?.slotName === slot.name &&
            highlightedSlot?.kind === 'input';

          return (
            <div
              key={slot.name}
              id={`slot-in-${block.id}-${slot.name}`}
              data-slot-block-id={block.id}
              data-slot-name={slot.name}
              data-slot-kind="input"
              data-slot-type={slot.type}
              className={`group/slot w-full h-[22px] flex items-center border-b ${
                isDark ? 'border-slate-800' : 'border-black'
              } text-[11px] relative select-none transition-colors ${
                isDark
                  ? isSlotHighlighted
                    ? 'bg-amber-950/80 text-amber-200 font-semibold'
                    : 'bg-[#14233c] text-slate-200 hover:bg-[#1a2d4c]'
                  : isSlotHighlighted
                  ? 'bg-[#ffeb3b] text-black font-semibold'
                  : 'bg-[#ffffcc] hover:bg-[#fffebd] text-black'
              }`}
            >
              {/* Invisible Overlay Hit-Zone for Input Terminal (at left boundary) */}
              <div
                title={`Input Pin: ${slot.name}`}
                data-slot-pin="true"
                data-slot-block-id={block.id}
                data-slot-name={slot.name}
                data-slot-kind="input"
                data-slot-type={slot.type}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  onStartWire(block.id, slot.name, 'input', slot.type, rect.left + rect.width / 2, rect.top + rect.height / 2);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  const touch = e.touches[0];
                  onStartWire(block.id, slot.name, 'input', slot.type, touch.clientX, touch.clientY);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDropWire(block.id, slot.name, 'input');
                }}
                className={`absolute left-0 top-0 bottom-0 w-3.5 cursor-crosshair ${
                  isDark ? 'hover:bg-white/15' : 'hover:bg-black/15'
                } flex items-center justify-center z-20`}
              >
                {/* Tiny target terminal diamond appears on hover */}
                <div className={`w-1.5 h-1.5 rotate-45 border ${
                  isDark ? 'border-slate-900 bg-emerald-400' : 'border-black bg-emerald-500'
                } opacity-0 group-hover/slot:opacity-100 transition-opacity`} />
              </div>

              {/* Left Column: Input Slot Name */}
              <div className={`w-[45%] h-full flex items-center pl-3 pr-1 border-r ${
                isDark ? 'border-slate-800 text-slate-100' : 'border-black text-black'
              } font-semibold truncate select-none`}>
                {slot.name}
              </div>

              {/* Right Column: Interactive value inputs & toggles (flush and compact) */}
              <div className={`w-[55%] h-full flex items-center justify-between pl-1.5 pr-2 font-mono ${
                isDark ? 'text-amber-300' : 'text-black'
              } truncate`}>
                {slot.type === 'boolean' ? (
                  <div className="flex items-center gap-1.5 w-full justify-between">
                    <span className="truncate">{currentVal === true ? 'true {ok}' : 'false {ok}'}</span>
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextVal = currentVal === true ? false : true;
                        onValueChange(block.id, slot.name, nextVal);
                      }}
                      title="Toggle Boolean value (Hand override)"
                      className={`p-0 cursor-pointer ${
                        isDark ? 'hover:bg-white/10 text-slate-300 hover:text-white' : 'hover:bg-black/10 text-slate-700 hover:text-black'
                      } shrink-0`}
                    >
                      {currentVal === true ? (
                        <ToggleRight className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                  </div>
                ) : slot.type === 'numeric' ? (
                  <div className="flex items-center gap-1 w-full justify-between">
                    <span className="truncate">{formatSlotValue(currentVal, slot.type, true)}</span>
                    <input
                      type="number"
                      step="any"
                      value={currentVal !== null && currentVal !== undefined ? currentVal : ''}
                      onMouseDown={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        const val = e.target.value === '' ? null : parseFloat(e.target.value);
                        onValueChange(block.id, slot.name, val);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-11 px-0.5 py-0 text-right bg-white border border-black/30 font-mono text-[9px] text-black outline-none shrink-0"
                      placeholder="null"
                    />
                  </div>
                ) : (
                  <span className="truncate">{formatSlotValue(currentVal, slot.type, true)}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resizable Corner Handle */}
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onResizeStart?.(e, block);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onResizeStart?.(e, block);
        }}
        className="absolute bottom-0 right-0 w-3 h-3 bg-slate-200 border-l border-t border-black cursor-se-resize z-20 flex items-center justify-center opacity-85 hover:opacity-100 shadow-[inset_1px_1px_1px_white]"
        title="Resize Block"
      >
        <svg width="6" height="6" viewBox="0 0 6 6" className="text-black pointer-events-none opacity-60">
          <line x1="6" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="1" />
          <line x1="6" y1="3" x2="3" y2="6" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
    </div>
  );
};
