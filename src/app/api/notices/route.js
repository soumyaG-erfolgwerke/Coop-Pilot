import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_NOTICEBOARD,
  COLLECTION_ID_COOPXMEMBER,
} from "@/lib/appwrite-server";
import { getAuthenticatedProfile } from "@/lib/helpers/_helpers";

// GET: Fetch notices the authenticated user has access to
export async function GET(request) {
  try {
    const auth = await getAuthenticatedProfile();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const coopId = searchParams.get("coopId");

    const { databases } = createAdminClient();

    // 1. Resolve cooperative IDs the user is authorized to view
    let authorizedCoopIds = null; // null means all coops (for superuser and coopadmin)

    if (auth.role !== "superuser" && auth.role !== "coopadmin") {
      if (auth.role === "member") {
        // Fetch cooperatives user is a member of
        const membershipsRes = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID_COOPXMEMBER,
          [
            Query.equal("userId", auth.userId),
            Query.equal("status", ["Active", "NoticeGiven"]),
            Query.limit(5000),
          ]
        );
        authorizedCoopIds = membershipsRes.documents
          .map((doc) => doc.coopId)
          .filter(Boolean);
      } else {
        // Other roles
        authorizedCoopIds = [];
      }
    }

    // 2. Access validation check
    if (coopId) {
      if (authorizedCoopIds !== null && !authorizedCoopIds.includes(coopId)) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    // 3. Build query and list notices
    const queries = [Query.orderDesc("$createdAt"), Query.limit(100)];
    if (coopId) {
      queries.push(Query.equal("coopId", coopId));
    } else if (authorizedCoopIds !== null) {
      if (authorizedCoopIds.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }
      queries.push(Query.equal("coopId", authorizedCoopIds));
    }

    // Filter out expired notices at the database level if the user is a member
    if (auth.role === "member") {
      const now = new Date();
      queries.push(
        Query.or([
          Query.greaterThan("expireDate", now.toISOString()),
          Query.isNull("expireDate"),
        ])
      );
    }

    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_NOTICEBOARD,
      queries
    );

    let notices = result.documents.map((doc) => ({
      id: doc.$id,
      coopId: doc.coopId,
      givenBy: doc.givenBy,
      title: doc.title,
      desc: doc.desc,
      expireDate: doc.expireDate,
      createdAt: doc.$createdAt,
      updatedAt: doc.$updatedAt,
    }));

    return NextResponse.json({ success: true, data: notices });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Error fetching notices:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: Create a notice (coopadmin only)
export async function POST(request) {
  try {
    const auth = await getAuthenticatedProfile();
    if (!auth || (auth.role !== "coopadmin" && auth.role !== "superuser")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { coopId, title, desc, expireDate } = await request.json();

    if (!coopId || !title || !desc) {
      return NextResponse.json(
        { success: false, error: "Cooperative ID, title, and description are required" },
        { status: 400 }
      );
    }

    const { databases } = createAdminClient();

    const newNotice = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_NOTICEBOARD,
      ID.unique(),
      {
        coopId,
        title,
        desc,
        givenBy: auth.email,
        expireDate: expireDate || null,
      }
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newNotice.$id,
          coopId: newNotice.coopId,
          givenBy: newNotice.givenBy,
          title: newNotice.title,
          desc: newNotice.desc,
          expireDate: newNotice.expireDate,
          createdAt: newNotice.$createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Error creating notice:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
