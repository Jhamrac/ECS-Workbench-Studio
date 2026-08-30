import React, { useState } from 'react';
import { X, Calendar, Clock, Check, Plus, Trash2, Sun, Moon } from 'lucide-react';
import { NiagaraBlock } from '../types/niagara';
import { useNiagaraTheme } from '../context/NiagaraThemeContext';

interface NiagaraScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  block: NiagaraBlock | null;
  onUpdateSchedule: (blockId: string, scheduleData: any) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const NiagaraScheduleModal: React.FC<NiagaraScheduleModalProps> = ({
  isOpen,
  onClose,
  block,
  onUpdateSchedule,
}) => {
  const { theme, isDark } = useNiagaraTheme();

  const [occupiedStart, setOccupiedStart] = useState<string>('06:00');
  const [occupiedEnd, setOccupiedEnd] = useState<string>('18:00');
  const [selectedDays, setSelectedDays] = useState<Record<string, boolean>>({
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: false,
    Sunday: false,
  });

  if (!isOpen || !block) return null;

  const handleToggleDay = (day: string) => {
    setSelectedDays((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  const handleApplySchedule = () => {
    onUpdateSchedule(block.id, {
      selectedDays,
      occupiedStart,
      occupiedEnd,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl rounded-lg shadow-2xl border flex flex-col overflow-hidden max-h-[90vh] ${
          isDark ? 'bg-[#0f1d32] text-slate-100 border-[#1c3358]' : 'bg-white text-slate-800 border-slate-300'
        }`}
      >
        {/* Header */}
        <div
          className={`px-4 py-3 flex items-center justify-between border-b shrink-0 ${
            isDark ? 'bg-gradient-to-r from-[#0b172a] to-[#132644] border-[#1c3358]' : 'bg-gradient-to-r from-[#00529b] to-[#00386b] text-white border-blue-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-[#44b33c]" />
            <div>
              <h2 className="font-bold text-sm tracking-wide flex items-center gap-2">
                <span>Niagara Weekly Schedule Editor</span>
                <span className="text-xs font-mono bg-[#00386b] text-white px-2 py-0.5 rounded border border-blue-400">
                  {block.name}
                </span>
              </h2>
              <p className="text-[11px] opacity-80 font-sans">
                7-Day Time Schedule & Occupancy Bands (kitControl:Schedule)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 transition-colors text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Schedule Time Range Bar */}
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div
            className={`p-3 rounded-lg border space-y-3 ${
              isDark ? 'bg-[#0b172a] border-[#1c3358]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <h3 className="font-bold text-xs uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#00529b] dark:text-sky-400" />
              <span>Daily Occupied Hours (24-Hour Clock)</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold block mb-1">Occupied Start Time:</label>
                <input
                  type="time"
                  value={occupiedStart}
                  onChange={(e) => setOccupiedStart(e.target.value)}
                  className={`w-full text-xs p-2 rounded border font-mono ${
                    isDark ? 'bg-[#0f1d32] border-[#1c3358] text-white' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Occupied End Time:</label>
                <input
                  type="time"
                  value={occupiedEnd}
                  onChange={(e) => setOccupiedEnd(e.target.value)}
                  className={`w-full text-xs p-2 rounded border font-mono ${
                    isDark ? 'bg-[#0f1d32] border-[#1c3358] text-white' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* 7-Day Day Selector */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wide mb-2">Occupied Days of Week</h3>
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS.map((day) => {
                const isSelected = selectedDays[day];
                return (
                  <button
                    key={day}
                    onClick={() => handleToggleDay(day)}
                    className={`py-3 px-1 rounded-lg border text-xs font-bold font-mono transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-[#44b33c] text-white border-green-500 shadow-sm'
                        : isDark
                        ? 'bg-[#0b172a] text-slate-200 border-[#1c3358] hover:bg-slate-800'
                        : 'bg-slate-100 text-slate-900 border-slate-300 hover:bg-slate-200 font-bold'
                    }`}
                  >
                    <span>{day.substring(0, 3)}</span>
                    <span className="text-[10px] font-bold">{isSelected ? 'OCC' : 'UNOCC'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 24-Hour Visual Schedule Timeline */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wide mb-2 flex items-center justify-between">
              <span>24-Hour Occupancy Visual Timeline</span>
              <span className="text-[11px] font-mono text-slate-800 dark:text-slate-200 font-bold">{occupiedStart} — {occupiedEnd}</span>
            </h3>

            <div
              className={`p-3 rounded-lg border space-y-2 ${
                isDark ? 'bg-[#0b172a] border-[#1c3358]' : 'bg-slate-900 text-white border-slate-800'
              }`}
            >
              <div className="h-6 w-full bg-slate-800 rounded relative overflow-hidden flex border border-slate-700">
                {/* 24-Hour Scale Blocks */}
                <div
                  className="bg-[#44b33c] h-full absolute transition-all flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                  style={{
                    left: `${(parseInt(occupiedStart.split(':')[0]) / 24) * 100}%`,
                    width: `${
                      ((parseInt(occupiedEnd.split(':')[0]) - parseInt(occupiedStart.split(':')[0])) / 24) * 100
                    }%`,
                  }}
                >
                  OCCUPIED
                </div>
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-200 font-bold">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>24:00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-4 py-3 border-t flex items-center justify-between shrink-0 ${
            isDark ? 'bg-[#0b172a] border-[#1c3358]' : 'bg-slate-100 border-slate-300'
          }`}
        >
          <span className="text-xs text-slate-800 dark:text-slate-200 font-semibold font-mono">
            Schedule triggers output transition during simulation step clock cycles
          </span>
          <button
            onClick={handleApplySchedule}
            className="px-4 py-1.5 rounded text-xs font-bold bg-[#44b33c] hover:bg-[#3ca434] text-white shadow-xs transition-colors"
          >
            Apply Schedule
          </button>
        </div>
      </div>
    </div>
  );
};
