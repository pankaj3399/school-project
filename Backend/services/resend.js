import { Resend } from 'resend';
import dotenv from 'dotenv';
import fetch, { Headers } from 'node-fetch';

// Add this line to make Headers available globally
global.Headers = Headers;

dotenv.config();

// Initialize the Resend client with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to, subject, text, html, attachment, attachmentName = 'coupon.png') => {
    try {
        console.log(`Sending email to ${to} with subject:`, subject);
        if (!to) {
            console.error('No recipient email address provided.');
            return false;
        }

        // Check if the email is valid
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(to)) {
            console.error('Invalid email address:', to);
            return false;
        }

        let attachments = [];
        if (attachment) {
            // For Resend, attachments need to be in a specific format
            attachments = [
                {
                    filename: attachmentName,
                    content: attachment.toString('base64'),
                    content_id: attachmentName === 'coupon.png' ? 'couponImage' : 'attachment',
                }
            ];
        }

        // Send email using Resend
        const data = await resend.emails.send({
            from: process.env.FROM_EMAIL || 'noreply@raduframework.com',
            to,
            subject,
            text,
            html,
            attachments,
        });

        console.log('Email sent with Resend:', data);
        return true;
    } catch (error) {
        console.error('Error sending email with Resend:', error);
        return false;
    }
};

export const sendEmailReport = async (to, subject, text, html, attachment, attachmentName) => {
    try {
        let attachments = [];
        if (attachment) {
            attachments = [
                {
                    filename: attachmentName,
                    content: attachment.toString('base64'),
                    content_id: 'reportPdf',
                }
            ];
        }

        // Send email using Resend
        const data = await resend.emails.send({
            from: process.env.FROM_EMAIL || 'noreply@raduframework.com',
            to,
            subject,
            text,
            html,
            attachments,
        });

        console.log('Report email sent with Resend:', data);
        return true;
    } catch (error) {
        console.error('Error sending report email with Resend:', error);
        return false;
    }
};
