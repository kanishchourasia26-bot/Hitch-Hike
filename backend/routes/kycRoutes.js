const express = require('express');
const router = express.Router();
const { 
  verifyKYC, 
  getKYCStatus, 
  getAllKYCSubmissions 
} = require('../controllers/kycController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/users/kyc/verify
 * @desc    Submit KYC document for verification
 * @access  Private
 */
router.post('/verify', protect, verifyKYC);

/**
 * @route   GET /api/users/kyc/status
 * @desc    Get KYC status for current user
 * @access  Private
 */
router.get('/status', protect, getKYCStatus);

/**
 * @route   GET /api/users/kyc/all
 * @desc    Get all KYC submissions (Admin only)
 * @access  Private/Admin
 */
router.get('/all', protect, getAllKYCSubmissions);

module.exports = router;
