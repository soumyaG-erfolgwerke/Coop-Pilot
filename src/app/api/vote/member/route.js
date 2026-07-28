import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_ASSEMBLY_VOTES,
  COLLECTION_ID_ASSEMBLY_ATTENDANCE,
} from "@/lib/appwrite-server";

// GET - Get member polls by coop ID (active and casted)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const coopId = searchParams.get("coopId");
    const userId = searchParams.get("userId");
    const currentTime = searchParams.get("currentTime");

    if (!coopId || !userId || !currentTime) {
      return NextResponse.json(
        { success: false, error: "Missing required query parameters" },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();

    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLY_VOTES,
      [Query.equal("coopId", coopId)],
    );

    const activePolls = [];
    const castedPolls = [];
    const now = new Date(currentTime);

    for (const doc of response.documents) {
      if (doc.assemblyId) {
        const attendanceResult = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID_ASSEMBLY_ATTENDANCE,
          [
            Query.equal("assemblyId", doc.assemblyId),
            Query.equal("memberId", userId),
            Query.limit(1),
          ],
        );
        const attendance = attendanceResult.documents[0];
        if (!attendance || !["present", "proxy"].includes(attendance.status)) {
          continue;
        }
      }

      const hasVoted = doc.votes?.includes(userId);
      const endTime = doc.endTime ? new Date(doc.endTime) : null;
      const status =
        doc.status || (endTime && endTime > now ? "live" : "closed");
      const shouldClose = status === "live" && endTime && endTime <= now;

      if (shouldClose) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID_ASSEMBLY_VOTES,
          doc.$id,
          { status: "closed" },
        );
      }

      if (!hasVoted && status === "live" && !shouldClose) {
        activePolls.push(doc);
      } else {
        castedPolls.push(doc);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        activePolls: activePolls.reverse(),
        castedPolls: castedPolls.reverse(),
      },
    });
  } catch (error) {
    console.error("Error getting member polls:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
