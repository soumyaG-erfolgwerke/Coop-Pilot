import { createAdminClient } from "@/lib/appwrite-server";

import { assertCoopAdmin } from "@/lib/reports/auth/permissions";
import { getSession, resolveUser } from "@/lib/reports/auth/session";

import { computeCapitalSummaryReport } from "@/lib/reports/capitalSummary/compute";
import {
  getAllCoopMembers,
  getCapitalHistoryByMemberNumbers,
  getCoopFiscalYearRange,
} from "@/lib/reports/capitalSummary/data/cooperatives";
import {
  getReportFile,
  storeReportFileRecord,
  uploadFileBuffer,
} from "@/lib/reports/capitalSummary/data/storage";
import { getTransactionsInRange } from "@/lib/reports/capitalSummary/data/transactions";
import { getDistinctCapitalHolders } from "@/lib/reports/capitalSummary/data/transforms";
import { buildCapitalSummaryCsv } from "@/lib/reports/capitalSummary/export/csv";
import { buildCapitalSummaryPdf } from "@/lib/reports/capitalSummary/export/pdf";
import { CAPITAL_SUMMARY_FILENAME_PREFIX } from "@/lib/reports/constants";
import { getProfilesByUserIds } from "@/lib/reports/shareRegister/data/profiles";
import {
  assertNotTruncated,
  resBadRequest,
  resUnauthorized,
} from "@/lib/reports/utils/errors";
import {
  resolveAllOpeningBalances,
  resolveFiscalYearDates,
} from "@/lib/reports/utils/fiscalyear";
import { todayBerlinIso } from "@/lib/reports/utils/time";
import { NextResponse } from "next/server";
import { z } from "zod";

const reqSchema = z.object({
  coopId: z.string().min(1, "Coop Id is required"),
  fiscalYear: z.string().regex(/^\d{4}$/, "Fiscal year invalid"),
});

// POST /api/reports/capital-summary/generate?coopId=...&fiscalYear=YYYY
// DB-backed report route: returns report payload matching the UI contract.
export async function POST(req) {
  const session = await getSession();
  if (!session?.userId) return resUnauthorized();

  const user = await resolveUser(session);
  if (!user?.email) return resUnauthorized();

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return resBadRequest("Invalid or empty JSON body");
  }
  const validation = reqSchema.safeParse(body);

  try {
    if (!validation.success) {
      const error = validation.error.errors[0].message;
      return resBadRequest(error);
    }

    const { coopId, fiscalYear } = validation.data;

    // ---- AuthZ Guard (coop admin only) ----
    const { databases } = createAdminClient();
    const coopDoc = await assertCoopAdmin({
      databases,
      coopId,
      userEmail: user.email,
    });

    // ---- SAFEGUARD DEFENSIVE GUARD CHECK ----
    const duplicateCheck = await getReportFile({
      databases,
      coopId,
      fiscalYear,
    });
    if (duplicateCheck) {
      return NextResponse.json({
        success: true,
        report: duplicateCheck,
        cached: true,
      });
    }

    const coopFiscalYear = await getCoopFiscalYearRange({ databases, coopId });
    if (!coopFiscalYear) {
      return resBadRequest("Cooperative fiscal year settings not found. Please ensure fiscal year start and end dates are configured in the cooperative settings.");
    }
    const { fiscalYearStart, fiscalYearEnd } = resolveFiscalYearDates(
      coopFiscalYear,
      fiscalYear,
    );

    if (fiscalYearEnd >= todayBerlinIso()) {
      return resBadRequest("Fiscal year cannot be ongoing or in the future");
    }

    // ---- 2. Target the Roster ----
    const allMembers = await getAllCoopMembers({ databases, coopId });
    const { allMemberIds, allMemberNumbers, memberNumberToIdMap } =
      getDistinctCapitalHolders(allMembers, fiscalYearStart, fiscalYearEnd);

    // ---- 3. Batch fetch supporting records using clean arrays ----
    const profiles = await getProfilesByUserIds({
      databases,
      userIds: allMemberIds,
    });

    const histories = await getCapitalHistoryByMemberNumbers({
      databases,
      coopId,
      memberNumbers: allMemberNumbers,
    });

    const openingBalancesMap = await resolveAllOpeningBalances(
      coopId,
      histories,
      {
        year: fiscalYear,
        start: fiscalYearStart,
        end: fiscalYearEnd,
      },
    );

    // ---- 4. Fetch the Ledger Transactions for this specific window ----
    const txResult = await getTransactionsInRange({
      databases,
      coopId,
      startDate: fiscalYearStart,
      endDate: fiscalYearEnd,
    });
    assertNotTruncated(txResult, "Transaction fetch");
    const transactions = txResult.documents;

    // ---- 5. Compute the Report using pure function ----
    const report = computeCapitalSummaryReport({
      coopId: coopId,
      coopName: coopDoc?.name ?? null,
      gnrNo: coopDoc?.RegNumber ?? null,
      fiscalYear: {
        year: fiscalYear,
        start: fiscalYearStart,
        end: fiscalYearEnd,
      },
      memberNumberToIdMap: memberNumberToIdMap,
      openingBalances: openingBalancesMap,
      transactions: transactions,
      profiles: profiles,
      generatedBy: {
        userId: user.userId,
        email: user.email,
        name: user.name ?? null,
      },
    });

    const pdfBuffer = buildCapitalSummaryPdf(report);
    const csvBuffer = buildCapitalSummaryCsv(report);

    const FILENAME_DETAILS = `${coopDoc?.RegNumber}_FY${fiscalYear}`;

    const pdfUploadPromise = uploadFileBuffer({
      buffer: pdfBuffer,
      filename: `${CAPITAL_SUMMARY_FILENAME_PREFIX}_${FILENAME_DETAILS}.pdf`,
    });

    const csvUploadPromise = uploadFileBuffer({
      buffer: csvBuffer,
      filename: `${CAPITAL_SUMMARY_FILENAME_PREFIX}_${FILENAME_DETAILS}.csv`,
    });

    const [pdfResult, csvResult] = await Promise.all([
      pdfUploadPromise,
      csvUploadPromise,
    ]);

    const doc = await storeReportFileRecord({
      databases,
      coopId: coopId,
      coopName: coopDoc?.name ?? null,
      fiscalYear: fiscalYear,
      generatedBy: user.email,
      pdfUrl: pdfResult.fileUrl,
      csvUrl: csvResult.fileUrl,
    });

    return NextResponse.json({ success: true, report: doc, cached: false });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Capital summary generation failed", { code: error?.code, type: error?.type });
    return NextResponse.json(
      {
        success: false,
        error: "Could not generate capital summary",
      },
      { status: 500 },
    );
  }
}
