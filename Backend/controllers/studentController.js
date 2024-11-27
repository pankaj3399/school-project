import School from "../models/School"
import Student from "../models/Student"
import bcrypt from "bcryptjs"
export const addStudent = async (req, res) => {
    const {
        name,
        password,
        email,
        standard,
        schoolId
    } = req.body

    try{
        const hashedPassword = await bcrypt.hash(password, 12)
        
        const student = await Student.create({
            name,
            password: hashedPassword,
            standard,
            email,
            role: 'Student'
        })
        await School.findOneAndUpdate({
            _id: schoolId
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