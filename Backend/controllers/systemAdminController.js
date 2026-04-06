import mongoose from 'mongoose';
import District from '../models/District.js';
import School from '../models/School.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import Admin from '../models/Admin.js';
import { TermsOfUse, TermsAcceptance } from "../models/TermsOfUse.js";
import crypto from 'crypto';
import { escapeRegExp } from '../utils/stringUtils.js';
import { Role, FormType } from "../enum.js";
import PointsHistory from "../models/PointsHistory.js";
import xlsx from 'xlsx';
import bcrypt from 'bcryptjs';

// Resolve the current user's districtId from the database (not the JWT claim)
// and return it as an ObjectId for use in aggregation pipelines.
async function resolveDistrictId(userId) {
  const user = await Admin.findById(userId).select('districtId').lean();
  return user?.districtId ? new mongoose.Types.ObjectId(String(user.districtId)) : null;
}

// Get top-level dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const isSystemAdmin = req.user.role === Role.SystemAdmin;
    const userDistrictId = isSystemAdmin ? null : await resolveDistrictId(req.user.id);

    // If not SystemAdmin, scope to their district
    if (!isSystemAdmin && !userDistrictId) {
      return res.status(403).json({ message: "No district assigned to your account." });
    }

    const districtFilter = isSystemAdmin ? {} : { _id: userDistrictId };
    const schoolFilter = isSystemAdmin ? {} : { districtId: userDistrictId };

    const [
      totalDistricts, 
      activeDistricts, 
      pendingDistricts, 
      totalSchools,
      distinctStates,
      distinctCountries
    ] = await Promise.all([
      District.countDocuments(districtFilter),
      District.countDocuments({ ...districtFilter, subscriptionStatus: 'active' }),
      District.countDocuments({ ...districtFilter, subscriptionStatus: 'pending' }),
      School.countDocuments(schoolFilter),
      District.distinct('state', districtFilter),
      District.distinct('country', districtFilter)
    ]);

    const totalStates = distinctStates.filter(Boolean).length;
    const totalCountries = distinctCountries.filter(Boolean).length;

    // Optimized aggregate for School stats: counts teachers, students, tokens per school
    // Using a facet to get global totals AND specific top-performers for leaderboards
    const schoolAggResult = await School.aggregate([
      { $match: schoolFilter },
      {
        $lookup: {
          from: 'teachers',
          localField: '_id',
          foreignField: 'schoolId',
          pipeline: [{ $count: 'count' }],
          as: 'teachers'
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: 'schoolId',
          pipeline: [{ $count: 'count' }],
          as: 'students'
        }
      },
      {
        $lookup: {
          from: 'pointshistories',
          localField: '_id',
          foreignField: 'schoolId',
          pipeline: [
            {
              $group: {
                _id: null,
                totalTokens: {
                  $sum: {
                    $cond: [
                      { $in: ["$formType", [FormType.AwardPoints, FormType.AwardPointsIEP, "Award Points", "AWARD POINTS WITH INDIVIDUALIZED EDUCATION PLAN (IEP)"]] },
                      "$points",
                      0
                    ]
                  }
                },
                oopsies: {
                  $sum: {
                    $cond: [
                      { $in: ["$formType", [FormType.DeductPoints, "Deduct Points"]] },
                      "$points",
                      0
                    ]
                  }
                },
                withdrawals: {
                  $sum: {
                    $cond: [
                      { $in: ["$formType", [FormType.PointWithdraw, "Point Withdraw"]] },
                      "$points",
                      0
                    ]
                  }
                },
                feedbacks: {
                  $sum: {
                    $cond: [
                      { $in: ["$formType", [FormType.Feedback, "Feedback"]] },
                      1,
                      0
                    ]
                  }
                }
              }
            }
          ],
          as: 'pointsSummary'
        }
      },
      {
        $project: {
          name: 1,
          teacherCount: { $ifNull: [{ $arrayElemAt: ["$teachers.count", 0] }, 0] },
          studentCount: { $ifNull: [{ $arrayElemAt: ["$students.count", 0] }, 0] },
          totalTokens: { $ifNull: [{ $arrayElemAt: ["$pointsSummary.totalTokens", 0] }, 0] },
          oopsies: { $ifNull: [{ $arrayElemAt: ["$pointsSummary.oopsies", 0] }, 0] },
          withdrawals: { $ifNull: [{ $arrayElemAt: ["$pointsSummary.withdrawals", 0] }, 0] },
          feedbacks: { $ifNull: [{ $arrayElemAt: ["$pointsSummary.feedbacks", 0] }, 0] }
        }
      },
      {
        $facet: {
          globalTotals: [
            {
              $group: {
                _id: null,
                totalTeachers: { $sum: "$teacherCount" },
                totalStudents: { $sum: "$studentCount" },
                totalTokens: { $sum: "$totalTokens" },
                totalOopsies: { $sum: "$oopsies" },
                totalWithdrawals: { $sum: "$withdrawals" },
                totalFeedbacks: { $sum: "$feedbacks" },
                schoolIds: { $push: "$_id" }
              }
            }
          ],
          topByTeachers: [{ $sort: { teacherCount: -1 } }, { $limit: 20 }],
          topByStudents: [{ $sort: { studentCount: -1 } }, { $limit: 20 }],
          topByTokens: [{ $sort: { totalTokens: -1 } }, { $limit: 20 }]
        }
      }
    ]);

    const { globalTotals, topByTeachers, topByStudents, topByTokens } = schoolAggResult[0];
    const totals = globalTotals[0] || {
      totalTeachers: 0,
      totalStudents: 0,
      totalTokens: 0,
      totalOopsies: 0,
      totalWithdrawals: 0,
      totalFeedbacks: 0,
      schoolIds: []
    };

    // Combine leaderboard schools while removing duplicates by school ID
    const schoolMap = new Map();
    [...topByTeachers, ...topByStudents, ...topByTokens].forEach(school => {
      const idStr = school._id.toString();
      if (!schoolMap.has(idStr)) {
        schoolMap.set(idStr, school);
      }
    });
    const schoolStats = Array.from(schoolMap.values());
    const schoolIds = totals.schoolIds;

    // Aggregations for 12-Month Chart History
    const monthAgg = {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    };

    const [
      stateHistory,
      districtHistory,
      schoolHistory,
      teacherHistory,
      studentHistory
    ] = await Promise.all([
      District.aggregate([
        { $match: districtFilter },
        { $match: { state: { $nin: [null, ""] } } },
        { $group: { _id: "$state", firstSeen: { $min: "$createdAt" } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$firstSeen" } }, count: { $sum: 1 } } }
      ]),
      District.aggregate([{ $match: districtFilter }, monthAgg]),
      School.aggregate([{ $match: schoolFilter }, monthAgg]),
      Teacher.aggregate([{ $match: { schoolId: { $in: schoolIds } } }, monthAgg]),
      Student.aggregate([{ $match: { schoolId: { $in: schoolIds } } }, monthAgg])
    ]);

    // Format historical data
    const chartDataMap = {};
    const processHistory = (history, key) => {
      history.forEach(item => {
        if (!item._id) return;
        if (!chartDataMap[item._id]) {
          const [year, month] = item._id.split('-');
          chartDataMap[item._id] = { year, month: parseInt(month, 10), states: 0, districts: 0, schools: 0, teachers: 0, students: 0 };
        }
        chartDataMap[item._id][key] += item.count;
      });
    };

    processHistory(stateHistory, 'states');
    processHistory(districtHistory, 'districts');
    processHistory(schoolHistory, 'schools');
    processHistory(teacherHistory, 'teachers');
    processHistory(studentHistory, 'students');

    const chartData = Object.values(chartDataMap).sort((a, b) => {
      if (a.year !== b.year) return parseInt(a.year) - parseInt(b.year);
      return a.month - b.month;
    });

    // Get recent activity
    const recentDistricts = await District.find(districtFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name code state subscriptionStatus createdAt');

    return res.status(200).json({
      stats: {
        totalCountries,
        totalStates,
        totalDistricts,
        activeDistricts,
        pendingDistricts,
        totalSchools,
        totalTeachers: totals.totalTeachers,
        totalStudents: totals.totalStudents,
        totalTokensEarned: totals.totalTokens,
        totalOopsies: totals.totalOopsies,
        totalWithdrawals: totals.totalWithdrawals,
        totalFeedbacks: totals.totalFeedbacks
      },
      chartData,
      schoolStats,
      recentDistricts
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return res.status(500).json({ message: "Error fetching stats", error: error.message });
  }
};

// Get state-level analytics
export const getStateLevelStats = async (req, res) => {
  try {
    const isSystemAdmin = req.user.role === Role.SystemAdmin;
    const userDistrictId = isSystemAdmin ? null : await resolveDistrictId(req.user.id);

    if (!isSystemAdmin && !userDistrictId) {
      return res.status(403).json({ message: "No district assigned to your account." });
    }

    const districtMatch = isSystemAdmin ? {} : { _id: userDistrictId };

    // Aggregate districts by state
    const stateStats = await District.aggregate([
      { $match: districtMatch },
      {
        $group: {
          _id: "$state",
          districtCount: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ["$subscriptionStatus", "active"] }, 1, 0] }
          }
        }
      },
      { $sort: { districtCount: -1 } }
    ]);

    const schoolMatchStage = isSystemAdmin ? [] : [{ $match: { districtId: userDistrictId } }];

    // Get school counts per state
    const schoolsByState = await School.aggregate([
      ...schoolMatchStage,
      {
        $lookup: {
          from: 'districts',
          localField: 'districtId',
          foreignField: '_id',
          as: 'district'
        }
      },
      { $unwind: { path: '$district', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$district.state',
          schoolCount: { $sum: 1 }
        }
      }
    ]);

    const schoolCountMap = schoolsByState.reduce((acc, item) => {
      if (item._id) acc[item._id] = item.schoolCount;
      return acc;
    }, {});

    const stateAnalytics = stateStats.map(state => ({
      state: state._id || 'Unknown',
      districtCount: state.districtCount,
      activeDistrictCount: state.activeCount,
      schoolCount: schoolCountMap[state._id] || 0
    }));

    return res.status(200).json({ stateAnalytics });
  } catch (error) {
    console.error("Error fetching state stats:", error);
    return res.status(500).json({ message: "Error fetching state stats", error: error.message });
  }
};

