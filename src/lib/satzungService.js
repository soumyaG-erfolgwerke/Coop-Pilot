import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_DOCUMENTS,
} from "@/lib/appwrite-server";
import { Query } from "node-appwrite";
import { createAuditLog } from "./auditLogService";

// Check all satzung docs and any docs is eligible for isCurrent flag, makes it isCurrent.
export async function updateSatzungState(coopId) {
  const { databases } = createAdminClient();

  const now = new Date();

  const docsRes = await databases.listDocuments(
    DATABASE_ID,
    COLLECTION_ID_DOCUMENTS,
    [
      Query.equal("coopId", coopId),
      Query.equal("category", "SATZUNG"),
      Query.orderDesc("effectiveFrom"),
      Query.limit(100),
    ],
  );

  const docs = docsRes.documents;

  if (!docs.length) return;

  const eligibleDocs = docs.filter((doc) => {
    if (!doc.effectiveFrom) return false;
    return new Date(doc.effectiveFrom) <= now;
  });

  if (eligibleDocs.length === 0) return;

  const latest = eligibleDocs.sort(
    (a, b) => new Date(b.effectiveFrom) - new Date(a.effectiveFrom),
  )[0];

  const alreadyCorrect =
    latest.isCurrent &&
    !latest.isArchived &&
    eligibleDocs.every((doc) =>
      doc.$id === latest.$id
        ? true
        : doc.isCurrent === false && doc.isArchived === true,
    );

  if (alreadyCorrect) return;

  const updates = [];

  for (const doc of docs) {
    const isEligible = doc.effectiveFrom && new Date(doc.effectiveFrom) <= now;

    if (doc.$id === latest.$id) {
      if (!doc.isCurrent || doc.isArchived) {
        updates.push(
          databases.updateDocument(
            DATABASE_ID,
            COLLECTION_ID_DOCUMENTS,
            doc.$id,
            {
              isCurrent: true,
              isArchived: false,
            },
          ),
        );

        try {
          await createAuditLog({
            action: "SATZUNG_VERSION_UPDATE",
            entityType: "DOCUMENT",
            entityId: doc.$id,

            performedBy: null,
            performedByName: "System",

            coopId: doc.coopId,

            targetType: "ALL",

            metadata: {
              fileName: doc.fileName,
              version: doc.version,
              effectiveFrom: doc.effectiveFrom,
              auto: true,
            },
          });
        } catch (err) {
          console.error("Audit log failed:", err.message);
        }
      }
    } else if (isEligible) {
      if (doc.isCurrent || !doc.isArchived) {
        updates.push(
          databases.updateDocument(
            DATABASE_ID,
            COLLECTION_ID_DOCUMENTS,
            doc.$id,
            {
              isCurrent: false,
              isArchived: true,
            },
          ),
        );
      }
    }
  }

  await Promise.all(updates);
}
