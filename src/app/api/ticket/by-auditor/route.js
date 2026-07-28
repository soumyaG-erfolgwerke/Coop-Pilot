import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_TICKETS,
  COLLECTION_ID_AUDITTEAM_MEMBERS,
} from "@/lib/appwrite-server";
import { stripInternalFields } from "@/lib/helpers/_helpers";

// GET /api/ticket/by-auditor?auditorId=...&order=asc|desc - Get tickets by auditor
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const auditorId = searchParams.get("auditorId");
    const order = searchParams.get("order") || "desc";

    if (!auditorId) {
      return NextResponse.json(
        { success: false, error: "auditorId is required" },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();

    const queries = [Query.equal("leadAuditor", auditorId)];
    queries.push(
      order === "asc"
        ? Query.orderAsc("$updatedAt")
        : Query.orderDesc("$updatedAt"),
    );

    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_TICKETS,
      queries,
    );

    const auditorIds = [
      ...new Set(res.documents.map((doc) => doc.leadAuditor).filter(Boolean)),
    ];

    let auditorMap = {};
    if(auditorIds.length > 0){
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

    const ticketsWithAuditor = res.documents.map((ticket) => {
      return stripInternalFields({
        ...ticket,
        leadAuditorName: auditorMap[ticket.leadAuditor]?.name || null,
        leadAuditorEmail: auditorMap[ticket.leadAuditor]?.email || null,
      });
    });

    return NextResponse.json({ success: true, tickets: ticketsWithAuditor });
  } catch (error) {
    console.error(`Error fetching tickets for auditor:`, error);
    return NextResponse.json({ success: false, tickets: [] }, { status: 500 });
  }
}
