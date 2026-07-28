import { NextResponse } from "next/server";
import { sendMail, getSent } from "@/services/mails/mailServer";
import {
    createAdminClient,
    DATABASE_ID,
    COLLECTION_ID_PROFILE,
} from "@/lib/appwrite-server";
import { Query } from "node-appwrite";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const accEmailParam = searchParams.get('accEmail');
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);

        let accEmail = accEmailParam;

        if (!accEmail && userId) {
            const { databases } = createAdminClient();
            const profileResult = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_ID_PROFILE,
                [Query.equal("userId", userId)]
            );
            if (profileResult.documents.length > 0) {
                accEmail = profileResult.documents[0].contactEmail;
            }
        }

        if (!accEmail) {
            return NextResponse.json(
                { success: false, error: "Missing userId or accEmail parameter" },
                { status: 400 }
            );
        }

        const sentData = await getSent(accEmail, page, limit);

        return NextResponse.json({
            success: true,
            page: sentData.page,
            limit: sentData.limit,
            total: sentData.total,
            data: sentData.data
        });
    } catch (error) {
        console.error("Next.js API IMAP Sent GET Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch sent mails" },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {

        const resBody = await request.json();
        const { accEmail, subject, body, to, attachments } = resBody;

        if (!accEmail || !subject || !body || !to) {
            return NextResponse.json(
                { success: false, error: "accEmail and subject and body and to are required" },
                { status: 400 },
            );
        }

        const mailResponse = await sendMail(accEmail, subject, body, to, attachments);

        return NextResponse.json(
            { success: true, mailData: mailResponse },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to set mail up" },
            { status: 500 },
        );
    }
}


