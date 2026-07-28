import {
  COLLECTION_ID_AUDIT_HISTORY,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { NextResponse } from "next/server";

const { databases } = createAdminClient();

export const PATCH = async (request, { params }) => {
  try {
    const { auditId } = await params;
    const { userEmail, status } = await request.json();

    const result = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_HISTORY,
      auditId,
      { isSubApproved: status, subReviewedBy: userEmail },
    );

    if (!result) {
      return NextResponse.json(
        { error: "Failed to update audit status" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      result,
      message: "Audit updated successfully",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch audit review" },
      { status: 500 },
    );
  }
};
