import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { User } from "../src/models/User";
import { USER_ROLES } from "../src/constants/database";

// Load .env.local
dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in .env.local");
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log("Connected to MongoDB");

    // Clear existing users for a fresh seed
    await User.deleteMany({});
    console.log("Cleared existing users");

    const users = [
      {
        name: "Alice Employee",
        email: "employee@atomquest.com",
        password: "password123", // In a real app, this would be hashed
        role: USER_ROLES.EMPLOYEE,
        designation: "Software Engineer",
      },
      {
        name: "Bob Manager",
        email: "manager@atomquest.com",
        password: "password123",
        role: USER_ROLES.MANAGER,
        designation: "Engineering Manager",
      },
      {
        name: "Charlie Admin",
        email: "admin@atomquest.com",
        password: "password123",
        role: USER_ROLES.ADMIN,
        designation: "System Administrator",
      },
    ];

    await User.insertMany(users);
    console.log("Successfully seeded 3 users!");
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
