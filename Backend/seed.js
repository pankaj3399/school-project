import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from 'dotenv';
import Admin from "./models/Admin.js";
import School from "./models/School.js";
import Teacher from "./models/Teacher.js";
import Student from "./models/Student.js";
import Form from "./models/Form.js";
import FormSubmissions from "./models/FormSubmissions.js";
import PointsHistory from "./models/PointsHistory.js";
import District from "./models/District.js"; // Added District
import { Role, FormType, QuestionType } from "./enum.js";

dotenv.config();

// Helper function to generate random names
const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Susan", "Richard", "Jessica", "Joseph", "Sarah", "Thomas", "Karen", "Charles", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley", "Steven", "Kimberly", "Andrew", "Emily", "Paul", "Donna", "Joshua", "Michelle", "Kenneth", "Carol", "Kevin", "Amanda", "Brian", "Dorothy", "George", "Melissa", "Edward", "Deborah", "Ronald", "Stephanie"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"];

const getRandomName = () => {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last}`;
};

const getRandomEmail = (name) => {
  const cleanName = name.replace(/\s/g, '').toLowerCase();
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${cleanName}${Math.floor(Math.random() * 1000)}@${domain}`;
};

const getRandomSubject = () => {
  const subjects = ["Mathematics", "English", "Science", "History", "Geography", "Art", "Music", "Physical Education", "Computer Science", "Chemistry", "Physics", "Biology", "Economics", "Spanish", "French", "German", "Psychology", "Sociology"];
  return subjects[Math.floor(Math.random() * subjects.length)];
};

// Use only valid grade values that match what teachers can have
const getRandomTeacherGrade = () => {
  const grades = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  return grades[Math.floor(Math.random() * grades.length)];
};

const getRandomPoints = () => {
  return Math.floor(Math.random() * 1000) + 100;
};

const generateRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Create a seed function that creates all the data
const seed = async () => {
  // Validate environment variables first
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment");
    process.exit(1);
  }

  try {
    if (!process.env.MONGO_URI) {
      throw Error("No MONGO_URI specified in environment variables");
    }

    // Connect to the database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    console.log("Cleaning database...");
    await Admin.deleteMany({});
    await School.deleteMany({});
    await Teacher.deleteMany({});
    await Student.deleteMany({});
    await Form.deleteMany({});
    await FormSubmissions.deleteMany({});
    await PointsHistory.deleteMany({});
    await District.deleteMany({});
    console.log("Cleared existing data");

    const systemAdminEmail = process.env.ADMIN_EMAIL;
    const commonPassword = process.env.ADMIN_PASSWORD;

    const hashedPwd = await bcrypt.hash(commonPassword, 12);

    // 1. Create System Admin
    const systemAdmin = await Admin.create({
      role: Role.SystemAdmin,
      name: "System Admin",
      email: systemAdminEmail,
      password: hashedPwd,
      approved: true
    });
    console.log("Created System Admin:", systemAdmin.email);

    // 2. Create District
    const district = await District.create({
      name: "Horizon Unified School District",
      code: "HUSD-101",
      address: "456 Education Way",
      city: "Learning City",
      state: "CA",
      zipCode: "90210",
      subscriptionStatus: 'active',
      createdBy: systemAdmin._id
    });
    console.log("Created District:", district.name);

    // 3. Create District Admin
    const districtAdmin = await Admin.create({
      role: Role.Admin,
      name: "District Manager",
      email: "dist-admin@gmail.com",
      password: hashedPwd,
      districtId: district._id,
      approved: true
    });
    console.log("Created District Admin:", districtAdmin.email);

    // 4. Create School
    const school = await School.create({
      name: "Innovation Academy",
      logo: "https://res.cloudinary.com/dcjfbilhy/image/upload/v1745166530/dpzsysj1cf5pnnslebdx.png",
      address: "789 Future Lane",
      district: district.name,
      districtId: district._id,
      state: "CA",
      country: "United States",
      timeZone: "America/Los_Angeles",
      domain: "innovation.edu",
      createdBy: districtAdmin._id
    });
    console.log("Created School:", school.name);

    // 5. Create School Admin
    const schoolAdmin = await Admin.create({
      role: Role.SchoolAdmin,
      name: "School Principal",
      email: "admin@gmail.com",
      password: hashedPwd,
      schoolId: school._id,
      districtId: district._id,
      approved: true
    });
    console.log("Created School Admin:", schoolAdmin.email);
    
    // Update school creator to be the school admin
    school.createdBy = schoolAdmin._id;
    await school.save();

    // 6. Create Teachers (15)
    console.log("Seeding Teachers...");
    const teachers = [];
    const teacherGrades = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    
    for (let i = 0; i < 15; i++) {
      const teacherName = getRandomName();
      const teacherEmail = getRandomEmail(teacherName);
      const grade = teacherGrades[i % teacherGrades.length];
      
      const teacher = await Teacher.create({
        name: teacherName,
        email: teacherEmail,
        password: hashedPwd,
        role: Role.Teacher,
        subject: getRandomSubject(),
        schoolId: school._id,
        type: "Lead",
        grade: grade,
        isEmailVerified: true,
        recieveMails: true
      });
      teachers.push(teacher);
    }
    console.log(`Created ${teachers.length} teachers`);

    // 7. Create Students (50)
    console.log("Seeding Students...");
    const students = [];
    for (let i = 0; i < 50; i++) {
      const studentName = getRandomName();
      const grade = teacherGrades[i % teacherGrades.length];
      
      const student = await Student.create({
        name: studentName,
        email: getRandomEmail(studentName),
        password: hashedPwd,
        role: Role.Student,
        points: getRandomPoints(),
        parentEmail: getRandomEmail("parent_" + studentName),
        sendNotifications: true,
        schoolId: school._id,
        grade: grade,
        isParentOneEmailVerified: true,
        isStudentEmailVerified: true
      });
      students.push(student);
    }
    console.log(`Created ${students.length} students`);

    // 8. Create Forms
    console.log("Seeding Forms...");
    const formTypes = Object.values(FormType);
    const forms = [];

    for (const type of formTypes.slice(0, 3)) {
      const form = await Form.create({
        formName: `${type} Form`,
        formType: type,
        schoolId: school._id,
        questions: [{
          id: `q_${Date.now()}`,
          text: `Performance for ${type}`,
          type: QuestionType.Number,
          isCompulsory: true,
          maxPoints: 50
        }],
        isSpecial: true
      });
      forms.push(form);
    }

    // 9. Create some history
    console.log("Seeding Points History...");
    for (let i = 0; i < 30; i++) {
      const form = forms[i % forms.length];
      const teacher = teachers[i % teachers.length];
      const student = students[i % students.length];
      
      await PointsHistory.create({
        formId: form._id,
        formType: form.formType,
        formName: form.formName,
        submittedById: teacher._id,
        submittedByName: teacher.name,
        submittedForId: student._id,
        submittedForName: student.name,
        points: 10,
        schoolId: school._id,
        submittedAt: generateRandomDate(new Date(2025, 0, 1), new Date())
      });
    }

    console.log("\n================================================");
    console.log("🎉 SEEDING COMPLETED SUCCESSFULLY! 🎉");
    console.log("All data reset and reseeded.");
    console.log("================================================\n");

    process.exit(0);

  } catch (err) {
    console.error("❌ SEEDING FAILED:", err);
    process.exit(1);
  }
};

seed();
