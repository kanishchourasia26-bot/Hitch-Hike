const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { generateOTP, generateOTPExpiry } = require('../utils/otpGenerator');
const { sendOTPEmail, sendWelcomeEmail, sendPasswordResetOTP } = require('../services/emailService');

/**
 * Helper: sign a JWT for a given user id
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'supersecretkey', {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

/**
 * @route   POST /api/users/send-otp
 * @desc    Send OTP to email for registration
 * @access  Public
 */
const sendOTP = async (req, res) => {
  try {
    const { email, name } = req.body;

    // Validate email presence
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    // Trim and validate email format
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email format. Please enter a valid email address.' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: 'An account with this email already exists. Please login instead.' 
      });
    }

    // Rate limiting check - prevent spam
    const recentOTP = await OTP.findOne({ 
      email: trimmedEmail 
    }).sort({ createdAt: -1 });

    if (recentOTP && (Date.now() - recentOTP.createdAt.getTime() < 30000)) {
      const waitTime = Math.ceil((30000 - (Date.now() - recentOTP.createdAt.getTime())) / 1000);
      return res.status(429).json({ 
        success: false,
        message: `Please wait ${waitTime} seconds before requesting a new OTP.`,
        retryAfter: waitTime
      });
    }

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: trimmedEmail });

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = generateOTPExpiry();

    // Save OTP to database
    await OTP.create({
      email: trimmedEmail,
      otp,
      expiresAt,
    });

    // Send OTP email
    try {
      await sendOTPEmail(trimmedEmail, otp, name || 'User');
      console.log(`✅ OTP sent to ${trimmedEmail}: ${otp}`);
    } catch (emailError) {
      // If email fails, still log OTP for development
      console.log(`⚠️ Email failed, but OTP generated for ${trimmedEmail}: ${otp}`);
      console.log('📧 Configure SMTP in backend/.env to send real emails');
    }

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully! Please check your email.',
      expiresIn: '10 minutes',
      // 🔥 FOR DEVELOPMENT ONLY - Remove in production!
      ...(process.env.NODE_ENV === 'development' && { devOTP: otp }),
    });
  } catch (error) {
    console.error('sendOTP error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to send OTP. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @route   POST /api/users/verify-otp
 * @desc    Verify OTP and register user
 * @access  Public
 */
const verifyOTPAndRegister = async (req, res) => {
  try {
    const { email, otp, name, phone, password, role, age, gender } = req.body;

    // Validate required fields
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and OTP are required' 
      });
    }

    if (!phone || !password || !role) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone, password, and role are required' 
      });
    }

    // Validate role
    if (!['rider', 'passenger'].includes(role)) {
      return res.status(400).json({ 
        success: false,
        message: 'Role must be either "rider" or "passenger"' 
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Validate phone format (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.trim())) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number must be 10 digits' 
      });
    }

    // Validate age if provided
    if (age && (age < 18 || age > 100)) {
      return res.status(400).json({ 
        success: false,
        message: 'Age must be between 18 and 100' 
      });
    }

    // Validate gender if provided
    if (gender && !['male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({ 
        success: false,
        message: 'Gender must be male, female, or other' 
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();
    const trimmedOTP = otp.trim();

    // Find OTP record
    const otpRecord = await OTP.findOne({ 
      email: trimmedEmail,
      verified: false 
    }).sort({ createdAt: -1 }); // Get the latest OTP

    if (!otpRecord) {
      return res.status(400).json({ 
        success: false,
        message: 'OTP not found or already used. Please request a new OTP.' 
      });
    }

    // Check if OTP is expired
    if (otpRecord.isExpired()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ 
        success: false,
        message: 'OTP has expired. Please request a new one.' 
      });
    }

    // Check attempts (max 5 attempts)
    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({ 
        success: false,
        message: 'Too many incorrect attempts. Please request a new OTP.' 
      });
    }

    // Verify OTP
    if (otpRecord.otp !== trimmedOTP) {
      await otpRecord.incrementAttempts();
      const attemptsLeft = 5 - otpRecord.attempts - 1;
      return res.status(400).json({ 
        success: false,
        message: `Invalid OTP. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`,
        attemptsLeft
      });
    }

    // OTP is valid - Mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Check if user already exists (double-check)
    const existingUser = await User.findOne({ 
      $or: [{ email: trimmedEmail }, { phone: trimmedPhone }] 
    });

    if (existingUser) {
      // Determine which field conflicts
      if (existingUser.email === trimmedEmail) {
        return res.status(409).json({ 
          success: false,
          message: 'An account with this email already exists' 
        });
      }
      if (existingUser.phone === trimmedPhone) {
        return res.status(409).json({ 
          success: false,
          message: 'An account with this phone number already exists' 
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with all fields
    const user = await User.create({
      name: name?.trim() || 'User',
      email: trimmedEmail,
      phone: trimmedPhone,
      password: hashedPassword,
      role,
      ...(age && { age: parseInt(age) }),
      ...(gender && { gender }),
    });

    // Generate JWT token
    const token = generateToken(user._id);

    // Send welcome email (non-blocking)
    sendWelcomeEmail(trimmedEmail, user.name).catch(err => {
      console.error('Welcome email failed:', err);
    });

    // Delete used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    console.log(`✅ User registered successfully: ${user.email}`);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to Hitchhike! 🎉',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        age: user.age,
        gender: user.gender,
        isAadhaarVerified: user.isAadhaarVerified,
        isDlVerified: user.isDlVerified,
      },
    });
  } catch (error) {
    console.error('verifyOTPAndRegister error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({ 
        success: false,
        message: `An account with this ${field} already exists.` 
      });
    }
    
    return res.status(500).json({ 
      success: false,
      message: 'Server error during registration. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @route   POST /api/users/resend-otp
 * @desc    Resend OTP to email
 * @access  Public
 */
const resendOTP = async (req, res) => {
  try {
    const { email, name } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email format' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: 'An account with this email already exists. Please login instead.' 
      });
    }

    // Rate limiting - check last OTP time to prevent spam (min 30 seconds)
    const recentOTP = await OTP.findOne({ 
      email: trimmedEmail 
    }).sort({ createdAt: -1 });

    if (recentOTP && (Date.now() - recentOTP.createdAt.getTime() < 30000)) {
      const waitTime = Math.ceil((30000 - (Date.now() - recentOTP.createdAt.getTime())) / 1000);
      return res.status(429).json({ 
        success: false,
        message: `Please wait ${waitTime} seconds before requesting a new OTP.`,
        retryAfter: waitTime
      });
    }

    // Delete old OTPs
    await OTP.deleteMany({ email: trimmedEmail });

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = generateOTPExpiry();

    // Save OTP
    await OTP.create({
      email: trimmedEmail,
      otp,
      expiresAt,
    });

    // Send OTP email
    try {
      await sendOTPEmail(trimmedEmail, otp, name || 'User');
      console.log(`✅ OTP resent to ${trimmedEmail}: ${otp}`);
    } catch (emailError) {
      console.log(`⚠️ Email failed, but OTP regenerated for ${trimmedEmail}: ${otp}`);
      console.log('📧 Configure SMTP in backend/.env to send real emails');
    }

    return res.status(200).json({
      success: true,
      message: 'New OTP sent successfully! Please check your email.',
      expiresIn: '10 minutes',
      // 🔥 FOR DEVELOPMENT ONLY - Remove in production!
      ...(process.env.NODE_ENV === 'development' && { devOTP: otp }),
    });
  } catch (error) {
    console.error('resendOTP error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to resend OTP. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @route   POST /api/users/register
 * @desc    Register a new user (LEGACY - kept for backward compatibility)
 * @access  Public
 * @deprecated Use send-otp and verify-otp endpoints instead
 */
const registerUser = async (req, res) => {
  console.log("DEBUG: Incoming Request Body:", req.body); 

  try {
    let { name, email, phone, password, role } = req.body; 

    if (!phone || !password || !role) {
      return res.status(400).json({ message: 'phone, password and role are required' });
    }

    if (!['rider', 'passenger'].includes(role)) {
      return res.status(400).json({ message: 'role must be either "rider" or "passenger"' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    if (!email || email.trim() === '') {
      email = `${phone}@rideapp.com`; 
    }

    const searchQueries = [{ phone }, { email }];
    const existingUser = await User.findOne({ $or: searchQueries });
    
    if (existingUser) {
      if (existingUser.phone === phone) {
        return res.status(409).json({ message: 'A user with this phone number already exists' });
      }
      if (existingUser.email === email) {
        return res.status(409).json({ message: 'A user with this email already exists' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isAadhaarVerified: user.isAadhaarVerified,
        isDlVerified: user.isDlVerified,
      },
    });
  } catch (error) {
    console.error(`registerUser error: ${error.message}`);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ message: `An account with this ${field} already exists.` });
    }
    
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * @route   POST /api/users/login
 * @desc    Authenticate a user and return a JWT
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'phone and password are required' });
    }

    const user = await User.findOne({ phone }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isAadhaarVerified: user.isAadhaarVerified,
        isDlVerified: user.isDlVerified,
      },
    });
  } catch (error) {
    console.error(`loginUser error: ${error.message}`);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * @route   GET /api/users/me
 * @desc    Get the currently authenticated user's profile
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = req.user;
    
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        age: user.age,
        gender: user.gender,
        vehicleNumber: user.vehicleNumber,
        isAadhaarVerified: user.isAadhaarVerified,
        isDlVerified: user.isDlVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch user profile' 
    });
  }
};

