import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_CONTACT_US,
} from "@/lib/appwrite-server";
import { getAuthenticatedProfile } from "@/lib/helpers/_helpers";
// Todo: Uncomment the below line to enable the contact us thank you email
// import { sendContactUsThankYouEmail } from "@/utils/contactUsMailer";

// GET /api/contactUs - Get all contact us submissions
export async function GET(request) {
  try {
    const auth = await getAuthenticatedProfile();

    if (!auth || (auth.role !== "superuser" && auth.role !== "org_admin")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10) || 25));
    const offset = Math.min(10_000, Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0));
    const search = (searchParams.get("search") || "").slice(0, 200);

    const { databases } = createAdminClient();

    const queries = [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc("$createdAt"),
    ];

    if (search && search.trim()) {
      queries.push(Query.search("text", search.trim()));
    }

    const list = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_CONTACT_US,
      queries,
    );

    return NextResponse.json({ success: true, ...list });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    console.error("Error fetching contact us submissions:", error);
    return NextResponse.json(
      { success: false, error: "Could not fetch contact us submissions" },
      { status: 500 },
    );
  }
}

// POST /api/contactUs - Add a new contact us submission
export async function POST(request) {
  try {
    const { name, email, text, contactNumber } = await request.json();

    if (typeof name !== "string" || !name.trim() || name.length > 150 || typeof email !== "string" || email.length > 254 || typeof text !== "string" || !text.trim() || text.length > 5000 || (contactNumber !== undefined && (typeof contactNumber !== "string" || contactNumber.length > 40))) {
      return NextResponse.json(
        { success: false, error: "name, email, and text are required" },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();

    const doc = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      text: text.trim(),
      ...(contactNumber ? { contactNumber: contactNumber.trim() } : {}),
    };

    const created = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_CONTACT_US,
      ID.unique(),
      doc,
    );

    // TODO: Send thank you email to the user (uncomment below to trigger once mailer config is ready)
    // if (process.env.ENABLE_CONTACT_US_EMAIL === "true") {
    //   try {
    //     await sendContactUsThankYouEmail({ email, name });
    //   } catch (emailError) {
    //     console.error("Failed to send thank you email:", emailError);
    //   }
    // }

    return NextResponse.json({ success: true, document: created });
  } catch (error) {
    console.error("Error adding contact us submission:", error);
    return NextResponse.json(
      { success: false, error: "Could not add contact us submission" },
      { status: 500 },
    );
  }
}
