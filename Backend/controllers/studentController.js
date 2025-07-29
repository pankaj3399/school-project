import School from "../models/School.js"
import Student from "../models/Student.js"
import bcrypt from "bcryptjs"
import {Role} from '../enum.js';
import Admin from "../models/Admin.js";
import Teacher from "../models/Teacher.js";
import { checkStudentVerification } from "../utils/studentVerification.js";
export const addStudent = async (req, res) => {
    const {
        name,
        password,
        email,
        standard,
        parentEmail,
        sendNotifications,
        grade
    } = req.body

    let user;

    if(req.user.role == Role.Teacher){
        user = await Teacher.findById(req.user.id);
    }else{
        user = await Admin.findById(req.user.id)
    }


    try{
        const hashedPassword = await bcrypt.hash(password, 12)
        
        const student = await Student.create({
            name,
            password: hashedPassword,
            standard,
            email,
            role: Role.Student,
            parentEmail,
            sendNotifications,
            schoolId: user.schoolId,
            grade
        })
        await School.findOneAndUpdate({
            _id: user.schoolId
        }, {
            $push:{
                students:student._id
            }
        })
        return res.status(200).json({
            message: "Student Added successfully",
            student
        })
    }catch(error){
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
}

export const updateStudent = async (req, res) => {
    const studentId = req.params.id;
    const { name, email, standard, parentEmail, sendNotifications, grade } = req.body;

    try{
        // Check if student is verified before allowing updates
        const verificationCheck = await checkStudentVerification(studentId);
        if (!verificationCheck.verified) {
            return res.status(403).json({ 
                message: verificationCheck.error 
            });
        }

        const updatedStudent = await Student.findByIdAndUpdate(studentId, {
            $set: { name, email, standard, parentEmail, sendNotifications, grade }
        }, { new: true });

        return res.status(200).json({ message: 'Student updated successfully', student: updatedStudent });
    }catch(error){
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
}

export const deleteStudent = async (req, res) => {
    const studentId = req.params.id;

    try{
        // Check if student is verified before allowing deletion
        const verificationCheck = await checkStudentVerification(studentId);
        if (!verificationCheck.verified) {
            return res.status(403).json({ 
                message: verificationCheck.error 
            });
        }

        const deletedStudent = await Student.findByIdAndDelete(studentId);

        await School.updateMany(
            { students: studentId },
            { $pull: { students: studentId } }
        );

        return res.status(200).json({ message: 'Student deleted successfully' });
    }catch(error){
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
}