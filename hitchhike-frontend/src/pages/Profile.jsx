import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, LogOut, User, Car, Trash2, 
  Loader2, Wallet, Edit3, Save, X, PlusCircle, ChevronRight,
  Bell, Settings, Award, TrendingUp, Clock, MapPin, Phone,
  Mail, Calendar as CalendarIcon, CheckCircle2, Shield, 
  AlertTriangle, Siren, UserCheck, PhoneCall, MapPinned
} from 'lucide-react';

import api from '../services/api_service';

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile'); 
  const [history, setHistory] = useState([]);
  const [offeredCommutes, setOfferedCommutes] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '', phone: '', age: '', gender: '', vehicleNumber: ''
  });

  // Verification Form States
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [verifyGender, setVerifyGender] = useState('');
  const [dlInput, setDlInput] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      let res;
      try { res = await api.get('/users/me'); } 
      catch (err) { res = await api.get('/users/profile'); }
      
      const user = res.data?.user || res.data;
      setUserData(user);

      setEditForm({
        name: user.name || '',
        phone: user.phone || '',
        age: user.age || '',
        gender: user.gender || '',
        vehicleNumber: user.vehicleNumber || ''
      });

      const ridesRes = await api.get('/rides/my-rides');
      const offered = ridesRes.data?.offeredRides || [];
      const booked = ridesRes.data?.bookedRides || [];
      
      setOfferedCommutes(offered);
      setHistory([...offered, ...booked].filter(r => r.status === 'completed'));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const response = await api.put('/users/profile', editForm);
      setUserData(response.data.user);
      alert("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      alert("Failed to update profile: " + (error.response?.data?.message || "Please try again"));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!aadhaarInput && !dlInput) return alert("Please enter at least one Document!");
    setVerifying(true);
    try {
      const response = await api.post('/users/verify', {
        aadhaarNumber: aadhaarInput, dlNumber: dlInput, gender: verifyGender
      });
      alert("Verification Successful! 🎉");
      setUserData(response.data.user || response.data); 
    } catch (error) {
      alert(error.response?.data?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleDeleteCommute = async (commuteId) => {
    if (!window.confirm("Are you sure you want to permanently delete this offered commute?")) return;
    setDeletingId(commuteId);
    try {
      await api.delete(`/rides/${commuteId}`);
      setOfferedCommutes(prev => prev.filter(c => c._id !== commuteId));
      alert("Commute successfully deleted.");
    } catch (error) {
      alert("Failed to delete commute.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user'); 
    localStorage.removeItem('token'); 
    navigate('/login'); 
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-rose-50">
        <Loader2 size={40} className="animate-spin text-rose-500 mb-3" />
        <p className="text-sm font-bold text-slate-600">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50/20 pb-24">
      
      {/* REFINED HEADER WITH GRADIENT */}
      <div className="relative bg-gradient-to-br from-orange-500 via-rose-500 to-pink-600 text-white pt-8 pb-20 px-5 overflow-hidden">
        {/* Decorative Blurred Elements */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-300 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-3xl mx-auto">
          {/* Top Actions */}
          <div className="flex justify-between items-center mb-6">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="h-10 w-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center cursor-pointer hover:bg-white/25 transition-all duration-300"
            >
              <ChevronRight size={18} className="rotate-180" />
            </motion.button>
            
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="h-10 w-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center cursor-pointer hover:bg-white/25 transition-all duration-300"
              >
                <Bell size={18} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="h-10 w-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center cursor-pointer hover:bg-white/25 transition-all duration-300"
              >
                <Settings size={18} />
              </motion.button>
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex items-start gap-4 mb-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-white to-rose-100 text-rose-600 flex items-center justify-center text-3xl font-black shadow-2xl shadow-black/20">
                {userData?.name ? userData.name[0].toUpperCase() : "U"}
              </div>
              {(userData?.isAadhaarVerified || userData?.isDlVerified) && (
                <div className="absolute -bottom-1 -right-1 h-7 w-7 bg-emerald-500 rounded-xl flex items-center justify-center border-2 border-white shadow-lg">
                  <CheckCircle2 size={14} className="text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black">{userData?.name || "User"}</h1>
                {userData?.reliabilityScore >= 80 && (
                  <div className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 shadow-sm">
                    <Award size={10} /> Pro
                  </div>
                )}
              </div>
              <p className="text-rose-100 text-sm font-semibold mb-2">
                {userData?.phone || userData?.email}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <TrendingUp size={14} />
                  <span className="text-xs font-bold">{userData?.reliabilityScore || 100}% Trust</span>
                </div>
                <div className="h-4 w-px bg-white/30" />
                <div className="flex items-center gap-1">
                  <Car size={14} />
                  <span className="text-xs font-bold">{offeredCommutes.length} Routes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Card */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-md border border-white/30 rounded-3xl p-4 flex items-center justify-between cursor-pointer hover:from-white/25 hover:to-white/15 transition-all duration-300 shadow-lg shadow-black/10"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white/25 flex items-center justify-center">
                <Wallet size={22} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-rose-100 tracking-wider">Wallet Balance</p>
                <p className="text-2xl font-black">₹{userData?.walletBalance || 0}</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-white/70" />
          </motion.div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 -mt-10 space-y-4">
        
        {/* REFINED TABS NAVIGATION */}
        <div className="bg-white/90 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-200/60 shadow-xl flex items-center gap-1.5">
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-[18px] text-xs font-black uppercase tracking-wide transition-all duration-300 ${
              activeTab === 'profile' 
                ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-rose-400/30' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <User size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">Profile</span>
          </button>
          <button 
            onClick={() => setActiveTab('commutes')} 
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-[18px] text-xs font-black uppercase tracking-wide transition-all duration-300 ${
              activeTab === 'commutes' 
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-400/30' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Car size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">Rides</span>
          </button>
          <button 
            onClick={() => setActiveTab('verification')} 
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-[18px] text-xs font-black uppercase tracking-wide transition-all duration-300 ${
              activeTab === 'verification' 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-400/30' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Shield size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">Verify</span>
          </button>
        </div>

        {/* TAB 1: PROFILE & EDIT */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Personal Info Card */}
              <div className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/60 shadow-lg">
                {!isEditing ? (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                      <div>
                        <h3 className="font-black text-slate-900 text-base">Personal Details</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Your profile information</p>
                      </div>
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsEditing(true)} 
                        className="flex items-center gap-2 text-orange-600 text-xs font-black bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-100 cursor-pointer transition-colors duration-200"
                      >
                        <Edit3 size={14} /> Edit
                      </motion.button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Phone size={14} className="text-rose-500" />
                          <p className="text-[10px] text-slate-500 font-black uppercase">Phone</p>
                        </div>
                        <p className="text-sm font-black text-slate-900">{userData?.phone || 'Not set'}</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <User size={14} className="text-teal-500" />
                          <p className="text-[10px] text-slate-500 font-black uppercase">Age</p>
                        </div>
                        <p className="text-sm font-black text-slate-900">{userData?.age ? `${userData.age} years` : 'Not set'}</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <User size={14} className="text-violet-500" />
                          <p className="text-[10px] text-slate-500 font-black uppercase">Gender</p>
                        </div>
                        <p className="text-sm font-black text-slate-900 capitalize">{userData?.gender || 'Not set'}</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Car size={14} className="text-emerald-500" />
                          <p className="text-[10px] text-slate-500 font-black uppercase">Vehicle</p>
                        </div>
                        <p className="text-sm font-black text-slate-900">{userData?.vehicleNumber || 'Not added'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                      <div>
                        <h3 className="font-black text-slate-900 text-base">Edit Profile</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Update your information</p>
                      </div>
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        type="button" 
                        onClick={() => setIsEditing(false)} 
                        className="text-slate-400 hover:text-rose-500 cursor-pointer transition-colors duration-200"
                      >
                        <X size={22} strokeWidth={2.5} />
                      </motion.button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1 mb-1.5 block">Full Name</label>
                        <input 
                          type="text" 
                          placeholder="Enter your name" 
                          value={editForm.name} 
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})} 
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" 
                          required 
                        />
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1 mb-1.5 block">Phone Number</label>
                        <input 
                          type="text" 
                          placeholder="Enter phone number" 
                          value={editForm.phone} 
                          onChange={(e) => setEditForm({...editForm, phone: e.target.value})} 
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition" 
                          required 
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase ml-1 mb-1.5 block">Age</label>
                          <input 
                            type="number" 
                            placeholder="Age" 
                            value={editForm.age} 
                            onChange={(e) => setEditForm({...editForm, age: e.target.value})} 
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase ml-1 mb-1.5 block">Gender</label>
                          <select 
                            value={editForm.gender} 
                            onChange={(e) => setEditForm({...editForm, gender: e.target.value})} 
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                          >
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1 mb-1.5 block">Vehicle Number</label>
                        <input 
                          type="text" 
                          placeholder="e.g. MP20 AB 1234" 
                          value={editForm.vehicleNumber} 
                          onChange={(e) => setEditForm({...editForm, vehicleNumber: e.target.value})} 
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition" 
                        />
                      </div>
                    </div>
                    
                    <motion.button 
                      whileTap={{ scale: 0.98 }}
                      type="submit" 
                      disabled={savingProfile} 
                      className="w-full py-4 bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black uppercase tracking-wider rounded-xl text-sm shadow-lg shadow-rose-400/40 flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-rose-400/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingProfile ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          Save Changes
                        </>
                      )}
                    </motion.button>
                  </form>
                )}
              </div>

              {/* Logout Button */}
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout} 
                className="w-full flex items-center justify-center gap-3 p-4 text-red-600 font-black text-sm bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl border border-red-200/60 shadow-lg hover:from-red-100 hover:to-rose-100 transition-all duration-200"
              >
                <LogOut size={18} strokeWidth={2.5} />
                <span className="uppercase tracking-wider">Logout</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TAB 2: MY COMMUTES */}
        {activeTab === 'commutes' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            
            <div className="flex items-center justify-between px-2">
              <h3 className="font-black text-slate-900 text-sm uppercase">Offered Routes</h3>
              {offeredCommutes.length > 0 && (
                <button onClick={() => navigate('/offer')} className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-[10px] font-black uppercase rounded-lg hover:from-teal-700 hover:to-cyan-700 transition cursor-pointer shadow-md">
                  <PlusCircle size={14} /> Add New
                </button>
              )}
            </div>

            {offeredCommutes.length === 0 ? (
              <div className="bg-white/90 p-10 rounded-2xl border border-slate-200 text-center shadow-lg">
                <Car size={40} className="mx-auto text-slate-300 mb-4" />
                <h3 className="font-black text-slate-900 text-sm mb-1">No Active Commutes</h3>
                <p className="text-xs text-slate-500 mb-6">You haven't offered any daily routes yet. Publish your route so peers can join.</p>
                <button onClick={() => navigate('/offer')} className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:from-teal-600 hover:to-cyan-600 transition cursor-pointer shadow-lg shadow-teal-400/30 flex justify-center items-center gap-2">
                  <PlusCircle size={16} /> Offer A Commute
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {offeredCommutes.map((commute) => (
                  <div key={commute._id} className="bg-white/90 p-5 rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl hover:border-teal-300/50 transition-all duration-300">
                    <div className="flex justify-between items-start border-b border-slate-200 pb-3 mb-3">
                      <div className="pr-2">
                        <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">
                          Reach by {commute.reachTime}
                        </p>
                        <p className="text-sm font-extrabold text-slate-900 mt-1 truncate">
                          {commute.endPoint?.address || 'Destination'}
                        </p>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5 truncate">
                          From: {commute.startPoint?.address || 'Pickup'}
                        </p>
                      </div>
                      <span className="shrink-0 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-md uppercase">
                        Active
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xs text-slate-600 font-bold bg-slate-100 px-2 py-1 rounded-md">
                        Days: {commute.days?.join(', ').toUpperCase()}
                      </div>
                      <div className="text-xs text-slate-600 font-bold bg-slate-100 px-2 py-1 rounded-md">
                        Fare: ₹{commute.farePerKm}/km
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDeleteCommute(commute._id)} 
                      disabled={deletingId === commute._id}
                      className="w-full py-3 bg-gradient-to-r from-red-50 to-rose-50 text-red-600 rounded-xl text-xs font-black uppercase tracking-wider flex justify-center items-center gap-2 hover:from-red-100 hover:to-rose-100 transition-colors duration-200 cursor-pointer disabled:opacity-50 border border-red-200"
                    >
                      {deletingId === commute._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      Delete Commute
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 3: VERIFICATION */}
        {activeTab === 'verification' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
             <div className="bg-white/90 p-6 rounded-2xl border border-slate-200 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-slate-900 text-sm uppercase">ID Verification</h3>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg transition-colors duration-200 ${userData?.kycVerified || userData?.isAadhaarVerified ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700' : 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700'}`}>
                    {userData?.kycVerified || userData?.isAadhaarVerified ? 'Verified ✓' : 'Pending'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Submit your details to get the verified badge and increase trust among peers.</p>
             </div>
             
             {(!userData?.isAadhaarVerified || !userData?.isDlVerified) && (
                <form onSubmit={handleVerify} className="bg-white/90 p-6 rounded-2xl border border-slate-200 shadow-lg space-y-4">
                  {!userData?.isAadhaarVerified && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-600 uppercase">Govt ID Number</label>
                      <input type="text" placeholder="Enter ID number" value={aadhaarInput} onChange={(e) => setAadhaarInput(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition" />
                      <select value={verifyGender} onChange={(e) => setVerifyGender(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition">
                        <option value="">Select Gender on ID</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  )}

                  {!userData?.isDlVerified && (
                    <div className="space-y-3 mt-4">
                      <label className="text-[10px] font-black text-slate-600 uppercase">Driving License (Optional)</label>
                      <input type="text" placeholder="Enter DL Number" value={dlInput} onChange={(e) => setDlInput(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition" />
                    </div>
                  )}

                  <button type="submit" disabled={verifying} className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black uppercase tracking-wider rounded-xl text-xs mt-2 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-emerald-400/30">
                    {verifying ? 'Verifying...' : 'Submit Verification'}
                  </button>
                </form>
             )}
          </motion.div>
        )}

      </main>
    </div>
  );
};

export default Profile;