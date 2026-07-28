import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_ASSEMBLIES,
} from "@/lib/appwrite-server";

const { databases } = createAdminClient();

export async function updateQuorum(assemblyId, quorumValue, isQuorumMet) {
  try {
    if (!assemblyId) {
      throw new Error("assemblyId is required");
    }
    if (
      typeof quorumValue !== "number" ||
      quorumValue < 0 ||
      quorumValue > 100
    ) {
      throw new Error("Invalid quorum percentage");
    }

    // console.log(quorumValue, isQuorumMet);
    const updatedQuorumDocument = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLIES,
      assemblyId,
      {
        quorum: quorumValue,
        quorumMet: isQuorumMet,
      },
    );

    return updatedQuorumDocument;
  } catch (error) {
    console.error("Error updating quorum settings:", error);
    // throw new Error(error.message || "Failed to update quorum settings");
  }
}
