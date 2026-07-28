export const guessMimeType = (name) => {
  if (!name) return "";

  const lower = name.toLowerCase();

  if (lower.endsWith(".pdf")) return "application/pdf";

  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";

  if (lower.endsWith(".png")) return "image/png";

  if (lower.endsWith(".doc") || lower.endsWith(".docx"))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  if (lower.endsWith(".xls") || lower.endsWith(".xlsx"))
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  return "";
};
