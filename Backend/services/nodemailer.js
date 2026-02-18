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


export const sendEmail = async (to, subject, text, html, attachment, attachmentName = 'coupon.png') => {
    try {

        if(!to){
            console.error('[NODEMAILER] No recipient email address provided.');
            return false;
        }
        //check if the email is valid
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(to)) {
            console.error('[NODEMAILER] Invalid email address:', to);
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
                  filename: attachmentName,
                  content: attachment,
                  contentType: attachmentName.endsWith('.pdf') ? 'application/pdf' : 'image/png',
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
        console.error('[NODEMAILER] Error sending email:', error);
        console.error('[NODEMAILER] Error details:', error.message);
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
                  contentType: 'application/pdf',
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
        console.error('[NODEMAILER] Error sending report email:', error);
        console.error('[NODEMAILER] Error details:', error.message);
        return false
    }
}