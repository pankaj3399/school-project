import Waitlist from '../models/Waitlist.js';
import { sendEmail } from '../services/nodemailer.js';

export const subscribeToWaitlist = async (req, res) => {
  try {
    const { email, confirmEmail } = req.body;

    // Validate required fields
    if (!email || !confirmEmail) {
      return res.status(400).json({ 
        message: 'Both email fields are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Please enter a valid email address' 
      });
    }

    // Check if emails match
    if (email.toLowerCase() !== confirmEmail.toLowerCase()) {
      return res.status(400).json({ 
        message: 'Email addresses do not match' 
      });
    }

    // Check if email already exists
    const existingSubscriber = await Waitlist.findOne({ 
      email: email.toLowerCase() 
    });
    
    if (existingSubscriber) {
      return res.status(400).json({ 
        message: 'This email is already registered on our waitlist' 
      });
    }

    // Save to database
    const newSubscriber = new Waitlist({ 
      email: email.toLowerCase() 
    });
    await newSubscriber.save();

    // Send confirmation email
    const subject = 'Welcome to The RADU E-Token System Waitlist!';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          .container {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
            padding: 40px 20px;
            background-color: #ffffff;
            text-align: center;
          }
          .logo {
            width: 200px;
            height: auto;
            margin-bottom: 30px;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            color: #333333;
            margin-bottom: 20px;
          }
          .message {
            font-size: 16px;
            color: #555555;
            line-height: 1.6;
            margin-bottom: 30px;
          }
          .contact {
            font-size: 14px;
            color: #666666;
            margin-bottom: 20px;
          }
          .contact a {
            color: #3b82f6;
            text-decoration: none;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eaeaea;
            font-size: 12px;
            color: #888888;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img src="${process.env.LOGO_URL || 'https://res.cloudinary.com/dudd4jaav/image/upload/v1745082211/E-TOKEN_transparent_1_dehagf.png'}" alt="RADU E-Token Logo" class="logo">
          
          <h1 class="title">Thanks for registering!!!</h1>
          
          <p class="message">
            We'll keep you posted on the Radu E-Token system.
          </p>
          
          <p class="contact">
            You may reach out to us using this email: 
            <a href="mailto:admin@theraduetoken.com">admin@theraduetoken.com</a>
          </p>
          
          <p class="message">Thanks.</p>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} The RADU E-Token System® All rights reserved.</p>
            <p>Powered by Affective Academy LLC.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(email.toLowerCase(), subject, htmlContent, htmlContent);

    res.status(201).json({ 
      message: 'Successfully registered to the waitlist!',
      success: true 
    });

  } catch (error) {
    console.error('Waitlist subscription error:', error);
    res.status(500).json({ 
      message: 'An error occurred. Please try again later.' 
    });
  }
};

export const exportWaitlistData = async (req, res) => {
  try {
    const subscribers = await Waitlist.find({}).sort({ createdAt: -1 });

    const headers = ['Email', 'Joined At'];
    const csvRows = [headers.join(',')];

    subscribers.forEach(sub => {
      const email = `"${sub.email.replace(/"/g, '""')}"`;
      const date = `"${new Date(sub.createdAt).toISOString()}"`;
      csvRows.push(`${email},${date}`);
    });

    const csvContent = csvRows.join('\n');

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=waitlist.csv');
    res.send(csvContent);

  } catch (error) {
    console.error('Export waitlist error:', error);
    res.status(500).json({ 
      message: 'Failed to export waitlist data' 
    });
  }
};
