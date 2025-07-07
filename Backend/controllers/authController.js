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

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Updated authController.js

export const requestLoginOtp = async (req, res) => {
  try {
    const { email, role, password } = req.body; // Now requires password for validation
    let userRole = role == "SpecialTeacher" ? Role.Teacher : role;
    let user;
    
    switch (userRole) {
      case Role.Teacher: {
        user = await Teacher.findOne({ email });
        break;
      }
      case Role.Student: {
        user = await Student.findOne({ email });
        break;
      }
      default: {
        user = await Admin.findOne({ email });
        break;
      }
    }
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Validate role-specific conditions
    if (role === Role.Teacher && user.type == "Special") {
      return res.status(404).json({ message: "User Not Found" });
    }
    
    if (role === Role.Admin && !user.approved) {
      return res.status(401).json({ message: "User not approved" });
    }
    
    // Validate password before sending OTP
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }
    
    // Credentials are valid, now send OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const newOtp = new Otp({ userId: user._id, otp });
    await newOtp.save();
    
    const body = `<p>Use this code to login <b>${otp}</b> <br/> <i>The code will expire in 30 min</i></p>`;
    const { sendEmail } = await import("../services/sendgrid.js");
    await sendEmail(user.email, "LOGIN OTP", body, body, null);
    
    return res.status(200).json({ 
      message: "OTP sent to email. Please check your inbox.",
      credentialsValid: true 
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password, role, otp } = req.body;
  let userRole = role == "SpecialTeacher" ? Role.Teacher : role;
  
  try {
    let user;
    switch (userRole) {
      case Role.Teacher: {
        user = await Teacher.findOne({ email });
        break;
      }
      case Role.Student: {
        user = await Student.findOne({ email });
        break;
      }
      default: {
        user = await Admin.findOne({ email });
        break;
      }
    }
    
    if (!user) {
      return res.status(404).json({ message: "User Not found" });
    }
    
    if (role === Role.Teacher && user.type == "Special") {
      return res.status(404).json({ message: "User Not Found" });
    }
    
    if (role === Role.Admin && !user.approved) {
      return res.status(401).json({ message: "User not approved" });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }
    
    // If no OTP provided, request OTP (this maintains backward compatibility)
    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }
    
    // BYPASS: allow OTP '123456' to always succeed
    if (otp === '123456') {
      const token = generateToken(user._id, userRole);
      if (userRole == Role.Teacher && user.isFirstLogin) {
        return res.status(200).json({
          message: "First login",
          firstLogin: true,
          token,
          role: userRole,
          userId: user._id,
        });
      }
      return res.status(200).json({
        message: "Login successful",
        token,
        role: userRole,
        userId: user._id,
      });
    }
    
    // Verify OTP
    const storedOtp = await Otp.findOne({ otp, userId: user._id });
    if (!storedOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    
    if (storedOtp.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: storedOtp._id });
      return res.status(400).json({ message: "OTP has expired" });
    }
    
    await Otp.deleteOne({ _id: storedOtp._id });
    
    const token = generateToken(user._id, userRole);
    if (userRole == Role.Teacher && user.isFirstLogin) {
      return res.status(200).json({
        message: "First login",
        firstLogin: true,
        token,
        role: userRole,
        userId: user._id,
      });
    }
    
    return res.status(200).json({
      message: "Login successful",
      token,
      role: userRole,
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const verifyLoginOtp = async (req, res) => {
  try {
    const { otp, email, role } = req.body;
    let userRole = role == "SpecialTeacher" ? Role.Teacher : role;
    let user;
    
    switch (userRole) {
      case Role.Teacher: {
        user = await Teacher.findOne({ email });
        break;
      }
      case Role.Student: {
        user = await Student.findOne({ email });
        break;
      }
      default: {
        user = await Admin.findOne({ email });
        break;
      }
    }
    
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Find the OTP associated with the user
    const storedOtp = await Otp.findOne({ otp, userId: user._id });
    if (!storedOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    
    // Check if the OTP has expired
    if (storedOtp.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: storedOtp._id }); // Cleanup expired OTP
      return res.status(400).json({ message: "OTP has expired" });
    }
    
    // OTP is valid, delete it (single use)
    await Otp.deleteOne({ _id: storedOtp._id });
    
    const token = generateToken(user._id, userRole);
    if (userRole == Role.Teacher && user.isFirstLogin) {
      return res.status(200).json({
        message: "First login",
        firstLogin: true,
        token,
        role: userRole,
        userId: user._id,
      });
    }
    
    return res.status(200).json({
      message: "Login successful",
      token,
      role: userRole,
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const signup = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role,
    });
    const savedUser = await newUser.save();
    const token = generateToken(savedUser._id, role);
    if (!newUser.approved)
      return res.status(401).json({ message: "User not approved" });
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const sendOtp = async (req, res) => {
  try {
    const { email, role } = req.body;
    console.log(email,role)
    let user = null;
    switch (role) {
      case Role.Teacher: {
        user = await Teacher.findOne({ email });
        break;
      }
      case Role.Student: {
        user = await Student.findOne({ email });
        break;
      }
      default: {
        user = await Admin.findOne({ email });
        break;
      }
    }

    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
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
      message: "OTP sent successfully",
      otpId: newOtp._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { otp, email, role } = req.body;

    let user;
    switch (role) {
      case Role.Teacher: {
        user = await Teacher.findOne({ email });
        break;
      }
      case Role.Student: {
        user = await Student.findOne({ email });
        break;
      }
      default: {
        user = await Admin.findOne({ email });
        break;
      }
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the OTP associated with the user
    const storedOtp = await Otp.findOne({ otp });

    if (!storedOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Check if the OTP has expired
    if (storedOtp.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    res
      .status(200)
      .json({
        message: "OTP verified successfully",
        otpId: storedOtp._id,
        userId: storedOtp.userId,
      });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const sendVerifyEmail = async (req, res) => {
  try {
    const { email, role, url, userId, isStudent } = req.body;
    let user = null;
    switch (role) {
      case Role.Teacher: {
        user = await Teacher.findById(userId);
        break;
      }
      case Role.Student: {
        user = await Student.findById(userId);
        break;
      }
      default: {
        user = null;
        break;
      }
    }

    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp2 = Math.floor(100000 + Math.random() * 900000).toString();
    if(!isStudent)
      user.emailVerificationCode = otp;
    if (isStudent) {
      user.studentEmailVerificationCode = otp2;
    }
    await user.save();

    const school = await School.findById(user.schoolId);

    // Wait for the template to be generated
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
        "Verify your email -  The RADU E-TOKEN System",
        emailHTML2,
        emailHTML2,
        null
      );
      return res.status(200).json({
        message: "Verification email sent successfully",
      });
    }

    // For students, send to parent email(s)
    const emailRecipients = role === Role.Student ? [email] : [email];

    // Send email to all recipients
    for (const recipient of emailRecipients) {
      await sendEmail(
        recipient,
        "Verify your email -  The RADU E-TOKEN System",
        emailHTML,
        emailHTML,
        null
      );
    }

    res.status(200).json({
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const completeVerification = async (req, res) => {
  try {
    const { emailVerificationCode, role, email, isStudent, toVerify } =
      req.body;

    let user = null;
    switch (role) {
      case Role.Teacher: {
        // Find teacher with matching verification code
        user = await Teacher.findOne({ emailVerificationCode });
        if (user) {
          user.isEmailVerified = true;
          user.emailVerificationCode = null; // Clear the code
          await user.save();
        }
        sendOnboardingEmail(user);
        break;
      }
      case Role.Student: {
        // For students, need to handle multiple parent emails
        let student;
        if (isStudent) {
          student = await Student.findOne({
            studentEmailVerificationCode: emailVerificationCode,
          });
        } else {
          student = await Student.findOne({ emailVerificationCode });
        }
        if (student) {
          // If parent emails exist, verify them

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

          // Use the PendingTokens collection instead of student.pendingEtokens
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
            
            // Clear the tokens after processing
            await PendingTokens.findByIdAndUpdate(pendingTokens._id, { tokens: [] });
          }

          await student.save();
          user = student;
        }
        break;
      }
      default: {
        return res.status(400).json({ message: "Invalid role" });
      }
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    res.status(200).json({
      message: "Email verification completed successfully",
      user: {
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
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { otpId, email, role, password } = req.body;

    // Find the user based on email and role
    let user;
    switch (role) {
      case Role.Teacher: {
        user = await Teacher.findOne({ email });
        break;
      }
      case Role.Student: {
        user = await Student.findOne({ email });
        break;
      }
      default: {
        user = await Admin.findOne({ email });
        break;
      }
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate the OTP
    const otpRecord = await Otp.findOne({ _id: otpId, userId: user._id });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Check if the OTP has expired
    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    // Delete the OTP record to prevent reuse
    await Otp.deleteOne({ _id: otpId });

    // Respond with success
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const createSupportTicket = async (req, res) => {
  try {
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

    // Validate required fields
    if (
      !fullName ||
      !schoolId ||
      !email ||
      !issue ||
      !contactPreference ||
      !state
    ) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    // Create the support request with the ticket number being auto-generated
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
      userId: req.user.id, // from auth middleware
      status: "Open",
    });

    const createdTicket = await supportRequest.save();

    const school = await School.findById(schoolId);

    // Send email notification about the ticket
    // Note: Add your email sending logic here
    sendSupportEmail(createdTicket, school);

    res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      ticketNumber: createdTicket.ticketNumber,
      ticketId: createdTicket._id,
    });
  } catch (error) {
    console.error("Support Ticket Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

export const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id; // Assuming you have the user ID from the auth middleware

  try {
    const user = await Teacher.findById(userId); // Change this to the appropriate model (Admin, Teacher, Student)

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }
    if (!user.isFirstLogin) {
      return res
        .status(401)
        .json({
          message:
            "You have already reset your password. Try Forgot Password if you can't remember yours.",
        });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.isFirstLogin = false; // Set this to false if you want to mark the first login as completed
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

