# 📧 Email OTP Setup Guide

## 🚨 Current Status: DEVELOPMENT MODE

OTP system abhi **development mode** mein hai. Email nahi ja raha but OTP work kar raha hai!

---

## ✅ What's Working Right Now

### Development Mode Features
1. **OTP Generation** ✅ - 6-digit OTP ban raha hai
2. **OTP Storage** ✅ - Database mein save ho raha hai
3. **OTP Verification** ✅ - Verify ho raha hai correctly
4. **Console Logging** ✅ - Backend console mein OTP print hota hai
5. **Alert Display** ✅ - Frontend mein OTP alert box mein dikhta hai

### How It Works Now
```
User registers → OTP generates → Shows in alert box → User enters → Registration complete
```

---

## 🔐 Testing Instructions

### Step 1: Start Backend
```bash
cd backend
npm start
```

### Step 2: Start Frontend
```bash
cd hitchhike-frontend
npm run dev
```

### Step 3: Register New User
1. Go to **Register** page
2. Enter name and email
3. Click **Send OTP**
4. **🎉 OTP will appear in ALERT BOX**
5. Also check backend console for OTP
6. Enter OTP in boxes
7. Complete registration

### Backend Console Output
```
✅ OTP sent to user@example.com: 123456
📧 Configure SMTP in backend/.env to send real emails
```

### Frontend Alert
```
🔐 DEVELOPMENT MODE

Your OTP is: 123456

(Check email if SMTP is configured)
```

---

## 📧 Enable Real Email Sending (Optional)

### Option 1: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: Mail
   - Select device: Other (Custom name)
   - Click Generate
   - Copy the 16-character password

3. **Update backend/.env:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM_EMAIL=noreply@hitchhike.com
```

4. **Restart backend server**

### Option 2: Mailtrap (For Testing)

1. Sign up at https://mailtrap.io (Free)
2. Get SMTP credentials
3. Update backend/.env:
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
SMTP_FROM_EMAIL=noreply@hitchhike.com
```

### Option 3: SendGrid / Mailgun (Production)

For production, use professional email services:
- **SendGrid:** https://sendgrid.com
- **Mailgun:** https://mailgun.com
- **AWS SES:** https://aws.amazon.com/ses

---

## 🔧 Current Configuration

### backend/.env
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/hitchhike
JWT_SECRET=merasecretkey12345
NODE_ENV=development

