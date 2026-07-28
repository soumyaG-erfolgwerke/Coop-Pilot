import { NextResponse } from 'next/server';
import { getInbox } from '@/services/mails/mailServer';

export async function POST(request) {
    try {

        const { accEmail, page = 1, limit = 20 } = await request.json();
        if (!accEmail) {
            return NextResponse.json({
                success: false,
                error: "accEmail is required"
            }, { status: 400 });
        }
        const inboxData = await getInbox(accEmail, page, limit);

        return NextResponse.json({
            success: true,
            page: inboxData.page,
            limit: inboxData.limit,
            total: inboxData.total,
            data: inboxData.data
        });
    } catch (error) {
        console.error("Next.js API IMAP Error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch inbox" }, { status: 500 });
    }
}