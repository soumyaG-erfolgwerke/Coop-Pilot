import {
    COLLECTION_ID_AUDIT_DISCREPANCY,
    createAdminClient,
    DATABASE_ID,
} from "@/lib/appwrite-server";
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { requireCoopAuditAccess } from "@/lib/auth/audit-access";
import { sessionErrorResponse } from "@/lib/auth/session";

const { databases } = createAdminClient();

export const GET = async (request) => {
    const { searchParams } = new URL(request.url);
    const coopId = searchParams.get("coopId");
    if (!coopId) {
        return NextResponse.json(
            { error: "coopId is required" },
            { status: 400 }
        );
    }

    try {
        await requireCoopAuditAccess(coopId);
        const res = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID_AUDIT_DISCREPANCY,
            [
                Query.equal("coopId", coopId),
                Query.equal("type", "threat"),
                Query.notEqual("status", "resolved"),
                Query.orderDesc("$createdAt"),
            ],
        );

        const discrepancyList = (res.documents || []).map((doc) => {
            const { createdBy, ...rest } = doc;
            return rest;
        });
        return NextResponse.json({ discrepancyList }, { status: 200 });
    } catch (error) {
        if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
        if (error?.code === 404) {
            return NextResponse.json({ discrepancyList: [] }, { status: 200 });
        }
        console.error("Error fetching document:", error);
        return NextResponse.json(
            { error: "Failed to fetch document" },
            { status: 500 },
        );
    }
};
