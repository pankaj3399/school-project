import Form from "../models/Form.js";
import FormSubmissions from "../models/FormSubmissions.js";
import PointsHistory from "../models/PointsHistory.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import Admin from "../models/Admin.js";
import School from "../models/School.js";
import Feedback from "../models/Feedback.js";
import PendingTokens from "../models/PendingTokens.js";
import { Role, FormType } from "../enum.js";
import { getVerificationEmailTemplate } from "../utils/emailTemplates.js";
import { sendEmail } from "../services/mail.js";
import { checkStudentFormEligibility } from "../utils/studentVerification.js";
import { emailGenerator } from "../utils/emailHelper.js";

const getGradeFromUser = async (userId) => {
  // Try finding user as admin first
  const admin = await Admin.findById(userId);
  if (admin) {
    return null;
  }
  // If not admin, try finding as teacher
  const teacher = await Teacher.findById(userId);
  if (teacher) {
    const studentIds = await Student.find({ schoolId: teacher.schoolId, grade: teacher.grade }).select('_id');
    return {
      grade: teacher.grade,
      studentIds: studentIds.map(student => student._id)
    };
  }
  throw new Error('User not authorized');
}

export const createForm = async (req, res) => {
  const {
    formName,
    formType,
    questions,
    studentEmail = false,
    teacherEmail = false,
    schoolAdminEmail = false,
    parentEmail = false,
    isSpecial,
    grade,
    preSelectedStudents = []
  } = req.body;
  const id = req.user.id;
  let school;

  try {
    if (req.user.role == Role.Teacher) {
      const user = await Teacher.findById(id)
      if (!user) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      school = await School.findById(user.schoolId)
      if (!school) {
        return res.status(404).json({ message: "School not found for teacher" });
      }
    } else {
      school = await School.findOne({ createdBy: id });
      if (!school) {
        return res.status(404).json({ message: "School not found for admin" });
      }
    }

    const form = await Form.create({
      schoolId: school._id,
      formName,
      formType,
      questions,
      studentEmail,
      teacherEmail,
      schoolAdminEmail,
      parentEmail,
      grade,
      isSpecial,
      preSelectedStudents: formType === 'AWARD POINTS WITH INDIVIDUALIZED EDUCATION PLAN (IEP)' ? preSelectedStudents : []
    });
    return res.status(200).json({
      message: "Form Created Successfully",
      form: form,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const editForm = async (req, res) => {
  const formId = req.params.id;
  const {
    formName,
    formType,
    questions,
    studentEmail = false,
    teacherEmail = false,
    schoolAdminEmail = false,
    parentEmail = false,
    grade,
    isSpecial
  } = req.body;
  try {
    const form = await Form.findByIdAndUpdate(formId, {
      formName,
      formType,
      questions,
      studentEmail,
      teacherEmail,
      schoolAdminEmail,
      parentEmail,
      grade,
      isSpecial
    });
    return res.status(200).json({
      message: "Form Edited Successfully",
      form: form,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const getForms = async (req, res) => {
  const id = req.user.id;
  let user;

  switch (req.user.role) {
    case Role.SchoolAdmin:
      user = await Admin.findById(id);
      break;
    case Role.Teacher:
      user = await Teacher.findById(id);
      break;
    default:
      return res.status(403).json({ message: "Forbidden" });
  }

  const schoolId = user.schoolId;

  try {
    let forms = await Form.find({ schoolId });
    if (req.user.role == Role.Teacher) {
      if (user.type == "Special") {
        forms = await Form.find({
          schoolId: user.schoolId,
        });
        forms = forms.filter(form => form.formType != FormType.PointWithdraw && form.formType != FormType.DeductPoints);
      } else {
        forms = await Form.find({
          schoolId: user.schoolId,
          $or: [
            { isSpecial: true },
            { grade: user.grade }
          ]
        });
      }
    } else {
      forms = await Form.find({ schoolId });
    }
    return res.status(200).json({
      message: "Forms Fetched Successfully",
      forms: forms,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const getFormById = async (req, res) => {
  const id = req.params.id;
  try {
    const form = await Form.findById(id);
    return res.status(200).json({ form });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const deleteForm = async (req, res) => {
  const id = req.params.id;
  try {
    const form = await Form.findByIdAndDelete(id);
    if (!form) return res.status(404).json({ message: "Form doesn't exist" });
    return res.status(200).json({ formName: form.formName });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const submitFormTeacher = async (req, res) => {
  const formId = req.params.formId;
  const { submittedFor, answers, submittedAt } = req.body;
  const teacherId = req.user.id;
  const teacher = await Teacher.findById(teacherId);
  const form = await Form.findById(formId);
  const totalPoints = answers.reduce((acc, curr) => acc + curr.points, 0);
  const school = await School.findById(teacher.schoolId);
  const schoolAdmin = await Admin.findById(school.createdBy);

  try {
    // Check if student is eligible for form submission
    const eligibilityCheck = await checkStudentFormEligibility(submittedFor, form);
    if (!eligibilityCheck.eligible) {
      return res.status(403).json({
        message: eligibilityCheck.error
      });
    }

    const submittedForStudent = eligibilityCheck.student;

    const formSubmission = await FormSubmissions.create({
      formId,
      teacherId,
      submittedAt,
      answers: answers.map(ans => {
        return {
          ...ans,
          answer: ans.answer || "No Answer"
        }
      }),
    });

    submittedForStudent.$set({
      points: submittedForStudent.points + totalPoints,
    });
    await submittedForStudent.save();

    await PointsHistory.create({
      formId: form._id,
      formType: form.formType,
      formName: form.formName,
      formSubmissionId: formSubmission._id,
      submittedById: teacherId,
      submittedByName: teacher.name,
      submittedBySubject: teacher.subject || null,
      submittedForId: submittedFor,
      submittedForName: submittedForStudent.name,
      points: totalPoints,
      schoolId: teacher.schoolId,
      submittedAt,
    });

    if (form.formType == FormType.Feedback) {
      const feedback = answers.reduce((acc, curr) => acc + curr.answer, "");
      await Feedback.create({
        schoolId: teacher.schoolId,
        submittedById: teacherId,
        submittedByName: teacher.name,
        submittedForId: submittedFor,
        submittedForName: submittedForStudent.name,
        submittedBySubject: teacher.subject,
        feedback,
        createdAt: submittedAt
      });
    }

    if (school && teacher && submittedForStudent) {
      const leadTeacher = await Teacher.find({
        grade: submittedForStudent.grade,
        schoolId: teacher.schoolId,
      })
      emailGenerator(form, {
        points: totalPoints,
        submission: formSubmission,
        teacher: teacher,
        student: submittedForStudent,
        schoolAdmin: schoolAdmin,
        school: school,
        submittedAt: submittedAt,
        leadTeacher: leadTeacher[0] ?? null
      })
    }


    return res.status(200).json({
      message: "Form Submitted Successfully",
      formSubmission: formSubmission,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const submitFormAdmin = async (req, res) => {
  const formId = req.params.formId;
  const { submittedFor, answers, submittedAt } = req.body;
  const form = await Form.findById(formId);
  const totalPoints = answers.reduce((acc, curr) => acc + curr.points, 0);
  const schoolAdmin = await Admin.findById(req.user.id);
  const school = await School.findById(schoolAdmin.schoolId);

  try {
    // Check if student is eligible for form submission
    const eligibilityCheck = await checkStudentFormEligibility(submittedFor, form);
    if (!eligibilityCheck.eligible) {
      return res.status(403).json({
        message: eligibilityCheck.error
      });
    }

    const submittedForStudent = eligibilityCheck.student;

    const formSubmission = await FormSubmissions.create({
      formId,
      schoolAdminId: schoolAdmin._id,
      answers: answers.map(ans => {
        return {
          ...ans,
          answer: ans.answer || "No Answer"
        }
      }),
      submittedAt
    });

    submittedForStudent.$set({
      points: submittedForStudent.points + totalPoints,
    });
    await submittedForStudent.save();

    await PointsHistory.create({
      formId: form._id,
      formType: form.formType,
      formName: form.formName,
      formSubmissionId: formSubmission._id,
      submittedById: schoolAdmin._id,
      submittedByName: schoolAdmin.name,
      submittedBySubject: null,
      submittedForId: submittedFor,
      submittedForName: submittedForStudent.name,
      points: totalPoints,
      schoolId: schoolAdmin.schoolId,
      submittedAt
    });

    if (form.formType == FormType.Feedback) {
      const feedback = answers.reduce((acc, curr) => acc + curr.answer, "");
      await Feedback.create({
        schoolId: schoolAdmin.schoolId,
        submittedById: schoolAdmin._id,
        submittedByName: schoolAdmin.name,
        submittedForId: submittedFor,
        submittedForName: submittedForStudent.name,
        submittedBySubject: "System Manager",
        feedback,
        createdAt: submittedAt
      });
    }

    if (school && submittedForStudent) {
      const leadTeacher = await Teacher.find({
        grade: submittedForStudent.grade,
        schoolId: schoolAdmin.schoolId,
      })
      emailGenerator(form, {
        points: totalPoints,
        submission: formSubmission,
        teacher: schoolAdmin,
        student: submittedForStudent,
        submittedAt: submittedAt,
        schoolAdmin: schoolAdmin,
        school: school,
        leadTeacher: leadTeacher[0] ?? null
      })
    }


    return res.status(200).json({
      message: "Form Submitted Successfully",
      formSubmission: formSubmission,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const getPointHistory = async (req, res) => {
  try {
    console.log("=== getPointHistory DEBUG ===");
    console.log("User ID:", req.user.id);
    console.log("User role:", req.user.role);
    console.log("Query params:", req.query);

    const id = req.user.id;
    let user;

    // Get pagination parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    console.log("Pagination:", { page, limit, skip });

    // Query conditions
    let query = {};
    let totalCount;

    switch (req.user.role) {
      case Role.SchoolAdmin:
        user = await Admin.findById(id);
        query = { schoolId: user.schoolId };


        // Get total count for pagination
        totalCount = await PointsHistory.countDocuments(query);


        // Execute query with pagination
        const adminPointHistoryRaw = await PointsHistory.find(query)
          .populate("submittedForId")
          .populate({ path: "submittedById", select: "subject" })
          .sort({ submittedAt: -1 })  // Sort by newest first
          .skip(skip)
          .limit(limit);
        const adminPointHistory = adminPointHistoryRaw.map((doc) => ({
          ...doc.toObject(),
          submittedBySubject: doc.submittedBySubject || (doc.submittedById && doc.submittedById.subject) || null
        }))


        return res.status(200).json({
          pointHistory: adminPointHistory,
          pagination: {
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            itemsPerPage: limit
          }
        });

      case Role.Teacher:
        console.log("Processing Teacher role...");
        user = await Teacher.findById(id);
        console.log("Teacher found:", user);
        const grade = await getGradeFromUser(id);
        console.log("Grade data:", grade);

        if (!grade || !grade.studentIds) {
          console.log("ERROR: No students found for teacher");
          return res.status(404).json({ message: "No students found for this grade" });
        }

        query = {
          schoolId: user.schoolId,
          submittedForId: { $in: grade.studentIds }
        };

        console.log("Teacher Query:", query);
        console.log("Accessible student IDs:", grade.studentIds);

        // Get total count for pagination
        totalCount = await PointsHistory.countDocuments(query);
        console.log("Total Count:", totalCount);

        // Execute query with pagination
        const teacherPointHistoryRaw = await PointsHistory.find(query)
          .populate("submittedForId")
          .populate({ path: "submittedById", select: "name subject" })
          .sort({ submittedAt: -1 })  // Sort by newest first
          .skip(skip)
          .limit(limit);

        const teacherPointHistory = teacherPointHistoryRaw.map((doc) => ({
          ...doc.toObject(),
          submittedByName: doc.submittedByName || (doc.submittedById && doc.submittedById.name) || null,
          submittedBySubject: doc.submittedBySubject || (doc.submittedById && doc.submittedById.subject) || null
        }))

        console.log("Teacher point history results:", teacherPointHistory.length);
        console.log("Teacher point history sample:", teacherPointHistory.slice(0, 3));

        const response = {
          pointHistory: teacherPointHistory,
          pagination: {
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            itemsPerPage: limit
          }
        };

        console.log("Final response:", response);

        return res.status(200).json({
          pointHistory: teacherPointHistory,
          pagination: {
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            itemsPerPage: limit
          }
        });

      default:
        return res.status(403).json({ message: "Forbidden" });
    }
  } catch (error) {
    console.error("Error getting point history:", error);
    return res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};

export const getFilteredPointHistory = async (req, res) => {
  try {
    console.log("=== getPointHistory DEBUG ===");
    console.log("User ID:", req.user.id);
    console.log("User role:", req.user.role);
    console.log("Query params:", req.query);

    const id = req.user.id;
    let user;
    const { studentId } = req.query;

    // Query conditions
    let query = {};

    switch (req.user.role) {
      case Role.SchoolAdmin:
        user = await Admin.findById(id);
        query = { schoolId: user.schoolId, submittedForId: studentId };

        const adminPointHistoryRaw = await PointsHistory.find(query)
          .populate("submittedForId")
          .populate({ path: "submittedById", select: "subject" })
          .sort({ submittedAt: -1 });

        const adminPointHistory = adminPointHistoryRaw.map((doc) => ({
          ...doc.toObject(),
          submittedBySubject: doc.submittedBySubject || (doc.submittedById && doc.submittedById.subject) || null,
        }));

        return res.status(200).json({
          pointHistory: adminPointHistory,
        });

      case Role.Teacher:
        console.log("Processing Teacher role...");
        user = await Teacher.findById(id);
        console.log("Teacher found:", user);
        const grade = await getGradeFromUser(id);
        console.log("Grade data:", grade);

        if (!grade || !grade.studentIds) {
          console.log("ERROR: No students found for teacher");
          return res.status(404).json({ message: "No students found for this grade" });
        }

        query = {
          schoolId: user.schoolId,
          submittedForId: studentObjectId,
          submittedForId: { $in: grade.studentIds },
        };

        console.log("Teacher Query:", query);
        console.log("Accessible student IDs:", grade.studentIds);

        const teacherPointHistoryRaw = await PointsHistory.find(query)
          .populate("submittedForId")
          .populate({ path: "submittedById", select: "subject" })
          .sort({ submittedAt: -1 });

        const teacherPointHistory = teacherPointHistoryRaw.map((doc) => ({
          ...doc.toObject(),
          submittedBySubject: doc.submittedBySubject || (doc.submittedById && doc.submittedById.subject) || null,
        }));

        console.log("Teacher point history results:", teacherPointHistory.length);
        console.log("Teacher point history sample:", teacherPointHistory.slice(0, 3));

        return res.status(200).json({
          pointHistory: teacherPointHistory,
        });

      default:
        return res.status(403).json({ message: "Forbidden" });
    }
  } catch (error) {
    console.error("Error getting point history:", error);
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};
