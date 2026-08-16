import { NextResponse } from 'next/server';
import { edgeLogger } from './lib/logger/edge-logger.js';

const rateState = globalThis.__coopilotRateState || new Map();
globalThis.__coopilotRateState = rateState;

const mutationMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function ratePolicy(pathname, method) {
  if (pathname === '/api/auth/login') return { limit: 10, windowMs: 60_000 };
  if (pathname === '/api/auth/register') return { limit: 5, windowMs: 60_000 };
  if (pathname.startsWith('/api/forget-password')) return { limit: 5, windowMs: 60_000 };
  if (pathname.endsWith('/searchUser')) return { limit: 10, windowMs: 60_000 };
  if (pathname.includes('/upload') || pathname.endsWith('/generate')) {
    return { limit: 20, windowMs: 60_000 };
  }
  if (pathname.startsWith('/api/') && mutationMethods.has(method)) {
    return { limit: 120, windowMs: 60_000 };
  }
  if (pathname.startsWith('/api/')) return { limit: 600, windowMs: 60_000 };
  return null;
}

function enforceRateLimit(request, pathname) {
  const policy = ratePolicy(pathname, request.method);
  if (!policy) return null;
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = request.headers.get('x-real-ip') || forwarded || 'unknown';
  const now = Date.now();
  const key = `${ip}:${request.method}:${pathname}`;
  let entry = rateState.get(key);
  if (!entry || now >= entry.resetAt) entry = { count: 0, resetAt: now + policy.windowMs };
  entry.count += 1;
  rateState.set(key, entry);
  if (rateState.size > 10_000) {
    for (const [candidate, value] of rateState) {
      if (now >= value.resetAt) rateState.delete(candidate);
    }
  }
  if (entry.count <= policy.limit) return null;
  return {
    retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    limit: policy.limit,
  };
}

function isCrossSiteMutation(request) {
  if (!mutationMethods.has(request.method) || !request.cookies.has('appwrite-session')) return false;
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site') return true;
  if (!origin) return false;
  try {
    const expectedHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const expectedProto = request.headers.get('x-forwarded-proto') || new URL(request.url).protocol.slice(0, -1);
    const supplied = new URL(origin);
    return supplied.host !== expectedHost || supplied.protocol !== `${expectedProto}:`;
  } catch {
    return true;
  }
}

function isPublicApiRequest(method, pathname) {
  const exact = new Set([
    '/api/auth/login', '/api/auth/register',
    '/api/sector', '/api/states',
    '/api/coop-services/active', '/api/coop-services/search', '/api/coop-services/by-reg-number',
    '/api/cooperative/search',
    '/api/assembly/proxy/login', '/api/assembly/proxy/session', '/api/assembly/proxy/logout',
    '/api/vote/cast',
  ]);
  if (exact.has(pathname)) return true;
  if (method === 'GET' && pathname.startsWith('/api/onboardAdmin/fetchCoops/')) return true;
  if (method === 'GET' && pathname === '/api/onboardAdmin/checkProfile') return true;
  if (method === 'POST' && pathname === '/api/onboardAdmin/submitOnboarding') return true;
  const prefixes = [
    '/api/forget-password',
    '/api/coopAdminSignUp/', '/api/coopAdminSignUpV2/',
    '/api/payments/webhooks/',
  ];
  if (prefixes.some((prefix) => pathname.startsWith(prefix))) return true;
  if (pathname === '/api/contactUs' && method === 'POST') return true;
  if (pathname === '/api/suggestions' && method === 'POST') return true;
  if (method === 'GET' && pathname.startsWith('/api/files/')) return true;
  return false;
}

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
  if (isCrossSiteMutation(request)) {
    return NextResponse.json(
      { success: false, error: 'Cross-site request rejected' },
      { status: 403, headers: { 'Cache-Control': 'no-store', 'x-request-id': requestId } },
    );
  }
  const limited = enforceRateLimit(request, pathname);
  if (limited) {
    return NextResponse.json(
      { success: false, error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Cache-Control': 'no-store',
          'Retry-After': String(limited.retryAfter),
          'RateLimit-Limit': String(limited.limit),
          'x-request-id': requestId,
        },
      },
    );
  }
  const disabledHighRiskPrefixes = [
    '/api/mailsV2',
  ];
  if (disabledHighRiskPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.json(
      { success: false, error: 'Service temporarily unavailable' },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
          'Retry-After': '3600',
          'x-request-id': requestId,
        },
      },
    );
  }
  if (/^\/api\/transaction\/[^/]+\/pay$/.test(pathname)) {
    return NextResponse.json(
      { success: false, error: 'Payment confirmation requires a verified provider webhook' },
      { status: 503, headers: { 'Cache-Control': 'no-store', 'x-request-id': requestId } },
    );
  }
  if (
    pathname.startsWith('/api/') &&
    !request.cookies.has('appwrite-session') &&
    !isPublicApiRequest(request.method, pathname)
  ) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401, headers: { 'Cache-Control': 'no-store', 'x-request-id': requestId } },
    );
  }
  const isStaticAsset = pathname.startsWith('/_next/') || 
                        pathname.startsWith('/favicon.ico') || 
                        pathname.startsWith('/fav.ico') ||
                        /\.(?:png|jpg|jpeg|webp|svg|gif|ico|css|js|woff2?|riv)$/i.test(pathname);

  const isInternalLog = pathname === '/api/internal/log';
  if (!isStaticAsset && !isInternalLog) {
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
