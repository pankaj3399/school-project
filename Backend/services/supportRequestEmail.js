import { sendEmail } from "./nodemailer.js";
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config()

export const sendSupportEmail = async (ticket, school) => {
    try {
        // Get RADU logo source - similar to other email templates
        let logoSrc;
        try {
            const logoPath = path.join(process.cwd(), 'utils', 'radu-logo.png');
            const logoBuffer = fs.readFileSync(logoPath);
            logoSrc = `data:image/png;base64,${logoBuffer.toString('base64')}`;
        } catch (error) {
            console.error('Error loading logo:', error);
            logoSrc = process.env.LOGO_URL ?? 'https://res.cloudinary.com/dudd4jaav/image/upload/v1745082211/E-TOKEN_transparent_1_dehagf.png';
        }

        const emailSubject = `[Ticket #${ticket.ticketNumber}] Support Request from ${ticket.username}, ${ticket.position}, ${ticket.subject ? `${ticket.subject},`:""} ${ticket.schoolName}`;

        const emailBody = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    /* Reset and base styles */
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    
                    /* Container styles */
                    .container {
                        font-family: Arial, sans-serif;
                        max-width: 800px;
                        margin: auto;
                        padding: 20px;
                        background-color: #ffffff;
                    }

                    /* Enhanced header styles */
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

                    /* Logo styles */
                    .logo-left, .logo-right {
                        flex: 0 0 auto;
                        height: 200px;
                        width: auto;
                        max-width: 250px;
                        object-fit: contain;
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

                    /* Field styles */
                    .field { 
                        margin-bottom: 16px;
                        padding: 10px;
                        background-color: #f9f9f9;
                        border-radius: 4px;
                    }
                    
                    .label { 
                        font-weight: bold; 
                        color: #00a58c; 
                        margin-right: 8px;
                    }
                    
                    /* Issue section */
                    .issue-section { 
                        margin-top: 30px; 
                        padding: 20px;
                        background-color: #f5f5f5;
                        border-radius: 8px;
                        border-left: 4px solid #00a58c;
                    }

                    /* Footer styles */
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid #eaeaea;
                        color: #666;
                        font-size: 14px;
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
            <body>
                <div class="container">
                    <div class="header">
                        <img src="${logoSrc}" alt="RADU Logo" class="logo-left">
                        <h1 class="title">Support Request</h1>
                        <img src="${school?.logo || ''}" alt="School Logo" class="logo-right" ${!school?.logo ? 'style="display:none;"' : ''}>
                    </div>
                    
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
                        <div class="label">Issue Description:</div>
                        <p>"${ticket.issue}"</p>
                    </div>
                    
                    <div class="footer">
                        <p>Thanks.</p>
                        <p>The RADU E-TOKEN system</p>
                        <p>Customer Support</p>
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
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    /* Reset and base styles */
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    
                    /* Container styles */
                    .container {
                        font-family: Arial, sans-serif;
                        max-width: 800px;
                        margin: auto;
                        padding: 20px;
                        background-color: #ffffff;
                    }

                    /* Enhanced header styles */
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

                    /* Logo styles */
                    .logo-left, .logo-right {
                        flex: 0 0 auto;
                        height: 200px;
                        width: auto;
                        max-width: 250px;
                        object-fit: contain;
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
                    
                    /* Content styles */
                    .content {
                        line-height: 1.6;
                        margin: 30px 0;
                    }
                    
                    /* Ticket number highlight */
                    .ticket-number {
                        font-weight: bold;
                        color: #00a58c;
                        font-size: 18px;
                    }

                    /* Footer styles */
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid #eaeaea;
                        color: #666;
                        font-size: 14px;
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
            <body>
                <div class="container">
                    <div class="header">
                        <img src="${logoSrc}" alt="RADU Logo" class="logo-left">
                        <h1 class="title">Support Confirmation</h1>
                        <img src="${school?.logo || ''}" alt="School Logo" class="logo-right" ${!school?.logo ? 'style="display:none;"' : ''}>
                    </div>
                    
                    <div class="content">
                        <p>Your support request has been received and assigned ticket number: <span class="ticket-number">${ticket.ticketNumber}</span></p>
                        <p>We will contact you via your preferred method (${ticket.preferredContactMethod}) shortly.</p>
                        <p>Please keep this ticket number for future reference.</p>
                    </div>
                    
                    <div class="footer">
                        <p>Thanks.</p>
                        <p>The RADU E-TOKEN system</p>
                        <p>Customer Support</p>
                    </div>
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

