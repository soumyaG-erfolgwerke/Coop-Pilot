import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_ASSEMBLY_VOTES,
} from "@/lib/appwrite-server";
import { ensureCoopAdminAccess } from "@/lib/helpers/_helpers";
import { safePublicError } from "@/lib/api/safe-public-error";

export async function POST(request) {
  try {
    const body = await request.json();
    const { assemblyId, coopId } = body || {};

    if (!assemblyId || !coopId) {
      return NextResponse.json(
        { success: false, error: "assemblyId and coopId are required" },
        { status: 400 },
      );
    }

    await ensureCoopAdminAccess(coopId);
    const { databases } = createAdminClient();

    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLY_VOTES,
      [Query.equal("assemblyId", assemblyId), Query.equal("coopId", coopId), Query.limit(200)],
    );

    const updates = await Promise.all(
      response.documents.map((doc) => {
        if (doc.status === "closed") {
          return doc;
        }
        return databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID_ASSEMBLY_VOTES,
          doc.$id,
          { status: "closed" },
        );
      }),
    );

    return NextResponse.json({
      success: true,
      updated: updates.filter((doc) => doc.status === "closed").length,
    });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { success: false, error: safePublicError(error, "Failed to close polls") },
      { status: 500 },
    );
  }
}
