import District from "../models/District.js";
import School from "../models/School.js";
import User from "../models/Admin.js";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import { TermsOfUse, TermsAcceptance } from "../models/TermsOfUse.js";
import { Role } from "../enum.js";
import PointsHistory from "../models/PointsHistory.js";
import xlsx from 'xlsx';

// Get top-level dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalDistricts,
      activeDistricts,
      totalSchools,
      totalTeachers,
      totalStudents,
      totalPoints
    ] = await Promise.all([
      District.countDocuments(),
      District.countDocuments({ subscriptionStatus: 'active' }),
      School.countDocuments(),
      Teacher.countDocuments(),
      Student.countDocuments(),
      PointsHistory.aggregate([
        { $group: { _id: null, total: { $sum: "$awarded" } } }
      ])
    ]);

    // Get recent activity
    const recentDistricts = await District.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name code state subscriptionStatus createdAt');

    return res.status(200).json({
      stats: {
        totalDistricts,
        activeDistricts,
        pendingDistricts: totalDistricts - activeDistricts,
        totalSchools,
        totalTeachers,
        totalStudents,
        totalTokensEarned: totalPoints[0]?.total || 0
      },
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
    // Aggregate districts by state
    const stateStats = await District.aggregate([
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

    // Get school counts per state
    const schoolsByState = await School.aggregate([
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
    const districts = await District.find({ subscriptionStatus: 'active' })
      .select('name code state');

    const districtStats = await Promise.all(
      districts.map(async (district) => {
        const schools = await School.find({ districtId: district._id });
        const schoolIds = schools.map(s => s._id);

        const [teacherCount, studentCount, totalPoints] = await Promise.all([
          Teacher.countDocuments({ schoolId: { $in: schoolIds } }),
          Student.countDocuments({ schoolId: { $in: schoolIds } }),
          PointsHistory.aggregate([
            { $match: { schoolId: { $in: schoolIds } } },
            { $group: { _id: null, total: { $sum: "$awarded" } } }
          ])
        ]);

        return {
          districtId: district._id,
          name: district.name,
          code: district.code,
          state: district.state,
          schoolCount: schools.length,
          teacherCount,
          studentCount,
          totalTokens: totalPoints[0]?.total || 0
        };
      })
    );

    // Sort by total tokens
    districtStats.sort((a, b) => b.totalTokens - a.totalTokens);

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
          'District ID': districtCode,
          'District Name': districtName,
          'School Name': schoolName,
          'Address': address,
          'State': state,
          'Country': country
        } = row;

        if (!districtCode || !schoolName) {
          results.errors.push({
            row,
            error: "Missing required fields (District ID or School Name)"
          });
          continue;
        }

        // Find or create district
        let district = await District.findOne({ code: districtCode.toUpperCase() });
        
        if (!district && districtName) {
          district = await District.create({
            name: districtName,
            code: districtCode.toUpperCase(),
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
        const existingSchool = await School.findOne({
          name: schoolName,
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

    // Create new district with template settings
    const newDistrict = await District.create({
      ...newDistrictData,
      code: newDistrictData.code.toUpperCase(),
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

    // Deactivate all previous versions
    await TermsOfUse.updateMany({}, { isActive: false });

    const terms = await TermsOfUse.create({
      version,
      title: title || 'RADU E-Token™ Pilot Participation Agreement',
      content,
      contentHtml,
      effectiveDate: effectiveDate || new Date(),
      isActive: true,
      applicableToDistricts: applicableToDistricts || [],
      createdBy: req.user.id
    });

    return res.status(201).json({
      message: "Terms version created successfully",
      terms
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

    const acceptance = await TermsAcceptance.create({
      userId,
      userModel,
      userType,
      termsVersion,
      schoolId,
      districtId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    return res.status(201).json({
      message: "Terms acceptance recorded",
      acceptance
    });
  } catch (error) {
    console.error("Error recording terms acceptance:", error);
    return res.status(500).json({ message: "Error recording acceptance", error: error.message });
  }
};

// Get all admins across system
export const getAllAdmins = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (role) query.role = role;
    else query.role = { $in: [Role.SystemAdmin, Role.DistrictAdmin, Role.SchoolAdmin] };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [admins, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('schoolId', 'name')
        .populate('districtId', 'name code')
        .select('-password'),
      User.countDocuments(query)
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
