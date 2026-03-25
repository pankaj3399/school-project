import Student from "../models/Student.js";
import School from "../models/School.js";
import bcrypt from "bcryptjs";
import Teacher from "../models/Teacher.js";
import { TermsOfUse } from '../models/TermsOfUse.js';
import { Role } from "../enum.js";
import Admin from "../models/Admin.js";
import { sendTeacherRegistrationMail } from "../services/verificationMail.js";
import { sendOnboardingEmail } from "../services/verificationMail.js";
import mongoose from "mongoose";

export const awardPoints = async (req, res) => {
  const { studentId, points } = req.body;
  const teacherId = req.user.id;

  try {
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.points += points;
    await student.save();

    res.status(200).json({ message: "Points awarded successfully", student });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const addTeacher = async (req, res) => {
  const { email, recieveMails, type, grade } = req.body;
  const { schoolId: querySchoolId } = req.query;
  const { schoolId: bodySchoolId } = req.body;

  try {
    let schoolId;
    if (req.user.role === Role.SystemAdmin || req.user.role === Role.Admin) {
      schoolId = querySchoolId || bodySchoolId;
      if (!schoolId) {
        return res.status(400).json({ message: "School ID is required for System Administrators" });
      }
    } else {
      const schoolAdmin = await Admin.findById(req.user.id).select("schoolId");
      if (!schoolAdmin || !schoolAdmin.schoolId) {
        return res.status(403).json({ message: "Admin not associated with a school" });
      }
      schoolId = schoolAdmin.schoolId;
    }

    // Validate schoolId format
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return res.status(400).json({ message: "Invalid School ID format" });
    }

    // Validate school existence
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    // Generate a registration token
    const registrationToken =
      Math.random().toString(36).substr(2) + Date.now().toString(36);
    
    const teacher = await Teacher.create({
      email,
      recieveMails: recieveMails || false,
      role: Role.Teacher,
      schoolId: schoolId,
      type,
      grade,
      registrationToken,
      registrationTokenExpires: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
      isEmailVerified: false,
      isFirstLogin: false,
    });

    await School.findOneAndUpdate(
      {
        _id: schoolId,
      },
      {
        $push: {
          teachers: teacher._id,
        },
      }
    );

    // Send registration email in a separate try/catch to avoid failing the whole request
    try {
      await sendTeacherRegistrationMail({
        email,
        url: `${process.env.FRONTEND_URL}/teacher/complete-registration`,
        registrationToken,
        schoolId: schoolId,
        schoolLogo: school?.logo,
      });
    } catch (emailError) {
      console.error("Email delivery failed for teacher invite:", emailError);
      return res.status(200).json({
        message: "Teacher invite created successfully, but email delivery failed.",
        teacher,
        registrationToken,
        emailError: true
      });
    }

    return res.status(200).json({
      message: "Teacher invite created successfully",
      teacher,
      registrationToken,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error in teacherController.js", error: error.message });
  }
};

export const updateTeacher = async (req, res) => {
  const teacherId = req.params.id;
  const { name, email, subject, recieveMails, grade, type } = req.body;

  try {
    console.log('Update request received:', {
      teacherId,
      name,
      email,
      subject,
      recieveMails,
      grade,
      type,
    });

    const teacherToUpdate = await Teacher.findById(teacherId);
    if (!teacherToUpdate) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Role handling and ownership check
    switch (req.user.role) {
      case Role.SchoolAdmin:
        const schoolAdmin = await Admin.findById(req.user.id).select("schoolId");
        if (!schoolAdmin || !schoolAdmin.schoolId || !teacherToUpdate.schoolId || schoolAdmin.schoolId.toString() !== teacherToUpdate.schoolId.toString()) {
          return res.status(403).json({ message: "You do not have permission to update this teacher" });
        }
        break;
      case Role.SystemAdmin:
      case Role.Admin:
        // Elevated roles can update teachers in any school
        break;
      default:
        // Basic users or unrecognized roles
        return res.status(403).json({ message: "Access denied: Unauthorized role" });
    }

    // Build update object carefully to handle boolean values
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (subject !== undefined) updateData.subject = subject;
    if (recieveMails !== undefined) updateData.recieveMails = Boolean(recieveMails);
    if (grade !== undefined) updateData.grade = grade;
    if (type !== undefined) updateData.type = type;

    const updatedTeacher = await Teacher.findByIdAndUpdate(
      teacherId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedTeacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    return res.status(200).json({
      message: "Teacher updated successfully",
      teacher: updatedTeacher,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const deleteTeacher = async (req, res) => {
  const teacherId = req.params.id;

  try {
    const teacherToDelete = await Teacher.findById(teacherId);
    if (!teacherToDelete) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Ownership check
    if (req.user.role === Role.SchoolAdmin) {
      const schoolAdmin = await Admin.findById(req.user.id).select("schoolId");
      if (!schoolAdmin || !schoolAdmin.schoolId || !teacherToDelete.schoolId || schoolAdmin.schoolId.toString() !== teacherToDelete.schoolId.toString()) {
        return res.status(403).json({ message: "You do not have permission to delete this teacher" });
      }
    }

    const deletedTeacher = await Teacher.findByIdAndDelete(teacherId);

    if (!deletedTeacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    await School.updateMany(
      { teachers: teacherId },
      { $pull: { teachers: teacherId } }
    );

    return res.status(200).json({
      message: "Teacher deleted successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const completeTeacherRegistration = async (req, res) => {
  const { token, name, password, subject } = req.body;
  if (!token || !name || !password || !subject) {
    return res.status(400).json({ message: "All fields are required." });
  }
  try {
    const teacher = await Teacher.findOne({ registrationToken: token });
    if (!teacher) {
      return res
        .status(400)
        .json({ message: "Invalid or expired registration token." });
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);
    teacher.name = name;
    teacher.password = hashedPassword;
    teacher.subject = subject;
    teacher.registrationToken = null;
    teacher.isEmailVerified = true;
    teacher.isFirstLogin = true;
    
    // Record terms acceptance if provided during registration
    if (req.body.termsAccepted) {
      // Record terms acceptance on the teacher record
      // Resolve terms version
      let termsVersion = req.body.termsVersion;
      if (!termsVersion) {
        const activeTerms = await TermsOfUse.findOne({ isActive: true });
        if (!activeTerms) {
          return res.status(400).json({ message: "No active terms version found. Please contact administrator." });
        }
        termsVersion = activeTerms.version;
      }
      teacher.termsVersion = termsVersion;
      teacher.termsAcceptedAt = new Date();
      
      // Normalize IP address handling
      let rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      if (Array.isArray(rawIp)) rawIp = rawIp.join(',');
      teacher.termsAcceptedIp = (rawIp || '').split(',')[0].trim();
    }

    await teacher.save();
    // Send onboarding email after registration is complete
    try {
      await sendOnboardingEmail(teacher);
    } catch (emailError) {
      console.error("Error sending onboarding email:", emailError);
      // Continue to return success response even if email fails
    }
    return res
      .status(200)
      .json({ message: "Registration completed successfully." });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};
