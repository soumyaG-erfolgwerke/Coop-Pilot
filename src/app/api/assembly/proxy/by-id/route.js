import { NextResponse } from "next/server";

import { Query } from "node-appwrite";

import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_ASSEMBLIES,
  COLLECTION_ID_ASSEMBLY_ATTENDANCE,
} from "@/lib/appwrite-server";

import { getAuthenticatedProfile } from "@/lib/helpers/_helpers";

const parseJsonSafely = (value, fallback) => {
  if (typeof value !== "string") {
    return value ?? fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const deserializeAssembly = (assembly, attendance, status) => ({
  id: assembly.$id,
  coopId: assembly.coopId,
  title: assembly.title,
  format: assembly.format,
  startDateTime: assembly.startDateTime,
  endDateTime: assembly.endDateTime,
  location: assembly.location,
  platformUrl: assembly.platformUrl,
  status,
  agendaItems: (assembly.agendaItems || []).map((item) => parseJsonSafely(item, {})),
  attendanceStatus: attendance?.status || "absent",
  proxyHolder: assembly.proxyHolder || "",
  hasProxy: assembly.hasProxy || false,
  proxyTableId: assembly?.proxyTableId || "",
  scope: assembly?.scope || "LIMITED",
  attendanceSummary: parseJsonSafely(assembly.attendanceSummaryJson, {}),
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const assemblyId = searchParams.get("assemblyId");

    if (!assemblyId) {
      return NextResponse.json(
        { success: false,
          error: "assemblyId is required",
        },
        { status: 400 },
      );
    }

    const auth = await getAuthenticatedProfile();

    if (!auth) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    if (auth.role !== "member") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
        },
        { status: 403 },
      );
    }

    const { databases } = createAdminClient();

    const assembly = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLIES,
      assemblyId,
    );

    const attendanceResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLY_ATTENDANCE,
      [
        Query.equal("assemblyId", assemblyId),
        Query.equal("memberId", auth.userId),
        Query.limit(1),
      ],
    );

    const attendance = attendanceResult.documents[0] || null;

    if (!attendance) {
      return NextResponse.json(
        {
          success: false,
          error: "Assembly attendance not found",
        },
        { status: 404 },
      );
    }

    const enrichedAssembly = deserializeAssembly(
      assembly,
      attendance,
      assembly.status,
    );

    return NextResponse.json({
      success: true,
      assembly: enrichedAssembly,
    });
  } catch (error) {
    console.error("GET_ASSEMBLY_BY_ID_ERROR:", error);

    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch assembly",
      },
      { status: 500 },
    );
  }
}
