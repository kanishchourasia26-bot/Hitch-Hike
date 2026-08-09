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

// All exports cleanly mapped
// All exports cleanly mapped for user controller
module.exports = {
  registerUser,
  loginUser,
  getMe,
  verifyDocuments,
  updateProfile
};