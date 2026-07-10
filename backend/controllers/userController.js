const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

/**
 * Helper: sign a JWT for a given user id
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'supersecretkey', {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

/**
 * @route   POST /api/users/register
 * @desc    Register a new user (rider or passenger)
 * @access  Public
 */
const registerUser = async (req, res) => {
  console.log("DEBUG: Incoming Request Body:", req.body); 

  try {
    // Yahan maine 'const' ki jagah 'let' kar diya hai taaki hum email ko modify kar sakein
    let { name, email, phone, password, role } = req.body; 

    // --- Basic validation ---
    if (!phone || !password || !role) {
      return res.status(400).json({ message: 'phone, password and role are required' });
    }

    if (!['rider', 'passenger'].includes(role)) {
      return res.status(400).json({ message: 'role must be either "rider" or "passenger"' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // --- YAHAN FIX KIYA HAI: Agar frontend se email nahi aaya, toh phone number se ek unique dummy email bana lo ---
    if (!email || email.trim() === '') {
      email = `${phone}@rideapp.com`; 
    }

    // --- NAYA LOGIC: Phone aur Email dono ka Duplicate check ---
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

    // --- Hash password ---
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // --- Create user ---
    const user = await User.create({
      name,
      email, // Yahan ab unique dummy email jayega agar user ne nahi diya toh
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
        email: user.email, // Frontend ko dummy email mil jayega
        phone: user.phone,
        role: user.role,
        isAadhaarVerified: user.isAadhaarVerified,
        isDLVerified: user.isDLVerified,
        reliabilityScore: user.reliabilityScore,
        walletBalance: user.walletBalance,
      },
    });
  } catch (error) {
    console.error(`registerUser error: ${error.message}`);
    
    // --- NAYA LOGIC: MongoDB Error Handling ---
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
        isDLVerified: user.isDLVerified,
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

    // Agar Aadhaar number aaya hai
    if (aadhaarNumber) {
      // Asli app mein yahan OTP/API logic lagta hai. Hum direct true kar rahe hain.
      user.isAadhaarVerified = true;
      if (gender) {
        user.gender = gender; // Gender Aadhaar se nikal liya (mock)
      }
    }

    // Agar DL number aaya hai
    if (dlNumber) {
      user.isDlVerified = true;
    }

    await user.save();

    res.status(200).json({
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
    res.status(500).json({ message: 'Server error during verification' });
  }
};

// Exports mein isko add karna mat bhoolna!
// module.exports = { registerUser, authUser, getUserProfile, verifyDocuments };
module.exports = {
  registerUser,
  loginUser,
  getMe,
  verifyDocuments
};