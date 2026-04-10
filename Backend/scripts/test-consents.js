import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from '../models/Student.js';
import School from '../models/School.js';
import { Role } from '../enum.js';

dotenv.config();

const testConsents = async () => {
  console.log('--- Starting Student Consents CLI Test ---');
  
  try {
    // 1. Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    // 2. Setup Mock School
    console.log('Creating mock school...');
    const school = await School.create({
      name: 'Test Academy ' + Date.now(),
      district: 'Test District',
      state: 'CA',
      country: 'USA'
    });
    console.log('Mock school created:', school._id);

    // 3. Setup Mock Student
    console.log('Creating mock student...');
    const testToken = 'test-token-' + Date.now();
    const student = await Student.create({
      name: 'Test Student',
      email: 'test-student-' + Date.now() + '@example.com',
      password: 'password123',
      role: Role.Student,
      parentEmail: 'parent@example.com',
      schoolId: school._id,
      grade: '5',
      guardianRegistrationToken: testToken,
      guardianRegistrationTokenExpires: new Date(Date.now() + 3600000) // 1 hour
    });
    console.log('Mock student created:', student._id);
    console.log('Registration Token:', testToken);

    // 4. Simulate completeGuardianRegistration logic
    console.log('\n--- Simulating Guardian Registration ---');
    const updatePayload = {
      marketingConsent: true,
      photoConsent: true,
      email: 'parent@example.com'
    };

    console.log('Payload:', updatePayload);

    // This block mimics the logic I added to authController.js
    const studentToUpdate = await Student.findOne({
      $or: [
        { parentEmail: updatePayload.email },
        { standard: updatePayload.email }
      ],
      guardianRegistrationToken: testToken
    });

    if (!studentToUpdate) {
      throw new Error('Student not found with token and email.');
    }

    console.log('Student found. Updating consents...');
    
    // Applying the logic from the controller
    if (studentToUpdate.parentEmail === updatePayload.email) {
      studentToUpdate.isParentOneEmailVerified = true;
    }
    
    studentToUpdate.marketingConsent = updatePayload.marketingConsent;
    studentToUpdate.photoConsent = updatePayload.photoConsent;
    
    await studentToUpdate.save();
    console.log('Student record saved.');

    // 5. Verification
    console.log('\n--- Verifying Results ---');
    const updatedStudent = await Student.findById(student._id);
    
    console.log('Marketing Consent (Expected: true):', updatedStudent.marketingConsent);
    console.log('Photo Consent (Expected: true):', updatedStudent.photoConsent);
    console.log('Parent verified (Expected: true):', updatedStudent.isParentOneEmailVerified);

    if (updatedStudent.marketingConsent === true && 
        updatedStudent.photoConsent === true && 
        updatedStudent.isParentOneEmailVerified === true) {
      console.log('\n✅ SUCCESS: Consents correctly saved to database!');
    } else {
      console.log('\n❌ FAILURE: Consent values do not match expected results.');
    }

    // 6. Cleanup
    console.log('\n--- Cleaning Up ---');
    await Student.findByIdAndDelete(student._id);
    await School.findByIdAndDelete(school._id);
    console.log('Test data removed.');

  } catch (error) {
    console.error('\n❌ ERROR DURING TEST:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    console.log('--- Test Finished ---');
  }
};

testConsents();
