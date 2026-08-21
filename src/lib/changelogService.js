const STORAGE_KEY_PREFIX = "cooppilot_last_seen_changelog_";

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
 * Filter changelog items matching the active user role
 */
export function filterChangelogsByRole(changelogs, userRole) {
  if (!changelogs || !Array.isArray(changelogs)) return [];
  const normalizedRole = (userRole || "").toLowerCase().trim();

  return changelogs.filter((item) => {
    if (!item.roles || item.roles.includes("all")) return true;
    if (!normalizedRole) return false;

    return item.roles.some((r) => {
      const targetRole = r.toLowerCase().trim();
      if (targetRole === normalizedRole) return true;
      // Handle role aliases (e.g. orgadmin / org_admin, auditer / aud_E)
      if ((targetRole === "orgadmin" || targetRole === "org_admin") && (normalizedRole === "orgadmin" || normalizedRole === "org_admin")) return true;
      if ((targetRole === "auditer" || targetRole === "aud_e") && (normalizedRole === "auditer" || normalizedRole === "aud_e")) return true;
      return false;
    });
  });
}

/**
 * Read last seen changelog ID from localStorage for specific user role
 */
export function getLastSeenChangelogId(userRole) {
  if (typeof window === "undefined") return null;
  const key = `${STORAGE_KEY_PREFIX}${userRole || "guest"}`;
  return localStorage.getItem(key);
}

/**
 * Mark latest changelog as read in localStorage for specific user role
 */
export function markChangelogAsRead(latestId, userRole) {
  if (typeof window === "undefined" || !latestId) return;
  const key = `${STORAGE_KEY_PREFIX}${userRole || "guest"}`;
  localStorage.setItem(key, latestId);
}

/**
 * Check if there is an unread role-relevant changelog entry
 */
export function hasUnreadChangelog(roleFilteredLogs, userRole) {
  if (!roleFilteredLogs || roleFilteredLogs.length === 0) return false;
  const latestId = roleFilteredLogs[0].id;
  const lastSeen = getLastSeenChangelogId(userRole);
  return !lastSeen || lastSeen !== latestId;
}
