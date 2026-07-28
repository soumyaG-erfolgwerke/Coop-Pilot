import { getCoopById } from "@/lib/helpers/_helpers";
import { NextResponse } from "next/server";

export const GET = async (request, { params }) => {
  try {
    const { id } = await params;
    // console.log("Received coop ID:", id);
    const coopsData = await getCoopById(id);
    // console.log("coopsData", coopsData);
    return NextResponse.json(
      {
        total: coopsData ? 1 : 0,
        coop: coopsData,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching coop data by IDs:", error);
    return NextResponse.json(
      { error: "Failed to fetch coop data" },
      { status: 500 },
    );
  }
};