// Get district comparison analytics
export const getDistrictComparison = async (req, res) => {
  try {
    const isSystemAdmin = req.user.role === Role.SystemAdmin;
    const userDistrictId = isSystemAdmin ? null : await resolveDistrictId(req.user.id);

    if (!isSystemAdmin && !userDistrictId) {
      return res.status(403).json({ message: "No district assigned to your account." });
    }

    const matchFilter = isSystemAdmin
      ? { subscriptionStatus: 'active' }
      : { _id: userDistrictId, subscriptionStatus: 'active' };

    const districtStats = await District.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: 'schools',
          localField: '_id',
          foreignField: 'districtId',
          as: 'schools'
        }
      },
      {
        $lookup: {
          from: 'teachers',
          localField: 'schools._id',
          foreignField: 'schoolId',
          as: 'teachers'
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: 'schools._id',
          foreignField: 'schoolId',
          as: 'students'
        }
      },
      {
        $lookup: {
          from: 'pointshistories',
          localField: 'schools._id',
          foreignField: 'schoolId',
          as: 'pointsHistory'
        }
      },
      {
        $project: {
          districtId: '$_id',
          name: 1,
          code: 1,
          state: 1,
          schoolCount: { $size: '$schools' },
          teacherCount: { $size: '$teachers' },
          studentCount: { $size: '$students' },
          totalTokens: { 
            $sum: { 
              $map: { 
                input: "$pointsHistory", 
                as: "ph", 
                in: { 
                  $cond: [ 
                    { $in: ["$$ph.formType", [FormType.AwardPoints, FormType.AwardPointsIEP, "Award Points", "Award Points IEP"]] }, 
                    "$$ph.points", 
                    0 
                  ] 
                } 
              } 
            } 
          },
          withdrawals: { 
            $sum: { 
              $map: { 
                input: "$pointsHistory", 
                as: "ph", 
                in: { 
                  $cond: [ 
                    { $in: ["$$ph.formType", [FormType.PointWithdraw, "Point Withdraw"]] }, 
                    "$$ph.points", 
                    0 
                  ] 
                } 
              } 
            } 
          },
          oopsies: { 
            $sum: { 
              $map: { 
                input: "$pointsHistory", 
                as: "ph", 
                in: { 
                  $cond: [ 
                    { $in: ["$$ph.formType", [FormType.DeductPoints, "Deduct Points"]] }, 
                    "$$ph.points", 
                    0 
                  ] 
                } 
              } 
            } 
          },
          feedbacks: { 
            $sum: { 
              $map: { 
                input: "$pointsHistory", 
                as: "ph", 
                in: { 
                  $cond: [ 
                    { $in: ["$$ph.formType", [FormType.Feedback, "Feedback"]] }, 
                    1, 
                    0 
                  ] 
                } 
              } 
            } 
          }
        }
      },
      { $sort: { totalTokens: -1 } }
    ]);

    return res.status(200).json({ districtStats });
  } catch (error) {
    console.error("Error fetching district comparison:", error);
    return res.status(500).json({ message: "Error fetching comparison", error: error.message });
  }
};

