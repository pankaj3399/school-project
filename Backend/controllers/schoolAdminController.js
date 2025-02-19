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
import { reportEmailGenerator } from "../utils/emailHelper.js"

const getSchoolIdFromUser = async (userId) => {
    // Try finding user as admin first
    const admin = await Admin.findById(userId);
    if (admin) {
        return admin.schoolId
    }

    // If not admin, try finding as teacher
    const teacher = await Teacher.findById(userId);
    if (teacher) {
        return teacher.schoolId;
    }

    throw new Error('User not authorized');
};

export const addSchool = async (req, res) => {
    const { name, address, district, state, country } = req.body;
    const logo = req.file;
    try {
      const existingSchool = await School.findOne({ createdBy: req.user.id });
      if (existingSchool) {
        return res.status(403).json({ message: "School already exists for this admin." });
      }
      const logoUrl = await uploadImageFromDataURI(logo);
      const newSchool = await School.create({ name, address,district, logo: logoUrl, createdBy: req.user.id, state, country });
  
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
        subject,
        grade,
        type
    } = req.body

    try{
        const hashedPassword = await bcrypt.hash(password, 12)
        
        const teacher = await Teacher.create({
            name,
            email,
            password: hashedPassword,
            subject,
            role: Role.Teacher,
            grade,
            type
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
        standard,
        grade
    } = req.body

    try{
        const hashedPassword = await bcrypt.hash(password, 12)
        
        const student = await Student.create({
            name,
            password: hashedPassword,
            standard,
            email,
            role: Role.Student,
            grade
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

        const totalPointsAndFeedbackCount = await PointsHistory.aggregate([
            { 
                $match: { schoolId } // Filter by schoolId 
            },
            { 
                $group: { 
                    _id: null, 
                    totalNegativePoints: { 
                        $sum: { $cond: [ { $lt: ["$points", 0] }, "$points", 0 ] } // Sum only negative points 
                    },
                    feedbackCount: { 
                        $sum: { $cond: [ { $eq: ["$formType", "Feedback"] }, 1, 0 ] } // Count formType as "Feedback"
                    }
                } 
            }
        ]);
        

        const totalPoints = totalPointsData.length > 0 ? totalPointsData[0].totalPoints : 0;
        const totalOopsiePoints = totalPointsAndFeedbackCount.length > 0 ? totalPointsAndFeedbackCount[0].totalNegativePoints : 0;
        const totalFeedbackCount = totalPointsAndFeedbackCount.length > 0 ? totalPointsAndFeedbackCount[0].feedbackCount : 0;

        
        return res.status(200).json({
            totalTeachers,
            totalStudents,
            totalPoints,
            totalOopsiePoints,
            totalFeedbackCount
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

export const getMonthlyStats = async (req, res) => {
    try {
        const id = req.user.id; // Get the authenticated user's ID

        // Find the school admin by ID to extract the schoolId
        const schoolAdmin = await Admin.findById(id);
        if (!schoolAdmin) {
            return res.status(404).json({ message: "School admin not found" });
        }

        const schoolId = schoolAdmin.schoolId;


        // Calculate monthly stats from the PointHistory model
        const monthlyStats = await PointsHistory.aggregate([
            { 
                $match: { schoolId } // Filter by schoolId 
            },
            { 
                $group: { 
                    _id: { 
                        year: { $year: "$createdAt" }, // Group by year
                        month: { $month: "$createdAt" } // Group by month
                    },
                    totalPoints: { $sum: "$points" }, // Total points
                    totalNegativePoints: { 
                        $sum: { $cond: [ { $lt: ["$points", 0] }, "$points", 0 ] } // Sum only negative points 
                    },
                    feedbackCount: { 
                        $sum: { $cond: [ { $eq: ["$formType", "Feedback"] }, 1, 0 ] } // Count formType as "Feedback"
                    }
                } 
            },
            { 
                $sort: { "_id.year": -1, "_id.month": -1 } // Sort by year and month (descending)
            }
        ]);

        // Format the response
        const formattedMonthlyStats = monthlyStats.map(stat => ({
            year: stat._id.year,
            month: stat._id.month,
            totalPoints: stat.totalPoints,
            totalNegativePoints: stat.totalNegativePoints,
            feedbackCount: stat.feedbackCount
        }));

        return res.status(200).json({
            monthlyStats: formattedMonthlyStats
        });
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export const sendReport = async (req, res) => {
    try {
        const { email } = req.params;
        // The file should be available in req.files or req.file depending on your middleware
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // Now file data is properly available
        const fileData = {
            buffer: file.buffer, // Binary data of the file
            originalname: file.originalname,
            mimetype: file.mimetype
        };

        await reportEmailGenerator(fileData.buffer, fileData.originalname, email);
        return res.status(200).json({ message: "Report sent successfully" });
    } catch (error) {
        console.error("Error in sendReport:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
}

export const resetStudentRoster = async (req, res) => {
    try {
        const schoolId = await getSchoolIdFromUser(req.user.id);
        await PointsHistory.deleteMany({
            schoolId,
        });
        await Student.deleteMany({
            schoolId
        })
        return res.status(200).json({ message: "Student roster reset successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
}