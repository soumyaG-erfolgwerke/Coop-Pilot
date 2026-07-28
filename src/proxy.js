import { NextResponse } from 'next/server';
import { edgeLogger } from './lib/logger/edge-logger.js';

/**
 * Global Next.js 16 Proxy Router.
 * Intercepts all incoming requests to inject a unique trace ID.
 *
 * @param {NextRequest} request
 * @returns {NextResponse}
 */
export function proxy(request, event) {
  // 1. Generate a unique trace ID for this request
  const requestId = crypto.randomUUID();

  // 2. Clone and inject trace ID into request headers so server-side layers can read it
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  // 3. Log the HTTP request using the Edge-safe logger if it's not a static asset (non-blocking)
  const url = new URL(request.url);
  const pathname = url.pathname;
  const isStaticAsset = pathname.startsWith('/_next/') || 
                        pathname.startsWith('/favicon.ico') || 
                        pathname.startsWith('/fav.ico') ||
                        /\.(?:png|jpg|jpeg|webp|svg|gif|ico|css|js|woff2?|riv)$/i.test(pathname);

  if (!isStaticAsset) {
    const logPromise = edgeLogger.logRequest(request, requestId);
    if (event && typeof event.waitUntil === 'function') {
      event.waitUntil(logPromise);
    }
  }

  // 4. Continue to route with injected request headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 5. Set trace ID on response headers so clients can trace requests
  response.headers.set('x-request-id', requestId);

  return response;
}

// Apply proxy interceptor to all routes except static files and Next.js internals
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|fav\\.ico|.*\\.(?:png|jpg|jpeg|webp|svg|gif|ico|css|js|woff2?|riv)$).*)'],
};
