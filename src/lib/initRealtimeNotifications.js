// Poll the authenticated notification API instead of subscribing directly to
// a publicly readable Appwrite collection. The caller already refetches its
// scoped notification list when this callback fires.
export function initRealtimeNotifications({ onCreate, intervalMs = 45000 }) {
  if (typeof window === "undefined") return () => {};

  const refresh = () => {
    if (document.visibilityState === "visible") onCreate?.(null);
  };
  const timer = window.setInterval(refresh, intervalMs);
  window.addEventListener("focus", refresh);

  return () => {
    window.clearInterval(timer);
    window.removeEventListener("focus", refresh);
  };
}
