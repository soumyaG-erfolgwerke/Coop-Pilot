import { NextResponse } from 'next/server';
import { getMessages } from '@/services/mails/mailServer';

export async function POST(request, { params }) {
    try {
        const { uid } = await params;
        const body = await request.json();
        const accEmail = body.accEmail;
        const folder = body.folder || 'INBOX';

        if (!accEmail) {
            return NextResponse.json({
                success: false,
                error: "accEmail is required"
            }, { status: 400 });
        }

        // Convert dynamic route param uid to Number since IMAP UIDs are numeric
        const numericUid = Number(uid);
        if (isNaN(numericUid)) {
            return NextResponse.json({ success: false, error: "Invalid email UID" }, { status: 400 });
        }

        const message = await getMessages(accEmail, numericUid, folder);
        return NextResponse.json(message);

    } catch (error) {
        console.error("Next.js Error Parsing Email:", error);
        return NextResponse.json({ success: false, error: "Failed to parse email" }, { status: 500 });
    }
}