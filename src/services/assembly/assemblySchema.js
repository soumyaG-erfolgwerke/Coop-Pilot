// // You need to define this helper function
// const parseJsonSafely = (jsonString, defaultValue = {}) => {
//   try {
//     if (!jsonString) return defaultValue;
//     return typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;
//   } catch (error) {
//     console.error("Failed to parse JSON:", error);
//     return defaultValue;
//   }
// };

// export const assemblyDeserialization = (doc, attendanceDocs = []) => {
//   const assemblySchema = {
//     id: doc.$id,
//     coopId: doc.coopId,
//     title: doc.title,
//     format: doc.format,
//     startDateTime: doc.startDateTime,
//     endDateTime: doc.endDateTime,
//     location: doc.location,
//     platformUrl: doc.platformUrl,
//     status: doc.status,
//     noticePeriodValidation: doc.noticePeriodValidation,
//     quorum: doc.quorum,
//     quorumMet: doc.quorumMet,
//     wasCancelled: doc.wasCancelled || false,
//     overrideReason: doc.overrideReason,
//     invitationBody: doc.invitationBody,
//     attachments: parseJsonSafely(doc.attachmentsJson, []),
//     agendaItems: (doc.agendaItems || []).map((item) =>
//       parseJsonSafely(item, {}),
//     ),
//     agendaCount: Number(doc.agendaCount || 0),
//     attendanceSummary: parseJsonSafely(doc.attendanceSummaryJson, {}),
//     attendance: attendanceDocs.map((attendance) => ({
//       id: attendance.$id,
//       memberId: attendance.memberId,
//       memberName: attendance.memberName,
//       memberEmail: attendance.memberEmail,
//       status: attendance.status,
//       proxyHolder: attendance.proxyHolder,
//       note: attendance.note,
//       shares: Number(attendance.shares || 0),
//     })),
//     createdBy: doc.createdBy,
//     createdByEmail: doc.createdByEmail,
//     updatedAt: doc.updatedAt,
//   };
//   console.log("assemblySchema", assemblySchema);
//   return assemblySchema;
// };

const parseJsonSafely = (value, fallback = {}) => {
  if (typeof value !== "string") return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const assemblyDeserialization = (doc, attendanceDocs = []) => {
  const assemblySchema = {
    id: doc.$id,
    coopId: doc.coopId,
    title: doc.title,
    format: doc.format,
    startDateTime: doc.startDateTime,
    endDateTime: doc.endDateTime,
    location: doc.location,
    platformUrl: doc.platformUrl,
    status: doc.status,
    noticePeriodValidation: doc.noticePeriodValidation,
    quorum: doc.quorum,
    quorumMet: doc.quorumMet,
    wasCancelled: doc.wasCancelled || false,
    overrideReason: doc.overrideReason,
    invitationBody: doc.invitationBody,
    attachments: parseJsonSafely(doc.attachmentsJson, []),
    agendaItems: (doc.agendaItems || []).map((item) =>
      parseJsonSafely(item, {}),
    ),
    agendaCount: Number(doc.agendaCount || 0),
    attendanceSummary: parseJsonSafely(doc.attendanceSummaryJson, {}),
    attendance: attendanceDocs.map((attendance) => ({
      id: attendance.$id,
      memberId: attendance.memberId,
      memberName: attendance.memberName,
      memberEmail: attendance.memberEmail,
      status: attendance.status,
      proxyHolder: attendance.proxyHolder,
      note: attendance.note,
      shares: Number(attendance.shares || 0),
    })),
    createdBy: doc.createdBy,
    createdByEmail: doc.createdByEmail,
    updatedAt: doc.updatedAt,
  };
  // console.log("assemblySchema", assemblySchema);
  return assemblySchema;
};
