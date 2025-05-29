import { Role } from '../enum.js';
import path from 'path';
import fs from 'fs';
import { timezoneManager } from './luxon.js';

export const getVerificationEmailTemplate = (role, otp, url, email, toVerify = null, isStudent = false, tempPass = null, schoolLogo = null, schoolTimezone = 'UTC+0') => {
  
  const description = role === Role.Teacher
    ? tempPass ? "Your account has been created by the system Manager of the RADU E-Token System.. Please verify your email address to access your teacher account and start using the E-Token system. Use the temporary password provided to log in for the first time. You can change it later." : "Your account has been created by the system Manager of the RADU E-Token System.. Please verify your email address to enable your E-Token system account and get updates."
    : "Your account has been created by the system Manager of the RADU E-Token System.. Please verify your email address to enable your child's E-Token system account and get updates.";

  // Get base64 encoded logo - using synchronous version to avoid async complexity
  let logoSrc;
  try {
    const logoPath = path.join(process.cwd(), 'utils', 'radu-logo.png');
    
    const logoBuffer = fs.readFileSync(logoPath);
    logoSrc = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (error) {
    // Fallback to a URL if available - we can add the logo to cloud storage and use the URL here
    logoSrc = 'https://res.cloudinary.com/dudd4jaav/image/upload/v1745082211/E-TOKEN_transparent_1_dehagf.png';
  }

  // Format current date in school timezone
  const currentDate = timezoneManager.formatForSchool(new Date(), schoolTimezone, 'MMMM dd, yyyy');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
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
        <h1 class="title">Email Verification</h1>
        ${schoolLogo ? `<img src="${schoolLogo}" alt="School Logo" class="logo-right">` : '<div class="logo-right"></div>'}
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
        <h2 style="color: #00a58c; margin-bottom: 20px;">Welcome to The RADU E-Token System</h2>
        <p style="margin-bottom: 25px;">${description}</p>
        ${tempPass ? `<p style="margin-bottom: 20px;">Your temporary password is: <strong>${tempPass}</strong></p>` : ""}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}?otp=${otp}&role=${role}&email=${email}&isStudent=${isStudent}&toVerify=${toVerify ?? ""}" 
             style="background-color: #00a58c; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 4px; 
                    font-weight: bold;
                    display: inline-block;">
            Verify Email Address
          </a>
        </div>
        
        <p style="text-align: center; font-size: 14px; color: #666; margin-top: 20px;">
          Email sent on ${currentDate}
        </p>
      </div>
      
      <div style="text-align: center; font-size: 12px; color: #666;">
        <p>This is an automated message from The RADU E-token System.<br>
           If you believe this was sent in error, please contact your school administrator.</p>
      </div>
    </body>
    </html>
  `;
};