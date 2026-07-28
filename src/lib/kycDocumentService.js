import { 
  createAdminClient, 
  DATABASE_ID, 
  COLLECTION_ID_KYC_DOCUMENTS, 
  AUDIT_BUCKET_ID 
} from "@/lib/appwrite-server";
import { ID } from "node-appwrite";

/**
 * Service to handle KYC document uploads to Appwrite Storage and Database.
 */
export async function uploadKycDocument(userId, file, documentType, rollback = null, kycApplicationId = null) {
  if (!userId || !file || !documentType) {
    throw new Error("Missing required parameters: userId, file, or documentType");
  }

  // Validation constants
  const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png"];
  const allowedTypes = ["Personalausweis", "Reisepass", "Aufenthaltstitel"];

  // 1. Validate Document Type
  if (!allowedTypes.includes(documentType)) {
    throw new Error("Invalid document type. Must be one of: " + allowedTypes.join(", "));
  }

  // 2. Validate File Object and Type
  if (typeof file === "string" || !file.type || !allowedMimeTypes.includes(file.type)) {
    throw new Error("Invalid file type. Only PDF, JPEG, and PNG are allowed.");
  }

  // 3. Validate File Size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File too large. Maximum size is 5MB.");
  }

  const { databases, storage } = createAdminClient();

  // 1. Upload the file to Appwrite Storage
  const fileId = ID.unique();
  const uploadedFile = await storage.createFile(
    AUDIT_BUCKET_ID,
    fileId,
    file
  );

  // Register file deletion in rollback
  if (rollback) {
    rollback.add(() => storage.deleteFile(AUDIT_BUCKET_ID, uploadedFile.$id));
  }

  // 2. Generate the visual URL for the file
  const fileUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${AUDIT_BUCKET_ID}/files/${uploadedFile.$id}/view?project=${process.env.APPWRITE_PROJECT_ID}`;

  // 3. Create the document record in kycDocuments collection
  const documentData = {
    userId: userId,
    fileId: uploadedFile.$id,
    status: "PENDING",
    fileName: uploadedFile.name,
    uploadedAt: new Date().toISOString(),
    documentType: documentType,
    fileUrl: fileUrl,
    mimeType: uploadedFile.mimeType || file.type,
    fileSize: uploadedFile.sizeOriginal || file.size,
    kycApplicationId: kycApplicationId, // Link back to the specific application record
  };

  const kycDocument = await databases.createDocument(
    DATABASE_ID,
    COLLECTION_ID_KYC_DOCUMENTS,
    ID.unique(),
    documentData
  );

  // Register document record deletion in rollback
  if (rollback) {
    rollback.add(() => databases.deleteDocument(DATABASE_ID, COLLECTION_ID_KYC_DOCUMENTS, kycDocument.$id));
  }

  return {
    success: true,
    document: kycDocument,
    file: uploadedFile
  };
}
