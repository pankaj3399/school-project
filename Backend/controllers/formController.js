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

// Import the new error handling utilities
import asyncHandler from "../utils/asyncHandler.js";
import { createNotFoundError, createValidationError } from "../utils/errorResponse.js";

const getGradeFromUser = async (userId) => {
    const admin = await Admin.findById(userId);
    if (admin) {
        return null;
    }
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

export const createForm = asyncHandler(async (req, res, next) => {
  const {
    formName,
    formType,
    questions,
    studentEmail = false,
    teacherEmail = false,
    schoolAdminEmail = false,
    parentEmail = false,
    isSpecial,
    grade
  } = req.body;
  const id = req.user.id;
  let school;

  if(req.user.role == Role.Teacher){
    const user = await Teacher.findById(id);
    if (!user) {
      return next(createNotFoundError("Teacher not found"));
    }
    school = await School.findById(user.schoolId);
    if (!school) {
      return next(createNotFoundError("School not found for teacher"));
    }
  } else {
    school = await School.findOne({ createdBy: id });
    if (!school) {
      return next(createNotFoundError("School not found for admin"));
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
    isSpecial
  });

  return res.status(200).json({
    success: true,
    message: "Form Created Successfully",
    data: form,
  });
});

export const editForm = asyncHandler(async (req, res, next) => {
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

  if (!form) {
    return next(createNotFoundError("Form not found"));
  }

  return res.status(200).json({
    success: true,
    message: "Form Edited Successfully",
    data: form,
  });
});

export const getForms = asyncHandler(async (req, res, next) => {
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
      return next(createValidationError("Forbidden"));
  }

  if (!user) {
    return next(createNotFoundError("User not found"));
  }

  const schoolId = user.schoolId;

  let forms = [];

  if(req.user.role == Role.Teacher){
    if(user.type == "Special"){
      forms = await Form.find({ 
        schoolId: user.schoolId,
      });
      forms = forms.filter(form => form.formType != FormType.PointWithdraw && form.formType != FormType.DeductPoints);
    }else{
      forms = await Form.find({
        schoolId: user.schoolId,
        $or: [
          { isSpecial: true },
          {grade: user.grade}
        ]
      });
    }
  } else {
    forms = await Form.find({ schoolId });
  }

  return res.status(200).json({
    success: true,
    message: "Forms Fetched Successfully",
    data: forms,
  });
});

export const getFormById = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const form = await Form.findById(id);

  if (!form) {
    return next(createNotFoundError("Form not found"));
  }

  return res.status(200).json({
    success: true,
    data: form,
  });
});

export const deleteForm = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const form = await Form.findByIdAndDelete(id);

  if (!form) {
    return next(createNotFoundError("Form doesn't exist"));
  }

  return res.status(200).json({
    success: true,
    data: { formName: form.formName },
  });
});

export const submitFormTeacher = asyncHandler(async (req, res, next) => {
  const formId = req.params.formId;
  const { submittedFor, answers, submittedAt } = req.body;
  const teacherId = req.user.id;
  const teacher = await Teacher.findById(teacherId);
  const form = await Form.findById(formId);

  if (!teacher) {
    return next(createNotFoundError("Teacher not found"));
  }

  if (!form) {
    return next(createNotFoundError("Form not found"));
  }

  const totalPoints = answers.reduce((acc, curr) => acc + curr.points, 0);
  const school = await School.findById(teacher.schoolId);
  const schoolAdmin = await Admin.findById(school.createdBy);

  const eligibilityCheck = await checkStudentFormEligibility(submittedFor, form);
  if (!eligibilityCheck.eligible) {
    return next(createValidationError(eligibilityCheck.error));
  }

  const submittedForStudent = eligibilityCheck.student;

  const formSubmission = await FormSubmissions.create({
    formId,
    teacherId,
    submittedAt,
    answers: answers.map(ans => ({
      ...ans,
      answer: ans.answer || "No Answer"
    })),
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
    submittedForId: submittedFor,
    submittedForName: submittedForStudent.name,
    points: totalPoints,
    schoolId: teacher.schoolId,
    submittedAt,
  });

  if(form.formType == FormType.Feedback){
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
    });
    emailGenerator(form, {
      points: totalPoints,
      submission: formSubmission,
      teacher: teacher,
      student: submittedForStudent,
      schoolAdmin: schoolAdmin,
      school: school,
      submittedAt: submittedAt,
      leadTeacher: leadTeacher[0] ?? null
    });
  }

  return res.status(200).json({
    success: true,
    message: "Form Submitted Successfully",
    data: { formSubmission },
  });
});

