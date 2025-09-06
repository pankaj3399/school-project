import School from "../models/School.js"
import Student from "../models/Student.js"
import bcrypt from "bcryptjs"
import {Role} from '../enum.js';
import Admin from "../models/Admin.js";
import Teacher from "../models/Teacher.js";

// Import the new error handling utilities
import asyncHandler from "../utils/asyncHandler.js";
import { createNotFoundError, createValidationError } from "../utils/errorResponse.js";

export const addStudent = asyncHandler(async (req, res, next) => {
    const {
        name,
        password,
        email,
        standard,
        parentEmail,
        sendNotifications,
        grade
    } = req.body;

    let user;

    if(req.user.role == Role.Teacher){
        user = await Teacher.findById(req.user.id);
    } else {
        user = await Admin.findById(req.user.id);
    }

    if (!user) {
        return next(createNotFoundError("User not found"));
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    const student = await Student.create({
        name,
        password: hashedPassword,
        standard,
        email,
        role: Role.Student,
        parentEmail,
        sendNotifications,
        schoolId: user.schoolId,
        grade
    });

    await School.findOneAndUpdate({
        _id: user.schoolId
    }, {
        $push:{
            students: student._id
        }
    });

    return res.status(200).json({
        success: true,
        message: "Student Added successfully",
        data: student
    });
});

export const updateStudent = asyncHandler(async (req, res, next) => {
    const studentId = req.params.id;
    const { name, email, standard, parentEmail, sendNotifications, grade } = req.body;

    const updatedStudent = await Student.findByIdAndUpdate(studentId, {
        $set: { name, email, standard, parentEmail, sendNotifications, grade }
    }, { new: true });

    if (!updatedStudent) {
        return next(createNotFoundError("Student not found"));
    }

    return res.status(200).json({ 
        success: true,
        message: 'Student updated successfully', 
        data: updatedStudent 
    });
});

export const deleteStudent = asyncHandler(async (req, res, next) => {
    const studentId = req.params.id;

    const deletedStudent = await Student.findByIdAndDelete(studentId);

    if (!deletedStudent) {
        return next(createNotFoundError("Student not found"));
    }

    await School.updateMany(
        { students: studentId },
        { $pull: { students: studentId } }
    );

    return res.status(200).json({ 
        success: true,
        message: 'Student deleted successfully' 
    });
});
