import { NextResponse } from "next/server";
import { ID, Query, Permission, Role } from "node-appwrite";
import { cookies } from "next/headers";
import { createAdminClient, DATABASE_ID } from "@/lib/appwrite-server";

const COLLECTION_ID_COOPERATIVES = "683f21190030cfd38fce";
const COOP_BUCKET_ID = "6918a3360027dc0888aa";

const THEME_COLOR_PALETTE = [
  "#D81B60", "#8E24AA", "#3949AB", "#1E88E5", "#00897B", "#43A047",
  "#FB8C00", "#F4511E", "#6D4C41", "#546E7A", "#d53f8c", "#276749",
];

const generateLogoPlaceholder = (name, hexColor) => {
  const initials = name.substring(0, 2).toUpperCase();
  const bgColor = hexColor.slice(1);
  return `https://placehold.co/200x200/${bgColor}/FFFFFF/png?text=${initials}`;
};

const generateBannerPlaceholder = (name, hexColor) => {
  const encodedName = encodeURIComponent(name);
  const bgColor = hexColor.slice(1);
  return `https://placehold.co/1200x675/${bgColor}/FFFFFF/png?text=${encodedName}`;
};

// POST /api/coops - Create a new cooperative
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("appwrite-session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionData = JSON.parse(sessionCookie.value);
    const coopData = await request.json();

    const { databases, storage } = createAdminClient();

    // Choose a random theme color
    const randomIndex = Math.floor(Math.random() * THEME_COLOR_PALETTE.length);
    const themeColor = THEME_COLOR_PALETTE[randomIndex];

    // Generate placeholder URLs if no files provided
    const logoUrl = coopData.logoUrl || generateLogoPlaceholder(coopData.name, themeColor);
    const bannerUrl = coopData.bannerUrl || generateBannerPlaceholder(coopData.name, themeColor);

    // Prepare admin emails
    const adminEmails = coopData.admins.includes(coopData.userEmail)
      ? coopData.admins
      : [...coopData.admins, coopData.userEmail];

    const documentData = {
      name: coopData.name,
      admins: adminEmails,
      country: coopData.country,
      state: coopData.state,
      sector: coopData.sector,
      sharePrice: parseFloat(coopData.sharePrice),
      memberIds: [],
      transactionIds: [],
      CourtName: coopData.court,
      RegNumber: coopData.regNumber,
      logo: logoUrl,
      bannerUrl: bannerUrl,
      status: coopData.status || "active",
      about: coopData.about,
      auditJson: "{}",
      auditStatus: "NOT_STARTED",
    };

    const newDocument = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      ID.unique(),
      documentData,
      [
        Permission.read(Role.any()),
        Permission.update(Role.user(sessionData.userId)),
        Permission.delete(Role.user(sessionData.userId)),
      ]
    );

    return NextResponse.json(newDocument);
  } catch (error) {
    console.error("Failed to create cooperative:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create cooperative" },
      { status: 500 }
    );
  }
}

// GET /api/coops - List cooperatives (optional, for future use)
export async function GET(request) {
  try {
    const { databases } = createAdminClient();
    const { searchParams } = new URL(request.url);
    
    const queries = [];
    const status = searchParams.get("status");
    if (status) {
      queries.push(Query.equal("status", status));
    }

    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      queries
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to list cooperatives:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list cooperatives" },
      { status: 500 }
    );
  }
}
