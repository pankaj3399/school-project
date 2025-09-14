import PointsHistory from "../models/PointsHistory.js";
import mongoose, { get } from "mongoose";
import School from "../models/School.js";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import Admin from "../models/Admin.js";
import FormSubmissions from "../models/FormSubmissions.js";
import Feedback from "../models/Feedback.js";
import { LuxonTimezoneManager } from "../utils/luxon.js";
import { FormType } from "../enum.js";

// Create timezone manager instance
const timezoneManager = new LuxonTimezoneManager();
// Helper function to get school timezone with fallback
const getSchoolTimezone = async (schoolId) => {
  try {
    const school = await School.findById(schoolId);
    if (school?.timeZone && timezoneManager.isValidTimezone(school.timeZone)) {
      return school.timeZone;
    }
    // Fallback to UTC if invalid or missing timezone
    return 'UTC';
  } catch (error) {
    console.warn('Failed to get school timezone, using UTC:', error.message);
    return 'UTC';
  }
};

// Helper function to convert UTC date to school timezone
const convertToSchoolTime = (utcDate, schoolTimezone) => {
  try {
    return timezoneManager.convertToSchoolTime(utcDate, schoolTimezone);
  } catch (error) {
    console.warn('Failed to convert to school time, using UTC:', error.message);
    return timezoneManager.convertToSchoolTime(utcDate, 'UTC');
  }
};

// Helper function to get current time in school timezone
const getSchoolCurrentTime = (schoolTimezone) => {
  try {
    return timezoneManager.getSchoolCurrentTime(schoolTimezone);
  } catch (error) {
    console.warn('Failed to get school current time, using UTC:', error.message);
    return timezoneManager.getSchoolCurrentTime('UTC');
  }
};

// Helper function to get school day bounds in UTC
const getSchoolDayBoundsUTC = (date, schoolTimezone) => {
  try {
    return timezoneManager.getSchoolDayBounds(date, schoolTimezone);
  } catch (error) {
    console.warn('Failed to get school day bounds, using UTC:', error.message);
    return timezoneManager.getSchoolDayBounds(date, 'UTC');
  }
};

// Helper function to get the start of the educational year
const getEducationalYearStart = async (schoolId) => {
  const schoolTimezone = await getSchoolTimezone(schoolId);
  const currentTime = getSchoolCurrentTime(schoolTimezone);
  const currentYear = currentTime.year;
  
  // Create August 1st in school timezone
  const augFirst = timezoneManager.createSchoolDateTime(currentYear, 8, 1, 0, 0, schoolTimezone);
  
  // If current date is before Aug 1, use previous year's start
  const yearStart = currentTime < augFirst ? 
    timezoneManager.createSchoolDateTime(currentYear - 1, 8, 1, 0, 0, schoolTimezone) : 
    augFirst;
    
  // Convert to UTC for database queries
  return timezoneManager.convertSchoolTimeToUTC(yearStart, schoolTimezone).toJSDate();
};

// Helper function to get school ID from user
const getSchoolIdFromUser = async (userId) => {
  // Try finding user as admin first
  const admin = await Admin.findById(userId);
  if (admin) {
    return admin.schoolId;
  }

  // If not admin, try finding as teacher
  const teacher = await Teacher.findById(userId);
  if (teacher) {
    return teacher.schoolId;
  }

  throw new Error("User not authorized");
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
    let studentIds;
    if (teacher.type === 'Lead') {
      // Lead teachers only see their grade's students
      studentIds = await Student.find({
        schoolId: teacher.schoolId,
        grade: teacher.grade,
      }).select("_id");
    } else {
      // Special teachers see all students in the school
      studentIds = await Student.find({
        schoolId: teacher.schoolId,
      }).select("_id");
    }
    return {
      grade: teacher.grade,
      studentIds: studentIds.map((student) => student._id),
      isSpecialTeacher: teacher.type === 'Special'
    };
  }
  throw new Error("User not authorized");
};

