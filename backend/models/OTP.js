const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // Document will be automatically deleted after 10 minutes (600 seconds)
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  attempts: {
    type: Number,
    default: 0,
  },
});

// Indexes for faster queries and auto-deletion
otpSchema.index({ email: 1, createdAt: -1 });
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 }); // Auto-delete after 10 minutes

// Method to check if OTP is expired
otpSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

// Method to increment attempts
otpSchema.methods.incrementAttempts = async function () {
  this.attempts += 1;
  await this.save();
};

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
