import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, X, Check, AlertCircle, FileText, 
  Camera, Loader2, ShieldCheck, Image as ImageIcon 
} from 'lucide-react';

const KYCUpload = ({ onUpload, userData }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Check if profile is complete
  const isProfileComplete = () => {
    return (
      userData?.name && 
      userData?.phone && 
      userData?.age && 
      userData?.dpUploaded
    );
  };

  const validateFile = (file) => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPG, PNG, or WEBP images are allowed');
      return false;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return false;
    }

    setError('');
    return true;
  };

  const handleFileSelect = (file) => {
    if (!validateFile(file)) return;

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('idDocument', selectedFile);
      formData.append('name', userData.name);
      formData.append('phone', userData.phone);
      formData.append('age', userData.age);
      formData.append('dpUploaded', userData.dpUploaded);

      await onUpload(formData);
      
      // Success feedback
      setSelectedFile(null);
      setPreview(null);
    } catch (err) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Profile incomplete warning
  if (!isProfileComplete()) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-8 text-center"
      >
        <div className="h-16 w-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} className="text-amber-600" />
        </div>
        <h3 className="text-lg font-black text-amber-900 mb-2">
          Complete Your Profile First
        </h3>
        <p className="text-sm text-amber-700 mb-4">
          Please complete your profile (Name, Phone, Age, and Profile Picture) before applying for KYC verification.
        </p>
        <div className="flex flex-col gap-2 text-left bg-white/50 rounded-2xl p-4 text-xs">
          <div className="flex items-center gap-2">
            {userData?.name ? (
              <Check size={16} className="text-green-600" />
            ) : (
              <X size={16} className="text-red-500" />
            )}
            <span className={userData?.name ? 'text-green-700' : 'text-red-600'}>
              Name
            </span>
          </div>
          <div className="flex items-center gap-2">
            {userData?.phone ? (
              <Check size={16} className="text-green-600" />
            ) : (
              <X size={16} className="text-red-500" />
            )}
            <span className={userData?.phone ? 'text-green-700' : 'text-red-600'}>
              Phone Number
            </span>
          </div>
          <div className="flex items-center gap-2">
            {userData?.age ? (
              <Check size={16} className="text-green-600" />
            ) : (
              <X size={16} className="text-red-500" />
            )}
            <span className={userData?.age ? 'text-green-700' : 'text-red-600'}>
              Age
            </span>
          </div>
          <div className="flex items-center gap-2">
            {userData?.dpUploaded ? (
              <Check size={16} className="text-green-600" />
            ) : (
              <X size={16} className="text-red-500" />
            )}
            <span className={userData?.dpUploaded ? 'text-green-700' : 'text-red-600'}>
              Profile Picture
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* Upload Area */}
      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 ${
              dragActive 
                ? 'border-orange-500 bg-orange-50 scale-[1.02]' 
                : 'border-slate-300 hover:border-slate-400 hover:bg-slate-100'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleChange}
              className="hidden"
            />

            <motion.div
              animate={{ y: dragActive ? -5 : 0 }}
              className="flex flex-col items-center"
            >
              <div className={`h-20 w-20 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                dragActive 
                  ? 'bg-orange-100' 
                  : 'bg-slate-200'
              }`}>
                <Upload size={36} className={dragActive ? 'text-orange-600' : 'text-slate-500'} />
              </div>

              <h3 className="text-lg font-black text-slate-900 mb-2">
                {dragActive ? 'Drop Your ID Here' : 'Upload Government ID'}
              </h3>
              
              <p className="text-sm text-slate-600 mb-4">
                Drag & drop or click to select Aadhaar Card / Driving License
              </p>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ImageIcon size={14} />
                <span>JPG, PNG or WEBP • Max 5MB</span>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border-2 border-slate-200 rounded-3xl p-6"
          >
            {/* Preview Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <FileText size={20} className="text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Document Selected</h4>
                  <p className="text-xs text-slate-500">{selectedFile?.name}</p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleRemove}
                className="h-8 w-8 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-600 transition cursor-pointer"
              >
                <X size={18} />
              </motion.button>
            </div>

            {/* Image Preview */}
            <div className="relative bg-slate-100 rounded-2xl overflow-hidden mb-4">
              <img 
                src={preview} 
                alt="ID Preview" 
                className="w-full h-auto max-h-96 object-contain"
              />
            </div>

            {/* File Info */}
            <div className="flex items-center justify-between text-xs text-slate-600 mb-4 bg-slate-50 rounded-xl p-3">
              <span>Size: {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB</span>
              <span>Type: {selectedFile?.type.split('/')[1].toUpperCase()}</span>
            </div>

            {/* Upload Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUpload}
              disabled={uploading}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-black uppercase tracking-wider rounded-xl text-sm shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {uploading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Verifying Document...
                </>
              ) : (
                <>
                  <ShieldCheck size={20} />
                  Submit for Verification
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3"
          >
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-900">Upload Error</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
            <button 
              onClick={() => setError('')}
              className="text-red-400 hover:text-red-600 transition"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Card */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-4">
        <h4 className="font-bold text-sm text-blue-900 mb-2 flex items-center gap-2">
          <ShieldCheck size={16} />
          Verification Process
        </h4>
        <ul className="text-xs text-blue-700 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>Upload clear photo of Aadhaar Card or Driving License</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>Name and age will be verified automatically</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>Verification usually takes 2-5 minutes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>Your data is encrypted and secure</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default KYCUpload;