// 1. Whole Year Points History Controller
export const getYearPointsHistory = async (req, res) => {
  try {
    const schoolId = await getSchoolIdFromUser(req.user.id);
    const teacherData = await getGradeFromUser(req.user.id);

    const yearStart = await getEducationalYearStart(schoolId);
    const today = new Date();

    let pointsHistory;

    if (teacherData) {
      pointsHistory = await PointsHistory.aggregate([
        {
          $match: {
            schoolId: new mongoose.Types.ObjectId(schoolId),
            submittedAt: {
              $gte: yearStart,
              $lte: today,
            },
            submittedForId: { $in: teacherData.studentIds },
          },
        },

        {
          $group: {
            _id: {
              month: { $month: "$submittedAt" },
              year: { $year: "$submittedAt" },
            },
            monthName: {
              $first: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: [{ $month: "$submittedAt" }, 8] },
                      then: "Aug",
                    },
                    {
                      case: { $eq: [{ $month: "$submittedAt" }, 9] },
                      then: "Sep",
                    },
                    {
                      case: { $eq: [{ $month: "$submittedAt" }, 10] },
                      then: "Oct",
                    },
                    {
                      case: { $eq: [{ $month: "$submittedAt" }, 11] },
                      then: "Nov",
                    },
                    {
                      case: { $eq: [{ $month: "$submittedAt" }, 12] },
                      then: "Dec",
                    },
                    {
                      case: { $eq: [{ $month: "$submittedAt" }, 1] },
                      then: "Jan",
                    },
                    {
                      case: { $eq: [{ $month: "$submittedAt" }, 2] },
                      then: "Feb",
                    },
                    {
                      case: { $eq: [{ $month: "$submittedAt" }, 3] },
                      then: "Mar",
                    },
                    {
                      case: { $eq: [{ $month: "$submittedAt" }, 4] },
                      then: "Apr",
                    },
                    {
                      case: { $eq: [{ $month: "$submittedAt" }, 5] },
                      then: "May",
                    },
                    {
                      case: { $eq: [{ $month: "$submittedAt" }, 6] },
                      then: "Jun",
                    },
                  ],
                  default: "Unknown",
                },
              },
            },
            avgDeductedPoints: {
              $sum: {
                $cond: [{ $eq: ["$formType", FormType.DeductPoints] }, "$points", 0],
              },
            },
            avgAwardedPoints: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ["$formType", FormType.AwardPoints] },
                      {
                        $eq: [
                          "$formType",
                          FormType.AwardPointsIEP,
                        ],
                      },
                    ],
                  },
                  "$points",
                  0,
                ],
              },
            },
            avgWithdrawPoints: {
              $sum: {
                $cond: [{ $eq: ["$formType", FormType.PointWithdraw] }, "$points", 0],
              },
            },
            totalPoints: { $sum: { $toDouble: "$points" } },
            days: {
              $push: {
                day: { $dayOfMonth: "$submittedAt" },
                formType: "$formType",
                points: "$points",
              },
            },
          },
        },
        // Sort by month
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        // Project final output format
        {
          $project: {
            month: "$monthName",
            avgDeductedPoints: { $abs: "$avgDeductedPoints" },
            avgAwardedPoints: "$avgAwardedPoints",
            avgWithdrawPoints: "$avgWithdrawPoints",
            days: "$days",
          },
        },
      ]);
    } else {
      pointsHistory = await PointsHistory.aggregate([
        {
          $match: {
            schoolId: new mongoose.Types.ObjectId(schoolId),
            submittedAt: {
              $gte: yearStart,
              $lte: today,
            },
          },
        },

        {
          $group: {
            _id: {
              month: { $month: "$submittedAt" },
              year: { $year: "$submittedAt" },
            },
            monthName: {
              $first: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: [{ $month: "$submittedAt" }, 8] },
                      then: "Aug",
                    },
                    {
                      case: { $eq: [{ $month: "$submittedAt" }, 9] },
                      then: "Sep",
                    },
                    {
                      case: { $eq: [{ $month: "$submittedAt" }, 10] },
                      then: "Oct",
                    },
                    {
                      case: { $eq: [{ $month: "$submittedAt" }, 11] },
                      then: "Nov",
                    },
                    {
                      case: { $eq: [{ $month: "$submittedAt" }, 12] },
                      then: "Dec",
                    },
                    {
                      case: { $eq: [{ $month: "$submittedAt" }, 1] },
                      then: "Jan",
                    },
                    {
                      case: { $eq: [{ $month: "$submittedAt" }, 2] },
                      then: "Feb",
                    },
                    {
                      case: { $eq: [{ $month: "$submittedAt" }, 3] },
                      then: "Mar",
                    },
                    {
                      case: { $eq: [{ $month: "$submittedAt" }, 4] },
                      then: "Apr",
                    },
                    {
                      case: { $eq: [{ $month: "$submittedAt" }, 5] },
                      then: "May",
                    },
                    {
                      case: { $eq: [{ $month: "$submittedAt" }, 6] },
                      then: "Jun",
                    },
                  ],
                  default: "Unknown",
                },
              },
            },
            avgDeductedPoints: {
              $sum: {
                $cond: [{ $eq: ["$formType", FormType.DeductPoints] }, "$points", 0],
              },
            },
            avgAwardedPoints: {
    $sum: {
        $cond: [
            {
                $or: [
                    { $eq: ['$formType', FormType.AwardPoints] },
                    { $eq: ['$formType', FormType.AwardPointsIEP] }
                ]
            },
            '$points',
            0
        ]
    }
},
            avgWithdrawPoints: {
              $sum: {
                $cond: [{ $eq: ["$formType", FormType.PointWithdraw] }, "$points", 0],
              },
            },
            totalPoints: { $sum: { $toDouble: "$points" } },
            days: {
              $push: {
                day: { $dayOfMonth: "$submittedAt" },
                formType: "$formType",
                points: "$points",
              },
            },
          },
        },
        // Sort by month
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        // Project final output format
        {
          $project: {
            month: "$monthName",
            avgDeductedPoints: { $abs: "$avgDeductedPoints" },
            avgAwardedPoints: "$avgAwardedPoints",
            avgWithdrawPoints: "$avgWithdrawPoints",
            days: "$days",
          },
        },
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
    const teacherData = await getGradeFromUser(req.user.id);
    const studentId = req.params.id;

    // Check if teacher has access to this student
    if (teacherData && !teacherData.studentIds.some(id => id.toString() === studentId)) {
      return res.status(403).json({ message: "Access denied: You don't have permission to view this student's data" });
    }

    const yearStart = await getEducationalYearStart(schoolId);
    const today = new Date();

    const pointsHistory = await PointsHistory.aggregate([
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(schoolId),
          submittedForId: new mongoose.Types.ObjectId(studentId),
          submittedAt: {
            $gte: yearStart,
            $lte: today,
          },
        },
      },

      {
        $group: {
          _id: {
            month: { $month: "$submittedAt" },
            year: { $year: "$submittedAt" },
          },
          monthName: {
            $first: {
              $switch: {
                branches: [
                  {
                    case: { $eq: [{ $month: "$submittedAt" }, 8] },
                    then: "Aug",
                  },
                  {
                    case: { $eq: [{ $month: "$submittedAt" }, 9] },
                    then: "Sep",
                  },
                  {
                    case: { $eq: [{ $month: "$submittedAt" }, 10] },
                    then: "Oct",
                  },
                  {
                    case: { $eq: [{ $month: "$submittedAt" }, 11] },
                    then: "Nov",
                  },
                  {
                    case: { $eq: [{ $month: "$submittedAt" }, 12] },
                    then: "Dec",
                  },
                  {
                    case: { $eq: [{ $month: "$submittedAt" }, 1] },
                    then: "Jan",
                  },
                  {
                    case: { $eq: [{ $month: "$submittedAt" }, 2] },
                    then: "Feb",
                  },
                  {
                    case: { $eq: [{ $month: "$submittedAt" }, 3] },
                    then: "Mar",
                  },
                  {
                    case: { $eq: [{ $month: "$submittedAt" }, 4] },
                    then: "Apr",
                  },
                  {
                    case: { $eq: [{ $month: "$submittedAt" }, 5] },
                    then: "May",
                  },
                  {
                    case: { $eq: [{ $month: "$submittedAt" }, 6] },
                    then: "Jun",
                  },
                ],
                default: "Unknown",
              },
            },
          },
          avgDeductedPoints: {
            $sum: {
              $cond: [{ $eq: ["$formType", FormType.DeductPoints] }, "$points", 0],
            },
          },
          avgAwardedPoints: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$formType", FormType.AwardPoints] },
                    { $eq: ["$formType", FormType.AwardPointsIEP] }
                  ]
                },
                "$points",
                0
              ],
            },
          },
          avgWithdrawPoints: {
            $sum: {
              $cond: [{ $eq: ["$formType", FormType.PointWithdraw] }, "$points", 0],
            },
          },
          totalPoints: { $sum: { $toDouble: "$points" } },
          days: {
            $push: {
              day: { $dayOfMonth: "$submittedAt" },
              formType: "$formType",
              points: "$points",
            },
          },
        },
      },
      // Sort by month
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      // Project final output format
      {
        $project: {
          month: "$monthName",
          avgDeductedPoints: { $abs: "$avgDeductedPoints" },
          avgAwardedPoints: "$avgAwardedPoints",
          avgWithdrawPoints: "$avgWithdrawPoints",
          days: "$days",
        },
      },
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
    const schoolTimezone = await getSchoolTimezone(schoolId);

    const { startDate, formType } = req.body;

    // Calculate date range for last 7 days in school timezone
    let endDate;
    if (startDate) {
      // Parse the provided date in school timezone
      endDate = convertToSchoolTime(new Date(startDate), schoolTimezone);
    } else {
      // Use current date in school timezone
      endDate = getSchoolCurrentTime(schoolTimezone);
    }
    
    // Calculate start of range (6 days before end date)
    //we need start date to be the start of current week only

    let startOfRange = endDate.startOf('week');
    startOfRange = startOfRange.minus({day: 1}) // Start from Monday
    
    // Get UTC bounds for database queries
    const startBounds = getSchoolDayBoundsUTC(startOfRange.toJSDate(), schoolTimezone);
    const endBounds = getSchoolDayBoundsUTC(endDate.toJSDate(), schoolTimezone);

    console.log(`Fetching week points history from ${startBounds.start} to ${endBounds.end} (School TZ: ${schoolTimezone})`);
    

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    let weekPoints;

    if (teacherData) {
      weekPoints = await PointsHistory.aggregate([
        {
          $match: {
            schoolId: new mongoose.Types.ObjectId(schoolId),
            // Conditionally include FormType.AwardPointsIEP
            formType: formType === FormType.AwardPoints
              ? { $in: [FormType.AwardPoints, FormType.AwardPointsIEP] }
              : formType,
            submittedAt: {
              $gte: startBounds.start,
              $lte: endBounds.end,
            },
            submittedForId: { $in: teacherData.studentIds },
          },
        },
        {
          $addFields: {
            // Convert UTC submittedAt to school timezone for grouping
            schoolDate: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$submittedAt",
                timezone: timezoneManager.getTimezoneFromOffset(schoolTimezone)
              }
            },
            schoolDayOfWeek: {
              $dayOfWeek: {
                date: "$submittedAt",
                timezone: timezoneManager.getTimezoneFromOffset(schoolTimezone)
              }
            }
          }
        },
        {
          $group: {
            _id: "$schoolDate",
            dayOfWeek: { $first: "$schoolDayOfWeek" },
            points: { $sum: { $toDouble: "$points" } },
          },
        },
        {
          $project: {
            _id: 0,
            date: "$_id",
            day: {
              $arrayElemAt: [daysOfWeek, { $subtract: ["$dayOfWeek", 1] }],
            },
            points: 1,
          },
        },
        { $sort: { date: 1 } },
      ]);
    } else {
      weekPoints = await PointsHistory.aggregate([
        {
          $match: {
            schoolId: new mongoose.Types.ObjectId(schoolId),
            formType: formType === FormType.AwardPoints
              ? { $in: [FormType.AwardPoints, FormType.AwardPointsIEP] }
              : formType,
            submittedAt: {
              $gte: startBounds.start,
              $lte: endBounds.end,
            },
          },
        },
        {
          $addFields: {
            // Convert UTC submittedAt to school timezone for grouping
            schoolDate: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$submittedAt",
                timezone: timezoneManager.getTimezoneFromOffset(schoolTimezone)
              }
            },
            schoolDayOfWeek: {
              $dayOfWeek: {
                date: "$submittedAt",
                timezone: timezoneManager.getTimezoneFromOffset(schoolTimezone)
              }
            }
          }
        },
        {
          $group: {
            _id: "$schoolDate",
            dayOfWeek: { $first: "$schoolDayOfWeek" },
            points: { $sum: { $toDouble: "$points" } },
          },
        },
        {
          $project: {
            _id: 0,
            date: "$_id",
            day: {
              $arrayElemAt: [daysOfWeek, { $subtract: ["$dayOfWeek", 1] }],
            },
            points: 1,
          },
        },
        { $sort: { date: 1 } },
      ]);
    }

    // Fill in missing days with zero points
    const fullWeekData = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = startOfRange.plus({ days: i });
      const dateStr = currentDate.toFormat('yyyy-MM-dd');
      const existingData = weekPoints.find((p) => p.date === dateStr);

      if (existingData) {
        fullWeekData.push(existingData);
      } else {
        fullWeekData.push({
          date: dateStr,
          day: daysOfWeek[currentDate.weekday % 7],
          points: 0,
        });
      }
    }
 

    res.status(200).json({ 
      data: fullWeekData, 
      startDate: startBounds.start, 
      endDate: endBounds.end,
      timezone: schoolTimezone
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWeekPointsHistoryByStudent = async (req, res) => {
  try {
    console.log("=== getWeekPointsHistoryByStudent DEBUG ===");
    console.log("User ID:", req.user.id);
    console.log("Requested student ID:", req.params.id);

    const schoolId = await getSchoolIdFromUser(req.user.id);
    console.log("School ID:", schoolId);

    const teacherData = await getGradeFromUser(req.user.id);
    console.log("Teacher data:", teacherData);

    const schoolTimezone = await getSchoolTimezone(schoolId);
    console.log("School timezone:", schoolTimezone);

    const studentId = req.params.id;

    // Check if teacher has access to this student
    if (teacherData) {
      console.log("getWeekPointsHistoryByStudent - Checking teacher access...");
      console.log("Requested student ID:", studentId);
      console.log("Teacher's accessible student IDs:", teacherData.studentIds);

      const hasAccess = teacherData.studentIds.some(id => id.toString() === studentId);
      console.log("Has access:", hasAccess);

      if (!hasAccess) {
        console.log("ACCESS DENIED: Teacher cannot access student", studentId);
        return res.status(403).json({
          message: "Access denied: You don't have permission to view this student's data",
          requestedStudent: studentId,
          accessibleStudents: teacherData.studentIds.map(id => id.toString())
        });
      }
    }
    console.log("ACCESS GRANTED: Teacher can access student", studentId);

    const { startDate, formType } = req.body;
    
    let start;
    if (startDate) {
      start = convertToSchoolTime(new Date(startDate), schoolTimezone);
    } else {
      start = getSchoolCurrentTime(schoolTimezone);
    }

    // Get start of week in school timezone
    const weekStart = start.startOf('week');
    const weekEnd = start.endOf('week');

    // Convert to UTC for database queries
    const weekStartUTC = timezoneManager.convertSchoolTimeToUTC(weekStart, schoolTimezone).toJSDate();
    const weekEndUTC = timezoneManager.convertSchoolTimeToUTC(weekEnd, schoolTimezone).toJSDate();
    
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    const formTypeFilter = formType === FormType.AwardPoints 
      ? { $in: [FormType.AwardPoints, FormType.AwardPointsIEP] } 
      : formType;
    
    console.log("Query parameters:", {
      schoolId,
      formTypeFilter,
      studentId,
      weekStartUTC,
      weekEndUTC
    });

    const weekPoints = await PointsHistory.aggregate([
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(schoolId),
          formType: formTypeFilter,
          submittedForId: new mongoose.Types.ObjectId(studentId),
          submittedAt: {
            $gte: weekStartUTC,
            $lte: weekEndUTC,
          },
        },
      },
      {
        $addFields: {
          schoolDayOfWeek: {
            $dayOfWeek: {
              date: "$submittedAt",
              timezone: timezoneManager.getTimezoneFromOffset(schoolTimezone)
            }
          }
        }
      },
      {
        $group: {
          _id: "$schoolDayOfWeek",
          points: { $sum: { $toDouble: "$points" } },
        },
      },
      {
        $project: {
          _id: 0,
          day: { $arrayElemAt: [daysOfWeek, { $subtract: ["$_id", 1] }] },
          points: 1,
        },
      },
      { $sort: { day: 1 } },
    ]);

    console.log("Week points result:", weekPoints);
    console.log("Sending response with data length:", weekPoints.length);

    res.status(200).json({
      data: weekPoints,
      startDate: weekStartUTC,
      endDate: weekEndUTC,
      timezone: schoolTimezone
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHistoricalPointsData = async (req, res) => {
  try {
    const schoolId = await getSchoolIdFromUser(req.user.id);
    const { period, formType } = req.body;
    const teacherData = await getGradeFromUser(req.user.id);
    const schoolTimezone = await getSchoolTimezone(schoolId);
    
    // Get current time in school timezone
    const today = getSchoolCurrentTime(schoolTimezone);
    let startDate;

    switch (period) {
      case "1W":
        startDate = today.minus({ weeks: 1 });
        break;
      case "1M":
        startDate = today.minus({ months: 1 });
        break;
      case "3M":
        startDate = today.minus({ months: 3 });
        break;
      case "6M":
        startDate = today.minus({ months: 6 });
        break;
      case "1Y":
        startDate = today.minus({ years: 1 });
        break;
      default:
        return res.status(400).json({ message: "Invalid period specified" });
    }

    // Convert to UTC for database queries
    const startDateUTC = timezoneManager.convertSchoolTimeToUTC(startDate.startOf('day'), schoolTimezone).toJSDate();
    const todayUTC = timezoneManager.convertSchoolTimeToUTC(today.endOf('day'), schoolTimezone).toJSDate();

    let historicalPoints;
    let historicalPointsHistory;

    if (teacherData) {
      historicalPoints = await PointsHistory.aggregate([
        {
          $match: {
            schoolId: new mongoose.Types.ObjectId(schoolId),
            formType: formType === FormType.AwardPoints
              ? { $in: [FormType.AwardPoints, FormType.AwardPointsIEP] }
              : formType,
            submittedAt: {
              $gte: startDateUTC,
              $lte: todayUTC,
            },
            submittedForId: { $in: teacherData.studentIds },
          },
        },
        {
          $addFields: {
            schoolDate: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$submittedAt",
                timezone: timezoneManager.getTimezoneFromOffset(schoolTimezone)
              }
            }
          }
        },
        {
          $group: {
            _id: "$schoolDate",
            points: { $sum: { $toDouble: "$points" } },
          },
        },
        {
          $project: {
            _id: 0,
            day: "$_id",
            points: 1,
          },
        },
        { $sort: { day: 1 } },
      ]);

      historicalPointsHistory = await PointsHistory.aggregate([
        {
          $match: {
            schoolId: new mongoose.Types.ObjectId(schoolId),
            formType: formType === FormType.AwardPoints
              ? { $in: [FormType.AwardPoints, FormType.AwardPointsIEP] }
              : formType,
            submittedAt: {
              $gte: startDateUTC,
              $lte: todayUTC,
            },
            submittedForId: { $in: teacherData.studentIds },
          },
        },
      ]);
    } else {
      historicalPoints = await PointsHistory.aggregate([
        {
          $match: {
            schoolId: new mongoose.Types.ObjectId(schoolId),
            formType: formType === FormType.AwardPoints
              ? { $in: [FormType.AwardPoints, FormType.AwardPointsIEP] }
              : formType,
            submittedAt: {
              $gte: startDateUTC,
              $lte: todayUTC,
            },
          },
        },
        {
          $addFields: {
            schoolDate: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$submittedAt",
                timezone: timezoneManager.getTimezoneFromOffset(schoolTimezone)
              }
            }
          }
        },
        {
          $group: {
            _id: "$schoolDate",
            points: { $sum: { $toDouble: "$points" } },
          },
        },
        {
          $project: {
            _id: 0,
            day: "$_id",
            points: 1,
          },
        },
        { $sort: { day: 1 } },
      ]);

      historicalPointsHistory = await PointsHistory.aggregate([
        {
          $match: {
            schoolId: new mongoose.Types.ObjectId(schoolId),
            formType: formType === FormType.AwardPoints
              ? { $in: [FormType.AwardPoints, FormType.AwardPointsIEP] }
              : formType,
            submittedAt: {
              $gte: startDateUTC,
              $lte: todayUTC,
            },
          },
        },
      ]);
    }

    res.status(200).json({
      data: historicalPoints,
      history: historicalPointsHistory,
      startDate: startDateUTC,
      endDate: todayUTC,
      timeZone: schoolTimezone,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getHistoricalPointsDataByStudentId = async (req, res) => {
  console.log("🔥🔥🔥 getHistoricalPointsDataByStudentId CALLED 🔥🔥🔥");
  try {
    console.log("=== getHistoricalPointsDataByStudentId DEBUG ===");
    console.log("User ID:", req.user?.id);
    console.log("User role:", req.user?.role);
    console.log("Request body:", req.body);
    console.log("Request params:", req.params);

    const schoolId = await getSchoolIdFromUser(req.user.id);
    console.log("School ID:", schoolId);

    const { period, formType, studentId } = req.body;
    console.log("Parameters from body:", { period, formType, studentId });

    if (!studentId) {
      console.log("ERROR: No student ID provided in request body");
      return res.status(400).json({ message: "Student ID is required" });
    }

    const teacherData = await getGradeFromUser(req.user.id);
    console.log("Teacher data:", teacherData);

    const schoolTimezone = await getSchoolTimezone(schoolId);
    console.log("School timezone:", schoolTimezone);

    // TEMPORARILY DISABLED - Check if teacher has access to this student
    if (teacherData) {
      console.log("Checking teacher access...");
      console.log("Requested student ID:", studentId);
      console.log("Teacher's accessible student IDs:", teacherData.studentIds);
      console.log("Accessible IDs as strings:", teacherData.studentIds.map(id => id.toString()));

      const hasAccess = teacherData.studentIds.some(id => id.toString() === studentId);
      console.log("Has access:", hasAccess);

      if (!hasAccess) {
        console.log("ACCESS DENIED - Teacher cannot access this student");
        // Re-enable this after debugging
        console.log("🚨 WOULD DENY ACCESS BUT ALLOWING FOR DEBUG 🚨");
        // return res.status(403).json({
        //   message: "Access denied: You don't have permission to view this student's data",
        //   requestedStudent: studentId,
        //   accessibleStudents: teacherData.studentIds.map(id => id.toString())
        // });
      }
    }
    console.log("ACCESS GRANTED for student:", studentId);

    const today = getSchoolCurrentTime(schoolTimezone);
    console.log("Today in school timezone:", today);

    let startDate;

    switch (period) {
      case "1W":
        startDate = today.minus({ weeks: 1 });
        break;
      case "1M":
        startDate = today.minus({ months: 1 });
        break;
      case "3M":
        startDate = today.minus({ months: 3 });
        break;
      case "6M":
        startDate = today.minus({ months: 6 });
        break;
      case "1Y":
        startDate = today.minus({ years: 1 });
        break;
      default:
        return res.status(400).json({ message: "Invalid period specified" });
    }

    // Convert to UTC for database queries
    console.log("Converting timezone dates...");
    console.log("Start date before conversion:", startDate);
    console.log("Today before conversion:", today);

    let startDateUTC, todayUTC;
    try {
      startDateUTC = timezoneManager.convertSchoolTimeToUTC(startDate.startOf('day'), schoolTimezone).toJSDate();
      todayUTC = timezoneManager.convertSchoolTimeToUTC(today.endOf('day'), schoolTimezone).toJSDate();
      console.log("Start date UTC:", startDateUTC);
      console.log("Today UTC:", todayUTC);
    } catch (timezoneError) {
      console.error("Timezone conversion error:", timezoneError);
      // Fallback to using the dates as UTC
      startDateUTC = startDate.startOf('day').toJSDate();
      todayUTC = today.endOf('day').toJSDate();
      console.log("Using fallback dates - Start:", startDateUTC, "Today:", todayUTC);
    }

    let historicalPoints;
    let historicalPointsHistory;

    console.log("Executing database queries...");

    if (teacherData) {
      console.log("Executing teacher-filtered query...");
      try {
        historicalPoints = await PointsHistory.aggregate([
          {
            $match: {
              schoolId: new mongoose.Types.ObjectId(schoolId),
              formType: formType === FormType.AwardPoints
                  ? { $in: [FormType.AwardPoints, FormType.AwardPointsIEP] }
                  : formType,
              submittedAt: {
                $gte: startDateUTC,
                $lte: todayUTC,
              },
              submittedForId: new mongoose.Types.ObjectId(studentId),
            },
          },
        {
          $group: {
            _id: {
              year: { $year: "$submittedAt" },
              month: { $month: "$submittedAt" },
              day: { $dayOfMonth: "$submittedAt" },
            },
            points: { $sum: { $toDouble: "$points" } },
          },
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
                    day: "$_id.day",
                  },
                },
              },
            },
            points: 1,
          },
        },
        { $sort: { day: 1 } },
        ]);

        console.log("First query completed, result length:", historicalPoints.length);

        historicalPointsHistory = await PointsHistory.aggregate([
          {
            $match: {
              schoolId: new mongoose.Types.ObjectId(schoolId),
              formType: formType,
              submittedAt: {
                $gte: startDateUTC,
                $lte: todayUTC,
              },
              submittedForId: new mongoose.Types.ObjectId(studentId),
            },
          },
        ]);

        console.log("Second query completed, result length:", historicalPointsHistory.length);

      } catch (dbError) {
        console.error("Database query error for teacher:", dbError);
        throw dbError;
      }
    } else {
      historicalPoints = await PointsHistory.aggregate([
        {
          $match: {
            schoolId: new mongoose.Types.ObjectId(schoolId),
            formType: formType,
            submittedAt: {
              $gte: startDateUTC,
              $lte: todayUTC,
            },
            submittedForId: new mongoose.Types.ObjectId(studentId),
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$submittedAt" },
              month: { $month: "$submittedAt" },
              day: { $dayOfMonth: "$submittedAt" },
            },
            points: { $sum: { $toDouble: "$points" } },
          },
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
                    day: "$_id.day",
                  },
                },
              },
            },
            points: 1,
          },
        },
        { $sort: { day: 1 } },
      ]);
      historicalPointsHistory = await PointsHistory.aggregate([
        {
          $match: {
            schoolId: new mongoose.Types.ObjectId(schoolId),
            formType: formType,
            submittedAt: {
              $gte: startDateUTC,
              $lte: todayUTC,
            },
            submittedForId: new mongoose.Types.ObjectId(studentId),
          },
        },
      ]);
    }
    
    console.log("Preparing final response...");
    console.log("Historical points length:", historicalPoints ? historicalPoints.length : 0);
    console.log("Historical points history length:", historicalPointsHistory ? historicalPointsHistory.length : 0);

    const responseData = {
      data: historicalPoints,
      history: historicalPointsHistory,
      startDate: startDateUTC,
      endDate: todayUTC,
      timeZone: schoolTimezone,
    };

    console.log("Sending successful response");
    res.status(200).json(responseData);
  } catch (error) {
    console.error("=== ERROR in getHistoricalPointsDataByStudentId ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: error.message });
  }
};

