import crypto from "crypto";
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

const MAX_TRANSACTION_ATTEMPTS = 10;

class VoteRequestError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function ballotId(pollId, userId) {
  const digest = crypto.createHash("sha256").update(`${pollId}\0${userId}`).digest("hex");
  return `vote_${digest.slice(0, 31)}`;
}

function isTransactionConflict(error) {
  return error?.code === 409 || /conflict|transaction.*(stale|conflict|commit)/i.test(`${error?.type || ""} ${error?.message || ""}`);
}

async function rollbackQuietly(databases, transactionId) {
  if (!transactionId) return;
  await databases.updateTransaction({ transactionId, rollback: true }).catch(() => {});
}

async function castAtomically({ databases, session, pollId, selectedOption }) {
  const userId = session.userId;
  const castDocumentId = ballotId(pollId, userId);

  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    let transactionId;
    try {
      const transaction = await databases.createTransaction({ ttl: 60 });
      transactionId = transaction.$id;

      const votingDoc = await databases.getDocument({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID_ASSEMBLY_VOTES,
        documentId: pollId,
        transactionId,
      });

      await requireCoopParticipant(session, votingDoc.coopId);
      if (session.role === "proxy" && votingDoc.assemblyId !== session.proxyAssemblyId) {
        throw new VoteRequestError("Forbidden", 403);
      }

      const now = new Date();
      const endTime = votingDoc.endTime ? new Date(votingDoc.endTime) : null;
      const status = votingDoc.status || (endTime && endTime > now ? "live" : "closed");
      if (status === "closed" || (status === "live" && endTime && endTime <= now)) {
        throw new VoteRequestError("Poll is closed", 400);
      }

      if (votingDoc.assemblyId) {
        const attendanceResult = await databases.listDocuments({
          databaseId: DATABASE_ID,
          collectionId: COLLECTION_ID_ASSEMBLY_ATTENDANCE,
          queries: [
            Query.equal("assemblyId", votingDoc.assemblyId),
            Query.equal("memberId", userId),
            Query.limit(1),
          ],
          transactionId,
        });
        const attendance = attendanceResult.documents[0];
        if (!attendance || !["present", "proxy"].includes(attendance.status)) {
          throw new VoteRequestError("Attend the assembly before voting", 403);
        }
      }

      try {
        await databases.getDocument({
          databaseId: DATABASE_ID,
          collectionId: COLLECTION_ID_ASSEMBLY_VOTE_CASTS,
          documentId: castDocumentId,
          transactionId,
        });
        throw new VoteRequestError("User has already voted", 400);
      } catch (error) {
        if (error instanceof VoteRequestError) throw error;
        if (error?.code !== 404) throw error;
      }

      const yesVoters = Array.isArray(votingDoc.yesVoters) ? [...votingDoc.yesVoters] : [];
      const noVoters = Array.isArray(votingDoc.noVoters) ? [...votingDoc.noVoters] : [];
      const abstainVoters = Array.isArray(votingDoc.abstainVoters) ? [...votingDoc.abstainVoters] : [];
      const votes = Array.isArray(votingDoc.votes) ? [...votingDoc.votes] : [];

      if (votes.includes(userId)) throw new VoteRequestError("User has already voted", 400);
      if (selectedOption === 0) yesVoters.push(userId);
      else if (selectedOption === 1) noVoters.push(userId);
      else abstainVoters.push(userId);
      votes.push(userId);

      const castAt = now.toISOString();
      await databases.createDocument({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID_ASSEMBLY_VOTE_CASTS,
        documentId: castDocumentId,
        data: {
          pollId,
          userId,
          coopId: votingDoc.coopId,
          assemblyId: votingDoc.assemblyId || "",
          selectedOption,
          castAt,
        },
        permissions: [],
        transactionId,
      });

      const countAttribute = selectedOption === 0
        ? "yesCount"
        : selectedOption === 1
          ? "noCount"
          : "abstainCount";
      await databases.incrementDocumentAttribute({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID_ASSEMBLY_VOTES,
        documentId: pollId,
        attribute: countAttribute,
        value: 1,
        transactionId,
      });

      const updated = await databases.updateDocument({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID_ASSEMBLY_VOTES,
        documentId: pollId,
        data: {
          votes,
          yesVoters,
          noVoters,
          abstainVoters,
        },
        transactionId,
      });

      await databases.updateTransaction({ transactionId, commit: true });
      return updated;
    } catch (error) {
      await rollbackQuietly(databases, transactionId);
      if (error instanceof VoteRequestError) throw error;
      if (isTransactionConflict(error) && attempt < MAX_TRANSACTION_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, (attempt * 12) + Math.floor(Math.random() * 20)));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Vote transaction could not be committed");
}

export async function POST(request) {
  try {
    const session = await resolveVotingActor();
    const { $id: pollId, selectedOption } = await request.json();
    if (!pollId || selectedOption === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }
    if (!Number.isInteger(selectedOption) || selectedOption < 0 || selectedOption > 2) {
      return NextResponse.json({ success: false, error: "Invalid option selected" }, { status: 400 });
    }

    const { databases } = createAdminClient();
    const updated = await castAtomically({ databases, session, pollId, selectedOption });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    if (error instanceof VoteRequestError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    if (error?.code === 404) {
      return NextResponse.json({ success: false, error: "Voting document not found" }, { status: 404 });
    }
    console.error("Atomic vote casting failed", { code: error?.code, type: error?.type });
    return NextResponse.json({ success: false, error: "Could not cast vote" }, { status: 500 });
  }
}
