export function getSecureFileUrl(bucketId, fileId, { download = false } = {}) {
  if (!bucketId || !fileId) return "";
  const path = `/api/files/${encodeURIComponent(bucketId)}/${encodeURIComponent(fileId)}`;
  return download ? `${path}?download=1` : path;
}
