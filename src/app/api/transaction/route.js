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

// GET /api/transaction - Get all transactions
export async function GET() {
  try {
    const { databases } = createAdminClient();

    const transactions = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_TRANSACTION
    );

    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ success: false, transactions: null }, { status: 500 });
  }
}

// POST /api/transaction - Create a new transaction
export async function POST(request) {
  try {
    const transaction = await request.json();

    const { databases } = createAdminClient();

    const isSharePurchase =
      transaction?.transactionType === "purchase" ||
      transaction?.transactionType === "share_purchase";

    const sharesCount = Number(transaction?.shares);
    if (isSharePurchase && transaction?.coopId && Number.isFinite(sharesCount)) {
      const coop = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID_COOPERATIVES,
        transaction.coopId
      );

      if (coop) {
        const settingsDoc = await getSettingsDocumentByCoopId(transaction.coopId);
        const settings = deriveDefaultSettingsFromCoop(coop, settingsDoc);
        const minShares = settings.min_shares;
        const maxShares = settings.max_shares;

        if (sharesCount < minShares || sharesCount > maxShares) {
          return NextResponse.json(
            {
              success: false,
              error: `Shares must be between ${minShares} and ${maxShares}`,
            },
            { status: 400 }
          );
        }

        /*
        const totalAmountCents = sharesCount * sharePriceCents;
        transaction.shares = sharesCount;
        transaction.share_price_at_time_cents = sharePriceCents;
        transaction.total_amount_cents = totalAmountCents;
        transaction.price = totalAmountCents / 100;
        */
      }
    }

    const createdTransaction = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_TRANSACTION,
      ID.unique(),
      transaction
    );

    return NextResponse.json({ success: true, transaction: createdTransaction });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json({ success: false, transaction: null }, { status: 500 });
  }
}
