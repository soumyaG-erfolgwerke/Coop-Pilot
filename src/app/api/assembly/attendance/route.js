import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_ASSEMBLIES,
  COLLECTION_ID_ASSEMBLY_ATTENDANCE,
} from "@/lib/appwrite-server";
import { getAuthenticatedProfile } from "@/lib/helpers/_helpers";

const { databases } = createAdminClient();

const ALLOWED_ATTENDANCE = new Set(["present", "proxy", "absent"]);

const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : "";

const parseJsonSafely = (value, fallback) => {
  if (typeof value !== "string") return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const isAssemblyUpcoming = (assembly, currentTime = new Date()) => {
  if (assembly.status !== "invited" && assembly.status !== "upcoming") {
    return false;
  }

  const now = currentTime.getTime();
  const startsAt = assembly.startDateTime
    ? new Date(assembly.startDateTime).getTime()
    : 0;

  return startsAt && now < startsAt;
};

const buildAttendanceSummary = (attendanceDocs) =>
  attendanceDocs.reduce(
    (summary, row) => {
      const shares = Number(row.shares || 0);

      summary.totalMembers += 1;
      summary.totalShares += shares;

      if (row.status === "present") {
        summary.presentMembers += 1;
        summary.representedMembers += 1;
        summary.presentShares += shares;
        summary.representedShares += shares;
      }

      if (row.status === "proxy") {
        summary.proxyMembers += 1;
        summary.representedMembers += 1;
        summary.proxyShares += shares;
        summary.representedShares += shares;
      }

      return summary;
    },
    {
      totalMembers: 0,
      totalShares: 0,
      presentMembers: 0,
      proxyMembers: 0,
      representedMembers: 0,
      presentShares: 0,
      proxyShares: 0,
      representedShares: 0,
    },
  );

// GET handler for fetching by assemblyId
export async function GET(request, { params }) {
  try {
    const { assemblyId } = await params;

    // Fetch documents with matching assemblyId
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLY_ATTENDANCE,
      [Query.equal("assemblyId", assemblyId)],
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
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const {
      assemblyId,
      status = "present",
      proxyHolder = "",
      note = "",
    } = body || {};

    if (!assemblyId) {
      return NextResponse.json(
        { success: false, error: "assemblyId is required" },
        { status: 400 },
      );
    }

    if (!ALLOWED_ATTENDANCE.has(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid attendance status" },
        { status: 400 },
      );
    }

    const auth = await getAuthenticatedProfile();
    if (auth.role !== "member") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const assembly = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLIES,
      assemblyId,
    );

    // TODO: Uncomment this check once we allow attendance marking for live assemblies as well
    // if (!isAssemblyUpcoming(assembly)) {
    //   return NextResponse.json(
    //     { success: false, error: "Attendance is only available before start" },
    //     { status: 400 },
    //   );
    // }

    const existingAttendance = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLY_ATTENDANCE,
      [
        Query.equal("assemblyId", assemblyId),
        Query.equal("memberId", auth.userId),
        Query.limit(1),
      ],
    );

    const now = new Date().toISOString();
    if (!existingAttendance.documents.length) {
      return NextResponse.json(
        { success: false, error: "You are not invited to this assembly" },
        { status: 403 },
      );
    }

    const attendancePayload = {
      memberName: normalizeText(auth.name || ""),
      memberEmail: normalizeText(auth.email || ""),
      status,
      proxyHolder: normalizeText(proxyHolder),
      note: normalizeText(note),
      updatedAt: now,
    };

    const attendanceDoc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLY_ATTENDANCE,
      existingAttendance.documents[0].$id,
      attendancePayload,
    );

    const attendanceResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLY_ATTENDANCE,
      [Query.equal("assemblyId", assemblyId), Query.limit(500)],
    );
    const attendanceSummary = buildAttendanceSummary(
      attendanceResult.documents,
    );

    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLIES,
      assemblyId,
      {
        attendanceSummaryJson: JSON.stringify({
          ...parseJsonSafely(assembly.attendanceSummaryJson, {}),
          ...attendanceSummary,
        }),
        updatedAt: now,
      },
    );

    return NextResponse.json({
      success: true,
      attendance: {
        id: attendanceDoc.$id,
        status: attendanceDoc.status,
        proxyHolder: attendanceDoc.proxyHolder,
        note: attendanceDoc.note,
      },
      attendanceSummary,
    });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to mark attendance" },
      { status: 500 },
    );
  }
}
