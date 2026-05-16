import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { USER_ROLES } from "@/constants/database";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    await connectToDatabase();

    // Avoid accidental duplicate seeding if users already exist (optional, but requested by prompt)
    // Here we will clear the exact 3 seed users or just clear all
    await User.deleteMany({ email: { $in: [
      "employee@atomquest.com",
      "manager@atomquest.com",
      "admin@atomquest.com"
    ]}});

    // Seed Data
    const users = [
      {
        name: "Rahul Sharma",
        email: "employee@atomquest.com",
        password: "Employee@123", // Will be hashed by pre-save hook
        role: USER_ROLES.EMPLOYEE,
        designation: "Software Engineer",
      },
      {
        name: "Priya Mehta",
        email: "manager@atomquest.com",
        password: "Manager@123",
        role: USER_ROLES.MANAGER,
        designation: "Engineering Manager",
      },
      {
        name: "Ishan Toraskar",
        email: "admin@atomquest.com",
        password: "Admin@123",
        role: USER_ROLES.ADMIN,
        designation: "System Administrator",
      },
    ];

    // Using create() instead of insertMany() to ensure pre-save hooks (bcrypt hashing) trigger
    await User.create(users);

    return successResponse(null, "Seed users created successfully.");
  } catch (error: any) {
    console.error("[SeedUsers] Error:", error);
    return errorResponse("Failed to seed users", 500, { error: error.message });
  }
}
