import React, { useState } from 'react';
import { NiagaraBlock } from '../types/niagara';
import { X, Save, Sliders, Info, Trash2, Shield, Layers, FileText, PackageSearch, FolderTree, Compass, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNiagaraTheme } from '../context/NiagaraThemeContext';
import { getBlockPaletteLocation } from '../utils/paletteLookup';

interface BlockInspectorModalProps {
  block: NiagaraBlock | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveBlock: (updatedBlock: NiagaraBlock) => void;
  onDeleteBlock: (blockId: string) => void;
}

export const BlockInspectorModal: React.FC<BlockInspectorModalProps> = ({
  block,
  isOpen,
  onClose,
  onSaveBlock,
  onDeleteBlock,
}) => {
  if (!isOpen || !block) return null;

  const { theme, isDark } = useNiagaraTheme();
  const [name, setName] = useState(block.name);
  const [properties, setProperties] = useState<{ [key: string]: any }>({ ...(block.properties || {}) });
  const [comment, setComment] = useState(block.comment || '');

  const paletteInfo = getBlockPaletteLocation(block.type, block.palette);

  const handlePropertyChange = (key: string, value: any) => {
    setProperties((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBlock({
      ...block,
      name,
      properties,
      comment,
    });
    onClose();
  };

  // Get active properties list to display in the grid
  const getPropertyDefinitions = () => {
    const list: Array<{ key: string; label: string; type: 'double' | 'int' | 'enum' | 'string' | 'boolean'; options?: string[]; description: string; defaultValue: any }> = [];

    // General Block properties based on types
    if (block.type === 'LoopPoint' || block.type === 'PID') {
      list.push(
        { key: 'action', label: 'Loop Action', type: 'enum', options: ['direct', 'reverse'], description: 'Direct (Cooling) or Reverse (Heating)', defaultValue: 'direct' },
        { key: 'proportionalConstant', label: 'Proportional Gain (Kp)', type: 'double', description: 'Sensitivity factor for error scaling', defaultValue: 4.0 },
        { key: 'integralTime', label: 'Integral Time (Ti Secs)', type: 'int', description: 'Seconds to remove steady-state offset', defaultValue: 180 },
        { key: 'deadband', label: 'Loop Deadband', type: 'double', description: 'Neutral zone around setpoint', defaultValue: 0.5 },
        { key: 'bias', label: 'Output Bias (%)', type: 'double', description: 'Base output when error is zero', defaultValue: 0.0 }
      );
    } else if (block.type === 'Reset') {
      list.push(
        { key: 'inLow', label: 'Input Low (InLow)', type: 'double', description: 'Low boundary of input domain', defaultValue: 20 },
        { key: 'inHigh', label: 'Input High (InHigh)', type: 'double', description: 'High boundary of input domain', defaultValue: 70 },
        { key: 'outLow', label: 'Output Low (OutLow)', type: 'double', description: 'Low boundary value map output', defaultValue: 65 },
        { key: 'outHigh', label: 'Output High (OutHigh)', type: 'double', description: 'High boundary value map output', defaultValue: 55 }
      );
    } else if (block.palette.includes('points') || block.type.endsWith('Point') || block.type.includes('Writable')) {
      list.push(
        { key: 'fallback', label: 'Fallback Value', type: 'double', description: 'Default value when no priority exists', defaultValue: 0 },
        { key: 'out', label: 'Current Output (Out)', type: 'double', description: 'Present operating value on wire', defaultValue: 0 }
      );
    }

    // Default generic properties if none found
    if (list.length === 0) {
      list.push(
        { key: 'fallback', label: 'Fallback Default', type: 'double', description: 'Default fallback level', defaultValue: 0 },
        { key: 'precision', label: 'Display Precision', type: 'int', description: 'Decimal point digits', defaultValue: 2 }
      );
    }

    return list;
  };

  const definitions = getPropertyDefinitions();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className={`border rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] transition-colors ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-800'
      }`}>
        
        {/* Header - Styled like Niagara Property Sheet Banner */}
        <div className={`flex items-center justify-between px-5 py-3.5 border-b transition-colors ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${
              isDark ? 'bg-amber-600/25 border-amber-500/40 text-amber-400' : 'bg-amber-500 text-slate-950 border-amber-600'
            }`}>
              <Sliders className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight uppercase">
                Property Sheet Grid • {block.name}
              </h2>
              <div className="flex items-center gap-2 text-[11px] font-mono font-bold">
                <span className={isDark ? 'text-amber-400' : 'text-amber-800'}>{paletteInfo.componentName}</span>
                <span className="text-slate-500">•</span>
                <span className={isDark ? 'text-sky-400' : 'text-sky-800'}>{paletteInfo.folderPath}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          
          {/* Niagara Palette Location Card */}
          <div className={`border rounded-xl p-3.5 space-y-2.5 shadow-sm transition-colors ${
            isDark ? 'bg-sky-950/20 border-sky-900/50 text-sky-200' : 'bg-sky-50 border-sky-200 text-sky-900'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-black uppercase text-[10px] tracking-wider">
                <PackageSearch className="w-4 h-4 stroke-[2.5]" />
                <span>Niagara Palette Locator</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                isDark ? 'bg-sky-950 text-sky-300 border-sky-800' : 'bg-sky-150 text-sky-800 border-sky-300'
              }`}>
                {paletteInfo.category}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div>
                <span className="block text-[10px] uppercase font-bold opacity-75">Module / Jar File</span>
                <span className="font-semibold">{paletteInfo.jarFile}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold opacity-75">Folder Context</span>
                <span className="font-semibold">{paletteInfo.folderPath}</span>
              </div>
            </div>

            <div className={`p-2.5 rounded-lg border text-[11px] space-y-1 font-mono ${
              isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-white border-slate-300 text-slate-700'
            }`}>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide font-sans">
                <Compass className="w-3.5 h-3.5 text-amber-500 stroke-[2.5]" />
                <span>How to Find in Workbench:</span>
              </div>
              <div>{paletteInfo.workbenchPath}</div>
              <div className="text-[10px] opacity-80 font-sans pt-0.5">{paletteInfo.description}</div>
            </div>
          </div>

          {/* Block display name input */}
          <div>
            <label className="block font-bold mb-1 uppercase tracking-wider opacity-90 text-[10px]">
              Niagara Block Display Identifier (name)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 font-mono outline-none text-xs font-semibold focus:ring-1 focus:ring-amber-500 ${
                isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-black'
              }`}
            />
          </div>

          {/* Interactive Niagara Property Spreadsheet Grid */}
          <div className="space-y-1.5">
            <label className="block font-bold uppercase tracking-wider opacity-90 text-[10px] flex items-center justify-between">
              <span>Interactive Property Slot Grid</span>
              <span className="text-[9px] lowercase opacity-60 font-normal">Click cell to edit instantly</span>
            </label>

            <div className={`border rounded-lg overflow-hidden ${
              isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-300 bg-white'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-[10px] font-bold uppercase ${
                      isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600'
                    }`}>
                      <th className="py-2 px-3 border-r border-slate-800/20 w-1/3">Property</th>
                      <th className="py-2 px-2 border-r border-slate-800/20 w-12 text-center">Type</th>
                      <th className="py-2 px-3 border-r border-slate-800/20 w-1/3">Value</th>
                      <th className="py-2 px-2 text-center w-12">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/10 font-mono text-[11px]">
                    {definitions.map((def, idx) => {
                      const curValue = properties[def.key] ?? def.defaultValue;
                      const isOverridden = properties[def.key] !== undefined && properties[def.key] !== def.defaultValue;

                      return (
                        <tr
                          key={def.key}
                          className={`group transition-colors ${
                            idx % 2 === 0
                              ? isDark ? 'bg-slate-950' : 'bg-white'
                              : isDark ? 'bg-slate-900/30' : 'bg-slate-50/50'
                          } ${isDark ? 'hover:bg-slate-900/60' : 'hover:bg-slate-100/50'}`}
                        >
                          {/* Property Name & Facet Tooltip */}
                          <td className="py-2 px-3 border-r border-slate-800/10 font-medium">
                            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{def.label}</span>
                            <span className="block text-[9px] text-slate-500 font-sans mt-0.5 group-hover:text-amber-500 transition-colors">
                              {def.description}
                            </span>
                          </td>

                          {/* Property DataType */}
                          <td className="py-2 px-2 border-r border-slate-800/10 text-center">
                            <span className={`px-1 rounded text-[9px] font-bold border capitalize ${
                              isDark 
                                ? 'bg-slate-900 border-slate-800 text-slate-400'
                                : 'bg-slate-200 border-slate-300 text-slate-600'
                            }`}>
                              {def.type === 'double' ? 'f64' : def.type === 'int' ? 'i32' : def.type === 'enum' ? 'enum' : 'str'}
                            </span>
                          </td>

                          {/* Interactive Inline Cell Value Editor */}
                          <td className="py-1 px-1.5 border-r border-slate-800/10">
                            {def.type === 'enum' ? (
                              <select
                                value={curValue}
                                onChange={(e) => handlePropertyChange(def.key, e.target.value)}
                                className={`w-full py-1 px-1.5 rounded font-mono text-[11px] font-bold outline-none border focus:border-amber-500 ${
                                  isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-black'
                                }`}
                              >
                                {def.options?.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt.toUpperCase()}
                                  </option>
                                ))}
                              </select>
                            ) : def.type === 'boolean' ? (
                              <select
                                value={curValue ? 'true' : 'false'}
                                onChange={(e) => handlePropertyChange(def.key, e.target.value === 'true')}
                                className={`w-full py-1 px-1.5 rounded font-mono text-[11px] font-bold outline-none border focus:border-amber-500 ${
                                  isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-black'
                                }`}
                              >
                                <option value="true">TRUE</option>
                                <option value="false">FALSE</option>
                              </select>
                            ) : (
                              <input
                                type={def.type === 'string' ? 'text' : 'number'}
                                step={def.type === 'double' ? '0.1' : '1'}
                                value={curValue}
                                onChange={(e) => {
                                  const val = def.type === 'string' 
                                    ? e.target.value 
                                    : def.type === 'double' 
                                      ? parseFloat(e.target.value) 
                                      : parseInt(e.target.value, 10);
                                  handlePropertyChange(def.key, isNaN(val as any) ? e.target.value : val);
                                }}
                                className={`w-full py-1 px-2 rounded font-mono text-[11px] font-bold outline-none border focus:border-amber-500 ${
                                  isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-black'
                                }`}
                              />
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="py-2 px-2 text-center">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1 py-0.5 rounded ${
                              isOverridden
                                ? 'bg-amber-950/50 text-amber-300 border border-amber-800/50'
                                : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                            }`}>
                              {isOverridden ? 'Modified' : 'Ok'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Slots visual overview */}
          <div className={`border rounded-lg p-3 space-y-2 ${
            isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-100 border-slate-300'
          }`}>
            <h4 className="font-bold uppercase text-[10px] opacity-75 flex items-center justify-between">
              <span>Configured Terminal Slots</span>
              <span className="font-mono text-[9px]">({block.inputs?.length || 0} Inputs, {block.outputs?.length || 0} Outputs)</span>
            </h4>
            
            <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
              <div className="space-y-1">
                <span className="text-[10px] font-bold opacity-60 uppercase block">Inputs:</span>
                {(block.inputs || []).map((i) => (
                  <div key={i.name} className={`truncate flex items-center gap-1.5 py-0.5 px-1.5 rounded ${
                    isDark ? 'bg-slate-900 text-slate-300' : 'bg-white text-slate-700'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    <span className="font-bold">{i.name}</span>
                    <span className="opacity-50 text-[10px]">({i.type})</span>
                  </div>
                ))}
                {(!block.inputs || block.inputs.length === 0) && (
                  <div className="text-slate-500 italic text-[10px] pl-1">No inputs</div>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold opacity-60 uppercase block">Outputs:</span>
                {(block.outputs || []).map((o) => (
                  <div key={o.name} className={`truncate flex items-center gap-1.5 py-0.5 px-1.5 rounded ${
                    isDark ? 'bg-slate-900 text-slate-300' : 'bg-white text-slate-700'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="font-bold">{o.name}</span>
                    <span className="opacity-50 text-[10px]">({o.type})</span>
                  </div>
                ))}
                {(!block.outputs || block.outputs.length === 0) && (
                  <div className="text-slate-500 italic text-[10px] pl-1">No outputs</div>
                )}
              </div>
            </div>
          </div>

          {/* Engineer Comments / Documentation */}
          <div>
            <label className="block font-bold mb-1 uppercase tracking-wider opacity-90 text-[10px]">
              Niagara Component Notes & commissioning records
            </label>
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add engineering notes, commissioning notes, or calibration data..."
              className={`w-full border rounded-lg px-3 py-2 outline-none text-xs font-semibold placeholder-slate-500 focus:ring-1 focus:ring-amber-500 ${
                isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-black'
              }`}
            />
          </div>

          {/* Action Footer */}
          <div className={`pt-3 border-t flex items-center justify-between ${
            isDark ? 'border-slate-800' : 'border-slate-300'
          }`}>
            <button
              type="button"
              onClick={() => {
                onDeleteBlock(block.id);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 font-bold transition-colors cursor-pointer text-[11px]"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Block</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer text-[11px] border ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
                    : 'bg-slate-200 border-slate-300 hover:bg-slate-300 text-slate-800'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md cursor-pointer border border-amber-600 text-[11px]"
              >
                <Save className="w-4 h-4" />
                <span>Save Component</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
