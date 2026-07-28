const AUDIT_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_AUDIT_BUCKET_ID || "6918a3360027dc0888aa";

export const getViewUrl = (fileId) => {
    if (!fileId) return "";

    const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

    return `${ENDPOINT}/storage/buckets/${AUDIT_BUCKET_ID}/files/${fileId}/view?project=${PROJECT_ID}`;
};
