import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_COOPERATIVES,
} from "@/lib/appwrite-server";

const placeholderColors = [
  "2ECC71",
  "3498DB",
  "E74C3C",
  "9B59B6",
  "F1C40F",
  "1ABC9C",
  "E67E22",
];

const defaultDescription =
  "[Company Name] is a forward-thinking organization committed to delivering innovative solutions across industries. We specialize in providing cutting-edge services and products that empower businesses to grow, adapt, and thrive in a rapidly evolving marketplace. Our dedicated team of professionals combines deep industry expertise with a passion for excellence, ensuring measurable impact and long-term success for our clients.At [Company Name], we believe in fostering a culture of integrity, collaboration, and continuous improvement. Our vision is to be a trusted partner for organizations worldwide, driving transformation through technology, strategy, and sustainable practices.";

// GET /api/coop-services/active - Get all active cooperatives
export async function GET() {
  try {
    const { databases } = createAdminClient();

    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      [Query.limit(100)],
    );

    const formattedCoops = response.documents
      .filter((doc) => doc.status === "active")
      .map((doc) => {
        const randomColor =
          placeholderColors[
            Math.floor(Math.random() * placeholderColors.length)
          ];
        return {
          id: doc.$id,
          name: doc.name,
          sector: doc.sector,
          state: doc.state,
          status: doc.status,
          country: doc.country,
          regNumber: doc.RegNumber,
          CourtName: doc.CourtName,
          sharePrice: doc.sharePrice,
          banner: doc.bannerUrl,
          logo:
            doc.logo ||
            `https://placehold.co/40x40/${randomColor}/FFFFFF?text=${doc.name.charAt(0).toUpperCase()}`,
          description: doc.about || defaultDescription,
          auditStatus: doc.auditStatus,
          iban: doc.ibanNumber || null,
          bic: doc.bicNumber || null,
          ibanNumber: doc.ibanNumber || null,
          bicNumber: doc.bicNumber || null,
          isLive: doc.isLive ?? doc.make_live ?? false,
          make_live: doc.isLive ?? doc.make_live ?? false,
        };
      })
      .reverse();

    return NextResponse.json({ success: true, coops: formattedCoops });
  } catch (error) {
    console.error("Failed to fetch active cooperatives:", error);
    return NextResponse.json({ success: false, coops: [] }, { status: 500 });
  }
}
