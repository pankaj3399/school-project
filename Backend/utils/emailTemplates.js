import { Role } from '../enum.js';
import path from 'path';
import fs from 'fs';  // Use synchronous fs instead of promises

export const getVerificationEmailTemplate = (role, otp, url, email,toVerify = null, isStudent= false, tempPass=null) => {
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

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 40px; width: 100%;">
        <img src="${logoSrc}" alt="RADU Framework Logo" style="width: 250px; height: auto; display: block; margin: 0 auto;">
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
      </div>
      
      <div style="text-align: center; font-size: 12px; color: #666;">
        <p>This is an automated message from The RADU E-token System.<br>
           If you believe this was sent in error, please contact your school administrator.</p>
      </div>
    </body>
    </html>
  `;
};