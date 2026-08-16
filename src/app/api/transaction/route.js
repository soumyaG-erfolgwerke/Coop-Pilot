import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_TRANSACTION,
} from "@/lib/appwrite-server";
import { DEFAULT_COOPERATIVE_SETTINGS } from "@/lib/cooperativeSettingsSchema";
import {
  getSettingsDocumentByCoopId,
  deriveDefaultSettingsFromCoop,
} from "@/lib/helpers/_helpers";
import { requireRole, resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { boundedId, boundedText, validateStrictObject } from "@/lib/validation/strict-object";

// GET /api/transaction - Get all transactions
export async function GET() {
  try {
    requireRole(await resolveSession(), ["superuser"]);
    const { databases } = createAdminClient();

    const transactions = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_TRANSACTION
    );

    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ success: false, transactions: null }, { status: 500 });
  }
}

// POST /api/transaction - Create a new transaction
export async function POST(request) {
  try {
    const session = requireRole(await resolveSession(), ["member"]);
    const input = await request.json();
    const shape = validateStrictObject(input, ["transactionType", "coopId", "shares", "buyFor", "metadata"], { maxBytes: 4096 });
    if (!shape.ok) return NextResponse.json({ success: false, error: shape.error }, { status: 400 });

    const { databases } = createAdminClient();

    const isSharePurchase =
      input?.transactionType === "purchase" ||
      input?.transactionType === "share_purchase";

    const sharesCount = Number(input?.shares);
    const coopId = boundedId(input?.coopId);
    const buyFor = boundedText(input?.buyFor, { max: 100 });
    const metadata = boundedText(input?.metadata, { max: 2000 });
    if (!isSharePurchase || !coopId || !Number.isInteger(sharesCount) || sharesCount < 1 || sharesCount > 1_000_000 || buyFor === null || metadata === null) {
      return NextResponse.json({ success: false, error: "Invalid transaction" }, { status: 400 });
    }
    let totalAmountCents;
    if (isSharePurchase && coopId && Number.isFinite(sharesCount)) {
      const coop = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID_COOPERATIVES,
        coopId
      );

      if (coop) {
        const settingsDoc = await getSettingsDocumentByCoopId(coopId);
        const settings = deriveDefaultSettingsFromCoop(coop, settingsDoc);
        const minShares = settings.min_shares;
        const maxShares = settings.max_shares;

        const hasMaximum = maxShares !== "" && Number.isFinite(Number(maxShares));
        if (sharesCount < minShares || (hasMaximum && sharesCount > Number(maxShares))) {
          return NextResponse.json(
            {
              success: false,
              error: hasMaximum
                ? `Shares must be between ${minShares} and ${maxShares}`
                : `Shares must be at least ${minShares}`,
            },
            { status: 400 }
          );
        }
        totalAmountCents = sharesCount * settings.share_price_cents;
      }
    }

    const transaction = {
      coopId,
      memberId: session.userId,
      shares: sharesCount,
      price: totalAmountCents / 100,
      buyFor: buyFor || "self",
      metadata: metadata || "",
      verificationStatus: "pending",
      transactionType: "purchase",
      time: new Date().toISOString(),
      isAdminApproved: false,
      havePaid: false,
    };

    const createdTransaction = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_TRANSACTION,
      ID.unique(),
      transaction
    );

    return NextResponse.json({ success: true, transaction: createdTransaction });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error creating transaction:", error);
    return NextResponse.json({ success: false, transaction: null }, { status: 500 });
  }
}
