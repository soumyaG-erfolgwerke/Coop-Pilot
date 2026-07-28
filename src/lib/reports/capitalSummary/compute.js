import { aggregateTransactionsByMember } from "@/lib/reports/capitalSummary/data/transforms";
import { mapProfilesByUserId } from "@/lib/reports/shareRegister/data/transforms";
import { buildWarnings } from "@/lib/reports/utils/errors";
import { nowUtcIso } from "@/lib/reports/utils/time";

/**
 * Core Calculator: Generates GoBD-compliant Year-End Capital Summary Reports[cite: 188, 375].
 */
export const computeCapitalSummaryReport = ({
  coopId,
  coopName,
  gnrNo,
  fiscalYear,
  memberNumberToIdMap,
  transactions,
  profiles,
  openingBalances,
  generatedBy = null,
}) => {
  const profileMap = mapProfilesByUserId(profiles);
  const deltaTxMap = aggregateTransactionsByMember(transactions);

  const warningBuckets = {
    missingProfile: new Set(),
    missingOpeningBalance: new Set(),
  };

  const rows = [];

  // Integer cents accumulation targets for grand totals
  let totalMembers = 0;
  let totalOpeningCents = 0;
  let totalContributionsCents = 0;
  let totalDistributionsCents = 0;
  let totalClosingCents = 0;

  // MASTER LOOP: Iterate over all members who held capital, NOT just those with transactions
  for (const [
    memberNumber,
    openingBalanceCents,
  ] of openingBalances) {
    const stringKey = String(memberNumber);
    const agg = deltaTxMap.get(stringKey);
    const openingCents = openingBalanceCents ?? 0;

    // Fall back safely if the member had no current year transaction deltas
    const contributionsCents = agg?.contributionsCents || 0;
    const distributionsCents = agg?.distributionsCents || 0;

    // §30 GenG Core Accounting Equation: Closing = Opening + Additions - Reductions [cite: 375]
    const closingBalanceCents =
      openingCents + contributionsCents - distributionsCents;

    const memberId = memberNumberToIdMap.get(stringKey);
    const profile = memberId ? profileMap.get(String(memberId)) : null;

    // Defensive warning captures with proper variable scope references
    if (!profile && memberId) {
      warningBuckets.missingProfile.add(String(memberId));
    }
    if (openingCents === undefined) {
      warningBuckets.missingOpeningBalance.add(stringKey);
    }

    // Accumulate total metrics securely via integers to avoid float decay
    totalMembers += 1;
    totalOpeningCents += openingCents;
    totalContributionsCents += contributionsCents;
    totalDistributionsCents += distributionsCents;
    totalClosingCents += closingBalanceCents;

    // Push decimal representations (EUR) safely to the row payload array
    rows.push({
      memberNumber: stringKey,
      name: [profile?.FirstName, profile?.LastName].filter(Boolean).join(" "),
      openingBalanceEUR: openingCents / 100,
      contributionsEUR: contributionsCents / 100,
      distributionsEUR: distributionsCents / 100,
      closingBalanceEUR: closingBalanceCents / 100,
    });
  }

  // Chronological alphanumeric sort by member number for the auditor [cite: 104, 341]
  rows.sort((a, b) =>
    a.memberNumber.localeCompare(b.memberNumber, undefined, { numeric: true }),
  );

  return {
    meta: {
      coopId: coopId ?? null,
      coopName: coopName ?? null,
      gnrNo: gnrNo ?? null,
      fiscalYear: fiscalYear ?? null,
      generatedAt: nowUtcIso(),
      generatedBy: generatedBy ?? null,
      warnings: buildWarnings(warningBuckets),
    },
    totals: {
      totalMembers,
      totalOpeningBalanceEUR: totalOpeningCents / 100,
      totalContributionsEUR: totalContributionsCents / 100,
      totalDistributionsEUR: totalDistributionsCents / 100,
      totalClosingBalanceEUR: totalClosingCents / 100,
    },
    rows,
  };
};
