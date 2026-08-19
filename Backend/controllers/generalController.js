import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import User from "../models/Admin.js";
import {Role} from '../enum.js';
import { stripPasswordFields } from "../models/passwordPrivacy.js";

export const getCurrentUser  = async (req, res) =>{
    try{
        let user; 
        switch(req.user.role){
            // password is select:false; do not .select('-password') — that can re-include the hash
            case Role.Student: user = await Student.findById(req.user.id).populate('schoolId')
                            break;
            case Role.Teacher: user = await Teacher.findById(req.user.id).populate('schoolId')
                            break;
            default: user = await User.findById(req.user.id).populate('schoolId')
                            break;
        }
        if(!user){
            return res.status(404).json({
                message:"user Not Found"
            })
        }
        return res.status(200).json({ user: stripPasswordFields(user) })
    }catch(error){
        return res.status(500).json({ message: 'Server Error', error: error.message });   
    }
}