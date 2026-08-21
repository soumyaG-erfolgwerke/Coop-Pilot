const STORAGE_KEY = "cooppilot_last_seen_changelog_id";

/**
 * Fetch changelog JSON with timestamp query to bypass browser cache
 */
export async function fetchChangelog() {
  try {
    const res = await fetch(`/changelog.json?t=${Date.now()}`);
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Failed to fetch changelog:", err);
    return [];
  }
}

/**
 * Read last seen changelog ID from localStorage
 */
export function getLastSeenChangelogId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Mark latest changelog as read in localStorage
 */
export function markChangelogAsRead(latestId) {
  if (typeof window === "undefined" || !latestId) return;
  localStorage.setItem(STORAGE_KEY, latestId);
}

/**
 * Check if there is an unread changelog entry
 */
export function hasUnreadChangelog(changelogs) {
  if (!changelogs || changelogs.length === 0) return false;
  const latestId = changelogs[0].id;
  const lastSeen = getLastSeenChangelogId();
  return !lastSeen || lastSeen !== latestId;
}
