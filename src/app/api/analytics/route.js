import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * POST /api/analytics
 *
 * Accepts frontend event data and persists it to analytics_logs via
 * the logger module. The requestId is auto-resolved from the incoming
 * headers (set by proxy.js).
 *
 * Expected body:
 * {
 *   eventType: string,       // e.g. "BUTTON_CLICK"
 *   message:   string,       // Human description
 *   actorId?:  string,       // User ID if logged in
 *   metadata?: object        // Any extra context
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.eventType || !body.message) {
      return NextResponse.json(
        { success: false, error: 'eventType and message are required' },
        { status: 400 }
      );
    }

    // Extract network info from request headers
    const ip        = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent')      || 'unknown';

    // Route through the analytics logger
    // requestId is auto-resolved from headers() inside writeLog()
    await logger.analytics({
      eventType: body.eventType,
      category:  'USER_ACTION',
      message:   body.message,
      actorId:   body.actorId   || null,
      sessionId: body.sessionId || null,
      metadata: {
        ...body.metadata,
        ip,
        userAgent,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[/api/analytics] Handler error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
