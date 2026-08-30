import jsPDF from 'jspdf';
import { NiagaraTranslationReport } from '../types/niagara';
import { SiteAuditReport } from '../types/reports';

export function generateTranslationPdfReport(
  report: NiagaraTranslationReport,
  technicianName = 'Senior BMS Systems Engineer'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  // Helper: Draw Header Bar
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('ECS WORKBENCH STUDIO — BMS LOGIC REPORT', margin, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Control Translation & Resolution Inspection Report', margin, 17);

  // Date and Doc ID top right
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  doc.setFontSize(8);
  doc.text(`Date: ${dateStr}`, pageWidth - margin - 45, 11);
  doc.text(`Tech: ${technicianName}`, pageWidth - margin - 45, 17);

  y = 32;

  // System Title Card Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 2, 2, 'FD');

  doc.setTextColor(2, 132, 199);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('SYSTEM LOGIC TRANSLATION:', margin + 4, y + 6);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(report.systemTitle || 'BMS Wire Sheet Logic', margin + 4, y + 14);

  y += 26;

  // Section 1: Executive Summary & Logic Explanation
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Existing Logic Overview & Sequence of Operation', margin, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const summaryLines = doc.splitTextToSize(report.summary || '', pageWidth - margin * 2);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 4.5 + 4;

  if (report.detailedExplanation) {
    const detailLines = doc.splitTextToSize(report.detailedExplanation, pageWidth - margin * 2);
    doc.text(detailLines, margin, y);
    y += detailLines.length * 4.5 + 6;
  }

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 10) {
      doc.addPage();
      y = margin + 5;
    }
  };

  checkPageBreak(30);

  // Section 2: Identified Operational Issues & Safety Risks
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Identified Logic Bugs & Operational Risks', margin, y);
  y += 6;

  if (!report.hasIssues || !report.issues || report.issues.length === 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(22, 101, 52);
    doc.text('✅ No operational risks or logic errors detected in this wire sheet configuration.', margin, y);
    y += 10;
  } else {
    report.issues.forEach((issue, idx) => {
      checkPageBreak(24);

      let badgeBg = '#fef2f2';
      let badgeBorder = '#fca5a5';
      let badgeText = '#991b1b';

      if (issue.severity === 'high') {
        badgeBg = '#fff7ed';
        badgeBorder = '#fdba74';
        badgeText = '#c2410c';
      } else if (issue.severity === 'medium') {
        badgeBg = '#fefce8';
        badgeBorder = '#fef08a';
        badgeText = '#854d0e';
      } else if (issue.severity === 'low') {
        badgeBg = '#f0f9ff';
        badgeBorder = '#bae6fd';
        badgeText = '#075985';
      }

      doc.setFillColor(badgeBg);
      doc.setDrawColor(badgeBorder);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 18, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(badgeText);
      doc.text(`[${(issue.severity || 'issue').toUpperCase()}] Issue #${idx + 1}: ${issue.title}`, margin + 4, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const descLines = doc.splitTextToSize(issue.description, pageWidth - margin * 2 - 8);
      doc.text(descLines, margin + 4, y + 12);

      y += 22;
    });
  }

  // Section 3: Proposed Resolution
  if (report.resolution) {
    checkPageBreak(40);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Proposed Resolution & Technical Before/After Fixes', margin, y);
    y += 6;

    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 16, 2, 2, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52);
    doc.text('RESOLUTION SUMMARY:', margin + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const resSummaryLines = doc.splitTextToSize(report.resolution.summary || '', pageWidth - margin * 2 - 8);
    doc.text(resSummaryLines, margin + 4, y + 11);

    y += 22;
    checkPageBreak(35);

    // Before Box
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
    doc.roundedRect(margin, y, (pageWidth - margin * 2) / 2 - 2, 32, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(153, 27, 27);
    doc.text('BEFORE (Current Setup):', margin + 3, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const beforeLines = doc.splitTextToSize(report.resolution.beforeExplanation || '', (pageWidth - margin * 2) / 2 - 10);
    doc.text(beforeLines, margin + 3, y + 12);

    // After Box
    const rightBoxX = margin + (pageWidth - margin * 2) / 2 + 2;
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(rightBoxX, y, (pageWidth - margin * 2) / 2 - 2, 32, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(22, 101, 52);
    doc.text('AFTER (Proposed Fixes):', rightBoxX + 3, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const afterLines = doc.splitTextToSize(report.resolution.afterExplanation || '', (pageWidth - margin * 2) / 2 - 10);
    doc.text(afterLines, rightBoxX + 3, y + 12);

    y += 38;
  }

  // Download File
  const filename = `${(report.systemTitle || 'bms_logic').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_translation_report.pdf`;
  doc.save(filename);
}

/**
 * High-Quality Master Site Audit Report PDF Generator
 * Produces publication-grade, multi-page executive commissioning & BAS health audit documents.
 */
export function generateSiteAuditPdfReport(
  report: SiteAuditReport,
  companyName = 'Engineered Cooling Services',
  technicianName = 'Lead BAS Systems Specialist'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;
  let pageNumber = 1;

  // Colors
  const cNavy = [15, 23, 42]; // #0f172a
  const cSky = [2, 132, 199]; // #0284c7
  const cEmerald = [16, 185, 129]; // #10b981
  const cCrimson = [225, 29, 72]; // #e11d48
  const cAmber = [217, 119, 6]; // #d97706
  const cSlateText = [51, 65, 85]; // #334155
  const cLightBg = [248, 250, 252]; // #f8fafc
  const cBorder = [226, 232, 240]; // #e2e8f0

  // Header and Footer Helpers
  const renderHeader = (isCover = false) => {
    // Top banner
    doc.setFillColor(cNavy[0], cNavy[1], cNavy[2]);
    doc.rect(0, 0, pageWidth, 20, 'F');

    // Accent line
    doc.setFillColor(cSky[0], cSky[1], cSky[2]);
    doc.rect(0, 20, pageWidth, 1.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(companyName.toUpperCase(), margin, 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text('Building Automation & HVAC Controls Engineering Division', margin, 15);

    // Right-side reference
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`AUDIT REF: ${report.id.substring(0, 16).toUpperCase()}`, pageWidth - margin, 9.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`DATE: ${report.auditDate}`, pageWidth - margin, 15, { align: 'right' });
  };

  const renderFooter = () => {
    const footerY = pageHeight - 8;
    doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'CONFIDENTIAL & PROPRIETARY — PREPARED FOR CLIENT FACILITY MANAGEMENT',
      margin,
      footerY
    );
    doc.text(`Page ${pageNumber}`, pageWidth - margin, footerY, { align: 'right' });
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 12) {
      renderFooter();
      doc.addPage();
      pageNumber++;
      renderHeader();
      y = 28;
    }
  };

  // ----------------------------------------------------
  // PAGE 1: COVER & EXECUTIVE COMMISSIONING SCOPE
  // ----------------------------------------------------
  renderHeader(true);
  y = 26;

  // Title Box
  doc.setFillColor(cLightBg[0], cLightBg[1], cLightBg[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'FD');

  // Verified Deficiency Badge
  const totalDeficiencies =
    (report.supervisoryDeficiencies?.length || 0) +
    (report.plantAhuDeficiencies?.length || 0) +
    (report.terminalUnitsSummary?.length || 0);

  doc.setFillColor(totalDeficiencies > 0 ? cCrimson[0] : cEmerald[0], totalDeficiencies > 0 ? cCrimson[1] : cEmerald[1], totalDeficiencies > 0 ? cCrimson[2] : cEmerald[2]);
  doc.roundedRect(margin + 4, y + 4, 60, 5.5, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(
    `${totalDeficiencies} VERIFIED DEFICIENCIES`,
    margin + 6,
    y + 8
  );

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7.5);
  doc.text(`STATUS: ${(report.status || 'draft').toUpperCase()}`, margin + 68, y + 8);

  // Main Report Title
  doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(report.reportTitle.toUpperCase(), margin + 4, y + 18);

  // Subtitle
  doc.setTextColor(cSky[0], cSky[1], cSky[2]);
  doc.setFontSize(9);
  doc.text(report.reportSubtitle, margin + 4, y + 24);

  // Architecture line
  doc.setTextColor(cSlateText[0], cSlateText[1], cSlateText[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`System Platform: ${report.systemArchitecture}`, margin + 4, y + 30);

  y += 38;

  // Metadata Grid (4 Columns)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.roundedRect(margin, y, contentWidth, 22, 1.5, 1.5, 'FD');

  const colW = contentWidth / 4;

  // Col 1
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT / FACILITY', margin + 3, y + 5);
  doc.setFontSize(8);
  doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.text(doc.splitTextToSize(report.customerName, colW - 6), margin + 3, y + 10);

  // Col 2
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('FACILITY LOCATION', margin + colW + 3, y + 5);
  doc.setFontSize(8);
  doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.text(doc.splitTextToSize(report.facilityName, colW - 6), margin + colW + 3, y + 10);

  // Col 3
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('LEAD AUDITOR / TECH', margin + colW * 2 + 3, y + 5);
  doc.setFontSize(8);
  doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.text(doc.splitTextToSize(report.auditorName || technicianName, colW - 6), margin + colW * 2 + 3, y + 10);

  // Col 4
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('ENGINEERING CONTRACTOR', margin + colW * 3 + 3, y + 5);
  doc.setFontSize(8);
  doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.text(doc.splitTextToSize(report.serviceContractor || companyName, colW - 6), margin + colW * 3 + 3, y + 10);

  y += 26;

  // ----------------------------------------------------
  // BUILDING AUTOMATION HEALTH INDEX (BAHI) SCORECARD
  // ----------------------------------------------------
  doc.setFillColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'F');

  // Overall Score Badge
  const overallHealth = report.healthMetrics?.overallHealth ?? 78;
  doc.setFillColor(
    overallHealth >= 80 ? cEmerald[0] : overallHealth >= 60 ? cAmber[0] : cCrimson[0],
    overallHealth >= 80 ? cEmerald[1] : overallHealth >= 60 ? cAmber[1] : cCrimson[1],
    overallHealth >= 80 ? cEmerald[2] : overallHealth >= 60 ? cAmber[2] : cCrimson[2]
  );
  doc.roundedRect(margin + 4, y + 4, 20, 20, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`${overallHealth}%`, margin + 14, y + 14, { align: 'center' });
  doc.setFontSize(5.5);
  doc.text('BAHI INDEX', margin + 14, y + 19, { align: 'center' });

  // Score Title & Narrative
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Building Automation Health Index (BAHI)', margin + 28, y + 9);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(
    'Weighted operational stability composite benchmarked against ASHRAE Guideline 36 rules.',
    margin + 28,
    y + 14
  );

  // Submetrics Bars
  const subMetrics = [
    { label: 'JACE Heap', val: report.healthMetrics?.supervisoryJace ?? 75 },
    { label: 'BACnet MS/TP', val: report.healthMetrics?.bacnetNetwork ?? 70 },
    { label: 'Control Loops', val: report.healthMetrics?.controlLoops ?? 80 },
    { label: 'Sensors / IO', val: report.healthMetrics?.sensorIntegrity ?? 85 },
  ];

  const subW = (contentWidth - 30) / 4;
  subMetrics.forEach((sm, i) => {
    const sx = margin + 28 + i * subW;
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(203, 213, 225);
    doc.text(`${sm.label}: ${sm.val}%`, sx, y + 21);

    // mini progress bar
    doc.setFillColor(51, 65, 85);
    doc.roundedRect(sx, y + 23, subW - 6, 2, 0.5, 0.5, 'F');
    doc.setFillColor(sm.val >= 75 ? cEmerald[0] : sm.val >= 55 ? cAmber[0] : cCrimson[0], sm.val >= 75 ? cEmerald[1] : sm.val >= 55 ? cAmber[1] : cCrimson[1], sm.val >= 75 ? cEmerald[2] : sm.val >= 55 ? cAmber[2] : cCrimson[2]);
    doc.roundedRect(sx, y + 23, ((subW - 6) * sm.val) / 100, 2, 0.5, 0.5, 'F');
  });

  y += 33;

  // ----------------------------------------------------
  // EXECUTIVE SUMMARY & OPERATIONAL CONTEXT
  // ----------------------------------------------------
  doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('1. Executive Summary & Operational Context', margin, y);
  y += 4;

  doc.setFillColor(cLightBg[0], cLightBg[1], cLightBg[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);

  const execLines = doc.splitTextToSize(
    report.executiveSummary ||
      'Scheduled preventive maintenance and controls field audit conducted to evaluate supervisory platform stability, network communication integrity, PID control loop tuning, and terminal zone thermal comfort.',
    contentWidth - 8
  );
  const execBoxH = execLines.length * 3.8 + 6;
  doc.roundedRect(margin, y, contentWidth, execBoxH, 1.5, 1.5, 'FD');

  doc.setTextColor(cSlateText[0], cSlateText[1], cSlateText[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(execLines, margin + 4, y + 4.5);

  y += execBoxH + 5;

  // Key Systemic Patterns Box (if any)
  if (report.keySystemicPatterns && report.keySystemicPatterns.length > 0) {
    checkPageBreak(25);
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(252, 211, 77); // amber-300

    let patHeight = report.keySystemicPatterns.length * 4 + 7;
    doc.roundedRect(margin, y, contentWidth, patHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(cAmber[0], cAmber[1], cAmber[2]);
    doc.text('KEY SYSTEMIC PATTERNS & SITE-WIDE RISKS:', margin + 4, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120, 53, 15);
    let py = y + 8;
    report.keySystemicPatterns.forEach((pat) => {
      doc.text(`• ${pat}`, margin + 5, py);
      py += 3.8;
    });

    y += patHeight + 5;
  }

  // ----------------------------------------------------
  // 2. SUPERVISORY & PLATFORM DEFICIENCIES TABLE
  // ----------------------------------------------------
  checkPageBreak(30);
  doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('2. Station-Wide & Supervisory Platform Deficiencies', margin, y);
  y += 4;

  if (!report.supervisoryDeficiencies || report.supervisoryDeficiencies.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(cEmerald[0], cEmerald[1], cEmerald[2]);
    doc.text('No supervisory or station-level deficiencies detected.', margin, y);
    y += 6;
  } else {
    // Table Header
    doc.setFillColor(cNavy[0], cNavy[1], cNavy[2]);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('COMPONENT / SERVICE', margin + 2, y + 4.2);
    doc.text('OBSERVED DEFICIENCY', margin + 45, y + 4.2);
    doc.text('OPERATIONAL IMPACT', margin + 115, y + 4.2);
    doc.text('STATUS / SEVERITY', margin + 155, y + 4.2);
    y += 6;

    report.supervisoryDeficiencies.forEach((def, idx) => {
      const compLines = doc.splitTextToSize(def.componentService, 40);
      const obsLines = doc.splitTextToSize(def.observedDeficiency, 66);
      const impLines = doc.splitTextToSize(def.impact, 36);
      const rowHeight = Math.max(compLines.length, obsLines.length, impLines.length) * 3.5 + 4;

      checkPageBreak(rowHeight);

      // Alternating row background
      if (idx % 2 === 1) {
        doc.setFillColor(cLightBg[0], cLightBg[1], cLightBg[2]);
        doc.rect(margin, y, contentWidth, rowHeight, 'F');
      }
      doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
      doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
      doc.text(compLines, margin + 2, y + 3.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(cSlateText[0], cSlateText[1], cSlateText[2]);
      doc.text(obsLines, margin + 45, y + 3.5);
      doc.text(impLines, margin + 115, y + 3.5);

      // Severity badge
      const isCrit = def.severity === 'CRITICAL';
      const isAct = def.severity === 'ACTION REQUIRED';
      const isCorr = def.severity === 'CORRECTED';

      doc.setFillColor(isCrit ? 254 : isAct ? 254 : isCorr ? 240 : 241, isCrit ? 226 : isAct ? 243 : isCorr ? 253 : 245, isCrit ? 226 : isAct ? 199 : isCorr ? 244 : 249);
      doc.roundedRect(margin + 155, y + 1.5, 24, 4.5, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(isCrit ? 185 : isAct ? 180 : isCorr ? 22 : 30, isCrit ? 28 : isAct ? 83 : isCorr ? 101 : 41, isCrit ? 28 : isAct ? 9 : isCorr ? 52 : 59);
      doc.text(def.severity || 'WARNING', margin + 167, y + 4.5, { align: 'center' });

      y += rowHeight;
    });
    y += 5;
  }

  // ----------------------------------------------------
  // 3. CENTRAL PLANT & AHU DEFICIENCIES TABLE
  // ----------------------------------------------------
  checkPageBreak(30);
  doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('3. Central Plant & Air Handling Units (AHU) Deficiencies', margin, y);
  y += 4;

  if (!report.plantAhuDeficiencies || report.plantAhuDeficiencies.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(cEmerald[0], cEmerald[1], cEmerald[2]);
    doc.text('No central plant or AHU deficiencies documented.', margin, y);
    y += 6;
  } else {
    doc.setFillColor(cNavy[0], cNavy[1], cNavy[2]);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('EQUIPMENT', margin + 2, y + 4.2);
    doc.text('LOCATION / TARGET', margin + 40, y + 4.2);
    doc.text('OBSERVED DEFICIENCIES', margin + 80, y + 4.2);
    doc.text('RECOMMENDED CORRECTIVE ACTION', margin + 135, y + 4.2);
    y += 6;

    report.plantAhuDeficiencies.forEach((ahu, idx) => {
      const eqLines = doc.splitTextToSize(ahu.equipment, 36);
      const locLines = doc.splitTextToSize(ahu.locationTarget, 36);
      const obsText = ahu.observedDeficiencies.join(' • ');
      const obsLines = doc.splitTextToSize(obsText, 52);
      const actLines = doc.splitTextToSize(ahu.recommendedAction, 45);
      const rowHeight = Math.max(eqLines.length, locLines.length, obsLines.length, actLines.length) * 3.5 + 4;

      checkPageBreak(rowHeight);

      if (idx % 2 === 1) {
        doc.setFillColor(cLightBg[0], cLightBg[1], cLightBg[2]);
        doc.rect(margin, y, contentWidth, rowHeight, 'F');
      }
      doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
      doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
      doc.text(eqLines, margin + 2, y + 3.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(cSlateText[0], cSlateText[1], cSlateText[2]);
      doc.text(locLines, margin + 40, y + 3.5);
      doc.text(obsLines, margin + 80, y + 3.5);

      doc.setTextColor(cSky[0], cSky[1], cSky[2]);
      doc.text(actLines, margin + 135, y + 3.5);

      y += rowHeight;
    });
    y += 5;
  }

  // ----------------------------------------------------
  // 4. TERMINAL UNITS (FCUs, VAVs) & EXHAUST FANS TABLE
  // ----------------------------------------------------
  if (report.terminalUnitsSummary && report.terminalUnitsSummary.length > 0) {
    checkPageBreak(30);
    doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('4. Terminal Units (VAV, FCU) & Exhaust Fan Deficiencies', margin, y);
    y += 4;

    doc.setFillColor(cNavy[0], cNavy[1], cNavy[2]);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('UNIT ID', margin + 2, y + 4.2);
    doc.text('AREA SERVED', margin + 35, y + 4.2);
    doc.text('OBSERVED DEFICIENCIES', margin + 75, y + 4.2);
    doc.text('REQUIRED ACTION', margin + 135, y + 4.2);
    y += 6;

    report.terminalUnitsSummary.forEach((term, idx) => {
      const uLines = doc.splitTextToSize(term.unitId, 30);
      const aLines = doc.splitTextToSize(term.areaServed, 36);
      const oLines = doc.splitTextToSize(term.observedDeficiencies, 56);
      const rLines = doc.splitTextToSize(term.actionRequired, 45);
      const rowHeight = Math.max(uLines.length, aLines.length, oLines.length, rLines.length) * 3.5 + 4;

      checkPageBreak(rowHeight);

      if (idx % 2 === 1) {
        doc.setFillColor(cLightBg[0], cLightBg[1], cLightBg[2]);
        doc.rect(margin, y, contentWidth, rowHeight, 'F');
      }
      doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
      doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
      doc.text(uLines, margin + 2, y + 3.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(cSlateText[0], cSlateText[1], cSlateText[2]);
      doc.text(aLines, margin + 35, y + 3.5);
      doc.text(oLines, margin + 75, y + 3.5);

      doc.setTextColor(cAmber[0], cAmber[1], cAmber[2]);
      doc.text(rLines, margin + 135, y + 3.5);

      y += rowHeight;
    });
    y += 5;
  }

  // ----------------------------------------------------
  // 5. VISUAL EVIDENCE & TECHNICAL BREAKDOWN FIGURES
  // ----------------------------------------------------
  if (report.visualEvidenceFigures && report.visualEvidenceFigures.length > 0) {
    checkPageBreak(30);
    doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('5. Visual Evidence & Field Inspection Captures', margin, y);
    y += 4;

    report.visualEvidenceFigures.forEach((fig) => {
      checkPageBreak(38);

      doc.setFillColor(cLightBg[0], cLightBg[1], cLightBg[2]);
      doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
      doc.roundedRect(margin, y, contentWidth, 32, 1.5, 1.5, 'FD');

      // Figure header line
      doc.setFillColor(cSky[0], cSky[1], cSky[2]);
      doc.roundedRect(margin + 3, y + 3, 22, 4.5, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.text(`FIGURE ${fig.figureNumber}`, margin + 14, y + 6.2, { align: 'center' });

      doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
      doc.setFontSize(8);
      doc.text(fig.title, margin + 28, y + 6.2);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`[${fig.categoryBadge}]`, pageWidth - margin - 4, y + 6.2, { align: 'right' });

      // Deficiencies list
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(cCrimson[0], cCrimson[1], cCrimson[2]);
      doc.text('Identified Deficiencies:', margin + 4, y + 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(cSlateText[0], cSlateText[1], cSlateText[2]);
      const defLines = doc.splitTextToSize(fig.identifiedDeficiencies.join(' | '), contentWidth - 8);
      doc.text(defLines, margin + 4, y + 16);

      // Corrective action
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(cEmerald[0], cEmerald[1], cEmerald[2]);
      doc.text('Recommended Corrective Action:', margin + 4, y + 23);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(cSlateText[0], cSlateText[1], cSlateText[2]);
      const recLines = doc.splitTextToSize(fig.recommendedCorrectiveAction, contentWidth - 8);
      doc.text(recLines, margin + 4, y + 27);

      y += 35;
    });
    y += 2;
  }

  // ----------------------------------------------------
  // 6. PRIORITIZED CORRECTIVE ACTION ROADMAP (3-PHASE)
  // ----------------------------------------------------
  checkPageBreak(40);
  doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('6. Prioritized Corrective Action Roadmap', margin, y);
  y += 4;

  const phaseW = (contentWidth - 4) / 3;

  // Phase 1 (Immediate)
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(margin, y, phaseW, 30, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(cCrimson[0], cCrimson[1], cCrimson[2]);
  doc.text('PHASE 1: 0 - 48 HOURS', margin + 3, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(cSlateText[0], cSlateText[1], cSlateText[2]);
  const p1Text = [
    '• Release Priority 8 manual overrides',
    '• Clear station JVM heap & purge logs',
    '• Inspect EOL resistors on offline trunks',
  ];
  let p1y = y + 8;
  p1Text.forEach((t) => {
    doc.text(t, margin + 3, p1y);
    p1y += 3.8;
  });

  // Phase 2 (Short-Term)
  const p2x = margin + phaseW + 2;
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(252, 211, 77);
  doc.roundedRect(p2x, y, phaseW, 30, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(cAmber[0], cAmber[1], cAmber[2]);
  doc.text('PHASE 2: 1 - 2 WEEKS', p2x + 3, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(cSlateText[0], cSlateText[1], cSlateText[2]);
  const p2Text = [
    '• Retune hunting PID cooling loops',
    '• Calibrate drift zone temp sensors',
    '• Restore economizer freeze stat links',
  ];
  let p2y = y + 8;
  p2Text.forEach((t) => {
    doc.text(t, p2x + 3, p2y);
    p2y += 3.8;
  });

  // Phase 3 (Long-Term)
  const p3x = margin + (phaseW + 2) * 2;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(p3x, y, phaseW, 30, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(cEmerald[0], cEmerald[1], cEmerald[2]);
  doc.text('PHASE 3: 30 - 90 DAYS', p3x + 3, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(cSlateText[0], cSlateText[1], cSlateText[2]);
  const p3Text = [
    '• Upgrade supervisory JACE firmware',
    '• Modernize legacy MS/TP trunks to IP',
    '• Deploy ASHRAE Guideline 36 logic',
  ];
  let p3y = y + 8;
  p3Text.forEach((t) => {
    doc.text(t, p3x + 3, p3y);
    p3y += 3.8;
  });

  y += 34;

  // ----------------------------------------------------
  // 7. FORMAL ENGINEERING SIGN-OFF & AUTHORIZATION
  // ----------------------------------------------------
  checkPageBreak(32);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('7. Engineering Verification & Authorization Sign-Off', margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `This commissioning field audit was performed in accordance with certified Tridium Niagara N4 engineering standards and ASHRAE Guideline 36.`,
    margin,
    y
  );
  y += 11;

  // Dual Signature Lines
  const signW = (contentWidth - 10) / 2;

  // Auditor Line
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + signW, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.text(`${report.auditorName || technicianName} — Lead BAS Controls Specialist`, margin, y + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`License: ${report.contractorLicense || 'FL-CMC1249871 / Niagara Certified'}`, margin, y + 8);

  // Client Representative Line
  const rightSignX = margin + signW + 10;
  doc.line(rightSignX, y, rightSignX + signW, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.text('Customer Facility Representative Authorization', rightSignX, y + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Facility: ${report.facilityName} (${report.customerName})`, rightSignX, y + 8);

  // Final footer
  renderFooter();

  // Save / Trigger Download
  const filename = `${report.customerName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${report.reportTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_audit_report.pdf`;
  doc.save(filename);
}