// Bulk import schools from Excel
export const bulkImportSchools = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const results = {
      success: [],
      errors: []
    };

    for (const row of data) {
      try {
        const {
          'District ID': districtCodeRaw,
          'District Name': districtName,
          'School Name': schoolName,
          'Address': address,
          'State': state,
          'Country': country
        } = row;

        // Safely normalize districtCode
        const districtCode = String(districtCodeRaw || '').trim().toUpperCase();

        if (!districtCode || !schoolName) {
          results.errors.push({
            row,
            error: "Missing required fields (District ID or School Name)"
          });
          continue;
        }

        // Find or create district
        let district = await District.findOne({ code: districtCode });
        
        if (!district && districtName) {
          district = await District.create({
            name: districtName,
            code: districtCode,
            state: state || '',
            country: country || 'USA',
            createdBy: req.user.id,
            subscriptionStatus: 'pending'
          });
        }

        if (!district) {
          results.errors.push({
            row,
            error: `District not found: ${districtCode}`
          });
          continue;
        }

        // Check if school already exists
        const escapedName = escapeRegExp(schoolName);
        const existingSchool = await School.findOne({ 
          name: { $regex: new RegExp(`^${escapedName}$`, 'i') }, 
          districtId: district._id 
        });

        if (existingSchool) {
          results.errors.push({
            row,
            error: `School already exists in district: ${schoolName}`
          });
          continue;
        }

        // Create school
        const school = await School.create({
          name: schoolName,
          address: address || '',
          districtId: district._id,
          district: district.name,
          state: state || district.state,
          country: country || district.country,
          createdBy: req.user.id
        });

        results.success.push({
          schoolName: school.name,
          districtName: district.name,
          schoolId: school._id
        });
      } catch (rowError) {
        results.errors.push({
          row,
          error: rowError.message
        });
      }
    }

    return res.status(200).json({
      message: `Import completed. ${results.success.length} schools created, ${results.errors.length} errors.`,
      results
    });
  } catch (error) {
    console.error("Error importing schools:", error);
    return res.status(500).json({ message: "Error importing schools", error: error.message });
  }
};

