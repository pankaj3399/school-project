import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { generateCouponImage } from '../utils/generateImage.js';

dotenv.config();
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", 
    port: 587, 
    secure: false, 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
    },
    maxFileSize: 25 * 1024 * 1024, 
    tls: {
        rejectUnauthorized: false
    }
});


export const sendEmail = async (to, subject, text, html, attachment) => {
    try {
        console.log("sending mail to ", to);
        
        let info;
        if(attachment)
        info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html:html,
            attachments: [
                {
                  filename: 'coupon.png',
                  content: attachment,
                  cid: 'couponImage', // Content-ID for referencing in the email body
                },
              ],
        });
        else
        info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html:html,
        });

        console.log('Email sent successfully', info);
        return true
    } catch (error) {
        console.error('Error sending email:', error);
        return false
    }
}
export const sendEmailReport = async (to, subject, text, html, attachment, attachmentName) => {
    try {
        let info;
        if(attachment)
        info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html:html,
            attachments: [
                {
                  filename: attachmentName,
                  content: attachment,
                  cid: 'reportPdf', 
                },
              ],
        });
        else
        info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html:html,
        });

        console.log('Email sent successfully', info);
        return true
    } catch (error) {
        console.error('Error sending email:', error);
        return false
    }
}