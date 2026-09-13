const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send OTP email to user
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP
 * @param {string} name - User's name (optional)
 */
const sendOTPEmail = async (email, otp, name = 'User') => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Hitchhike" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify Your Email - Hitchhike Registration',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 30px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
              text-align: center;
            }
            .otp-box {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              font-size: 42px;
              font-weight: bold;
              letter-spacing: 8px;
              padding: 20px 40px;
              border-radius: 12px;
              display: inline-block;
              margin: 30px 0;
              box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            }
            .message {
              font-size: 16px;
              color: #555;
              margin: 20px 0;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 25px 0;
              border-radius: 4px;
              text-align: left;
            }
            .warning strong {
              color: #856404;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 14px;
              color: #666;
              border-top: 1px solid #e0e0e0;
            }
            .bike-icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="bike-icon">🏍️</div>
              <h1>Hitchhike</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Your Ride-Sharing Companion</p>
            </div>
            
            <div class="content">
              <h2 style="color: #333; margin-bottom: 10px;">Hi ${name}! 👋</h2>
              <p class="message">
                Thanks for signing up with <strong>Hitchhike</strong>! 
                To complete your registration, please verify your email address.
              </p>
              
              <p class="message">Your verification code is:</p>
              
              <div class="otp-box">${otp}</div>
              
              <p class="message">
                Enter this code in the app to verify your email and activate your account.
              </p>
              
              <div class="warning">
                <strong>⚠️ Security Note:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>This code will expire in <strong>10 minutes</strong></li>
                  <li>Never share this code with anyone</li>
                  <li>Hitchhike will never ask for this code via phone or email</li>
                </ul>
              </div>
              
              <p class="message" style="margin-top: 30px; font-size: 14px; color: #777;">
                If you didn't request this code, please ignore this email or contact our support team.
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0;">
                <strong>Hitchhike</strong> - Safe, Affordable, Community-Driven Bike Pooling
              </p>
              <p style="margin: 10px 0 0 0;">
                © ${new Date().getFullYear()} Hitchhike. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hi ${name}!
        
        Thanks for signing up with Hitchhike!
        
        Your verification code is: ${otp}
        
        This code will expire in 10 minutes.
        
        Enter this code in the app to verify your email and activate your account.
        
        If you didn't request this code, please ignore this email.
        
        - Hitchhike Team
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send OTP email');
  }
};

/**
 * Send welcome email after successful registration
 * @param {string} email - User email
 * @param {string} name - User's name
 */
const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Hitchhike" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to Hitchhike! 🏍️',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px 30px;
              text-align: center;
              color: white;
            }
            .content {
              padding: 40px 30px;
            }
            .feature {
              display: flex;
              align-items: start;
              margin: 20px 0;
              padding: 15px;
              background: #f8f9fa;
              border-radius: 8px;
            }
            .feature-icon {
              font-size: 32px;
              margin-right: 15px;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 15px 40px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 14px;
              color: #666;
              border-top: 1px solid #e0e0e0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 36px;">🎉 Welcome to Hitchhike!</h1>
              <p style="margin: 15px 0 0 0; font-size: 18px;">Your journey begins here, ${name}</p>
            </div>
            
            <div class="content">
              <p style="font-size: 16px;">
                We're thrilled to have you join the <strong>Hitchhike</strong> community! 
                You're now part of a growing network of riders who believe in affordable, 
                eco-friendly, and community-driven transportation.
              </p>
              
              <h2 style="color: #667eea; margin-top: 30px;">What you can do now:</h2>
              
              <div class="feature">
                <div class="feature-icon">🔍</div>
                <div>
                  <strong>Find Rides</strong><br>
                  Search for rides matching your route and connect with riders going your way.
                </div>
              </div>
              
              <div class="feature">
                <div class="feature-icon">🏍️</div>
                <div>
                  <strong>Offer Rides</strong><br>
                  Share your daily commute and earn while helping others reach their destination.
                </div>
              </div>
              
              <div class="feature">
                <div class="feature-icon">💬</div>
                <div>
                  <strong>Chat & Negotiate</strong><br>
                  Connect directly with riders, discuss fares, and build trust before you ride.
                </div>
              </div>
              
              <div class="feature">
                <div class="feature-icon">⭐</div>
                <div>
                  <strong>Build Your Reputation</strong><br>
                  Complete rides, get reviews, and increase your reliability score.
                </div>
              </div>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="cta-button">
                  Start Your First Ride 🚀
                </a>
              </div>
              
              <p style="margin-top: 30px; padding: 20px; background: #e8f4fd; border-radius: 8px;">
                <strong>💡 Pro Tip:</strong> Complete your profile with a photo and vehicle details 
                to increase trust and get more ride requests!
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0;">
                Need help? Reach out to us anytime at 
                <a href="mailto:support@hitchhike.com" style="color: #667eea;">support@hitchhike.com</a>
              </p>
              <p style="margin: 10px 0 0 0;">
                © ${new Date().getFullYear()} Hitchhike. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Welcome email error:', error);
    // Don't throw error for welcome email - it's not critical
    return { success: false };
  }
};

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail,
};
