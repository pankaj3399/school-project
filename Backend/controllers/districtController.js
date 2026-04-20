import District from "../models/District.js";
import School from "../models/School.js";
import User from "../models/Admin.js";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import { Role, FormType } from "../enum.js";
import PointsHistory from "../models/PointsHistory.js";
import Feedback from "../models/Feedback.js";
import { sendDistrictAdminRegistrationMail } from "../services/verificationMail.js";
import bcrypt from 'bcryptjs';
import { escapeRegExp } from "../utils/stringUtils.js";
import { uploadImageFromDataURI } from "../utils/cloudinary.js";

// Shared helper to verify admin district scope
const ensureAdminDistrictScope = async (userId) => {
  const adminUser = await User.findById(userId);
  if (!adminUser) return null;
  
  // SystemAdmin has global scope
  if (adminUser.role === Role.SystemAdmin) return adminUser;
  
  // Role.Admin must have a districtId
  if (!adminUser.districtId) return null;
  
  return adminUser;
};

// Generate the next sequential district code (D101, D102, ...).
// Looks at existing D### codes and returns the next unused one.
// Note: this is only a best-effort candidate — the unique index on District.code
// is the real source of truth. Callers must retry on E11000 duplicate-key errors.
export const generateNextDistrictCode = async () => {
  const districts = await District.find({ code: /^D\d+$/ }).select('code').lean();
  let maxNum = 100;
  for (const d of districts) {
    const n = parseInt(d.code.slice(1), 10);
    if (!isNaN(n) && n > maxNum) maxNum = n;
  }
  return `D${maxNum + 1}`;
};

// Create a district with retry on duplicate-key errors for auto-generated codes.
// When the code is user-supplied, duplicates fail fast (no retry). When auto-generated,
// concurrent inserts racing the same candidate code are resolved by retrying with a fresh one.
export const createDistrictWithRetry = async (payload, { autoCode }) => {
  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await District.create(payload);
    } catch (err) {
      const isDup = err?.code === 11000 && (err?.keyPattern?.code || err?.message?.includes('code'));
      if (!isDup || !autoCode) throw err;
      payload.code = await generateNextDistrictCode();
    }
  }
  throw new Error('Could not allocate a unique district code after multiple attempts');
};

// Create a new district
export const createDistrict = async (req, res) => {
  try {
    const {
      name,
      code,
      address,
      city,
      state,
      zipCode,
      country,
      contactEmail,
      contactPhone,
      contactName,
      settings
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: "District name is required and must be a non-empty string" });
    }

    // Auto-generate code if not provided; normalize to uppercase
    const userProvidedCode = code && typeof code === 'string' && code.trim();
    const normalizedCode = userProvidedCode
      ? code.trim().toUpperCase()
      : await generateNextDistrictCode();

    if (userProvidedCode) {
      const existingDistrict = await District.findOne({ code: normalizedCode });
      if (existingDistrict) {
        return res.status(400).json({ message: "District with this code already exists" });
      }
    }

    const district = await createDistrictWithRetry({
      name,
      code: normalizedCode,
      address,
      city,
      state,
      zipCode,
      country: country || 'USA',
      contactEmail,
      contactPhone,
      contactName,
      settings: settings || {},
      createdBy: req.user.id,
      subscriptionStatus: 'pending'
    }, { autoCode: !userProvidedCode });

    return res.status(201).json({
      message: "District created successfully",
      district
    });
  } catch (error) {
    console.error("Error creating district:", error);
    return res.status(500).json({ message: "Error creating district", error: error.message });
  }
};

