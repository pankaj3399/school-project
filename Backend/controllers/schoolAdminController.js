import School from "../models/School.js";
import User from "../models/Admin.js";
import bcrypt from "bcryptjs";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import { Role, FormType } from "../enum.js";
import { uploadImageFromDataURI } from "../utils/cloudinary.js";
import Admin from "../models/Admin.js";
import PointsHistory from "../models/PointsHistory.js";
import mongoose from "mongoose";
import { reportEmailGenerator } from "../utils/emailHelper.js";
import { generateStudentPDF } from "../utils/generatePDF.js";
import { sendVerifyEmailRoster } from "../services/verificationMail.js";
import { timezoneManager } from "../utils/luxon.js";
import { sendTeacherRegistrationMail } from "../services/verificationMail.js";
import Otp from "../models/Otp.js";
import { sendEmail } from "../services/mail.js";

// Import the new error handling utilities
import asyncHandler from "../utils/asyncHandler.js";
import { createNotFoundError, createValidationError } from "../utils/errorResponse.js";

const getSchoolIdFromUser = async (userId) => {
  const admin = await Admin.findById(userId);
  if (admin) {
    return admin.schoolId;
  }

  const teacher = await Teacher.findById(userId);
  if (teacher) {
    return teacher.schoolId;
  }

  throw new Error("User not authorized");
};

export const addSchool = asyncHandler(async (req, res, next) => {
  const { name, address, district, state, country, timeZone, domain } = req.body;
  const logo = req.file;
  
  const existingSchool = await School.findOne({ createdBy: req.user.id });
  if (existingSchool) {
    return next(createValidationError("School already exists for this admin."));
  }
  
  const logoUrl = await uploadImageFromDataURI(logo);
  const newSchool = await School.create({
    name,
    address,
    district,
    logo: logoUrl,
    timeZone,
    createdBy: req.user.id,
    state,
    country,
    domain,
  });

  await User.findByIdAndUpdate(req.user.id, { schoolId: newSchool._id });

  res.status(201).json({ 
    success: true,
    message: "School created successfully", 
    data: newSchool 
  });
});

export const addTeacher = asyncHandler(async (req, res, next) => {
  const { name, password, email, subject, grade, type } = req.body;

  const hashedPassword = await bcrypt.hash(password, 12);

  const teacher = await Teacher.create({
    name,
    email,
    password: hashedPassword,
    subject,
    role: Role.Teacher,
    grade,
    type,
  });

  await School.findOneAndUpdate(
    { createdBy: req.user.id },
    { $push: { teachers: teacher._id } }
  );

  return res.status(200).json({
    success: true,
    message: "Teacher Added successfully",
  });
});

export const addStudent = asyncHandler(async (req, res, next) => {
  const { name, password, email, standard, grade } = req.body;

  const hashedPassword = await bcrypt.hash(password, 12);

  const student = await Student.create({
    name,
    password: hashedPassword,
    standard,
    email,
    role: Role.Student,
    grade,
  });

  await School.findOneAndUpdate(
    { createdBy: req.user.id },
    { $push: { students: student._id } }
  );

  return res.status(200).json({
    success: true,
    message: "Student Added successfully",
  });
});

export const getStats = asyncHandler(async (req, res, next) => {
  const id = req.user.id;
  const schoolAdmin = await Admin.findById(id);
  
  if (!schoolAdmin) {
    return next(createNotFoundError("School admin not found"));
  }

  const schoolId = schoolAdmin.schoolId;

  if (schoolId == null) {
    return res.status(200).json({
      success: true,
      data: {
        totalTeachers: 0,
        totalStudents: 0,
        totalPoints: 0,
        totalWithdrawPoints: 0,
        totalDeductPoints: 0,
        totalFeedbackCount: 0,
      }
    });
  }

  const totalTeachers = await Teacher.countDocuments({ schoolId });
  const totalStudents = await Student.countDocuments({ schoolId });

  const pointsAggregation = await PointsHistory.aggregate([
    { $match: { schoolId } },
    {
      $group: {
        _id: null,
        totalPoints: { $sum: "$points" },
        totalWithdrawPoints: {
          $sum: {
            $cond: [{ $eq: ["$formType", FormType.PointWithdraw] }, "$points", 0],
          },
        },
        totalDeductPoints: {
          $sum: {
            $cond: [{ $eq: ["$formType", FormType.DeductPoints] }, "$points", 0],
          },
        },
        feedbackCount: {
          $sum: {
            $cond: [{ $eq: ["$formType", FormType.Feedback] }, 1, 0],
          },
        },
      },
    },
  ]);

  const stats = pointsAggregation[0] || {
    totalPoints: 0,
    totalWithdrawPoints: 0,
    totalDeductPoints: 0,
    feedbackCount: 0,
  };

  return res.status(200).json({
    success: true,
    data: {
      totalTeachers,
      totalStudents,
      totalPoints: stats.totalPoints,
      totalWithdrawPoints: stats.totalWithdrawPoints,
      totalDeductPoints: stats.totalDeductPoints,
      totalFeedbackCount: stats.feedbackCount,
    }
  });
});

