import District from '../models/District.js';
import School from '../models/School.js';
import User from '../models/Admin.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import PointsHistory from '../models/PointsHistory.js';
import { Role } from '../enum.js';
import mongoose from 'mongoose';

// Create a new district
export const createDistrict = async (req, res) => {
  try {
    const { name, code, state, contactEmail, address, city, zipCode, contactPhone, contactName } = req.body;
    
    // Check if code already exists
    const existingDistrict = await District.findOne({ code: code.toUpperCase() });
    if (existingDistrict) {
      return res.status(400).json({ message: 'District code already exists' });
    }

    const district = new District({
      name,
      code: code.toUpperCase(),
      state,
      contactEmail,
      address,
      city,
      zipCode,
      contactPhone,
      contactName,
      createdBy: req.user.id
    });

    await district.save();
    res.status(201).json(district);
  } catch (error) {
    res.status(500).json({ message: 'Error creating district', error: error.message });
  }
};

// Get all districts
export const getDistricts = async (req, res) => {
  try {
    const districts = await District.find().sort({ name: 1 });
    res.status(200).json(districts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching districts', error: error.message });
  }
};

// Get district by ID
export const getDistrictById = async (req, res) => {
  try {
    const district = await District.findById(req.params.id);
    if (!district) {
      return res.status(404).json({ message: 'District not found' });
    }
    res.status(200).json(district);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching district', error: error.message });
  }
};

// Update district
export const updateDistrict = async (req, res) => {
  try {
    const district = await District.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!district) {
      return res.status(404).json({ message: 'District not found' });
    }
    res.status(200).json(district);
  } catch (error) {
    res.status(500).json({ message: 'Error updating district', error: error.message });
  }
};

// Delete district
export const deleteDistrict = async (req, res) => {
  try {
    const districtId = req.params.id;
    
    // Check if any schools are associated with this district
    const schoolCount = await School.countDocuments({ districtId });
    if (schoolCount > 0) {
      return res.status(400).json({ message: 'Cannot delete district with associated schools' });
    }

    const district = await District.findByIdAndDelete(districtId);
    if (!district) {
      return res.status(404).json({ message: 'District not found' });
    }
    
    // Remove districtId from any users
    await User.updateMany({ districtId }, { $set: { districtId: null } });

    res.status(200).json({ message: 'District deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting district', error: error.message });
  }
};

// Get district statistics
export const getDistrictStats = async (req, res) => {
  try {
    const districtId = new mongoose.Types.ObjectId(req.params.id);
    
    const schools = await School.find({ districtId });
    const schoolIds = schools.map(s => s._id);
    
    const stats = {
      schoolCount: schools.length,
      teacherCount: await Teacher.countDocuments({ schoolId: { $in: schoolIds } }),
      studentCount: await Student.countDocuments({ schoolId: { $in: schoolIds } }),
      totalPoints: 0
    };
    
    const pointsAggregation = await PointsHistory.aggregate([
      { $match: { schoolId: { $in: schoolIds } } },
      { $group: { _id: null, total: { $sum: '$points' } } }
    ]);
    
    stats.totalPoints = pointsAggregation[0]?.total || 0;
    
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching district stats', error: error.message });
  }
};

// Add school to district
export const addSchoolToDistrict = async (req, res) => {
  try {
    const { schoolId } = req.body;
    const districtId = req.params.id;
    
    const district = await District.findById(districtId);
    if (!district) return res.status(404).json({ message: 'District not found' });
    
    const school = await School.findByIdAndUpdate(
      schoolId,
      { districtId, district: district.name },
      { new: true }
    );
    
    if (!school) return res.status(404).json({ message: 'School not found' });
    
    res.status(200).json(school);
  } catch (error) {
    res.status(500).json({ message: 'Error adding school to district', error: error.message });
  }
};

// Get schools in district
export const getDistrictSchools = async (req, res) => {
  try {
    const schools = await School.find({ districtId: req.params.id }).sort({ name: 1 });
    res.status(200).json(schools);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching district schools', error: error.message });
  }
};

// Assign district admin
export const assignDistrictAdmin = async (req, res) => {
  try {
    const { userId } = req.body;
    const districtId = req.params.id;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { role: Role.DistrictAdmin, districtId },
      { new: true }
    );
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.status(200).json({ message: 'District admin assigned successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning district admin', error: error.message });
  }
};
