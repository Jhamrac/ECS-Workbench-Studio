import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Camera,
  GitCompare,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  FileCode,
} from 'lucide-react';
import { NetworkSnapshot, BacnetDevice } from '../../types/networking';
import { useNiagaraTheme } from '../../context/NiagaraThemeContext';

interface SnapshotComparatorViewProps {
  snapshots: NetworkSnapshot[];
  currentDevices: BacnetDevice[];
  onTakeSnapshot: (name: string, notes: string) => void;
  onOpenAiAssist?: (prompt: string) => void;
}

export const SnapshotComparatorView: React.FC<SnapshotComparatorViewProps> = ({
  snapshots,
  currentDevices,
  onTakeSnapshot,
}) => {
  const { theme, isDark } = useNiagaraTheme();

  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>(snapshots[0]?.id || '');
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotNotes, setSnapshotNotes] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const selectedSnapshot = snapshots.find((s) => s.id === selectedSnapshotId) || snapshots[0];

  const handleCreateSnapshot = () => {
    if (!snapshotName.trim()) return;
    onTakeSnapshot(snapshotName.trim(), snapshotNotes.trim() || 'Manual Baseline');
    setSnapshotName('');
    setSnapshotNotes('');
    setShowCreateModal(false);
  };

  // Export EDE Schedule CSV
  const handleExportEde = () => {
    const header = 'Project,Device_ID,Object_Type,Instance,Object_Name,Present_Value,Units,Description\n';
    const rows = currentDevices
      .flatMap((d) =>
        d.objects.map(
          (o) =>
            `"Building Automation System",${d.deviceInstance},"${o.type}",${o.instance},"${o.name}",${o.presentValue},"${o.units || ''}","${o.description}"`
        )
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EDE_Point_Schedule_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 sm:p-6 custom-scrollbar font-sans select-none">
      <div className="max-w-6xl mx-auto space-y-6 w-full">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Commissioning Baseline Snapshot & Diff Comparator</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              Lock in "Day 1" golden commissioning states, detect parameter drift, and audit field changes
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportEde}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs ${
                isDark
                  ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200'
                  : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export EDE Point Schedule</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Take New Baseline Snapshot</span>
            </button>
          </div>
        </div>

        {/* Snapshot Selector & Summary */}
        <div
          className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
            isDark ? 'bg-[#07162e] border-[#102d58]' : 'bg-white border-[#cbd8e6] shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-400">Selected Baseline:</span>
            <select
              value={selectedSnapshotId}
              onChange={(e) => setSelectedSnapshotId(e.target.value)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                isDark ? 'bg-[#030b18] border-[#102c54] text-purple-300' : 'bg-white border-[#b9cee2] text-purple-900'
              }`}
            >
              {snapshots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({new Date(s.timestamp).toLocaleDateString()}) - {s.deviceCount} Devices
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Side-by-Side Comparison Diff Table */}
        <div
          className={`p-5 rounded-xl border ${
            isDark ? 'bg-[#07162e] border-[#102d58]' : 'bg-white border-[#cbd8e6] shadow-sm'
          }`}
        >
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700/30 flex items-center justify-between">
            <span>Live Field State vs. Baseline Snapshot Diff</span>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              Live: {currentDevices.length} Devices | Baseline: {selectedSnapshot?.deviceCount || 0} Devices
            </span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700/40 text-slate-700 dark:text-slate-400 font-mono text-[11px] font-bold">
                  <th className="py-2 px-3">Device Instance</th>
                  <th className="py-2 px-3">Controller Name</th>
                  <th className="py-2 px-3">Network / MAC</th>
                  <th className="py-2 px-3">Baseline Firmware</th>
                  <th className="py-2 px-3">Live Firmware</th>
                  <th className="py-2 px-3">Live Points</th>
                  <th className="py-2 px-3">Diff Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/20">
                {currentDevices.map((dev) => {
                  const baselineDev = selectedSnapshot?.devices.find(
                    (d) => d.deviceInstance === dev.deviceInstance
                  );
                  const isNew = !baselineDev;
                  const isFirmwareDifferent = baselineDev && baselineDev.firmwareRevision !== dev.firmwareRevision;

                  return (
                    <tr
                      key={dev.id}
                      className={
                        isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                      }
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-sky-700 dark:text-sky-400">
                        {dev.deviceInstance}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-200">{dev.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 font-medium">
                        Net {dev.networkNumber} / {dev.macAddress ? `MAC ${dev.macAddress}` : dev.ipAddress}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 font-medium">
                        {baselineDev?.firmwareRevision || 'N/A (New)'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {dev.firmwareRevision}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 font-medium">
                        {dev.objects.length} Objects
                      </td>
                      <td className="py-2.5 px-3">
                        {isNew ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-[10px] font-bold">
                            + ADDED SINCE BASELINE
                          </span>
                        ) : isFirmwareDifferent ? (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[10px] font-bold">
                            FIRMWARE UPGRADED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-700 text-[10px] font-bold">
                            MATCHES BASELINE
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div
            className={`w-full max-w-md p-5 rounded-xl border shadow-xl ${
              isDark ? 'bg-[#071832] border-[#102d58] text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <h3 className="font-extrabold text-sm mb-1 text-slate-900 dark:text-slate-100">
              Create Commissioning Baseline Snapshot
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-4">
              Freezes the entire configuration of all {currentDevices.length} controllers into a permanent reference.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Snapshot Title</label>
                <input
                  type="text"
                  value={snapshotName}
                  onChange={(e) => setSnapshotName(e.target.value)}
                  placeholder="e.g. Substantial Completion Milestone v1.0"
                  className={`w-full px-3 py-1.5 rounded-lg border font-sans text-xs ${
                    isDark ? 'bg-[#030b18] border-[#102c54] text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Notes / Commissioning Record</label>
                <textarea
                  value={snapshotNotes}
                  onChange={(e) => setSnapshotNotes(e.target.value)}
                  placeholder="Signed off by CX agent. All VAVs balanced and air flow tested..."
                  rows={3}
                  className={`w-full px-3 py-1.5 rounded-lg border font-sans text-xs ${
                    isDark ? 'bg-[#030b18] border-[#102c54] text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
                  isDark
                    ? 'border-slate-700 text-slate-300 hover:text-white'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSnapshot}
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
              >
                Save Baseline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
