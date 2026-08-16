import { NextResponse } from "next/server";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_ASSEMBLIES,
} from "@/lib/appwrite-server";
import { requireAssemblyAdmin } from "@/lib/auth/assembly-access";
import { sessionErrorResponse } from "@/lib/auth/session";
import { assemblyDeserialization } from "@/services/assembly/assemblySchema";
import { safePublicError } from "@/lib/api/safe-public-error";

const { databases } = createAdminClient();

// GET handler for fetching by assemblyId
export async function GET(request, { params }) {
  try {
    const { assemblyId } = await params;
    if (!assemblyId) {
      return NextResponse.json(
        { success: false, error: "assemblyId is required" },
        { status: 400 },
      );
    }

    await requireAssemblyAdmin(assemblyId);

    // Fetch assembly document
    const assemblyRes = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLIES,
      assemblyId,
    );

    if (!assemblyRes) {
      return NextResponse.json(
        { success: false, error: "Assembly not found" },
        { status: 404 },
      );
    }

    const assembly = assemblyDeserialization(assemblyRes);

    return NextResponse.json(
      {
        success: true,
        data: assembly,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error?.status === 401 || error?.status === 403 || error?.message === "FORBIDDEN") {
      return sessionErrorResponse(error?.message === "FORBIDDEN" ? { status: 403 } : error);
    }
    console.error("Error fetching assembly:", error);
    return NextResponse.json(
      {
        success: false,
        error: safePublicError(error),
      },
      { status: 500 },
    );
  }
}
