import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { successResponse, errorResponse } from "@/lib/api-response";
import { User } from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    // Attempt connection
    const db = await connectToDatabase();

    // Perform a lightweight check, e.g. getting the count of users (or simply pinging)
    // The connection instance gives us access to mongoose connection states
    const isConnected = db.connection.readyState === 1;

    if (!isConnected) {
      return errorResponse("Database is not fully connected", 500);
    }

    // Optional: a quick model query just to verify models are registered and reachable
    const count = await User.countDocuments();

    return successResponse(
      { status: "connected", userCount: count },
      "MongoDB connected successfully"
    );
  } catch (error: any) {
    console.error("[TestDBRoute] Error connecting to MongoDB:", error);
    return errorResponse(
      "Failed to connect to MongoDB",
      500,
      { details: error.message }
    );
  }
}
