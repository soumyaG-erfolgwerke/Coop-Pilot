import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_ASSEMBLY_VOTES,
} from "@/lib/appwrite-server";

// GET - Get all polls by coop ID
export async function GET(request, { params }) {
  try {
    const { coopId } = await params;

    if (!coopId) {
      return NextResponse.json(
        { success: false, error: "Missing coopId parameter" },
        { status: 400 }
      );
    }

    const { databases } = createAdminClient();

    const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID_ASSEMBLY_VOTES, [
      Query.equal("coopId", coopId),
    ]);

    const now = new Date();
    const documents = [];

    for (const doc of response.documents) {
      const endTime = doc.endTime ? new Date(doc.endTime) : null;
      const status = doc.status || (endTime && endTime > now ? "live" : "closed");
      const shouldClose = status === "live" && endTime && endTime <= now;

      if (shouldClose) {
        const updated = await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID_ASSEMBLY_VOTES,
          doc.$id,
          { status: "closed" },
        );
        documents.push(updated);
      } else {
        documents.push(doc);
      }
    }

    return NextResponse.json({
      success: true,
      data: documents.reverse(),
    });
  } catch (error) {
    console.error("Error getting polls by coop ID:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
