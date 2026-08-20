import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_ASSEMBLIES,
  COLLECTION_ID_ASSEMBLY_ATTENDANCE,
} from "@/lib/appwrite-server";
import { ensureCoopAdminAccess } from "@/lib/helpers/_helpers";
import { assemblyDeserialization } from "@/services/assembly/assemblySchema";
import { safePublicError } from "@/lib/api/safe-public-error";

const ALLOWED_FORMATS = new Set([
  "praesenz",
  "virtuell",
  "hybrid",
  "gestreckt",
]);
const ALLOWED_STATUSES = new Set([
  "draft",
  "invited",
  "upcoming",
  "live",
  "closed",
  "archived",
  "discarded",
]);
const ALLOWED_ATTENDANCE = new Set(["present", "proxy", "absent"]);

// const parseJsonSafely = (value, fallback) => {
//   if (typeof value !== "string") return value ?? fallback;
//   try {
//     return JSON.parse(value);
//   } catch {
//     return fallback;
//   }
// };

const toIsoOrEmpty = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : "";

const serializeArray = (value) =>
  Array.isArray(value) ? value.map((item) => JSON.stringify(item || {})) : [];

// export const deserializeAssembly = (doc, attendanceDocs = []) => ({
//   id: doc.$id,
//   coopId: doc.coopId,
//   title: doc.title,
//   format: doc.format,
//   startDateTime: doc.startDateTime,
//   endDateTime: doc.endDateTime,
//   location: doc.location,
//   platformUrl: doc.platformUrl,
//   status: doc.status,
//   noticePeriodValidation: doc.noticePeriodValidation,
//   quorum: doc.quorum,
//   quorumMet: doc.quorumMet,
//   wasCancelled: doc.wasCancelled || false,
//   overrideReason: doc.overrideReason,
//   invitationBody: doc.invitationBody,
//   attachments: parseJsonSafely(doc.attachmentsJson, []),
//   agendaItems: (doc.agendaItems || []).map((item) => parseJsonSafely(item, {})),
//   agendaCount: Number(doc.agendaCount || 0),
//   attendanceSummary: parseJsonSafely(doc.attendanceSummaryJson, {}),
//   attendance: attendanceDocs.map((attendance) => ({
//     id: attendance.$id,
//     memberId: attendance.memberId,
//     memberName: attendance.memberName,
//     memberEmail: attendance.memberEmail,
//     status: attendance.status,
//     proxyHolder: attendance.proxyHolder,
//     note: attendance.note,
//     shares: Number(attendance.shares || 0),
//   })),
//   createdBy: doc.createdBy,
//   createdByEmail: doc.createdByEmail,
//   updatedAt: doc.updatedAt,
// });

