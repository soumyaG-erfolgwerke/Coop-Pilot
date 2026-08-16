import { NextResponse } from "next/server";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_ASSEMBLY_VOTES,
  COLLECTION_ID_ASSEMBLY_ATTENDANCE,
} from "@/lib/appwrite-server";
import { Query } from "node-appwrite";
import { sessionErrorResponse } from "@/lib/auth/session";
import { requireCoopParticipant, resolveVotingActor } from "@/lib/auth/vote-access";

const pollLocks = new Map();
async function acquirePollLock(pollId) {
  const previous = pollLocks.get(pollId) || Promise.resolve();
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const chain = previous.then(() => gate);
  pollLocks.set(pollId, chain);
  await previous;
  return () => {
    release();
    if (pollLocks.get(pollId) === chain) pollLocks.delete(pollId);
  };
}

// POST - Cast a vote
export async function POST(request) {
  let releasePollLock;
  try {
    const session = await resolveVotingActor();
    const body = await request.json();
    const { $id, selectedOption } = body;
    const userId = session.userId;

    if (!$id || selectedOption === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    releasePollLock = await acquirePollLock($id);
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

    await requireCoopParticipant(session, votingDoc.coopId);
    if (session.role === "proxy" && votingDoc.assemblyId !== session.proxyAssemblyId) {
      return sessionErrorResponse({ status: 403 });
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
    if (!Number.isInteger(selectedOption) || selectedOption < 0 || selectedOption > 2) {
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
    if (error?.status === 401 || error?.status === 403) {
      return sessionErrorResponse(error);
    }
    console.error("Error casting vote:", error);
    return NextResponse.json(
      { success: false, error: "Could not cast vote" },
      { status: 500 },
    );
  } finally {
    releasePollLock?.();
  }
}
