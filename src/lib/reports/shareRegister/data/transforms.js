const mapProfilesByUserId = (profiles) => {
  const out = new Map();

  for (const profile of profiles) {
    const userId = profile?.userId ?? null;
    if (!userId) continue;

    out.set(String(userId), profile);
  }

  return out;
};

const mapStatusesByMemberNumber = (statuses) => {
  const out = new Map();

  for (const status of statuses) {
    const memberNumber = status?.membershipId;
    if (!memberNumber) continue;

    out.set(String(memberNumber), status);
  }

  return out;
};

const aggregateTransactionsByMember = (transactions) => {
  const out = new Map();

  for (const tx of transactions) {
    const memberNumber = tx?.memberNumber;
    if (!memberNumber) continue;

    let summary = out.get(memberNumber);
    if (!summary) {
      summary = {
        memberId: tx?.memberId ?? null,
        sharesHeld: 0,
        capitalCents: 0,
      };

      out.set(memberNumber, summary);
    }

    const multiplier = tx.sign.toLowerCase() === "debit" ? -1 : 1;

    summary.sharesHeld += multiplier * Number(tx.shares || 0);
    summary.capitalCents += multiplier * Number(tx.amountCents || 0);
  }

  return out;
};

const getStatusAtCutoff = (historyJson, cutoffIso) => {
  const history = JSON.parse(historyJson);

  if (!Array.isArray(history)) {
    return null;
  }

  let status = null;

  for (const entry of history) {
    if (entry.changedAt > cutoffIso) {
      break;
    }

    status = entry.status;
  }

  return status;
};

const getEntryDate = (historyJson) => {
  const history = JSON.parse(historyJson);

  if (!Array.isArray(history)) {
    return null;
  }

  const activeEntry = history.find(
    (entry) => entry?.status?.toLowerCase() === "active",
  );

  return activeEntry?.changedAt ?? null;
};

const getDistinctMemberIdsFromTransactions = (transactions) => {
  const out = [];
  const seen = new Set();

  for (const tx of transactions || []) {
    const memberId = tx?.memberId ?? tx?.userId ?? null;
    if (!memberId) continue;

    const id = String(memberId);
    if (seen.has(id)) continue;

    seen.add(id);
    out.push(id);
  }

  return out;
};

const getDistinctMemberNumbersFromTransactions = (transactions) => {
  const out = [];
  const seen = new Set();

  for (const tx of transactions || []) {
    const memberNumber = tx?.memberNumber ?? null;
    if (!memberNumber) continue;

    const num = String(memberNumber);
    if (seen.has(num)) continue;

    seen.add(num);
    out.push(num);
  }

  return out;
};

export {
  aggregateTransactionsByMember,
  getDistinctMemberIdsFromTransactions,
  getDistinctMemberNumbersFromTransactions,
  getEntryDate,
  getStatusAtCutoff,
  mapProfilesByUserId,
  mapStatusesByMemberNumber,
};
