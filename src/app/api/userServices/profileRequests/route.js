import {
  AUDIT_BUCKET_ID,
  COLLECTION_ID_PROFILE,
  COLLECTION_ID_PROFILE_UPDATE_REQUESTS,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { NextResponse } from "next/server";
import { Query, ID } from "node-appwrite";

export async function GET(req) {
  try {
    const { databases } = createAdminClient();

    const { searchParams } = new URL(req.url);

    const userId = searchParams.get("userId");
    const isAdmin = searchParams.get("admin");

    let queries = [Query.orderDesc("$createdAt")];

    if (!isAdmin) {
      if (!userId) {
        return NextResponse.json(
          {
            success: false,
            error: "userId required",
          },
          { status: 400 },
        );
      }

      queries.push(Query.equal("userId", userId));
    }

    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE_UPDATE_REQUESTS,
      queries,
    );

    // attach profile data in batch

    const profileIds = [
      ...new Set(
        res.documents
          .map((doc) => doc.profileId?.$id || doc.profileId)
          .filter(Boolean),
      ),
    ];

    const profilesMap = {};

    if (profileIds.length > 0) {
      try {
        const profilesRes = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID_PROFILE,
          [Query.equal("$id", profileIds)],
        );

        profilesRes.documents.forEach((profile) => {
          profilesMap[profile.$id] = profile;
        });
      } catch (err) {
        console.error("Failed to fetch profiles:", err);
      }
    }

    const requests = res.documents.map((doc) => {
      const profileId = doc.profileId?.$id || doc.profileId;

      return {
        ...doc,
        currentProfile: profilesMap[profileId] || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: requests,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 },
    );
  }
}

// POST - Create new profile update request
export async function POST(req) {
  try {
    const { databases, storage } = createAdminClient();
    const formData = await req.formData();
    const userId = formData.get("userId");
    const requestedDataRaw = formData.get("requestedData");
    const description = formData.get("description");

    // Checking proper userId and updation data
    if (!userId || !requestedDataRaw) {
      return NextResponse.json(
        { success: false, error: "Missing userId or data" },
        { status: 400 },
      );
    }

    let requestedData;
    // request data format validating
    try {
      requestedData = JSON.parse(requestedDataRaw);
    } catch (e) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON format in requestedData" },
        { status: 400 },
      );
    }

    // Fetch user profile
    const profileRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [Query.equal("userId", userId)],
    );

    if (!profileRes.documents.length) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 },
      );
    }

    const profileDoc = profileRes.documents[0];
    // Only allowed editable fields
    const allowedFields = [
      "street",
      "houseNo",
      "add",
      "postalCode",
      "location",
      "telephoneNo",
    ];
    const filteredData = {};

    for (const key of allowedFields) {
      if (
        requestedData[key] !== undefined &&
        requestedData[key] !== null &&
        requestedData[key] !== ""
      ) {
        filteredData[key] = requestedData[key];
      }
    }

    if (!Object.keys(filteredData).length) {
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 },
      );
    }

    let uploadedFileId = null;
    // File validation checking
    const file = formData.get("documents");

    if (file && typeof file !== "string") {
      const MAX_SIZE = 10 * 1024 * 1024;
      const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: "Invalid file type" },
          { status: 400 },
        );
      }

      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { success: false, error: "File exceeds 10MB limit" },
          { status: 400 },
        );
      }

      // Upload file
      const uploaded = await storage.createFile(
        AUDIT_BUCKET_ID,
        ID.unique(),
        file,
      );
      uploadedFileId = uploaded.$id;
    }

    // Create request document
    try {
      const doc = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID_PROFILE_UPDATE_REQUESTS,
        ID.unique(),
        {
          userId,
          profileId: profileDoc.$id,
          requestedData: JSON.stringify(filteredData),
          description: description || "",
          documentId: uploadedFileId,
          status: "PENDING",
          createdAt: new Date().toISOString(),
        },
      );
      return NextResponse.json({ success: true, data: doc });
    } catch (dbError) {
      // rollback to delete the non-required file
      if (uploadedFileId) {
        try {
          await storage.deleteFile(AUDIT_BUCKET_ID, uploadedFileId);
        } catch (err) {
          console.error(err);
        }
      }
      throw dbError;
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}

// PATCH - Admin api to "APPROVE"/"REJECT" the request
export async function PATCH(req) {
  try {
    const body = await req.json();
    const { requestId, action, reason, adminId } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { success: false, error: "Missing requestId or action" },
        { status: 400 },
      );
    }

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();
    // fetch the request document
    const requestDoc = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_PROFILE_UPDATE_REQUESTS,
      requestId,
    );

    if (!requestDoc) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 },
      );
    }

    if (requestDoc.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: "Request already processed" },
        { status: 400 },
      );
    }

    const requestedData = JSON.parse(requestDoc.requestedData || "{}");

    //APPROVE request
    if (action === "APPROVE") {
      const targetProfileId = requestDoc.profileId?.$id || requestDoc.profileId;
      const currentProfile = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID_PROFILE,
        targetProfileId,
      );

      const rollbackData = {};
      Object.keys(requestedData).forEach((key) => {
        rollbackData[key] = currentProfile[key];
      });

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID_PROFILE,
        targetProfileId,
        requestedData,
      );

      try {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID_PROFILE_UPDATE_REQUESTS,
          requestId,
          {
            status: "APPROVED",
            reviewedAt: new Date().toISOString(),
            reviewedBy: adminId || "admin",
          },
        );
      } catch (statusUpdateError) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID_PROFILE,
          targetProfileId,
          rollbackData,
        );
        return NextResponse.json(
          {
            success: false,
            error: "Failed to finalize approval. Changes rolled back.",
          },
          { status: 500 },
        );
      }
    }

    //REJECT request
    if (action === "REJECT") {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID_PROFILE_UPDATE_REQUESTS,
        requestId,
        {
          status: "REJECTED",
          reason: reason || "",
          reviewedAt: new Date().toISOString(),
          reviewedBy: adminId || "admin",
        },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
