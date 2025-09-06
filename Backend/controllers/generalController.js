import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import User from "../models/Admin.js";
import {Role} from '../enum.js';

// Import the new error handling utilities
import asyncHandler from "../utils/asyncHandler.js";
import { createNotFoundError } from "../utils/errorResponse.js";

export const getCurrentUser = asyncHandler(async (req, res, next) => {
    let user;
    
    switch(req.user.role) {
        case Role.Student: 
            user = await Student.findById(req.user.id).populate('schoolId');
            break;
        case Role.Teacher: 
            user = await Teacher.findById(req.user.id).populate('schoolId');
            break;
        default: 
            user = await User.findById(req.user.id).populate('schoolId');
            break;
    }
    
    if(!user) {
        return next(createNotFoundError("User not found"));
    }
    
    return res.status(200).json({
        success: true,
        data: user
    });
});
