import { NextResponse } from "next/server";
import { updateQuorum } from "@/lib/helpers/_quorumHelpers";
import { requireAssemblyAdmin } from "@/lib/auth/assembly-access";
import { sessionErrorResponse } from "@/lib/auth/session";
import { safePublicError } from "@/lib/api/safe-public-error";

export async function PUT(request, { params }) {
  try {
    const { assemblyId } = await params;
    const { quorumValue, isQuorumMet } = await request.json();
    // console.log("AssemblyId:", assemblyId, "QuorumValue:", quorumValue, "IsQuorumMet:", isQuorumMet);
    if (!assemblyId) {
      return NextResponse.json(
        { success: false, error: "assemblyId is required" },
        { status: 400 },
      );
    }
    await requireAssemblyAdmin(assemblyId);
    if (
      typeof quorumValue !== "number" ||
      quorumValue < 0 ||
      quorumValue > 100
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid quorum percentage" },
        { status: 400 },
      );
    }

    const updatedQuorumDocument = await updateQuorum(assemblyId, quorumValue, isQuorumMet);
    // // console.log("Updated:", updatedQuorumDocument);

    return NextResponse.json(
      {
        success: true,
        updatedQuorum: updatedQuorumDocument,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { success: false, error: safePublicError(error, "Failed to calculate quorum") },
      { status: 500 },
    );
  }
}