/**
 * @route   POST /api/users/verify
 * @desc    Verify Aadhaar or Driving License
 * @access  Private
 */
const verifyDocuments = async (req, res) => {
  try {
    const { aadhaarNumber, dlNumber, gender } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (aadhaarNumber) {
      user.isAadhaarVerified = true;
      if (gender) {
        user.gender = gender;
      }
    }

    if (dlNumber) {
      user.isDlVerified = true;
    }

    await user.save();

    return res.status(200).json({
      message: 'Verification successful!',
      user: {
        id: user._id,
        name: user.name,
        isAadhaarVerified: user.isAadhaarVerified,
        isDlVerified: user.isDlVerified,
        gender: user.gender
      }
    });
  } catch (error) {
    console.error(`verifyDocuments error: ${error.message}`);
    return res.status(500).json({ message: 'Server error during verification' });
  }
};

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile details
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const { name, phone, age, gender, vehicleNumber } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (age !== undefined) user.age = age;
    if (gender) user.gender = gender;
    if (vehicleNumber !== undefined) user.vehicleNumber = vehicleNumber;

    await user.save();

    return res.status(200).json({ 
      message: 'Profile updated successfully!', 
      user 
    });
  } catch (error) {
    console.error(`updateProfile error: ${error.message}`);
    return res.status(500).json({ message: 'Server error while updating profile' });
  }
};
// 1️⃣ USER SUBMISSION (Status goes to 'Pending')
const verifyUser = async (req, res) => {
  try {
    const userId = req.user._id; 
    const { aadhaarNumber, dlNumber, gender } = req.body;

    if (!aadhaarNumber && !dlNumber) {
      return res.status(400).json({ message: "Bhai, kam se kam ek ID toh daal!" });
    }

    // User ne details daal di hain, par abhi VERIFY nahi hua hai
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          aadhaarNumber: aadhaarNumber || undefined,
          dlNumber: dlNumber || undefined,
          gender: gender || undefined,
          kycStatus: 'pending', // 🔥 NAYA FIELD: Status Pending ho gaya
          kycVerified: false    // 🔥 Abhi False hi rahega jab tak admin na chahe
        }
      },
      { new: true }
    );

    res.status(200).json({ 
      message: "Documents submitted successfully! Waiting for Admin approval. ⏳", 
      user: updatedUser 
    });

  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ message: "Server mein kuch gadbad hai" });
  }
};

