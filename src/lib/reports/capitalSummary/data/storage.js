import { createAdminClient, DATABASE_ID, COLLECTION_ID_COOP_REPORTS, REPORTS_BUCKET_ID } from "@/lib/appwrite-server";
import { getSecureFileUrl } from "@/lib/secureFileUrl";
import { listAllDocuments } from "@/lib/appwritePagination";
import { ID, Query, Permission, Role } from "node-appwrite";
import { InputFile } from "node-appwrite/file";

/**
 * Atomic Service: Takes a raw server memory buffer and uploads it directly to Appwrite.
 * Completely decoupled—it does not care if the buffer is a PDF, a CSV, or an image.
 *
 * @param {Object} args
 * @param {Buffer} args.buffer - The binary memory buffer to stream
 * @param {string} args.filename - The target file name (e.g., 'report.pdf')
 * @returns {Promise<{ fileId: string, fileUrl: string }>}
 */
export const uploadFileBuffer = async ({ buffer, filename }) => {
  if (!buffer) throw new Error("A binary file buffer is required for upload operations.");
  if (!filename) throw new Error("A target filename is required.");

  const { storage } = createAdminClient();
  const inputFile = InputFile.fromBuffer(buffer, filename);
  const targetFileId = ID.unique();

  const filePermissions = [
    Permission.read(Role.any()),
  ];

  const uploadedFile = await storage.createFile(
    REPORTS_BUCKET_ID,
    targetFileId,
    inputFile,
    filePermissions
  );

  const fileUrl = getSecureFileUrl(REPORTS_BUCKET_ID, uploadedFile.$id);

  return {
    fileId: uploadedFile.$id,
    fileUrl,
  };
};

export const storeReportFileRecord = async ({ databases, coopId, coopName, fiscalYear, generatedBy, pdfUrl, csvUrl }) => {
  const res = await databases.createDocument({
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_COOP_REPORTS,
    documentId: `${coopId}_FY${fiscalYear}`,
    data: {
      coopId: coopId,
      reportName: `${coopName} - Capital Summary (${fiscalYear})`,
      reportType: "CAPITAL_SUMMARY",
      fiscalYear: Number(fiscalYear),
      generatedBy: generatedBy,
      pdfUrl: pdfUrl,
      csvUrl: csvUrl,
    },
  });

  return res;
};

export const getReportFile = async ({ databases, coopId, fiscalYear }) => {
  try {
    const res = await databases.getDocument({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID_COOP_REPORTS,
      documentId: `${coopId}_FY${fiscalYear}`,
    });
    return res;
  } catch (error) {
    return null;
  }
};

export const getReportsListForCoop = async ({ databases, coopId }) => {
  const result = await listAllDocuments({
    databases,
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_COOP_REPORTS,
    queries: [
      Query.equal("coopId", coopId),
      Query.equal("reportType", "CAPITAL_SUMMARY"),
      Query.select(["$id", "fiscalYear", "reportName", "pdfUrl", "csvUrl", "generatedBy", "$createdAt"]),
    ],
    pageSize: 500,
  });

  return result;
};
