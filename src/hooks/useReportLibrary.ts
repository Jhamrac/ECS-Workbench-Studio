import { useState, useEffect, useCallback } from 'react';
import { SiteAuditReport, ReportCustomerFolder } from '../types/reports';
import {
  DEFAULT_CUSTOMER_FOLDERS,
  INITIAL_SAVED_REPORTS,
  createBlankSiteAuditReport,
} from '../data/defaultReports';

const STORAGE_KEY_REPORT_FOLDERS = 'niagara_report_customer_folders_v4';
const STORAGE_KEY_SAVED_REPORTS = 'niagara_saved_site_reports_v4';

export function useReportLibrary() {
  const [customerFolders, setCustomerFolders] = useState<ReportCustomerFolder[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REPORT_FOLDERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((f) => f.id !== 'cust_sample_leonardo');
        }
      }
    } catch (e) {
      console.error('Error loading report customer folders:', e);
    }
    return DEFAULT_CUSTOMER_FOLDERS;
  });

  const [savedReports, setSavedReports] = useState<SiteAuditReport[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SAVED_REPORTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const userReports = parsed.filter((r) => r.id !== 'rep_sample_leonardo_pm' && !r.id.startsWith('rep_sample_'));
          if (userReports.length > 0) return userReports;
        }
      }
    } catch (e) {
      console.error('Error loading saved reports:', e);
    }
    return [];
  });

  // Active Report being viewed or edited
  const [activeReportId, setActiveReportId] = useState<string | null>(() => {
    return savedReports.length > 0 ? savedReports[0].id : null;
  });

  // Active Customer Folder selected in the navigator
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  // Persistence to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REPORT_FOLDERS, JSON.stringify(customerFolders));
    } catch (e) {
      console.error('Error persisting report customer folders:', e);
    }
  }, [customerFolders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_REPORTS, JSON.stringify(savedReports));
    } catch (e) {
      console.error('Error persisting saved reports:', e);
    }
  }, [savedReports]);

  // Create new customer folder
  const createCustomerFolder = useCallback(
    (name: string, facilityLocation?: string, systemType?: string, color?: string): ReportCustomerFolder => {
      const newFolder: ReportCustomerFolder = {
        id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim() || 'New Customer / Site',
        facilityLocation: facilityLocation || 'Main Facility Campus',
        systemType: systemType || 'Tridium Niagara N4 JACE-8000',
        color: color || '#0284c7',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCustomerFolders((prev) => [newFolder, ...prev]);
      setActiveFolderId(newFolder.id);
      return newFolder;
    },
    []
  );

  // Rename customer folder
  const renameCustomerFolder = useCallback((folderId: string, newName: string) => {
    setCustomerFolders((prev) =>
      prev.map((f) =>
        f.id === folderId
          ? { ...f, name: newName.trim() || f.name, updatedAt: new Date().toISOString() }
          : f
      )
    );
  }, []);

  // Delete customer folder
  const deleteCustomerFolder = useCallback((folderId: string) => {
    setCustomerFolders((prev) => prev.filter((f) => f.id !== folderId));
    // Also delete reports in this folder or dissociate
    setSavedReports((prev) => prev.filter((r) => r.folderId !== folderId));
  }, []);

  // Save / update report
  const saveReport = useCallback((report: SiteAuditReport) => {
    setSavedReports((prev) => {
      const existingIdx = prev.findIndex((r) => r.id === report.id);
      const updatedReport = {
        ...report,
        updatedAt: new Date().toISOString(),
      };
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = updatedReport;
        return next;
      }
      return [updatedReport, ...prev];
    });
    setActiveReportId(report.id);
  }, []);

  // Rename report
  const renameReport = useCallback((reportId: string, newTitle: string) => {
    setSavedReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, reportTitle: newTitle.trim() || r.reportTitle, updatedAt: new Date().toISOString() }
          : r
      )
    );
  }, []);

  // Duplicate report
  const duplicateReport = useCallback(
    (reportId: string): SiteAuditReport | null => {
      const original = savedReports.find((r) => r.id === reportId);
      if (!original) return null;

      const copy: SiteAuditReport = {
        ...original,
        id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        reportTitle: `${original.reportTitle} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'draft',
      };

      setSavedReports((prev) => [copy, ...prev]);
      setActiveReportId(copy.id);
      return copy;
    },
    [savedReports]
  );

  // Delete report
  const deleteReport = useCallback(
    (reportId: string) => {
      setSavedReports((prev) => {
        const filtered = prev.filter((r) => r.id !== reportId);
        if (activeReportId === reportId) {
          setActiveReportId(filtered.length > 0 ? filtered[0].id : null);
        }
        return filtered;
      });
    },
    [activeReportId]
  );

  // Create fresh report template for a customer folder
  const createNewSiteAuditReport = useCallback(
    (folderId?: string, customerName?: string, facilityName?: string): SiteAuditReport => {
      const targetFolder = customerFolders.find((f) => f.id === folderId) || customerFolders[0];

      const newReport = createBlankSiteAuditReport(
        targetFolder ? targetFolder.id : (folderId || ''),
        customerName || (targetFolder ? targetFolder.name : 'New Facility Client'),
        facilityName || (targetFolder ? targetFolder.facilityLocation : 'Building 1')
      );

      setSavedReports((prev) => [newReport, ...prev]);
      setActiveReportId(newReport.id);
      return newReport;
    },
    [customerFolders]
  );

  // Active report lookup (or guaranteed clean blank fallback)
  const activeReport: SiteAuditReport =
    (activeReportId ? savedReports.find((r) => r.id === activeReportId) : null) ||
    savedReports[0] ||
    createBlankSiteAuditReport();

  return {
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
    renameReport,
    duplicateReport,
    deleteReport,
    createNewSiteAuditReport,
  };
}
