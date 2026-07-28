import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_TICKETS,
  COLLECTION_ID_AUDITTEAM_MEMBERS,
} from "@/lib/appwrite-server";
import { getCoopById, stripInternalFields } from "@/lib/helpers/_helpers";

// GET /api/ticket/by-coop?forCoop=...&order=asc|desc - Get tickets by coop
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const forCoop = searchParams.get("forCoop");
    const order = searchParams.get("order") || "asc";

    if (!forCoop) {
      return NextResponse.json(
        { success: false, error: "forCoop is required" },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();

    const coopData = await getCoopById(forCoop);
    const currentAuditId = coopData?.currentAuditId;

    const queries = [
      Query.equal("forCoop", forCoop),
      Query.equal("auditId", currentAuditId),
    ];
    queries.push(
      order === "desc"
        ? Query.orderDesc("$updatedAt")
        : Query.orderAsc("$updatedAt"),
    );

    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_TICKETS,
      queries,
    );

    const auditorIds = [
      ...new Set(res.documents.map((doc) => doc.leadAuditor).filter(Boolean)),
    ];

    // console.log("Unique auditor IDs for coop tickets:", auditorIds);
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

    const ticketsWithAuditor = res.documents.map((ticket) => {
      return stripInternalFields({
        ...ticket,
        leadAuditorName: auditorMap[ticket.leadAuditor]?.name || null,
        leadAuditorEmail: auditorMap[ticket.leadAuditor]?.email || null,
      });
    });
    // console.dir(ticketsWithAuditor, { depth: null });

    return NextResponse.json({ success: true, tickets: ticketsWithAuditor });
  } catch (error) {
    console.error(`Error fetching tickets for coop:`, error);
    return NextResponse.json({ success: false, tickets: [] }, { status: 500 });
  }
}
