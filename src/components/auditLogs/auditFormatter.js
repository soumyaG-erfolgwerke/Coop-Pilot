export const formatAuditMessage = (log, currentUserId) => {
  if (!log) return "";

  const meta = log.metadata || {};

  switch (log.action) {
    case "MEMBER_ADDED_TO_GROUP":
      if (meta.isAllMembers) {
        return `You are part of ${meta.groupName}`;
      }
      return `You were added to ${meta.groupName}`;

    case "GROUP_DOC_SHARED":
      return `A new document "${
        meta.fileName || "a document"
      }" was shared in ${meta.groupName || "a group"}`;
  }

  const isYou = log.performedBy === currentUserId;
  const actor = isYou ? "You" : log.performedByName || "Someone";

  switch (log.action) {
    case "UPLOAD_DOC":
      return `${actor} uploaded "${meta.fileName || "a document"}" under category "${meta.category}"`;

    case "SATZUNG_VERSION_UPDATE":
      return `Statute version (${meta.version}) became active`;
      
    case "SHARE_DOC":
      if (meta.sharedWithType === "GROUP") {
        return `${actor} shared "${meta.fileName || "a document"}" to a group`;
      }
      return `${actor} shared "${meta.fileName || "a document"}"`;

    default:
      return `${actor} performed an action`;
  }
};

export const formatTimeAgo = (date) => {
  if (!date) return "";

  const diff = Math.floor((Date.now() - new Date(date)) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} day ago`;

  return new Date(date).toLocaleDateString();
};
