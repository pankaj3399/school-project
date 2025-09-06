import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import { Role } from "../enum.js";
import { sendEmail } from "../services/mail.js";
import Otp from "../models/Otp.js";
import { getVerificationEmailTemplate } from "../utils/emailTemplates.js";
import { emailGenerator } from "../utils/emailHelper.js";
import { sendOnboardingEmail } from "../services/verificationMail.js";
import SupportRequest from "../models/SupportRequest.js";
import { sendSupportEmail } from "../services/supportRequestEmail.js";
import School from "../models/School.js";
import PendingTokens from "../models/PendingTokens.js";

// Import the new error handling utilities
import asyncHandler from "../utils/asyncHandler.js";
import { createNotFoundError, createValidationError } from "../utils/errorResponse.js";

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

export const requestLoginOtp = asyncHandler(async (req, res, next) => {
  const { email, role, password } = req.body;
  let userRole = role == "SpecialTeacher" ? Role.Teacher : role;
  let user;

  switch (userRole) {
    case Role.Teacher:
      user = await Teacher.findOne({ email });
      break;
    case Role.Student:
      user = await Student.findOne({ email });
      break;
    default:
      user = await Admin.findOne({ email });
      break;
  }

  if (!user) {
    return next(createNotFoundError("User not found"));
  }

  if ((user.type === "Special" && role !== "SpecialTeacher") || (user.type === "Lead" && role !== "Teacher")) {
    return next(createNotFoundError("User not found"));
  }

  if (role === Role.Admin && !user.approved) {
    return next(createValidationError("User not approved"));
  }

  if (!user.password) {
    return next(createValidationError("Account setup incomplete."));
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(createValidationError("Invalid Credentials"));
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const newOtp = new Otp({ userId: user._id, otp });
  await newOtp.save();

  const body = `<p>Use this code to login <b>${otp}</b> <br/> <i>The code will expire in 30 min</i></p>`;
  await sendEmail(user.email, "LOGIN OTP", body, body, null);

  return res.status(200).json({
    success: true,
    message: "OTP sent to email. Please check your inbox.",
    credentialsValid: true
  });
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password, role, otp } = req.body;
  let userRole = role == "SpecialTeacher" ? Role.Teacher : role;

  let user;
  switch (userRole) {
    case Role.Teacher:
      user = await Teacher.findOne({ email });
      break;
    case Role.Student:
      user = await Student.findOne({ email });
      break;
    default:
      user = await Admin.findOne({ email });
      break;
  }

  if (!user) {
    return next(createNotFoundError("User not found"));
  }

  if ((user.type === "Teacher" && role !== "SpecialTeacher") || (user.type === "Lead" && role !== "Teacher")) {
    return next(createNotFoundError("User not found"));
  }

  if (role === Role.Admin && !user.approved) {
    return next(createValidationError("User not approved"));
  }

  if (!user.password) {
    return next(createValidationError("Account setup incomplete."));
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(createValidationError("Invalid Credentials"));
  }

  if (!otp) {
    return next(createValidationError("OTP is required"));
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

  const token = generateToken(user._id, userRole);
  if (userRole == Role.Teacher && user.isFirstLogin) {
    return res.status(200).json({
      success: true,
      message: "First login",
      firstLogin: true,
      token,
      role: userRole,
      userId: user._id,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    role: userRole,
    userId: user._id,
  });
});

export const verifyLoginOtp = asyncHandler(async (req, res, next) => {
  const { otp, email, role } = req.body;
  let userRole = role == "SpecialTeacher" ? Role.Teacher : role;
  let user;

  switch (userRole) {
    case Role.Teacher:
      user = await Teacher.findOne({ email });
      break;
    case Role.Student:
      user = await Student.findOne({ email });
      break;
    default:
      user = await Admin.findOne({ email });
      break;
  }

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

  const token = generateToken(user._id, userRole);
  if (userRole == Role.Teacher && user.isFirstLogin) {
    return res.status(200).json({
      success: true,
      message: "First login",
      firstLogin: true,
      token,
      role: userRole,
      userId: user._id,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    role: userRole,
    userId: user._id,
  });
});

export const signup = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const hashedPassword = await bcrypt.hash(password, 12);
  const newUser = await Admin.create({
    name,
    email,
    password: hashedPassword,
    role,
  });
  
  const savedUser = await newUser.save();
  const token = generateToken(savedUser._id, role);
  
  if (!newUser.approved) {
    return next(createValidationError("User not approved"));
  }
  
  res.status(201).json({
    success: true,
    message: "User registered successfully",
    token,
    data: {
      id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      role,
    },
  });
});

export const sendOtp = asyncHandler(async (req, res, next) => {
  const { email, role } = req.body;
  let userRole = role == "SpecialTeacher" ? Role.Teacher : role;
  let user = null;
  
  switch (userRole) {
    case Role.Teacher:
      user = await Teacher.findOne({ email });
      break;
    case Role.Student:
      user = await Student.findOne({ email });
      break;
    default:
      user = await Admin.findOne({ email });
      break;
  }

  if (!user) {
    return next(createNotFoundError("User not found"));
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const newOtp = new Otp({
    userId: user._id,
    otp: otp,
  });

  await newOtp.save();

  const body = `<p>Use this code to reset your password <b>${otp}</b> <br/> <i>The code will expire in 30 min</i></p>`;
  await sendEmail(user.email, "PASSWORD RESET OTP", body, body, null);

  res.status(200).json({
    success: true,
    message: "OTP sent successfully",
    data: { otpId: newOtp._id },
  });
});

export const verifyOtp = asyncHandler(async (req, res, next) => {
  const { otp, email, role } = req.body;
  let userRole = role == "SpecialTeacher" ? Role.Teacher : role;
  let user;
  
  switch (userRole) {
    case Role.Teacher:
      user = await Teacher.findOne({ email });
      break;
    case Role.Student:
      user = await Student.findOne({ email });
      break;
    default:
      user = await Admin.findOne({ email });
      break;
  }

  if (!user) {
    return next(createNotFoundError("User not found"));
  }

  const storedOtp = await Otp.findOne({ otp });
  if (!storedOtp) {
    return next(createValidationError("Invalid OTP"));
  }

  if (storedOtp.expiresAt < new Date()) {
    return next(createValidationError("OTP has expired"));
  }

  res.status(200).json({
    success: true,
    message: "OTP verified successfully",
    data: {
      otpId: storedOtp._id,
      userId: storedOtp.userId,
    }
  });
});

export const sendVerifyEmail = asyncHandler(async (req, res, next) => {
  const { email, role, url, userId, isStudent } = req.body;
  let userRole = role == "SpecialTeacher" ? Role.Teacher : role;
  let user = null;
  
  switch (userRole) {
    case Role.Teacher:
      user = await Teacher.findById(userId);
      break;
    case Role.Student:
      user = await Student.findById(userId);
      break;
    default:
      user = null;
      break;
  }

  if (!user) {
    return next(createNotFoundError("User not found"));
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otp2 = Math.floor(100000 + Math.random() * 900000).toString();
  
  if (!isStudent) {
    user.emailVerificationCode = otp;
  }
  if (isStudent) {
    user.studentEmailVerificationCode = otp2;
  }
  await user.save();

  const school = await School.findById(user.schoolId);

  const emailHTML = await getVerificationEmailTemplate(
    role,
    otp,
    url,
    email,
    email,
    false,
    null,
    school?.logo
  );
  const emailHTML2 = await getVerificationEmailTemplate(
    role,
    otp2,
    url,
    email,
    email,
    isStudent,
    null,
    school?.logo
  );

  if (isStudent) {
    await sendEmail(
      email,
      "Verify your email - The RADU E-TOKEN System",
      emailHTML2,
      emailHTML2,
      null
    );
    return res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
    });
  }

  const emailRecipients = role === Role.Student ? [email] : [email];

  for (const recipient of emailRecipients) {
    await sendEmail(
      recipient,
      "Verify your email - The RADU E-TOKEN System",
      emailHTML,
      emailHTML,
      null
    );
  }

  res.status(200).json({
    success: true,
    message: "Verification email sent successfully",
  });
});

export const completeVerification = asyncHandler(async (req, res, next) => {
  const { emailVerificationCode, role, email, isStudent, toVerify } = req.body;
  let userRole = role == "SpecialTeacher" ? Role.Teacher : role;

  let user = null;
  switch (userRole) {
    case Role.Teacher:
      user = await Teacher.findOne({ emailVerificationCode });
      if (user) {
        user.isEmailVerified = true;
        user.emailVerificationCode = null;
        await user.save();
      }
      sendOnboardingEmail(user);
      break;
    case Role.Student:
      let student;
      if (isStudent) {
        student = await Student.findOne({
          studentEmailVerificationCode: emailVerificationCode,
        });
      } else {
        student = await Student.findOne({ emailVerificationCode });
      }
      if (student) {
        if (!isStudent) {
          if (student.parentEmail == toVerify) {
            student.isParentOneEmailVerified = true;
          }
          if (student.standard == toVerify) {
            student.isParentTwoEmailVerified = true;
          }
        } else {
          student.isStudentEmailVerified = true;
          student.studentEmailVerificationCode = null;
        }

        const pendingTokens = await PendingTokens.findOne({ studentId: student._id });
        
        if (pendingTokens && pendingTokens.tokens && pendingTokens.tokens.length > 0) {
          const school = await School.findById(student.schoolId).populate("createdBy", "name email");
          
          for (const tokenData of pendingTokens.tokens) {
            if (tokenData.form && tokenData.data) {
              emailGenerator(tokenData.form, {
                ...tokenData.data,
                student,
                school,
                schoolAdmin: school.createdBy
              });
            }
          }
          
          await PendingTokens.findByIdAndUpdate(pendingTokens._id, { tokens: [] });
        }

        await student.save();
        user = student;
      }
      break;
    default:
      return next(createValidationError("Invalid role"));
  }

  if (!user) {
    return next(createValidationError("Invalid verification code"));
  }

  res.status(200).json({
    success: true,
    message: "Email verification completed successfully",
    data: {
      id: user._id,
      role,
      ...(role === Role.Student
        ? {
            isParentEmailVerified: user.isParentEmailVerified,
            isParentEmail2Verified: user.isParentEmail2Verified,
          }
        : {
            isEmailVerified: user.isEmailVerified,
          }),
    },
  });
});

export const resetPassword = asyncHandler(async (req, res, next) => {
  const { otpId, email, role, password } = req.body;
  let userRole = role == "SpecialTeacher" ? Role.Teacher : role;

  let user;
  switch (userRole) {
    case Role.Teacher:
      user = await Teacher.findOne({ email });
      break;
    case Role.Student:
      user = await Student.findOne({ email });
      break;
    default:
      user = await Admin.findOne({ email });
      break;
  }

  if (!user) {
    return next(createNotFoundError("User not found"));
  }

  const otpRecord = await Otp.findOne({ _id: otpId, userId: user._id });
  if (!otpRecord) {
    return next(createValidationError("Invalid OTP"));
  }

  if (otpRecord.expiresAt < new Date()) {
    return next(createValidationError("OTP has expired"));
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  user.password = hashedPassword;
  await user.save();

  await Otp.deleteOne({ _id: otpId });

  res.status(200).json({ 
    success: true,
    message: "Password reset successfully" 
  });
});

export const createSupportTicket = asyncHandler(async (req, res, next) => {
  const {
    fullName,
    position,
    schoolName,
    schoolId,
    subjectGrade,
    email,
    phone,
    issue,
    contactPreference,
    state,
  } = req.body;

  if (!fullName || !schoolId || !email || !issue || !contactPreference || !state) {
    return next(createValidationError("Missing required fields"));
  }

  const supportRequest = new SupportRequest({
    username: fullName,
    position,
    schoolName,
    schoolId,
    state,
    email,
    phone: phone || null,
    preferredContactMethod: contactPreference,
    issue,
    userId: req.user.id,
    status: "Open",
  });

  const createdTicket = await supportRequest.save();
  const school = await School.findById(schoolId);

  sendSupportEmail(createdTicket, school);

  res.status(201).json({
    success: true,
    message: "Support ticket created successfully",
    data: {
      ticketNumber: createdTicket.ticketNumber,
      ticketId: createdTicket._id,
    }
  });
});

export const changePassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  const user = await Teacher.findById(userId);
  if (!user) {
    return next(createNotFoundError("User not found"));
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return next(createValidationError("Invalid Credentials"));
  }
  
  if (!user.isFirstLogin) {
    return next(createValidationError(
      "You have already reset your password. Try Forgot Password if you can't remember yours."
    ));
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  user.password = hashedPassword;
  user.isFirstLogin = false;
  await user.save();

  res.status(200).json({ 
    success: true,
    message: "Password changed successfully" 
  });
});

export const verifyPassword = asyncHandler(async (req, res, next) => {
  const { password } = req.body;
  const userId = req.user.id;

  let user;
  switch (req.user.role) {
    case Role.Teacher:
      user = await Teacher.findById(userId);
      break;
    case Role.Student:
      user = await Student.findById(userId);
      break;
    default:
      user = await Admin.findById(userId);
      break;
  }

  if (!user) {
    return next(createNotFoundError("User not found"));
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(createValidationError("Invalid password"));
  }

  res.status(200).json({ 
    success: true,
    message: "Password verified successfully" 
  });
});
