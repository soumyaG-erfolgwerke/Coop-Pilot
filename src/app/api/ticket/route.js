import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_TICKETS,
  COLLECTION_ID_AUDITTEAM_MEMBERS,
} from "@/lib/appwrite-server";
import { stripInternalFields } from "@/lib/helpers/_helpers";

// Status config
const STATUSES = ["Issued", "InProgress", "InReview", "Completed", "Cancelled"];

const isValidStatus = (status) => STATUSES.includes(status);

// GET /api/ticket - Get all tickets
export async function GET() {
  try {
    const { databases } = createAdminClient();

    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_TICKETS,
    );

    const auditorIds = [
      ...new Set(res.documents.map((doc) => doc.leadAuditor).filter(Boolean)),
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

    const ticketsWithAuditor = res.documents.map((ticket) => {
      return stripInternalFields({
        ...ticket,
        leadAuditorName: auditorMap[ticket.leadAuditor]?.name || null,
        leadAuditorEmail: auditorMap[ticket.leadAuditor]?.email || null,
      });
    });

    return NextResponse.json({ success: true, tickets: ticketsWithAuditor });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ success: false, tickets: [] }, { status: 500 });
  }
}

// POST /api/ticket - Create a new ticket
export async function POST(request) {
  try {
    const {
      subject,
      scope,
      status = "Issued",
      leadAuditor,
      auditId,
      forCoop,
      comments = [],
    } = await request.json();

    if (!subject || !forCoop) {
      return NextResponse.json(
        { success: false, error: "Subject and forCoop are required fields" },
        { status: 400 },
      );
    }

    if (!isValidStatus(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status: ${status}. Allowed: ${STATUSES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();

    const payload = {
      subject,
      scope,
      status,
      leadAuditor,
      auditId,
      forCoop,
      comments,
    };

    const ticket = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_TICKETS,
      ID.unique(),
      payload,
    );

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json({ success: false, ticket: null }, { status: 500 });
  }
}
