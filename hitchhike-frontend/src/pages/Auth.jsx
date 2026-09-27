import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, X } from 'lucide-react';
import api from '../services/api_service';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login/Register
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Login State
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // Register State
  const [registerStep, setRegisterStep] = useState(1); // 1: Email, 2: OTP, 3: Details
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    age: '',
    gender: '',
    vehicleNumber: ''
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);
  const otpInputRefs = useRef([]);

  // Forgot Password State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const forgotOtpRefs = useRef([]);

  // Error/Success messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // ==================== LOGIN ====================
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/users/login', loginData);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('token', response.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // ==================== REGISTER ====================
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/users/send-otp', {
        email: registerData.email,
        name: registerData.name || 'User'
      });

      if (response.data.devOTP) {
        console.log('🔐 DEV OTP:', response.data.devOTP);
        alert(`🔐 DEV MODE\nOTP: ${response.data.devOTP}`);
      }

      setSuccess(response.data.message);
      setRegisterStep(2);
      setResendTimer(30);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter complete 6-digit OTP');
      setLoading(false);
      return;
    }

    // Just move to next step (backend will verify during final registration)
    setSuccess('OTP verified! Complete your profile.');
    setRegisterStep(3);
    setLoading(false);
  };

  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const otpCode = otp.join('');

    try {
      const response = await api.post('/users/verify-otp', {
        email: registerData.email,
        otp: otpCode,
        name: registerData.name,
        phone: registerData.phone,
        password: registerData.password,
        age: registerData.age,
        gender: registerData.gender,
        vehicleNumber: registerData.vehicleNumber || undefined
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      setSuccess('Registration successful!');
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/users/resend-otp', {
        email: registerData.email,
        name: registerData.name || 'User'
      });

      if (response.data.devOTP) {
        console.log('🔐 DEV OTP (Resent):', response.data.devOTP);
        alert(`🔐 DEV MODE\nNew OTP: ${response.data.devOTP}`);
      }

      setSuccess('New OTP sent!');
      setOtp(['', '', '', '', '', '']);
      setResendTimer(30);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // ==================== FORGOT PASSWORD ====================
  const handleSendResetOTP = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await api.post('/users/forgot-password', { email: forgotEmail });
      setForgotStep(2);
      setResendTimer(30);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOTPAndReset = async (e) => {
    e.preventDefault();
    const otpCode = forgotOtp.join('');
    if (otpCode.length !== 6) {
      alert('Please enter complete 6-digit OTP');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setForgotLoading(true);
    try {
      await api.post('/users/reset-password', {
        email: forgotEmail,
        otp: otpCode,
        newPassword
      });
      alert('Password reset successful! You can now login.');
      setShowForgotPassword(false);
      setForgotStep(1);
      setForgotEmail('');
      setForgotOtp(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-4 bg-gradient-to-br from-purple-50 via-white to-orange-50 py-4">
      {/* Header */}
      <div className="mb-4 text-center">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-orange-500">
          Hitchhike
        </h1>
        <p className="text-gray-600 mt-1 font-semibold">
          {isLogin ? 'Welcome back!' : 'Join the community'}
        </p>
      </div>

      {/* Toggle Tabs */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl max-w-md mx-auto w-full">
        <button
          onClick={() => {
            setIsLogin(true);
            setError('');
            setSuccess('');
          }}
          className={`flex-1 py-2.5 rounded-lg font-black text-sm transition-all ${
            isLogin
              ? 'bg-white text-purple-600 shadow-md'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          LOGIN
        </button>
        <button
          onClick={() => {
            setIsLogin(false);
            setRegisterStep(1);
            setError('');
            setSuccess('');
          }}
          className={`flex-1 py-2.5 rounded-lg font-black text-sm transition-all ${
            !isLogin
              ? 'bg-white text-purple-600 shadow-md'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          REGISTER
        </button>
      </div>

      {/* Error/Success Messages */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm max-w-md mx-auto w-full"
          >
            ⚠️ {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm max-w-md mx-auto w-full"
          >
            ✓ {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          {isLogin ? (
            /* ==================== LOGIN FORM ==================== */
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleLogin}
              className="bg-white rounded-2xl shadow-xl p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-purple-600 hover:text-purple-700 font-bold"
              >
                Forgot Password?
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'LOGIN'}
              </button>
            </motion.form>
          ) : (
            /* ==================== REGISTER FORM ==================== */
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              {/* Progress Indicator */}
              <div className="flex items-center justify-center mb-6 gap-2">
                <div className={`h-2 w-16 rounded-full transition-all ${registerStep >= 1 ? 'bg-gradient-to-r from-purple-500 to-orange-500' : 'bg-gray-200'}`}></div>
                <div className={`h-2 w-16 rounded-full transition-all ${registerStep >= 2 ? 'bg-gradient-to-r from-purple-500 to-orange-500' : 'bg-gray-200'}`}></div>
                <div className={`h-2 w-16 rounded-full transition-all ${registerStep >= 3 ? 'bg-gradient-to-r from-purple-500 to-orange-500' : 'bg-gray-200'}`}></div>
              </div>

              <AnimatePresence mode="wait">
                {/* Step 1: Email */}
                {registerStep === 1 && (
                  <motion.form
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleSendOTP}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={registerData.name}
                        onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="your@email.com"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                      {loading ? 'Sending...' : 'Send OTP'}
                    </button>
                  </motion.form>
                )}

                {/* Step 2: OTP */}
                {registerStep === 2 && (
                  <motion.form
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleVerifyOTP}
                    className="space-y-4"
                  >
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-2">📧</div>
                      <p className="text-sm text-gray-600">
                        Enter the 6-digit code sent to<br />
                        <span className="font-bold">{registerData.email}</span>
                      </p>
                    </div>

                    <div className="flex gap-2 justify-center">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (otpInputRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOTPChange(index, e.target.value)}
                          onKeyDown={(e) => handleOTPKeyDown(index, e)}
                          className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                        />
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otp.join('').length !== 6}
                      className="w-full py-3 bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                      {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>

                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={resendTimer > 0}
                      className="w-full text-sm text-purple-600 hover:text-purple-700 font-bold disabled:text-gray-400"
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                    </button>
                  </motion.form>
                )}

                {/* Step 3: Complete Profile */}
                {registerStep === 3 && (
                  <motion.form
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleCompleteRegistration}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          required
                          value={registerData.phone}
                          onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                          placeholder="9876543210"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Age</label>
                        <input
                          type="number"
                          required
                          value={registerData.age}
                          onChange={(e) => setRegisterData({ ...registerData, age: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                          placeholder="25"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Gender</label>
                      <select
                        required
                        value={registerData.gender}
                        onChange={(e) => setRegisterData({ ...registerData, gender: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                      <input
                        type="password"
                        required
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                        placeholder="••••••••"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Vehicle Number <span className="text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={registerData.vehicleNumber}
                        onChange={(e) => setRegisterData({ ...registerData, vehicleNumber: e.target.value.toUpperCase() })}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                        placeholder="MP09XX1234"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                      {loading ? 'Creating Account...' : 'Complete Registration'}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotPassword && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotPassword(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-black">Forgot Password</h2>
                  <button
                    onClick={() => setShowForgotPassword(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>

                {forgotStep === 1 && (
                  <form onSubmit={handleSendResetOTP} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                        placeholder="your@email.com"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full py-3 bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 text-white font-black rounded-xl"
                    >
                      {forgotLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                  </form>
                )}

                {forgotStep === 2 && (
                  <form onSubmit={handleVerifyOTPAndReset} className="space-y-4">
                    <div className="flex gap-2 justify-center mb-4">
                      {forgotOtp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (forgotOtpRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => {
                            const newOtp = [...forgotOtp];
                            newOtp[index] = e.target.value;
                            setForgotOtp(newOtp);
                            if (e.target.value && index < 5) {
                              forgotOtpRefs.current[index + 1]?.focus();
                            }
                          }}
                          className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-xl focus:border-purple-500"
                        />
                      ))}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">New Password</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Confirm Password</label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                        placeholder="••••••••"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full py-3 bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 text-white font-black rounded-xl"
                    >
                      {forgotLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Auth;