# Email Configuration (Not configured yet)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@hitchhike.com
```

---

## 📊 How OTP System Works

### 1. User Enters Email
```
POST /api/users/send-otp
Body: { email: "user@example.com", name: "User" }
```

### 2. Backend Generates OTP
```javascript
const otp = generateOTP(); // 6-digit random number
const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
```

### 3. OTP Saved to Database
```javascript
await OTP.create({
  email: 'user@example.com',
  otp: '123456',
  expiresAt: expiresAt,
  verified: false,
  attempts: 0
});
```

### 4. Email Sent (or shown in alert)
```javascript
try {
  await sendOTPEmail(email, otp, name);
} catch (error) {
  // Email failed, but OTP still logged for development
  console.log('OTP:', otp);
}
```

### 5. User Verifies OTP
```
POST /api/users/verify-otp
Body: { 
  email: "user@example.com",
  otp: "123456",
  phone: "9876543210",
  password: "password123",
  role: "passenger"
}
```

### 6. Registration Complete
```javascript
// User created
// JWT token generated
// Welcome email sent (optional)
```

---

## 🛡️ Security Features

### OTP Validation
- ✅ 6-digit numeric code
- ✅ Expires in 10 minutes
- ✅ Max 5 attempts
- ✅ One-time use only
- ✅ Case-insensitive email

### Anti-Spam
- ✅ 30-second cooldown between OTP requests
- ✅ Automatic cleanup of expired OTPs
- ✅ IP-based rate limiting (future)

### Data Protection
- ✅ Passwords hashed with bcrypt
- ✅ OTP stored temporarily
- ✅ JWT for authentication
- ✅ HTTPS recommended for production

---

## 🐛 Troubleshooting

### "OTP not sent"
**Solution:** Check backend console - OTP is logged there
```bash
✅ OTP sent to user@example.com: 123456
```

### "Invalid OTP"
**Reasons:**
1. OTP expired (10 minutes limit)
2. Wrong OTP entered
3. Too many attempts (max 5)
4. OTP already used

**Solution:** Click "Resend OTP"

### "Email already exists"
**Solution:** User already registered - go to login page

### Backend not starting
**Check:**
1. MongoDB running? `mongod`
2. Port 5000 free? `netstat -ano | findstr :5000`
3. Dependencies installed? `npm install`

---

## 📝 Development vs Production

### Development Mode (Current)
```
NODE_ENV=development
✅ OTP shown in alert
✅ OTP logged in console
✅ Email optional
✅ devOTP field in response
```

### Production Mode (When deployed)
```
NODE_ENV=production
❌ No OTP in response
❌ No console logs
✅ Email required
✅ Secure only
```

**To Switch to Production:**
1. Set `NODE_ENV=production` in .env
2. Configure real SMTP credentials
3. Remove alert boxes from frontend
4. Enable HTTPS

---

## 🎯 Next Steps

### For Testing (Current)
- [x] OTP generates correctly
- [x] OTP shows in alert
- [x] OTP verification works
- [x] Registration completes
- [ ] Configure real email (optional)

### For Production
- [ ] Get production SMTP service
- [ ] Configure real credentials
- [ ] Remove development alerts
- [ ] Add email templates
- [ ] Enable HTTPS
- [ ] Add rate limiting
- [ ] Monitor email delivery

---

## 💡 Pro Tips

1. **Use Browser Console** - OTP bhi print hota hai
   ```javascript
   console.log('🔐 DEV OTP:', response.data.devOTP);
   ```

2. **Check Backend Logs** - Har OTP logged hai
   ```
   ✅ OTP sent to user@example.com: 123456
   ```

3. **Use Mailtrap for Testing** - Real emails test karo production risk ke bina

4. **Gmail App Password** - Regular password nahi chalega, app password chahiye

5. **Keep Terminal Open** - Backend console mein OTP dikhega

---

## 📧 Email Template Preview

When SMTP is configured, users will receive:

**Subject:** Verify Your Email - Hitchhike Registration

**Content:**
- 🏍️ Hitchhike logo and branding
- Personalized greeting
- Large OTP box with code
- Expiry warning (10 minutes)
- Security tips
- Beautiful HTML design

---

## ✅ Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend connects to backend
- [ ] OTP generates on registration
- [ ] OTP shows in alert box
- [ ] OTP visible in backend console
- [ ] Can copy-paste OTP from alert
- [ ] OTP verification works
- [ ] Registration completes successfully
- [ ] JWT token received
- [ ] User can login after registration
- [ ] Resend OTP works
- [ ] New OTP shows in alert

---

## 🚀 Current Workflow

```
┌─────────────────┐
│  User Register  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Enter Email    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Generate OTP   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Show in Alert  │ ← 🔥 YOU ARE HERE
│  & Console Log  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User Enters    │
│     OTP         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Verify & Save  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Success! 🎉    │
└─────────────────┘
```

---

**Status:** ✅ OTP System Working (Development Mode)
**Email:** ⚠️ Not configured (Optional for testing)
**Ready for:** Testing & Development
**Production:** Configure SMTP first

---

## 🆘 Need Help?

1. Check backend console for OTP
2. Check browser console for errors
3. Check MongoDB is running
4. Check .env file exists
5. Try clearing browser cache
6. Restart both servers

**Everything working? Bas SMTP configure karna baaki hai for real emails!** 📧✨
