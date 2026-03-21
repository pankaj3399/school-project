import District from "../models/District.js";
import School from "../models/School.js";
import User from "../models/Admin.js";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import { Role } from "../enum.js";
import PointsHistory from "../models/PointsHistory.js";

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

    // Check if district code already exists
    const existingDistrict = await District.findOne({ code: code.toUpperCase() });
    if (existingDistrict) {
      return res.status(400).json({ message: "District with this code already exists" });
    }

    const district = await District.create({
      name,
      code: code.toUpperCase(),
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
    });

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
    
    if (state) query.state = state;
    if (status) query.subscriptionStatus = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
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

    const districtsWithCounts = districts.map(d => ({
      ...d.toObject(),
      schoolCount: schoolCountMap[d._id.toString()] || 0
    }));

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
    
    const district = await District.findById(id)
      .populate('createdBy', 'name email')
      .populate('termsAcceptedBy', 'name email');

    if (!district) {
      return res.status(404).json({ message: "District not found" });
    }

    // Get associated schools
    const schools = await School.find({ districtId: id })
      .select('name address createdAt');

    // Get admin counts
    const districtAdmins = await User.countDocuments({ 
      districtId: id, 
      role: Role.DistrictAdmin 
    });

    return res.status(200).json({
      district,
      schools,
      adminCount: districtAdmins
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
    const updates = req.body;

    // Don't allow updating certain fields
    delete updates.code;
    delete updates.createdBy;
    delete updates.createdAt;

    const district = await District.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true }
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
      { new: true }
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
        { $group: { _id: null, total: { $sum: "$awarded" } } }
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

    const district = await District.findById(id);
    if (!district) {
      return res.status(404).json({ message: "District not found" });
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
    const { id } = req.params;
    const { name, email, password } = req.body;

    const district = await District.findById(id);
    if (!district) {
      return res.status(404).json({ message: "District not found" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: Role.DistrictAdmin,
      districtId: id,
      approved: true
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
