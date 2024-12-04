import { Role } from "../enum.js";
import School from "../models/School.js";
import { uploadImageFromDataURI } from "../utils/cloudinary.js"
import Teacher from "../models/Teacher.js";
export const getAllSchools = async (req, res) => {
    try {
      const schools = await School.find();
      res.status(200).json({ message: "Schools fetched successfully", schools });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };

export const getStudents = async (req, res) => {
    try {
        let school;
        if(req.user.role === Role.Teacher){
            const teacher = await Teacher.findById(req.user.id);
            school = await School.findOne({ _id: teacher.schoolId }).populate('students');
        }else{
            school = await School.findOne({ createdBy: req.user.id }).populate('students');
        }

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

export const updateSchool = async (req, res) => {
    const { name, address } = req.body;
    const logo = req.file;
  
    try {
      const logoUrl = await uploadImageFromDataURI(logo);
      const updatedSchool = await School.findByIdAndUpdate(
        req.params.id,
        { name, address, logo: logoUrl },
        { new: true }
      );
  
      if (!updatedSchool) return res.status(404).json({ message: "School not found." });
  
      res.status(200).json({ message: "School updated successfully", school: updatedSchool });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };

export const deleteSchool = async (req, res) => {
   
    try{
        const school = await School.findByIdAndDelete(req.params.id)
        if(!school){
            return res.status(404).json({ message: 'School not found' });
        }
        await Admin.findByIdAndUpdate(school.createdBy, {
            schoolId: null
        })
        return res.status(200).json({
            message:"School Deleted Successfully",
            school
        })
    }catch(error){
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
}