import {
  aggregateTransactionsByMember,
  getEntryDate,
  getStatusAtCutoff,
  mapProfilesByUserId,
  mapStatusesByMemberNumber,
} from "@/lib/reports/shareRegister/data/transforms";
import { buildWarnings } from "@/lib/reports/utils/errors";
import { stichtagToUtcCutoffIso } from "@/lib/reports/utils/stichtag";
import { nowUtcIso } from "@/lib/reports/utils/time";

export const computeShareRegisterReport = ({
  coopId,
  coopName,
  gnrNo,
  stichtag,
  transactions,
  profiles,
  statuses,
  generatedBy = null,
}) => {
  const cutoffIso = stichtagToUtcCutoffIso(stichtag);

  const profileMap = mapProfilesByUserId(profiles);
  const statusMap = mapStatusesByMemberNumber(statuses);
  const aggregates = aggregateTransactionsByMember(transactions);

  const warningBuckets = {
    missingProfile: new Set(),
    missingStatus: new Set(),
  };

  const rows = [];

  for (const [memberNumber, agg] of aggregates) {
    const profile = profileMap.get(agg.memberId);
    const status = statusMap.get(memberNumber);

    if (!profile) {
      warningBuckets.missingProfile.add(memberNumber);
    }
    if (!status) {
      warningBuckets.missingStatus.add(memberNumber);
    }

    rows.push({
      memberNumber,
      name: [profile?.FirstName, profile?.LastName].filter(Boolean).join(" "),
      dateOfBirth: profile?.bday ?? null,
      entryDate: getEntryDate(status?.historyJson),
      shares: agg.sharesHeld,
      totalCapitalEUR: agg.capitalCents / 100,
      status: getStatusAtCutoff(status?.historyJson, cutoffIso),
    });
  }

  rows.sort((a, b) =>
    a.memberNumber.localeCompare(b.memberNumber, undefined, { numeric: true }),
  );

  const totals = rows.reduce(
    (acc, row) => {
      acc.totalMembers += row.status?.toLowerCase() === "active" ? 1 : 0;
      acc.totalShares += row.shares;
      acc.totalCapitalEUR += row.totalCapitalEUR;

      return acc;
    },
    {
      totalMembers: 0,
      totalShares: 0,
      totalCapitalEUR: 0,
    },
  );

  return {
    meta: {
      coopId: coopId ?? null,
      coopName: coopName ?? null,
      gnrNo: gnrNo ?? null,
      stichtag: stichtag ?? null,
      generatedAt: nowUtcIso(),
      generatedBy: generatedBy ?? null,
      warnings: buildWarnings(warningBuckets),
    },
    totals: totals ?? { totalMembers: 0, totalShares: 0, totalCapitalEUR: 0 },
    rows: rows ?? [],
  };
};
