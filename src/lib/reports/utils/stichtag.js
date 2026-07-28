import { DEFAULT_TIMEZONE } from "@/lib/reports/constants";
import { DateTime } from "luxon";

const STICHTAG_RE = /^\d{4}-\d{2}-\d{2}$/;

export const isValidStichtag = (stichtag) => {
  if (!STICHTAG_RE.test(stichtag)) {
    return false;
  }

  return DateTime.fromISO(stichtag, {
    zone: DEFAULT_TIMEZONE,
  }).isValid;
};

export const stichtagToUtcCutoffIso = (stichtag, timeZone) => {
  if (!isValidStichtag(stichtag)) {
    throw new Error("Invalid stichtag");
  }

  return DateTime.fromISO(stichtag, {
    zone: timeZone ?? DEFAULT_TIMEZONE,
  })
    .endOf("day")
    .toUTC()
    .toISO();
};
