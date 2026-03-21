import mongoose from 'mongoose';
import dotenv from 'dotenv';
import School from './models/School.js';
import District from './models/District.js';
import Admin from './models/Admin.js';
import { Role } from './enum.js';

dotenv.config();

export const runMigration = async () => {
  try {
    // 1. Find all schools without districtId
    const orphanedSchools = await School.find({ 
      $or: [
        { districtId: { $exists: false } },
        { districtId: null }
      ]
    });

    if (orphanedSchools.length === 0) {
      return;
    }

    console.log(`[Migration] Found ${orphanedSchools.length} orphaned schools.`);

    // 2. Find or create a "Legacy Schools" district
    let legacyDistrict = await District.findOne({ code: 'LEG' });
    
    if (!legacyDistrict) {
      console.log('[Migration] Creating legacy district...');
      // Use the first system admin as creator if possible
      const admin = await Admin.findOne({ role: Role.Admin });
      
      legacyDistrict = await District.create({
        name: "Legacy Schools (Unassigned)",
        code: "LEG",
        state: "N/A",
        country: "USA",
        subscriptionStatus: 'active',
        createdBy: admin?._id
      });
      console.log('[Migration] Created legacy district:', legacyDistrict.name);
    }

    // 3. Assign schools to this district
    let updatedCount = 0;
    for (const school of orphanedSchools) {
      school.districtId = legacyDistrict._id;
      school.district = legacyDistrict.name; // Maintain legacy field if needed
      await school.save();
      updatedCount++;
    }

    console.log(`[Migration] Migration completed. ${updatedCount} schools assigned to district: ${legacyDistrict.name}`);
  } catch (err) {
    console.error('[Migration] Migration failed:', err);
  }
};

// Only run immediately if this file is executed directly (not imported)
if (process.argv[1] && process.argv[1].endsWith('migrateLegacySchools.js')) {
  mongoose.connect(process.env.MONGO_URI).then(() => {
    runMigration().then(() => mongoose.disconnect());
  });
}
