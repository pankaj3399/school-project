// import mongoose from "mongoose";
// import bcrypt from "bcryptjs";
// import dotenv from 'dotenv';
// import Admin from "./models/Admin.js";
// import School from "./models/School.js";
// import Teacher from "./models/Teacher.js";
// import Student from "./models/Student.js";
// import Form from "./models/Form.js";
// import FormSubmissions from "./models/FormSubmissions.js";
// import PointsHistory from "./models/PointsHistory.js";
// import { Role, FormType, QuestionType, PointsType } from "./enum.js";

// dotenv.config();

// // Helper function to generate random names
// const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Susan", "Richard", "Jessica", "Joseph", "Sarah", "Thomas", "Karen", "Charles", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley", "Steven", "Kimberly", "Andrew", "Emily", "Paul", "Donna", "Joshua", "Michelle", "Kenneth", "Carol", "Kevin", "Amanda", "Brian", "Dorothy", "George", "Melissa", "Edward", "Deborah", "Ronald", "Stephanie"];
// const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"];

// const getRandomName = () => {
//   const first = firstNames[Math.floor(Math.random() * firstNames.length)];
//   const last = lastNames[Math.floor(Math.random() * lastNames.length)];
//   return `${first} ${last}`;
// };

// const getRandomEmail = (name) => {
//   const cleanName = name.replace(/\s/g, '').toLowerCase();
//   const domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"];
//   const domain = domains[Math.floor(Math.random() * domains.length)];
//   return `${cleanName}${Math.floor(Math.random() * 1000)}@${domain}`;
// };

// const getRandomSubject = () => {
//   const subjects = ["Mathematics", "English", "Science", "History", "Geography", "Art", "Music", "Physical Education", "Computer Science", "Chemistry", "Physics", "Biology", "Economics", "Spanish", "French", "German", "Psychology", "Sociology"];
//   return subjects[Math.floor(Math.random() * subjects.length)];
// };

// // Use only valid grade values that match what teachers can have
// const getRandomTeacherGrade = () => {
//   // Only using regular grades for teachers, not case managers or programs
//   const grades = [
//   // Regular grades
//   'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
  
//   // Case Managers
//   'Case Manager #1', 'Case Manager #2', 'Case Manager #3', 'Case Manager #4',
//   'Case Manager #5', 'Case Manager #6', 'Case Manager #7', 'Case Manager #8',
//   'Case Manager #9', 'Case Manager #10', 'Case Manager #11', 'Case Manager #12',
//   'Case Manager #13', 'Case Manager #14', 'Case Manager #15', 'Case Manager #16',
//   'Case Manager #17', 'Case Manager #18', 'Case Manager #19', 'Case Manager #20',
  
//   // Programs
//   'Program #1', 'Program #2', 'Program #3', 'Program #4', 'Program #5',
//   'Program #6', 'Program #7', 'Program #8', 'Program #9', 'Program #10',
//   'Program #11', 'Program #12', 'Program #13', 'Program #14', 'Program #15',
//   'Program #16', 'Program #17', 'Program #18', 'Program #19', 'Program #20',
  
//   // Centers and Special Programs
//   'AN Center #1', 'AN Center #2', 'AN Center #3', 'AN Center #4', 'AN Center #5',
//   'ASD #1', 'ASD #2', 'ASD #3', 'ASD #4', 'ASD #5',
//   'SSN #1', 'SSN #2', 'SSN #3', 'SSN #4', 'SSN #5'
// ]
//   return grades[Math.floor(Math.random() * grades.length)];
// };

// // For students we can use any of the grade values
// const getRandomStudentGrade = () => {
//   const grades = [
//     // Regular grades
//     'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
    
//     // Case Managers
//     'Case Manager #1', 'Case Manager #2', 'Case Manager #3', 'Case Manager #4',
//     'Case Manager #5', 'Case Manager #6', 'Case Manager #7', 'Case Manager #8',
//     'Case Manager #9', 'Case Manager #10', 'Case Manager #11', 'Case Manager #12',
//     'Case Manager #13', 'Case Manager #14', 'Case Manager #15', 'Case Manager #16',
//     'Case Manager #17', 'Case Manager #18', 'Case Manager #19', 'Case Manager #20',
    
