import { Role } from "../enum.js";
import School from "../models/School.js";
import { uploadImageFromDataURI } from "../utils/cloudinary.js"
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import Admin from "../models/Admin.js";

// Import the new error handling utilities
import asyncHandler from "../utils/asyncHandler.js";
import { createNotFoundError, createValidationError } from "../utils/errorResponse.js";

export const getAllSchools = asyncHandler(async (req, res, next) => {
  const schools = await School.find();
  res.status(200).json({ 
    success: true,
    message: "Schools fetched successfully", 
    data: schools 
  });
});

export const getStudents = asyncHandler(async (req, res, next) => {
  let students = [];
  
  if(req.user.role === Role.Teacher) {
    const teacher = await Teacher.findById(req.user.id);
    if (!teacher) {
      return next(createNotFoundError("Teacher not found"));
    }
    
    if(teacher.type === 'Lead') {
      // Lead teachers only see their grade's students
      students = await Student.find({ 
        schoolId: teacher.schoolId,
        grade: teacher.grade 
      });
    } else {
      // Special teachers see all students
      students = await Student.find({ schoolId: teacher.schoolId });
    }
  } else {
    // School admin sees all students
    const school = await School.findOne({ createdBy: req.user.id });
    if(school) {
      students = await Student.find({ schoolId: school._id });
    }
  }
  
  return res.status(200).json({ 
    success: true,
    data: students 
  });
});

export const getTeachers = asyncHandler(async (req, res, next) => {
  let teachers = [];
  const school = await School.findOne({ createdBy: req.user.id });
  
  if (!school) {
    return next(createNotFoundError("School not found"));
  }
  
  teachers = await Teacher.find({ schoolId: school._id });
  
  return res.status(200).json({ 
    success: true,
    data: teachers 
  });
});

export const getCurrentSchool = asyncHandler(async (req, res, next) => {
  let sch;
  
  switch(req.user.role) {
    case Role.Teacher:
      const teacher = await Teacher.findById(req.user.id);
      if (!teacher) {
        return next(createNotFoundError("Teacher not found"));
      }
      sch = await School.findOne({ _id: teacher.schoolId }).populate('createdBy');
      break;
    case Role.SchoolAdmin:
      sch = await School.findOne({ createdBy: req.user.id }).populate('createdBy');
      break;
  }

  if (!sch) {
    return next(createNotFoundError('School not found'));
  }
  
  return res.status(200).json({ 
    success: true,
    data: sch 
  });
});

export const updateSchool = asyncHandler(async (req, res, next) => {
  const { name, address, district, state, country, timeZone, domain } = req.body;
  const logo = req.file;

  let logoUrl = null;
  if(logo) {
    logoUrl = await uploadImageFromDataURI(logo);
  }
  
  let updatedSchool;
  if(logoUrl) {
    updatedSchool = await School.findByIdAndUpdate(
      req.params.id,
      { name, address, district, logo: logoUrl, state, country, timeZone, domain },
      { new: true }
    ).populate('createdBy');
  } else {
    updatedSchool = await School.findByIdAndUpdate(
      req.params.id,
      { name, address, district, state, country, timeZone, domain },
      { new: true }
    ).populate('createdBy');
  }

  if (!updatedSchool) {
    return next(createNotFoundError("School not found"));
  }

  res.status(200).json({ 
    success: true,
    message: "School updated successfully", 
    data: updatedSchool 
  });
});

export const deleteSchool = asyncHandler(async (req, res, next) => {
  const school = await School.findByIdAndDelete(req.params.id);
  
  if(!school) {
    return next(createNotFoundError('School not found'));
  }
  
  await Admin.findByIdAndUpdate(school.createdBy, {
    schoolId: null
  });
  
  return res.status(200).json({
    success: true,
    message:"School Deleted Successfully",
    data: school
  });
});

export const promote = asyncHandler(async (req, res, next) => {
  const id = req.user.id;
  let school;
  
  // Get school based on user role
  if(req.user.role === Role.Teacher) {
    const user = await Teacher.findById(id);
    if (!user) {
      return next(createNotFoundError("Teacher not found"));
    }
    school = await School.findById(user.schoolId);
  } else {
    school = await School.findOne({ createdBy: id });
  }

  if(!school) {
    return next(createNotFoundError('School not found'));
  }

  // Get all students except those in grade 12
  const students = await Student.find({ 
    schoolId: school._id,
    grade: { $lt: 12 } 
  });

  // Promote students
  await Student.updateMany(
    { 
      _id: { $in: students.map(s => s._id) },
      grade: { $lt: 12 }
    },
    { $inc: { grade: 1 } }
  );

  return res.status(200).json({
    success: true,
    message: "Students promoted successfully",
    data: {
      promotedCount: students.length
    }
  });
});
