import { NextResponse } from "next/server";
import {
    createAdminClient,
    DATABASE_ID,
    COLLECTION_ID_MAIL_DIRECTORY,
} from "@/lib/appwrite-server";
import { Query } from "node-appwrite";

export async function POST(request) {
    try {

        const body = await request.json();
        const { accEmail } = body;

        if (!accEmail) {
            return NextResponse.json(
                { success: false, error: "accEmail is required" },
                { status: 400 },
            );
        }

        const { databases } = createAdminClient();

        const mailRes = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID_MAIL_DIRECTORY,
            [
                Query.equal("accEmail", accEmail),
            ]
        );

        if (mailRes.documents.length === 0) {
            return NextResponse.json(
                { success: true, exists: false, error: "Mail not found" },
                { status: 200 }
            );
        }

        const mailDoc = mailRes.documents[0];
        const mail = {
            name: mailDoc.name,
            aliasEmail: mailDoc.aliasEmail,
            email: mailDoc.email,
        };

        return NextResponse.json(
            { success: true, exists: true, mail },
            { status: 200 }
        );
    } catch (error) {

        return NextResponse.json(
            { success: false, error: error.message || "Failed to check mail status" },
            { status: 500 },
        );
    }
}