// Clone district from template
export const cloneFromTemplate = async (req, res) => {
  try {
    const { templateDistrictId, newDistrictData } = req.body;

    const template = await District.findById(templateDistrictId);
    if (!template) {
      return res.status(404).json({ message: "Template district not found" });
    }

    // Non-SystemAdmin can only clone from districts they manage
    if (req.user.role !== Role.SystemAdmin) {
      const userDistrictId = await resolveDistrictId(req.user.id);
      if (!userDistrictId || template._id.toString() !== userDistrictId.toString()) {
        return res.status(403).json({ message: "You can only clone from districts you manage." });
      }
    }

    // Create new district with template settings (whitelist allowed fields)
    const newDistrict = await District.create({
      name: newDistrictData.name,
      code: newDistrictData.code?.toUpperCase(),
      address: newDistrictData.address,
      city: newDistrictData.city,
      state: newDistrictData.state,
      zipCode: newDistrictData.zipCode,
      country: newDistrictData.country,
      contactEmail: newDistrictData.contactEmail,
      contactPhone: newDistrictData.contactPhone,
      contactName: newDistrictData.contactName,
      settings: template.settings,
      templateSourceId: templateDistrictId,
      createdBy: req.user.id,
      subscriptionStatus: 'pending'
    });

    return res.status(201).json({
      message: "District created from template successfully",
      district: newDistrict
    });
  } catch (error) {
    console.error("Error cloning district:", error);
    return res.status(500).json({ message: "Error cloning district", error: error.message });
  }
};