// Get all districts (with optional filtering)
export const getDistricts = async (req, res) => {
  try {
    const { state, status, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    if (req.user.role === Role.Admin) {
      const adminUser = await ensureAdminDistrictScope(req.user.id);
      if (!adminUser) {
        console.warn(`Admin ${req.user.id} has no districtId assigned or does not exist.`);
        return res.status(200).json({ districts: [], pagination: { total: 0, page: 1, limit: limit, pages: 0 } });
      }
      
      if (adminUser.role !== Role.SystemAdmin) {
        query._id = adminUser.districtId;
      }
    }
    
    if (state) query.state = state;
    if (status) query.subscriptionStatus = status;
    if (search) {
      const escapedSearch = escapeRegExp(search);
      query.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { code: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [districts, total] = await Promise.all([
      District.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name email'),
      District.countDocuments(query)
    ]);

    // Get school counts for each district
    const districtIds = districts.map(d => d._id);
    const schoolCounts = await School.aggregate([
      { $match: { districtId: { $in: districtIds } } },
      { $group: { _id: "$districtId", count: { $sum: 1 } } }
    ]);
    
    const schoolCountMap = schoolCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});

    // Get teacher and student counts for each district
    const schoolsInDistricts = await School.find({ districtId: { $in: districtIds } }).select('_id districtId');
    const schoolIdToDistrictIdMap = schoolsInDistricts.reduce((acc, school) => {
      if (!acc[school.districtId.toString()]) {
        acc[school.districtId.toString()] = [];
      }
      acc[school.districtId.toString()].push(school._id);
      return acc;
    }, {});

    const allSchoolIds = schoolsInDistricts.map(s => s._id);

    const [teacherCountsAgg, studentCountsAgg] = await Promise.all([
      Teacher.aggregate([
        { $match: { schoolId: { $in: allSchoolIds } } },
        { $group: { _id: "$schoolId", count: { $sum: 1 } } }
      ]),
      Student.aggregate([
        { $match: { schoolId: { $in: allSchoolIds } } },
        { $group: { _id: "$schoolId", count: { $sum: 1 } } }
      ])
    ]);

    const teacherCountMap = teacherCountsAgg.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});

    const studentCountMap = studentCountsAgg.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});

    const districtsWithCounts = districts.map(d => {
      const districtSchools = schoolIdToDistrictIdMap[d._id.toString()] || [];
      let totalTeachers = 0;
      let totalStudents = 0;

      districtSchools.forEach(schoolId => {
        totalTeachers += teacherCountMap[schoolId.toString()] || 0;
        totalStudents += studentCountMap[schoolId.toString()] || 0;
      });

      return {
        ...d.toObject(),
        schoolCount: schoolCountMap[d._id.toString()] || 0,
        teacherCount: totalTeachers,
        studentCount: totalStudents
      };
    });

    return res.status(200).json({
      districts: districtsWithCounts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching districts:", error);
    return res.status(500).json({ message: "Error fetching districts", error: error.message });
  }
};

// Get single district by ID
export const getDistrictById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.user.role === Role.Admin) {
      const adminUser = await ensureAdminDistrictScope(req.user.id);
      if (!adminUser || (adminUser.role !== Role.SystemAdmin && id !== adminUser.districtId.toString())) {
        return res.status(403).json({ message: "Access denied: You do not have permission for this district." });
      }
    }
    
    const district = await District.findById(id)
      .populate('createdBy', 'name email')
      .populate('termsAcceptedBy', 'name email');

    if (!district) {
      return res.status(404).json({ message: "District not found" });
    }

    // Get associated schools with detailed stats
    const schoolsData = await School.find({ districtId: id })
      .sort({ createdAt: -1 });

    const schoolIds = schoolsData.map(s => s._id);

    // Get counts and stats for each school
    const [teacherCounts, studentCounts, pointsStats, feedbackCounts] = await Promise.all([
      Teacher.aggregate([
        { $match: { schoolId: { $in: schoolIds } } },
        { $group: { _id: "$schoolId", count: { $sum: 1 } } }
      ]),
      Student.aggregate([
        { $match: { schoolId: { $in: schoolIds } } },
        { $group: { _id: "$schoolId", count: { $sum: 1 } } }
      ]),
      PointsHistory.aggregate([
        { $match: { schoolId: { $in: schoolIds } } },
        {
          $group: {
            _id: { schoolId: "$schoolId", formType: "$formType" },
            totalPoints: { $sum: "$points" }
          }
        }
      ]),
      Feedback.aggregate([
        { $match: { schoolId: { $in: schoolIds } } },
        { $group: { _id: "$schoolId", count: { $sum: 1 } } }
      ])
    ]);

    // Create maps for quick lookup
    const teacherMap = teacherCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});

    const studentMap = studentCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});

    const feedbackMap = feedbackCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});

    // Points map structure: { schoolId: { tokens: 0, withdrawals: 0, oopsies: 0 } }
    const pointsMap = pointsStats.reduce((acc, item) => {
      const sId = item._id.schoolId.toString();
      const type = item._id.formType;
      
      if (!acc[sId]) {
        acc[sId] = { tokens: 0, withdrawals: 0, oopsies: 0 };
      }

      if (type === FormType.AwardPoints || type === FormType.AwardPointsIEP) {
        acc[sId].tokens += item.totalPoints;
      } else if (type === FormType.PointWithdraw) {
        acc[sId].withdrawals += item.totalPoints;
      } else if (type === FormType.DeductPoints) {
        acc[sId].oopsies += Math.abs(item.totalPoints);
      }
      
      return acc;
    }, {});

    const schoolsWithStats = schoolsData.map(school => {
      const sId = school._id.toString();
      return {
        ...school.toObject(),
        teacherCount: teacherMap[sId] || 0,
        studentCount: studentMap[sId] || 0,
        feedbackCount: feedbackMap[sId] || 0,
        tokens: pointsMap[sId]?.tokens || 0,
        withdrawals: pointsMap[sId]?.withdrawals || 0,
        oopsies: pointsMap[sId]?.oopsies || 0
      };
    });

    // Get admins associated with this district
    const districtAdminsRaw = await User.find({ 
      districtId: id, 
      role: { $in: [Role.DistrictAdmin, Role.Admin] } 
    })
    .populate('schoolId', 'name')
    .select('name email role approved address phone position contactRole schoolId password').lean();

    const admins = districtAdminsRaw.map(admin => {
        const adminObj = { ...admin };
        adminObj.hasCompletedRegistration = !!admin.password;
        delete adminObj.password;
        return adminObj;
    });

    return res.status(200).json({
      district,
      schools: schoolsWithStats,
      adminCount: admins.length,
      admins: admins
    });
  } catch (error) {
    console.error("Error fetching district:", error);
    return res.status(500).json({ message: "Error fetching district", error: error.message });
  }
};

