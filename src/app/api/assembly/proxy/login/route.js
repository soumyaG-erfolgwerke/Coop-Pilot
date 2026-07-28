import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextResponse } from "next/server";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_ASSEMBLY_PROXIES,
  COLLECTION_ID_ASSEMBLY_ATTENDANCE,
} from "@/lib/appwrite-server";
import { Query } from "node-appwrite";
import { verifyCaptcha } from "@/lib/helpers/captchaHelper";

export async function POST(request) {
  try {
    const body = await request.json();
    const { proxyUserId, proxyPassword, assemblyId, captchaToken } = body;

    if (!proxyUserId || !proxyPassword || !assemblyId) {
      return NextResponse.json(
        { success: false, error: "Missing credentials" },
        { status: 400 },
      );
    }

    if (!captchaToken && process.env.NEXT_PUBLIC_NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Captcha token is required" },
        { status: 400 },
      );
    }

    if (process.env.NEXT_PUBLIC_NODE_ENV === "production") {
      const ok = await verifyCaptcha(captchaToken);
      console.log("Captcha verification result:", ok);
      if (!ok) {
        return NextResponse.json({ error: "Captcha failed" }, { status: 400 });
      }
    }

    const { databases } = createAdminClient();

    // Find proxy record
    const proxyResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLY_PROXIES,
      [
        Query.equal("proxyUserId", proxyUserId),
        Query.equal("assemblyId", assemblyId),
        Query.limit(1),
      ],
    );

    const proxy = proxyResult.documents[0];

    // proxy validation
    if (!proxy) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const now = new Date();
    if (proxy.expiresAt && new Date(proxy.expiresAt) < now) {
      return NextResponse.json(
        { success: false, error: "Proxy access expired" },
        { status: 403 },
      );
    }

    let passwordValid = false;

    if (proxy.proxyPassword?.startsWith("$2")) {
      passwordValid = await bcrypt.compare(proxyPassword, proxy.proxyPassword);
    } else {
      passwordValid = proxy.proxyPassword === proxyPassword;
    }

    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Find attendance
    const attendanceResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLY_ATTENDANCE,
      [Query.equal("proxyTableId", proxy.$id), Query.limit(1)],
    );
    const attendance = attendanceResult.documents[0];

    if (!attendance) {
      return NextResponse.json(
        { success: false, error: "Attendance record not found" },
        { status: 404 },
      );
    }

    // get ip
    const forwarded = request.headers.get("x-forwarded-for");
    const currentIpRaw =
      forwarded?.split(",")[0]?.trim() || request.ip || "unknown";
    const currentIp = currentIpRaw === "::1" ? "127.0.0.1" : currentIpRaw;

    // check existing session
    if (attendance.proxyLoggedIn && attendance.proxySessionToken) {
      if (attendance.proxyIpAddress !== currentIp) {
        return NextResponse.json(
          {
            success: false,
            error: "Proxy already active on another device/network",
          },
          { status: 403 },
        );
      }

      const existingResponse = NextResponse.json({
        success: true,
        proxy: {
          id: proxy.$id,
          assemblyId: proxy.assemblyId,
          assemblyTitle: proxy.assemblyTitle,
          proxyHolderName: proxy.proxyHolderName,
          proxyHolderEmail: proxy.proxyHolderEmail,
          scope: proxy.scope,
          status: proxy.status,
          loginIp: currentIp,
        },
      });

      existingResponse.cookies.set(
        "proxy-session",
        attendance.proxySessionToken,
        {
          httpOnly: true,
          secure: process.env.NEXT_PUBLIC_NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 6,
        },
      );

      return existingResponse;
    }

    const sessionToken = crypto.randomUUID();

    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLY_ATTENDANCE,
      attendance.$id,
      {
        proxyIpAddress: currentIp,
        proxyLoggedIn: true,
        proxyLoginAt: new Date().toISOString(),
        proxySessionToken: sessionToken,
      },
    );

    const response = NextResponse.json({
      success: true,
      proxy: {
        id: proxy.$id,
        assemblyId: proxy.assemblyId,
        assemblyTitle: proxy.assemblyTitle,
        proxyHolderName: proxy.proxyHolderName,
        proxyHolderEmail: proxy.proxyHolderEmail,
        scope: proxy.scope,
        status: proxy.status,
        loginIp: currentIp,
      },
    });

    response.cookies.set("proxy-session", sessionToken, {
      httpOnly: true,
      secure: process.env.NEXT_PUBLIC_NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 6,
    });

    return response;
  } catch (error) {
    console.error("PROXY_LOGIN_ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Proxy login failed" },
      { status: 500 },
    );
  }
}
