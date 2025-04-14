import { sendEmail } from "./nodemailer.js";

export const sendSupportEmail = async (ticket) => {
    try {
        const emailSubject = `[Ticket #${ticket.ticketNumber}] Support Request from ${ticket.username}, ${ticket.position}, ${ticket.subject ? `${ticket.subject},`:""} ${ticket.schoolName}`;

        const emailBody = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #333; }
                    .field { margin-bottom: 10px; }
                    .label { font-weight: bold; color: #555; }
                    .issue-section { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">New Support Request</div>
                    
                    <div class="field">
                        <span class="label">Ticket Number:</span> ${ticket.ticketNumber}
                    </div>
                    
                    <div class="field">
                        <span class="label">Teacher Name:</span> ${ticket.username}
                    </div>
                    
                    <div class="field">
                        <span class="label">Position:</span> ${ticket.position}
                    </div>
                    
                    <div class="field">
                        <span class="label">School Name:</span> ${ticket.schoolName}
                    </div>
                    
                    <div class="field">
                        <span class="label">School ID:</span> ${ticket.schoolId}
                    </div>
                    
                    <div class="field">
                        <span class="label">State:</span> ${ticket.state}
                    </div>
                    
                    <div class="field">
                        <span class="label">Email:</span> ${ticket.email}
                    </div>
                    
                    ${ticket.phone ? `
                    <div class="field">
                        <span class="label">Phone:</span> ${ticket.phone}
                    </div>
                    ` : ''}
                    
                    <div class="field">
                        <span class="label">Preferred Contact Method:</span> ${ticket.preferredContactMethod}
                    </div>
                    
                    <div class="issue-section">
                        <div class="label">Issue:</div>
                        <p>"${ticket.issue}"</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Send to support team
        await sendEmail(
            process.env.SUPPORT_EMAIL || 'support@raduframework.com',
            emailSubject,
            emailBody,
            emailBody,
            null
        );

        // Send confirmation to teacher
        const confirmationBody = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #333; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">Support Request Received</div>
                    <p>Your support request has been received and assigned ticket number: ${ticket.ticketNumber}</p>
                    <p>We will contact you via your preferred method (${ticket.preferredContactMethod}) shortly.</p>
                    <p>Please keep this ticket number for future reference.</p>
                </div>
            </body>
            </html>
        `;

        // Send confirmation to teacher
        await sendEmail(
            ticket.email,
            `Support Request Received - Ticket #${ticket.ticketNumber}`,
            confirmationBody,
            confirmationBody,
            null
        );

        return true;
    } catch (error) {
        console.error('Error sending support email:', error);
        throw new Error(`Failed to send support email: ${error.message}`);
    }
};