export const getPointsReceivedPerMonth = asyncHandler(async (req, res, next) => {
  const { studentId } = req.params;

  const student = await Student.findById(studentId);
  if (!student) {
    return next(createNotFoundError("Student not found"));
  }

  const pointsData = await PointsHistory.aggregate([
    { $match: { submittedForId: new mongoose.Types.ObjectId(studentId) } },
    {
      $group: {
        _id: { $month: "$submittedAt" },
        totalPoints: { $sum: "$points" },
      },
    },
  ]);

  const monthlyPoints = Array(12).fill(0);
  pointsData.forEach((data) => {
    monthlyPoints[data._id - 1] = data.totalPoints;
  });

  return res.status(200).json({ 
    success: true,
    data: { monthlyPoints } 
  });
});

export const getPointsGivenPerMonth = asyncHandler(async (req, res, next) => {
  const id = req.user.id;
  const schoolAdmin = await Admin.findById(id);
  
  if (!schoolAdmin) {
    return next(createNotFoundError("School admin not found"));
  }

  const schoolId = schoolAdmin.schoolId;

  const pointsData = await PointsHistory.aggregate([
    { $match: { schoolId: new mongoose.Types.ObjectId(schoolId) } },
    {
      $group: {
        _id: { $month: "$submittedAt" },
        totalPoints: { $sum: "$points" },
      },
    },
  ]);

  const monthlyPoints = Array(12).fill(0);
  pointsData.forEach((data) => {
    monthlyPoints[data._id - 1] = data.totalPoints;
  });

  return res.status(200).json({ 
    success: true,
    data: { monthlyPoints } 
  });
});

export const getPointsGivenPerMonthPerTeacher = asyncHandler(async (req, res, next) => {
  const { teacherId } = req.params;

  const teacher = await Teacher.findById(teacherId);
  if (!teacher) {
    return next(createNotFoundError("Teacher not found"));
  }

  const pointsData = await PointsHistory.aggregate([
    { $match: { submittedById: new mongoose.Types.ObjectId(teacherId) } },
    {
      $group: {
        _id: { $month: "$submittedAt" },
        totalPoints: { $sum: "$points" },
      },
    },
  ]);

  const monthlyPoints = Array(12).fill(0);
  pointsData.forEach((data) => {
    monthlyPoints[data._id - 1] = data.totalPoints;
  });

  return res.status(200).json({ 
    success: true,
    data: { monthlyPoints } 
  });
});

export const getFormsSubmittedPerMonth = asyncHandler(async (req, res, next) => {
  const id = req.user.id;
  const schoolAdmin = await Admin.findById(id);
  
  if (!schoolAdmin) {
    return next(createNotFoundError("School admin not found"));
  }

  const schoolId = schoolAdmin.schoolId;

  const formsData = await PointsHistory.aggregate([
    { $match: { schoolId: new mongoose.Types.ObjectId(schoolId) } },
    {
      $group: {
        _id: { $month: "$submittedAt" },
        formCount: { $count: {} },
      },
    },
  ]);

  const monthlyForms = Array(12).fill(0);
  formsData.forEach((data) => {
    monthlyForms[data._id - 1] = data.formCount;
  });

  return res.status(200).json({ 
    success: true,
    data: { monthlyForms } 
  });
});

export const getFormsSubmittedPerMonthPerTeacher = asyncHandler(async (req, res, next) => {
  const { teacherId } = req.params;

  const teacher = await Teacher.findById(teacherId);
  if (!teacher) {
    return next(createNotFoundError("Teacher not found"));
  }

  const formsData = await PointsHistory.aggregate([
    { $match: { submittedById: new mongoose.Types.ObjectId(teacherId) } },
    {
      $group: {
        _id: { $month: "$submittedAt" },
        formCount: { $count: {} },
      },
    },
  ]);

  const monthlyForms = Array(12).fill(0);
  formsData.forEach((data) => {
    monthlyForms[data._id - 1] = data.formCount;
  });

  return res.status(200).json({ 
    success: true,
    data: { monthlyForms } 
  });
});

