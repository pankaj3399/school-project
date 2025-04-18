import { Role } from "../enum.js";
import { getVerificationEmailTemplate } from "../utils/emailTemplates.js";
import { sendEmail } from "./nodemailer.js";
import path from 'path';
import fs from 'fs';

export const sendVerifyEmailRoster = async (req, res, user, isStudent= false) => {
    try {
        const { url } = req.body;

        if (!user) {
            return res.status(404).json({ message: "User Not Found" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otp2 = Math.floor(100000 + Math.random() * 900000).toString();

        console.log("OTP: for "+user.email+" ", otp);
        console.log("OTP2: for "+user.email+" ", otp2);
        
        user.emailVerificationCode = otp;
        if(isStudent){
            user.studentEmailVerificationCode = otp2;
        }
        await user.save();

        // Wait for the template to be generated
        const emailHTML = await getVerificationEmailTemplate(user.role, otp, url, user.email,user.parentEmail,false);
        const emailHTMLP2 = await getVerificationEmailTemplate(user.role, otp, url, user.email,user.standard,false);
        const emailHTML2 = await getVerificationEmailTemplate(user.role, otp2, url, user.email,null, isStudent);

        if(isStudent){            
            await sendEmail(
                user.email,
                "Verify Your Email - The Radu Framework",
                emailHTML2,
                emailHTML2,
                null
            );
            return true
        }
        // For students, send to parent email(s)
        const emailRecipients = user.role === Role.Student 
            ? [user.parentEmail, user.standard]
            : [user.email];
        
        if (user.role === Role.Student ){
            await sendEmail(
                user.parentEmail,
                "Verify Your Email - The Radu Framework",
                emailHTML,
                emailHTML,
                null
            );
            if(user.standard){
                await sendEmail(
                    user.standard,
                    "Verify Your Email - The Radu Framework",
                    emailHTMLP2,
                    emailHTMLP2,
                    null
                );
            }

            return true
        }
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
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error(error.message);
    }
};

export const sendOnboardingEmail = async (user) => {
    try {
        let pdf_url = null;
        let video_url = null;
        let userType = '';

        switch(user.type) {
            case 'Lead':
                pdf_url = process.env.LEAD_PDF_URL;
                video_url = process.env.LEAD_VIDEO_URL;
                userType = 'Leader/Lead Teacher';
                break;
            case 'Special':
                pdf_url = process.env.TEAM_MEMBER_PDF_URL;
                video_url = process.env.TEAM_MEMBER_VIDEO_URL;
                userType = 'Team Member/Special Teacher';
                break;
            default:
                throw new Error('Invalid user type');
        }

        // Get logo source similar to verification email template
        let logoSrc;
        try {
            const logoPath = path.join(process.cwd(), 'utils', 'radu-logo.png');
            const logoBuffer = fs.readFileSync(logoPath);
            logoSrc = `data:image/png;base64,${logoBuffer.toString('base64')}`;
        } catch (error) {
            console.error('Error loading logo:', error);
            logoSrc = 'https://d913gn73yx.ufs.sh/f/tYbhM2OqcVubWFWYRwDPC6laGXixIANf8RnFkd2OHKrDTo3M';
        }

        const emailHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    .button {
                        background-color: #00a58c;
                        color: white;
                        padding: 12px 24px;
                        text-decoration: none;
                        border-radius: 4px;
                        font-weight: bold;
                        display: inline-block;
                        margin: 10px 5px;
                    }
                    .resource-section {
                        background: #f5f5f5;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 20px 0;
                    }
                </style>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <img src="${logoSrc}" alt="Radu Framework Logo" style="width: 150px; height: auto;">
                </div>
                
                <div style="background: #f9f9f9; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
                    <h2 style="color: #00a58c; margin-bottom: 20px;">Welcome to The Radu Framework!</h2>
                    
                    <p style="margin-bottom: 20px;">Dear ${user.name},</p>
                    
                    <p style="margin-bottom: 20px;">Welcome aboard as a ${userType}! We're excited to have you join The Radu Framework community. To help you get started, we've prepared some essential resources for you.</p>
                    
                    <div class="resource-section">
                        <h3 style="color: #00a58c;">Your Resources</h3>
                        ${pdf_url ? `
                            <div style="margin: 15px 0;">
                                <p style="margin-bottom: 10px;"><strong>📚 Training Guide</strong></p>
                                <a href="${pdf_url}" class="button" style="background-color: #00a58c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                                    Download Guide
                                </a>
                            </div>
                        ` : ''}
                        
                        ${video_url ? `
                            <div style="margin: 15px 0;">
                                <p style="margin-bottom: 10px;"><strong>🎥 Training Video</strong></p>
                                <a href="${video_url}" class="button" style="background-color: #00a58c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                                    Watch Video
                                </a>
                            </div>
                        ` : ''}
                    </div>
                    
                    <p style="margin-top: 20px;">These resources will help you understand:</p>
                    <ul style="margin-left: 20px; margin-bottom: 20px;">
                        <li>The E-Token system basics</li>
                        <li>How to award points to students</li>
                        <li>Best practices and guidelines</li>
                        <li>System features and capabilities</li>
                    </ul>
                </div>
                
                <div style="text-align: center; font-size: 12px; color: #666;">
                    <p>This is an automated message from The Radu Framework.<br>
                       If you have any questions, please contact your school administrator.</p>
                </div>
            </body>
            </html>
        `;

        await sendEmail(
            user.email,
            "Welcome to The Radu Framework - Getting Started Resources",
            emailHTML,
            emailHTML,
            null
        );

        return true;
    } catch(err) {
        console.error('Error sending onboarding email:', err);
        throw new Error(err.message);
    }
}