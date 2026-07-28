import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * POST /api/internal/log
 *
 * Internal endpoint used by edge-logger to proxy log writes
 * from the Edge runtime (proxy/middleware) to standard Winston MongoDB transports.
 */
export async function POST(request) {
  try {
    const body = await request.json();

    const severity = (body.severity || 'INFO').toUpperCase();

    const payload = {
      eventType: body.eventType || 'HTTP_REQUEST',
      category:  body.category  || 'API',
      message:   body.message   || '',
      metadata:  body.metadata  || null,
      requestId: body.requestId || null,
      actorId:   body.actorId   || null,
      sessionId: body.sessionId || null,
    };

    // Route to appropriate logger method based on severity
    if (severity === 'CRITICAL') {
      await logger.critical(payload);
    } else if (severity === 'ERROR') {
      await logger.error(payload);
    } else if (severity === 'WARN') {
      await logger.warn(payload);
    } else {
      await logger.info(payload);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[/api/internal/log] Handler error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
