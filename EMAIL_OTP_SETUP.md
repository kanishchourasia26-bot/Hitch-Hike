# 📧 Email OTP Verification System - Setup Guide

## ✅ What's Been Implemented

### Backend (Node.js/Express)
1. **OTP Model** (`backend/models/OTP.js`)
   - Stores 6-digit OTP codes
   - Auto-expires after 10 minutes using MongoDB TTL index
   - Tracks verification attempts (max 5 attempts)

2. **Email Service** (`backend/services/emailService.js`)
   - Beautiful HTML email templates with gradient design
   - OTP email with security warnings
   - Welcome email after successful registration

3. **OTP Generator** (`backend/utils/otpGenerator.js`)
   - Generates random 6-digit codes
   - Sets 10-minute expiry timestamps

4. **New API Endpoints** (`backend/controllers/userController.js`)
   - `POST /api/users/send-otp` - Send OTP to email
   - `POST /api/users/verify-otp` - Verify OTP and register user
   - `POST /api/users/resend-otp` - Resend OTP (30-second cooldown)

### Frontend (React)
1. **3-Step Registration Flow** (`hitchhike-frontend/src/pages/Register.jsx`)
   - **Step 1**: Email & Name input
   - **Step 2**: 6-digit OTP verification with auto-focus
   - **Step 3**: Complete profile (phone, password, age, gender, role)
   
2. **Modern UI Features**
   - Gradient purple-orange design
   - Framer Motion animations
   - Progress indicator
   - Real-time error/success messages
   - Auto-focus OTP inputs
   - Resend OTP with countdown timer

---

## 🚀 Setup Instructions

### Step 1: Configure Email (Gmail)

1. **Enable 2-Factor Authentication on Gmail**
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character app password

3. **Update `backend/.env`**
   ```env
   # Replace with your actual Gmail credentials
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   SMTP_FROM_EMAIL=noreply@hitchhike.com
   FRONTEND_URL=http://localhost:5173
   ```

### Step 2: Install Dependencies (Already Done)
```bash
cd backend
npm install nodemailer xml2js
```

### Step 3: Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd hitchhike-frontend
npm run dev
```

---

## 🧪 Testing the OTP Flow

### Test Registration:
1. Open: http://localhost:5173/register
2. Enter name and email
3. Click "Send Verification Code"
4. Check your email for OTP (check spam folder too!)
5. Enter the 6-digit OTP
6. Complete profile details
7. Click "Complete Registration"

### Expected Email Format:
```
Subject: Verify Your Email - Hitchhike Registration

Body: Beautiful gradient email with:
- 6-digit OTP in large bold text
- 10-minute expiry warning
- Security tips
- Hitchhike branding
```

---

## 🔐 Security Features

1. **OTP Expiry**: Codes expire after 10 minutes
2. **Attempt Limiting**: Max 5 verification attempts per OTP
3. **Rate Limiting**: 30-second cooldown between resend requests
4. **Auto-Deletion**: Used/expired OTPs are automatically cleaned up
5. **Email Validation**: Server-side email format validation
6. **Duplicate Prevention**: Checks for existing users before sending OTP

---

## 📧 Email Service Alternatives

If Gmail doesn't work, try these alternatives:

### Option 1: SendGrid (Recommended for Production)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Option 2: Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

### Option 3: AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-access-key-id
SMTP_PASS=your-aws-secret-access-key
```

---

## 🐛 Troubleshooting

### Problem: OTP email not received
**Solutions:**
1. Check spam/junk folder
2. Verify Gmail app password is correct
3. Check backend logs for email errors
4. Try a different email address

### Problem: "Invalid credentials" error
**Solutions:**
1. Regenerate Gmail app password
2. Ensure 2FA is enabled on Gmail
3. Check SMTP_USER and SMTP_PASS in .env

### Problem: "Failed to send OTP"
**Solutions:**
1. Check internet connection
2. Verify SMTP_HOST and SMTP_PORT
3. Test with a simple email first
4. Check backend terminal for detailed errors

### Problem: OTP expired too quickly
**Solutions:**
- OTPs are valid for 10 minutes
- Check server timezone settings
- Verify system clock is accurate

---

## 🎨 UI Customization

### Change Color Theme
Edit `Register.jsx`:
```jsx
// Current: Purple-Orange gradient
className="bg-gradient-to-r from-purple-500 to-orange-500"

// Change to Blue-Green:
className="bg-gradient-to-r from-blue-500 to-green-500"
```

### Change OTP Length
1. Update `backend/utils/otpGenerator.js`:
   ```javascript
   // For 4-digit OTP:
   const otp = Math.floor(1000 + Math.random() * 9000);
   ```

2. Update `Register.jsx`:
   ```jsx
   const [otp, setOtp] = useState(['', '', '', '']); // 4 digits
   ```

### Change Expiry Time
Edit `backend/utils/otpGenerator.js`:
```javascript
// Current: 10 minutes
return new Date(Date.now() + 10 * 60 * 1000);

// Change to 5 minutes:
return new Date(Date.now() + 5 * 60 * 1000);
```

---

## 📊 API Endpoints Reference

### Send OTP
```http
POST /api/users/send-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe"
}

Response:
{
  "success": true,
  "message": "OTP sent successfully to your email",
  "expiresIn": "10 minutes"
}
```

### Verify OTP & Register
```http
POST /api/users/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "name": "John Doe",
  "phone": "9876543210",
  "password": "securepass123",
  "role": "rider"
}

Response:
{
  "success": true,
  "message": "Registration successful! Welcome to Hitchhike!",
  "token": "jwt-token-here",
  "user": { ... }
}
```

### Resend OTP
```http
POST /api/users/resend-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe"
}

Response:
{
  "success": true,
  "message": "New OTP sent successfully",
  "expiresIn": "10 minutes"
}
```

---

## 🎯 Next Steps

### Recommended Enhancements:
1. **Phone OTP**: Add SMS OTP as alternative to email
2. **Social Auth**: Add Google/Facebook login
3. **Email Templates**: Create branded email designs
4. **Analytics**: Track OTP success/failure rates
5. **Admin Dashboard**: Monitor OTP usage and abuse
6. **Backup Codes**: Generate backup codes for account recovery

---

## 📝 Notes

- **Legacy Endpoint**: The old `/api/users/register` endpoint still works but doesn't require OTP
- **Database**: OTP records auto-delete after 10 minutes (MongoDB TTL index)
- **Production**: Use environment-specific SMTP credentials
- **Security**: Never commit `.env` file to version control

---

## ✅ Checklist

- [ ] Gmail 2FA enabled
- [ ] App password generated
- [ ] `.env` file updated with credentials
- [ ] Backend server running
- [ ] Frontend server running
- [ ] Test email sent successfully
- [ ] OTP received in inbox
- [ ] Registration completed successfully

---

**Need Help?** Check backend logs for detailed error messages!

**Email Working?** You're all set! 🎉
