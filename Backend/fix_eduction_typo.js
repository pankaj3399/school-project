// Comprehensive script to fix "EDUCTION" typo to "EDUCATION" everywhere in database
import mongoose from 'mongoose';
import PointsHistory from './models/PointsHistory.js';
import FormSubmissions from './models/FormSubmissions.js';
import Form from './models/Form.js';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

const fixEductionTypoEverywhere = async () => {
  try {
    console.log('🔧 FIXING "EDUCTION" TYPO TO "EDUCATION" EVERYWHERE...\n');

    let totalUpdated = 0;

    // 1. Fix PointsHistory collection - formType field
    console.log('1. Checking PointsHistory collection (formType field)...');
    const pointsHistoryRecords = await PointsHistory.find({
      formType: { $regex: /INDIVIDUALIZED EDUCTION PLAN/i }
    });

    console.log(`   Found ${pointsHistoryRecords.length} records with "EDUCTION" typo`);

    if (pointsHistoryRecords.length > 0) {
      const pointsHistoryUpdate = await PointsHistory.updateMany(
        { formType: { $regex: /INDIVIDUALIZED EDUCTION PLAN/i } },
        { $set: { formType: 'AWARD POINTS WITH INDIVIDUALIZED EDUCATION PLAN (IEP)' } }
      );
      console.log(`   ✅ Updated ${pointsHistoryUpdate.modifiedCount} PointsHistory records`);
      totalUpdated += pointsHistoryUpdate.modifiedCount;
    }

    // 2. Fix FormSubmissions collection - formType field
    console.log('\n2. Checking FormSubmissions collection (formType field)...');
    const formSubmissionsRecords = await FormSubmissions.find({
      formType: { $regex: /INDIVIDUALIZED EDUCTION PLAN/i }
    });

    console.log(`   Found ${formSubmissionsRecords.length} records with "EDUCTION" typo`);

    if (formSubmissionsRecords.length > 0) {
      const formSubmissionsUpdate = await FormSubmissions.updateMany(
        { formType: { $regex: /INDIVIDUALIZED EDUCTION PLAN/i } },
        { $set: { formType: 'AWARD POINTS WITH INDIVIDUALIZED EDUCATION PLAN (IEP)' } }
      );
      console.log(`   ✅ Updated ${formSubmissionsUpdate.modifiedCount} FormSubmissions records`);
      totalUpdated += formSubmissionsUpdate.modifiedCount;
    }

    // 3. Fix Form collection - name field
    console.log('\n3. Checking Form collection (name field)...');
    const formNameRecords = await Form.find({
      name: { $regex: /INDIVIDUALIZED EDUCTION PLAN/i }
    });

    console.log(`   Found ${formNameRecords.length} forms with "EDUCTION" typo in name`);

    if (formNameRecords.length > 0) {
      const formNameUpdate = await Form.updateMany(
        { name: { $regex: /INDIVIDUALIZED EDUCTION PLAN/i } },
        [{ $set: { name: { $replaceAll: { input: "$name", find: "EDUCTION", replacement: "EDUCATION" } } } }]
      );
      console.log(`   ✅ Updated ${formNameUpdate.modifiedCount} Form names`);
      totalUpdated += formNameUpdate.modifiedCount;
    }

    // 4. Fix Form collection - description field
    console.log('\n4. Checking Form collection (description field)...');
    const formDescRecords = await Form.find({
      description: { $regex: /INDIVIDUALIZED EDUCTION PLAN/i }
    });

    console.log(`   Found ${formDescRecords.length} forms with "EDUCTION" typo in description`);

    if (formDescRecords.length > 0) {
      const formDescUpdate = await Form.updateMany(
        { description: { $regex: /INDIVIDUALIZED EDUCTION PLAN/i } },
        [{ $set: { description: { $replaceAll: { input: "$description", find: "EDUCTION", replacement: "EDUCATION" } } } }]
      );
      console.log(`   ✅ Updated ${formDescUpdate.modifiedCount} Form descriptions`);
      totalUpdated += formDescUpdate.modifiedCount;
    }

    // 5. Check completed - main collections fixed

    // Final verification
    console.log('\n🔍 FINAL VERIFICATION...');

    const remainingPointsHistory = await PointsHistory.find({
      formType: { $regex: /INDIVIDUALIZED EDUCTION PLAN/i }
    });

    const remainingFormSubmissions = await FormSubmissions.find({
      formType: { $regex: /INDIVIDUALIZED EDUCTION PLAN/i }
    });

    const remainingForms = await Form.find({
      $or: [
        { name: { $regex: /INDIVIDUALIZED EDUCTION PLAN/i } },
        { description: { $regex: /INDIVIDUALIZED EDUCTION PLAN/i } }
      ]
    });

    console.log(`Records still with "EDUCTION" typo:`);
    console.log(`  - PointsHistory: ${remainingPointsHistory.length}`);
    console.log(`  - FormSubmissions: ${remainingFormSubmissions.length}`);
    console.log(`  - Forms: ${remainingForms.length}`);

    console.log(`\n🎉 SUMMARY:`);
    console.log(`Total records updated: ${totalUpdated}`);

    if (remainingPointsHistory.length === 0 && remainingFormSubmissions.length === 0 && remainingForms.length === 0) {
      console.log('✅ All "EDUCTION" typos have been successfully fixed to "EDUCATION"!');
    } else {
      console.log('❌ Some records may still have the "EDUCTION" typo - manual review needed');
    }

  } catch (error) {
    console.error('❌ Error during comprehensive fix:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database disconnected');
  }
};

// Run the comprehensive fix script
(async () => {
  await connectDB();
  await fixEductionTypoEverywhere();
})();