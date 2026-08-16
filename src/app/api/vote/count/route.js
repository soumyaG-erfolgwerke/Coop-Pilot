import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_ASSEMBLY_VOTES,
} from "@/lib/appwrite-server";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { requireCoopParticipant } from "@/lib/auth/vote-access";
import { safePublicError } from "@/lib/api/safe-public-error";

// GET - Get active polls count by coop ID
export async function GET(request) {
  try {
    const session = await resolveSession();
    const { searchParams } = new URL(request.url);
    const coopId = searchParams.get("coopId");

    if (!coopId) {
      return NextResponse.json(
        { success: false, error: "Missing required query parameters" },
        { status: 400 }
      );
    }
    await requireCoopParticipant(session, coopId);

    const { databases } = createAdminClient();

    const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID_ASSEMBLY_VOTES, [
      Query.equal("coopId", coopId),
    ]);

    const activePolls = [];
    const criticalPolls = [];
    const now = new Date();

    for (const doc of response.documents) {
      const endTime = doc.endTime ? new Date(doc.endTime) : null;
      const status = doc.status || (endTime && endTime > now ? "live" : "closed");
      const shouldClose = status === "live" && endTime && endTime <= now;

      if (shouldClose) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID_ASSEMBLY_VOTES,
          doc.$id,
          { status: "closed" },
        );
        continue;
      }

      if (status === "live") {
        activePolls.push(doc);
        if (doc.isCritical) {
          criticalPolls.push(doc);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        activePollsCount: activePolls.length,
        criticalPollsCount: criticalPolls.length,
      },
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403 || error?.message === "FORBIDDEN") {
      return sessionErrorResponse(error?.message === "FORBIDDEN" ? { status: 403 } : error);
    }
    console.error("Error getting polls count:", error);
    return NextResponse.json(
      { success: false, error: safePublicError(error)},
      { status: 500 }
    );
  }
}
