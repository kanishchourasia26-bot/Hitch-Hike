import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { 
  ShieldCheck, MapPin, ShieldAlert, LogOut, History, 
  CheckCircle, User, Car, MessageSquare, Calendar, Trash2, AlertCircle, Loader2, Wallet, Edit3, Save, X, PlusCircle, ChevronRight
} from 'lucide-react';
import api from '../services/api_service';
import Chat from './Chat'; // 🔥 YEH WALI LINE ADD KARNI HAI 🔥
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-orange-500 font-bold">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* HEADER BANNER */}
      <div className="bg-orange-600 text-white pt-8 pb-12 px-5 rounded-b-[40px] shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center text-xl font-black border border-orange-400 shadow-inner">
              {userData?.name ? userData.name[0].toUpperCase() : "U"}
            </div>
            <div>
              <h1 className="text-lg font-black">{userData?.name}</h1>
              <p className="text-orange-100 text-xs mt-0.5">{userData?.phone || userData?.email}</p>
            </div>
          </div>
          
          <div className="bg-orange-500 border border-orange-400 px-3.5 py-2 rounded-2xl flex items-center gap-2 shadow-inner">
            <Wallet size={16} />
            <div>
              <p className="text-[9px] text-orange-200 uppercase font-black">Wallet</p>
              <p className="text-xs font-black">₹{userData?.walletBalance || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 -mt-6 space-y-4">
        
        {/* TABS NAVIGATION */}
        <div className="bg-white p-2 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-1 overflow-x-auto scrollbar-none">
          <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${activeTab === 'profile' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <User size={15} /> <span>Profile</span>
          </button>
          <button onClick={() => setActiveTab('commutes')} className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${activeTab === 'commutes' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Car size={15} /> <span>Commutes</span>
          </button>
          <button onClick={() => setActiveTab('chats')} className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${activeTab === 'chats' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <MessageSquare size={15} /> <span>Chats</span>
          </button>
          <button onClick={() => setActiveTab('verification')} className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${activeTab === 'verification' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <ShieldCheck size={15} /> <span>Verification</span>
          </button>
        </div>

        {/* TAB 1: PROFILE & EDIT */}
        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
              {!isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <h3 className="font-black text-gray-900 text-sm uppercase">Personal Info</h3>
                    <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 text-orange-600 text-xs font-bold bg-orange-50 px-3 py-1.5 rounded-xl hover:bg-orange-100 cursor-pointer">
                      <Edit3 size={14} /> Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Age</p>
                      <p className="text-sm font-extrabold text-gray-900">{userData?.age ? `${userData.age} yrs` : 'Not Set'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Gender</p>
                      <p className="text-sm font-extrabold text-gray-900 capitalize">{userData?.gender || 'Not Set'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Vehicle Number</p>
                      <p className="text-sm font-extrabold text-gray-900">{userData?.vehicleNumber || 'Not Added'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <h3 className="font-black text-gray-900 text-sm uppercase">Edit Profile</h3>
                    <button type="button" onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-red-500 cursor-pointer">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input type="text" placeholder="Full Name" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-orange-500" required />
                    <input type="text" placeholder="Mobile Number" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-orange-500" required />
                    <div className="flex gap-3">
                      <input type="number" placeholder="Age" value={editForm.age} onChange={(e) => setEditForm({...editForm, age: e.target.value})} className="w-1/3 bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-orange-500" />
                      <select value={editForm.gender} onChange={(e) => setEditForm({...editForm, gender: e.target.value})} className="w-2/3 bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-orange-500">
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <input type="text" placeholder="Vehicle Number (e.g. MP20 AB 1234)" value={editForm.vehicleNumber} onChange={(e) => setEditForm({...editForm, vehicleNumber: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <button type="submit" disabled={savingProfile} className="w-full py-3 bg-orange-500 text-white font-black uppercase text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-orange-600 cursor-pointer disabled:opacity-50">
                    {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
                  </button>
                </form>
              )}
            </div>

            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-4 text-red-500 font-bold text-xs bg-white rounded-3xl border border-gray-200 shadow-sm hover:bg-red-50 transition-colors cursor-pointer">
              <LogOut size={16} /> LOGOUT
            </button>
          </motion.div>
        )}

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

        {/* TAB 3: CHATS (Now with Loading Spinner and Real Data) */}
        {activeTab === 'chats' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-2">
              
              <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-black text-gray-900 text-sm uppercase">Recent Messages</h3>
              </div>

              {chatsLoading ? (
                <div className="p-8 flex flex-col items-center justify-center text-gray-400">
                  <Loader2 size={30} className="animate-spin mb-2 text-orange-500" />
                  <p className="text-xs font-semibold">Loading your chats...</p>
                </div>
              ) : recentChats.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <MessageSquare size={30} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold">No messages yet</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {recentChats.map((chat, idx) => (
                    <div 
                      key={idx} 
                    onClick={() => setActiveChatPeerId(chat.peerId)}
                      className="flex items-center gap-3 p-3 hover:bg-orange-50 cursor-pointer transition border-b last:border-0 border-gray-50 rounded-xl"
                    >
                      <div className="h-12 w-12 rounded-full bg-orange-100 text-orange-600 flex justify-center items-center font-black flex-shrink-0">
                        {chat.name ? chat.name[0].toUpperCase() : "U"}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center mb-0.5">
                          <h4 className="text-sm font-bold text-gray-900 truncate">{chat.name}</h4>
                          <span className="text-[10px] font-semibold text-gray-400">
                            {/* NEW: Sahi Date Formatting */}
                            {chat.time ? new Date(chat.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className={`text-xs truncate ${chat.unread > 0 ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                          {chat.lastMessage}
                        </p>
                      </div>
                      {chat.unread > 0 ? (
                        <div className="h-5 w-5 bg-orange-500 rounded-full flex justify-center items-center text-[10px] text-white font-black flex-shrink-0">
                          {chat.unread}
                        </div>
                      ) : (
                        <ChevronRight size={16} className="text-gray-300" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

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