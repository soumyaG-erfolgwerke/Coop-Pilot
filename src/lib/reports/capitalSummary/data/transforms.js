const aggregateTransactionsByMember = (transactions) => {
  const out = new Map();

  for (const tx of transactions || []) {
    const memberNumber = tx?.memberNumber ? String(tx.memberNumber) : null;
    if (!memberNumber) continue;

    let summary = out.get(memberNumber);
    if (!summary) {
      summary = {
        contributionsCents: 0,
        distributionsCents: 0,
      };
      out.set(memberNumber, summary);
    }

    const amount = Number(tx.amountCents || 0);
    const isDebit = tx.sign?.toLowerCase() === "debit";

    if (isDebit) {
      summary.distributionsCents += amount;
    } else {
      summary.contributionsCents += amount;
    }
  }

  return out;
};

/**
 * Helper: Validates if a member status history intersects with the targeted window boundary.
 * Natively compares ISO-8601 strings for maximum efficiency.
 */
const wasCapitalHolderInWindow = (historyJson, windowStartIso, windowEndIso) => {
  if (!historyJson?.length) return false;

  const capitalStatuses = ["active", "noticegiven"];
  const sorted = [...historyJson].sort((a, b) => a.changedAt.localeCompare(b.changedAt));

  return sorted.some((current, i) => {
    if (!capitalStatuses.includes(current.status.toLowerCase())) return false;

    const next = sorted[i + 1];
    // Airtight Overlap: Started before/during the window AND didn't end before the window opened
    return current.changedAt <= windowEndIso && (!next || next.changedAt >= windowStartIso);
  });
}

const getDistinctCapitalHolders = (allMembers, startDate, endDate) => {
  const memberIds = new Set();
  const memberNumbers = new Set();
  const memberNumberToIdMap = new Map();

  for (const member of allMembers || []) {
    let history = [];

    if (typeof member.historyJson === "string") {
      try {
        history = JSON.parse(member.historyJson);
      } catch (error) {
        console.error(`Skipping malformed historyJson on member: ${member.$id}`, error);
        continue;
      }
    } else if (Array.isArray(member.historyJson)) {
      history = member.historyJson;
    }

    if (wasCapitalHolderInWindow(history, startDate, endDate)) {
      const id = member.userId ?? null;
      const num = member.membershipId ?? null;

      if (id) memberIds.add(String(id));
      if (num) memberNumbers.add(String(num));
      if (id && num) memberNumberToIdMap.set(String(num), String(id));
    }
  }

  return {
    allMemberIds: [...memberIds],
    allMemberNumbers: [...memberNumbers],
    memberNumberToIdMap,
  };
};


export { aggregateTransactionsByMember, getDistinctCapitalHolders };