export const getMonthlyStats = asyncHandler(async (req, res, next) => {
  const id = req.user.id;
  const schoolAdmin = await Admin.findById(id);
  
  if (!schoolAdmin) {
    return next(createNotFoundError("School admin not found"));
  }

  const schoolId = schoolAdmin.schoolId;

  const monthlyStats = await PointsHistory.aggregate([
    { $match: { schoolId } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        totalPoints: { $sum: "$points" },
        totalNegativePoints: {
          $sum: { $cond: [{ $lt: ["$points", 0] }, "$points", 0] },
        },
        feedbackCount: {
          $sum: { $cond: [{ $eq: ["$formType", FormType.Feedback] }, 1, 0] },
        },
      },
    },
    {
      $sort: { "_id.year": -1, "_id.month": -1 },
    },
  ]);

  const formattedMonthlyStats = monthlyStats.map((stat) => ({
    year: stat._id.year,
    month: stat._id.month,
    totalPoints: stat.totalPoints,
    totalNegativePoints: stat.totalNegativePoints,
    feedbackCount: stat.feedbackCount,
  }));

  return res.status(200).json({
    success: true,
    data: { monthlyStats: formattedMonthlyStats },
  });
});

export const sendReport = asyncHandler(async (req, res, next) => {
  const { email } = req.params;
  const file = req.file;

  if (!file) {
    return next(createValidationError("No file uploaded"));
  }

  const fileData = {
    buffer: file.buffer,
    originalname: `Etoken Report-${file.originalname}-As_Of_${new Date().toLocaleDateString()}`,
    mimetype: file.mimetype,
  };

  await reportEmailGenerator(fileData.buffer, fileData.originalname, email);
  
  return res.status(200).json({ 
    success: true,
    message: "Report sent successfully" 
  });
});

export const sendResetOtp = asyncHandler(async (req, res, next) => {
  const user = await Admin.findById(req.user.id);
  if (!user) {
    return next(createNotFoundError("User not found"));
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const newOtp = new Otp({
    userId: user._id,
    otp: otp,
  });
  await newOtp.save();

  const body = `<p>Use this code to confirm student data reset. This action will permanently delete all students and their point history data from your school <b>${otp}</b> <br/> <i>The code will expire in 30 min</i></p>`;
  await sendEmail(user.email, "STUDENT DATA RESET OTP", body, body, null);

  return res.status(200).json({
    success: true,
    message: "OTP sent successfully",
    data: { otpId: newOtp._id },
  });
});

export const verifyResetOtp = asyncHandler(async (req, res, next) => {
  const { otp } = req.body;
  const user = await Admin.findById(req.user.id);
  
  if (!user) {
    return next(createNotFoundError("User not found"));
  }

  const storedOtp = await Otp.findOne({ otp, userId: user._id });
  if (!storedOtp) {
    return next(createValidationError("Invalid OTP"));
  }

  if (storedOtp.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: storedOtp._id });
    return next(createValidationError("OTP has expired"));
  }

  await Otp.deleteOne({ _id: storedOtp._id });

  const schoolId = await getSchoolIdFromUser(req.user.id);
  await PointsHistory.deleteMany({ schoolId });
  await Student.deleteMany({ schoolId });

  return res.status(200).json({ 
    success: true,
    message: "Student roster reset successfully" 
  });
});

export const resetStudentRoster = asyncHandler(async (req, res, next) => {
  const schoolId = await getSchoolIdFromUser(req.user.id);
  await PointsHistory.deleteMany({ schoolId });
  await Student.deleteMany({ schoolId });
  
  return res.status(200).json({ 
    success: true,
    message: "Student roster reset successfully" 
  });
});

