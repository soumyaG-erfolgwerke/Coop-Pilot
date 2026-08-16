import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { createPublicClient } from "@/lib/appwrite-server";
import { verifyCaptcha } from "@/lib/helpers/captchaHelper";

export async function POST(request) {
  try {
    const { name, email, password, captchaToken } = await request.json();

    if (
      typeof name !== "string" || !name.trim() || name.length > 160 ||
      typeof email !== "string" || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email) ||
      typeof password !== "string" || password.length < 12 || password.length > 128
    ) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV === "production") {
      if (!captchaToken || !(await verifyCaptcha(captchaToken))) {
        return NextResponse.json({ error: "Captcha verification failed" }, { status: 400 });
      }
    }

    const { account } = createPublicClient();

    // Create the user account
    const newUser = await account.create(ID.unique(), email.trim(), password, name.trim());

    return NextResponse.json({ 
      success: true, 
      userId: newUser.$id 
    });
  } catch (error) {
    console.error("Registration failed", { code: error?.code, type: error?.type });
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 400 }
    );
  }
}
