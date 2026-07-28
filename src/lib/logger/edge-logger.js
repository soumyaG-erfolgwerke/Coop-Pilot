/**
 * Edge Logger — Middleware/Proxy-safe logging.
 *
 * Next.js proxy runs in the Edge or custom runtime which may:
 *   ✗ Not support mongoose / Node.js net module
 *   ✗ Not support winston's File or MongoDB transports
 *   ✓ Support fetch() and console
 *
 * Strategy: In production, POST log data to /api/internal/log
 * which runs in the standard Node.js runtime and uses the full logger.
 */
export const edgeLogger = {
  /**
   * Log an HTTP request from middleware / proxy.
   * In dev: console.log
   * In prod: POST to internal log endpoint
   *
   * @param {Request} request
   * @param {string}  requestId
   */
  logRequest: async (request, requestId) => {
    const requestUrl = new URL(request.url);
    const payload = {
      eventType: 'HTTP_REQUEST',
      category:  'API',
      severity:  'INFO',
      message:   `${request.method} ${requestUrl.pathname}`,
      metadata: {
        method:    request.method,
        path:      requestUrl.pathname,
        userAgent: request.headers.get('user-agent'),
      },
      requestId,
    };

    if (process.env.NEXT_PUBLIC_NODE_ENV === 'development') {
      console.log('[Edge]', payload.message, `[req:${requestId.slice(0, 8)}]`);
      return;
    }

    // In production, call your own internal API route using the request origin
    try {
      const origin = requestUrl.origin;
      await fetch(`${origin}/api/internal/log`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
    } catch {
      // Silently ignore — never crash proxy
    }
  },
};