// Terms of Use Management
export const getCurrentTerms = async (req, res) => {
  try {
    const terms = await TermsOfUse.findOne({ isActive: true })
      .sort({ effectiveDate: -1 });

    if (!terms) {
      return res.status(404).json({ message: "No active terms found" });
    }

    return res.status(200).json({ terms });
  } catch (error) {
    console.error("Error fetching terms:", error);
    return res.status(500).json({ message: "Error fetching terms", error: error.message });
  }
};

export const createTermsVersion = async (req, res) => {
  try {
    const { version, title, content, contentHtml, effectiveDate, applicableToDistricts } = req.body;

    // Create new terms first, then deactivate others (to avoid "no active terms" state if create fails)
    const newTerms = await TermsOfUse.create({
      version,
      title: title || 'RADU E-Token™ Pilot Participation Agreement',
      content,
      contentHtml,
      effectiveDate: effectiveDate || new Date(),
      applicableToDistricts: applicableToDistricts || [],
      createdBy: req.user.id,
      isActive: true
    });

    await TermsOfUse.updateMany(
      { _id: { $ne: newTerms._id }, isActive: true }, 
      { 
        isActive: false, 
        deactivatedAt: new Date(),
        deactivatedBy: req.user.id
      }
    );

    return res.status(201).json({
      message: "New terms version created successfully",
      terms: newTerms
    });
  } catch (error) {
    console.error("Error creating terms:", error);
    return res.status(500).json({ message: "Error creating terms", error: error.message });
  }
};

export const getAllTermsVersions = async (req, res) => {
  try {
    const terms = await TermsOfUse.find()
      .sort({ effectiveDate: -1 })
      .populate('createdBy', 'name email');

    return res.status(200).json({ terms });
  } catch (error) {
    console.error("Error fetching terms versions:", error);
    return res.status(500).json({ message: "Error fetching terms", error: error.message });
  }
};

