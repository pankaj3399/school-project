import School from "../models/School.js";

export const getAllSchools = async (req, res) => {
    try{
        const schools = await School.find()
        return res.status(200).json({
            message:"Schools Fetched Successfully",
            schools
        })
    }catch(error){
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
}

export const getStudents = async (req, res) => {
    try {
        const school = await School.findOne({ createdBy: req.user.id }).populate('students');
        if (!school) {
            return res.status(404).json({ message: 'School not found' });
        }
        return res.status(200).json({ students: school.students });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'An error occurred', error: err.message });
    }
};
export const getTeachers = async (req, res) => {
    try {
        const school = await School.findOne({ createdBy: req.user.id }).populate('teachers');
        if (!school) {
            return res.status(404).json({ message: 'School not found' });
        }
        return res.status(200).json({ teachers: school.teachers });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'An error occurred', error: err.message });
    }
};
export const getCurrentSchool = async (req, res) => {
    try {
        const school = await School.findOne({ createdBy: req.user.id });
        if (!school) {
            return res.status(404).json({ message: 'School not found' });
        }
        return res.status(200).json({ school: school });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'An error occurred', error: err.message });
    }
};