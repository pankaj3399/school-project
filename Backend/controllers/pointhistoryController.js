import PointsHistory from '../models/PointsHistory.js';
import mongoose from 'mongoose';
import School from '../models/School.js';
import Teacher from '../models/Teacher.js';
import Student from "../models/Student.js";
import Admin from '../models/Admin.js';
import FormSubmissions from '../models/FormSubmissions.js';
import Feedback from '../models/Feedback.js';

// Helper function to get the start of the educational year
const getEducationalYearStart = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const augFirst = new Date(currentYear, 7, 1); // August is 7 in zero-indexed months

    // If current date is before AUg 1, use previous year's start
    return currentDate < augFirst 
        ? new Date(currentYear - 1, 9, 1)
        : augFirst;
};

// Helper function to get school ID from user
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

const getGradeFromUser = async (userId) => {
    // Try finding user as admin first
    const admin = await Admin.findById(userId);
    if (admin) {
        return null;
    }
    // If not admin, try finding as teacher
    const teacher = await Teacher.findById(userId);
    if (teacher) {
        const studentIds = await Student.find({ schoolId: teacher.schoolId, grade:teacher.grade }).select('_id');
        return {
            grade: teacher.grade,
            studentIds: studentIds.map(student => student._id)
        };
    }
    throw new Error('User not authorized');
}

