const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: props => `${props.value} is not a valid email address!`
      }
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^[0-9]{10}$/.test(v);
        },
        message: props => `${props.value} is not a valid 10-digit phone number!`
      }
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
      min: [18, 'You must be at least 18 years old'],
      max: [100, 'Invalid age'],
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);