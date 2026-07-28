import { NextResponse } from 'next/server';
import { getSent } from '@/services/mails/mailServer';

export async function POST(request) {
    try {
        const { accEmail, page = 1, limit = 20 } = await request.json();

        if (!accEmail) {
            return NextResponse.json({ success: false, error: "accEmail is required" }, { status: 400 });
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
        console.error("Next.js API IMAP Sent Error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch sent mails" }, { status: 500 });
    }
}