// Update district
export const updateDistrict = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role === Role.Admin) {
      const adminUser = await ensureAdminDistrictScope(req.user.id);
      if (!adminUser || (adminUser.role !== Role.SystemAdmin && id !== adminUser.districtId.toString())) {
        return res.status(403).json({ message: "Access denied: You do not have permission for this district." });
      }
    }

    const { code, createdBy, createdAt, logo: bodyLogo, ...allowedUpdates } = req.body;

    // If a file was uploaded via multer, push it to Cloudinary; otherwise accept a
    // logo URL/string sent in the body (backward compatible with existing clients).
    if (req.file) {
      const logoUrl = await uploadImageFromDataURI(req.file);
      allowedUpdates.logo = logoUrl;
    } else if (typeof bodyLogo === 'string') {
      allowedUpdates.logo = bodyLogo;
    }

    const district = await District.findByIdAndUpdate(
      id,
      { ...allowedUpdates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!district) {
      return res.status(404).json({ message: "District not found" });
    }

    return res.status(200).json({
      message: "District updated successfully",
      district
    });
  } catch (error) {
    console.error("Error updating district:", error);
    return res.status(500).json({ message: "Error updating district", error: error.message });
  }
};

// Delete district (soft delete by changing status)
export const deleteDistrict = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role === Role.Admin) {
      const adminUser = await ensureAdminDistrictScope(req.user.id);
      if (!adminUser || (adminUser.role !== Role.SystemAdmin && id !== adminUser.districtId.toString())) {
        return res.status(403).json({ message: "Access denied: You do not have permission for this district." });
      }
    }

    // Check if district has any schools
    const schoolCount = await School.countDocuments({ districtId: id });
    if (schoolCount > 0) {
      return res.status(400).json({ 
        message: "Cannot delete district with associated schools. Please remove all schools first." 
      });
    }

    const district = await District.findByIdAndUpdate(
      id,
      { subscriptionStatus: 'expired', updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!district) {
      return res.status(404).json({ message: "District not found" });
    }

    return res.status(200).json({
      message: "District deleted successfully",
      district
    });
  } catch (error) {
    console.error("Error deleting district:", error);
    return res.status(500).json({ message: "Error deleting district", error: error.message });
  }
};

// Get district statistics
export const getDistrictStats = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role === Role.Admin) {
      const adminUser = await ensureAdminDistrictScope(req.user.id);
      if (!adminUser || (adminUser.role !== Role.SystemAdmin && id !== adminUser.districtId.toString())) {
        return res.status(403).json({ message: "Access denied: You do not have permission for this district." });
      }
    }

    const district = await District.findById(id);
    if (!district) {
      return res.status(404).json({ message: "District not found" });
    }

    // Get all schools in district
    const schools = await School.find({ districtId: id });
    const schoolIds = schools.map(s => s._id);

    // Count teachers and students
    const [teacherCount, studentCount, totalPoints] = await Promise.all([
      Teacher.countDocuments({ schoolId: { $in: schoolIds } }),
      Student.countDocuments({ schoolId: { $in: schoolIds } }),
      PointsHistory.aggregate([
        { $match: { schoolId: { $in: schoolIds } } },
        { $group: { _id: null, total: { $sum: "$points" } } }
      ])
    ]);

    return res.status(200).json({
      districtId: id,
      districtName: district.name,
      stats: {
        schoolCount: schools.length,
        teacherCount,
        studentCount,
        totalTokensEarned: totalPoints[0]?.total || 0
      }
    });
  } catch (error) {
    console.error("Error fetching district stats:", error);
    return res.status(500).json({ message: "Error fetching district stats", error: error.message });
  }
};

