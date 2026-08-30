import React, { useState, useEffect } from 'react';
import { X, Layers, RotateCcw, ShieldAlert, Cpu, Check, Trash2, Edit3 } from 'lucide-react';
import { NiagaraBlock } from '../types/niagara';
import { useNiagaraTheme } from '../context/NiagaraThemeContext';

interface PriorityArrayModalProps {
  isOpen: boolean;
  onClose: () => void;
  block: NiagaraBlock | null;
  liveValue?: any;
  onUpdatePriorityArray: (blockId: string, priorityArray: Record<number, any>, fallbackValue: any) => void;
}

const PRIORITY_LABELS: Record<number, { title: string; desc: string; category: string }> = {
  1: { title: 'Emergency Life Safety', desc: 'Freeze Stat, Smoke/Fire Cutout, High-Pressure Cutout', category: 'Safety' },
  2: { title: 'Life Safety Interlock', desc: 'Hardwired Interlock / Safety Relay', category: 'Safety' },
  3: { title: 'Minimum On/Off Guard', desc: 'Short-Cycle Protection System', category: 'Guard' },
  4: { title: 'Fast Shutdown', desc: 'Emergency Equipment Ramp-down', category: 'Guard' },
  5: { title: 'Critical Equipment Protect', desc: 'Low Oil / Bearing Heat Protection', category: 'Protect' },
  6: { title: 'Reserved (Level 6)', desc: 'Unassigned Niagara System Level', category: 'Reserved' },
  7: { title: 'Reserved (Level 7)', desc: 'Unassigned Niagara System Level', category: 'Reserved' },
  8: { title: 'Manual Override (Hand)', desc: 'Field Technician / Commissioning Test Mode', category: 'Override' },
  9: { title: 'Reserved (Level 9)', desc: 'Unassigned Niagara System Level', category: 'Reserved' },
  10: { title: 'Operator Override', desc: 'Station BMS Operator Override', category: 'Operator' },
  11: { title: 'Reserved (Level 11)', desc: 'Unassigned Level', category: 'Reserved' },
  12: { title: 'Schedule Override', desc: 'Holiday / Special Event Demand Response', category: 'Schedule' },
  13: { title: 'Reserved (Level 13)', desc: 'Unassigned Level', category: 'Reserved' },
  14: { title: 'Reserved (Level 14)', desc: 'Unassigned Level', category: 'Reserved' },
  15: { title: 'Reserved (Level 15)', desc: 'Unassigned Level', category: 'Reserved' },
  16: { title: 'Control Logic (Auto)', desc: 'Automated Control Strategy (Wire Sheet Input)', category: 'Auto' },
};

