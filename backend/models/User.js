const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // never returned by default on queries
    },
    role: {
      type: String,
      enum: {
        values: ['rider', 'passenger'],
        message: '{VALUE} is not a supported role',
      },
      required: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      default: null
    },
    // NAYA: Profile edit ke liye age aur vehicleNumber add kiya
    age: {
      type: Number,
    },
    vehicleNumber: {
      type: String,
      trim: true,
    },
    isAadhaarVerified: {
      type: Boolean,
      default: false
    },
    isDlVerified: {
      type: Boolean,
      default: false
    },
    reliabilityScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    walletBalance: {
      type: Number,
      default: 500 // Joining bonus testing ke liye
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);