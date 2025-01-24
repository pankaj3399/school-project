import PointsHistory from '../models/PointsHistory.js';
import mongoose from 'mongoose';
import School from '../models/School.js';
import Teacher from '../models/Teacher.js';
import Student from "../models/Student.js";

// Helper function to get the start of the educational year
const getEducationalYearStart = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const octFirst = new Date(currentYear, 9, 1); // October is 9 in zero-indexed months

    // If current date is before Oct 1, use previous year's start
    return currentDate < octFirst 
        ? new Date(currentYear - 1, 9, 1)
        : octFirst;
};

// 1. Whole Year Points History Controller
export const getYearPointsHistory = async (req, res) => {
    try {
        const adminId = req.user.id

        const school = await School.findOne({ createdBy: adminId });

        if(!school) {
            return res.status(404).json({ message: 'School not found' });
        }

        const schoolId = school._id;
        
        
        const yearStart = getEducationalYearStart();
        const today = new Date();

        const pointsHistory = await PointsHistory.aggregate([
            
            {
                $match: {
                    schoolId: new mongoose.Types.ObjectId(schoolId),
                    submittedAt: { 
                        $gte: yearStart, 
                        $lte: today 
                    }
                }
            },
           
            {
                $group: {
                    _id: {
                        month: { $month: '$submittedAt' },
                        year: { $year: '$submittedAt' }
                    },
                    monthName: { 
                        $first: { 
                            $switch: { 
                                branches: [
                                    { case: { $eq: [{ $month: '$submittedAt' }, 10] }, then: 'Oct' },
                                    { case: { $eq: [{ $month: '$submittedAt' }, 11] }, then: 'Nov' },
                                    { case: { $eq: [{ $month: '$submittedAt' }, 12] }, then: 'Dec' },
                                    { case: { $eq: [{ $month: '$submittedAt' }, 1] }, then: 'Jan' },
                                    { case: { $eq: [{ $month: '$submittedAt' }, 2] }, then: 'Feb' },
                                    { case: { $eq: [{ $month: '$submittedAt' }, 3] }, then: 'Mar' },
                                    { case: { $eq: [{ $month: '$submittedAt' }, 4] }, then: 'Apr' },
                                    { case: { $eq: [{ $month: '$submittedAt' }, 5] }, then: 'May' }
                                ],
                                default: 'Unknown'
                            }
                        }
                    },
                    avgDeductedPoints: { 
                        $avg: { 
                            $cond: [{ $eq: ['$formType', 'DeductPoints'] }, '$points', 0] 
                        } 
                    },
                    avgAwardedPoints: { 
                        $avg: { 
                            $cond: [{ $eq: ['$formType', 'AwardPoints'] }, '$points', 0] 
                        } 
                    },
                    avgWithdrawPoints: { 
                        $avg: { 
                            $cond: [{ $eq: ['$formType', 'PointWithdraw'] }, '$points', 0] 
                        } 
                    },
                    totalPoints: { $sum: '$points' },
                    days: {
                        $push: {
                            day: { $dayOfMonth: '$submittedAt' },
                            formType: '$formType',
                            points: '$points'
                        }
                    }
                }
            },
            // Sort by month
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            // Project final output format
            {
                $project: {
                    month: '$monthName',
                    avgDeductedPoints: { $abs: '$avgDeductedPoints' },
                    avgAwardedPoints: '$avgAwardedPoints',
                    avgWithdrawPoints: '$avgWithdrawPoints',
                    days: '$days'
                }
            }
        ]);

        res.status(200).json({ data: pointsHistory });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const getWeekPointsHistory = async (req, res) => {
    try {
        const adminId = req.user.id

        const school = await School.findOne({ createdBy: adminId });

        if(!school) {
            return res.status(404).json({ message: 'School not found' });
        }

        const schoolId = school._id;

        const { startDate, formType } = req.body;

        const start = startDate ? new Date(startDate) : new Date();
        
        const weekStart = new Date(start);
        weekStart.setDate(start.getDate() - start.getDay());
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        

        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        const weekPoints = await PointsHistory.aggregate([
            {
                $match: {
                    schoolId: new mongoose.Types.ObjectId(schoolId),
                    formType: formType,
                    submittedAt: { 
                        $gte: weekStart, 
                        $lte: weekEnd 
                    }
                }
            },
            {
                $group: {
                    _id: { $dayOfWeek: '$submittedAt' },
                    points: { $sum: '$points' }
                }
            },
            {
                $project: {
                    _id: 0,
                    day: { $arrayElemAt: [daysOfWeek, { $subtract: ['$_id', 1] }] },
                    points: 1
                }
            },
            { $sort: { day: 1 } }
        ]);

        res.status(200).json({ data: weekPoints });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const getHistoricalPointsData = async (req, res) => {
    try {
        const adminId = req.user.id

        const school = await School.findOne({ createdBy: adminId });

        if(!school) {
            return res.status(404).json({ message: 'School not found' });
        }

        const schoolId = school._id;
        const { period, formType } = req.body;
        const today = new Date();
        let startDate;

        switch(period) {
            case '1W':
                startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '1M':
                startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '3M':
                startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '6M':
                startDate = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000);
                break;
            case '1Y':
                startDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                return res.status(400).json({ message: 'Invalid period specified' });
        }

        const historicalPoints = await PointsHistory.aggregate([
            {
                $match: {
                    schoolId: new mongoose.Types.ObjectId(schoolId),
                    formType: formType,
                    submittedAt: { 
                        $gte: startDate, 
                        $lte: today 
                    }
                }
            },
            {
                $group: {
                    _id: { 
                        year: { $year: '$submittedAt' },
                        month: { $month: '$submittedAt' },
                        day: { $dayOfMonth: '$submittedAt' }
                    },
                    points: { $sum: '$points' }
                }
            },
            {
                $project: {
                    _id: 0,
                    day: { 
                        $dateToString: { 
                            format: "%Y-%m-%d", 
                            date: {
                                $dateFromParts: {
                                    year: "$_id.year",
                                    month: "$_id.month",
                                    day: "$_id.day"
                                }
                            }
                        }
                    },
                    points: 1
                }
            },
            { $sort: { day: 1 } }
        ]);
        const historicalPointsHistory = await PointsHistory.aggregate([
            {
                $match: {
                    schoolId: new mongoose.Types.ObjectId(schoolId),
                    formType: formType,
                    submittedAt: { 
                        $gte: new Date(startDate.getTime() + 24 * 60 * 60 * 1000), 
                        $lte: today 
                    }
                }
            }
        ]);

        res.status(200).json({ data: historicalPoints, history: historicalPointsHistory, startDate });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPointsByTeacher = async (req, res) => {
    try {
        const adminId = req.user.id

        const school = await School.findOne({ createdBy: adminId });

        if(!school) {
            return res.status(404).json({ message: 'School not found' });
        }

        const schoolId = school._id;
        const teachers = await Teacher.find({ schoolId: school._id });
        const teacherNames = teachers.map(teacher => teacher.name);

        const pointsByTeacher = await PointsHistory.aggregate([
            {
                $match: {
                    schoolId: new mongoose.Types.ObjectId(schoolId),
                    formType:'AwardPoints',
                }
            },
            {
                $group: {
                    _id: '$submittedByName',
                    totalPoints: { $sum: '$points' }
                }
            }
        ]);

        teacherNames.forEach(teacher => {
            if(!pointsByTeacher.find(point => point._id === teacher)) {
                pointsByTeacher.push({ _id: teacher, totalPoints: 0 });
            }
        })

        res.status(200).json({ data: pointsByTeacher });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getPointsByStudent = async (req, res) => {
    try {
        const adminId = req.user.id

        const school = await School.findOne({ createdBy: adminId });

        if(!school) {
            return res.status(404).json({ message: 'School not found' });
        }

      
        const students = await Student.find({ schoolId: school._id });

        
        const studentNames = students.map(student => student.name);

        const schoolId = school._id;

        const pointsByStudent = await PointsHistory.aggregate([
            {
                $match: {
                    schoolId: new mongoose.Types.ObjectId(schoolId),
                    formType:'AwardPoints',
                }
            },
            {
                $group: {
                    _id: '$submittedForName',
                    totalPoints: { $sum: '$points' }
                }
            }
        ]);

        studentNames.forEach(student => {
            if(!pointsByStudent.find(point => point._id === student)) {
                pointsByStudent.push({ _id: student, totalPoints: 0 });
            }
        });

        res.status(200).json({ data: pointsByStudent });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
