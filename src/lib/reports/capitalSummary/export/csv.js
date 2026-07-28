import { CSV_DELIMITER } from "@/lib/reports/constants";
import {
  displayOrBlank,
  formatDecimalDE,
} from "@/lib/reports/utils/formatters";

/**
 * Escapes structural cells dynamically to enforce safe character boundary limits
 * against delimiter conflicts or line breaks.
 */
const escapeCsvCell = (value) => {
  const raw = value === null || value === undefined ? "" : String(value);
  const needsQuotes = new RegExp(`[\\r\\n"${CSV_DELIMITER}]`).test(raw);
  const escaped = raw.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
};

/**
 * Compiles a multi-dimensional array matrix into a standardized
 * delimited data string segment.
 */
const toCsvString = (matrix) =>
  matrix.map((row) => row.map(escapeCsvCell).join(CSV_DELIMITER)).join("\r\n");

/**
 * Server-Side Document Engine: Compiles the structured CSV spreadsheet layout
 * for the Member Capital Summary (M5.3). Returns a clean binary Buffer.
 */
export const buildCapitalSummaryCsv = (report) => {
  if (!report) throw new Error("report context payload is required");

  const rawRows = report.rows || [];
  const rawTotals = report.totals || {};

  // FIX: Isolated string slicing (first 10 characters) avoids the midnight timezone shift bug
  // 2. Primary Column Grid Headers
  const gridHeaders = [
    "Mitgliedsnummer",
    "Name",
    "Anfangsbestand",
    "Zugaenge (+)",
    "Abgaenge (-)",
    "Endbestand",
  ];

  // 3. Map Main Body Content Rows (Converts EUR figures cleanly using German decimals)
  const bodyRows = rawRows.map((row) => [
    displayOrBlank(row.memberNumber),
    displayOrBlank(row.name),
    formatDecimalDE(row.openingBalanceEUR),
    formatDecimalDE(row.contributionsEUR),
    formatDecimalDE(row.distributionsEUR),
    formatDecimalDE(row.closingBalanceEUR),
  ]);

  // 4. Symmetrical Totals Appending Layer
  if (rawTotals && Object.keys(rawTotals).length > 0) {
    bodyRows.push([
      "SUMME",
      "",
      formatDecimalDE(rawTotals.totalOpeningBalanceEUR),
      formatDecimalDE(rawTotals.totalContributionsEUR),
      formatDecimalDE(rawTotals.totalDistributionsEUR),
      formatDecimalDE(rawTotals.totalClosingBalanceEUR),
    ]);
  }

  // 5. Assemble CSV with Byte Order Mark (BOM) to enforce perfect German Excel rendering
  const UTF8_BOM = "\uFEFF";

  const fullGridString = toCsvString([gridHeaders, ...bodyRows]);

  const completeCsvPayload = UTF8_BOM + fullGridString;

  // Compile layout string directly into a raw Node.js Buffer for storage streaming
  return Buffer.from(completeCsvPayload, "utf-8");
};