//     // Programs
//     'Program #1', 'Program #2', 'Program #3', 'Program #4', 'Program #5',
//     'Program #6', 'Program #7', 'Program #8', 'Program #9', 'Program #10',
//     'Program #11', 'Program #12', 'Program #13', 'Program #14', 'Program #15',
//     'Program #16', 'Program #17', 'Program #18', 'Program #19', 'Program #20',
    
//     // Centers and Special Programs
//     'AN Center #1', 'AN Center #2', 'AN Center #3', 'AN Center #4', 'AN Center #5',
//     'ASD #1', 'ASD #2', 'ASD #3', 'ASD #4', 'ASD #5',
//     'SSN #1', 'SSN #2', 'SSN #3', 'SSN #4', 'SSN #5'
//   ];
//   return grades[Math.floor(Math.random() * grades.length)];
// };

// const getRandomPoints = () => {
//   return Math.floor(Math.random() * 1000) + 100;
// };

// const generateRandomDate = (start, end) => {
//   return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
// };

// // Create a seed function that creates all the data
// const seed = async () => {
//   try {
//     if (!process.env.MONGO_URI) {
//       throw Error("No MONGO_URI specified in environment variables");
//     }

//     // Connect to the database
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log("Connected to MongoDB");

//     // Clear existing data
//     await Admin.deleteMany({});
//     await School.deleteMany({});
//     await Teacher.deleteMany({});
//     await Student.deleteMany({});
//     await Form.deleteMany({});
//     await FormSubmissions.deleteMany({});
//     await PointsHistory.deleteMany({});
//     console.log("Cleared existing data");

//     // Create admin
//     const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
//     const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);
    
//     const admin = await Admin.create({
//       role: Role.Admin,
//       name: "System Admin",
//       email: process.env.ADMIN_EMAIL || "admin@example.com",
//       password: hashedAdminPassword,
//       approved: true
//     });
//     console.log("Created admin:", admin.email);

//     // Create school admin
//     const schoolAdminPassword = "123456";
//     const hashedSchoolAdminPassword = await bcrypt.hash(schoolAdminPassword, 12);
    
//     const schoolAdmin = await Admin.create({
//       role: Role.SchoolAdmin,
//       name: "School Manager",
//       email: "admin@gmail.com",
//       password: hashedSchoolAdminPassword,
//       approved: true
//     });
//     console.log("Created school admin:", schoolAdmin.email);

//     // Create school
//     const school = await School.create({
//       name: "Excellence Academy",
//       logo: "https://res.cloudinary.com/dcjfbilhy/image/upload/v1745166530/dpzsysj1cf5pnnslebdx.png",
//       address: "1234 Education Blvd, Knowledge City",
//       district: "Learning District",
//       state: "CA",
//       country: "United States",
//       timeZone: "America/Los_Angeles",
//       domain: "excellence.edu",
//       createdBy: schoolAdmin._id,
//       teachers: [],
//       students: []
//     });
//     console.log("Created school:", school.name);

//     // Update school admin with schoolId
//     schoolAdmin.schoolId = school._id;
//     await schoolAdmin.save();

//     // Create teachers (25)
//     const teachers = [];
//     const teacherPassword = await bcrypt.hash("teacher123", 12);
    
//     // Create different types of teachers - Use only valid enum values from Teacher.js
   
//     const teacherGrades = [
//   // Regular grades
//   'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
  
//   // Case Managers
//   'Case Manager #1', 'Case Manager #2', 'Case Manager #3', 'Case Manager #4',
//   'Case Manager #5', 'Case Manager #6', 'Case Manager #7', 'Case Manager #8',
//   'Case Manager #9', 'Case Manager #10', 'Case Manager #11', 'Case Manager #12',
//   'Case Manager #13', 'Case Manager #14', 'Case Manager #15', 'Case Manager #16',
//   'Case Manager #17', 'Case Manager #18', 'Case Manager #19', 'Case Manager #20',
  
