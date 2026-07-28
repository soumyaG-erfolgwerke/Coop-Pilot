import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { cookies } from "next/headers";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_AUDIT_HISTORY,
  appwriteFetchWithSession,
  COLLECTION_ID_PROFILE,
} from "@/lib/appwrite-server";

import {
  getAuditerIdForCoop,
  getSubAuditorIds,
} from "@/services/auditOrgServices/getAuditorDetails";

export async function getCurrentUserRole(databases) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("appwrite-session");
    if (!sessionCookie?.value) return null;

    const { cookieValue } = JSON.parse(sessionCookie.value);
    if (!cookieValue) return null;

    const res = await appwriteFetchWithSession(cookieValue, "/account");
    if (!res.ok) return null;

    const user = await res.json();
    const userId = user?.$id;
    if (!userId) return null;

    const profilesResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [Query.equal("userId", userId)],
    );

    if (profilesResult.documents.length === 0) return null;
    return profilesResult.documents[0].role || null;
  } catch (error) {
    console.error("Error getting current user role:", error);
    return null;
  }
}

// GET /api/auditServices/[coopId] - Get audit data for a cooperative
export async function GET(request, { params }) {
  try {
    const { coopId } = await params;

    if (!coopId) {
      return NextResponse.json(
        { success: false, error: "Cooperative ID is required" },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();

    // Fetch the cooperative document to get the auditStatus and currentAuditId
    let coopDoc;
    try {
      coopDoc = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID_COOPERATIVES,
        coopId,
      );
    } catch (err) {
      console.error(
        `Failed to fetch cooperative document with ID ${coopId}:`,
        err,
      );
      return NextResponse.json(
        { success: false, error: "Cooperative not found" },
        { status: 404 },
      );
    }

    const auditStatus = coopDoc.auditStatus || "NOT_STARTED";
    const currentAuditId = coopDoc.currentAuditId || null;
    let auditData = {};

    const currentUserRole = await getCurrentUserRole(databases);
    if (
      currentUserRole === "coopadmin" &&
      (auditStatus === "START" ||
        auditStatus === "ASKED_TO_RESUBMIT" ||
        auditStatus === "ASK_TO_RESUBMIT")
    ) {
      return NextResponse.json({
        success: true,
        auditData,
        auditStatus,
      });
    }

    if (currentAuditId) {
      try {
        const auditDoc = await databases.getDocument(
          DATABASE_ID,
          COLLECTION_ID_AUDIT_HISTORY,
          currentAuditId,
        );
        auditData = auditDoc.auditJson || {};
      } catch (err) {
        console.error(
          `Failed to fetch audit history by currentAuditId ${currentAuditId}:`,
          err,
        );
      }
    } else {
      // Fallback: search for the latest history document if currentAuditId is not set
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_AUDIT_HISTORY,
        [
          Query.equal("coopId", coopId),
          Query.orderDesc("$createdAt"),
          Query.limit(1),
        ],
      );
      if (result.documents.length > 0) {
        auditData = result.documents[0].auditJson || {};
      }
    }

    return NextResponse.json({
      success: true,
      auditData,
      auditStatus,
    });
  } catch (error) {
    console.error(`Failed to get audit data:`, error);
    return NextResponse.json(
      { success: false, error: "Could not fetch audit data" },
      { status: 500 },
    );
  }
}

