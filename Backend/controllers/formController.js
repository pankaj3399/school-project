//b
import { Role } from "../enum.js";
import Admin from "../models/Admin.js";
import Form from "../models/Form.js";
import FormSubmissions from "../models/FormSubmissions.js";
import PointsHistory from "../models/PointsHistory.js";
import School from "../models/School.js";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import { emailGenerator } from "../utils/emailHelper.js";
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
    grade
  } = req.body;
  const id = req.user.id;
  let school;
  if(req.user.role == Role.Teacher){
    const user = await Teacher.findById(id)
    school = await School.findById(user.schoolId)
  }else{
    school = await School.findOne({ createdBy: id });
  }
  try {
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
    if(req.user.role == Role.Teacher){
      if(user.type == "Special"){
        forms = await Form.find({ 
          schoolId: user.schoolId,
        });
      }else{
        forms = await Form.find({
          schoolId: user.schoolId,
          $or: [
            { isSpecial: true },
            {grade: user.grade}
          ]
        });
      }
    }else{
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
  const submittedForStudent = await Student.findById(submittedFor);
  const totalPoints = answers.reduce((acc, curr) => acc + curr.points, 0);
  const school = await School.findById(teacher.schoolId);
  const schoolAdmin = await Admin.findById(school.createdBy);

  try {
    const formSubmission = await FormSubmissions.create({
      formId,
      teacherId,
      submittedAt,
      answers: answers.map(ans => {return {
        ...ans,
        answer: ans.answer || "No Answer"
      }}),
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
      submittedAt
    });

    if (school && teacher && submittedForStudent) {
      emailGenerator(form, {
        points: totalPoints,
        submission: formSubmission,
        teacher: teacher,
        student: submittedForStudent,
        schoolAdmin: schoolAdmin,
        school: school
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
  const submittedForStudent = await Student.findById(submittedFor);
  const totalPoints = answers.reduce((acc, curr) => acc + curr.points, 0);
  const schoolAdmin = await Admin.findById(req.user.id);
  const school = await School.findById(schoolAdmin.schoolId);

  try {
    const formSubmission = await FormSubmissions.create({
      formId,
      schoolAdminId: schoolAdmin._id,
      answers: answers.map(ans => {return {
        ...ans,
        answer: ans.answer || "No Answer"
      }}),
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

    if (school && submittedForStudent) {
      emailGenerator(form, {
        points: totalPoints,
        submission: formSubmission,
        teacher: schoolAdmin,
        student: submittedForStudent,
        schoolAdmin: schoolAdmin,
        school: school
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

//b
export const getPointHistory = async (req, res) => {
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
  const pointHistory = await PointsHistory.find({ schoolId: user.schoolId }).populate("submittedForId");
  return res.status(200).json({ pointHistory });
};