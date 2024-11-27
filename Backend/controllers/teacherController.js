import Student from '../models/Student.js';
import School from "../models/School.js"
import bcrypt from "bcryptjs"
import Teacher from "../models/Teacher.js"

export const awardPoints = async (req, res) => {
    const { studentId, points } = req.body;
    const teacherId = req.user.id;

    try {
        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        student.points += points;
        await student.save();

        res.status(200).json({ message: 'Points awarded successfully', student });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

export const addTeacher = async (req, res) => {
    const {
        name,
        password,
        email,
        subject,
        schoolId
    } = req.body

    try{
        const hashedPassword = await bcrypt.hash(password, 12)
        
        const teacher = await Teacher.create({
            name,
            email,
            password: hashedPassword,
            subject,
            role: 'Teacher'
        })
        await School.findOneAndUpdate({
            _id: schoolId
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