import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from 'dotenv';
import Admin from "./models/Admin.js"; // This model maps to the 'users' collection
import { Role } from "./enum.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw Error("No MONGO_URI specified in environment variables");
    }

    // Connect to the database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing Admins using the User model (Admin.js)
    // IMPORTANT: This deletes ALL users with Role.Admin if you only want to clear admins. 
    
    // Check if admin exists first to avoid duplicate errors
    // Ensure email is lowercase and trimmed to match schema expectations
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase().trim();
    const existingAdmin = await Admin.findOne({ email: adminEmail });

    if (existingAdmin) {
        console.log(`[SEED] Admin ${adminEmail} already exists. Updating password...`);
        const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
        const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);
        existingAdmin.password = hashedAdminPassword;
        existingAdmin.approved = true;
        
        // Ensure role is correct if it was somehow changed
        if (existingAdmin.role !== Role.Admin) {
             console.log(`[SEED] Updating role from ${existingAdmin.role} to ${Role.Admin}`);
             existingAdmin.role = Role.Admin;
        }
        
        await existingAdmin.save();
        console.log(`[SEED] Admin ${adminEmail} updated successfully with role: ${existingAdmin.role}`);
    } else {
        console.log(`[SEED] Creating new admin with email: ${adminEmail}...`);
        const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
        const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);
        
        const admin = await Admin.create({
          role: Role.Admin,
          name: "System Admin",
          email: adminEmail,
          password: hashedAdminPassword,
          approved: true
        });
        console.log(`[SEED] Created admin: ${admin.email} with role: ${admin.role}`);
    }

    console.log("[SEED] Admin seeding completed successfully!");
    await mongoose.disconnect();
    process.exit(0);

  } catch (err) {
    console.error("SEED_ERROR: ", err);
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    process.exit(1);
  }
};

seedAdmin();