export const PriorityArrayModal: React.FC<PriorityArrayModalProps> = ({
  isOpen,
  onClose,
  block,
  liveValue,
  onUpdatePriorityArray,
}) => {
  const { theme, isDark } = useNiagaraTheme();

  // Draft local input strings for each level 1..16 to allow smooth typing & editing
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [draftFallback, setDraftFallback] = useState<string>('');

  const currentArray = block?.properties?.priorityArray || {};
  const currentFallback =
    block?.properties?.fallbackValue ??
    block?.properties?.defaultOutput ??
    (block?.type?.toLowerCase().includes('boolean') ? false : 0);

  // Sync draft inputs whenever modal opens or block properties update
  useEffect(() => {
    if (block) {
      const arr = block.properties?.priorityArray || {};
      const newDrafts: Record<number, string> = {};
      for (let l = 1; l <= 16; l++) {
        if (arr[l] !== undefined && arr[l] !== null) {
          newDrafts[l] = String(arr[l]);
        } else {
          newDrafts[l] = '';
        }
      }
      setDrafts(newDrafts);
      setDraftFallback(String(currentFallback));
    }
  }, [block, isOpen]);

  if (!isOpen || !block) return null;

  const isBoolean =
    block.type.toLowerCase().includes('boolean') ||
    block.outputs?.some((o) => o.type === 'boolean') ||
    typeof currentFallback === 'boolean';

  // Determine active level (lowest 1..16 that is non-null/undefined, else Fallback)
  let activeLevel = 0;
  for (let l = 1; l <= 16; l++) {
    const slotInputVal = block.inputs.find((i) => i.name === `in${l}`)?.value;
    const propVal = currentArray[l];
    if (
      (propVal !== undefined && propVal !== null) ||
      (slotInputVal !== undefined && slotInputVal !== null)
    ) {
      activeLevel = l;
      break;
    }
  }

  // Handle setting a value for level
  const handleLevelChange = (level: number, textVal: string) => {
    setDrafts((prev) => ({ ...prev, [level]: textVal }));

    const updated = { ...currentArray };
    const trimmed = textVal.trim();

    if (trimmed === '' || trimmed === 'null') {
      delete updated[level];
      onUpdatePriorityArray(block.id, updated, currentFallback);
      return;
    }

    if (isBoolean) {
      if (trimmed === 'true') {
        updated[level] = true;
      } else if (trimmed === 'false') {
        updated[level] = false;
      } else {
        delete updated[level];
      }
    } else {
      const parsedNum = Number(trimmed);
      if (!isNaN(parsedNum)) {
        updated[level] = parsedNum;
      } else {
        // Don't delete yet if user is typing minus or decimal (keep draft in state)
        return;
      }
    }

    onUpdatePriorityArray(block.id, updated, currentFallback);
  };

  const handleSetBooleanLevel = (level: number, val: boolean) => {
    setDrafts((prev) => ({ ...prev, [level]: String(val) }));
    const updated = { ...currentArray, [level]: val };
    onUpdatePriorityArray(block.id, updated, currentFallback);
  };

  const handleRelinquishLevel = (level: number) => {
    setDrafts((prev) => ({ ...prev, [level]: '' }));
    const updated = { ...currentArray };
    delete updated[level];
    onUpdatePriorityArray(block.id, updated, currentFallback);
  };

  const handleRelinquishAll = () => {
    const emptyDrafts: Record<number, string> = {};
    for (let l = 1; l <= 16; l++) emptyDrafts[l] = '';
    setDrafts(emptyDrafts);
    onUpdatePriorityArray(block.id, {}, currentFallback);
  };

  const handleFallbackTextChange = (val: string) => {
    setDraftFallback(val);
    let parsed: any = val;
    if (isBoolean) {
      parsed = val === 'true';
    } else {
      const n = Number(val);
      if (!isNaN(n)) parsed = n;
      else return;
    }
    onUpdatePriorityArray(block.id, currentArray, parsed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200 select-none">
      <div
        className={`w-full max-w-4xl rounded-xl shadow-2xl border-2 flex flex-col max-h-[92vh] overflow-hidden ${
          isDark
            ? 'bg-[#0b1426] text-slate-100 border-slate-700'
            : 'bg-white text-slate-950 border-slate-400'
        }`}
      >
        {/* Header - High Contrast Banner */}
        <div
          className={`px-5 py-4 flex items-center justify-between border-b shrink-0 ${
            isDark
              ? 'bg-gradient-to-r from-[#070e1c] to-[#0f2142] border-slate-700 text-white'
              : 'bg-gradient-to-r from-[#003d75] to-[#00529b] text-white border-blue-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500 text-slate-950 font-black border border-emerald-400 shadow-md">
              <Layers className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-black text-base tracking-tight flex items-center gap-2">
                <span>Niagara 16-Level Priority Array Inspector</span>
                <span className="text-xs font-mono font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded border border-amber-600 shadow-xs">
                  {block.name} ({block.type})
                </span>
              </h2>
              <p className="text-xs text-slate-100 font-bold font-sans mt-0.5">
                Priority 1 (Highest / Safety) to Priority 16 (Control Logic) &amp; Default Fallback
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors text-white font-bold cursor-pointer"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Live Status Active Bar */}
        <div
          className={`px-5 py-3 border-b flex items-center justify-between text-xs font-mono shrink-0 font-black ${
            activeLevel === 1
              ? 'bg-rose-600 text-white border-rose-700'
              : activeLevel === 8
              ? 'bg-amber-500 text-slate-950 border-amber-600'
              : activeLevel === 16
              ? 'bg-sky-600 text-white border-sky-700'
              : isDark
              ? 'bg-[#12233f] text-slate-100 border-slate-700'
              : 'bg-slate-200 text-slate-950 border-slate-400'
          }`}
        >
          <div className="flex items-center gap-2.5 text-sm">
            <Cpu className="w-5 h-5 text-current stroke-[2.5]" />
            <span>
              Effective Point Output:{' '}
              <span className="text-base font-black px-2 py-0.5 rounded bg-black/20 text-current border border-current">
                {liveValue !== undefined && liveValue !== null ? String(liveValue) : '0'}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-sans uppercase text-xs tracking-wider">Active Command:</span>
              <span className="font-black text-xs px-2.5 py-1 rounded bg-black/30 text-white border border-white/40">
                {activeLevel > 0 ? `Level ${activeLevel} (In${activeLevel})` : 'Fallback Default'}
              </span>
            </div>
            <button
              onClick={handleRelinquishAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-sans text-xs font-black transition-all shadow-md cursor-pointer border border-rose-900"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              <span>Relinquish All Overrides</span>
            </button>
          </div>
        </div>

        {/* Priority Array Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className={`border-b-2 font-black ${
                  isDark
                    ? 'border-slate-700 text-slate-100 bg-[#0f1f3a]'
                    : 'border-slate-400 text-slate-950 bg-slate-200'
                }`}
              >
                <th className="py-2.5 px-3 w-20 text-black dark:text-white font-black">Level</th>
                <th className="py-2.5 px-3 text-black dark:text-white font-black">Category &amp; Function</th>
                <th className="py-2.5 px-3 w-32 text-center text-black dark:text-white font-black">Source</th>
                <th className="py-2.5 px-3 w-56 text-right text-black dark:text-white font-black">Value / Command Box</th>
                <th className="py-2.5 px-3 w-28 text-center text-black dark:text-white font-black">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 dark:divide-slate-800 font-mono">
              {[...Array(16)].map((_, i) => {
                const level = i + 1;
                const meta = PRIORITY_LABELS[level];
                const inputSlot = block.inputs.find((inp) => inp.name === `in${level}`);
                const overrideVal = currentArray[level];
                const isWired = inputSlot?.value !== undefined && inputSlot?.value !== null;
                const isActive = activeLevel === level;
                const hasOverride = overrideVal !== undefined && overrideVal !== null;
                const draftVal = drafts[level] ?? (hasOverride ? String(overrideVal) : '');

                return (
                  <tr
                    key={level}
                    className={`transition-colors ${
                      isActive
                        ? isDark
                          ? 'bg-sky-950/80 font-bold border-l-4 border-l-sky-400'
                          : 'bg-sky-100 font-bold border-l-4 border-l-sky-700'
                        : isDark
                        ? 'hover:bg-slate-800/60 text-slate-100'
                        : 'hover:bg-slate-100 text-slate-950'
                    }`}
                  >
                    {/* Level Badge */}
                    <td className="py-2 px-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded text-xs font-black font-mono shadow-xs ${
                          level === 1
                            ? 'bg-rose-600 text-white'
                            : level === 8
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : level === 16
                            ? 'bg-sky-600 text-white'
                            : isDark
                            ? 'bg-slate-800 text-slate-100 border border-slate-600'
                            : 'bg-slate-300 text-slate-950 font-black border border-slate-400'
                        }`}
                      >
                        In{level}
                      </span>
                    </td>

                    {/* Category & Description */}
                    <td className="py-2 px-3 font-sans">
                      <div className="font-black text-xs flex items-center gap-2 text-slate-950 dark:text-slate-100">
                        <span>{meta.title}</span>
                        {isActive && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-mono shadow-xs">
                            ★ ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {meta.desc}
                      </div>
                    </td>

                    {/* Source Status */}
                    <td className="py-2 px-3 text-center text-xs">
                      {hasOverride ? (
                        <span className="px-2.5 py-1 rounded-md bg-amber-400 text-slate-950 font-black border border-amber-600 shadow-xs">
                          User Command
                        </span>
                      ) : isWired ? (
                        <span className="px-2.5 py-1 rounded-md bg-sky-600 text-white font-black border border-sky-800 shadow-xs">
                          Wired (WireSheet)
                        </span>
                      ) : (
                        <span className="text-slate-700 dark:text-slate-300 font-mono font-black text-xs">
                          null
                        </span>
                      )}
                    </td>

                    {/* Value Box Input / Selector */}
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isBoolean ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSetBooleanLevel(level, true)}
                              className={`px-2.5 py-1 rounded text-xs font-black transition-all cursor-pointer ${
                                draftVal === 'true'
                                  ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-950 dark:text-slate-100 border border-slate-400 hover:bg-emerald-500 hover:text-white'
                              }`}
                            >
                              True
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetBooleanLevel(level, false)}
                              className={`px-2.5 py-1 rounded text-xs font-black transition-all cursor-pointer ${
                                draftVal === 'false'
                                  ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-950 dark:text-slate-100 border border-slate-400 hover:bg-rose-500 hover:text-white'
                              }`}
                            >
                              False
                            </button>
                          </div>
                        ) : (
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              value={draftVal}
                              placeholder={isWired ? `Wired: ${inputSlot?.value ?? '0'}` : 'null'}
                              onChange={(e) => handleLevelChange(level, e.target.value)}
                              className={`w-32 text-xs text-right px-3 py-1.5 rounded-lg border-2 font-mono font-black outline-none transition-all ${
                                hasOverride
                                  ? 'bg-amber-50 dark:bg-[#1a2b47] border-amber-500 text-slate-950 dark:text-amber-300 shadow-sm'
                                  : isDark
                                  ? 'bg-[#0b172a] border-slate-600 text-white focus:border-sky-400'
                                  : 'bg-white border-slate-400 text-slate-950 focus:border-sky-600'
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Action Column */}
                    <td className="py-2 px-3 text-center">
                      {(hasOverride || draftVal !== '') && (
                        <button
                          type="button"
                          onClick={() => handleRelinquishLevel(level)}
                          title={`Relinquish Priority Level ${level}`}
                          className="px-2.5 py-1 text-xs rounded-md bg-rose-600 hover:bg-rose-700 text-white font-sans font-black shadow-xs transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Fallback Slot Row */}
              <tr
                className={`border-t-4 font-black ${
                  isDark
                    ? 'bg-[#122442] border-slate-600 text-slate-100'
                    : 'bg-slate-200 border-slate-400 text-slate-950'
                }`}
              >
                <td className="py-3 px-3">
                  <span className="px-2.5 py-1 rounded text-xs bg-purple-600 text-white font-mono font-black shadow-xs">
                    Fallback
                  </span>
                </td>
                <td className="py-3 px-3 font-sans">
                  <div className="font-black text-xs text-slate-950 dark:text-slate-100">
                    Default Fallback Output Value
                  </div>
                  <div className="text-xs text-slate-800 dark:text-slate-200 font-bold">
                    Active when all 16 Priority Array levels are null / unassigned
                  </div>
                </td>
                <td className="py-3 px-3 text-center text-xs">
                  <span className="text-slate-950 dark:text-slate-100 font-black">
                    Station Default
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  {isBoolean ? (
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleFallbackTextChange('true')}
                        className={`px-3 py-1 rounded text-xs font-black transition-all cursor-pointer ${
                          draftFallback === 'true'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-slate-300 dark:bg-slate-800 text-slate-950 dark:text-slate-100 border border-slate-400'
                        }`}
                      >
                        True
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFallbackTextChange('false')}
                        className={`px-3 py-1 rounded text-xs font-black transition-all cursor-pointer ${
                          draftFallback === 'false'
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'bg-slate-300 dark:bg-slate-800 text-slate-950 dark:text-slate-100 border border-slate-400'
                        }`}
                      >
                        False
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={draftFallback}
                      onChange={(e) => handleFallbackTextChange(e.target.value)}
                      className={`w-32 text-xs text-right px-3 py-1.5 rounded-lg border-2 font-mono font-black outline-none ${
                        isDark
                          ? 'bg-[#0b172a] border-slate-500 text-white'
                          : 'bg-white border-slate-400 text-slate-950'
                      }`}
                    />
                  )}
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-black">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          className={`px-5 py-3 border-t-2 flex items-center justify-between shrink-0 ${
            isDark
              ? 'bg-[#070e1c] border-slate-700 text-slate-100'
              : 'bg-slate-200 border-slate-400 text-slate-950'
          }`}
        >
          <div className="text-xs text-slate-950 dark:text-slate-100 font-black flex items-center gap-2 font-sans">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 stroke-[2.5]" />
            <span>
              Priority 1 (Emergency Safety) overrides all lower levels. Priority 8 simulates hand/manual test switches.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-black text-xs transition-colors shadow-md cursor-pointer border border-sky-900"
          >
            Done / Close Sheet
          </button>
        </div>
      </div>
    </div>
  );
};
