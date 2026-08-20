import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_ASSEMBLY_VOTES,
  COLLECTION_ID_ASSEMBLY_VOTE_CASTS,
  COLLECTION_ID_ASSEMBLY_ATTENDANCE,
} from "@/lib/appwrite-server";
import { sessionErrorResponse } from "@/lib/auth/session";
import { requireCoopParticipant, resolveVotingActor } from "@/lib/auth/vote-access";
import { safePublicError } from "@/lib/api/safe-public-error";

// GET - Get member polls by coop ID (active and casted)
export async function GET(request) {
  try {
    const session = await resolveVotingActor();
    const { searchParams } = new URL(request.url);
    const coopId = searchParams.get("coopId");
    const userId = searchParams.get("userId");

    if (!coopId || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing required query parameters" },
        { status: 400 },
      );
    }
    if (userId !== session.userId) return sessionErrorResponse({ status: 403 });
    await requireCoopParticipant(session, coopId);

    const { databases } = createAdminClient();

    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLY_VOTES,
      [Query.equal("coopId", coopId)],
    );

    const activePolls = [];
    const castedPolls = [];
    const now = new Date();

    for (const doc of response.documents) {
      if (session.role === "proxy" && doc.assemblyId !== session.proxyAssemblyId) continue;
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

      const castResult = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_ASSEMBLY_VOTE_CASTS,
        [Query.equal("pollId", doc.$id), Query.equal("userId", userId), Query.limit(1)],
      );
      const hasVoted = castResult.total > 0;
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
    if (error?.status === 401 || error?.status === 403 || error?.message === "FORBIDDEN") {
      return sessionErrorResponse(error?.message === "FORBIDDEN" ? { status: 403 } : error);
    }
    console.error("Error getting member polls:", error);
    return NextResponse.json(
      { success: false, error: safePublicError(error)},
      { status: 500 },
    );
  }
}
