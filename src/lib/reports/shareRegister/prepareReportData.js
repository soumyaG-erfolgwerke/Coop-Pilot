import { nowUtcIso } from "@/lib/reports/utils/time";

export const prepareReportMetadata = (report, generatedByOverride) => {
  const meta = report?.meta ?? {};

  const generatedBy = generatedByOverride ?? meta.generatedBy;

  const createdByLabel = (() => {
    if (!generatedBy) return "";
    return generatedBy.name ?? generatedBy.email ?? generatedBy.userId ?? "";
  })();

  return {
    coopId: meta.coopId ?? "",
    coopName: meta.coopName ?? "",
    gnrNo: meta.gnrNo ?? "",
    stichtag: meta.stichtag ?? "",
    generatedAtUtc: meta.generatedAt ?? nowUtcIso(),
    createdByLabel,
  };
};

export const hasValidTotals = (totals) => {
  if (!totals) return false;
  return (
    Number.isFinite(Number(totals.totalShares)) ||
    Number.isFinite(Number(totals.totalCapitalEUR)) ||
    Number.isFinite(Number(totals.totalMembers))
  );
};
