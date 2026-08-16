import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_NOTIFICATION,
  COLLECTION_ID_PROFILE,
  COLLECTION_ID_AUDITTEAM_MEMBERS,
} from "@/lib/appwrite-server";
import { requireRole, resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { safePublicError } from "@/lib/api/safe-public-error";
import { boundedText, validateStrictObject } from "@/lib/validation/strict-object";

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

// Helper to get users by type
async function getUsersByType(databases, type) {
  let query = [];

  switch (type) {
    case "admins":
      query = [Query.equal("role", "coopadmin"), Query.limit(500)];
      break;
    case "auditers":
      query = [
        Query.equal("role", ["aud_E", "auditer"]),
        Query.equal("isActive", true),
        Query.limit(500),
      ];
      break;
    case "members":
      query = [
        Query.equal("status", "active"),
        Query.equal("role", "member"),
        Query.limit(500),
      ];
      break;
    case "users":
    default:
      query = [Query.limit(500), Query.orderDesc("$createdAt")];
      break;
  }

  let profilesResult;
  if (type !== "auditers") {
    profilesResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      query,
    );
  } else {
    profilesResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDITTEAM_MEMBERS,
      query,
    );
  }

  return profilesResult.documents.map((user) => ({
    id: user.userId || user.$id,
    name:
      type !== "auditers"
        ? ((user.FirstName || "") + " " + (user.LastName || "")).trim()
        : user.name || "",
    email: type !== "auditers" ? user.contactEmail : user.email,
    role: user.role,
    status:
      type !== "auditers" ? user.status : user.isActive ? "active" : "inactive",
  }));
}

// POST - Send bulk notifications to a specific user type
// Query param: ?type=admins|auditers|users|members
export async function POST(request) {
  try {
    const session = requireRole(await resolveSession(), ["superuser", "superadmin"]);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "users";

    const body = await request.json();
    const shape = validateStrictObject(body, ["message"], { maxBytes: 4096 });
    if (!shape.ok) return NextResponse.json({ success: false, error: shape.error }, { status: 400 });
    const message = boundedText(body.message, { min: 1, max: 2000, required: true });

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 },
      );
    }

    // Validate type
    const validTypes = ["admins", "auditers", "users", "members"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Get current user email (optional fail-soft)
    let userEmail = session.email || session.userId;
    try {
      const cookieStore = null;
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

    // Get users by type
    const users = await getUsersByType(databases, type);

    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: `No ${type} found to notify.`,
      });
    }

    // Generate message for each user if it's a function
    const getMessage = typeof message === "function" ? message : () => message;

    // Send notifications in parallel
    const notified = await Promise.all(
      users.map(async (u) => {
        try {
          const msg = getMessage(u);
          const res = await createNotificationInDB(databases, {
            createdBy: userEmail,
            createdFor: u.email,
            message: msg,
          });
          return { ...u, ok: true, notificationId: res.$id };
        } catch (err) {
          console.error(`Failed to notify ${u.email}:`, err);
          return {
            ...u,
            ok: false,
            error: "Notification failed",
          };
        }
      }),
    );

    return NextResponse.json({ success: true, data: notified });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error in bulk notification:", error);
    return NextResponse.json(
      { success: false, error: safePublicError(error)},
      { status: 500 },
    );
  }
}
