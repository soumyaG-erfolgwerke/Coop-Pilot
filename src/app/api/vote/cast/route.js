import { NextResponse } from "next/server";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_ASSEMBLY_VOTES,
  COLLECTION_ID_ASSEMBLY_ATTENDANCE,
} from "@/lib/appwrite-server";
import { Query } from "node-appwrite";

// POST - Cast a vote
export async function POST(request) {
  try {
    const body = await request.json();
    const { $id, userId, selectedOption } = body;

    if (!$id || !userId || selectedOption === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();

    // 1. Fetch the voting document
    const votingDoc = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLY_VOTES,
      $id,
    );

    if (!votingDoc) {
      return NextResponse.json(
        { success: false, error: "Voting document not found" },
        { status: 404 },
      );
    }

    const now = new Date();
    const endTime = votingDoc.endTime ? new Date(votingDoc.endTime) : null;
    const status =
      votingDoc.status || (endTime && endTime > now ? "live" : "closed");
    const shouldClose = status === "live" && endTime && endTime <= now;

    if (status === "closed" || shouldClose) {
      if (shouldClose) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID_ASSEMBLY_VOTES,
          $id,
          { status: "closed" },
        );
      }
      return NextResponse.json(
        { success: false, error: "Poll is closed" },
        { status: 400 },
      );
    }

    if (votingDoc.assemblyId) {
      const attendanceResult = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_ASSEMBLY_ATTENDANCE,
        [
          Query.equal("assemblyId", votingDoc.assemblyId),
          Query.equal("memberId", userId),
          Query.limit(1),
        ],
      );
      const attendance = attendanceResult.documents[0];

      if (!attendance || !["present", "proxy"].includes(attendance.status)) {
        return NextResponse.json(
          {
            success: false,
            error: "Attend the assembly before voting",
          },
          { status: 403 },
        );
      }
    }

    // 2. Check if user already voted
    if (votingDoc.votes?.includes(userId)) {
      return NextResponse.json(
        { success: false, error: "User has already voted" },
        { status: 400 },
      );
    }

    // 3. Deserialize options (array of JSON strings)

    // 4. Validate selected option
    if (selectedOption < 0 || selectedOption > 2) {
      return NextResponse.json(
        { success: false, error: "Invalid option selected" },
        { status: 400 },
      );
    }

    const yesVoters = Array.isArray(votingDoc.yesVoters)
      ? [...votingDoc.yesVoters]
      : [];
    const noVoters = Array.isArray(votingDoc.noVoters)
      ? [...votingDoc.noVoters]
      : [];
    const abstainVoters = Array.isArray(votingDoc.abstainVoters)
      ? [...votingDoc.abstainVoters]
      : [];
    const votes = Array.isArray(votingDoc.votes) ? [...votingDoc.votes] : [];

    if (selectedOption === 0) {
      yesVoters.push(userId);
    } else if (selectedOption === 1) {
      noVoters.push(userId);
    } else {
      abstainVoters.push(userId);
    }

    votes.push(userId);

    const yesCount = yesVoters.length;
    const noCount = noVoters.length;
    const abstainCount = abstainVoters.length;

    // 8. Update the document in the database
    const response = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLY_VOTES,
      $id,
      {
        votes,
        yesVoters,
        noVoters,
        abstainVoters,
        yesCount,
        noCount,
        abstainCount,
      },
    );

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error("Error casting vote:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
