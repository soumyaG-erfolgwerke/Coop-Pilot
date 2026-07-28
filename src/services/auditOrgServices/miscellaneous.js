import { Query } from "node-appwrite";
import {
    createAdminClient,
    DATABASE_ID,
    COLLECTION_ID_AUDIT_ORGS,
    COLLECTION_ID_INVITE_COOPS,
} from "@/lib/appwrite-server";

// convert org's publicID to auditOrgId

export async function publicIdToAuditOrgId(publicID) {
    try {

        if (!publicID) {
            throw new Error("publicID is required");
        }

        const { databases } = createAdminClient();

        // Get org data
        const auditOrg = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID_AUDIT_ORGS,
            [
                Query.equal("publicId", publicID),
                Query.limit(1),
                Query.orderDesc("$createdAt"),
            ]
        );

        if (auditOrg.documents.length === 0) {
            throw new Error("Audit Org not found");
        }

        return auditOrg.documents[0].$id;

    } catch (error) {
        throw error;
    }
}

export async function changeInviteToAccepted(email, regNumber) {
    try {

        if (!email || !regNumber) {
            throw new Error("email or regNumber is required");
        }

        const { databases } = createAdminClient();

        // updating invite status
        const auditOrg = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID_INVITE_COOPS,
            [
                Query.equal("email", email),
                Query.equal("RegNumber", regNumber),
                Query.limit(1),
                Query.orderDesc("$createdAt"),
            ]
        );

        if (auditOrg.documents.length === 0) {
            return false;
        }

        await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_ID_INVITE_COOPS,
            auditOrg.documents[0].$id,
            {
                status: "accepted",
            }
        );

        return true;

    } catch (error) {
        throw error;
    }
}


