import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_ASSEMBLY_VOTES,
} from "@/lib/appwrite-server";
import { ensureCoopAdminAccess } from "@/lib/helpers/_helpers";

const FIXED_OPTIONS = [
  { name: "JA (Yes)", votes: 0 },
  { name: "NEIN (No)", votes: 0 },
  { name: "ENTHALTUNG (Abstain)", votes: 0 },
];

const toIso = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { coopId } = body || {};

    if (!coopId) {
      return NextResponse.json(
        { success: false, error: "coopId is required" },
        { status: 400 },
      );
    }

    await ensureCoopAdminAccess(coopId);
    const { databases } = createAdminClient();

    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLY_VOTES,
      [Query.equal("coopId", coopId), Query.limit(500)],
    );

    const now = new Date();
    const updates = await Promise.all(
      response.documents.map((doc) => {
        const endTimeIso = toIso(doc.endTime);
        const endTime = endTimeIso ? new Date(endTimeIso) : null;
        const status = endTime && endTime > now ? "live" : "closed";

        const options = Array.isArray(doc.options)
          ? doc.options.map((opt) => {
              try {
                return JSON.parse(opt);
              } catch {
                return null;
              }
            })
          : [];
        const normalizedOptions = FIXED_OPTIONS.map((opt, index) => {
          const existing = options[index] || {};
          return {
            name: opt.name,
            votes: Number(existing.votes || 0),
          };
        });

        const yesCount = normalizedOptions[0].votes;
        const noCount = normalizedOptions[1].votes;
        const abstainCount = normalizedOptions[2].votes;

        const createdAt = doc.createdAt || doc.$createdAt || now.toISOString();
        const createdBy = doc.createdBy || "system";

        const payload = {
          options: normalizedOptions.map((opt) => JSON.stringify(opt)),
          endTime: endTimeIso || doc.endTime || "",
          status,
          createdAt,
          createdBy,
          yesVoters: Array.isArray(doc.yesVoters) ? doc.yesVoters : [],
          noVoters: Array.isArray(doc.noVoters) ? doc.noVoters : [],
          abstainVoters: Array.isArray(doc.abstainVoters) ? doc.abstainVoters : [],
          yesCount,
          noCount,
          abstainCount,
          votes: Array.isArray(doc.votes) ? doc.votes : [],
        };

        return databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID_ASSEMBLY_VOTES,
          doc.$id,
          payload,
        );
      }),
    );

    return NextResponse.json({
      success: true,
      updated: updates.length,
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
      { success: false, error: error.message || "Failed to migrate polls" },
      { status: 500 },
    );
  }
}
