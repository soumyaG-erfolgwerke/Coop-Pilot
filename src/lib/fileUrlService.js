import { getSecureFileUrl } from "@/lib/secureFileUrl";

const AUDIT_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_AUDIT_BUCKET_ID || "6918a3360027dc0888aa";

export const getViewUrl = (fileId) => {
    if (!fileId) return "";

    return getSecureFileUrl(AUDIT_BUCKET_ID, fileId);
};
