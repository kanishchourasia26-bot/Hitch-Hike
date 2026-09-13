import { io } from 'socket.io-client';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, LogOut, User, Car, MessageSquare, Trash2, 
  Loader2, Wallet, Edit3, Save, X, PlusCircle, ChevronRight,
  Bell, Settings, Award, TrendingUp, Clock, MapPin, Phone,
  Mail, Calendar as CalendarIcon, CheckCircle2, Shield
} from 'lucide-react';

import api from '../services/api_service';
import Chat from './Chat';
const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  // Jahan tune baaki states banaye hain (e.g., activeTab)
const [activeChatPeerId, setActiveChatPeerId] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); 
  const [chatsLoading, setChatsLoading] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
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
// 🔥 NAYA: Background Socket Listener (For Live Unread Badges) 🔥
  useEffect(() => {
    const userStore = JSON.parse(localStorage.getItem('user')) || {};
    const myId = userStore._id || userStore.id || userStore.user?._id;

    if (!myId) return;

    // Backend se connect karo
    const socket = io("http://localhost:5000"); // Apna port check kar lena
    socket.emit("join_chat", myId);

    // Jab koi naya message aaye
    socket.on("receive_message", (message) => {
      // Agar wo wali chat ka modal ABHI nahi khula hai, tabhi notification / badge dikhao
      if (activeChatPeerId !== message.sender) {
        // Chupchaap background mein inbox fetch karlo
        fetchInboxChats(); 
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [activeChatPeerId]); // Jab modal khule/band ho toh listener update ho
  // 🆕 NAYA: Jab 'chats' tab khulega tab API call hogi
  useEffect(() => {
    if (activeTab === 'chats') {
      fetchInboxChats();
    }
  }, [activeTab]);

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

  // 🆕 NAYA: Real Inbox fetch karne ka function
  const fetchInboxChats = async () => {
    setChatsLoading(true);
    try {
      const response = await api.get('/chats');
      setRecentChats(response.data);
    } catch (error) {
      console.error("Failed to load chats:", error);
    } finally {
      setChatsLoading(false);
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-gray-50">
        <Loader2 size={40} className="animate-spin text-orange-500 mb-3" />
        <p className="text-sm font-bold text-gray-600">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 pb-24">
      
      {/* MODERN HEADER */}
      <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white pt-8 pb-20 px-5 overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-3xl mx-auto">
          {/* Top Actions */}
          <div className="flex justify-between items-center mb-6">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="h-10 w-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/20 transition"
            >
              <ChevronRight size={18} className="rotate-180" />
            </motion.button>
            
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="h-10 w-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/20 transition"
              >
                <Bell size={18} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="h-10 w-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/20 transition"
              >
                <Settings size={18} />
              </motion.button>
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex items-start gap-4 mb-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-3xl bg-white text-orange-600 flex items-center justify-center text-3xl font-black shadow-2xl shadow-black/20">
                {userData?.name ? userData.name[0].toUpperCase() : "U"}
              </div>
              {(userData?.isAadhaarVerified || userData?.isDlVerified) && (
                <div className="absolute -bottom-1 -right-1 h-7 w-7 bg-green-500 rounded-xl flex items-center justify-center border-2 border-white shadow-lg">
                  <CheckCircle2 size={14} className="text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black">{userData?.name || "User"}</h1>
                {userData?.reliabilityScore >= 80 && (
                  <div className="px-2 py-0.5 bg-yellow-400 text-yellow-900 rounded-lg text-[9px] font-black uppercase flex items-center gap-1">
                    <Award size={10} /> Pro
                  </div>
                )}
              </div>
              <p className="text-orange-100 text-sm font-semibold mb-2">
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
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-4 flex items-center justify-between cursor-pointer hover:bg-white/15 transition"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Wallet size={22} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-orange-100 tracking-wider">Wallet Balance</p>
                <p className="text-2xl font-black">₹{userData?.walletBalance || 0}</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-white/60" />
          </motion.div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 -mt-10 space-y-4">
        
        {/* MODERN TABS NAVIGATION */}
        <div className="bg-white/80 backdrop-blur-xl p-1.5 rounded-3xl border border-gray-200/50 shadow-xl flex items-center gap-1.5">
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-[20px] text-xs font-black uppercase tracking-wide transition-all duration-300 ${
              activeTab === 'profile' 
                ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <User size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">Profile</span>
          </button>
          <button 
            onClick={() => setActiveTab('commutes')} 
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-[20px] text-xs font-black uppercase tracking-wide transition-all duration-300 ${
              activeTab === 'commutes' 
                ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Car size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">Rides</span>
          </button>
          <button 
            onClick={() => setActiveTab('chats')} 
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-[20px] text-xs font-black uppercase tracking-wide transition-all duration-300 ${
              activeTab === 'chats' 
                ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <MessageSquare size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">Chats</span>
          </button>
          <button 
            onClick={() => setActiveTab('verification')} 
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-[20px] text-xs font-black uppercase tracking-wide transition-all duration-300 ${
              activeTab === 'verification' 
                ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
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
              <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-gray-200/50 shadow-lg">
                {!isEditing ? (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                      <div>
                        <h3 className="font-black text-gray-900 text-base">Personal Details</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Your profile information</p>
                      </div>
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsEditing(true)} 
                        className="flex items-center gap-2 text-orange-600 text-xs font-black bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-100 cursor-pointer transition"
                      >
                        <Edit3 size={14} /> EDIT
                      </motion.button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Phone size={14} className="text-orange-500" />
                          <p className="text-[10px] text-gray-400 font-black uppercase">Phone</p>
                        </div>
                        <p className="text-sm font-black text-gray-900">{userData?.phone || 'Not set'}</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <User size={14} className="text-orange-500" />
                          <p className="text-[10px] text-gray-400 font-black uppercase">Age</p>
                        </div>
                        <p className="text-sm font-black text-gray-900">{userData?.age ? `${userData.age} years` : 'Not set'}</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <User size={14} className="text-orange-500" />
                          <p className="text-[10px] text-gray-400 font-black uppercase">Gender</p>
                        </div>
                        <p className="text-sm font-black text-gray-900 capitalize">{userData?.gender || 'Not set'}</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Car size={14} className="text-orange-500" />
                          <p className="text-[10px] text-gray-400 font-black uppercase">Vehicle</p>
                        </div>
                        <p className="text-sm font-black text-gray-900">{userData?.vehicleNumber || 'Not added'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                      <div>
                        <h3 className="font-black text-gray-900 text-base">Edit Profile</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Update your information</p>
                      </div>
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        type="button" 
                        onClick={() => setIsEditing(false)} 
                        className="text-gray-400 hover:text-red-500 cursor-pointer transition"
                      >
                        <X size={22} strokeWidth={2.5} />
                      </motion.button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1.5 block">Full Name</label>
                        <input 
                          type="text" 
                          placeholder="Enter your name" 
                          value={editForm.name} 
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})} 
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" 
                          required 
                        />
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1.5 block">Phone Number</label>
                        <input 
                          type="text" 
                          placeholder="Enter phone number" 
                          value={editForm.phone} 
                          onChange={(e) => setEditForm({...editForm, phone: e.target.value})} 
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" 
                          required 
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1.5 block">Age</label>
                          <input 
                            type="number" 
                            placeholder="Age" 
                            value={editForm.age} 
                            onChange={(e) => setEditForm({...editForm, age: e.target.value})} 
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1.5 block">Gender</label>
                          <select 
                            value={editForm.gender} 
                            onChange={(e) => setEditForm({...editForm, gender: e.target.value})} 
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                          >
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1.5 block">Vehicle Number</label>
                        <input 
                          type="text" 
                          placeholder="e.g. MP20 AB 1234" 
                          value={editForm.vehicleNumber} 
                          onChange={(e) => setEditForm({...editForm, vehicleNumber: e.target.value})} 
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" 
                        />
                      </div>
                    </div>
                    
                    <motion.button 
                      whileTap={{ scale: 0.98 }}
                      type="submit" 
                      disabled={savingProfile} 
                      className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black uppercase tracking-wider rounded-2xl text-sm shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-orange-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-full flex items-center justify-center gap-3 p-4 text-red-600 font-black text-sm bg-white/80 backdrop-blur-xl rounded-3xl border border-red-200/50 shadow-lg hover:bg-red-50 transition-all"
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
              <h3 className="font-black text-gray-900 text-sm uppercase">Offered Routes</h3>
              {offeredCommutes.length > 0 && (
                <button onClick={() => navigate('/offer')} className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-black uppercase rounded-lg hover:bg-black transition cursor-pointer shadow-md">
                  <PlusCircle size={14} /> Add New
                </button>
              )}
            </div>

            {offeredCommutes.length === 0 ? (
              <div className="bg-white p-10 rounded-3xl border border-gray-200 text-center shadow-sm">
                <Car size={40} className="mx-auto text-gray-300 mb-4" />
                <h3 className="font-black text-gray-900 text-sm mb-1">No Active Commutes</h3>
                <p className="text-xs text-gray-500 mb-6">You haven't offered any daily routes yet. Publish your route so peers can join.</p>
                <button onClick={() => navigate('/offer')} className="w-full py-3.5 bg-orange-500 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-orange-600 transition cursor-pointer shadow-md flex justify-center items-center gap-2">
                  <PlusCircle size={16} /> Offer A Commute
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {offeredCommutes.map((commute) => (
                  <div key={commute._id} className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
                      <div className="pr-2">
                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
                          Reach by {commute.reachTime}
                        </p>
                        <p className="text-sm font-extrabold text-gray-900 mt-1 truncate">
                          {commute.endPoint?.address || 'Destination'}
                        </p>
                        <p className="text-xs text-gray-500 font-semibold mt-0.5 truncate">
                          From: {commute.startPoint?.address || 'Pickup'}
                        </p>
                      </div>
                      <span className="shrink-0 bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded-md uppercase">
                        ACTIVE
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xs text-gray-600 font-bold bg-gray-50 px-2 py-1 rounded-md">
                        Days: {commute.days?.join(', ').toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-600 font-bold bg-gray-50 px-2 py-1 rounded-md">
                        Fare: ₹{commute.farePerKm}/km
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDeleteCommute(commute._id)} 
                      disabled={deletingId === commute._id}
                      className="w-full py-3 bg-red-50 text-red-600 rounded-xl text-xs font-black uppercase tracking-wider flex justify-center items-center gap-2 hover:bg-red-100 transition cursor-pointer disabled:opacity-50"
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

        {/* TAB 3: CHATS */}
        <AnimatePresence mode="wait">
          {activeTab === 'chats' && (
            <motion.div 
              key="chats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 shadow-lg overflow-hidden">
                
                <div className="px-5 py-4 bg-gradient-to-r from-orange-50 to-white border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-gray-900 text-base">Your Messages</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Recent conversations</p>
                    </div>
                    <div className="h-10 w-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                      <MessageSquare size={18} strokeWidth={2.5} />
                    </div>
                  </div>
                </div>

                {chatsLoading ? (
                  <div className="p-12 flex flex-col items-center justify-center">
                    <Loader2 size={32} className="animate-spin mb-3 text-orange-500" />
                    <p className="text-sm font-semibold text-gray-600">Loading chats...</p>
                  </div>
                ) : recentChats.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="h-16 w-16 rounded-full bg-gray-100 text-gray-300 flex items-center justify-center mx-auto mb-4">
                      <MessageSquare size={28} />
                    </div>
                    <h4 className="font-black text-gray-900 text-sm mb-1">No messages yet</h4>
                    <p className="text-xs text-gray-500">Start chatting with commuters</p>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mt-6 p-4 bg-orange-50 rounded-2xl border border-orange-100"
                    >
                      <p className="text-xs text-orange-800 font-semibold">
                        💡 <strong>Tip:</strong> Use the floating chat button at the bottom right to start conversations!
                      </p>
                    </motion.div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {recentChats.map((chat, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ backgroundColor: '#fff7ed' }}
                        onClick={() => setActiveChatPeerId(chat.peerId)}
                        className="flex items-center gap-4 p-4 cursor-pointer transition-colors group"
                      >
                        <div className="relative flex-shrink-0">
                          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                            {chat.name ? chat.name[0].toUpperCase() : "U"}
                          </div>
                          {chat.unread > 0 && (
                            <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-black border-2 border-white shadow-lg">
                              {chat.unread}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-black text-gray-900 truncate group-hover:text-orange-600 transition">
                              {chat.name}
                            </h4>
                            <span className="text-[10px] font-semibold text-gray-400">
                              {chat.time ? new Date(chat.time).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              }) : ''}
                            </span>
                          </div>
                          <p className={`text-xs truncate ${
                            chat.unread > 0 ? 'text-gray-900 font-bold' : 'text-gray-500'
                          }`}>
                            {chat.lastMessage}
                          </p>
                        </div>

                        <ChevronRight 
                          size={18} 
                          className="text-gray-300 group-hover:text-orange-500 transition flex-shrink-0" 
                          strokeWidth={2.5}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TAB 4: VERIFICATION */}
        {activeTab === 'verification' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
             <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-gray-900 text-sm uppercase">ID Verification</h3>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${userData?.kycVerified || userData?.isAadhaarVerified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {userData?.kycVerified || userData?.isAadhaarVerified ? 'VERIFIED ✓' : 'PENDING'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Submit your details to get the verified badge and increase trust among peers.</p>
             </div>
             
             {(!userData?.isAadhaarVerified || !userData?.isDlVerified) && (
                <form onSubmit={handleVerify} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                  {!userData?.isAadhaarVerified && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Govt ID Number</label>
                      <input type="text" placeholder="Enter ID number" value={aadhaarInput} onChange={(e) => setAadhaarInput(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-orange-500" />
                      <select value={verifyGender} onChange={(e) => setVerifyGender(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-orange-500">
                        <option value="">Select Gender on ID</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  )}

                  {!userData?.isDlVerified && (
                    <div className="space-y-3 mt-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Driving License (Optional)</label>
                      <input type="text" placeholder="Enter DL Number" value={dlInput} onChange={(e) => setDlInput(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                  )}

                  <button type="submit" disabled={verifying} className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-wider rounded-xl text-xs mt-2 disabled:bg-orange-300 transition cursor-pointer">
                    {verifying ? 'Verifying...' : 'Submit Verification'}
                  </button>
                </form>
             )}
          </motion.div>
        )}
        

      </main>
      {/* 🔥 FLOATING CHATBOT / MODAL 🔥 */}
      {activeChatPeerId && (
        <Chat 
          peerId={activeChatPeerId} 
          onClose={() => setActiveChatPeerId(null)} 
        />
      )}
    </div>
  );
};

export default Profile;