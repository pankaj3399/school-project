// COMPREHENSIVE script to fix ALL "EDUCTION" typos to "EDUCATION" in database
// This checks EVERY possible field in EVERY collection
import mongoose from 'mongoose';
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

const fixAllTypos = async () => {
  try {
    console.log('🔧 COMPREHENSIVE TYPO FIX: "EDUCTION" → "EDUCATION"\n');
    console.log('Checking ALL collections and ALL fields...\n');

    let totalUpdated = 0;
    const db = mongoose.connection.db;

    // 1. PointsHistory collection - formType field
    console.log('1. PointsHistory.formType');
    const ph1 = await db.collection('pointshistories').updateMany(
      { formType: /EDUCTION/i },
      { $set: { formType: 'AWARD POINTS WITH INDIVIDUALIZED EDUCATION PLAN (IEP)' } }
    );
    console.log(`   Updated: ${ph1.modifiedCount}`);
    totalUpdated += ph1.modifiedCount;

    // 2. PointsHistory collection - formName field
    console.log('2. PointsHistory.formName');
    const ph2 = await db.collection('pointshistories').updateMany(
      { formName: /EDUCTION/i },
      [{ $set: { formName: { $replaceAll: { input: "$formName", find: "EDUCTION", replacement: "EDUCATION" } } } }]
    );
    console.log(`   Updated: ${ph2.modifiedCount}`);
    totalUpdated += ph2.modifiedCount;

    // 3. Forms collection - formType field (THE KEY ONE!)
    console.log('3. Forms.formType');
    const f1 = await db.collection('forms').updateMany(
      { formType: /EDUCTION/i },
      { $set: { formType: 'AWARD POINTS WITH INDIVIDUALIZED EDUCATION PLAN (IEP)' } }
    );
    console.log(`   Updated: ${f1.modifiedCount}`);
    totalUpdated += f1.modifiedCount;

    // 4. Forms collection - formName field
    console.log('4. Forms.formName');
    const f2 = await db.collection('forms').updateMany(
      { formName: /EDUCTION/i },
      [{ $set: { formName: { $replaceAll: { input: "$formName", find: "EDUCTION", replacement: "EDUCATION" } } } }]
    );
    console.log(`   Updated: ${f2.modifiedCount}`);
    totalUpdated += f2.modifiedCount;

    // 5. Forms collection - name field
    console.log('5. Forms.name');
    const f3 = await db.collection('forms').updateMany(
      { name: /EDUCTION/i },
      [{ $set: { name: { $replaceAll: { input: "$name", find: "EDUCTION", replacement: "EDUCATION" } } } }]
    );
    console.log(`   Updated: ${f3.modifiedCount}`);
    totalUpdated += f3.modifiedCount;

    // 6. Forms collection - description field
    console.log('6. Forms.description');
    const f4 = await db.collection('forms').updateMany(
      { description: /EDUCTION/i },
      [{ $set: { description: { $replaceAll: { input: "$description", find: "EDUCTION", replacement: "EDUCATION" } } } }]
    );
    console.log(`   Updated: ${f4.modifiedCount}`);
    totalUpdated += f4.modifiedCount;

    // 7. FormSubmissions collection - formType field
    console.log('7. FormSubmissions.formType');
    const fs1 = await db.collection('formsubmissions').updateMany(
      { formType: /EDUCTION/i },
      { $set: { formType: 'AWARD POINTS WITH INDIVIDUALIZED EDUCATION PLAN (IEP)' } }
    );
    console.log(`   Updated: ${fs1.modifiedCount}`);
    totalUpdated += fs1.modifiedCount;

    // Final verification - check if ANY typos remain
    console.log('\n🔍 FINAL VERIFICATION...');

    const remaining = await db.collection('pointshistories').countDocuments({
      $or: [
        { formType: /EDUCTION/i },
        { formName: /EDUCTION/i }
      ]
    });

    const remainingForms = await db.collection('forms').countDocuments({
      $or: [
        { formType: /EDUCTION/i },
        { formName: /EDUCTION/i },
        { name: /EDUCTION/i },
        { description: /EDUCTION/i }
      ]
    });

    const remainingSubmissions = await db.collection('formsubmissions').countDocuments({
      formType: /EDUCTION/i
    });

    console.log(`Remaining typos:`);
    console.log(`  - PointsHistory: ${remaining}`);
    console.log(`  - Forms: ${remainingForms}`);
    console.log(`  - FormSubmissions: ${remainingSubmissions}`);

    console.log(`\n🎉 SUMMARY:`);
    console.log(`Total records updated: ${totalUpdated}`);

    if (remaining === 0 && remainingForms === 0 && remainingSubmissions === 0) {
      console.log('✅ SUCCESS! All "EDUCTION" typos fixed to "EDUCATION"!');
    } else {
      console.log('⚠️  WARNING! Some typos may remain - manual review needed');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database disconnected');
  }
};

// Run it
(async () => {
  await connectDB();
  await fixAllTypos();
})();
