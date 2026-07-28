import { Query } from "node-appwrite";
import {
    createAdminClient,
    DATABASE_ID,
    COLLECTION_ID_TEAMXCOOP,
} from "@/lib/appwrite-server";

// get auditor id for a coop

export async function getAuditerIdForCoop(coopId) {
    try {

        if (!coopId) {
            throw new Error("coopId is required");
        }

        const { databases } = createAdminClient();

        // Get org data
        const auditer = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID_TEAMXCOOP,
            [
                Query.equal("coopId", coopId),
                Query.orderDesc("$createdAt"),
                Query.equal("role", "auditer"),
            ]
        );

        if (auditer.documents.length === 0) {
            return null;
        }

        return auditer.documents[0].teamMemberId;

    } catch (error) {
        throw error;
    }
}

export async function getSubAuditorIds(coopId) {
    try {

        if (!coopId) {
            throw new Error("coopId is required");
        }

        const { databases } = createAdminClient();

        // updating invite status
        const subAuditers = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID_TEAMXCOOP,
            [
                Query.equal("coopId", coopId),
                Query.equal("role", "aud_E"),
                Query.orderDesc("$createdAt"),
            ]
        );

        if (subAuditers.documents.length === 0) {
            return [];
        }

       const memberIds = subAuditers.documents?.map((doc) => doc.teamMemberId) || [];
       return memberIds;

    } catch (error) {
        throw error;
    }
}


