import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  COLLECTION_ID_AUDITTEAM_MEMBERS,
  createAdminClient,
} from "@/lib/appwrite-server";
import {
  DATABASE_ID,
  COLLECTION_ID_AUDIT_HISTORY,
} from "@/lib/appwrite-server";
import { stripInternalFields } from "@/lib/helpers/_helpers";

export async function GET(request, { params }) {
  try {
    const { coopId } = await params;

    const { databases } = createAdminClient();

    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_HISTORY,
      [Query.equal("coopId", coopId), Query.orderDesc("$createdAt")],
    );

    const auditorIds = [
      ...new Set(result.documents.map((doc) => doc.auditorId).filter(Boolean)),
    ];

    let auditorMap = {};
    if (auditorIds.length > 0) {
      const auditorRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_AUDITTEAM_MEMBERS,
        [Query.equal("$id", auditorIds)],
      );

      auditorMap = auditorRes.documents.reduce((acc, auditor) => {
        acc[auditor.$id] = {
          name: auditor.name,
          email: auditor.email,
        };
        return acc;
      }, {});
    }

    const historyWithAuditors = result.documents.map((doc) => {
      return stripInternalFields({
      ...doc,
      auditorName: auditorMap[doc.auditorId]?.name || null,
      auditorEmail: auditorMap[doc.auditorId]?.email || null,
    })});

    return NextResponse.json({
      success: true,
      documents: historyWithAuditors,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch audit history",
      },
      { status: 500 },
    );
  }
}
