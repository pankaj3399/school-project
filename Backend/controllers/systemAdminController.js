import Admin from '../models/Admin.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import School from '../models/School.js';
import TermsOfUse from '../models/TermsOfUse.js';

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
        ]).then(res => res[0]?.total || 0);

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
    try {
        const { version, title, content, contentHtml, effectiveDate } = req.body;
        
        // Deactivate old versions
        await TermsOfUse.updateMany({}, { isActive: false });
        
        const newTerms = await TermsOfUse.create({
            version,
            title,
            content,
            contentHtml,
            effectiveDate,
            isActive: true
        });
        
        res.status(201).json({ message: 'Terms version created successfully', terms: newTerms });
    } catch (error) {
        res.status(500).json({ message: 'Error creating terms version', error: error.message });
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

        let user;
        if (userRole === 'Teacher') {
            user = await Teacher.findByIdAndUpdate(userId, {
                termsAccepted: true,
                termsAcceptedVersion: termsVersion
            }, { new: true });
        } else {
            user = await Admin.findByIdAndUpdate(userId, {
                termsAccepted: true,
                termsAcceptedVersion: termsVersion
            }, { new: true });
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

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
