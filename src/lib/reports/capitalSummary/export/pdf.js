import {
  displayOrDash,
  formatEUR,
  formatNumberDE,
} from "@/lib/reports/utils/formatters";
import {
  formatGermanDateOnly,
  formatGermanDateTime,
  toUtcIso,
} from "@/lib/reports/utils/time";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DESIGN = {
  COLORS: {
    PRIMARY: [79, 70, 229],      // Indigo
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

// 6 Columns optimized for accounting balance statements
const COLUMN_WEIGHTS = [0.15, 0.25, 0.15, 0.15, 0.15, 0.15];

/**
 * Server-Side Document Engine: Compiles the visual PDF for the Member Capital Summary (M5.3).
 * Absorbs all metadata sanitization natively and returns a clean binary Buffer.
 */
export const buildCapitalSummaryPdf = (report) => {
  if (!report) throw new Error("report context payload is required");

  // 1. Native Metadata Sanitization (Replaces the discarded generator file)
  const meta = report.meta || {};
  const fiscalYear = meta.fiscalYear || {};
  const generatedBy = meta.generatedBy || null;

  const createdByLabel = (() => {
    if (!generatedBy) return "";
    return generatedBy.name || generatedBy.email || generatedBy.userId || "";
  })();

  // FIX: Slicing the first 10 characters (YYYY-MM-DD) completely bypasses the midnight timezone shift bug
  const safeStartIso = fiscalYear.start ? String(fiscalYear.start).slice(0, 10) : "";
  const safeEndIso = fiscalYear.end ? String(fiscalYear.end).slice(0, 10) : "";

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "p" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - DESIGN.LAYOUT.MARGIN * 2;
  const colWidths = COLUMN_WEIGHTS.map((w) => Math.max(10, usableWidth * w));

  // 2. Document Title Section
  doc.setFontSize(DESIGN.FONTS.TITLE);
  doc.setFont(undefined, "bold");
  doc.text("Geschäftsguthaben – Zusammenfassung", pageWidth / 2, 18, {
    align: "center",
  });

  // 3. Corporate Metadata Profile Header Block
  doc.setFontSize(DESIGN.FONTS.BODY);
  doc.setFont(undefined, "normal");
  doc.setTextColor(DESIGN.COLORS.TEXT_MUTED);

  const headerGrid = [
    ["Genossenschaft:", meta.coopName || "—"],
    ["GnR Nummer:", meta.gnrNo || "—"],
    ["Geschäftsjahr:", `${fiscalYear.year || "—"} (${formatGermanDateOnly(safeStartIso)} bis ${formatGermanDateOnly(safeEndIso)})`],
    ["Bericht erstellt am:", formatGermanDateTime(meta.generatedAt)],
    ["Erstellt durch:", displayOrDash(createdByLabel)],
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

  // Data Section Label (Required German legal designation for ledger movement progression)
  doc.setFontSize(DESIGN.FONTS.SUBTITLE);
  doc.setFont(undefined, "bold");
  doc.setTextColor(DESIGN.COLORS.TEXT_MAIN);
  doc.text("Entwicklung der Geschäftsguthaben", DESIGN.LAYOUT.MARGIN, cursorY + 10);

  // 4. Grid Visualization Mapping Loop
  const formattedTableRows = (report.rows || []).map((row) => [
    displayOrDash(row.memberNumber),
    displayOrDash(row.name),
    formatEUR(row.openingBalanceEUR),
    formatEUR(row.contributionsEUR),
    formatEUR(row.distributionsEUR),
    formatEUR(row.closingBalanceEUR),
  ]);

  autoTable(doc, {
    startY: cursorY + 14,
    head: [
      [
        "Mitgliedsnummer",
        "Name",
        "Anfangsbestand",
        "Zugänge (+)",
        "Abgänge (-)",
        "Endbestand",
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
      2: { cellWidth: colWidths[2], halign: "right" },
      3: { cellWidth: colWidths[3], halign: "right" },
      4: { cellWidth: colWidths[4], halign: "right" },
      5: { cellWidth: colWidths[5], halign: "right" },
    },
    margin: { left: DESIGN.LAYOUT.MARGIN, right: DESIGN.LAYOUT.MARGIN },
  });

  // 5. Dynamic Document Footer Pagination Boundaries
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

  // Simplified to "Summen" to match Share Register template layout
  enforcePageBreakThreshold(36);
  doc.setFontSize(DESIGN.FONTS.SUBTITLE);
  doc.setTextColor(DESIGN.COLORS.TEXT_MAIN);
  doc.setFont(undefined, "bold");
  doc.text("Summen", DESIGN.LAYOUT.MARGIN, lowerBlockY);

  doc.setFontSize(DESIGN.FONTS.BODY);
  const totals = report.totals || {};
  const numericalSummaries = [
    ["Gesamtzahl berücksichtigte Mitglieder:", formatNumberDE(totals.totalMembers)],
    ["Gesamt-Anfangsbestand:", formatEUR(totals.totalOpeningBalanceEUR)],
    ["Gesamt-Zugänge (laufendes Jahr):", formatEUR(totals.totalContributionsEUR)],
    ["Gesamt-Abgänge (laufendes Jahr):", formatEUR(totals.totalDistributionsEUR)],
    ["Gesamt-Endbestand (Eigenkapital):", formatEUR(totals.totalClosingBalanceEUR)],
  ];

  lowerBlockY += 6;
  for (const [label, metricValue] of numericalSummaries) {
    doc.setFont(undefined, "bold");
    doc.text(label, DESIGN.LAYOUT.MARGIN, lowerBlockY);
    doc.setFont(undefined, "normal");
    doc.text(String(metricValue), DESIGN.LAYOUT.MARGIN + 72, lowerBlockY);
    lowerBlockY += DESIGN.LAYOUT.LINE_HEIGHT;
  }

  // 6. Global Running Footer Rendering Pass
  const documentPageCount = doc.internal.getNumberOfPages();
  for (
    let currentPageIndex = 1;
    currentPageIndex <= documentPageCount;
    currentPageIndex += 1
  ) {
    doc.setPage(currentPageIndex);
    doc.setFontSize(DESIGN.FONTS.FOOTER);
    doc.setTextColor(DESIGN.COLORS.TEXT_LIGHT);

    // Uniform, symmetrical tracking watermark string utilizing UTC ISO boundaries
    const metadataWatermarkString = `Timestamp: ${toUtcIso(meta.generatedAt)} | Erstellt durch: ${displayOrDash(createdByLabel)}`;
    doc.text(metadataWatermarkString, DESIGN.LAYOUT.MARGIN, pageHeight - 8, {
      align: "left",
      maxWidth: usableWidth - 40,
    });

    doc.text(
      `Seite ${currentPageIndex} / ${documentPageCount}`,
      pageWidth - DESIGN.LAYOUT.MARGIN,
      pageHeight - 8,
      { align: "right" },
    );
  }

  // Compile directly to raw ArrayBuffer Node-ready storage chunk
  return Buffer.from(doc.output("arraybuffer"));
};