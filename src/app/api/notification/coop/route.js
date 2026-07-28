import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { cookies } from "next/headers";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_NOTIFICATION,
  COLLECTION_ID_COOPERATIVES,
} from "@/lib/appwrite-server";

// Helper to create a notification in DB
async function createNotificationInDB(
  databases,
  { createdBy, createdFor, message },
) {
  const data = {
    createdBy,
    createdFor,
    message,
    isRead: false,
    timestamp: new Date().toISOString(),
  };

  return await databases.createDocument(
    DATABASE_ID,
    COLLECTION_ID_NOTIFICATION,
    ID.unique(),
    data,
    [],
  );
}

// Notification message templates
const notificationMessages = {
  START: (coopName) => `The audit filing for ${coopName} is now open.`,
  APPROVED: (coopName) =>
    `Your submission ${coopName} has been accepted after audit.`,
  REJECTED: (coopName) =>
    `Your submission for ${coopName} was rejected after audit.`,
  ASKED_TO_RESUBMIT: (coopName) =>
    `Your submission ${coopName} needs revision. Please resubmit.`,
  UNDER_REVIEW: (coopName) =>
    `The submission for ${coopName} is currently under review.`,
};

// POST - Create notification for coop admins based on audit status
export async function POST(request) {
  try {
    const body = await request.json();
    const { coopId, type } = body;

    if (!coopId) {
      return NextResponse.json(
        { success: false, error: "coopId is required" },
        { status: 400 },
      );
    }

    // Normalize and validate type
    const normalized = String(type || "").toUpperCase();
    const ALLOWED = new Set([
      "START",
      "APPROVED",
      "REJECTED",
      "ASKED_TO_RESUBMIT",
      "UNDER_REVIEW",
    ]);
    if (!ALLOWED.has(normalized)) {
      return NextResponse.json(
        { success: false, error: `Invalid notification type: ${type}` },
        { status: 400 },
      );
    }

    // Get current user email (optional fail-soft)
    let userEmail = "service_internal@hystandards.de";
    try {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get("appwrite-session");
      if (sessionCookie?.value) {
        const { cookieValue } = JSON.parse(sessionCookie.value);
        if (cookieValue) {
          const { appwriteFetchWithSession } =
            await import("@/lib/appwrite-server");
          const res = await appwriteFetchWithSession(cookieValue, "/account");
          if (res.ok) {
            const user = await res.json();
            userEmail = user?.email || userEmail;
          }
        }
      }
    } catch {
      // Not logged in / no session — continue with fallback userEmail
    }

    const { databases } = createAdminClient();

    // Get coop data
    const coop = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId,
    );

    if (!coop) {
      return NextResponse.json(
        { success: false, error: `Coop not found: ${coopId}` },
        { status: 404 },
      );
    }

    // Resolve admin emails (array, deduped, truthy only)
    // Note: In DB the field is "admins", not "adminEmails"
    const adminEmails = Array.isArray(coop.admins)
      ? [...new Set(coop.admins.filter(Boolean))]
      : [];

    if (adminEmails.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          ok: true,
          sent: 0,
          failures: [],
          message: "No admin emails configured.",
        },
      });
    }

    // Get the message template
    const getMessage = notificationMessages[normalized];
    const message = getMessage(coop.name);

    // Send notifications in parallel
    const results = await Promise.allSettled(
      adminEmails.map((email) =>
        createNotificationInDB(databases, {
          createdBy: userEmail,
          createdFor: email,
          message,
        }),
      ),
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failures = results
      .map((r, i) =>
        r.status === "rejected"
          ? {
              email: adminEmails[i],
              error: r.reason?.message || String(r.reason),
            }
          : null,
      )
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      data: { ok: failures.length === 0, sent, failures },
    });
  } catch (error) {
    console.error("Error creating coop notification:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
