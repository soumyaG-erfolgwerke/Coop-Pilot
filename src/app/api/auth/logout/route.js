import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();

    // Clear the session cookie
    cookieStore.delete("appwrite-session");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    // Still clear the cookie even if something fails
    const cookieStore = await cookies();
    cookieStore.delete("appwrite-session");
    
    return NextResponse.json({ success: true });
  }
}
