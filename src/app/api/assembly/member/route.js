import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_ASSEMBLIES,
  COLLECTION_ID_ASSEMBLY_ATTENDANCE,
} from "@/lib/appwrite-server";
import { getAuthenticatedProfile } from "@/lib/helpers/_helpers";
import { safePublicError } from "@/lib/api/safe-public-error";

const parseJsonSafely = (value, fallback) => {
  if (typeof value !== "string") return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const isAssemblyLive = (assembly, currentTime = new Date()) => {
  if (assembly.status === "live") {
    return true;
  }

  if (assembly.status !== "invited" && assembly.status !== "upcoming") {
    return false;
  }

  const now = currentTime.getTime();
  const startsAt = assembly.startDateTime
    ? new Date(assembly.startDateTime).getTime()
    : 0;
  const endsAt = assembly.endDateTime
    ? new Date(assembly.endDateTime).getTime()
    : startsAt;

  return startsAt && now >= startsAt && (!endsAt || now <= endsAt);
};

const getAssemblyStatus = (assembly, currentTime = new Date()) => {
  if (assembly.status === "closed" || assembly.status === "archived") {
    return "closed";
  }

  if (isAssemblyLive(assembly, currentTime)) {
    return "live";
  }

  if (assembly.status !== "invited" && assembly.status !== "upcoming") {
    return null;
  }

  const now = currentTime.getTime();
  const startsAt = assembly.startDateTime
    ? new Date(assembly.startDateTime).getTime()
    : 0;
  const endsAt = assembly.endDateTime
    ? new Date(assembly.endDateTime).getTime()
    : startsAt;

  if (endsAt && now > endsAt) {
    return "closed";
  }

  if (startsAt && now < startsAt) {
    return "upcoming";
  }

  return null;
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
  agendaItems: (assembly.agendaItems || []).map((item) =>
    parseJsonSafely(item, {}),
  ),
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
    const coopId = searchParams.get("coopId");

    if (!coopId) {
      return NextResponse.json(
        { success: false, error: "coopId is required" },
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

    const { databases } = createAdminClient();
    const assemblyResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLIES,
      [Query.equal("coopId", coopId), Query.limit(100)],
    );

    const assembliesDoc = assemblyResult.documents;

    // console.log("assembly: ", assembliesDoc);

    // if (assembliesDoc.length === 0) {
    //   return [];
    // }

    // Always return a response
    if (assembliesDoc.length === 0) {
      return NextResponse.json({
        success: true,
        assemblies: [],
      });
    }

    // Fetch ALL attendance records for this user across all assemblies in ONE query
    const assemblyIds = assembliesDoc.map((assembly) => assembly.$id);
    const allAttendanceResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLY_ATTENDANCE,
      [
        Query.equal("assemblyId", assemblyIds), // Query with array of IDs
        Query.equal("memberId", auth.userId),
      ],
    );

    // Create a Map for O(1) lookups
    const attendanceMap = new Map();
    allAttendanceResult.documents.forEach((attendance) => {
      attendanceMap.set(attendance.assemblyId, attendance);
    });

    // Process all assemblies in memory (no additional DB calls)
    const assembliesWithAttendance = assembliesDoc.map((assembly) => {
      const attendance = attendanceMap.get(assembly.$id) || null;
      if (!attendance) return null;

      const status = assembly.status;
      if (!status) return null;

      return deserializeAssembly(assembly, attendance, status);
    });

    const assemblies = assembliesWithAttendance.filter((item) => item !== null); // Remove null entries;

    // console.log("assembly: ",assemblies)
    return NextResponse.json({ success: true, assemblies });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { success: false, error: safePublicError(error, "Failed to fetch assemblies") },
      { status: 500 },
    );
  }
}
