import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

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
        console.log(`Sending email to ${to} with subject:`);
        if(!to){
            console.error('No recipient email address provided.');
            return false;
        }
        //check if the email is valid
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(to)) {
            console.error('Invalid email address:', to);
            return false;
        }        
        
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

        return true
    } catch (error) {
        console.error('Error sending email:', error);
        return false
    }
}