const validateAssemblyPayload = (body) => {
  const errors = [];

  if (!body?.coopId) errors.push("coopId is required.");
  if (!normalizeText(body?.title)) errors.push("title is required.");

  const status = body?.status || "draft";
  if (!ALLOWED_STATUSES.has(status)) errors.push("status is invalid.");

  if (status === "draft" || status === "discarded") {
    return errors;
  }

  if (!ALLOWED_FORMATS.has(body?.format)) errors.push("format is invalid.");
  if (!toIsoOrEmpty(body?.startDateTime))
    errors.push("startDateTime is required.");
  if (body?.format === "gestreckt" && !toIsoOrEmpty(body?.endDateTime)) {
    errors.push("endDateTime is required for stretched procedure.");
  }
  if (
    (body?.format === "praesenz" || body?.format === "hybrid") &&
    !normalizeText(body?.location)
  ) {
    errors.push("location is required for physical or hybrid assemblies.");
  }
  if (
    (body?.format === "virtuell" || body?.format === "hybrid") &&
    !normalizeText(body?.platformUrl)
  ) {
    errors.push("platformUrl is required for virtual or hybrid assemblies.");
  }
  if (!normalizeText(body?.invitationBody))
    errors.push("invitationBody is required.");

  const agendaItems = Array.isArray(body?.agendaItems) ? body.agendaItems : [];
  if (
    !agendaItems.length ||
    agendaItems.some((item) => !normalizeText(item?.title))
  ) {
    errors.push("At least one agenda item with a title is required.");
  }

  const attendance = Array.isArray(body?.attendance) ? body.attendance : [];
  if (
    attendance.some(
      (item) => !item?.memberId || !ALLOWED_ATTENDANCE.has(item?.status),
    )
  ) {
    errors.push("Attendance rows must include memberId and a valid status.");
  }

  return errors;
};

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

    await ensureCoopAdminAccess(coopId);

    const { databases } = createAdminClient();
    const assemblyResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLIES,
      [
        Query.equal("coopId", coopId),
        Query.orderDesc("updatedAt"),
        Query.limit(100),
      ],
    );

    const assemblies = await Promise.all(
      assemblyResult.documents.map(async (assembly) => {
        const attendanceResult = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID_ASSEMBLY_ATTENDANCE,
          [Query.equal("assemblyId", assembly.$id), Query.limit(500)],
        );

        return assemblyDeserialization(assembly, attendanceResult.documents);
      }),
    );

    return NextResponse.json({ success: true, assemblies });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { success: false, error: safePublicError(error, "Failed to fetch assemblies") },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const errors = validateAssemblyPayload(body);

    if (errors.length) {
      return NextResponse.json(
        { success: false, errors, error: errors[0] },
        { status: 400 },
      );
    }

    const auth = await ensureCoopAdminAccess(body.coopId);
    const { databases } = createAdminClient();
    const now = new Date().toISOString();
    const assemblyId = ID.unique();
    const status = body.status || "draft";
    const attendanceRows = Array.isArray(body.attendance)
      ? body.attendance
      : [];

    const assemblyDoc = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLIES,
      assemblyId,
      {
        coopId: body.coopId,
        title: normalizeText(body.title),
        format: body.format || "",
        startDateTime: toIsoOrEmpty(body.startDateTime),
        ...(body.format === "gestreckt"
          ? { endDateTime: toIsoOrEmpty(body.endDateTime) }
          : {}),
        location: normalizeText(body.location),
        platformUrl: normalizeText(body.platformUrl),
        status,
        quorum: 0,
        quorumMet: false,
        noticePeriodValidation: Boolean(body.noticePeriodValidation),
        overrideReason: normalizeText(body.overrideReason),
        invitationBody: normalizeText(body.invitationBody),
        attachmentsJson: JSON.stringify(body.attachments || []),
        agendaItems: serializeArray(body.agendaItems),
        agendaCount: body.agendaItems.length,
        attendanceSummaryJson: JSON.stringify(body.attendanceSummary || {}),
        createdBy: auth.userId,
        createdByEmail: auth.email,
        updatedAt: now,
      },
    );

    const attendanceDocs = await Promise.all(
      attendanceRows.map((row) =>
        databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID_ASSEMBLY_ATTENDANCE,
          ID.unique(),
          {
            assemblyId: assemblyDoc.$id,
            coopId: body.coopId,
            memberId: row.memberId,
            memberName: normalizeText(row.memberName),
            memberEmail: normalizeText(row.memberEmail),
            status: row.status,
            proxyHolder: normalizeText(row.proxyHolder),
            note: normalizeText(row.note),
            shares: Number(row.shares || 0),
            updatedAt: now,
          },
        ),
      ),
    );

    return NextResponse.json({
      success: true,
      assembly: assemblyDeserialization(assemblyDoc, attendanceDocs),
    });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { success: false, error: safePublicError(error, "Failed to create assembly") },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { assemblyId, status, isLive, title } = body || {};

    if (!assemblyId) {
      return NextResponse.json(
        { success: false, error: "assemblyId is required" },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();
    const existing = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLIES,
      assemblyId,
    );

    await ensureCoopAdminAccess(existing.coopId);

    if (title !== undefined) {
      // Full document update (draft updates)
      const errors = validateAssemblyPayload(body);
      if (errors.length) {
        return NextResponse.json(
          { success: false, errors, error: errors[0] },
          { status: 400 },
        );
      }

      const now = new Date().toISOString();
      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID_ASSEMBLIES,
        assemblyId,
        {
          title: normalizeText(body.title),
          format: body.format,
          startDateTime: toIsoOrEmpty(body.startDateTime),
          ...(body.format === "gestreckt"
            ? { endDateTime: toIsoOrEmpty(body.endDateTime) }
            : { endDateTime: null }),
          location: normalizeText(body.location),
          platformUrl: normalizeText(body.platformUrl),
          status: body.status || "draft",
          noticePeriodValidation: Boolean(body.noticePeriodValidation),
          overrideReason: normalizeText(body.overrideReason),
          invitationBody: body.invitationBody,
          attachmentsJson: JSON.stringify(body.attachments || []),
          agendaItems: serializeArray(body.agendaItems),
          agendaCount: body.agendaItems.length,
          attendanceSummaryJson: JSON.stringify(body.attendanceSummary || {}),
          updatedAt: now,
        },
      );

      // Delete existing attendance
      const attendanceResult = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_ASSEMBLY_ATTENDANCE,
        [Query.equal("assemblyId", assemblyId), Query.limit(500)],
      );

      await Promise.all(
        attendanceResult.documents.map((doc) =>
          databases.deleteDocument(
            DATABASE_ID,
            COLLECTION_ID_ASSEMBLY_ATTENDANCE,
            doc.$id,
          ),
        ),
      );

      // Create new attendance
      const attendanceRows = Array.isArray(body.attendance) ? body.attendance : [];
      const attendanceDocs = await Promise.all(
        attendanceRows.map((row) =>
          databases.createDocument(
            DATABASE_ID,
            COLLECTION_ID_ASSEMBLY_ATTENDANCE,
            ID.unique(),
            {
              assemblyId: assemblyId,
              coopId: existing.coopId,
              memberId: row.memberId,
              memberName: normalizeText(row.memberName),
              memberEmail: normalizeText(row.memberEmail),
              status: row.status,
              proxyHolder: normalizeText(row.proxyHolder),
              note: normalizeText(row.note),
              shares: Number(row.shares || 0),
              updatedAt: now,
            },
          ),
        ),
      );

      return NextResponse.json({
        success: true,
        assembly: assemblyDeserialization(updated, attendanceDocs),
      });
    } else {
      // Just status/cancellation update
      if (status && !ALLOWED_STATUSES.has(status)) {
        return NextResponse.json(
          { success: false, error: "status is invalid" },
          { status: 400 },
        );
      }

      const wasCancelled = !isLive;
      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID_ASSEMBLIES,
        assemblyId,
        {
          ...(status ? { status } : {}),
          wasCancelled,
          updatedAt: new Date().toISOString(),
        },
      );

      return NextResponse.json({
        success: true,
        assembly: assemblyDeserialization(updated),
      });
    }
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { success: false, error: safePublicError(error, "Failed to update assembly") },
      { status: 500 },
    );
  }
}
