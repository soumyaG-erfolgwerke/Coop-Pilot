import {
  DATABASE_ID,
  COLLECTION_ID_ASSEMBLIES,
  createAdminClient,
} from "@/lib/appwrite-server";

import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { ensureCoopAdminAccess } from "@/lib/helpers/_helpers";
import { sessionErrorResponse } from "@/lib/auth/session";
import { safePublicError } from "@/lib/api/safe-public-error";

export async function GET(req) {
  const { databases } = createAdminClient();
  const { searchParams } = new URL(req.url);

  const coopId = searchParams.get("coopId");

  try {
    // 🔴 validation
    if (!coopId) {
      return NextResponse.json(
        { success: false, error: "coopId is required" },
        { status: 400 },
      );
    }

    // 🔐 auth
    await ensureCoopAdminAccess(coopId);

    // 🔍 query
    const queries = [
      Query.equal("coopId", coopId),
      Query.orderDesc("$createdAt"),
    ];

    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLIES,
      queries,
    );

    // 🔧 parse agendaItems JSON
    const assemblies = res.documents.map((doc) => {
      let agendaItems = [];

      try {
        agendaItems = doc.agendaItems ? JSON.parse(doc.agendaItems) : [];
      } catch (e) {
        console.error(`Agenda parse error ${doc.$id}`, e);
      }

      return {
        ...doc,
        agendaItems,
      };
    });

    return NextResponse.json({
      success: true,
      assemblies,
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403 || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return sessionErrorResponse({ status: error?.status === 403 || error?.message === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("Fetch Assemblies Error:", error);

    return NextResponse.json(
      { success: false, error: safePublicError(error)},
      { status: 500 },
    );
  }
}
