import { Role } from "../enum.js";
import { getVerificationEmailTemplate } from "../utils/emailTemplates.js";
import { sendEmail } from "./nodemailer.js";
import path from 'path';
import fs from 'fs';

export const sendVerifyEmailRoster = async (req, res, user, isStudent= false, tempPass, schoolLogo=null) => {
    try {
        const { url } = req.body;

        if (!user) {
            return res.status(404).json({ message: "User Not Found" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otp2 = Math.floor(100000 + Math.random() * 900000).toString();
        
        user.emailVerificationCode = otp;
        if(isStudent){
            user.studentEmailVerificationCode = otp2;
        }
        await user.save();

        // Wait for the template to be generated
        const emailHTML = await getVerificationEmailTemplate(user.role, otp, url, user.email,user.parentEmail,false, tempPass, schoolLogo);
        const emailHTMLP2 = await getVerificationEmailTemplate(user.role, otp, url, user.email,user.standard,false,null, schoolLogo);
        const emailHTML2 = await getVerificationEmailTemplate(user.role, otp2, url, user.email,null, isStudent, null, schoolLogo);

        if(isStudent){            
            await sendEmail(
                user.email,
                "Verify your email -  The RADU E-TOKEN System",
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
                "Verify your email -  The RADU E-TOKEN System",
                emailHTML,
                emailHTML,
                null
            );
            if(user.standard){
                await sendEmail(
                    user.standard,
                    "Verify your email -  The RADU E-TOKEN System",
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
                "Verify your email -  The RADU E-TOKEN System ..",
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

export const sendOnboardingEmail = async (user, schoolLogo=null) => {
    try {
        let pdf_url = null;
        let video_url = null;
        let userType = '';

        switch(user.type) {
            case 'Lead':
                pdf_url = process.env.LEAD_PDF_URL ?? "";
                video_url = process.env.LEAD_VIDEO_URL ?? "";
                userType = 'Leader/Lead Teacher';
                break;
            case 'Special':
                pdf_url = process.env.TEAM_MEMBER_PDF_URL ?? "";
                video_url = process.env.TEAM_MEMBER_VIDEO_URL ?? "";
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
            logoSrc = 'https://res.cloudinary.com/dudd4jaav/image/upload/v1745082211/E-TOKEN_transparent_1_dehagf.png';
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
                    
                    /* Logo styles */
                    .logo-left, .logo-right {
                        flex: 0 0 auto;
                        height: 200px;
                        width: auto;
                        max-width: 250px;
                        object-fit: contain;
                    }
                    
                    /* Header styles */
                    .header {
                        position: relative;
                        margin-bottom: 40px;
                        padding: 20px 0;
                        display: flex;
                        justify-content: space-between;
                        width: 100%;
                        align-items: center;
                        border-bottom: 2px solid #eaeaea;
                    }
                    
                    /* Title styles */
                    .title {
                        flex: 1;
                        text-align: center;
                        font-size: 28px;
                        font-weight: bold;
                        color: #333333;
                        margin: 0 20px;
                        padding: 10px;
                        border-radius: 4px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }
                    
                    /* Responsive design */
                    @media (max-width: 768px) {
                        .header {
                            flex-direction: column;
                            gap: 15px;
                        }
                        .title {
                            font-size: 24px;
                            margin: 10px 0;
                        }
                        .logo-left, .logo-right {
                            height: 150px;
                            max-width: 150px;
                        }
                    }
                </style>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div class="header">
                    <img src="${logoSrc}" alt="RADU Framework Logo" class="logo-left">
                    <h1 class="title">Welcome</h1>
                    ${schoolLogo ? `<img src="${schoolLogo}" alt="School Logo" class="logo-right">` : '<div class="logo-right"></div>'}
                </div>
                
                <div style="background: #f9f9f9; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
                    <h2 style="color: #00a58c; margin-bottom: 20px;">Welcome to The RADU E-Token System!</h2>
                    
                    <p style="margin-bottom: 20px;">Dear ${user.name},</p>
                    
                    <p style="margin-bottom: 20px;">Welcome aboard as a ${userType}! We're excited to have you join The RADU E-token System community. To help you get started, we've prepared some essential resources for you.</p>
                    
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
                    <p>This is an automated message from The RADU E-token System.<br>
                       If you have any questions, please contact your school administrator.</p>
                </div>
            </body>
            </html>
        `;

        await sendEmail(
            user.email,
            "Welcome to The RADU E-Token System - Getting Started Resources",
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