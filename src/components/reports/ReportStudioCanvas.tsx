import React, { useState } from 'react';
import { ReportSubView, SiteAuditReport } from '../../types/reports';
import { SavedReportsExplorer } from './SavedReportsExplorer';
import { SiteAuditReportBuilder } from './SiteAuditReportBuilder';
import { NiagaraProgram } from '../../types/niagara';
import { useReportLibrary } from '../../hooks/useReportLibrary';
import {
  FileText,
  Folder,
  Plus,
  ArrowLeft,
  Printer,
  FileCheck2,
  Sparkles,
  ClipboardList,
} from 'lucide-react';

interface ReportStudioCanvasProps {
  activeSubView: ReportSubView;
  onSelectSubView: (subView: ReportSubView) => void;
  currentProgram?: NiagaraProgram;
  reportLibrary: ReturnType<typeof useReportLibrary>;
  isDark?: boolean;
}

export const ReportStudioCanvas: React.FC<ReportStudioCanvasProps> = ({
  activeSubView,
  onSelectSubView,
  currentProgram,
  reportLibrary,
  isDark = true,
}) => {
  const {
    customerFolders,
    savedReports,
    activeReportId,
    setActiveReportId,
    activeFolderId,
    setActiveFolderId,
    activeReport,
    createCustomerFolder,
    renameCustomerFolder,
    deleteCustomerFolder,
    saveReport,
    duplicateReport,
    deleteReport,
    createNewSiteAuditReport,
  } = reportLibrary;

  return (
    <div
      id="report-studio-canvas-root"
      className={`flex-1 flex flex-col h-full overflow-hidden ${
        isDark ? 'bg-[#080d19] text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Top Report Studio Sub-Navigation Bar */}
      <div
        className={`px-4 py-2 border-b flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-[#070d18] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2">
          {/* Quick toggle between Saved Reports and Audit Builder */}
          <div className="flex p-0.5 rounded-lg bg-slate-950/80 border border-slate-800">
            <button
              id="report-subview-saved-reports-btn"
              onClick={() => onSelectSubView('saved_reports')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeSubView === 'saved_reports'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Saved Reports</span>
            </button>
            <button
              id="report-subview-site-audit-btn"
              onClick={() => onSelectSubView('site_audit_builder')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeSubView === 'site_audit_builder'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Site Audit Report Builder</span>
            </button>
          </div>

          {activeSubView === 'site_audit_builder' && (
            <button
              onClick={() => onSelectSubView('saved_reports')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 ml-2 font-mono"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Saved Reports</span>
            </button>
          )}
        </div>

        {/* Right side Active Report Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline-block">
            Active Report:
          </span>
          {savedReports.length > 0 ? (
            <select
              value={activeReportId || savedReports[0].id}
              onChange={(e) => {
                setActiveReportId(e.target.value);
                onSelectSubView('site_audit_builder');
              }}
              className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white outline-none focus:border-sky-500 max-w-[220px] truncate"
            >
              {savedReports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.customerName} - {r.reportTitle}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-mono text-slate-500 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800">
              No Saved Reports
            </span>
          )}
        </div>
      </div>

      {/* Main Subview Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeSubView === 'saved_reports' ? (
          <SavedReportsExplorer
            customerFolders={customerFolders}
            savedReports={savedReports}
            activeReportId={activeReportId}
            activeFolderId={activeFolderId}
            onSelectFolder={setActiveFolderId}
            onSelectReport={setActiveReportId}
            onOpenReportBuilder={(reportId) => {
              setActiveReportId(reportId);
              onSelectSubView('site_audit_builder');
            }}
            onCreateFolder={createCustomerFolder}
            onRenameFolder={renameCustomerFolder}
            onDeleteFolder={deleteCustomerFolder}
            onCreateNewReport={(folderId) => {
              createNewSiteAuditReport(folderId);
              onSelectSubView('site_audit_builder');
            }}
            onDuplicateReport={duplicateReport}
            onDeleteReport={deleteReport}
            isDark={isDark}
          />
        ) : activeReport ? (
          <SiteAuditReportBuilder
            report={activeReport}
            onUpdateReport={saveReport}
            currentProgram={currentProgram}
            customerFolders={customerFolders}
            onCreateFolder={createCustomerFolder}
            onOpenSavedReports={() => onSelectSubView('saved_reports')}
            isDark={isDark}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div className="max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <ClipboardList className="w-12 h-12 text-sky-400 mx-auto" />
              <h3 className="text-base font-bold text-white">No Active Report Selected</h3>
              <p className="text-xs text-slate-400">
                Create a new site audit report or choose one from your customer folders to begin.
              </p>
              <button
                onClick={() => {
                  createNewSiteAuditReport();
                  onSelectSubView('site_audit_builder');
                }}
                className="px-4 py-2 text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl"
              >
                Create New Site Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
