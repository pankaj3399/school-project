import Student from "../models/Student.js";
import School from "../models/School.js";
import bcrypt from "bcryptjs";
import Teacher from "../models/Teacher.js";
import { Role } from "../enum.js";
import Admin from "../models/Admin.js";
import { sendTeacherRegistrationMail } from "../services/verificationMail.js";
import { sendOnboardingEmail } from "../services/verificationMail.js";

// Import the new error handling utilities
import asyncHandler from "../utils/asyncHandler.js";
import { createNotFoundError, createValidationError } from "../utils/errorResponse.js";

export const awardPoints = asyncHandler(async (req, res, next) => {
  const { studentId, points } = req.body;
  const teacherId = req.user.id;

  const student = await Student.findById(studentId);
  if (!student) {
    return next(createNotFoundError("Student not found"));
  }

  student.points += points;
  await student.save();

  res.status(200).json({ 
    success: true,
    message: "Points awarded successfully", 
    data: student 
  });
});

export const addTeacher = asyncHandler(async (req, res, next) => {
  const { email, recieveMails, type, grade } = req.body;

  const schoolAdmin = await Admin.findById(req.user.id).select("schoolId");

  // Generate a registration token
  const registrationToken =
    Math.random().toString(36).substr(2) + Date.now().toString(36);
  
  const teacher = await Teacher.create({
    email,
    recieveMails: recieveMails || false,
    role: Role.Teacher,
    schoolId: schoolAdmin.schoolId,
    type,
    grade,
    registrationToken,
    isEmailVerified: false,
    isFirstLogin: false,
  });

  await School.findOneAndUpdate(
    {
      _id: schoolAdmin.schoolId,
    },
    {
      $push: {
        teachers: teacher._id,
      },
    }
  );
  
  // Fetch school to get logo
  const school = await School.findById(schoolAdmin.schoolId);
  
  // Send registration email
  await sendTeacherRegistrationMail({
    email,
    url: `${process.env.FRONTEND_URL}/teacher/complete-registration`,
    registrationToken,
    schoolLogo: school?.logo,
  });

  return res.status(200).json({
    success: true,
    message: "Teacher invite created successfully",
    data: {
      teacher,
      registrationToken,
    }
  });
});

export const updateTeacher = asyncHandler(async (req, res, next) => {
  const teacherId = req.params.id;
  const { name, email, subject, recieveMails, grade, type } = req.body;

  const updatedTeacher = await Teacher.findByIdAndUpdate(
    teacherId,
    {
      $set: {
        name,
        email,
        subject,
        recieveMails,
        grade,
        type,
      },
    },
    { new: true }
  );

  if (!updatedTeacher) {
    return next(createNotFoundError("Teacher not found"));
  }

  return res.status(200).json({
    success: true,
    message: "Teacher updated successfully",
    data: updatedTeacher,
  });
});

export const deleteTeacher = asyncHandler(async (req, res, next) => {
  const teacherId = req.params.id;

  const deletedTeacher = await Teacher.findByIdAndDelete(teacherId);

  if (!deletedTeacher) {
    return next(createNotFoundError("Teacher not found"));
  }

  await School.updateMany(
    { teachers: teacherId },
    { $pull: { teachers: teacherId } }
  );

  return res.status(200).json({
    success: true,
    message: "Teacher deleted successfully",
  });
});

export const completeTeacherRegistration = asyncHandler(async (req, res, next) => {
  const { token, name, password, subject } = req.body;
  
  if (!token || !name || !password || !subject) {
    return next(createValidationError("All fields are required."));
  }

  const teacher = await Teacher.findOne({ registrationToken: token });
  if (!teacher) {
    return next(createValidationError("Invalid or expired registration token."));
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 12);
  teacher.name = name;
  teacher.password = hashedPassword;
  teacher.subject = subject;
  teacher.registrationToken = null;
  teacher.isEmailVerified = true;
  teacher.isFirstLogin = true;
  await teacher.save();

  // Send onboarding email after registration is complete
  await sendOnboardingEmail(teacher);

  return res.status(200).json({ 
    success: true,
    message: "Registration completed successfully." 
  });
});
