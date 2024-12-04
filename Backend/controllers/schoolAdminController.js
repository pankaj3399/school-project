import School from "../models/School.js"
import User from "../models/Admin.js"
import bcrypt from "bcryptjs"
import Teacher from "../models/Teacher.js"
import Student from "../models/Student.js"
import {Role} from '../enum.js';
import { uploadImageFromDataURI } from "../utils/cloudinary.js"

export const addSchool = async (req, res) => {
    const { name, address } = req.body;
    const logo = req.file;
    try {
      const existingSchool = await School.findOne({ createdBy: req.user.id });
      if (existingSchool) {
        return res.status(403).json({ message: "School already exists for this admin." });
      }
      const logoUrl = await uploadImageFromDataURI(logo);
      const newSchool = await School.create({ name, address, logo: logoUrl, createdBy: req.user.id });
  
      await User.findByIdAndUpdate(req.user.id, { schoolId: newSchool._id });
  
      res.status(201).json({ message: "School created successfully", school: newSchool });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
export const addTeacher = async (req, res) => {
    const {
        name,
        password,
        email,
        subject
    } = req.body

    try{
        const hashedPassword = await bcrypt.hash(password, 12)
        
        const teacher = await Teacher.create({
            name,
            email,
            password: hashedPassword,
            subject,
            role: Role.Teacher
        })
        await School.findOneAndUpdate({
            createdBy: req.user.id
        }, {
            $push:{
                teachers:teacher._id
            }
        })
        return res.status(200).json({
            message: "Teacher Added successfully"
        })
    }catch(error){
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
}

export const addStudent = async (req, res) => {
    const {
        name,
        password,
        email,
        standard
    } = req.body

    console.log(email);
    try{
        const hashedPassword = await bcrypt.hash(password, 12)
        
        const student = await Student.create({
            name,
            password: hashedPassword,
            standard,
            email,
            role: Role.Student
        })
        await School.findOneAndUpdate({
            createdBy: req.user.id
        }, {
            $push:{
                students:student._id
            }
        })
        return res.status(200).json({
            message: "Student Added successfully"
        })
    }catch(error){
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
}