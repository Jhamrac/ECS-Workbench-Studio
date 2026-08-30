import React, { useState } from 'react';
import { NIAGARA_PALETTE_ITEMS } from '../data/paletteDefinitions';
import { PaletteItem } from '../types/niagara';
import { Search, Plus, X, Layers, Box, Cpu, ChevronRight, Info } from 'lucide-react';
import { useNiagaraTheme } from '../context/NiagaraThemeContext';

interface PaletteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBlock: (item: PaletteItem) => void;
  onSelectBlockInfo?: (item: PaletteItem) => void;
  isMobile?: boolean;
}

export const PaletteDrawer: React.FC<PaletteDrawerProps> = ({
  isOpen,
  onClose,
  onAddBlock,
  onSelectBlockInfo,
  isMobile = false,
}) => {
  const { theme, isDark } = useNiagaraTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = [
    'All',
    'Logic',
    'Math',
    'Switches',
    'Timers',
    'HVAC & Control',
    'Points & Writable',
    'Alarm',
    'Schedule',
    'Conversion',
  ];

  const filteredItems = NIAGARA_PALETTE_ITEMS.filter((item) => {
    const matchesSearch =
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.palette.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div
      id="niagara-palette-drawer"
      className={`${
        isMobile
          ? 'fixed inset-y-0 right-0 z-50 w-80 max-w-[90vw] shadow-2xl animate-in slide-in-from-right duration-200'
          : 'w-80 shrink-0 border-l'
      } flex flex-col h-full z-20 shadow-xl select-none transition-colors ${
        isDark
          ? 'bg-[#0f172a] border-slate-800 text-slate-100'
          : 'bg-[#f1f5f9] border-[#cbd5e1] text-slate-800'
      }`}
    >
      {/* Header */}
      <div
        className={`p-3 border-b flex items-center justify-between ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-200 border-[#cbd5e1]'
        }`}
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider">
            Niagara Palette Library
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-black/20 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search & Categories */}
      <div
        className={`p-3 border-b space-y-2 ${
          isDark ? 'bg-[#0b101d] border-slate-800' : 'bg-slate-100 border-[#cbd5e1]'
        }`}
      >
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search blocks (LoopPoint, AND, Add, Delay)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full border rounded-md pl-8 pr-3 py-1.5 text-xs font-mono outline-none ${
              isDark
                ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-amber-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500'
            }`}
          />
        </div>

        {/* Categories Chips */}
        <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded whitespace-nowrap font-medium transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : isDark
                  ? 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Blocks List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No palette blocks match "{searchTerm}"
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify(item));
              }}
              onClick={() => onSelectBlockInfo && onSelectBlockInfo(item)}
              className={`border rounded-lg p-2.5 transition-all shadow-sm group hover:shadow-md cursor-pointer ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800 hover:border-amber-500/60'
                  : 'bg-white border-slate-300 hover:border-amber-500/80'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: item.color || '#f59e0b' }}
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold truncate group-hover:text-amber-500 transition-colors flex items-center gap-1">
                      <span>{item.type}</span>
                      <Info className="w-3 h-3 opacity-50 group-hover:opacity-100 text-sky-400" />
                    </h4>
                    <span className="text-[10px] opacity-70 font-mono truncate block">
                      {item.palette}
                    </span>
                  </div>
                </div>

                <button
                  id={`add-block-${item.type}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddBlock(item);
                  }}
                  title="Add block directly to Wire Sheet"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 p-1.5 rounded-md font-bold transition-all cursor-pointer shadow-sm shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>

              <p className="text-[11px] opacity-75 mt-1.5 line-clamp-2 leading-relaxed">
                {item.description}
              </p>

              <div className="mt-2 pt-1.5 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-[10px] opacity-70 font-mono">
                <span>In: {item.defaultInputs.length} slots</span>
                <span className="text-amber-500 font-bold group-hover:underline">Click for info & example</span>
                <span>Out: {item.defaultOutputs.length} slots</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
