import { DEFAULT_TIMEZONE } from "@/lib/reports/constants";
import { DateTime } from "luxon";

/** UTC Time Helpers */
export const nowUtcIso = () => DateTime.utc().toISO();

export const toUtcIso = (value) =>
  DateTime.fromJSDate(new Date(value)).toUTC().toISO();

export const parseUtc = (iso) => DateTime.fromISO(iso, { zone: "utc" });

export const utcNowMillis = () => Date.now();

/** Berlin Time Helpers */
export const nowBerlin = () => DateTime.now().setZone(DEFAULT_TIMEZONE);

export const todayBerlinIso = () => nowBerlin().toISODate();

export const utcToBerlin = (utcIso) => {
  return DateTime.fromISO(utcIso, {
    zone: "utc",
  }).setZone(DEFAULT_TIMEZONE);
};

export const berlinEndOfDayUtcIso = (dateIso) => {
  return DateTime.fromISO(dateIso, {
    zone: DEFAULT_TIMEZONE,
  })
    .endOf("day")
    .toUTC()
    .toISO();
};

/** Frontend Time Helpers */
export const formatGermanDateTime = (utcIso) =>
  utcToBerlin(utcIso).toFormat("dd.MM.yyyy HH:mm");

export const formatGermanDate = (utcIso) =>
  utcToBerlin(utcIso).toFormat("dd.MM.yyyy");

export const formatGermanTime = (utcIso) =>
  utcToBerlin(utcIso).toFormat("HH:mm");

export const formatGermanDateOnly = (isoDate) => {
  const dt = DateTime.fromISO(isoDate, { zone: DEFAULT_TIMEZONE });
  if (!dt.isValid) {
    return "";
  } else {
    return dt.toFormat("dd.MM.yyyy");
  }
};
