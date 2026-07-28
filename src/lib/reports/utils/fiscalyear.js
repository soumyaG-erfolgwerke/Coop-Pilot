import { storeClosingBalance } from "@/lib/reports/capitalSummary/data/cooperatives";
import { fetchTransactionsByMemberNumber } from "@/lib/reports/capitalSummary/data/transactions";
import { DateTime } from "luxon";

const resolveFiscalYearDates = (coopFiscalYear, fiscalYear) => {
  const startYear = parseInt(fiscalYear, 10);
  const [startMonth, startDay] = coopFiscalYear.fiscal_year_start
    .split("-")
    .map(Number);
  const [endMonth, endDay] = coopFiscalYear.fiscal_year_end
    .split("-")
    .map(Number);

  let endYear = startYear;
  // Handle split fiscal years (e.g., starting 2024-05-10 and ending 2025-05-09)
  if (endMonth < startMonth || (endMonth === startMonth && endDay < startDay)) {
    endYear = startYear + 1;
  }

  // Force everything into explicit UTC boundaries for DB queries
  const fiscalYearStart = DateTime.fromObject(
    { year: startYear, month: startMonth, day: startDay },
    { zone: "utc" },
  )
    .startOf("day")
    .toISO();

  const fiscalYearEnd = DateTime.fromObject(
    { year: endYear, month: endMonth, day: endDay },
    { zone: "utc" },
  )
    .endOf("day")
    .toISO();

  return { fiscalYearStart, fiscalYearEnd };
};

const calculateBalanceFromTransactions = (transactions) => {
  if (!transactions?.length) return 0;

  return transactions.reduce((accumulatedBalance, tx) => {
    const multiplier = tx.sign?.toLowerCase() === "debit" ? -1 : 1;
    return accumulatedBalance + multiplier * Number(tx.amountCents ?? 0);
  }, 0);
};

const resolveAllOpeningBalances = async (coopId, histories, fiscalYear) => {
  const openingBalanceMap = new Map();
  const targetPriorYear = fiscalYear.year - 1;

  await Promise.all(
    (histories || []).map(async (historyDoc) => {
      const memberNumber = historyDoc.membershipId;
      if (!memberNumber) return;

      // Parse the array structure defensively
      let historyEntries = [];
      if (historyDoc.capitalHistoryJson) {
        try {
          historyEntries =
            typeof historyDoc.capitalHistoryJson === "string"
              ? JSON.parse(historyDoc.capitalHistoryJson)
              : historyDoc.capitalHistoryJson;
        } catch (e) {
          console.error(
            `Failed parsing history array for member ${memberNumber}`,
            e,
          );
        }
      }

      // Attempt to locate the specific year's configuration block inside the array
      const cachedYearData = Array.isArray(historyEntries)
        ? historyEntries.find(
            (entry) => String(entry.fiscalYear) === String(targetPriorYear),
          )
        : null;

      if (cachedYearData) {
        openingBalanceMap.set(
          String(memberNumber),
          Number(cachedYearData.closingBalance ?? 0),
        );
      } else {
        console.log(
          `Cache miss for member ${memberNumber} for year ${targetPriorYear}. Computing...`,
        );

        const historicalLedger = await fetchTransactionsByMemberNumber(
          coopId,
          memberNumber,
          fiscalYear.start,
        );

        const computedCentsBalance =
          calculateBalanceFromTransactions(historicalLedger);
        await storeClosingBalance(
          historyDoc.$id,
          historyEntries,
          targetPriorYear,
          computedCentsBalance,
        );
        openingBalanceMap.set(String(memberNumber), computedCentsBalance);
      }
    }),
  );

  return openingBalanceMap;
};

export { resolveAllOpeningBalances, resolveFiscalYearDates };
