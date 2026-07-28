import { NextResponse } from "next/server";
import { Query, ID } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_AUDIT_ORGS,
  COLLECTION_ID_AUDITTEAM_MEMBERS,
  COLLECTION_ID_AUDIT_DISCREPANCY,
  COLLECTION_ID_COOPERATIVES,
} from "@/lib/appwrite-server";
import {
  getAuthenticatedProfile,
  stripInternalFields,
} from "@/lib/helpers/_helpers";

const allowedRoles = ["org_admin", "auditer", "aud_E", "aud_T"];

// create discrepancy for an audit organization
export async function POST(request) {
  try {
    const { auditOrgId, title, description, coopId, type } = await request.json();
    if (!auditOrgId || !title || !description || !coopId || !type) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const auth = await getAuthenticatedProfile();
    if (!auth || !allowedRoles.includes(auth.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    if (
      (auth.role === "aud_E" || auth.role === "aud_T") &&
      type !== "notice" &&
      type !== "obligate"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Sub-auditors can only create 'notice' or 'obligate' discrepancies",
        },
        { status: 403 },
      );
    }

    const { databases } = createAdminClient();
    const auditOrg = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_ORGS,
      auditOrgId,
    );

    if (!auditOrg) {
      return NextResponse.json(
        { success: false, error: "Audit Organization not found" },
        { status: 404 },
      );
    }

    const coopResponse = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId,
    );

    if (!coopResponse || coopResponse.auditOrgId !== auditOrgId) {
      return NextResponse.json(
        { success: false, error: "Coop not found" },
        { status: 404 },
      );
    }

    let author = null;
    if (
      auth.role === "aud_E" ||
      auth.role === "aud_T" ||
      auth.role === "auditer"
    ) {
      const memberResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_AUDITTEAM_MEMBERS,
        [
          Query.equal("email", auth.email),
          Query.equal("auditOrgId", auditOrgId),
        ],
      );

      if (memberResponse.total === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "You are not a member of this audit organization",
          },
          { status: 403 },
        );
      }

      author = memberResponse.documents[0];
    } else if (auth.role === "org_admin") {
      if (auditOrg.admin_email !== auth.email) {
        return NextResponse.json(
          {
            success: false,
            error: "You are not the admin of this audit organization",
          },
          { status: 403 },
        );
      }

      author = auth;
    }

    if (!author) {
      return NextResponse.json(
        { success: false, error: "Author not found" },
        { status: 404 },
      );
    }

    const discrepancyData = {
      auditOrgId,
      coopId,
      title,
      description,
      type,
      createdBy: auth.email,
    };

    const newDiscrepancy = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_DISCREPANCY,
      ID.unique(),
      discrepancyData,
    );

    return NextResponse.json(
      {
        success: true,
        data: newDiscrepancy,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Error creating discrepancy:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const auditOrgId = searchParams.get("auditOrgId");
    const coopId = searchParams.get("coopId");

    if (!auditOrgId || !coopId) {
      return NextResponse.json(
        { success: false, error: "Missing required query parameters" },
        { status: 400 },
      );
    }

    const auth = await getAuthenticatedProfile();
    if (!auth || !allowedRoles.includes(auth.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { databases } = createAdminClient();

    const discrepanciesResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_DISCREPANCY,
      [Query.equal("auditOrgId", auditOrgId), Query.equal("coopId", coopId)],
    );
    const discrepancies = discrepanciesResponse.documents.map((discrepancy) =>
      stripInternalFields(discrepancy),
    );

    return NextResponse.json(
      { success: true, data: discrepancies },
      { status: 200 },
    );
  } catch (err) {
    console.error("Error fetching discrepancies:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const { discrepancyId, status, auditOrgId, coopId } = await request.json();

    if (!discrepancyId || !status || !auditOrgId || !coopId) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 },
      );
    }

    const validStatuses = ["open", "partially_resolved", "resolved"];
    if (!validStatuses.includes(status)) {
      console.error("Invalid status value:", status);
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 },
      );
    }

    const auth = await getAuthenticatedProfile();
    if (!auth || (auth.role !== "org_admin" && auth.role !== "auditer")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { databases } = createAdminClient();

    const discrepancyResponse = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_DISCREPANCY,
      discrepancyId,
    );

    if (discrepancyResponse.status === status || discrepancyResponse.status === "resolved") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Discrepancy is already in the desired status or cannot be updated",
        },
        { status: 400 },
      );
    }

    const auditOrg = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_ORGS,
      auditOrgId,
    );

    if (!auditOrg) {
      return NextResponse.json(
        { success: false, error: "Audit Organization not found" },
        { status: 404 },
      );
    }

    const coopResponse = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId,
    );

    if (!coopResponse || coopResponse.auditOrgId !== auditOrgId) {
      return NextResponse.json(
        { success: false, error: "Coop not found" },
        { status: 404 },
      );
    }

    let author = null;
    if (
      auth.role === "aud_E" ||
      auth.role === "aud_T" ||
      auth.role === "auditer"
    ) {
      const memberResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_AUDITTEAM_MEMBERS,
        [
          Query.equal("email", auth.email),
          Query.equal("auditOrgId", auditOrgId),
        ],
      );

      if (memberResponse.total === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "You are not a member of this audit organization",
          },
          { status: 403 },
        );
      }

      author = memberResponse.documents[0];
    } else if (auth.role === "org_admin") {
      if (auditOrg.admin_email !== auth.email) {
        return NextResponse.json(
          {
            success: false,
            error: "You are not the admin of this audit organization",
          },
          { status: 403 },
        );
      }

      author = auth;
    }

    if (!author) {
      return NextResponse.json(
        { success: false, error: "Author not found" },
        { status: 404 },
      );
    }

    const updatedDiscrepancy = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_DISCREPANCY,
      discrepancyId,
      { status },
    );

    return NextResponse.json(
      { success: true, data: updatedDiscrepancy },
      { status: 200 },
    );
  } catch (err) {
    console.error("Error updating discrepancy:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
