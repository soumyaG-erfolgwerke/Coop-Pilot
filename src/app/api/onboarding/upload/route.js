import { NextResponse } from "next/server";

import {
  AUDIT_BUCKET_ID,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";

import { ID } from "node-appwrite";

import { InputFile } from "node-appwrite/file";

export async function POST(request) {
  const { storage, databases } = createAdminClient();

  try {
    const formData = await request.formData();

    const file = formData.get("file");

    const metaRaw = formData.get("meta");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "No valid file uploaded",
          },
        },
        {
          status: 400,
        },
      );
    }

    if (!metaRaw) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Missing metadata",
          },
        },
        {
          status: 400,
        },
      );
    }

    let meta;

    try {
      meta = JSON.parse(metaRaw);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Invalid metadata JSON",
          },
        },
        {
          status: 400,
        },
      );
    }

    const MAX_SIZE = 25 * 1024 * 1024;

    const ALLOWED_TYPES = [
      "application/pdf",

      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (file.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Empty file not allowed",
          },
        },
        {
          status: 400,
        },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `${file.name} exceeds 25MB`,
          },
        },
        {
          status: 400,
        },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `${file.name} type not allowed`,
          },
        },
        {
          status: 400,
        },
      );
    }

    // FILE BUFFER

    const arrayBuffer = await file.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);

    // UPLOAD TO SAME BUCKET

    const uploadedFile = await storage.createFile(
      AUDIT_BUCKET_ID,

      ID.unique(),

      InputFile.fromBuffer(buffer, file.name),
    );

    // TEMP ONBOARDING DOC

    const onboardingDoc = await databases.createDocument(
      DATABASE_ID,

      process.env.NEXT_PUBLIC_COLLECTION_ID_ONBOARDING_DOCS,

      ID.unique(),

      {
        type: "SATZUNG",

        fileId: uploadedFile.$id,

        fileName: file.name,

        fileSize: file.size,

        mimeType: file.type,

        onboardingEmail: meta.email || "",

        uploadedAt: new Date(),

        isUsed: false,
      },
    );

    return NextResponse.json({
      success: true,

      data: onboardingDoc,
    });
  } catch (error) {
    console.error("Onboarding upload failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || "Upload failed",
        },
      },
      {
        status: 500,
      },
    );
  }
}
