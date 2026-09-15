const KYC = require('../models/KYC');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/kyc';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'kyc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, or WEBP images are allowed'));
    }
  }
}).single('idDocument');

/**
 * Helper: Extract text from image using OCR
 * This is a placeholder - integrate with actual OCR service
 * Options: Google Cloud Vision, AWS Textract, Tesseract.js
 */
const extractTextFromImage = async (imagePath) => {
  // TODO: Integrate with actual OCR service
  // For now, returning mock data for demonstration
  
  console.log('⚠️ OCR Service not implemented yet. Using mock data for testing.');
  console.log('📄 Image path:', imagePath);
  
  // Mock extracted data (replace with actual OCR)
  return {
    text: 'Sample extracted text from ID document',
    name: 'John Doe',
    dob: '1995',
    documentNumber: 'XXXX-XXXX-XXXX',
    isValid: true,
  };
};

/**
 * Helper: Parse extracted text to get name and DOB
 */
const parseIDData = (extractedText) => {
  // This is a simplified parser - enhance based on actual ID format
  // For Aadhaar: Name is usually in first few lines, DOB format: DD/MM/YYYY or YYYY
  // For DL: Similar pattern
  
  const data = {
    nameOnId: extractedText.name || 'Unknown',
    yearOfBirth: null,
    documentNumber: extractedText.documentNumber || null,
    isValidDocument: extractedText.isValid || false,
  };
  
  // Try to extract year from DOB
  if (extractedText.dob) {
    const year = parseInt(extractedText.dob);
    if (year > 1900 && year < new Date().getFullYear()) {
      data.yearOfBirth = year;
      data.calculatedAge = new Date().getFullYear() - year;
    }
  }
  
  return data;
};

/**
 * Helper: Calculate string similarity (for name matching)
 */
const calculateSimilarity = (str1, str2) => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 100;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 90;
  
  // Levenshtein distance for similarity
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 100;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return ((longer.length - editDistance) / longer.length) * 100;
};

const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

/**
 * Main KYC Verification Controller
 * @route POST /api/users/kyc/verify
 */
const verifyKYC = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        verificationStatus: 'FAILED',
        message: err.message,
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        verificationStatus: 'FAILED',
        message: 'No document uploaded',
      });
    }
    
    try {
      const userId = req.user._id;
      const { name, phone, age, dpUploaded } = req.body;
      
      // Step 1: Profile Completeness Check
      if (!name || !phone || !age || dpUploaded === 'false' || dpUploaded === false) {
        // Delete uploaded file
        fs.unlinkSync(req.file.path);
        
        return res.status(400).json({
          verificationStatus: 'INCOMPLETE_PROFILE',
          message: 'Verification Failed. Please complete your profile (Name, Phone, Age, and DP) before applying for KYC.',
          extractedData: null,
          matchingDetails: null,
        });
      }
      
      // Step 2: Extract data from uploaded document using OCR
      const extractedText = await extractTextFromImage(req.file.path);
      const parsedData = parseIDData(extractedText);
      
      // Step 3: Verification & Matching Logic
      const profileAge = parseInt(age);
      const calculatedAge = parsedData.calculatedAge || 0;
      
      // Name matching (allow minor variations)
      const nameSimilarity = calculateSimilarity(name, parsedData.nameOnId);
      const isNameMatched = nameSimilarity >= 70; // 70% similarity threshold
      
      // Age matching (±1 year tolerance)
      const ageDifference = Math.abs(profileAge - calculatedAge);
      const isAgeMatched = ageDifference <= 1 && calculatedAge > 0;
      
      // Overall verification status
      const verificationPassed = parsedData.isValidDocument && isNameMatched && isAgeMatched;
      
      // Save KYC record to database
      const kycRecord = await KYC.create({
        user: userId,
        documentImageUrl: req.file.path,
        extractedData: {
          nameOnId: parsedData.nameOnId,
          yearOfBirth: parsedData.yearOfBirth,
          calculatedAge: parsedData.calculatedAge,
          documentNumber: parsedData.documentNumber,
          isValidDocument: parsedData.isValidDocument,
        },
        profileData: {
          name,
          phone,
          age: profileAge,
          dpUploaded: dpUploaded === 'true' || dpUploaded === true,
        },
        matchingResults: {
          isNameMatched,
          isAgeMatched,
          nameSimilarityScore: nameSimilarity,
          ageDifference,
        },
        verificationStatus: verificationPassed ? 'passed' : 'failed',
        verificationMessage: verificationPassed 
          ? 'KYC verification completed successfully'
          : 'Verification failed due to mismatched information',
        verifiedAt: verificationPassed ? new Date() : null,
      });
      
      // Update user's KYC status if passed
      if (verificationPassed) {
        await User.findByIdAndUpdate(userId, {
          kycVerified: true,
          kycStatus: 'verified',
          kycVerifiedAt: new Date(),
        });
      } else {
        await User.findByIdAndUpdate(userId, {
          kycStatus: 'failed',
        });
      }
      
      // Step 4: Return structured JSON response
      return res.status(200).json({
        verificationStatus: verificationPassed ? 'PASSED' : 'FAILED',
        message: verificationPassed 
          ? 'KYC verification successful! Your identity has been verified.'
          : 'Verification failed. Please ensure your ID matches your profile information.',
        extractedData: {
          nameOnId: parsedData.nameOnId,
          calculatedAgeFromId: parsedData.calculatedAge || 'Not found',
          isValidDocument: parsedData.isValidDocument,
        },
        matchingDetails: {
          isNameMatched,
          isAgeMatched,
          nameSimilarityScore: Math.round(nameSimilarity),
          ageDifference,
        },
      });
      
    } catch (error) {
      console.error('KYC Verification Error:', error);
      
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(500).json({
        verificationStatus: 'FAILED',
        message: 'Server error during verification. Please try again.',
        error: error.message,
      });
    }
  });
};

/**
 * Get KYC status for current user
 * @route GET /api/users/kyc/status
 */
const getKYCStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const kycRecord = await KYC.findOne({ user: userId })
      .sort({ submittedAt: -1 })
      .select('-documentImageUrl'); // Don't send image path to frontend
    
    if (!kycRecord) {
      return res.status(404).json({
        message: 'No KYC record found',
        status: 'not_submitted',
      });
    }
    
    return res.status(200).json({
      status: kycRecord.verificationStatus,
      submittedAt: kycRecord.submittedAt,
      verifiedAt: kycRecord.verifiedAt,
      extractedData: kycRecord.extractedData,
      matchingResults: kycRecord.matchingResults,
      message: kycRecord.verificationMessage,
    });
    
  } catch (error) {
    console.error('Get KYC Status Error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Get all KYC submissions (Admin only)
 * @route GET /api/users/kyc/all
 */
const getAllKYCSubmissions = async (req, res) => {
  try {
    // TODO: Add admin authorization check
    
    const { status, limit = 50, page = 1 } = req.query;
    
    const query = status ? { verificationStatus: status } : {};
    
    const kycRecords = await KYC.find(query)
      .populate('user', 'name email phone')
      .sort({ submittedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await KYC.countDocuments(query);
    
    return res.status(200).json({
      records: kycRecords,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
    
  } catch (error) {
    console.error('Get All KYC Error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  verifyKYC,
  getKYCStatus,
  getAllKYCSubmissions,
};
