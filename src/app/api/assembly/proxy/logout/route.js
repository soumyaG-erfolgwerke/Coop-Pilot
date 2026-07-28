import { cookies } from "next/headers";

import { NextResponse } from "next/server";

// logout proxy
export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("proxy-session");

    return NextResponse.json({
      success: true,

      message: "Proxy logged out successfully",
    });
  } catch (error) {
    console.error("PROXY_LOGOUT_ERROR:", error);

    return NextResponse.json(
      {
        success: false,

        error: error.message || "Logout failed",
      },
      {
        status: 500,
      },
    );
  }
}
