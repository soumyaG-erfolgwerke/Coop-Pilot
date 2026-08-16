import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_ASSEMBLY_ATTENDANCE,
} from "@/lib/appwrite-server";
import { requireAssemblyAdmin } from "@/lib/auth/assembly-access";
import { sessionErrorResponse } from "@/lib/auth/session";
import { safePublicError } from "@/lib/api/safe-public-error";

const { databases } = createAdminClient();

// GET handler for fetching by assemblyId
export async function GET(request, { params }) {
  try {
    const { assemblyId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // Get the status query parameter
    if (!assemblyId) {
      return NextResponse.json(
        { success: false, error: "assemblyId is required" },
        { status: 400 },
      );
    }

    // ensureCoopAdminAccess(assemblyId); // Check if user has access to this assembly's attendance data

    await requireAssemblyAdmin(assemblyId);

    // Fetch documents with matching assemblyId
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLY_ATTENDANCE,
      [
        Query.equal("assemblyId", assemblyId),
        Query.orderDesc("$createdAt"),
        ...(status ? [Query.equal("status", status)] : []),
      ],
    );

    return NextResponse.json(
      {
        success: true,
        data: response.documents,
        total: response.total,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error?.status === 401 || error?.status === 403 || error?.message === "FORBIDDEN") {
      return sessionErrorResponse(error?.message === "FORBIDDEN" ? { status: 403 } : error);
    }
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      {
        success: false,
        error: safePublicError(error),
      },
      { status: 500 },
    );
  }
}