export const submitFormAdmin = asyncHandler(async (req, res, next) => {
  const formId = req.params.formId;
  const { submittedFor, answers, submittedAt } = req.body;
  const form = await Form.findById(formId);
  const totalPoints = answers.reduce((acc, curr) => acc + curr.points, 0);
  const schoolAdmin = await Admin.findById(req.user.id);
  const school = await School.findById(schoolAdmin.schoolId);

  if (!form) {
    return next(createNotFoundError("Form not found"));
  }

  if (!schoolAdmin) {
    return next(createNotFoundError("School admin not found"));
  }

  const eligibilityCheck = await checkStudentFormEligibility(submittedFor, form);
  if (!eligibilityCheck.eligible) {
    return next(createValidationError(eligibilityCheck.error));
  }

  const submittedForStudent = eligibilityCheck.student;

  const formSubmission = await FormSubmissions.create({
    formId,
    schoolAdminId: schoolAdmin._id,
    answers: answers.map(ans => ({
      ...ans,
      answer: ans.answer || "No Answer"
    })),
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
    submittedForId: submittedFor,
    submittedForName: submittedForStudent.name,
    points: totalPoints,
    schoolId: schoolAdmin.schoolId,
    submittedAt
  });

  if(form.formType == FormType.Feedback){
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
    });
    emailGenerator(form, {
      points: totalPoints,
      submission: formSubmission,
      teacher: schoolAdmin,
      student: submittedForStudent,
      submittedAt: submittedAt,
      schoolAdmin: schoolAdmin,
      school: school,
      leadTeacher: leadTeacher[0] ?? null
    });
  }

  return res.status(200).json({
    success: true,
    message: "Form Submitted Successfully",
    data: { formSubmission },
  });
});

export const getPointHistory = asyncHandler(async (req, res, next) => {
  const id = req.user.id;
  let user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  let query = {};
  let totalCount;

  switch (req.user.role) {
    case Role.SchoolAdmin:
      user = await Admin.findById(id);
      if (!user) {
        return next(createNotFoundError("User not found"));
      }
      query = { schoolId: user.schoolId };
      totalCount = await PointsHistory.countDocuments(query);
      const adminPointHistory = await PointsHistory.find(query)
        .populate("submittedForId")
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit);

      return res.status(200).json({
        success: true,
        pointHistory: adminPointHistory,
        pagination: {
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          itemsPerPage: limit
        }
      });

    case Role.Teacher:
      user = await Teacher.findById(id);
      if (!user) {
        return next(createNotFoundError("User not found"));
      }
      const grade = await getGradeFromUser(id);
      if (!grade || !grade.studentIds) {
        return next(createNotFoundError("No students found for this grade"));
      }
      query = {
        schoolId: user.schoolId,
        submittedForId: { $in: grade.studentIds }
      };
      totalCount = await PointsHistory.countDocuments(query);
      const teacherPointHistory = await PointsHistory.find(query)
        .populate("submittedForId")
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit);

      return res.status(200).json({
        success: true,
        pointHistory: teacherPointHistory,
        pagination: {
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          itemsPerPage: limit
        }
      });

    default:
      return next(createValidationError("Forbidden"));
  }
});
