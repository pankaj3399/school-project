import { Role } from '../enum.js';
import path from 'path';
import fs from 'fs';  // Use synchronous fs instead of promises

export const getVerificationEmailTemplate = (role, otp, url, email, isStudent= false) => {
  const description = role === Role.Teacher
    ? "Your account has been created by the system manager in the Radu Framework. Please verify your email address to access your teacher account and start using the E-Token system."
    : "Your account has been created by the system manager in the Radu Framework. Please verify your email address to enable your child's E-Token system account and get updates.";

  // Get base64 encoded logo - using synchronous version to avoid async complexity
  let logoSrc;
  try {
    const logoPath = path.join(process.cwd(), 'utils', 'radu-logo.png');
    
    const logoBuffer = fs.readFileSync(logoPath);
    logoSrc = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    console.log('Loading logo from:', logoSrc);
  } catch (error) {
    console.error('Error loading logo:', error);
    // Fallback to a URL if available - we can add the logo to cloud storage and use the URL here
    logoSrc = 'https://d913gn73yx.ufs.sh/f/tYbhM2OqcVubWFWYRwDPC6laGXixIANf8RnFkd2OHKrDTo3M';
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="${logoSrc}" alt="Radu Framework Logo" style="width: 150px; height: auto;">
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
        <h2 style="color: #00a58c; margin-bottom: 20px;">Welcome to The Radu Framework</h2>
        <p style="margin-bottom: 25px;">${description}</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}?otp=${otp}&role=${role}&email=${email}&isStudent=${isStudent}" 
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
        <p>This is an automated message from The Radu Framework.<br>
           If you believe this was sent in error, please contact your school administrator.</p>
      </div>
    </body>
    </html>
  `;
};