// PATCH /api/auditServices/[coopId] - Update audit data for a cooperative
export async function PATCH(request, { params }) {
  try {
    const { coopId } = await params;
    const {
      auditData,
      save = false,
      currentAuditId = null,
    } = await request.json();

    let macros = [];

    try {
      const parsedAuditData =
        typeof auditData === "string" ? JSON.parse(auditData) : auditData;

      macros = parsedAuditData?.macros || [];
    } catch (err) {
      console.error(err);
    }

    if (!coopId || !auditData) {
      return NextResponse.json(
        {
          success: false,
          error: "Cooperative ID and audit data are required",
        },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();

    // Fetch the cooperative document to check the current database state
    let coopDoc;
    try {
      coopDoc = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID_COOPERATIVES,
        coopId,
      );
    } catch (err) {
      console.error(
        `Failed to fetch cooperative document with ID ${coopId}:`,
        err,
      );
      return NextResponse.json(
        { success: false, error: "Cooperative not found" },
        { status: 404 },
      );
    }

    const dbAuditStatus = coopDoc.auditStatus || "NOT_STARTED";
    const dbCurrentAuditId = coopDoc.currentAuditId || null;
    const lastAuditId = currentAuditId || dbCurrentAuditId;

    // console.log("lastAuditId: ", lastAuditId)

    const [auditorId, subAuditorIds] = await Promise.all([
      getAuditerIdForCoop(coopId), //! role is auditer
      getSubAuditorIds(coopId), //! role is aud_E
    ]);

    const auditOrgId = coopDoc.auditOrgId;
    const auditFormId = coopDoc.auditFormId;

    // A new cycle is initiated if the status is START or ASKED_TO_RESUBMIT, or if there is no active history ID.
    const isNewCycle =
      dbAuditStatus === "START" ||
      dbAuditStatus === "ASKED_TO_RESUBMIT" ||
      !lastAuditId;

    if (!save) {
      let auditHistoryDoc;
      if (!isNewCycle && lastAuditId) {
        auditHistoryDoc = await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID_AUDIT_HISTORY,
          lastAuditId,
          {
            auditJson: auditData,
            status: "SUBMITTED",
            auditorId,
            subAuditorIds,
            auditOrgId,
            auditFormId,
            macros: JSON.stringify(macros),
          },
        );
      } else {
        auditHistoryDoc = await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID_AUDIT_HISTORY,
          ID.unique(),
          {
            coopId,
            auditJson: auditData,
            status: "SUBMITTED",
            auditorId,
            subAuditorIds,
            auditOrgId,
            auditFormId,
            macros: JSON.stringify(macros),
          },
        );
      }

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID_COOPERATIVES,
        coopId,
        {
          auditJson: "",
          currentAuditId: auditHistoryDoc.$id,
          auditStatus: "SUBMITTED",
        },
      );

      // Create Audit Log note
      try {
        const performerRole = await getCurrentUserRole(databases);
        if (
          performerRole &&
          ["org_admin", "auditer", "aud_E"].includes(performerRole) &&
          auditOrgId
        ) {
          const { createAuditLog } =
            await import("@/lib/helpers/_loggerHelper");
          await createAuditLog({
            auditOrgId,
            logNote: `Audit data for cooperative "${coopDoc.name}" (${coopId}) was submitted by ${performerRole}.`,
            role: performerRole,
          });
        }
      } catch (logErr) {
        console.error("Failed to write audit data submission log:", logErr);
      }

      return NextResponse.json({
        success: true,
        document: auditHistoryDoc,
      });
    } else {
      let auditHistoryDocId = lastAuditId;
      let auditHistoryDoc = null;

      if (isNewCycle || !auditHistoryDocId) {
        auditHistoryDoc = await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID_AUDIT_HISTORY,
          ID.unique(),
          {
            coopId,
            status: "IN_PROGRESS",
            auditJson: auditData,
            auditorId,
            subAuditorIds,
            auditOrgId,
            auditFormId,
            macros: JSON.stringify(macros),
          },
        );

        // console.log("AuditHistorydoc: ", auditHistoryDoc)
        auditHistoryDocId = auditHistoryDoc.$id;
      } else {
        auditHistoryDoc = await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID_AUDIT_HISTORY,
          auditHistoryDocId,
          {
            status: "IN_PROGRESS",
            auditJson: auditData,
            auditorId,
            subAuditorIds,
            auditOrgId,
            auditFormId,
            macros: JSON.stringify(macros),
          },
        );
      }

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID_COOPERATIVES,
        coopId,
        {
          auditJson: auditData,
          currentAuditId: auditHistoryDocId,
          auditStatus: "IN_PROGRESS",
        },
      );

      // Create Audit Log note
      try {
        const performerRole = await getCurrentUserRole(databases);
        if (
          performerRole &&
          ["org_admin", "auditer", "aud_E"].includes(performerRole) &&
          auditOrgId
        ) {
          const { createAuditLog } =
            await import("@/lib/helpers/_loggerHelper");
          await createAuditLog({
            auditOrgId,
            logNote: `Audit data progress for cooperative "${coopDoc.name}" (${coopId}) was saved as draft by ${performerRole}.`,
            role: performerRole,
          });
        }
      } catch (logErr) {
        console.error("Failed to write audit data draft save log:", logErr);
      }

      return NextResponse.json({
        success: true,
        document: auditHistoryDoc || { $id: auditHistoryDocId },
      });
    }
  } catch (error) {
    console.error("Failed to update audit data:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Could not update audit data",
      },
      { status: 500 },
    );
  }
}
