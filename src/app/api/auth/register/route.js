import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite-server";

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    const { account } = createAdminClient();

    // Create the user account
    const newUser = await account.create(ID.unique(), email, password, name);

    return NextResponse.json({ 
      success: true, 
      userId: newUser.$id 
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Registration failed" },
      { status: 400 }
    );
  }
}
