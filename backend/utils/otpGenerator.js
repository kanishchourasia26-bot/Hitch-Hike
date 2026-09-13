/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit numeric OTP
 */
const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
};

/**
 * Generate OTP expiry time (10 minutes from now)
 * @returns {Date} Expiry timestamp
 */
const generateOTPExpiry = () => {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
};

module.exports = {
  generateOTP,
  generateOTPExpiry,
};
