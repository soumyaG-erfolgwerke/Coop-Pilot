import { NextResponse } from "next/server";

import { Query } from "node-appwrite";

import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_COOPERATIVES,
} from "@/lib/appwrite-server";

export async function POST(request) {
  try {
    const body = await request.json();

    const { registryNumber } = body;

    if (!registryNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Registry number is required",
        },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();

    const existingCoop = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      [Query.equal("RegNumber", registryNumber)],
    );

    if (existingCoop.documents.length > 0) {
      const coop = existingCoop.documents[0];

      return NextResponse.json({
        success: true,
        exists: true,

        coop: {
          name: coop.name,

          adminEmail: coop.admins?.[0] || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      exists: false,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to check cooperative",
      },
      { status: 500 },
    );
  }
}
