import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { generateCouponImage } from '../utils/generateImage.js';

dotenv.config();
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", // e.g., "smtp.gmail.com"
    port: 587, // Standard SMTP port
    secure: false, // Use TLS (false for STARTTLS, true for SSL)
    auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS, // Your email password or app password
    },
});

// noOfTokens,
// student,
// teacher,
// subject,
// date,
// schoolLogoURL,
// schoolName,
// teacherEmail,
// parentEmail,

export const sendEmail = async (to, subject, text, html, attachment) => {
    try {
        const imageBuffer = await generateCouponImage(97, "Mayank", "Yash","Englis","12/12/12","https://placehold.co/400x400.png","EPR RAP SCHOOL","yashvardhan@gmail.com","mandar@gmail.com");
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html,
            attachments: [
                {
                  filename: 'coupon.png',
                  content: attachment,
                  cid: 'couponImage', // Content-ID for referencing in the email body
                },
              ],
        });
        console.log('Email sent successfully', info);
        return true
    } catch (error) {
        console.error('Error sending email:', error);
        return false
    }
}