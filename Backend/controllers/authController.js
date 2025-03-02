import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import bcrypt from "bcryptjs"
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import {Role} from '../enum.js';
import { sendEmail } from "../services/nodemailer.js";
import Otp from '../models/Otp.js';
import { getVerificationEmailTemplate } from '../utils/emailTemplates.js';

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};



export const login = async (req, res) => {
    const { email, password, role,  } = req.body;
    let userRole = role == "SpecialTeacher" ? Role.Teacher : role;
    

    try {
      let user;
      switch(userRole){
        case Role.Teacher:{
            user = await Teacher.findOne({email})
            break;
        }
        case Role.Student:{
            user = await Student.findOne({email})
            break;
        }
        default: {
            user = await Admin.findOne({email})
            break
        }
      }

      if (!user) return res.status(404).json({ message: 'User not found' });

      if(role === Role.Admin && !user.approved) return res.status(401).json({ message: 'User not approved' });
       

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid Credentials' });

        const token = generateToken(user._id, userRole);
        res.status(200).json({ token, role, userId: user._id });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


export const signup = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 12)
        const newUser = await Admin.create({
            name,
            email,
            password: hashedPassword,
            role,
        }) 
        const savedUser = await newUser.save();
        const token = generateToken(savedUser._id, role);
        if(!newUser.approved) return res.status(401).json({ message: 'User not approved' });   
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: savedUser._id, name: savedUser.name, email: savedUser.email, role },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

export const sendOtp = async (req, res) => {
    try {
        const { email , role} = req.body;

        
        

        let user = null;
        switch (role) {
            case Role.Teacher: {
                user = await Teacher.findOne({ email });
                break;
            }
            case Role.Student: {
                user = await Student.findOne({ email });
                break;
            }
            default: {
                user = await Admin.findOne({ email });
                break;
            }
        }

        if (!user) {
            return res.status(404).json({ message: "User Not Found" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();


        const newOtp = new Otp({
            userId: user._id,
            otp: otp,
        });

        await newOtp.save();

        const body = `<p>Use this code to reset your password <b>${otp}</b> <br/> <i>The code will expire in 30 min</i></p>`

        await sendEmail(user.email, "PASSWORD RESET OTP", body, body, null);

        res.status(200).json({
            message: "OTP sent successfully",
            otpId: newOtp._id
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

export const verifyOtp = async (req, res) => {
    try {
        const { otp, email, role } = req.body;
        
        let user;
        switch (role) {
            case Role.Teacher: {
                user = await Teacher.findOne({ email });
                break;
            }
            case Role.Student: {
                user = await Student.findOne({ email });
                break;
            }
            default: {
                user = await Admin.findOne({ email });
                break;
            }
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find the OTP associated with the user
        const storedOtp = await Otp.findOne({ otp });

        if (!storedOtp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // Check if the OTP has expired
        if (storedOtp.expiresAt < new Date()) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        res.status(200).json({ message: "OTP verified successfully", otpId: storedOtp._id, userId: storedOtp.userId });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

export const sendVerifyEmail = async (req, res) => {
    try {
        const { email, role, url, userId } = req.body;
        let user = null;
        switch (role) {
            case Role.Teacher: {
                user = await Teacher.findById(userId);
                break;
            }
            case Role.Student: {
                user = await Student.findById(userId);
                break;
            }
            default: {
                user = null;
                break;
            }
        }

        if (!user) {
            return res.status(404).json({ message: "User Not Found" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.emailVerificationCode = otp;
        await user.save();

        // Wait for the template to be generated
        const emailHTML = await getVerificationEmailTemplate(role, otp, url, email);
        
        // For students, send to parent email(s)
        const emailRecipients = role === Role.Student 
            ? [user.parentEmail, user.parentEmail2].filter(Boolean)
            : [email];

        // Send email to all recipients
        for (const recipient of emailRecipients) {
            await sendEmail(
                recipient,
                "Verify Your Email - The Radu Framework",
                emailHTML,
                emailHTML,
                null
            );
        }

        res.status(200).json({
            message: "Verification email sent successfully"
        });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

export const completeVerification = async (req, res) => {
    try {
        const { emailVerificationCode, role, email } = req.body;

        let user = null;
        switch (role) {
            case Role.Teacher: {
                // Find teacher with matching verification code
                user = await Teacher.findOne({ emailVerificationCode });
                if (user) {
                    user.isEmailVerified = true;
                    user.emailVerificationCode = null; // Clear the code
                    await user.save();
                }
                break;
            }
            case Role.Student: {
                // For students, need to handle multiple parent emails
                const student = await Student.findOne({ emailVerificationCode });
                if (student) {
                    // If parent emails exist, verify them
                    if (student.parentEmail == email) {
                        student.isParentOneEmailVerified = true;
                    }
                    if (student.standard == email) {
                        student.isParentTwoEmailVerified = true;
                    }
                    student.emailVerificationCode = null; // Clear the code
                    await student.save();
                    user = student;
                }
                break;
            }
            default: {
                return res.status(400).json({ message: "Invalid role" });
            }
        }

        if (!user) {
            return res.status(400).json({ message: "Invalid verification code" });
        }

        res.status(200).json({
            message: "Email verification completed successfully",
            user: {
                id: user._id,
                role,
                ...(role === Role.Student ? {
                    isParentEmailVerified: user.isParentEmailVerified,
                    isParentEmail2Verified: user.isParentEmail2Verified
                } : {
                    isEmailVerified: user.isEmailVerified
                })
            }
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { otpId, email, role, password } = req.body;

        // Find the user based on email and role
        let user;
        switch (role) {
            case Role.Teacher: {
                user = await Teacher.findOne({ email });
                break;
            }
            case Role.Student: {
                user = await Student.findOne({ email });
                break;
            }
            default: {
                user = await Admin.findOne({ email });
                break;
            }
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Validate the OTP
        const otpRecord = await Otp.findOne({ _id: otpId, userId: user._id });

        if (!otpRecord) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // Check if the OTP has expired
        if (otpRecord.expiresAt < new Date()) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Update the user's password
        user.password = hashedPassword;
        await user.save();

        // Delete the OTP record to prevent reuse
        await Otp.deleteOne({ _id: otpId });

        // Respond with success
        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};


