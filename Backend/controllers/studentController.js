import School from "../models/School.js"
import Student from "../models/Student.js"
import bcrypt from "bcryptjs"
import {Role} from '../enum.js';
import Admin from "../models/Admin.js";
import Teacher from "../models/Teacher.js";
import ParentVerification from "../models/ParentVerification.js";
import PointsHistory from "../models/PointsHistory.js";
import { assertStudentAccess, isDistrictScopedRole } from "../utils/schoolAccess.js";

const resolveSchoolIdForStudentCreate = async (req) => {
    const requestedSchoolId = req.body?.schoolId || req.query?.schoolId || req.get?.("schoolId");

    if (req.user.role === Role.Teacher) {
        const teacher = await Teacher.findById(req.user.id);
        if (!teacher?.schoolId) {
            const error = new Error("Teacher is not assigned to a school.");
            error.status = 403;
            throw error;
        }
        if (teacher.type !== "Lead") {
            const error = new Error("Only Lead Teachers can add students.");
            error.status = 403;
            throw error;
        }
        return teacher.schoolId;
    }

    if (req.user.role === Role.SchoolAdmin) {
        const admin = await Admin.findById(req.user.id);
        if (!admin?.schoolId) {
            const error = new Error("School Tech is not assigned to a school.");
            error.status = 403;
            throw error;
        }
        return admin.schoolId;
    }

    if (req.user.role === Role.SystemAdmin || isDistrictScopedRole(req.user.role)) {
        if (!requestedSchoolId) {
            const error = new Error("schoolId is required. Select a school before adding a student.");
            error.status = 400;
            throw error;
        }

        if (isDistrictScopedRole(req.user.role)) {
            const admin = await Admin.findById(req.user.id);
            if (!admin?.districtId) {
                const error = new Error("Admin is not assigned to a district.");
                error.status = 403;
                throw error;
            }
            const school = await School.findOne({ _id: requestedSchoolId, districtId: admin.districtId });
            if (!school) {
                const error = new Error("Access denied to school outside your district.");
                error.status = 403;
                throw error;
            }
        }

        return requestedSchoolId;
    }

    const error = new Error("Forbidden");
    error.status = 403;
    throw error;
};

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

    try{
        const schoolId = await resolveSchoolIdForStudentCreate(req);
        if (!schoolId) {
            return res.status(400).json({ message: "schoolId is required. Select a school before adding a student." });
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        // Check if there's existing parent verification for this student email
        const existingVerification = await ParentVerification.findOne({
            studentEmail: email,
            schoolId: schoolId
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
            schoolId,
            grade,
            isParentOneEmailVerified,
            isParentTwoEmailVerified
        })
        await School.findOneAndUpdate({
            _id: schoolId
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
        const status = error.status || 500;
        return res.status(status).json({ message: error.message || 'Server Error', error: error.message });
    }
}

export const updateStudent = async (req, res) => {
    const studentId = req.params.id;
    const { name, email, standard, parentEmail, sendNotifications, grade } = req.body;

    try{
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        await assertStudentAccess(req, student);

        const updatedStudent = await Student.findByIdAndUpdate(studentId, {
            $set: { name, email, standard, parentEmail, sendNotifications, grade }
        }, { new: true });

        return res.status(200).json({ message: 'Student updated successfully', student: updatedStudent });
    }catch(error){
        const status = error.status || 500;
        return res.status(status).json({ message: error.message || 'Server Error', error: error.message });
    }
}

export const deleteStudent = async (req, res) => {
    const studentId = req.params.id;

    try{
        const studentToDelete = await Student.findById(studentId);

        if (!studentToDelete) {
            return res.status(404).json({ message: 'Student not found' });
        }

        await assertStudentAccess(req, studentToDelete);

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
        const status = error.status || 500;
        return res.status(status).json({ message: error.message || 'Server Error', error: error.message });
    }
}