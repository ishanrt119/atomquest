import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );

    // Delete the HTTP-Only cookie
    response.cookies.delete("auth_token");

    return response;
  } catch (error) {
    console.error("[Logout API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during logout." },
      { status: 500 }
    );
  }
}
