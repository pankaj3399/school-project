import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

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

export const sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html,
        });
        console.log('Email sent successfully', info);
        return true
    } catch (error) {
        console.error('Error sending email:', error);
        return false
    }
}

