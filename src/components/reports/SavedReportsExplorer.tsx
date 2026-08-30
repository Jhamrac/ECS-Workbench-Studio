import React, { useState } from 'react';
import { SiteAuditReport, ReportCustomerFolder } from '../../types/reports';
import {
  Folder,
  FolderPlus,
  FileText,
  Plus,
  Search,
  Trash2,
  Copy,
  ChevronRight,
  ChevronDown,
  Building2,
  MapPin,
  Calendar,
  ShieldCheck,
  Edit2,
  AlertTriangle,
  ArrowRight,
  Printer,
  Sparkles,
} from 'lucide-react';

interface SavedReportsExplorerProps {
  customerFolders: ReportCustomerFolder[];
  savedReports: SiteAuditReport[];
  activeReportId: string;
  activeFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onSelectReport: (reportId: string) => void;
  onOpenReportBuilder: (reportId: string) => void;
  onCreateFolder: (name: string, location?: string, systemType?: string) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onCreateNewReport: (folderId?: string) => void;
  onDuplicateReport: (reportId: string) => void;
  onDeleteReport: (reportId: string) => void;
  isDark?: boolean;
}

export const SavedReportsExplorer: React.FC<SavedReportsExplorerProps> = ({
  customerFolders,
  savedReports,
  activeReportId,
  activeFolderId,
  onSelectFolder,
  onSelectReport,
  onOpenReportBuilder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onCreateNewReport,
  onDuplicateReport,
  onDeleteReport,
  isDark = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderLocation, setNewFolderLocation] = useState('');
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Filtered reports
  const filteredReports = savedReports.filter((report) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      report.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reportTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.facilityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.systemArchitecture.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFolder = activeFolderId === null || report.folderId === activeFolderId;
    return matchesSearch && matchesFolder;
  });

  const selectedFolder = customerFolders.find((f) => f.id === activeFolderId) || null;

  return (
    <div
      id="saved-reports-explorer-root"
      className={`flex-1 flex flex-col sm:flex-row h-full overflow-hidden ${
        isDark ? 'bg-[#090e1a] text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Left Customer / Site Folders Navigator */}
      <div
        className={`w-full sm:w-72 border-r flex flex-col shrink-0 ${
          isDark ? 'bg-[#070c17] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        {/* Navigator Header */}
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-400" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
              Customer / Site Folders
            </span>
          </div>
          <button
            id="add-customer-folder-btn"
            onClick={() => setIsCreatingFolder(true)}
            title="Create new customer / site folder"
            className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Inline Create Folder Form */}
        {isCreatingFolder && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newFolderName.trim()) {
                onCreateFolder(newFolderName.trim(), newFolderLocation.trim());
                setNewFolderName('');
                setNewFolderLocation('');
                setIsCreatingFolder(false);
              }
            }}
            className="p-2.5 m-2 bg-slate-900 border border-sky-500/50 rounded-lg space-y-2"
          >
            <input
              type="text"
              autoFocus
              placeholder="Customer / Site Name (e.g. Acme Aviation)"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full text-xs px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white outline-none"
            />
            <input
              type="text"
              placeholder="Facility Location (e.g. Hangar 4)"
              value={newFolderLocation}
              onChange={(e) => setNewFolderLocation(e.target.value)}
              className="w-full text-xs px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white outline-none"
            />
            <div className="flex justify-end gap-1">
              <button
                type="button"
                onClick={() => setIsCreatingFolder(false)}
                className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2 py-0.5 text-[10px] font-bold bg-sky-600 hover:bg-sky-500 text-white rounded shadow"
              >
                Save Folder
              </button>
            </div>
          </form>
        )}

        {/* Customer Folders Tree List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* All Sites Filter Node */}
          <div
            onClick={() => onSelectFolder(null)}
            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-all ${
              activeFolderId === null
                ? 'bg-sky-950/80 text-sky-200 border border-sky-500/50 font-bold'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Folder className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="truncate">All Customers & Sites</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              {savedReports.length}
            </span>
          </div>

          {customerFolders.map((folder) => {
            const count = savedReports.filter((r) => r.folderId === folder.id).length;
            const isSelected = activeFolderId === folder.id;

            return (
              <div
                key={folder.id}
                onClick={() => onSelectFolder(folder.id)}
                className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-all ${
                  isSelected
                    ? 'bg-sky-950/80 text-sky-200 border border-sky-500/50 font-bold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    style={{ backgroundColor: folder.color || '#0284c7' }}
                    className="w-2 h-2 rounded-full shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    {renamingFolderId === folder.id ? (
                      <input
                        type="text"
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={() => {
                          if (renameValue.trim()) onRenameFolder(folder.id, renameValue.trim());
                          setRenamingFolderId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (renameValue.trim()) onRenameFolder(folder.id, renameValue.trim());
                            setRenamingFolderId(null);
                          }
                        }}
                        className="text-xs w-full bg-slate-950 text-white rounded px-1 outline-none"
                      />
                    ) : (
                      <>
                        <span className="truncate block font-sans">{folder.name}</span>
                        <span className="text-[9px] text-slate-400 block truncate font-mono">
                          {folder.facilityLocation}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-1">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {count}
                  </span>
                  <div
                    className="hidden group-hover:flex items-center gap-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        setRenamingFolderId(folder.id);
                        setRenameValue(folder.name);
                      }}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                    {customerFolders.length > 1 && (
                      <button
                        onClick={() => onDeleteFolder(folder.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-700"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Saved Reports Grid / List */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Controls & Search Bar */}
        <div
          className={`p-3.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search saved reports by customer, site, or architecture..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-sky-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1.5 text-slate-400 hover:text-white text-xs"
                >
                  &times;
                </button>
              )}
            </div>
            {selectedFolder && (
              <span className="text-xs text-slate-400 hidden md:inline-block font-mono">
                Folder: <strong className="text-sky-400">{selectedFolder.name}</strong>
              </span>
            )}
          </div>

          <button
            id="create-new-audit-report-btn"
            onClick={() => onCreateNewReport(activeFolderId || undefined)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Site Audit Report</span>
          </button>
        </div>

        {/* Reports Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {filteredReports.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-800 rounded-2xl">
              <FileText className="w-10 h-10 text-slate-600 mb-2" />
              <h3 className="text-sm font-bold text-slate-300">No Saved Reports Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                No reports match your current folder or search query. Click below to create a new
                Site Audit Report.
              </p>
              <button
                onClick={() => onCreateNewReport(activeFolderId || undefined)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-600 text-white hover:bg-sky-500 shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Site Audit Report</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredReports.map((report) => {
                const totalDeficiencies =
                  report.supervisoryDeficiencies.length +
                  report.plantAhuDeficiencies.length +
                  report.terminalUnitsSummary.length;

                const health = report.healthMetrics?.overallHealth ?? 75;

                return (
                  <div
                    key={report.id}
                    onClick={() => {
                      onSelectReport(report.id);
                      onOpenReportBuilder(report.id);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between group shadow-sm hover:shadow-lg ${
                      activeReportId === report.id
                        ? 'bg-gradient-to-br from-slate-900 to-sky-950/40 border-sky-500/80 ring-1 ring-sky-500/50'
                        : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-mono font-bold uppercase tracking-tight">
                          {report.customerName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {/* Health Score Pill */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                              health >= 80
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : health >= 60
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}
                          >
                            BAHI: {health}%
                          </span>
                        </div>
                      </div>

                      {/* Title & Facility */}
                      <h3 className="text-sm font-bold text-slate-100 group-hover:text-sky-300 transition-colors leading-snug">
                        {report.reportTitle}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                        {report.facilityName}
                      </p>

                      {/* Deficiencies Count Banner */}
                      <div className="mt-3 p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-1.5 text-red-400">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-bold">{totalDeficiencies} Deficiencies</span>
                        </div>
                        <span className="text-slate-400 text-[11px]">
                          {report.visualEvidenceFigures.length} Figures
                        </span>
                      </div>
                    </div>

                    {/* Footer Info & Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1 font-mono text-[10px]">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{report.auditDate}</span>
                      </div>

                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onDuplicateReport(report.id)}
                          title="Duplicate report"
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {savedReports.length > 1 && (
                          <button
                            onClick={() => onDeleteReport(report.id)}
                            title="Delete report"
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            onSelectReport(report.id);
                            onOpenReportBuilder(report.id);
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-sky-600/80 hover:bg-sky-500 text-white font-bold text-[11px] ml-1 shadow"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
