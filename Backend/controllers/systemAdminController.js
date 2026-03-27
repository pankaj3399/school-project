import District from '../models/District.js';
import School from '../models/School.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import Admin from '../models/Admin.js';
import { TermsOfUse, TermsAcceptance } from "../models/TermsOfUse.js";
import crypto from 'crypto';
import { escapeRegExp } from '../utils/stringUtils.js';
import { Role } from "../enum.js";
import PointsHistory from "../models/PointsHistory.js";
import xlsx from 'xlsx';
import bcrypt from 'bcryptjs';

// Get top-level dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const totalDistricts = await District.countDocuments();
    const activeDistricts = await District.countDocuments({ subscriptionStatus: 'active' });
    const pendingDistricts = await District.countDocuments({ subscriptionStatus: 'pending' });
    const totalSchools = await School.countDocuments();
    const totalTeachers = await Teacher.countDocuments();
    const totalStudents = await Student.countDocuments();
    const totalPointsResult = await PointsHistory.aggregate([
      { $group: { _id: null, total: { $sum: "$awarded" } } }
    ]);
    const totalPoints = totalPointsResult[0]?.total || 0;

    // Get recent activity
    const recentDistricts = await District.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name code state subscriptionStatus createdAt');

    return res.status(200).json({
      stats: {
        totalDistricts,
        activeDistricts,
        pendingDistricts,
        totalSchools,
        totalTeachers,
        totalStudents,
        totalTokensEarned: totalPoints
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
    const districtStats = await District.aggregate([
      { $match: { subscriptionStatus: 'active' } },
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
          totalTokens: { $sum: '$pointsHistory.awarded' }
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

    // Create new district with template settings
    const newDistrict = await District.create({
      ...newDistrictData,
      code: newDistrictData.code?.toUpperCase(),
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
