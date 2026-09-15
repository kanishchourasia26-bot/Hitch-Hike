const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  documentType: {
    type: String,
    enum: ['aadhaar', 'driving_license', 'other'],
    default: 'aadhaar',
  },
  documentImageUrl: {
    type: String,
    required: true,
  },
  // Extracted data from document
  extractedData: {
    nameOnId: String,
    dateOfBirth: String,
    yearOfBirth: Number,
    calculatedAge: Number,
    documentNumber: String,
    isValidDocument: {
      type: Boolean,
      default: false,
    },
  },
  // User profile data at time of verification
  profileData: {
    name: String,
    phone: String,
    age: Number,
    dpUploaded: Boolean,
  },
  // Matching results
  matchingResults: {
    isNameMatched: {
      type: Boolean,
      default: false,
    },
    isAgeMatched: {
      type: Boolean,
      default: false,
    },
    nameSimilarityScore: {
      type: Number,
      default: 0,
    },
    ageDifference: {
      type: Number,
      default: 0,
    },
  },
  // Verification status
  verificationStatus: {
    type: String,
    enum: ['pending', 'passed', 'failed', 'incomplete_profile'],
    default: 'pending',
  },
  verificationMessage: {
    type: String,
    default: '',
  },
  // Admin review (for manual verification)
  adminReviewed: {
    type: Boolean,
    default: false,
  },
  adminReviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  adminReviewedAt: Date,
  adminComments: String,
  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  verifiedAt: Date,
}, { timestamps: true });

// Index for faster queries
kycSchema.index({ user: 1, verificationStatus: 1 });
kycSchema.index({ submittedAt: -1 });

// Method to check if verification passed all checks
kycSchema.methods.isPassed = function() {
  return this.verificationStatus === 'passed' && 
         this.extractedData.isValidDocument &&
         this.matchingResults.isNameMatched &&
         this.matchingResults.isAgeMatched;
};

const KYC = mongoose.model('KYC', kycSchema);

module.exports = KYC;