//   // Programs
//   'Program #1', 'Program #2', 'Program #3', 'Program #4', 'Program #5',
//   'Program #6', 'Program #7', 'Program #8', 'Program #9', 'Program #10',
//   'Program #11', 'Program #12', 'Program #13', 'Program #14', 'Program #15',
//   'Program #16', 'Program #17', 'Program #18', 'Program #19', 'Program #20',
  
//   // Centers and Special Programs
//   'AN Center #1', 'AN Center #2', 'AN Center #3', 'AN Center #4', 'AN Center #5',
//   'ASD #1', 'ASD #2', 'ASD #3', 'ASD #4', 'ASD #5',
//   'SSN #1', 'SSN #2', 'SSN #3', 'SSN #4', 'SSN #5'
// ]
    
//     for (let i = 0; i < 25; i++) {
//       const teacherName = getRandomName();
//       const teacherEmail = getRandomEmail(teacherName);
//       const subject = getRandomSubject();
//       // Random teacher type with proper distribution
//       const typeIndex = Math.floor(Math.random() * 100);
//       // 40% Lead, 40% Regular, 20% Special
//       const type = typeIndex < 40 ? "Lead" : "Special";
      
//       // Only assign grade for Lead or Regular teachers, not for Special teachers
//       let grade = null;
//       if (type !== "Special") {
//         grade = teacherGrades[Math.floor(Math.random() * teacherGrades.length)];
//       }
      
//       const teacher = await Teacher.create({
//         name: teacherName,
//         email: teacherEmail,
//         password: teacherPassword,
//         role: Role.Teacher,
//         subject,
//         schoolId: school._id,
//         type,
//         grade,
//         isEmailVerified: true,
//         emailVerificationCode: null,
//         isFirstLogin: false, // So they don't need to reset password
//         recieveMails: Math.random() > 0.5 // 50% chance to receive emails
//       });
//       teachers.push(teacher);
      
//       // Add teacher to school's teachers array
//       school.teachers.push(teacher._id);
//     }
//     console.log("Created 25 teachers");

//     // Create students (120)
//     const students = [];
//     const studentPassword = await bcrypt.hash("student123", 12);
    
//     // All valid student grades including special programs
//     const studentGrades = [
//         // Regular grades
//         'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
        
//         // Case Managers
//         'Case Manager #1', 'Case Manager #2', 'Case Manager #3', 'Case Manager #4',
//         'Case Manager #5', 'Case Manager #6', 'Case Manager #7', 'Case Manager #8',
//         'Case Manager #9', 'Case Manager #10', 'Case Manager #11', 'Case Manager #12',
//         'Case Manager #13', 'Case Manager #14', 'Case Manager #15', 'Case Manager #16',
//         'Case Manager #17', 'Case Manager #18', 'Case Manager #19', 'Case Manager #20',
        
//         // Programs
//         'Program #1', 'Program #2', 'Program #3', 'Program #4', 'Program #5',
//         'Program #6', 'Program #7', 'Program #8', 'Program #9', 'Program #10',
//         'Program #11', 'Program #12', 'Program #13', 'Program #14', 'Program #15',
//         'Program #16', 'Program #17', 'Program #18', 'Program #19', 'Program #20',
        
//         // Centers and Special Programs
//         'AN Center #1', 'AN Center #2', 'AN Center #3', 'AN Center #4', 'AN Center #5',
//         'ASD #1', 'ASD #2', 'ASD #3', 'ASD #4', 'ASD #5',
//         'SSN #1', 'SSN #2', 'SSN #3', 'SSN #4', 'SSN #5'
//       ]
    
//     // Make sure we have students in each grade
//     for (const grade of studentGrades) {
//       // Create around 8-10 students per grade
//       const numStudentsInGrade = Math.floor(Math.random() * 3) + 8;
      
