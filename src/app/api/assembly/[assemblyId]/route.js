import { NextResponse } from "next/server";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_ASSEMBLIES,
} from "@/lib/appwrite-server";
import {
  getAuthenticatedProfile,
} from "@/lib/helpers/_helpers";
import { assemblyDeserialization } from "@/services/assembly/assemblySchema";

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

    const auth = await getAuthenticatedProfile();
    if (!auth || auth.role !== "coopadmin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

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
    console.error("Error fetching assembly:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
