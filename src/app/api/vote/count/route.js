import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_ASSEMBLY_VOTES,
} from "@/lib/appwrite-server";

// GET - Get active polls count by coop ID
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const coopId = searchParams.get("coopId");
    const currentTime = searchParams.get("currentTime");

    if (!coopId || !currentTime) {
      return NextResponse.json(
        { success: false, error: "Missing required query parameters" },
        { status: 400 }
      );
    }

    const { databases } = createAdminClient();

    const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID_ASSEMBLY_VOTES, [
      Query.equal("coopId", coopId),
    ]);

    const activePolls = [];
    const criticalPolls = [];
    const now = new Date(currentTime);

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
    console.error("Error getting polls count:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
