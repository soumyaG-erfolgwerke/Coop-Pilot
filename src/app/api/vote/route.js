import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_ASSEMBLY_VOTES,
} from "@/lib/appwrite-server";
import { ensureCoopAdminAccess } from "@/lib/helpers/_helpers";

// POST - Create a new poll
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      coopId,
      endTime,
      title,
      description,
      isCritical = false,
      assemblyId = "",
    } = body;

    if (!coopId || !endTime || !title) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const auth = await ensureCoopAdminAccess(coopId);
    const { databases } = createAdminClient();

    const now = new Date().toISOString();
    const status = new Date(endTime) <= new Date(now) ? "closed" : "live";

    const utcEndTime = new Date(endTime).toISOString();

    const voteData = {
      coopId,
      endTime: utcEndTime,
      title,
      description,
      isCritical,
      assemblyId,
      createdAt: now,
      createdBy: auth.userId,
      status,
      votes: [],
      yesVoters: [],
      noVoters: [],
      abstainVoters: [],
      yesCount: 0,
      noCount: 0,
      abstainCount: 0,
    };

    const response = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLY_VOTES,
      ID.unique(),
      voteData
    );

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error("Error creating poll:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
