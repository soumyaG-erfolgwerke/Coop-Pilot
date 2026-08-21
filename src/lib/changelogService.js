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
 * Normalize role strings case-insensitively and handle aliases
 * e.g. orgAdmin / orgadmin / org_admin / auditOrgAdmin -> orgadmin
 * e.g. auditer / aud_E / auditor -> auditor
 * e.g. coopadmin / coopAdmin -> coopadmin
 */
export function normalizeRole(role) {
  if (!role) return "guest";
  const r = String(role).toLowerCase().replace(/[^a-z0-9]/g, "");

  if (r.includes("orgadmin") || r.includes("org_admin") || r.includes("auditorg")) {
    return "orgadmin";
  }
  if (r.includes("coopadmin")) {
    return "coopadmin";
  }
  if (r.includes("audit") || r.includes("aud_e")) {
    return "auditor";
  }
  if (r.includes("member")) {
    return "member";
  }
  return r;
}

/**
 * Filter changelog items matching the active user role
 */
export function filterChangelogsByRole(changelogs, userRole) {
  if (!changelogs || !Array.isArray(changelogs)) return [];
  const normalizedUserRole = normalizeRole(userRole);

  return changelogs.filter((item) => {
    if (!item.roles || item.roles.includes("all")) return true;

    return item.roles.some((r) => {
      const targetNormalized = normalizeRole(r);
      return targetNormalized === normalizedUserRole || r.toLowerCase() === (userRole || "").toLowerCase();
    });
  });
}

/**
 * Read last seen changelog ID from localStorage for specific user role
 */
export function getLastSeenChangelogId(userRole) {
  if (typeof window === "undefined") return null;
  const key = `${STORAGE_KEY_PREFIX}${normalizeRole(userRole)}`;
  return localStorage.getItem(key);
}

/**
 * Mark latest changelog as read in localStorage for specific user role
 */
export function markChangelogAsRead(latestId, userRole) {
  if (typeof window === "undefined" || !latestId) return;
  const key = `${STORAGE_KEY_PREFIX}${normalizeRole(userRole)}`;
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
