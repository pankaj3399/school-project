import Student from "../models/Student.js";
import School from "../models/School.js";
import bcrypt from "bcryptjs";
import Teacher from "../models/Teacher.js";
import { Role } from "../enum.js";
import Admin from "../models/Admin.js";
import { sendTeacherRegistrationMail } from "../services/verificationMail.js";
import { sendOnboardingEmail } from "../services/verificationMail.js";

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

  const schoolAdmin = await Admin.findById(req.user.id).select("schoolId");

  try {
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
      message: "Teacher invite created successfully",
      teacher,
      registrationToken,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const updateTeacher = async (req, res) => {
  const teacherId = req.params.id;
  const { name, email, subject, recieveMails, grade, type } = req.body;

  try {
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
    await teacher.save();
    // Send onboarding email after registration is complete
    await sendOnboardingEmail(teacher);
    return res
      .status(200)
      .json({ message: "Registration completed successfully." });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};
