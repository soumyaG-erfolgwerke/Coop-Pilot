export function getRelativeTime(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return "Just now";
  } else if (diffMins < 60) {
    return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  } else {
    // return new Date(date).toLocaleDateString();
    return "Unknown Date";
  }
}

export const normalizeAssemblyStatus = (assembly) => {
  if (assembly.status === "live") return "live";
  if (assembly.status === "draft") return "draft";
  if (assembly.status === "closed") return "closed";
  if (assembly.status === "discarded") return "discarded";

  const now = Date.now();
  const startsAt = assembly.startDateTime
    ? new Date(assembly.startDateTime).getTime()
    : 0;
  const endsAt = assembly.endDateTime
    ? new Date(assembly.endDateTime).getTime()
    : null;

  if (startsAt && now >= startsAt && endsAt === null && now <= endsAt)
    return "live";
  if (endsAt && now > endsAt) return "closed";
  return "upcoming";
};
