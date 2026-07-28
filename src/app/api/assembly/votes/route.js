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
export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const coopId = searchParams.get("coopId");

  try {
    if (!coopId) {
      return NextResponse.json(
        { success: false, error: "coopId is required" },
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

    const auth = await ensureCoopAdminAccess(coopId);
    if (!auth || auth.error) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { databases } = createAdminClient();

    // fetch all assemblies
    const assemblyRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLIES,
      [Query.equal("coopId", coopId), Query.orderDesc("$createdAt")],
    );

    // enrich assemblies with vote data
    const enriched = await Promise.all(
      assemblyRes.documents.map(async (assembly) => {
        const voteRes = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID_ASSEMBLY_VOTES,
          [Query.equal("assemblyId", assembly.$id), Query.limit(100)],
        );

        const vote = voteRes.documents?.[0];

        let agendaItems = [];
        try {
          const parsed = assembly.agendaItems
            ? typeof assembly.agendaItems === "string"
              ? JSON.parse(assembly.agendaItems)
              : assembly.agendaItems
            : [];

          agendaItems = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
        } catch (e) {
          console.error(`Agenda parse error ${assembly.$id}`, e);
          agendaItems = [];
        }

        const niederschriftRes = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID_NIEDERSCHRIFT,
          [Query.equal("assemblyId", assembly.$id), Query.limit(1)],
        );

        const niederschrift = niederschriftRes.documents?.[0] || null;

        return {
          ...assembly,

          agendaItems,
          id: assembly?.assemblyId || assembly?.id,
          votes: voteRes.documents || [],
          assemblyId: vote?.assemblyId || assembly?.id || assembly?.$id,
          titleAssembly: assembly?.title || "",
          description: vote?.description || "",
          isCritical: vote?.isCritical || false,
          yesCount: vote?.yesCount || 0,
          noCount: vote?.noCount || 0,
          abstainCount: vote?.abstainCount || 0,
          yesVoters: vote?.yesVoters || [],
          noVoters: vote?.noVoters || [],
          abstainVoters: vote?.abstainVoters || [],
          endTime: vote?.endTime || "",
          status: assembly?.status,
          wasCancelled: assembly?.wasCancelled || false,

          hasNiederschrift: !!niederschrift,

          niederschriftFileId: niederschrift?.fileId || "",
        };
      }),
    );

    // filter invalid assemblies
    const filtered = enriched.filter(
      (assembly) =>
        assembly.status !== "invited" &&
        assembly.status !== "upcoming" &&
        assembly.status !== "draft" &&
        assembly.status !== "live" &&
        assembly.wasCancelled !== true,
    );

    return NextResponse.json({
      success: true,
      assemblies: filtered,
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