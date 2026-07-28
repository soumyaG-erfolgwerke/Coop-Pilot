import { SHARE_REGISTER_FILENAME_PREFIX, CSV_DELIMITER } from "@/lib/reports/constants";
import {
  hasValidTotals,
  prepareReportMetadata,
} from "@/lib/reports/shareRegister/prepareReportData";
import {
  displayOrBlank,
  formatDecimalDE,
  formatInt,
  safeCsvFilenamePart,
} from "@/lib/reports/utils/formatters";
import { formatGermanDateOnly } from "@/lib/reports/utils/time";

const escapeCsvCell = (value) => {
  const raw = value === null || value === undefined ? "" : String(value);
  const needsQuotes = new RegExp(`[\\r\\n"${CSV_DELIMITER}]`).test(raw);
  const escaped = raw.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
};

const toCsvString = (matrix) =>
  matrix.map((row) => row.map(escapeCsvCell).join(CSV_DELIMITER)).join("\r\n");

const triggerFileDownload = ({ filename, text, mimeType }) => {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();

  anchor.remove();
  URL.revokeObjectURL(url);
};

export const exportShareRegisterCsv = ({ report }) => {
  if (!report) throw new Error("report context payload is required");

  const meta = prepareReportMetadata(report);
  const rawRows = report.rows || [];
  const rawTotals = report.totals || {};

  const headers = [
    "Mitgliedsnummer",
    "Name",
    "Geburtsdatum",
    "Eintrittsdatum",
    "Anteile",
    "Kapital (EUR)",
    "Status",
  ];

  // 1. Map Main Body Content Rows
  const bodyRows = rawRows.map((row) => [
    displayOrBlank(row.memberNumber),
    displayOrBlank(row.name),
    formatGermanDateOnly(row.dateOfBirth),
    formatGermanDateOnly(row.entryDate),
    formatInt(row.shares),
    formatDecimalDE(row.totalCapitalEUR),
    displayOrBlank(row.status),
  ]);

  // 2. Conditionally Inject Custom Appended Totals Row
  if (hasValidTotals(rawTotals)) {
    const statusText = Number.isFinite(Number(rawTotals.totalMembers))
      ? `Mitglieder aktiv: ${formatInt(rawTotals.totalMembers)}`
      : "";

    bodyRows.push([
      "SUMME",
      "",
      "",
      "",
      formatInt(rawTotals.totalShares),
      formatDecimalDE(rawTotals.totalCapitalEUR),
      statusText,
    ]);
  }

  // 3. Assemble CSV with Byte Order Mark for Excel Compatibility
  const UTF8_BOM = "\uFEFF";
  const completeCsvPayload = UTF8_BOM + toCsvString([headers, ...bodyRows]);

  const defaultStichtag = new Date().toISOString().slice(0, 10);
  const finalizedFilename = `${SHARE_REGISTER_FILENAME_PREFIX}_${safeCsvFilenamePart(meta.coopId)}_${safeCsvFilenamePart(meta.stichtag || defaultStichtag)}.csv`;

  triggerFileDownload({
    filename: finalizedFilename,
    text: completeCsvPayload,
    mimeType: "text/csv;charset=utf-8",
  });
};
