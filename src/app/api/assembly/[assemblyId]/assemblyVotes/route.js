import {
  DATABASE_ID,
  COLLECTION_ID_ASSEMBLIES,
  COLLECTION_ID_ASSEMBLY_VOTES,
  createAdminClient,
  COLLECTION_ID_NIEDERSCHRIFT,
} from "@/lib/appwrite-server";

import { NextResponse } from "next/server";
import { Query } from "node-appwrite";

import {
  ensureCoopAdminAccess,
  getAuthenticatedProfile,
} from "@/lib/helpers/_helpers";

// GET - Fetch enriched assemblies with vote data
export async function GET(req, { params }) {
  const { assemblyId } = await params;

  try {
    if (!assemblyId) {
      return NextResponse.json(
        { success: false, error: "assemblyId is required" },
        { status: 400 },
      );
    }

    // Only allow coopadmin to proceed
    const user = await getAuthenticatedProfile();
    if (!user || user.role !== "coopadmin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 },
      );
    }

    const { databases } = createAdminClient();

    const voteRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLY_VOTES,
      [Query.equal("assemblyId", assemblyId), Query.orderDesc("$createdAt")],
    );

    const vote = voteRes.documents;

    const votesData = vote.map((vote) => ({
      assemblyId,
      titleAssembly: vote?.title || "",
      description: vote?.description || "",
      isCritical: vote?.isCritical || false,
      yesCount: vote?.yesCount || 0,
      noCount: vote?.noCount || 0,
      abstainCount: vote?.abstainCount || 0,
      yesVoters: vote?.yesVoters || [],
      noVoters: vote?.noVoters || [],
      abstainVoters: vote?.abstainVoters || [],
      endTime: vote?.endTime || "",
      status: vote?.status || "",
    }));

    return NextResponse.json({
      success: true,
      votes: votesData,
    });
  } catch (error) {
    console.error("Fetch Assembly Vote Data Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
