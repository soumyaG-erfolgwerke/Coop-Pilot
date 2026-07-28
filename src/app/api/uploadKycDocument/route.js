import { uploadKycDocument } from "@/lib/kycDocumentService";
import { addKycApplication } from "@/lib/addMemberKyc";
import { createRollbackManager } from "@/lib/rollbackService";
import { NextResponse } from "next/server";

/**
 * POST /api/uploadKycDocument
 * Dedicated endpoint for uploading KYC documents with transaction safety (Rollback).
 * 
 * Flow: Upload File → Create Doc Record → Create KYC Application
 * If ANY step fails, all previous steps are automatically undone (LIFO).
 */
export async function POST(request) {
  const rollback = createRollbackManager();
  
  try {
    const formData = await request.formData();
    const userId = formData.get("userId");
    const file = formData.get("file");
    const documentType = formData.get("documentType");
    const coopId = formData.get("coopId");

    if (!userId || !file || !documentType) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: userId, file, or documentType" },
        { status: 400 }
      );
    }

    // 1. Create a NEW KYC Application entry
    // We do this first to get an ID for the document to link back to
    const kycApp = await addKycApplication(userId, rollback, coopId);
    
    // 2. Upload file to storage + create document record
    // Pass the kycApp.$id so the document record can link back to it
    await uploadKycDocument(userId, file, documentType, rollback, kycApp.$id);

    return NextResponse.json({
      success: true,
      message: "KYC document uploaded and new application record created successfully",
    });

  } catch (error) {
    console.error("KYC Upload API Error (Triggering Rollback):", error);
    
    // Execute rollback — LIFO order ensures:
    // If addKycApplication failed → delete doc record → delete file (nothing orphaned)
    // If uploadKycDocument failed at DB step → delete file (nothing orphaned)
    // If uploadKycDocument failed at upload step → nothing to clean (stack is empty)
    await rollback.execute();

    return NextResponse.json(
      { success: false, error: error.message || "Failed to process KYC document resubmission" },
      { status: 500 }
    );
  }
}
