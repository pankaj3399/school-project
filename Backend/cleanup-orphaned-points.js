import mongoose from 'mongoose';
import PointsHistory from './models/PointsHistory.js';
import Student from './models/Student.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

// SAFETY FLAGS - SET TO TRUE ONLY WHEN YOU'RE READY TO ACTUALLY DELETE
const DRY_RUN = true; // Change to false to actually delete data
const REQUIRE_CONFIRMATION = true; // Change to false to skip confirmation

// Logging functions
const log = (message) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
};

const logError = (message, error) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message}`, error);
};

const logWarning = (message) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] WARNING: ${message}`);
};

const logSuccess = (message) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✅ SUCCESS: ${message}`);
};

// Function to wait for user confirmation
const waitForConfirmation = () => {
    return new Promise((resolve) => {
        if (!REQUIRE_CONFIRMATION) {
            resolve(true);
            return;
        }

        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('⚠️  Are you sure you want to proceed with deleting orphaned points history? Type "YES" to confirm: ', (answer) => {
            rl.close();
            resolve(answer === 'YES');
        });
    });
};

// Main cleanup function
async function cleanupOrphanedPointsHistory() {
    let connection = null;

    try {
        log('🚀 Starting orphaned points history cleanup script');
        log(`🔧 Configuration: DRY_RUN=${DRY_RUN}, REQUIRE_CONFIRMATION=${REQUIRE_CONFIRMATION}`);

        if (DRY_RUN) {
            logWarning('DRY RUN MODE - No data will actually be deleted');
        }

        // Connect to MongoDB
        log('📡 Connecting to MongoDB...');
        connection = await mongoose.connect(MONGO_URI);
        logSuccess('Connected to MongoDB successfully');

        // Step 1: Get all existing student IDs
        log('👥 Fetching all existing student IDs...');
        const existingStudents = await Student.find({}, { _id: 1 }).lean();
        const existingStudentIds = new Set(existingStudents.map(student => student._id.toString()));
        log(`Found ${existingStudentIds.size} existing students in the database`);

        // Step 2: Get all unique student IDs from points history
        log('📊 Fetching all unique student IDs from points history...');
        const pointsHistoryStudentIds = await PointsHistory.distinct('submittedForId');
        log(`Found ${pointsHistoryStudentIds.length} unique student IDs in points history`);

        // Step 3: Find orphaned points history (points for students that no longer exist)
        log('🔍 Identifying orphaned points history records...');
        const orphanedStudentIds = [];
        const orphanedRecordsInfo = [];

        for (const studentId of pointsHistoryStudentIds) {
            if (!existingStudentIds.has(studentId.toString())) {
                orphanedStudentIds.push(studentId);

                // Get detailed info about orphaned records
                const orphanedRecords = await PointsHistory.find({ submittedForId: studentId }).lean();
                const totalPoints = orphanedRecords.reduce((sum, record) => sum + (record.points || 0), 0);

                orphanedRecordsInfo.push({
                    studentId: studentId.toString(),
                    recordCount: orphanedRecords.length,
                    totalPoints: totalPoints,
                    dateRange: {
                        earliest: orphanedRecords.length > 0 ? new Date(Math.min(...orphanedRecords.map(r => new Date(r.submittedAt)))) : null,
                        latest: orphanedRecords.length > 0 ? new Date(Math.max(...orphanedRecords.map(r => new Date(r.submittedAt)))) : null
                    }
                });
            }
        }

        // Step 4: Display summary
        log('📋 CLEANUP SUMMARY:');
        log(`   • Total existing students: ${existingStudentIds.size}`);
        log(`   • Student IDs in points history: ${pointsHistoryStudentIds.length}`);
        log(`   • Orphaned student IDs found: ${orphanedStudentIds.length}`);

        if (orphanedStudentIds.length === 0) {
            logSuccess('No orphaned points history found! Database is clean.');
            return;
        }

        // Display detailed info about orphaned records
        logWarning(`Found ${orphanedStudentIds.length} orphaned student IDs with points history:`);

        let totalOrphanedRecords = 0;
        for (const info of orphanedRecordsInfo) {
            totalOrphanedRecords += info.recordCount;
            log(`   📌 Student ID: ${info.studentId}`);
            log(`      - Records: ${info.recordCount}`);
            log(`      - Total Points: ${info.totalPoints}`);
            log(`      - Date Range: ${info.dateRange.earliest?.toISOString()} to ${info.dateRange.latest?.toISOString()}`);
        }

        log(`💥 Total orphaned records to be deleted: ${totalOrphanedRecords}`);

        if (DRY_RUN) {
            logWarning('DRY RUN: No data was actually deleted. To perform the cleanup:');
            logWarning('1. Set DRY_RUN = false in the script');
            logWarning('2. Optionally set REQUIRE_CONFIRMATION = false to skip confirmation');
            logWarning('3. Run the script again');
            return;
        }

        // Step 5: Confirmation (if not dry run)
        log('⚠️  You are about to DELETE orphaned points history records');
        const confirmed = await waitForConfirmation();

        if (!confirmed) {
            log('❌ Operation cancelled by user');
            return;
        }

        // Step 6: Perform cleanup
        log('🗑️  Starting deletion of orphaned points history...');

        let totalDeleted = 0;
        for (const studentId of orphanedStudentIds) {
            try {
                log(`Deleting points history for student ID: ${studentId}`);
                const deleteResult = await PointsHistory.deleteMany({ submittedForId: studentId });
                totalDeleted += deleteResult.deletedCount;
                logSuccess(`Deleted ${deleteResult.deletedCount} records for student ${studentId}`);
            } catch (error) {
                logError(`Failed to delete records for student ${studentId}`, error);
            }
        }

        // Step 7: Final verification
        log('🔍 Performing final verification...');
        const remainingOrphanedRecords = await PointsHistory.countDocuments({
            submittedForId: { $in: orphanedStudentIds }
        });

        if (remainingOrphanedRecords === 0) {
            logSuccess(`🎉 Cleanup completed successfully! Deleted ${totalDeleted} orphaned points history records.`);
        } else {
            logWarning(`⚠️  Cleanup completed but ${remainingOrphanedRecords} orphaned records still remain. Manual review may be needed.`);
        }

    } catch (error) {
        logError('Script failed with error', error);
        throw error;
    } finally {
        if (connection) {
            log('🔌 Closing database connection...');
            await mongoose.connection.close();
            logSuccess('Database connection closed');
        }
    }
}

// Run the script
cleanupOrphanedPointsHistory()
    .then(() => {
        log('📋 Script execution completed');
        process.exit(0);
    })
    .catch((error) => {
        logError('Script execution failed', error);
        process.exit(1);
    });