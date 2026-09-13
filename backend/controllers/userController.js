const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { generateOTP, generateOTPExpiry } = require('../utils/otpGenerator');
const { sendOTPEmail, sendWelcomeEmail } = require('../services/emailService');

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

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this email already exists' });
    }

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = generateOTPExpiry();

    // Save OTP to database
    await OTP.create({
      email: email.toLowerCase(),
      otp,
      expiresAt,
    });

    // Send OTP email
    await sendOTPEmail(email, otp, name || 'User');

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email',
      expiresIn: '10 minutes',
    });
  } catch (error) {
    console.error('sendOTP error:', error);
    return res.status(500).json({ 
      message: 'Failed to send OTP. Please try again.',
      error: error.message 
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
    const { email, otp, name, phone, password, role } = req.body;

    // Validate required fields
    if (!email || !otp || !phone || !password || !role) {
      return res.status(400).json({ 
        message: 'Email, OTP, phone, password, and role are required' 
      });
    }

    if (!['rider', 'passenger'].includes(role)) {
      return res.status(400).json({ 
        message: 'Role must be either "rider" or "passenger"' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ 
      email: email.toLowerCase(),
      verified: false 
    }).sort({ createdAt: -1 }); // Get the latest OTP

    if (!otpRecord) {
      return res.status(400).json({ 
        message: 'OTP not found or already used. Please request a new OTP.' 
      });
    }

    // Check if OTP is expired
    if (otpRecord.isExpired()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ 
        message: 'OTP has expired. Please request a new one.' 
      });
    }

    // Check attempts (max 5 attempts)
    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({ 
        message: 'Too many incorrect attempts. Please request a new OTP.' 
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      await otpRecord.incrementAttempts();
      return res.status(400).json({ 
        message: `Invalid OTP. ${5 - otpRecord.attempts - 1} attempts remaining.` 
      });
    }

    // OTP is valid - Mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Check if user already exists (double-check)
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { phone }] 
    });

    if (existingUser) {
      return res.status(409).json({ 
        message: 'A user with this email or phone already exists' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name: name || 'User',
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role,
    });

    // Generate JWT token
    const token = generateToken(user._id);

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, name || 'User').catch(err => {
      console.error('Welcome email failed:', err);
    });

    // Delete used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to Hitchhike!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isAadhaarVerified: user.isAadhaarVerified,
        isDLVerified: user.isDlVerified,
        reliabilityScore: user.reliabilityScore,
        walletBalance: user.walletBalance,
      },
    });
  } catch (error) {
    console.error('verifyOTPAndRegister error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ 
        message: `An account with this ${field} already exists.` 
      });
    }
    
    return res.status(500).json({ 
      message: 'Server error during registration',
      error: error.message 
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

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this email already exists' });
    }

    // Check last OTP time to prevent spam (min 30 seconds between requests)
    const recentOTP = await OTP.findOne({ 
      email: email.toLowerCase() 
    }).sort({ createdAt: -1 });

    if (recentOTP && (Date.now() - recentOTP.createdAt.getTime() < 30000)) {
      return res.status(429).json({ 
        message: 'Please wait 30 seconds before requesting a new OTP' 
      });
    }

    // Delete old OTPs
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = generateOTPExpiry();

    // Save OTP
    await OTP.create({
      email: email.toLowerCase(),
      otp,
      expiresAt,
    });

    // Send OTP email
    await sendOTPEmail(email, otp, name || 'User');

    return res.status(200).json({
      success: true,
      message: 'New OTP sent successfully',
      expiresIn: '10 minutes',
    });
  } catch (error) {
    console.error('resendOTP error:', error);
    return res.status(500).json({ 
      message: 'Failed to resend OTP',
      error: error.message 
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
        isDLVerified: user.isDlVerified,
        reliabilityScore: user.reliabilityScore,
        walletBalance: user.walletBalance,
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
        isDLVerified: user.isDlVerified,
        reliabilityScore: user.reliabilityScore,
        walletBalance: user.walletBalance,
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
  return res.status(200).json(req.user);
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
// Yahan neeche verifyUser ko export karna mat bhoolna!
// module.exports = { ...tere purane functions, verifyUser };
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
};