//b
import School from "../models/School.js"
import User from "../models/Admin.js"
import bcrypt from "bcryptjs"
import Teacher from "../models/Teacher.js"
import Student from "../models/Student.js"
import {Role} from '../enum.js';
import { uploadImageFromDataURI } from "../utils/cloudinary.js"
import Admin from "../models/Admin.js"
import PointsHistory from "../models/PointsHistory.js"
import mongoose from "mongoose"

export const addSchool = async (req, res) => {
    const { name, address } = req.body;
    const logo = req.file;
    try {
      const existingSchool = await School.findOne({ createdBy: req.user.id });
      if (existingSchool) {
        return res.status(403).json({ message: "School already exists for this admin." });
      }
      const logoUrl = await uploadImageFromDataURI(logo);
      const newSchool = await School.create({ name, address, logo: logoUrl, createdBy: req.user.id });
  
      await User.findByIdAndUpdate(req.user.id, { schoolId: newSchool._id });
  
      res.status(201).json({ message: "School created successfully", school: newSchool });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
export const addTeacher = async (req, res) => {
    const {
        name,
        password,
        email,
        subject
    } = req.body

    try{
        const hashedPassword = await bcrypt.hash(password, 12)
        
        const teacher = await Teacher.create({
            name,
            email,
            password: hashedPassword,
            subject,
            role: Role.Teacher
        })
        await School.findOneAndUpdate({
            createdBy: req.user.id
        }, {
            $push:{
                teachers:teacher._id
            }
        })
        return res.status(200).json({
            message: "Teacher Added successfully"
        })
    }catch(error){
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
}

export const addStudent = async (req, res) => {
    const {
        name,
        password,
        email,
        standard
    } = req.body

    console.log(email);
    try{
        const hashedPassword = await bcrypt.hash(password, 12)
        
        const student = await Student.create({
            name,
            password: hashedPassword,
            standard,
            email,
            role: Role.Student
        })
        await School.findOneAndUpdate({
            createdBy: req.user.id
        }, {
            $push:{
                students:student._id
            }
        })
        return res.status(200).json({
            message: "Student Added successfully"
        })
    }catch(error){
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
}

export const getStats = async (req, res) => {
    try {
        const id = req.user.id; // Get the authenticated user's ID

        // Find the school admin by ID to extract the schoolId
        const schoolAdmin = await Admin.findById(id);
        if (!schoolAdmin) {
            return res.status(404).json({ message: "School admin not found" });
        }

        const schoolId = schoolAdmin.schoolId;

        // Count total teachers and students associated with the schoolId
        const totalTeachers = await Teacher.countDocuments({ schoolId });
        const totalStudents = await Student.countDocuments({ schoolId });

        // Calculate the total points from the PointHistory model
        const totalPointsData = await PointsHistory.aggregate([
            { $match: { schoolId } }, // Filter by schoolId
            { $group: { _id: null, totalPoints: { $sum: "$points" } } } // Sum the points
        ]);

        const totalPoints = totalPointsData.length > 0 ? totalPointsData[0].totalPoints : 0;

        // Return the stats
        return res.status(200).json({
            totalTeachers,
            totalStudents,
            totalPoints
        });
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};



export const getPointsReceivedPerMonth = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Validate student existence
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Aggregate points received by the student per month
        const pointsData = await PointsHistory.aggregate([
            { $match: { submittedForId: new mongoose.Types.ObjectId(studentId) } },
            {
                $group: {
                    _id: { $month: "$submittedAt" },
                    totalPoints: { $sum: "$points" }
                }
            }
        ]);

        // Create an array of 12 months with default 0 points
        const monthlyPoints = Array(12).fill(0);
        pointsData.forEach(data => {
            monthlyPoints[data._id - 1] = data.totalPoints; // Month index is 0-based
        });

        return res.status(200).json({ monthlyPoints });
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export const getPointsGivenPerMonth = async (req, res) => {
    try {
        const id = req.user.id; // Get the authenticated user's ID

        // Find the school admin by ID to extract the schoolId
        const schoolAdmin = await Admin.findById(id);
        if (!schoolAdmin) {
            return res.status(404).json({ message: "School admin not found" });
        }

        const schoolId = schoolAdmin.schoolId;

        // Aggregate points given by the teacher per month
        const pointsData = await PointsHistory.aggregate([
            { $match: { schoolId: new mongoose.Types.ObjectId(schoolId) } },
            {
                $group: {
                    _id: { $month: "$submittedAt" },
                    totalPoints: { $sum: "$points" }
                }
            }
        ]);

        // Create an array of 12 months with default 0 points
        const monthlyPoints = Array(12).fill(0);
        pointsData.forEach(data => {
            monthlyPoints[data._id - 1] = data.totalPoints; // Month index is 0-based
        });

        return res.status(200).json({ monthlyPoints });
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export const getPointsGivenPerMonthPerTeacher = async (req, res) => {
    try {
        const { teacherId } = req.params;

        // Validate teacher existence
        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }

        // Aggregate points given by the teacher per month
        const pointsData = await PointsHistory.aggregate([
            { $match: { submittedById:new mongoose.Types.ObjectId(teacherId) } },
            {
                $group: {
                    _id: { $month: "$submittedAt" },
                    totalPoints: { $sum: "$points" }
                }
            }
        ]);

        // Create an array of 12 months with default 0 points
        const monthlyPoints = Array(12).fill(0);
        pointsData.forEach(data => {
            monthlyPoints[data._id - 1] = data.totalPoints; // Month index is 0-based
        });

        return res.status(200).json({ monthlyPoints });
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};



export const getFormsSubmittedPerMonth = async (req, res) => {
    try {
        const id = req.user.id; // Get the authenticated user's ID

        // Find the school admin by ID to extract the schoolId
        const schoolAdmin = await Admin.findById(id);
        if (!schoolAdmin) {
            return res.status(404).json({ message: "School admin not found" });
        }

        const schoolId = schoolAdmin.schoolId;
        // Aggregate form submissions by the teacher per month
        const formsData = await PointsHistory.aggregate([
            { $match: { schoolId: new mongoose.Types.ObjectId(schoolId) } },
            {
                $group: {
                    _id: { $month: "$submittedAt" }, // Group by month
                    formCount: { $count: {} } // Count the number of submissions
                }
            }
        ]);

        // Create an array of 12 months with default 0 counts
        const monthlyForms = Array(12).fill(0);
        formsData.forEach(data => {
            monthlyForms[data._id - 1] = data.formCount; // Month index is 0-based
        });

        return res.status(200).json({ monthlyForms });
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export const getFormsSubmittedPerMonthPerTeacher = async (req, res) => {
    try {
        const { teacherId } = req.params;

        // Validate teacher existence
        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }

        // Aggregate form submissions by the teacher per month
        const formsData = await PointsHistory.aggregate([
            { $match: { submittedById: new mongoose.Types.ObjectId(teacherId) } },
            {
                $group: {
                    _id: { $month: "$submittedAt" }, // Group by month
                    formCount: { $count: {} } // Count the number of submissions
                }
            }
        ]);

        // Create an array of 12 months with default 0 counts
        const monthlyForms = Array(12).fill(0);
        formsData.forEach(data => {
            monthlyForms[data._id - 1] = data.formCount; // Month index is 0-based
        });

        return res.status(200).json({ monthlyForms });
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

