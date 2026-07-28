/**
 * Client-side event tracker.
 *
 * Sends analytics events to /api/analytics (server-side).
 * Safe to call from React onClick handlers, useEffect, etc.
 * Will silently no-op during SSR.
 *
 * @param {string} eventType          - Machine-readable event name e.g. "SIGNUP_CLICK"
 * @param {string} message            - Human-readable description
 * @param {Object} [metadata]         - Extra context (will be merged with url)
 * @param {string} [actorId]          - User ID if available
 * @param {string} [sessionId]        - Session ID if available
 */
export const trackEvent = async (
  eventType,
  message,
  metadata = {},
  actorId  = null,
  sessionId = null,
) => {
  // Guard: don't run during SSR
  if (typeof window === 'undefined') return;

  // Non-blocking — we don't await or surface errors to the user
  fetch('/api/analytics', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType,
      message,
      actorId,
      sessionId,
      metadata: {
        ...metadata,
        url:       window.location.href,
        referrer:  document.referrer || null,
        userAgent: navigator.userAgent,
      },
    }),
  }).catch((err) => {
    // Silent fail — analytics should never break the UI
    if (process.env.NEXT_PUBLIC_NODE_ENV === 'development') {
      console.warn('[trackEvent] Failed to send event:', err);
    }
  });
};
