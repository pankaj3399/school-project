import sendgrid from '@sendgrid/mail'
import dotenv from 'dotenv'

dotenv.config()
sendgrid.setApiKey(process.env.SENDGRID_API_KEY)

export const sendEmail = async (to, subject, text, html, attachment, attachmentName = 'coupon.png',replyTo=null) => {
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
            console.log('Attachment provided:', attachment.toString('base64').substring(0, 50) + '...');
            
            // For SendGrid, attachments need to be in a specific format
            attachments = [
                {
                    content: attachment.toString('base64'),
                    filename: attachmentName,
                    type: 'image/png', // SendGrid uses 'type' instead of 'contentType'
                    disposition: 'attachment',
                    content_id: 'couponImage'
                }
            ];
        }

        const msg = {
            to,
            from: process.env.FROM_EMAIL || 'noreply@raduframework.com',
            subject,
            text,
            html,
            attachments,
            replyTo: replyTo ? replyTo : process.env.FROM_EMAIL || 'noreply@raduframework.com'
        };

        const data = await sendgrid.send(msg);
        return true;
    } catch (error) {
        console.error('Error sending email with SendGrid:', error.response ? error.response.body : error);
        return false;
    }
};

export const sendEmailReport = async (to, subject, text, html, attachment, attachmentName) => {
    try {
        let attachments = [];
        if (attachment) {
            attachments = [
                {
                    content: attachment.toString('base64'),
                    filename: attachmentName,
                    type: attachmentName.endsWith('.pdf') ? 'application/pdf' : 'image/png',
                    disposition: 'attachment',
                    content_id: 'reportPdf'
                }
            ];
        }

        const msg = {
            to,
            from: process.env.FROM_EMAIL || 'noreply@raduframework.com',
            subject,
            text,
            html,
            attachments
        };

        const data = await sendgrid.send(msg);
        console.log('Report email sent with SendGrid:', data);
        return true;
    } catch (error) {
        console.error('Error sending report email with SendGrid:', error.response ? error.response.body : error);
        return false;
    }
};