import { COLLECTION_ID_COOPERATIVES, DATABASE_ID } from "@/lib/appwrite-server";
import { resForbidden, resNotFound } from "@/lib/reports/utils/errors";

const assertCoopAdmin = async ({ databases, coopId, userEmail }) => {
  let coopDoc;

  try {
    coopDoc = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId,
    );
  } catch (error) {
    if (error?.code === 404) {
      throw resNotFound();
    }
    throw error;
  }

  const admins = Array.isArray(coopDoc?.admins) ? coopDoc.admins : [];

  if (!admins.includes(userEmail)) {
    throw resForbidden();
  }

  return coopDoc;
};

export { assertCoopAdmin };