//       for (let i = 0; i < numStudentsInGrade; i++) {
//         const studentName = getRandomName();
//         const studentEmail = getRandomEmail(studentName);
//         const parentEmail = getRandomEmail("parent_" + studentName);
        
//         // Second guardian email (50% chance to have one)
//         const hasSecondGuardian = Math.random() > 0.5;
//         const secondGuardianEmail = hasSecondGuardian ? getRandomEmail("guardian_" + studentName) : "";
        
//         const points = getRandomPoints();
        
//         const student = await Student.create({
//           name: studentName,
//           email: studentEmail,
//           password: studentPassword,
//           role: Role.Student,
//           standard: secondGuardianEmail, // Standard field holds the second guardian email
//           points,
//           parentEmail,
//           sendNotifications: true,
//           schoolId: school._id,
//           grade,
//           isParentOneEmailVerified: true,
//           isParentTwoEmailVerified: hasSecondGuardian,
//           isStudentEmailVerified: true,
//           emailVerificationCode: null,
//           studentEmailVerificationCode: null,
//           pendingEtokens: []
//         });
        
//         students.push(student);
//         // Add student to school's students array
//         school.students.push(student._id);
//       }
//     }
//     console.log(`Created ${students.length} students`);
    
//     await school.save(); // Save school with teacher and student references

//     // Create forms for the school - use proper FormType enum values
//     const formTypes = Object.values(FormType); // Use enum values directly: "AwardPoints", "GiveBonus", etc.
//     const forms = [];

//     for (let i = 0; i < 10; i++) {
//       const formType = formTypes[Math.floor(Math.random() * formTypes.length)];
//       const formName = `${formType} Form ${i + 1}`;
//       const isSpecial = Math.random() > 0.7; // 30% chance to be special
      
//       // Grade is required when isSpecial is false
//       const grade = isSpecial ? null : teacherGrades[Math.floor(Math.random() * teacherGrades.length)];
      
//       // Create questions for form - use proper QuestionType and PointsType enums
//       const questions = [];
//       const numQuestions = Math.floor(Math.random() * 3) + 1; // 1-3 questions
      
//       // Only use proper question types from the enum
//       // For Feedback forms, use text type questions
//       // For other forms, use select or number type questions
//       for (let j = 0; j < numQuestions; j++) {
//         const pointsType = formType === "DeductPoints" ? PointsType.Deduct : PointsType.Award;
//         const maxPoints = pointsType === PointsType.Deduct ? 
//           -1 * (Math.floor(Math.random() * 50) + 10) : 
//           Math.floor(Math.random() * 100) + 20;
          
//         // Choose question type based on form type
//         let questionType;
//         if (formType === "Feedback") {
//           questionType = QuestionType.Text; // Text for Feedback forms
//         } else {
//           // For other forms, use select or number
//           questionType = Math.random() > 0.5 ? QuestionType.Select : QuestionType.Number;
//         }
        
//         // Create question with options for select type
//         const question = {
//           id: `question_${i}_${j}_${Date.now()}`,
//           text: `Question ${j + 1} for ${formName}`,
//           type: questionType,
//           isCompulsory: true,
//           maxPoints,
//           pointsType,
//           options: []
//         };
        
//         // Add options for select questions
//         if (questionType === QuestionType.Select) {
//           const numOptions = Math.floor(Math.random() * 3) + 2; // 2-4 options
//           for (let k = 0; k < numOptions; k++) {
//             const optionPoints = pointsType === PointsType.Deduct ?
//               -1 * (Math.floor(Math.random() * Math.abs(maxPoints/2)) + 1) :
//               Math.floor(Math.random() * (maxPoints/2)) + 1;
              
//             question.options.push({
//               value: `Option ${k + 1}`,
//               points: optionPoints
//             });
//           }
//         }
        
//         questions.push(question);
//       }
      
//       const form = await Form.create({
//         formName,
//         formType,
//         questions,
//         schoolId: school._id,
//         studentEmail: Math.random() > 0.5,
//         teacherEmail: Math.random() > 0.5,
//         schoolAdminEmail: Math.random() > 0.7,
//         parentEmail: Math.random() > 0.6,
//         isSpecial,
//         grade: isSpecial ? "" : grade // Empty string when special, otherwise grade value
//       });
      
