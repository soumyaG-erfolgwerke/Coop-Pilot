import { getCoopById, stripInternalFields } from "@/lib/helpers/_helpers";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { coopId } = await params;
    const coopData = await getCoopById(coopId);
    return NextResponse.json(
      {
        coop: stripInternalFields(coopData),
        success: true,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to load cooperative data:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load cooperative data" },
      { status: 500 },
    );
  }
}
