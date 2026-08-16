import { createAdminClient } from "@/lib/appwrite-server";

import { assertCoopAdmin } from "@/lib/reports/auth/permissions";
import { getSession, resolveUser } from "@/lib/reports/auth/session";

import { getProfilesByUserIds } from "@/lib/reports/shareRegister/data/profiles";
import { getStatusByUserIds } from "@/lib/reports/shareRegister/data/statuses";
import { getTransactionsTillCutoff } from "@/lib/reports/shareRegister/data/transactions";

import { computeShareRegisterReport } from "@/lib/reports/shareRegister/compute";
import {
  getDistinctMemberIdsFromTransactions,
  getDistinctMemberNumbersFromTransactions,
} from "@/lib/reports/shareRegister/data/transforms";
import {
  assertNotTruncated,
  resBadRequest,
  resUnauthorized,
} from "@/lib/reports/utils/errors";
import {
  isValidStichtag,
  stichtagToUtcCutoffIso,
} from "@/lib/reports/utils/stichtag";
import { todayBerlinIso } from "@/lib/reports/utils/time";
import { NextResponse } from "next/server";
import { z } from "zod";

const reqSchema = z.object({
  coopId: z.string().min(1),
  stichtag: z.string().refine(isValidStichtag, {
    message: "Invalid stichtag format (expected YYYY-MM-DD)",
  }),
});

// GET /api/reports/share-register?coopId=...&stichtag=YYYY-MM-DD
// DB-backed report route: returns report payload matching the UI contract.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("coopId");
  const st = searchParams.get("stichtag");
  try {
    const validation = reqSchema.safeParse({ coopId: id, stichtag: st });
    if (!validation.success) {
      const error = validation.error.errors[0].message;
      return resBadRequest(error);
    }

    const { coopId, stichtag } = validation.data;

    if (stichtag >= todayBerlinIso()) {
      return resBadRequest("Stichtag cannot be today or in the future");
    }

    // ---- AuthN (session cookie) ----
    const session = await getSession();
    if (!session?.userId) return resUnauthorized();

    const user = await resolveUser(session);
    if (!user?.email) return resUnauthorized();

    // ---- AuthZ Guard (coop admin only) ----
    const { databases } = createAdminClient();
    const coopDoc = await assertCoopAdmin({
      databases,
      coopId,
      userEmail: user.email,
    });

    // ---- Transactions from DB (limit=500 + pagination) ----
    const cutoffIso = stichtagToUtcCutoffIso(stichtag);
    const txResult = await getTransactionsTillCutoff({
      databases,
      coopId,
      cutoffIso,
    });

    assertNotTruncated(txResult, "Transaction fetch");
    const transactions = txResult.documents;

    // ---- Profiles and Statuses from DB (distinct memberIds -> batch fetch) ----
    const memberIds = getDistinctMemberIdsFromTransactions(transactions);
    const memberNumbers =
      getDistinctMemberNumbersFromTransactions(transactions);

    const profiles = await getProfilesByUserIds({
      databases,
      userIds: memberIds,
    });
    const statuses = await getStatusByUserIds({
      databases,
      coopId,
      userIds: memberIds,
      memberNumbers,
    });

    const report = computeShareRegisterReport({
      coopId: coopId,
      coopName: coopDoc?.name ?? null,
      gnrNo: coopDoc?.RegNumber ?? null,
      stichtag: stichtag,
      transactions: transactions,
      profiles: profiles,
      statuses: statuses,
      generatedBy: {
        userId: user.userId,
        email: user.email,
        name: user.name ?? null,
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Share register generation failed", { code: error?.code, type: error?.type });
    return NextResponse.json(
      { success: false, error: "Could not generate share register" },
      { status: 500 },
    );
  }
}
