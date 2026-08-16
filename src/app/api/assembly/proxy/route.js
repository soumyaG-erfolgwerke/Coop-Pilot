import { DATABASE_ID, COLLECTION_ID_ASSEMBLIES, COLLECTION_ID_ASSEMBLY_PROXIES, createAdminClient, COLLECTION_ID_ASSEMBLY_ATTENDANCE, COLLECTION_ID_COOPXMEMBER, COLLECTION_ID_PROFILE } from "@/lib/appwrite-server";
import { getAuthenticatedProfile } from "@/lib/helpers/_helpers";
import { Query } from "node-appwrite";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { sessionErrorResponse } from "@/lib/auth/session";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const proxyId = searchParams.get("proxyId");

    if (!proxyId) {
      return NextResponse.json(
        { success: false, error: "proxyId is required" },
        { status: 400 },
      );
    }

    const user = await getAuthenticatedProfile();
    // if (!user) {
    //   return NextResponse.json(
    //     { success: false, error: "Unauthorized" },
    //     { status: 401 },
    //   );
    // }

    const { databases } = createAdminClient();

    const proxy = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLY_PROXIES,
      proxyId,
    );

    if (proxy.ownerUserId !== user.userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,

      proxy: {
        id: proxy.$id,
        assemblyId: proxy.assemblyId,
        assemblyTitle: proxy.assemblyTitle,
        ownerUserId: proxy.ownerUserId,
        ownerName: proxy.ownerName,
        ownerEmail: proxy.ownerEmail,
        proxyHolderUserId: proxy.proxyHolderUserId,
        proxyHolderName: proxy.proxyHolderName,
        proxyHolderEmail: proxy.proxyHolderEmail,
        scope: proxy.scope,
        status: proxy.status,
        proxyUserId: proxy.proxyUserId,
        proxyLink: proxy.proxyLink,
        submittedAt: proxy.submittedAt,
        expiresAt: proxy.expiresAt,
        createdAt: proxy.$createdAt,
      },
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403 || error?.message === "UNAUTHORIZED") {
      return sessionErrorResponse({ status: error?.status === 403 ? 403 : 401 });
    }
    console.error("GET_PROXY_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch proxy",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      assemblyId,
      ownerUserId,
      proxyHolderUserId,
      scope,
      proxyUserId,
      proxyPassword,
    } = body;


    if (
      !assemblyId ||
      !proxyHolderUserId ||
      typeof proxyUserId !== "string" ||
      proxyUserId.length < 6 ||
      proxyUserId.length > 100 ||
      typeof proxyPassword !== "string" ||
      proxyPassword.length < 8 ||
      proxyPassword.length > 128 ||
      !["FULL", "LIMITED"].includes(scope) ||
      proxyHolderUserId === ownerUserId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 },
      );
    }

    const user = await getAuthenticatedProfile();
    if (!user || user.userId !== ownerUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const hashedPassword = await bcrypt.hash(proxyPassword, 10);
    const { databases } = createAdminClient();

    const assembly = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLIES,
      assemblyId,
    );
    const attendanceResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLY_ATTENDANCE,
      [
        Query.equal("assemblyId", assemblyId),
        Query.equal("memberId", user.userId),
        Query.limit(1),
      ],
    );
    const attendance = attendanceResult.documents[0];
    if (!attendance || ["closed", "archived", "discarded"].includes(assembly.status)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const holderMembership = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_COOPXMEMBER,
      [
        Query.equal("coopId", assembly.coopId),
        Query.equal("userId", proxyHolderUserId),
        Query.equal("status", ["active", "noticegiven", "Active"]),
        Query.limit(1),
      ],
    );
    if (holderMembership.documents.length === 0) {
      return NextResponse.json({ success: false, error: "Proxy holder must be an active member" }, { status: 400 });
    }

    const holderProfiles = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [Query.equal("userId", proxyHolderUserId), Query.limit(1)],
    );
    const holderProfile = holderProfiles.documents[0];
    if (!holderProfile) {
      return NextResponse.json({ success: false, error: "Proxy holder profile not found" }, { status: 400 });
    }

    const duplicate = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLY_PROXIES,
      [
        Query.equal("assemblyId", assemblyId),
        Query.equal("ownerUserId", user.userId),
        Query.limit(10),
      ],
    );
    if (duplicate.documents.some((item) => item.status !== "revoked")) {
      return NextResponse.json({ success: false, error: "A proxy already exists for this assembly" }, { status: 409 });
    }

    const proxyHolderName = `${holderProfile.FirstName || ""} ${holderProfile.LastName || ""}`.trim();
    const proxyHolderEmail = holderProfile.contactEmail;
    const baseUrl = (process.env.DEPLOYMENT_URL || "https://monujesh-cooppilot.coopos.cloud").replace(/\/$/, "");
    const proxyLink = `${baseUrl}/${encodeURIComponent(assembly.coopId)}/assembly/${encodeURIComponent(assemblyId)}/proxy`;

    const proxy = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLY_PROXIES,
      ID.unique(),
      {
        assemblyId,
        assemblyTitle: assembly.title,
        ownerUserId: user.userId,
        ownerName: user.name,
        ownerEmail: user.email,
        proxyHolderUserId,
        proxyHolderName,
        proxyHolderEmail,
        scope,
        status: "active",
        proxyUserId,
        proxyPassword: hashedPassword,
        proxyLink,
        submittedAt: new Date().toISOString(),
        expiresAt: assembly.endDateTime,
      },
    );

    if (assemblyId) {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID_ASSEMBLIES,
        assemblyId,
        {
          hasProxy: true,
          proxyTableId: proxy.$id,
          scope,
        },
      );

      if (attendance) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID_ASSEMBLY_ATTENDANCE,
          attendance.$id,
          {
            proxyTableId: proxy.$id,
            proxyHolder: JSON.stringify({
              userId: proxyHolderUserId,
              name: proxyHolderName,
              email: proxyHolderEmail,
            }),
            status: "proxy",
            updatedAt: new Date().toISOString(),
          },
        );
      }

      const attendanceDocs = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_ASSEMBLY_ATTENDANCE,
        [Query.equal("assemblyId", assemblyId), Query.limit(500)],
      );

      const attendanceSummary = attendanceDocs.documents.reduce(
        (summary, row) => {
          const shares = Number(row.shares || 0);
          summary.totalMembers++;
          summary.totalShares += shares;

          if (row.status === "present") {
            summary.presentMembers++;
            summary.representedMembers++;
            summary.presentShares += shares;
            summary.representedShares += shares;
          }

          if (row.status === "proxy") {
            summary.proxyMembers++;
            summary.representedMembers++;
            summary.proxyShares += shares;
            summary.representedShares += shares;
          }

          return summary;
        },
        {
          totalMembers: 0,
          totalShares: 0,
          presentMembers: 0,
          proxyMembers: 0,
          representedMembers: 0,
          presentShares: 0,
          proxyShares: 0,
          representedShares: 0,
        },
      );

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID_ASSEMBLIES,
        assemblyId,
        {
          attendanceSummaryJson: JSON.stringify(attendanceSummary),
        },
      );
    }

    return NextResponse.json({
      success: true,
      proxy: {
        id: proxy.$id,
        assemblyId: proxy.assemblyId,
        proxyUserId: proxy.proxyUserId,
        proxyLink: proxy.proxyLink,
        expiresAt: proxy.expiresAt,
        status: proxy.status,
      },
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403 || error?.message === "UNAUTHORIZED") {
      return sessionErrorResponse({ status: error?.status === 403 ? 403 : 401 });
    }
    console.error("CREATE_PROXY_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create proxy",
      },
      {
        status: 500,
      },
    );
  }
}