// 1. Whole Year Points History Controller
export const getYearPointsHistory = async (req, res) => {
    try {
        const schoolId = await getSchoolIdFromUser(req.user.id);
        const teacherData = await getGradeFromUser(req.user.id);
        
        const yearStart = getEducationalYearStart();
        const today = new Date();

        let pointsHistory;

        if(teacherData){
            pointsHistory = await PointsHistory.aggregate([
                
                {
                    $match: {
                        schoolId: new mongoose.Types.ObjectId(schoolId),
                        submittedAt: { 
                            $gte: yearStart, 
                            $lte: today 
                        },
                        submittedForId: { $in: teacherData.studentIds}
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
                                        { case: { $eq: [{ $month: '$submittedAt' }, 8] }, then: 'Aug' },
                                        { case: { $eq: [{ $month: '$submittedAt' }, 9] }, then: 'Sep' },
                                        { case: { $eq: [{ $month: '$submittedAt' }, 10] }, then: 'Oct' },
                                        { case: { $eq: [{ $month: '$submittedAt' }, 11] }, then: 'Nov' },
                                        { case: { $eq: [{ $month: '$submittedAt' }, 12] }, then: 'Dec' },
                                        { case: { $eq: [{ $month: '$submittedAt' }, 1] }, then: 'Jan' },
                                        { case: { $eq: [{ $month: '$submittedAt' }, 2] }, then: 'Feb' },
                                        { case: { $eq: [{ $month: '$submittedAt' }, 3] }, then: 'Mar' },
                                        { case: { $eq: [{ $month: '$submittedAt' }, 4] }, then: 'Apr' },
                                        { case: { $eq: [{ $month: '$submittedAt' }, 5] }, then: 'May' },
                                        { case: { $eq: [{ $month: '$submittedAt' }, 6] }, then: 'Jun' }
                                    ],
                                    default: 'Unknown'
                                }
                            }
                        },
                        avgDeductedPoints: { 
                            $sum: { 
                                $cond: [{ $eq: ['$formType', 'DeductPoints'] }, '$points', 0] 
                            } 
                        },
                        avgAwardedPoints: { 
                            $sum: { 
                                $cond: [{ $eq: ['$formType', 'AwardPoints'] }, '$points', 0] 
                            } 
                        },
                        avgWithdrawPoints: { 
                            $sum: { 
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
        }else{
            pointsHistory = await PointsHistory.aggregate([
                
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
                                        { case: { $eq: [{ $month: '$submittedAt' }, 8] }, then: 'Aug' },
                                        { case: { $eq: [{ $month: '$submittedAt' }, 9] }, then: 'Sep' },
                                        { case: { $eq: [{ $month: '$submittedAt' }, 10] }, then: 'Oct' },
                                        { case: { $eq: [{ $month: '$submittedAt' }, 11] }, then: 'Nov' },
                                        { case: { $eq: [{ $month: '$submittedAt' }, 12] }, then: 'Dec' },
                                        { case: { $eq: [{ $month: '$submittedAt' }, 1] }, then: 'Jan' },
                                        { case: { $eq: [{ $month: '$submittedAt' }, 2] }, then: 'Feb' },
                                        { case: { $eq: [{ $month: '$submittedAt' }, 3] }, then: 'Mar' },
                                        { case: { $eq: [{ $month: '$submittedAt' }, 4] }, then: 'Apr' },
                                        { case: { $eq: [{ $month: '$submittedAt' }, 5] }, then: 'May' },
                                        { case: { $eq: [{ $month: '$submittedAt' }, 6] }, then: 'Jun' }
                                    ],
                                    default: 'Unknown'
                                }
                            }
                        },
                        avgDeductedPoints: { 
                            $sum: { 
                                $cond: [{ $eq: ['$formType', 'DeductPoints'] }, '$points', 0] 
                            } 
                        },
                        avgAwardedPoints: { 
                            $sum: { 
                                $cond: [{ $eq: ['$formType', 'AwardPoints'] }, '$points', 0] 
                            } 
                        },
                        avgWithdrawPoints: { 
                            $sum: { 
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
        }

        res.status(200).json({ data: pointsHistory });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getYearPointsHistoryByStudent = async (req, res) => {
    try {
        const schoolId = await getSchoolIdFromUser(req.user.id);
        const studentId = req.params.id;
        
        const yearStart = getEducationalYearStart();
        const today = new Date();

        const pointsHistory = await PointsHistory.aggregate([
            
            {
                $match: {
                    schoolId: new mongoose.Types.ObjectId(schoolId),
                    submittedForId: new mongoose.Types.ObjectId(studentId),
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
                                    { case: { $eq: [{ $month: '$submittedAt' }, 8] }, then: 'Aug' },
                                    { case: { $eq: [{ $month: '$submittedAt' }, 9] }, then: 'Sep' },
                                    { case: { $eq: [{ $month: '$submittedAt' }, 10] }, then: 'Oct' },
                                    { case: { $eq: [{ $month: '$submittedAt' }, 11] }, then: 'Nov' },
                                    { case: { $eq: [{ $month: '$submittedAt' }, 12] }, then: 'Dec' },
                                    { case: { $eq: [{ $month: '$submittedAt' }, 1] }, then: 'Jan' },
                                    { case: { $eq: [{ $month: '$submittedAt' }, 2] }, then: 'Feb' },
                                    { case: { $eq: [{ $month: '$submittedAt' }, 3] }, then: 'Mar' },
                                    { case: { $eq: [{ $month: '$submittedAt' }, 4] }, then: 'Apr' },
                                    { case: { $eq: [{ $month: '$submittedAt' }, 5] }, then: 'May' },
                                    { case: { $eq: [{ $month: '$submittedAt' }, 6] }, then: 'Jun' }
                                ],
                                default: 'Unknown'
                            }
                        }
                    },
                    avgDeductedPoints: { 
                        $sum: { 
                            $cond: [{ $eq: ['$formType', 'DeductPoints'] }, '$points', 0] 
                        } 
                    },
                    avgAwardedPoints: { 
                        $sum: { 
                            $cond: [{ $eq: ['$formType', 'AwardPoints'] }, '$points', 0] 
                        } 
                    },
                    avgWithdrawPoints: { 
                        $sum: { 
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
        const schoolId = await getSchoolIdFromUser(req.user.id);
        const teacherData = await getGradeFromUser(req.user.id);

        const { startDate, formType } = req.body;

        const start = startDate ? new Date(startDate) : new Date();
        
        const weekStart = new Date(start);
        weekStart.setDate(start.getDate() - start.getDay());
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        

        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        let weekPoints;

        if(teacherData){
            weekPoints = await PointsHistory.aggregate([
                {
                    $match: {
                        schoolId: new mongoose.Types.ObjectId(schoolId),
                        formType: formType,
                        submittedAt: { 
                            $gte: weekStart, 
                            $lte: weekEnd 
                        },
                        submittedForId: { $in: teacherData.studentIds}
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
        }else{
            weekPoints = await PointsHistory.aggregate([
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
        }

        res.status(200).json({ data: weekPoints });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getWeekPointsHistoryByStudent = async (req, res) => {
    try {
        const schoolId = await getSchoolIdFromUser(req.user.id);
        const studentId = req.params.id;

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
                    submittedForId: new mongoose.Types.ObjectId(studentId),
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
        const schoolId = await getSchoolIdFromUser(req.user.id);
        const { period, formType } = req.body;
        const teacherData = await getGradeFromUser(req.user.id);
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

        let historicalPoints;
        let historicalPointsHistory;

        if(teacherData){
            historicalPoints = await PointsHistory.aggregate([
                {
                    $match: {
                        schoolId: new mongoose.Types.ObjectId(schoolId),
                        formType: formType,
                        submittedAt: { 
                            $gte: startDate, 
                            $lte: today 
                        },
                        submittedForId: { $in: teacherData.studentIds}
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
             historicalPointsHistory = await PointsHistory.aggregate([
                {
                    $match: {
                        schoolId: new mongoose.Types.ObjectId(schoolId),
                        formType: formType,
                        submittedAt: { 
                            $gte: new Date(startDate.getTime() + 24 * 60 * 60 * 1000), 
                            $lte: today 
                        },
                        submittedForId: { $in: teacherData.studentIds}
                    }
                }
            ]);
        }else{
            historicalPoints = await PointsHistory.aggregate([
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
            historicalPointsHistory = await PointsHistory.aggregate([
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

        }


       

        res.status(200).json({ data: historicalPoints, history: historicalPointsHistory, startDate });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPointsByTeacher = async (req, res) => {
    try {
        const schoolId = await getSchoolIdFromUser(req.user.id);
        const teachers = await Teacher.find({ schoolId: schoolId });
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
        const schoolId = await getSchoolIdFromUser(req.user.id);
        const teacherData = await getGradeFromUser(req.user.id);
        let students;
        if(teacherData){
            students = await Student.find({ schoolId: schoolId});
            students = students.filter(student => teacherData.studentIds.includes(student._id));
        }else{
            students = await Student.find({ schoolId: schoolId });
        }
      

        
        const studentNames = students.map(student => student.name);

        let pointsByStudent;

        if(teacherData){
            pointsByStudent = await PointsHistory.aggregate([
                {
                    $match: {
                        schoolId: new mongoose.Types.ObjectId(schoolId),
                        formType:'AwardPoints',
                        submittedForId: { $in: teacherData.studentIds}
                    }
                },
                {
                    $group: {
                        _id: '$submittedForName',
                        totalPoints: { $sum: '$points' }
                    }
                }
            ]);
        }else{
            pointsByStudent = await PointsHistory.aggregate([
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
        }

        

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

export const getStudentPointsHistory = async (req, res) => {
    try {
        const schoolId = await getSchoolIdFromUser(req.user.id);
        const studentId = req.params.id;
        const yearStart = getEducationalYearStart();
        const today = new Date();
        const {grade} = req.body;

        
        const pointsHistory = await PointsHistory.aggregate([{
            $match: {
                schoolId: new mongoose.Types.ObjectId(schoolId),
                submittedForId: new mongoose.Types.ObjectId(studentId),
                submittedAt: { 
                    $gte: yearStart, 
                    $lte: today 
                }
            }
        },]);

        const feedbackData = await Feedback.find({ submittedForId: studentId });


        const totalPoints = {
            eToken: 0,
            oopsies:0,
            withdraw:0
        }

        pointsHistory.forEach(point => {
            if(point.formType === 'AwardPoints') {
                totalPoints.eToken += point.points;
            } else if(point.formType === 'DeductPoints') {
                totalPoints.oopsies += point.points;
            } else {
                totalPoints.withdraw += point.points;
            }
        });

        const teacher = await Teacher.find({
            schoolId: schoolId,
            grade: grade
        });



        res.status(200).json({ 
            data: pointsHistory, 
            feedback: await Promise.all(feedbackData),
            totalPoints,
            teacher
         });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}