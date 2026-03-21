import mongoose from 'mongoose';
import XLSX from 'xlsx';
import Admin from '../models/Admin.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import School from '../models/School.js';
import { TermsOfUse, TermsAcceptance } from '../models/TermsOfUse.js';

export const getDashboardStats = async (req, res) => {
    try {
        const totalDistricts = await School.distinct('district').then(districts => districts.length);
        const activeDistricts = totalDistricts; // Simplified
        const totalSchools = await School.countDocuments();
        const totalTeachers = await Teacher.countDocuments();
        const totalStudents = await Student.countDocuments();
        
        // Mock growth data for now as per dashboard requirements
        const growth30d = "+12.5%"; 
        const totalTokensEarned = await Student.aggregate([
            { $group: { _id: null, total: { $sum: "$points" } } }
        ]).then(aggRes => aggRes[0]?.total || 0);

        res.status(200).json({
            stats: {
                totalDistricts,
                activeDistricts,
                totalSchools,
                totalTeachers,
                totalStudents,
                totalTokensEarned,
                growth30d
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
    }
};

export const getStateLevelStats = async (req, res) => {
    try {
        // Mock implementation
        res.status(200).json({ states: [] });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching state stats', error: error.message });
    }
};

export const getDistrictComparison = async (req, res) => {
    try {
        // Mock implementation
        res.status(200).json({ districts: [] });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching district comparison', error: error.message });
    }
};

export const getCurrentTerms = async (req, res) => {
    try {
        const terms = await TermsOfUse.findOne({ isActive: true }).sort({ createdAt: -1 });
        res.status(200).json({ terms });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching terms', error: error.message });
    }
};

export const createTermsVersion = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { version, title, content, contentHtml, effectiveDate } = req.body;
        
        await session.withTransaction(async () => {
            // Deactivate old versions
            await TermsOfUse.updateMany({}, { isActive: false }, { session });
            
            await TermsOfUse.create([{
                version,
                title,
                content,
                contentHtml,
                effectiveDate,
                isActive: true
            }], { session });
        });
        
        res.status(201).json({ message: 'Terms version created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error creating terms version', error: error.message });
    } finally {
        session.endSession();
    }
};

export const getAllTermsVersions = async (req, res) => {
    try {
        const terms = await TermsOfUse.find().sort({ createdAt: -1 });
        res.status(200).json({ terms });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching terms versions', error: error.message });
    }
};

export const recordTermsAcceptance = async (req, res) => {
    try {
        const { termsVersion } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Look up server-authoritative active terms version
        const activeTerms = await TermsOfUse.findOne({ isActive: true }).sort({ createdAt: -1 });
        if (!activeTerms) {
            return res.status(404).json({ message: 'No active terms version found' });
        }

        // Compare with client-supplied version and handle mismatches
        if (termsVersion && termsVersion !== activeTerms.version) {
            return res.status(400).json({ 
                message: 'Terms version mismatch', 
                clientVersion: termsVersion, 
                activeVersion: activeTerms.version 
            });
        }

        let user;
        const updateData = {
            termsAccepted: true,
            termsAcceptedVersion: activeTerms.version,
            termsAcceptedAt: new Date()
        };
        const updateOptions = { new: true, runValidators: true, select: '-password -salt' };

        switch (userRole) {
            case 'Teacher':
                user = await Teacher.findByIdAndUpdate(userId, updateData, updateOptions);
                break;
            case 'Admin':
            case 'SchoolAdmin':
            case 'SystemAdmin':
                user = await Admin.findByIdAndUpdate(userId, updateData, updateOptions);
                break;
            case 'Student':
                user = await Student.findByIdAndUpdate(userId, updateData, updateOptions);
                break;
            default:
                return res.status(400).json({ message: 'Unknown user role' });
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create independent audit record in TermsAcceptance collection
        await TermsAcceptance.create({
            userId,
            userModel: userRole === 'Teacher' ? 'Teacher' : (userRole === 'Student' ? 'Student' : 'User'),
            userType: userRole,
            termsAcceptedVersion: activeTerms.version,
            acceptedAt: updateData.termsAcceptedAt,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.status(200).json({ message: 'Terms acceptance recorded successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error recording terms acceptance', error: error.message });
    }
};

export const getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().select('-password');
        res.status(200).json({ admins });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching admins', error: error.message });
    }
};

/**
 * Bulk import schools and districts from an Excel file.
 * Validates magic bytes before parsing.
 */
export const bulkImportSchools = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const buffer = file.buffer;
    
    // Validate magic bytes
    // XLSX (ZIP/PK signature: bytes 50 4B 03 04)
    const isXLSX = buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;
    // Legacy XLS (OLE compound file header: bytes D0 CF 11 E0 A1 B1 1A E1)
    const isXLS = buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0 &&
                  buffer[4] === 0xA1 && buffer[5] === 0xB1 && buffer[6] === 0x1A && buffer[7] === 0xE1;

    if (!isXLSX && !isXLS) {
      return res.status(400).json({ 
        error: 'Invalid file format. Only XLSX and legacy XLS files are allowed based on signature validation.' 
      });
    }

    // Parse the workbook only after signature validation
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty Excel workbook.' });
    }

    const sheetName = workbook.SheetNames[0];
    const datasheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(datasheet);

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: 'Excel file contains no data rows.' });
    }

    const results = {
      success: [],
      errors: []
    };

    // Process rows and map headers to expected frontend keys
    for (const row of rows) {
      // Map "School Name" -> schoolName and "District Name" -> districtName
      const mappedRow = {
        schoolName: row['School Name'] || row.schoolName,
        districtName: row['District Name'] || row.districtName,
        ...row
      };
      results.success.push(mappedRow);
    }

    return res.status(200).json({ 
      message: 'Processing complete', 
      results 
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    return res.status(500).json({ 
      error: 'Internal server error during bulk import processing' 
    });
  }
};
