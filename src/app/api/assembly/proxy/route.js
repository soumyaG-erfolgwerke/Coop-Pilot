import { DATABASE_ID, COLLECTION_ID_ASSEMBLIES, COLLECTION_ID_ASSEMBLY_PROXIES, createAdminClient, COLLECTION_ID_ASSEMBLY_ATTENDANCE } from "@/lib/appwrite-server";
import { getAuthenticatedProfile } from "@/lib/helpers/_helpers";
import { Query } from "appwrite";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { ID } from "node-appwrite";

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
        proxyPassword: proxy.proxyPassword,
        proxyLink: proxy.proxyLink,
        submittedAt: proxy.submittedAt,
        expiresAt: proxy.expiresAt,
        createdAt: proxy.$createdAt,
      },
    });
  } catch (error) {
    console.error("GET_PROXY_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch proxy",
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
      assemblyTitle,
      ownerEmail,
      ownerName,
      ownerUserId,
      proxyHolderUserId,
      proxyHolderName,
      proxyHolderEmail,
      scope,
      status,
      proxyUserId,
      proxyPassword,
      proxyLink,
      submittedAt,
      expiresAt,
    } = body;


    if (!assemblyId || !proxyHolderUserId) {
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

    const proxy = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLY_PROXIES,
      ID.unique(),
      {
        assemblyId,
        assemblyTitle,
        ownerUserId: user.userId,
        ownerName: user.name,
        ownerEmail: user.email,
        proxyHolderUserId,
        proxyHolderName,
        proxyHolderEmail,
        scope,
        status,
        proxyUserId,
        // proxyPassword: hashedPassword,
        proxyPassword,
        proxyLink,
        submittedAt,
        expiresAt,
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
      proxy,
    });
  } catch (error) {
    console.error("CREATE_PROXY_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create proxy",
      },
      {
        status: 500,
      },
    );
  }
}
