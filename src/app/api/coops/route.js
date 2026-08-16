import { NextResponse } from "next/server";
import { ID, Query, Permission, Role } from "node-appwrite";
import { createAdminClient, DATABASE_ID } from "@/lib/appwrite-server";
import { safePublicError } from "@/lib/api/safe-public-error";
import {
  requireRole,
  resolveSession,
  sessionErrorResponse,
} from "@/lib/auth/session";
import { boundedText, validateStrictObject } from "@/lib/validation/strict-object";

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
    const session = requireRole(await resolveSession(), ["superuser"]);
    const coopData = await request.json();
    const shape = validateStrictObject(
      coopData,
      ["name", "admins", "country", "state", "sector", "sharePrice", "court", "regNumber", "about", "logoUrl", "bannerUrl", "status"],
      { maxBytes: 32 * 1024 },
    );
    if (!shape.ok) return NextResponse.json({ error: shape.error }, { status: 400 });

    const name = boundedText(coopData.name, { min: 1, max: 200, required: true });
    const country = boundedText(coopData.country, { min: 1, max: 100, required: true });
    const state = boundedText(coopData.state, { min: 1, max: 100, required: true });
    const sector = boundedText(coopData.sector, { min: 1, max: 150, required: true });
    const sharePrice = Number(coopData.sharePrice);
    const status = coopData.status || "active";
    const adminValues = Array.isArray(coopData.admins) ? coopData.admins : null;

    if (
      !name || !country || !state || !sector ||
      !Number.isFinite(sharePrice) || sharePrice < 0 || sharePrice > 1_000_000_000 ||
      !adminValues || adminValues.length > 100 ||
      adminValues.some((email) => typeof email !== "string" || email.length > 254) ||
      !["active", "inactive"].includes(status)
    ) {
      return NextResponse.json({ error: "Invalid cooperative data" }, { status: 422 });
    }

    const { databases, storage } = createAdminClient();

    // Choose a random theme color
    const randomIndex = Math.floor(Math.random() * THEME_COLOR_PALETTE.length);
    const themeColor = THEME_COLOR_PALETTE[randomIndex];

    // Generate placeholder URLs if no files provided
    const logoUrl = boundedText(coopData.logoUrl, { max: 2048 }) || generateLogoPlaceholder(name, themeColor);
    const bannerUrl = boundedText(coopData.bannerUrl, { max: 2048 }) || generateBannerPlaceholder(name, themeColor);

    // Prepare admin emails
    const adminEmails = [...new Set([...adminValues.map((email) => email.trim().toLowerCase()), session.email].filter(Boolean))];

    const documentData = {
      name,
      admins: adminEmails,
      country,
      state,
      sector,
      sharePrice,
      memberIds: [],
      transactionIds: [],
      CourtName: boundedText(coopData.court, { max: 200 }) || "",
      RegNumber: boundedText(coopData.regNumber, { max: 100 }) || "",
      logo: logoUrl,
      bannerUrl: bannerUrl,
      status,
      about: boundedText(coopData.about, { max: 5000 }) || "",
      auditJson: "{}",
      auditStatus: "NOT_STARTED",
    };

    const newDocument = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      ID.unique(),
      documentData,
      [
        Permission.read(Role.user(session.userId)),
        Permission.update(Role.user(session.userId)),
        Permission.delete(Role.user(session.userId)),
      ]
    );

    return NextResponse.json(newDocument);
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      return sessionErrorResponse(error);
    }
    console.error("Failed to create cooperative:", error);
    return NextResponse.json(
      { error: safePublicError(error, "Failed to create cooperative") },
      { status: 500 }
    );
  }
}

// GET /api/coops - List cooperatives (optional, for future use)
export async function GET(request) {
  try {
    const session = await resolveSession();
    const { databases } = createAdminClient();
    const { searchParams } = new URL(request.url);
    
    const queries = [];
    const status = searchParams.get("status");
    if (status) {
      queries.push(Query.equal("status", status));
    }
    if (!['superuser', 'superadmin'].includes(session.role)) {
      if (!session.email) return NextResponse.json({ documents: [], total: 0 });
      queries.push(Query.equal("admins", session.email));
    }

    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      queries
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      return sessionErrorResponse(error);
    }
    console.error("Failed to list cooperatives:", error);
    return NextResponse.json(
      { error: safePublicError(error, "Failed to list cooperatives") },
      { status: 500 }
    );
  }
}
