import { SHARE_REGISTER_FILENAME_PREFIX } from "@/lib/reports/constants";
import { prepareReportMetadata } from "@/lib/reports/shareRegister/prepareReportData";
import {
  displayOrDash,
  formatEUR,
  formatNumberDE,
  safeFilenamePart,
} from "@/lib/reports/utils/formatters";
import {
  formatGermanDateOnly,
  formatGermanDateTime,
  toUtcIso,
} from "@/lib/reports/utils/time";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Typography and Color Palette Guidelines
const DESIGN = {
  COLORS: {
    PRIMARY: [79, 70, 229], // Indigo
    BG_ALT_ROW: [245, 245, 245], // Light Gray
    TEXT_MAIN: 40,
    TEXT_MUTED: 80,
    TEXT_LIGHT: 120,
    BORDER_LIGHT: 180,
    BORDER_DARK: 160,
  },
  FONTS: { TITLE: 16, SUBTITLE: 11, BODY: 10, TABLE: 8.5, FOOTER: 8 },
  LAYOUT: { MARGIN: 10, LINE_HEIGHT: 5 },
};

const COLUMN_WEIGHTS = [0.14, 0.24, 0.12, 0.12, 0.08, 0.16, 0.14];

export const exportShareRegisterPdf = ({
  report,
  generatedByOverride,
} = {}) => {
  if (!report) throw new Error("report context payload is required");

  // Load clean unified values from infrastructure layer
  const meta = prepareReportMetadata(report, generatedByOverride);

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "p" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - DESIGN.LAYOUT.MARGIN * 2;
  const colWidths = COLUMN_WEIGHTS.map((w) => Math.max(10, usableWidth * w));

  // 1. Document Title Section
  doc.setFontSize(DESIGN.FONTS.TITLE);
  doc.setFont(undefined, "bold");
  doc.text("Anteilsregister – Zusammenfassung", pageWidth / 2, 18, {
    align: "center",
  });

  // 2. Corporate Metadata Profile Header Block
  doc.setFontSize(DESIGN.FONTS.BODY);
  doc.setFont(undefined, "normal");
  doc.setTextColor(DESIGN.COLORS.TEXT_MUTED);

  const headerGrid = [
    ["Genossenschaft:", meta.coopName || "—"],
    ["GnR Number:", meta.gnrNo || "—"],
    ["Stichtag:", formatGermanDateOnly(meta.stichtag)],
    ["Bericht erstellt am:", formatGermanDateTime(meta.generatedAtUtc)],
    ["Erstellt durch:", displayOrDash(meta.createdByLabel)],
  ];

  const valueAnchorX = DESIGN.LAYOUT.MARGIN + 52;
  let cursorY = 26;

  for (const [key, val] of headerGrid) {
    doc.setFont(undefined, "bold");
    doc.text(key, DESIGN.LAYOUT.MARGIN, cursorY);
    doc.setFont(undefined, "normal");
    doc.text(String(val), valueAnchorX, cursorY, {
      maxWidth: pageWidth - DESIGN.LAYOUT.MARGIN - valueAnchorX,
    });
    cursorY += DESIGN.LAYOUT.LINE_HEIGHT;
  }

  // Structural Separation Line
  doc.setDrawColor(DESIGN.COLORS.BORDER_LIGHT);
  doc.setLineWidth(0.3);
  doc.line(
    DESIGN.LAYOUT.MARGIN,
    cursorY + 1,
    pageWidth - DESIGN.LAYOUT.MARGIN,
    cursorY + 1,
  );

  // Data Section Label
  doc.setFontSize(DESIGN.FONTS.SUBTITLE);
  doc.setFont(undefined, "bold");
  doc.setTextColor(DESIGN.COLORS.TEXT_MAIN);
  doc.text("Mitgliederliste", DESIGN.LAYOUT.MARGIN, cursorY + 10);

  // 3. Grid Visualization Mapping Loop
  const formattedTableRows = (report.rows || []).map((row) => [
    //The PDF table writes DOB/entry date cells directly from formatGermanDateOnly(...). For missing/invalid dates, Luxon formatting yields "Invalid DateTime" which will end up in the export. Wrap formatted date cells with displayOrDash(...) so missing dates render as a dash.
    displayOrDash(row.memberNumber),
    displayOrDash(row.name),
    displayOrDash(formatGermanDateOnly(row.dateOfBirth)),
    displayOrDash(formatGermanDateOnly(row.entryDate)),
    formatNumberDE(row.shares),
    formatEUR(row.totalCapitalEUR),
    displayOrDash(row.status),
  ]);

  autoTable(doc, {
    startY: cursorY + 14,
    head: [
      [
        "Mitgliedsnummer",
        "Name",
        "Geburtsdatum",
        "Eintrittsdatum",
        "Anteile",
        "Kapital (EUR)",
        "Status",
      ],
    ],
    body: formattedTableRows,
    theme: "grid",
    styles: { fontSize: DESIGN.FONTS.TABLE, cellPadding: 3, valign: "middle" },
    headStyles: {
      fillColor: DESIGN.COLORS.PRIMARY,
      textColor: 255,
      halign: "center",
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: DESIGN.COLORS.BG_ALT_ROW },
    tableWidth: usableWidth,
    columnStyles: {
      0: { cellWidth: colWidths[0] },
      1: { cellWidth: colWidths[1] },
      2: { cellWidth: colWidths[2], halign: "center" },
      3: { cellWidth: colWidths[3], halign: "center" },
      4: { cellWidth: colWidths[4], halign: "right" },
      5: { cellWidth: colWidths[5], halign: "right" },
      6: { cellWidth: colWidths[6] },
    },
    margin: { left: DESIGN.LAYOUT.MARGIN, right: DESIGN.LAYOUT.MARGIN },
  });

  // 4. Dynamic Document Footer Pagination Boundaries
  let lowerBlockY = (doc.lastAutoTable?.finalY || cursorY + 14) + 16;

  const enforcePageBreakThreshold = (allocationRequirementMm) => {
    if (
      lowerBlockY + allocationRequirementMm <=
      pageHeight - DESIGN.LAYOUT.MARGIN
    )
      return;
    doc.addPage();
    lowerBlockY = DESIGN.LAYOUT.MARGIN;
  };

  // Summaries Title Element
  enforcePageBreakThreshold(26);
  doc.setFontSize(DESIGN.FONTS.SUBTITLE);
  doc.setTextColor(DESIGN.COLORS.TEXT_MAIN);
  doc.setFont(undefined, "bold");
  doc.text("Summen", DESIGN.LAYOUT.MARGIN, lowerBlockY);

  // Summary Key-Value Render Loop
  doc.setFontSize(DESIGN.FONTS.BODY);
  const summaryReportData = report.totals || {};
  const numericalSummaries = [
    [
      "Gesamtzahl Mitglieder (aktiv):",
      formatNumberDE(summaryReportData.totalMembers),
    ],
    ["Gesamtanteile:", formatNumberDE(summaryReportData.totalShares)],
    ["Gesamtkapital (EUR):", formatEUR(summaryReportData.totalCapitalEUR)],
  ];

  lowerBlockY += 6;
  for (const [label, metricValue] of numericalSummaries) {
    doc.setFont(undefined, "bold");
    doc.text(label, DESIGN.LAYOUT.MARGIN, lowerBlockY);
    doc.setFont(undefined, "normal");
    doc.text(String(metricValue), DESIGN.LAYOUT.MARGIN + 60, lowerBlockY);
    lowerBlockY += DESIGN.LAYOUT.LINE_HEIGHT;
  }

  // Wet Signature Input Block Placement
  lowerBlockY += 4;
  enforcePageBreakThreshold(18);
  doc.setDrawColor(DESIGN.COLORS.BORDER_DARK);
  doc.setLineWidth(0.3);
  doc.line(
    DESIGN.LAYOUT.MARGIN,
    lowerBlockY + 8,
    DESIGN.LAYOUT.MARGIN + 70,
    lowerBlockY + 8,
  );
  doc.text("Unterschrift", DESIGN.LAYOUT.MARGIN, lowerBlockY + 13);

  // 5. Global Running Footer Rendering Pass
  const documentPageCount = doc.internal.getNumberOfPages();
  for (
    let currentPageIndex = 1;
    currentPageIndex <= documentPageCount;
    currentPageIndex += 1
  ) {
    doc.setPage(currentPageIndex);
    doc.setFontSize(DESIGN.FONTS.FOOTER);
    doc.setTextColor(DESIGN.COLORS.TEXT_LIGHT);

    const metadataWatermarkString = `Timestamp: ${toUtcIso(meta.generatedAtUtc)} | Erstellt durch: ${displayOrDash(meta.createdByLabel)}`;
    doc.text(metadataWatermarkString, DESIGN.LAYOUT.MARGIN, pageHeight - 8, {
      align: "left",
      maxWidth: usableWidth - 40,
    });

    doc.text(
      `Seite ${currentPageIndex} / ${documentPageCount}`,
      pageWidth - DESIGN.LAYOUT.MARGIN,
      pageHeight - 8,
      {
        align: "right",
      },
    );
  }

  const generatedDocName = `${SHARE_REGISTER_FILENAME_PREFIX}_${safeFilenamePart(meta.gnrNo)}_${safeFilenamePart(meta.stichtag)}.pdf`;
  doc.save(generatedDocName);
};