export const genreport = asyncHandler(async (req, res, next) => {
  const { studentData, schoolData, teacherData } = req.body;
  const email = req.params.email;
  const schData = JSON.parse(schoolData);
  const stdData = JSON.parse(studentData);
  const tchData = JSON.parse(teacherData);
  const barChartImage = req.file.buffer;
  
  const gen = await generateStudentPDF({
    schoolData: schData,
    studentData: stdData,
    teacherData: tchData,
    barChartImage,
  });

  const timeZone = schData.school.timeZone || "UTC+0";
  const formattedDate = timezoneManager.formatForSchool(
    new Date(),
    timeZone,
    "MMMM dd, yyyy"
  );

  await reportEmailGenerator(
    gen,
    `Etoken Report-${stdData.studentInfo.name}-As Of ${formattedDate}.pdf`,
    email,
    { stdData, schData, tchData }
  );
  
  if (req.user.role == "SchoolAdmin") {
    await reportEmailGenerator(
      gen,
      `Etoken Report-${stdData.studentInfo.name}-As Of ${formattedDate}.pdf`,
      schData.school.createdBy.email,
      { stdData, schData, tchData }
    );
  }
  
  return res.status(200).json({ 
    success: true,
    message: "Student report sent successfully" 
  });
});

export const teacherRoster = asyncHandler(async (req, res, next) => {
  const { teachers } = req.body;
  const user = req.user;
  const schoolId = await getSchoolIdFromUser(user.id);
  const school = await School.findById(schoolId);
  const teacherIds = [...school.teachers];

  if (!teachers || teachers.length === 0) {
    return next(createValidationError("No teachers provided"));
  }

  const results = await Promise.all(
    teachers.map(async (teacher) => {
      try {
        const registrationToken =
          Math.random().toString(36).substr(2) + Date.now().toString(36);

        const createdTeacher = await Teacher.create({
          email: teacher.email,
          recieveMails: teacher.recieveMails || false,
          role: Role.Teacher,
          schoolId: schoolId,
          type: teacher.type,
          grade: teacher.grade,
          registrationToken,
          isEmailVerified: false,
          isFirstLogin: false,
        });

        teacherIds.push(createdTeacher._id);
        await sendTeacherRegistrationMail({
          email: createdTeacher.email,
          url: `${process.env.FRONTEND_URL}/teacher/complete-registration`,
          registrationToken,
          schoolLogo: school?.logo,
        });

        return {
          email: createdTeacher.email,
          success: true,
          id: createdTeacher._id,
        };
      } catch (err) {
        return { email: teacher.email, success: false, error: err.message };
      }
    })
  );

  school.teachers = [...new Set(teacherIds)];
  await school.save();

  return res.status(200).json({
    success: true,
    message: "Teacher roster processed",
    data: { results },
  });
});

export const studentRoster = asyncHandler(async (req, res, next) => {
  const { students, url } = req.body;
  const user = req.user;
  const schoolId = await getSchoolIdFromUser(user.id);
  const school = await School.findById(schoolId);
  const studentIds = [...school.students];

  if (!students || students.length === 0) {
    return next(createValidationError("No students provided"));
  }

  const createPromises = students.map(async (student) => {
    try {
      if (!student.name || !student.email || !student.grade || !student.studentNumber) {
        return null;
      }

      const hashedPassword = await bcrypt.hash("123456", 12);

      const studentData = {
        name: student.name,
        email: student.studentNumber + school.domain,
        grade: student.grade,
        studentNumber: student.studentNumber,
        parentEmail: student.guardian1.email,
        standard: student.guardian2?.email ?? "",
        guardian1: {
          name: student.guardian1.name,
          email: student.guardian1.email,
        },
        guardian2: student.guardian2
          ? {
              name: student.guardian2.name,
              email: student.guardian2.email,
            }
          : null,
        schoolId: schoolId,
        password: hashedPassword,
        role: Role.Student,
        isEmailVerified: false,
        isParentOneEmailVerified: false,
        isParentTwoEmailVerified: false,
        sendNotifications: true,
      };

      const createdStudent = await Student.create(studentData);

      if (student.email) {
        await sendVerifyEmailRoster(req, res, createdStudent, true, null, school.logo);
      }

      if (student.guardian1?.email) {
        await sendVerifyEmailRoster(req, res, createdStudent, false, null, school.logo);
      }
      
      return createdStudent._id;
    } catch (error) {
      console.error(`Error creating student ${student.name}:`, error);
      return null;
    }
  });

  const newStudentIds = await Promise.all(createPromises);
  const validStudentIds = newStudentIds.filter((id) => id !== null);
  school.students = [...new Set([...studentIds, ...validStudentIds])];
  await school.save();

  return res.status(200).json({
    success: true,
    message: "Student roster updated successfully",
    data: {
      studentsAdded: validStudentIds.length,
    }
  });
});
