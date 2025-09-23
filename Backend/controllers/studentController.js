import School from "../models/School.js"
import Student from "../models/Student.js"
import bcrypt from "bcryptjs"
import {Role} from '../enum.js';
import Admin from "../models/Admin.js";
import Teacher from "../models/Teacher.js";
import ParentVerification from "../models/ParentVerification.js";
import PointsHistory from "../models/PointsHistory.js";

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

        // Check if there's existing parent verification for this student email
        const existingVerification = await ParentVerification.findOne({
            studentEmail: email,
            schoolId: user.schoolId
        });

        // Set verification status based on existing record
        let isParentOneEmailVerified = false;
        let isParentTwoEmailVerified = false;

        if (existingVerification) {
            // Check if parent emails match existing verification
            if (parentEmail && parentEmail === existingVerification.parentOneEmail) {
                isParentOneEmailVerified = existingVerification.isParentOneEmailVerified;
            }
            if (standard && standard === existingVerification.parentTwoEmail) {
                isParentTwoEmailVerified = existingVerification.isParentTwoEmailVerified;
            }
        }

        const student = await Student.create({
            name,
            password: hashedPassword,
            standard,
            email,
            role: Role.Student,
            parentEmail,
            sendNotifications,
            schoolId: user.schoolId,
            grade,
            isParentOneEmailVerified,
            isParentTwoEmailVerified
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
        const studentToDelete = await Student.findById(studentId);

        if (!studentToDelete) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Save parent verification status before deletion
        if (studentToDelete.parentEmail || studentToDelete.standard) {
            await ParentVerification.findOneAndUpdate(
                {
                    studentEmail: studentToDelete.email,
                    schoolId: studentToDelete.schoolId
                },
                {
                    parentOneEmail: studentToDelete.parentEmail,
                    isParentOneEmailVerified: studentToDelete.isParentOneEmailVerified,
                    parentTwoEmail: studentToDelete.standard,
                    isParentTwoEmailVerified: studentToDelete.isParentTwoEmailVerified,
                    schoolId: studentToDelete.schoolId
                },
                { upsert: true, new: true }
            );
        }

        await PointsHistory.deleteMany({
            submittedForId: studentId
        });

        await Student.findByIdAndDelete(studentId);

        await School.updateMany(
            { students: studentId },
            { $pull: { students: studentId } }
        );

        return res.status(200).json({ message: 'Student deleted successfully' });
    }catch(error){
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
}