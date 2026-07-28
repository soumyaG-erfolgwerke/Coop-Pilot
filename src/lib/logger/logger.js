import winston from 'winston';
import { headers, cookies } from 'next/headers';
import { consoleTransport } from './transports/console.transport.js';
import { MongoTransport } from './transports/mongo.transport.js';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES (JSDoc for IDE intellisense)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {'INFO'|'WARN'|'ERROR'|'CRITICAL'} LogSeverity
 *
 * @typedef {'AUTH'|'API'|'DATABASE'|'USER_ACTION'|'SYSTEM'|'BACKGROUND_JOB'|'SECURITY'|'PERFORMANCE'} LogCategory
 *
 * @typedef {Object} LogPayload
 * @property {string}      eventType   - Machine-readable event name e.g. "USER_LOGIN"
 * @property {LogCategory} category    - Broad category for filtering
 * @property {string}      message     - Human-readable description
 * @property {string}      [actorId]   - User ID performing the action
 * @property {string}      [entityType]- What type of entity is affected e.g. "project"
 * @property {string}      [entityId]  - ID of the affected document/entity
 * @property {Object}      [metadata]  - Any extra structured data (stored as Mixed in Mongo)
 * @property {string}      [requestId] - Override auto-resolved request ID
 * @property {string}      [sessionId] - Browser/user session ID
 */

// ─────────────────────────────────────────────────────────────────────────────
// ENVIRONMENT DETECTION
// ─────────────────────────────────────────────────────────────────────────────

const IS_PRODUCTION = process.env.NEXT_PUBLIC_NODE_ENV === 'production' || process.env.FORCE_MONGO_LOGGING === 'true';
export const IS_SERVERLESS =
  (process.env.VERCEL && process.env.VERCEL !== 'false') ||
  !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.FORCE_SERVERLESS_LOGGING === 'true';

// ─────────────────────────────────────────────────────────────────────────────
// WINSTON INSTANCE
// ─────────────────────────────────────────────────────────────────────────────

const winstonLogger = winston.createLogger({
  level: 'info',
  defaultMeta: {
    environment: process.env.NEXT_PUBLIC_NODE_ENV || 'development',
    source: 'nextjs-server',
  },
  transports: IS_PRODUCTION
    ? [new MongoTransport({ level: 'info' })]
    : [consoleTransport],
  exitOnError: false,
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Auto-resolves the x-request-id header injected by proxy.js.
 *
 * Wrapped in try/catch because `headers()` is asynchronous in Next.js 15+
 * and only available inside a Next.js request context (Server Components,
 * API Routes, Server Actions).
 *
 * @returns {Promise<string|undefined>}
 */
async function getTraceId() {
  try {
    const headersList = await headers();
    return headersList.get('x-request-id') ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Auto-resolves the user ID and session token from the Next.js cookies context.
 *
 * @returns {Promise<{actorId: string|null, sessionId: string|null}>}
 */
async function getSessionContext() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('appwrite-session');
    if (sessionCookie?.value) {
      const decodedValue = decodeURIComponent(sessionCookie.value);
      const sessionData = JSON.parse(decodedValue);
      return {
        actorId: sessionData.userId || null,
        sessionId: sessionData.cookieValue || sessionData.secret || null,
      };
    }
  } catch {
    // Ignore errors when executing outside of a request context
  }
  return { actorId: null, sessionId: null };
}

/**
 * Core write function.
 * Merges payload with auto-resolved requestId and routes to Winston.
 *
 * @param {'system'|'audit'|'analytics'} logTarget - Which collection to write to
 * @param {LogSeverity}                  severity
 * @param {LogPayload}                   payload
 */
async function writeLog(logTarget, severity, payload) {
  try {
    const resolvedRequestId = payload.requestId || await getTraceId();

    // Auto-resolve session data if not explicitly provided in the payload
    let resolvedActorId = payload.actorId || null;
    let resolvedSessionId = payload.sessionId || null;

    if (!resolvedActorId || !resolvedSessionId) {
      const sessionCtx = await getSessionContext();
      if (!resolvedActorId) resolvedActorId = sessionCtx.actorId;
      if (!resolvedSessionId) resolvedSessionId = sessionCtx.sessionId;
    }

    // Map CRITICAL → 'error' for Winston's level system
    const winstonLevel = severity === 'CRITICAL' ? 'error' : severity.toLowerCase();

    const logPromise = new Promise((resolve) => {
      winstonLogger.log(winstonLevel, payload.message, {
        logTarget,
        severity,
        eventType: payload.eventType,
        category: payload.category,
        actorId: resolvedActorId,
        entityType: payload.entityType ?? null,
        entityId: payload.entityId ?? null,
        metadata: payload.metadata ?? null,
        requestId: resolvedRequestId ?? null,
        sessionId: resolvedSessionId,
        timestamp: new Date(),
      }, (err) => {
        if (err) console.error('[Logger] Winston log callback error:', err);
        resolve();
      });

      // If we are using Console transport, resolve immediately because Console write is synchronous
      // and Winston's callback is not reliably called for Console transport.
      if (!IS_PRODUCTION) {
        resolve();
      }
    });

    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        //! console.warn(`[Logger] Logging call timed out after 800ms for eventType: ${payload.eventType}`);
        resolve();
      }, 800);
    });

    await Promise.race([logPromise, timeoutPromise]);

  } catch (err) {
    console.error('[Logger] Critical failure in writeLog:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

export const logger = {
  /**
   * Log an informational system event.
   * @param {LogPayload} payload
   */
  info: (payload) => writeLog('system', 'INFO', payload),

  /**
   * Log a warning.
   * @param {LogPayload} payload
   */
  warn: (payload) => writeLog('system', 'WARN', payload),

  /**
   * Log an error.
   * @param {LogPayload} payload
   */
  error: (payload) => writeLog('system', 'ERROR', payload),

  /**
   * Log a critical failure.
   * @param {LogPayload} payload
   */
  critical: (payload) => writeLog('system', 'CRITICAL', payload),

  /**
   * Log an audit event.
   * @param {LogPayload} payload
   */
  audit: (payload) => writeLog('audit', 'INFO', payload),

  /**
   * Log a frontend analytics event.
   * @param {LogPayload} payload
   */
  analytics: (payload) => writeLog('analytics', 'INFO', payload),
};
