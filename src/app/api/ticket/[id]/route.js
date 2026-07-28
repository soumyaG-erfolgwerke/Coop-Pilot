import { NextResponse } from "next/server";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_TICKETS,
  COLLECTION_ID_AUDITTEAM_MEMBERS,
} from "@/lib/appwrite-server";
import { stripInternalFields } from "@/lib/helpers/_helpers";

// GET /api/ticket/[id] - Get ticket by ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Ticket ID is required" },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();

    const ticket = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_TICKETS,
      id,
    );

    // get the leadAuditor details
    let leadAuditorDetails = null;
    if (ticket.leadAuditor) {
      try {
        const leadAuditorRes = await databases.getDocument(
          DATABASE_ID,
          COLLECTION_ID_AUDITTEAM_MEMBERS,
          ticket.leadAuditor,
        );
        leadAuditorDetails = {
          name: leadAuditorRes.name,
          email: leadAuditorRes.email,
        };
      } catch (auditorError) {
        console.error("Failed to fetch lead auditor details:", auditorError);
      }
    }

    const ticketWithAuditor = {
      ...ticket,
      leadAuditorName: leadAuditorDetails?.name || null,
      leadAuditorEmail: leadAuditorDetails?.email || null,
    };

    return NextResponse.json({
      success: true,
      ticket: stripInternalFields(ticketWithAuditor),
    });
  } catch (error) {
    console.error(`Error fetching ticket:`, error);
    return NextResponse.json({ success: false, ticket: null }, { status: 500 });
  }
}
