/*
THIS IS NOT RELATED TO AUDIT AS IN AUDIT ORGS AND AUDITING
*/

import { ID } from "node-appwrite";
import {
  COLLECTION_ID_AUDITLOGS,
  createAdminClient,
  DATABASE_ID,
} from "./appwrite-server";
import { logger } from "./logger/index.js";

const { databases } = createAdminClient();

export async function createAuditLog({
  action,
  entityType,
  entityId,
  performedBy,
  performedByName,
  coopId,
  targetType = "ALL",
  targetId = null,
  metadata = {},
}) {
  try {

    const res = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDITLOGS,
      ID.unique(),
      {
        action,
        entityType,
        entityId,

        performedBy,
        performedByName,

        coopId,

        targetType,
        targetId,

        performedAt: new Date().toISOString(),

        metadata: JSON.stringify(metadata || {}),
      },
    );

    // Also write to Winston MongoDB audit_logs collection
    try {
      logger.audit({
        eventType: action || 'AUDIT_EVENT',
        category: 'USER_ACTION',
        message: `${action} on ${entityType} (${entityId}) by user ${performedByName || performedBy}`,
        actorId: performedBy,
        entityType,
        entityId,
        metadata: {
          ...(typeof metadata === 'string' ? JSON.parse(metadata) : metadata),
          coopId,
          targetType,
          targetId,
          performedByName,
        }
      });
    } catch (logErr) {
      console.error("Failed to write audit log to Winston:", logErr.message);
    }

    return res;
  } catch (error) {
    console.error("Audit Log Error:", error);
    throw error;
  }
}
