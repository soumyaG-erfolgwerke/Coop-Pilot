import { DEFAULT_LOCALE } from "@/lib/reports/constants";

/** String Null/Blank Fallbacks */
export const displayOrDash = (value) => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" && value.trim() === "") return "—";
  return String(value);
};

export const displayOrBlank = (value) => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return str.trim() === "" ? "" : str;
};

/** Numeric Formatting Primitives */
export const formatInt = (num) => {
  const parsed = parseInt(num ?? 0, 10);
  return String(Number.isFinite(parsed) ? parsed : 0);
};

export const formatNumberDE = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat(DEFAULT_LOCALE).format(n);
};

export const formatDecimalDE = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
};

export const formatEUR = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(n);
};

/** Filename Sanitation Strategies */
export const safeFilenamePart = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 80);

export const safeCsvFilenamePart = (value) =>
  String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
