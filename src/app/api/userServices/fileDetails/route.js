import { COLLECTION_ID_KYC, createAdminClient, DATABASE_ID } from "@/lib/appwrite-server";
import { Query } from "node-appwrite";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                { error: "userId is required" },
                { status: 400 }
            );
        }

        const { databases, users } = createAdminClient();

        // Check if the user actually exist.
        let user;
        try {
            user = await users.get(userId);
        } catch (err) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Fetch the file of the user.
        const file = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID_KYC,
            [Query.equal("userId", userId)]
        );

        return NextResponse.json(
            file.documents.map((doc) => ({
                id: doc.$id,
                userId: doc.userId,
                fileId: doc.fileId,
                fileName: doc.fileName,
                fileUrl: doc.fileUrl,
                status: doc.status,
                fileSize: doc.fileSize,
                mimeType: doc.mimeType,
                documentType: doc.documentType,
                uploadedAt: doc.uploadedAt,
            }))
            );

    } catch (error) {
        console.error("Error fetching files:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}