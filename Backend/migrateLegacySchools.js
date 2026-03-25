import mongoose from "mongoose";
import District from "./models/District.js";
import School from "./models/School.js";
import User from "./models/Admin.js";
import Migration from "./models/Migration.js";
import { Role } from "./enum.js";
import dotenv from "dotenv";

dotenv.config();

export const runMigration = async () => {
  const migrationName = "migrate-legacy-schools-to-district";

  try {
    // Check if migration already ran
    const existingMigration = await Migration.findOne({ name: migrationName });
    if (existingMigration) {
      console.log(`Migration "${migrationName}" already ran. Skipping.`);
      return;
    }

    console.log("Running legacy school migration...");

    // Find or create the legacy district
    let legacyDistrict = await District.findOne({ code: "LEG" });

    if (!legacyDistrict) {
      console.log("[Migration] Creating legacy district...");
      // Find a system admin to be the creator
      const systemAdmin = await User.findOne({ role: Role.SystemAdmin });

      legacyDistrict = await District.create({
        name: "Legacy Schools District",
        code: "LEG",
        state: "N/A",
        country: "USA",
        subscriptionStatus: "active",
        createdBy: systemAdmin ? systemAdmin._id : null,
      });
      console.log("[Migration] Created legacy district:", legacyDistrict.name);
    }

    // Find schools without a districtId
    const orphanedSchools = await School.find({
      $or: [{ districtId: { $exists: false } }, { districtId: null }],
    });

    if (orphanedSchools.length > 0) {
      const schoolIds = orphanedSchools.map((s) => s._id);

      // Bulk update schools
      await School.updateMany(
        { _id: { $in: schoolIds } },
        {
          $set: {
            districtId: legacyDistrict._id,
            district: legacyDistrict.name,
          },
        },
      );

      console.log(
        `Successfully migrated ${orphanedSchools.length} schools to legacy district.`,
      );
    } else {
      console.log("No orphaned schools found to migrate.");
    }

    // Record migration success
    await Migration.create({ name: migrationName });
    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }
};

mongoose
  .connect(process.env.MONGODB_URI || process.env.MONGO_URI)
  .then(async () => {
    await runMigration();
    await mongoose.disconnect();
  })
  .catch(async (err) => {
    console.error("Standalone migration failed:", err);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  });
// Standalone execution
if (import.meta.url === `file://${process.argv[1]}`) {
  mongoose
    .connect(process.env.MONGODB_URI || process.env.MONGO_URI)
    .then(async () => {
      await runMigration();
      await mongoose.disconnect();
    })
    .catch(async (err) => {
      console.error("Standalone migration failed:", err);
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      process.exit(1);
    });
}
