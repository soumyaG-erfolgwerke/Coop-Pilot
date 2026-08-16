import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_ASSEMBLY_ATTENDANCE,
  COLLECTION_ID_ASSEMBLY_PROXIES,
} from "@/lib/appwrite-server";

import { Query } from "node-appwrite";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("proxy-session");

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { success: false, proxy: null },
        { status: 401 },
      );
    }

    const sessionToken = sessionCookie.value;
    const { databases } = createAdminClient();

    const attendanceResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLY_ATTENDANCE,
      [
        Query.equal("proxySessionToken", sessionToken),
        Query.equal("proxyLoggedIn", true),
        Query.limit(1),
      ],
    );

    const attendance = attendanceResult.documents[0];

    if (!attendance) {
      return NextResponse.json(
        { success: false, proxy: null },
        { status: 401 },
      );
    }

    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const currentIpRaw = forwarded?.split(",")[0]?.trim() || "unknown";
    const currentIp = currentIpRaw === "::1" ? "127.0.0.1" : currentIpRaw;

    if (attendance.proxyIpAddress !== currentIp) {
      return NextResponse.json(
        { success: false, error: "Invalid proxy session" },
        { status: 403 },
      );
    }

    const proxyResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLY_PROXIES,
      [Query.equal("$id", attendance.proxyTableId), Query.limit(1)],
    );

    const proxy = proxyResult.documents[0];

    if (!proxy) {
      return NextResponse.json(
        { success: false, proxy: null },
        { status: 401 },
      );
    }
    if (
      proxy.status === "revoked" ||
      (proxy.expiresAt && new Date(proxy.expiresAt) <= new Date())
    ) {
      return NextResponse.json(
        { success: false, proxy: null, error: "Proxy session expired" },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,

      proxy: {
        id: proxy.$id,
        assemblyId: proxy.assemblyId,
        assemblyTitle: proxy.assemblyTitle,
        proxyHolderName: proxy.proxyHolderName,
        ownerUserId: proxy.ownerUserId,
        ownerName: proxy.ownerName,
        proxyHolderUserId: proxy.proxyHolderUserId,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Session validation failed",
      },
      { status: 500 },
    );
  }
}