export const getPointsByTeacher = async (req, res) => {
  try {
    const schoolId = await getSchoolIdFromUser(req.user.id);
    const teachers = await Teacher.find({ schoolId: schoolId });

    const pointsByTeacher = await PointsHistory.aggregate([
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(schoolId),
          formType: { $in: [FormType.AwardPoints, FormType.AwardPointsIEP] },
        },
      },
      {
        $group: {
          _id: "$submittedByName",
          totalPoints: { $sum: { $toDouble: "$points" } },
        },
      },
    ]);

    // Add grade information to teachers who actually issued points
    teachers.forEach((teacher) => {
      pointsByTeacher.forEach((point) => {
        if (point._id === teacher.name) {
          point.grade = teacher.grade ?? "N/A";
        }
      });
    });

    // Filter to only include teachers who actually issued points (totalPoints > 0)
    const activeTeachers = pointsByTeacher.filter(teacher => teacher.totalPoints > 0);

    res.status(200).json({ data: activeTeachers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPointsByStudent = async (req, res) => {
  try {
    const schoolId = await getSchoolIdFromUser(req.user.id);
    const teacherData = await getGradeFromUser(req.user.id);
    
    let students;
    if (teacherData) {
      students = await Student.find({ 
        schoolId: schoolId,
        _id: { $in: teacherData.studentIds }
      });
    } else {
      students = await Student.find({ schoolId: schoolId });
    }

    const studentNames = students.map((student) => student.name);

    let pointsByStudent;

    if (teacherData) {
      pointsByStudent = await PointsHistory.aggregate([
        {
          $match: {
            schoolId: new mongoose.Types.ObjectId(schoolId),
            formType: { $in: [FormType.AwardPoints, FormType.AwardPointsIEP] },
            submittedForId: { $in: teacherData.studentIds },
          },
        },
        {
          $group: {
            _id: "$submittedForName",
            totalPoints: { $sum: { $toDouble: "$points" } },
          },
        },
      ]);
    } else {
      pointsByStudent = await PointsHistory.aggregate([
        {
          $match: {
            schoolId: new mongoose.Types.ObjectId(schoolId),
            formType: { $in: [FormType.AwardPoints, FormType.AwardPointsIEP] },
          },
        },
        {
          $group: {
            _id: "$submittedForName",
            totalPoints: { $sum: { $toDouble: "$points" } },
          },
        },
      ]);
    }

    // Filter to only include students who actually received points (totalPoints > 0)
    const activeStudents = pointsByStudent.filter(student => student.totalPoints > 0);

    res.status(200).json({ data: activeStudents });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCombinedStudentPointsHistory = async (req, res) => {
  try {
    const schoolId = await getSchoolIdFromUser(req.user.id);
    const yearStart = await getEducationalYearStart();
    const today = new Date();
    const { grades } = req.body; // grades is now an array of strings

    // Create result structure to group by grade
    const result = await Promise.all(
      grades.map(async (grade) => {
        // Get students for this grade
        const students = await Student.find({
          schoolId: new mongoose.Types.ObjectId(schoolId),
          grade: grade,
        });

        // Get teachers for this grade
        const teachers = await Teacher.find({
          schoolId: schoolId,
          grade: grade,
        });

        // Get data for all students in this grade
        const studentsData = await Promise.all(
          students.map(async (student) => {
            const pointsHistory = await PointsHistory.find({
              schoolId: new mongoose.Types.ObjectId(schoolId),
              submittedForId: student._id,
              submittedAt: {
                $gte: yearStart,
                $lte: today,
              },
            });

            const feedbackData = await Feedback.find({
              submittedForId: student._id,
            });

            const totalPoints = {
              eToken: 0,
              oopsies: 0,
              withdraw: 0,
            };

            pointsHistory.forEach((point) => {
              if (
                point.formType === "AwardPoints" ||
                point.formType ===
                  FormType.AwardPointsIEP
              ) {
                totalPoints.eToken += point.points;
              } else if (point.formType === "DeductPoints") {
                totalPoints.oopsies += point.points;
              } else if (point.formType === "PointWithdraw") {
                totalPoints.withdraw += point.points;
              }
            });

            return {
              student,
              history: pointsHistory,
              feedback: feedbackData,
              totalPoints,
            };
          })
        );

        // Return grade-specific data
        return {
          grade,
          students: studentsData,
          teachers: teachers,
          totalStudents: students.length,
        };
      })
    );

    let finalResult = result;

    if (req.user.role === "Teacher") {
      finalResult = result.filter((grade) =>
        grade.teachers.some((teacher) => teacher._id.equals(req.user.id))
      );
    }

    res.status(200).json({
      gradeData: finalResult,
      totalGrades: grades.length,
      totalStudents: result.reduce(
        (acc, grade) => acc + grade.totalStudents,
        0
      ),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentPointsHistory = async (req, res) => {
  try {
    const schoolId = await getSchoolIdFromUser(req.user.id);
    const studentId = req.params.id;
    const yearStart = await getEducationalYearStart();
    const today = new Date();
    const { grade } = req.body;

    const pointsHistory = await PointsHistory.aggregate([
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(schoolId),
          submittedForId: new mongoose.Types.ObjectId(studentId),
          submittedAt: {
            $gte: yearStart,
            $lte: today,
          },
        },
      },
    ]);

    const feedbackData = await Feedback.find({ submittedForId: studentId });

    const totalPoints = {
      eToken: 0,
      oopsies: 0,
      withdraw: 0,
    };

    pointsHistory.forEach((point) => {
      if (point.formType === "AwardPoints") {
        totalPoints.eToken += point.points;
      } else if (point.formType === "DeductPoints") {
        totalPoints.oopsies += point.points;
      } else {
        totalPoints.withdraw += point.points;
      }
    });

    const teacher = await Teacher.find({
      schoolId: schoolId,
      grade: grade,
    });

    res.status(200).json({
      data: pointsHistory,
      feedback: await Promise.all(feedbackData),
      totalPoints,
      teacher,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