/**
 * @route   POST /api/users/forgot-password
 * @desc    Send OTP to email for password reset
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email presence
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    // Trim and validate email format
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email format. Please enter a valid email address.' 
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'No account found with this email address.' 
      });
    }

    // Rate limiting check - prevent spam
    const recentOTP = await OTP.findOne({ 
      email: trimmedEmail 
    }).sort({ createdAt: -1 });

    if (recentOTP && (Date.now() - recentOTP.createdAt.getTime() < 30000)) {
      const waitTime = Math.ceil((30000 - (Date.now() - recentOTP.createdAt.getTime())) / 1000);
      return res.status(429).json({ 
        success: false,
        message: `Please wait ${waitTime} seconds before requesting a new OTP.`,
        retryAfter: waitTime
      });
    }

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: trimmedEmail });

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = generateOTPExpiry();

    // Save OTP to database
    await OTP.create({
      email: trimmedEmail,
      otp,
      expiresAt,
    });

    // Send OTP email
    try {
      await sendPasswordResetOTP(trimmedEmail, otp, user.name);
      console.log(`✅ Password reset OTP sent to ${trimmedEmail}: ${otp}`);
    } catch (emailError) {
      console.log(`⚠️ Email failed, but OTP generated for ${trimmedEmail}: ${otp}`);
      console.log('📧 Configure SMTP in backend/.env to send real emails');
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset OTP sent successfully! Please check your email.',
      expiresIn: '10 minutes',
      // 🔥 FOR DEVELOPMENT ONLY - Remove in production!
      ...(process.env.NODE_ENV === 'development' && { devOTP: otp }),
    });
  } catch (error) {
    console.error('forgotPassword error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to send OTP. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @route   POST /api/users/reset-password
 * @desc    Verify OTP and reset password
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Validate required fields
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Email, OTP, and new password are required' 
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters long' 
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedOTP = otp.trim();

    // Check if user exists (no need to select password here)
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'No account found with this email address.' 
      });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ 
      email: trimmedEmail,
      verified: false 
    }).sort({ createdAt: -1 }); // Get the latest OTP

    if (!otpRecord) {
      return res.status(400).json({ 
        success: false,
        message: 'OTP not found or already used. Please request a new OTP.' 
      });
    }

    // Check if OTP is expired
    if (otpRecord.isExpired()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ 
        success: false,
        message: 'OTP has expired. Please request a new one.' 
      });
    }

    // Check attempts (max 5 attempts)
    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({ 
        success: false,
        message: 'Too many incorrect attempts. Please request a new OTP.' 
      });
    }

    // Verify OTP
    if (otpRecord.otp !== trimmedOTP) {
      await otpRecord.incrementAttempts();
      const attemptsLeft = 5 - otpRecord.attempts - 1;
      return res.status(400).json({ 
        success: false,
        message: `Invalid OTP. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`,
        attemptsLeft
      });
    }

    // OTP is valid - Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    console.log(`🔐 Updating password for user: ${user.email}`);
    console.log(`📝 User ID: ${user._id}`);
    console.log(`🔒 New hashed password: ${hashedPassword.substring(0, 20)}...`);

    // Update user password directly without re-querying
    const updateResult = await User.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );

    console.log(`✅ Update result:`, updateResult);

    if (updateResult.modifiedCount === 0) {
      console.error('❌ Password update failed - no document modified');
      return res.status(500).json({ 
        success: false,
        message: 'Failed to update password. Please try again.' 
      });
    }

    // Delete used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    console.log(`✅ Password reset successful for: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now login with your new password.',
    });
  } catch (error) {
    console.error('resetPassword error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to reset password. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// All exports cleanly mapped for user controller
module.exports = {
  sendOTP,
  verifyOTPAndRegister,
  resendOTP,
  registerUser, // Legacy endpoint
  loginUser,
  getMe,
  verifyDocuments,
  updateProfile,
  verifyUser,
  forgotPassword,
  resetPassword,
};