//       forms.push(form);
//     }
//     console.log("Created 10 forms");

//     // Create form submissions and point histories
//     for (let i = 0; i < 200; i++) {
//       // Randomly select a form, a teacher, and a student
//       const form = forms[Math.floor(Math.random() * forms.length)];
//       const teacher = teachers[Math.floor(Math.random() * teachers.length)];
      
//       // Select a student from the same grade as the form (if form has grade)
//       let student;
//       if (form.grade && form.grade !== "") {
//         const gradeStudents = students.filter(s => s.grade === form.grade);
//         if (gradeStudents.length > 0) {
//           student = gradeStudents[Math.floor(Math.random() * gradeStudents.length)];
//         } else {
//           student = students[Math.floor(Math.random() * students.length)];
//         }
//       } else {
//         student = students[Math.floor(Math.random() * students.length)];
//       }
      
//       // Sometimes use school admin instead of teacher
//       const useAdmin = Math.random() > 0.8; // 20% chance
//       const submitter = useAdmin ? schoolAdmin : teacher;
      
//       // Create answers for this submission
//       const answers = [];
//       for (let j = 0; j < form.questions.length; j++) {
//         const question = form.questions[j];
        
//         let answer = "";
//         let points = 0;
        
//         // Generate appropriate answers based on question type and form type
//         if (form.formType === "Feedback" && question.type === "text") {
//           // For Feedback forms with text questions, generate text answers
//           answer = `Detailed feedback answer for question ${j + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.`;
//           points = Math.min(
//             Math.floor(Math.random() * Math.abs(question.maxPoints) + 1),
//             Math.abs(question.maxPoints)
//           );
//           if (question.pointsType === PointsType.Deduct) points = -points;
          
//         } else if (question.type === "select") {
//           // For select questions, choose one option
//           if (question.options && question.options.length > 0) {
//             const selectedOption = question.options[Math.floor(Math.random() * question.options.length)];
//             answer = selectedOption.value;
//             points = selectedOption.points;
//           }
//         } else if (question.type === "number") {
//           // For number questions, just generate a numeric score
//           const numericValue = Math.floor(Math.random() * 10) + 1;
//           answer = numericValue.toString();
//           points = Math.min(
//             Math.floor(Math.random() * Math.abs(question.maxPoints) + 1),
//             Math.abs(question.maxPoints)
//           );
//           if (question.pointsType === PointsType.Deduct) points = -points;
//         }
        
//         answers.push({
//           questionId: question.id,
//           answer,
//           points
//         });
//       }
      
//       const submissionDate = generateRandomDate(new Date(2025, 0, 1), new Date(2025, 4, 1));
      
//       // Create form submission
//       const formSubmission = new FormSubmissions({
//         formId: form._id,
//         submittedAt: submissionDate,
//         answers,
//       });
      
//       // Set either teacherId or schoolAdminId based on submitter
//       if (useAdmin) {
//         formSubmission.schoolAdminId = schoolAdmin._id;
//       } else {
//         formSubmission.teacherId = teacher._id;
//       }
      
//       await formSubmission.save();
      
//       // Calculate total points for this submission
//       const totalPoints = answers.reduce((acc, curr) => acc + curr.points, 0);
      
//       // Create point history
//       await PointsHistory.create({
//         formId: form._id,
//         formType: form.formType,
//         formName: form.formName,
//         formSubmissionId: formSubmission._id,
//         submittedById: submitter._id,
//         submittedByName: submitter.name,
//         submittedForId: student._id,
//         submittedForName: student.name,
//         points: totalPoints,
//         schoolId: school._id,
//         submittedAt: submissionDate
//       });
//     }
//     console.log("Created 200 form submissions and point histories");

//     console.log("Seeding completed successfully!");
//     process.exit(0);

//   } catch (err) {
//     console.error("SEED_ERROR: ", err);
//     process.exit(1);
//   }
// };

// seed();
