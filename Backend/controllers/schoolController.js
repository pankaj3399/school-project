import { Role } from "../enum.js";
import School from "../models/School.js";
import { uploadImageFromDataURI } from "../utils/cloudinary.js"
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
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
      let students;
      if(req.user.role === Role.Teacher) {
        const teacher = await Teacher.findById(req.user.id);
        if(teacher.type === 'Lead') {
          // Lead teachers only see their grade's students
          students = await Student.find({ 
            schoolId: teacher.schoolId,
            grade: teacher.grade 
          });
        } else {
          // Special teachers see all students
          students = await Student.find({ schoolId: teacher.schoolId });
        }
      } else {
        // School admin sees all students
        const school = await School.findOne({ createdBy: req.user.id });
        students = await Student.find({ schoolId: school._id });
      }
      return res.status(200).json({ students });
    } catch (err) {
      return res.status(500).json({ error: err.message });
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
       

        let sch;
        switch(req.user.role) {
            case Role.Teacher:
                const teacher = await Teacher.findById(req.user.id);
                sch = await School.findOne({ _id: teacher.schoolId }).populate('createdBy');
                break;
            case Role.SchoolAdmin:
                sch = await School.findOne({ createdBy: req.user.id }).populate('createdBy');
        }

        if (!sch) {
            return res.status(404).json({ message: 'School not found' });
        }
        return res.status(200).json({ school: sch });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'An error occurred', error: err.message });
    }
};

export const updateSchool = async (req, res) => {
    const { name, address, district, state, country } = req.body;
    const logo = req.file;
  
    try {
      let logoUrl = null;
      if(logo)
        logoUrl = await uploadImageFromDataURI(logo);
      let updatedSchool;
      if(logoUrl)
       updatedSchool = await School.findByIdAndUpdate(
        req.params.id,
        { name, address,district, logo: logoUrl, state, country },
        { new: true }
      ).populate('createdBy');
      else
      updatedSchool = await School.findByIdAndUpdate(
        req.params.id,
        { name, address,district, state, country },
        { new: true }
      ).populate('createdBy');
  
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

export const promote = async (req, res) => {
  try {
      const id = req.user.id;
      let school;
      
      // Get school based on user role
      if(req.user.role === Role.Teacher) {
          const user = await Teacher.findById(id);
          school = await School.findById(user.schoolId);
      } else {
          school = await School.findOne({ createdBy: id });
      }

      if(!school) {
          return res.status(404).json({ message: 'School not found' });
      }

      // Get all students except those in grade 6
      const students = await Student.find({ 
          schoolId: school._id,
          grade: { $lt: 12 } 
      });

      // Promote students
      await Student.updateMany(
          { 
              _id: { $in: students.map(s => s._id) },
              grade: { $lt: 12 }
          },
          { $inc: { grade: 1 } }
      );

      return res.status(200).json({
          message: "Students promoted successfully",
          promotedCount: students.length
      });
  } catch(error) {
      return res.status(500).json({ message: 'Server Error', error: error.message });
  }
}