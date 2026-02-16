/**
 * End-to-end test script for:
 *  1. PDF Individual Report email (genreport endpoint)
 *  2. Withdrawal notification email (emailGenerator with PointWithdraw form)
 *
 * This bypasses the HTTP layer and calls the actual controller/service logic directly,
 * simulating what happens when a SchoolAdmin triggers these actions.
 */

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';
import School from './models/School.js';
import Student from './models/Student.js';
import Teacher from './models/Teacher.js';
import Form from './models/Form.js';
import { generateStudentPDF } from './utils/generatePDF.js';
import { reportEmailGenerator, emailGenerator } from './utils/emailHelper.js';
import { FormType, Role } from './enum.js';
import { timezoneManager } from './utils/luxon.js';

dotenv.config();

const TEST_EMAILS = ['shridmishra00@gmail.com', 'shridbot@gmail.com'];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  // ── 1. Find a SchoolAdmin and their school ──
  const admin = await Admin.findOne({ role: Role.SchoolAdmin });
  if (!admin) {
    console.error('❌ No SchoolAdmin found in the database. Cannot test.');
    process.exit(1);
  }
  console.log(`SchoolAdmin: ${admin.name} (${admin.email})`);

  const school = await School.findOne({ createdBy: admin._id }).populate('createdBy');
  if (!school) {
    console.error('❌ No school found for this admin.');
    process.exit(1);
  }
  console.log(`School: ${school.name} (TZ: ${school.timeZone || 'UTC+0'})`);

  // ── 2. Find a student in this school ──
  const student = await Student.findOne({ schoolId: school._id });
  if (!student) {
    console.error('❌ No students in this school. Cannot test.');
    process.exit(1);
  }
  console.log(`Student: ${student.name} (${student.email}), grade ${student.grade}`);
  console.log(`  isStudentEmailVerified: ${student.isStudentEmailVerified}`);
  console.log(`  points: ${student.points}`);

  // ── 3. Generate a JWT token for this admin (simulates login) ──
  const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  console.log(`\n🔑 Generated JWT token for SchoolAdmin\n`);

  // ══════════════════════════════════════════════
  // TEST 1: Individual PDF Report
  // ══════════════════════════════════════════════
  console.log('═══════════════════════════════════════');
  console.log('  TEST 1: Individual PDF Report Email');
  console.log('═══════════════════════════════════════');

  try {
    const teacher = await Teacher.findOne({ schoolId: school._id }) || admin;
    
    const studentData = {
      studentInfo: {
        _id: student._id,
        name: student.name,
        email: student.email,
        grade: student.grade,
        parentEmail: student.parentEmail || '',
        standard: student.standard || ''
      },
      totalPoints: {
        eToken: student.points || 0,
        oopsies: 0,
        withdraw: 0
      },
      feedback: [],
      data: []
    };

    const schoolData = {
      school: {
        name: school.name,
        logo: school.logo || '',
        timeZone: school.timeZone || 'UTC+0',
        createdBy: { email: admin.email }
      }
    };

    const teacherData = { name: teacher.name || admin.name };

    console.log('Generating PDF...');
    const pdfBuffer = await generateStudentPDF({
      studentData,
      schoolData,
      teacherData,
      barChartImage: null
    });
    console.log(`✅ PDF generated (${pdfBuffer.length} bytes)`);

    const tz = school.timeZone || 'UTC+0';
    const formattedDate = timezoneManager.formatForSchool(new Date(), tz, 'MMMM dd, yyyy');

    for (const email of TEST_EMAILS) {
      console.log(`\nSending report to ${email}...`);
      await reportEmailGenerator(
        pdfBuffer,
        `Etoken Report-${student.name}-As Of ${formattedDate}.pdf`,
        email,
        { stdData: studentData, schData: schoolData, tchData: teacherData }
      );
      console.log(`✅ Report email sent to ${email}`);
    }
  } catch (err) {
    console.error('❌ TEST 1 FAILED:', err.message);
    console.error(err.stack);
  }

  // ══════════════════════════════════════════════
  // TEST 2: Withdrawal Email Notification
  // ══════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════');
  console.log('  TEST 2: Withdrawal Email Notification');
  console.log('═══════════════════════════════════════');

  try {
    // Build a mock PointWithdraw form object with all email flags on
    const mockWithdrawForm = {
      formType: FormType.PointWithdraw,
      studentEmail: true,
      teacherEmail: true,
      schoolAdminEmail: true,
      parentEmail: true
    };

    console.log(`\nCalling emailGenerator for PointWithdraw...`);
    console.log(`  Admin role passed as teacher: ${admin.role}`);
    console.log(`  Student isStudentEmailVerified: ${student.isStudentEmailVerified}`);

    const result = await emailGenerator(mockWithdrawForm, {
      points: -5,
      submission: { _id: 'test' },
      submittedAt: new Date().toISOString(),
      teacher: admin,       // SchoolAdmin acts as teacher
      student: student,
      schoolAdmin: admin,
      school: school,
      leadTeacher: null
    });

    console.log(`\n📊 Email Generator Result:`);
    console.log(`  Total queued:  ${result.total}`);
    console.log(`  Successful:    ${result.successful}`);
    console.log(`  Failed:        ${result.failed}`);
    if (result.total === 0) {
      console.log('\n⚠️  WARNING: 0 emails were queued! Conditions may still be failing.');
      console.log('   Check the [EMAIL GENERATOR] logs above to see which conditions failed.');
    } else if (result.failed > 0) {
      console.log('\n⚠️  Some emails failed:');
      result.errors.forEach(e => console.log(`    - ${JSON.stringify(e)}`));
    } else {
      console.log('\n✅ All withdrawal emails sent successfully!');
    }
  } catch (err) {
    console.error('❌ TEST 2 FAILED:', err.message);
    console.error(err.stack);
  }

  // ══════════════════════════════════════════════
  // TEST 3: Route Authorization Check
  // ══════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════');
  console.log('  TEST 3: Route Authorization Check');
  console.log('═══════════════════════════════════════');

  // Simulate the middleware check
  const allowedRoles = [Role.SchoolAdmin, Role.Admin];
  const adminRole = admin.role;
  const passes = allowedRoles.includes(adminRole);
  console.log(`  Admin role: "${adminRole}"`);
  console.log(`  Allowed roles for genreport: ${JSON.stringify(allowedRoles)}`);
  console.log(`  Would pass authorizeRoles check: ${passes ? '✅ YES' : '❌ NO'}`);

  console.log('\n═══════════════════════════════════════');
  console.log('  ALL TESTS COMPLETE');
  console.log('═══════════════════════════════════════');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