// Add school to district
export const addSchoolToDistrict = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, state, country, timeZone, domain } = req.body;

    if (req.user.role === Role.Admin) {
      const adminUser = await ensureAdminDistrictScope(req.user.id);
      if (!adminUser || (adminUser.role !== Role.SystemAdmin && id !== adminUser.districtId.toString())) {
        return res.status(403).json({ message: "Access denied: You do not have permission for this district." });
      }
    }

    const district = await District.findById(id);
    if (!district) {
      return res.status(404).json({ message: "District not found" });
    }

    // Check for duplicate school name in district
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: "School name is required and must be a non-empty string" });
    }

    const escapedName = escapeRegExp(name);
    const existingSchool = await School.findOne({ 
        name: { $regex: new RegExp(`^${escapedName}$`, 'i') }, 
        districtId: district._id 
    });

    if (existingSchool) {
        return res.status(400).json({ message: `School with name "${name}" already exists in this district.` });
    }

    const school = await School.create({
      name,
      address,
      districtId: id,
      district: district.name, // Keep legacy field
      state: state || district.state,
      country: country || district.country,
      timeZone,
      domain,
      createdBy: req.user.id
    });

    return res.status(201).json({
      message: "School added to district successfully",
      school
    });
  } catch (error) {
    console.error("Error adding school to district:", error);
    return res.status(500).json({ message: "Error adding school", error: error.message });
  }
};

// Get schools in district
export const getDistrictSchools = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role === Role.Admin) {
      const adminUser = await ensureAdminDistrictScope(req.user.id);
      if (!adminUser || (adminUser.role !== Role.SystemAdmin && id !== adminUser.districtId.toString())) {
        return res.status(403).json({ message: "Access denied: You do not have permission for this district." });
      }
    }

    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [schools, total] = await Promise.all([
      School.find({ districtId: id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name email'),
      School.countDocuments({ districtId: id })
    ]);

    // Get counts for each school
    const schoolIds = schools.map(s => s._id);
    
    const [teacherCounts, studentCounts] = await Promise.all([
      Teacher.aggregate([
        { $match: { schoolId: { $in: schoolIds } } },
        { $group: { _id: "$schoolId", count: { $sum: 1 } } }
      ]),
      Student.aggregate([
        { $match: { schoolId: { $in: schoolIds } } },
        { $group: { _id: "$schoolId", count: { $sum: 1 } } }
      ])
    ]);

    const teacherCountMap = teacherCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});

    const studentCountMap = studentCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});

    const schoolsWithCounts = schools.map(s => ({
      ...s.toObject(),
      teacherCount: teacherCountMap[s._id.toString()] || 0,
      studentCount: studentCountMap[s._id.toString()] || 0
    }));

    return res.status(200).json({
      schools: schoolsWithCounts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching district schools:", error);
    return res.status(500).json({ message: "Error fetching schools", error: error.message });
  }
};

// Assign District Admin
export const assignDistrictAdmin = async (req, res) => {
  try {
    const { id } = req.params; // District ID from URL params

    if (req.user.role === Role.Admin) {
      const adminUser = await ensureAdminDistrictScope(req.user.id);
      if (!adminUser || (adminUser.role !== Role.SystemAdmin && id !== adminUser.districtId.toString())) {
        return res.status(403).json({ message: "Access denied: You do not have permission for this district." });
      }
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, and password are required for admin registration." });
    }

    const district = await District.findById(id);
    if (!district) {
      return res.status(404).json({ message: "District not found" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: Role.DistrictAdmin,
      districtId: id,
      approved: true
    });

    // Send registration email (non-blocking)
    sendDistrictAdminRegistrationMail(admin.email, admin.name, {
        districtName: district.name,
        role: 'District Admin'
    }).catch(err => {
        console.error("Error sending district admin registration mail:", err);
    });

    return res.status(201).json({
      message: "District admin assigned successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error("Error assigning district admin:", error);
    return res.status(500).json({ message: "Error assigning admin", error: error.message });
  }
};