// Record terms acceptance
export const recordTermsAcceptance = async (req, res) => {
  try {
    const { userId, userModel, userType, termsVersion, schoolId, districtId } = req.body;

    if (!userId || !termsVersion) {
        return res.status(400).json({ message: 'User ID and terms version are required' });
    }

    // Validate that the request is for the authenticated user or a SystemAdmin
    if (req.user.id !== userId && req.user.role !== Role.SystemAdmin) {
      return res.status(403).json({ message: "Access denied. Cannot record acceptance for another user." });
    }

    const hashedIp = crypto.createHash('sha256').update(req.ip || req.socket.remoteAddress || '').digest('hex');

    const acceptance = await TermsAcceptance.create({
      userId,
      userModel,
      userType,
      termsVersion,
      schoolId,
      districtId,
      ipAddress: hashedIp,
      userAgent: req.get('User-Agent')
    });

    return res.status(201).json({
      message: "Terms acceptance recorded",
      acceptance
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({ message: "Terms already accepted for this version" });
    }
    console.error("Error recording terms acceptance:", error);
    return res.status(500).json({ message: "Error recording acceptance", error: error.message });
  }
};

// Get all admins across system
export const getAllAdmins = async (req, res) => {
  try {
    // Only SystemAdmin can view the list of global administrators
    if (req.user.role !== Role.SystemAdmin) {
      return res.status(403).json({ message: "Access denied. Only System Administrators can manage other admins." });
    }

    const { role, page = 1, limit = 20 } = req.query;
    
    let query = {};
    // Whitelist accepted roles to prevent arbitrary role filtering
    const allowedRoles = [Role.SystemAdmin, Role.Admin, Role.DistrictAdmin, Role.SchoolAdmin];
    if (role && allowedRoles.includes(role)) {
        query.role = role;
    } else if (role) {
        // If an invalid role is provided, return an error
        return res.status(400).json({ message: "Invalid role specified for filtering." });
    } else {
        // If no role is specified, default to all allowed admin roles
        query.role = { $in: allowedRoles };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [admins, total] = await Promise.all([
      Admin.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('schoolId', 'name')
        .populate('districtId', 'name code')
        .select('-password'),
      Admin.countDocuments(query)
    ]);

    return res.status(200).json({
      admins,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching admins:", error);
    return res.status(500).json({ message: "Error fetching admins", error: error.message });
  }
};

// Invite a new administrator
export const inviteAdmin = async (req, res) => {
  try {
    const { email, role, schoolId, districtId, name } = req.body;

    if (!email || !role) {
      return res.status(400).json({ message: "Email and role are required" });
    }

    const requesterRole = req.user.role;

    // Hierarchy validation: Only SystemAdmin can invite other SystemAdmins or global Admins
    const allowedRoles = [Role.DistrictAdmin, Role.SchoolAdmin];
    if (requesterRole === Role.SystemAdmin) {
      allowedRoles.push(Role.Admin, Role.SystemAdmin);
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ 
        message: requesterRole === Role.Admin && role === Role.Admin 
          ? "Administrators cannot invite other global Administrators. This action requires a System Administrator."
          : "Invalid role for invitation or insufficient permissions." 
      });
    }

    // Role-specific requirements
    if (role === Role.Admin || role === Role.DistrictAdmin) {
      if (!districtId) {
        return res.status(400).json({ message: `District ID is required for ${role} role.` });
      }
    } else if (role === Role.SchoolAdmin) {
      if (!schoolId) {
        return res.status(400).json({ message: "School ID is required for SchoolAdmin role." });
      }
    }

    // New: Validate relationship if both IDs are provided
    if (schoolId && districtId) {
       const targetSchool = await School.findById(schoolId);
       if (targetSchool && targetSchool.districtId.toString() !== districtId.toString()) {
           return res.status(400).json({ message: "The specified school does not belong to the specified district." });
       }
    }

    // If requester is an Admin, they can only invite users to their OWN district
    if (requesterRole === Role.Admin) {
      const requester = await Admin.findById(req.user.id);
      if (!requester || (requester.role !== Role.SystemAdmin && !requester.districtId)) {
        return res.status(403).json({ message: "Administrator is not assigned to a district." });
      }

      if (districtId && districtId.toString() !== requester.districtId.toString()) {
        return res.status(403).json({ message: "You can only invite users to your own district." });
      }

      if (schoolId) {
        const school = await School.findById(schoolId);
        if (!school || school.districtId.toString() !== requester.districtId.toString()) {
          return res.status(403).json({ message: "You can only invite users to schools within your district." });
        }
      }
    }

    // Validate ID existence
    if (districtId) {
      const district = await District.findById(districtId);
      if (!district) return res.status(404).json({ message: "District not found." });
    }
    if (schoolId) {
      const school = await School.findById(schoolId);
      if (!school) return res.status(404).json({ message: "School not found." });
    }

    // Check if user already exists
    const existingUser = await Admin.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Generate custom registration token
    const registrationToken = crypto.randomBytes(32).toString('hex');
    const registrationTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create the user in "pending" state
    const newUser = await Admin.create({
      email,
      role,
      schoolId: schoolId || null,
      districtId: districtId || null,
      approved: true, // Auto-approved since it's an invite
      registrationToken, // Store the raw token; model pre-save hook will hash it
      registrationTokenExpires,
      name: name || email.split('@')[0],
    });

    const safeUser = {
      id: newUser._id,
      email: newUser.email,
      role: newUser.role,
      schoolId: newUser.schoolId,
      districtId: newUser.districtId,
      approved: newUser.approved,
    };

    const userResponse = newUser.toObject();
    delete userResponse.registrationToken;

    // Send invitation email
    try {
      // Create the registration URL
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const registrationUrl = `${baseUrl}/admin/complete-registration?token=${registrationToken}&email=${encodeURIComponent(email)}&role=${role}`;
      
      const body = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 8px;">
          <h2 style="color: #00a58c;">Invitation to Join RADU E-Token™</h2>
          <p>Hello,</p>
          <p>You have been invited to join the RADU E-Token™ System as a <strong>${role}</strong>.</p>
          <p>Please click the button below to set up your account and get started:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${registrationUrl}" style="background-color: #00a58c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Complete Registration</a>
          </div>
          <p style="color: #666; font-size: 14px;">This link will expire in 7 days.</p>
          <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #00a58c; font-size: 14px;">${registrationUrl}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999;">&copy; ${new Date().getFullYear()} Affective Academy LLC. All rights reserved.</p>
        </div>
      `;

      const { sendEmail } = await import("../services/mail.js");
      await sendEmail(email, "Invitation to Join RADU E-Token™ System", body, body, null);
    } catch (emailError) {
      console.error("Error sending invitation email:", emailError);
      // We still return success but notify that email failed
      return res.status(201).json({ 
        success: true,
        message: "Admin invited successfully, but invitation email failed to send.",
        user: safeUser,
        emailError: emailError.message
      });
    }

    return res.status(201).json({
      success: true,
      message: "Invitation sent successfully",
      user: safeUser
    });
  } catch (error) {
    console.error("Error inviting admin:", error);
    return res.status(500).json({ message: "Error inviting admin", error: error.message });
  }
};

// Complete administrator registration
export const completeAdminRegistration = async (req, res) => {
  try {
    const { token, email, name, password, termsAccepted, termsVersion } = req.body;

    if (!token || !password || !email) {
      return res.status(400).json({ message: "Token, email, and password are required" });
    }

    if (!termsAccepted) {
      return res.status(400).json({ message: "You must accept the terms of use to complete registration." });
    }

    if (!termsVersion) {
      return res.status(400).json({ message: "termsVersion is required when accepting terms." });
    }

    const admin = await Admin.findOne({
      email: email.toLowerCase(),
      registrationTokenExpires: { $gt: Date.now() },
    });

    if (!admin || !admin.compareRegistrationToken(token)) {
      return res.status(400).json({ message: "Invalid or expired registration token" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    admin.name = name || admin.name;
    admin.password = hashedPassword;
    admin.registrationToken = null;
    admin.registrationTokenExpires = null;
    admin.approved = true;

    // Record terms acceptance if provided
    if (termsAccepted && termsVersion) {
      await TermsAcceptance.create({
        userId: admin._id,
        userModel: 'User',
        userType: admin.role, // Will be SchoolAdmin, DistrictAdmin, or Admin
        termsVersion: termsVersion,
        acceptedAt: new Date()
      });
      
      admin.termsAccepted = true;
      admin.termsVersion = termsVersion;
      admin.termsAcceptedAt = new Date();
    }

    await admin.save();

    return res.status(200).json({ 
      success: true,
      message: "Registration completed successfully" 
    });
  } catch (error) {
    console.error("Error completing admin registration:", error);
    return res.status(500).json({ message: "Error completing registration", error: error.message });
  }
};
