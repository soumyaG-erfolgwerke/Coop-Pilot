import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_SUGGESTIONS,
} from "@/lib/appwrite-server";
import { getAuthenticatedProfile } from "@/lib/helpers/_helpers";

export async function POST(request) {
  try {
    const auth = await getAuthenticatedProfile();

    if (!auth || auth.role !== "coopadmin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { databases } = createAdminClient();

    const { title, description, tab } = await request.json();
    const trimmedTitle = title?.trim();
    const trimmedDescription = description?.trim();
    const trimmedTab = tab?.trim() || null;

    if (!trimmedTitle || !trimmedDescription) {
      return NextResponse.json(
        { success: false, error: "Title and description are required" },
        { status: 400 },
      );
    }

    const newSuggestion = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_SUGGESTIONS,
      ID.unique(),
      {
        title: trimmedTitle,
        description: trimmedDescription,
        email: auth.email,
        tab: trimmedTab,
      },
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    console.error("Error creating suggestion:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
