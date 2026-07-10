import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Clock, MapPin, LifeBuoy, ShieldAlert, LogOut, History, CheckCircle } from 'lucide-react';
import api from '../services/api_service';

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // NAYE STATES: Verification ke liye
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [gender, setGender] = useState('');
  const [dlInput, setDlInput] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchHistory();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/me');
      setUserData(res.data);
    } catch (error) {
      console.error("Error fetching profile", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/rides/my-rides');
      const allRides = [...res.data.offeredRides, ...res.data.bookedRides];
      setHistory(allRides.filter(r => r.status === 'completed'));
    } catch (err) {
      console.error("Error fetching history");
    }
  };

  // NAYA FUNCTION: Verify submit karne ke liye
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!aadhaarInput && !dlInput) return alert("Please enter at least one Document Number!");
    if (aadhaarInput && !gender) return alert("Please select your gender for Aadhaar verification!");

    setVerifying(true);
    try {
      const response = await api.post('/users/verify', {
        aadhaarNumber: aadhaarInput,
        dlNumber: dlInput,
        gender: gender
      });
      
      alert("Verification Successful! 🎉");
      setUserData(response.data.user); // UI update ho jayega bina refresh kiye
      
      // Inputs clear kar do
      setAadhaarInput('');
      setGender('');
      setDlInput('');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user'); 
    localStorage.removeItem('token'); 
    navigate('/login'); 
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 font-bold text-orange-500">Loading Profile...</div>;
  if (!userData) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Failed to load profile data.</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white pt-10 pb-6 px-5 rounded-b-3xl shadow-sm mb-4 flex flex-col items-center text-center relative">
        <div className="h-20 w-20 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-3xl font-bold mb-3 shadow-sm">
          {userData.name[0].toUpperCase()}
        </div>
        <h1 className="text-xl font-bold text-gray-900">{userData.name}</h1>
        <p className="text-sm text-gray-500 mt-1 font-medium">{userData.phone || userData.email}</p>
        
        {/* NAYA LOGIC: Women Only Badge */}
        {userData.gender === 'female' && (
          <span className="mt-3 bg-pink-100 text-pink-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            WOMEN ONLY RIDES ENABLED
          </span>
        )}
      </div>

      <div className="px-5 space-y-4">
        {/* Trust Score */}
        <div className="bg-white p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-emerald-500" size={24} />
              <span className="font-bold text-gray-800">Trust Score</span>
            </div>
            {/* Assuming reliabilityScore comes from DB, defaulting to 50 if not there */}
            <span className="text-lg font-extrabold text-emerald-600">{userData.reliabilityScore || 50}%</span>
          </div>
          <div className="space-y-2 text-sm font-semibold text-gray-700">
            <div className="flex items-center gap-2">
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${userData.isAadhaarVerified ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                {userData.isAadhaarVerified ? '✓' : '!'}
              </span>
              Aadhaar Verified
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${userData.isDlVerified ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                {userData.isDlVerified ? '✓' : '!'}
              </span>
              Driving License Verified
            </div>
          </div>
        </div>

        {/* NAYA LOGIC: Verification Form (Tabhi dikhega jab verification pending ho) */}
        {(!userData.isAadhaarVerified || !userData.isDlVerified) && (
          <form onSubmit={handleVerify} className="bg-white p-5 rounded-2xl shadow-sm border border-orange-100">
            <h3 className="font-bold text-gray-800 mb-4">Complete Verification</h3>
            
            {!userData.isAadhaarVerified && (
              <div className="space-y-3 mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase">Aadhaar Number</label>
                <input 
                  type="text" 
                  placeholder="Enter 12-digit number" 
                  value={aadhaarInput}
                  onChange={(e) => setAadhaarInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <select 
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}

            {!userData.isDlVerified && (
              <div className="space-y-3 mb-6">
                <label className="text-xs font-bold text-gray-500 uppercase">Driving License (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Enter DL Number" 
                  value={dlInput}
                  onChange={(e) => setDlInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            )}

            <button 
              type="submit" 
              disabled={verifying}
              className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl text-sm shadow-md disabled:bg-orange-300 transition-all"
            >
              {verifying ? 'VERIFYING...' : 'VERIFY NOW'}
            </button>
          </form>
        )}

        {/* Menu Options */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center gap-3 p-4 border-b border-gray-50 active:bg-gray-50 transition-colors">
            <History size={20} className="text-gray-400" />
            <span className="font-semibold text-gray-700 text-sm">Ride History</span>
          </button>
          
          {/* History Dropdown */}
          {showHistory && (
            <div className="bg-gray-50 p-3">
              {history.length > 0 ? history.map(ride => (
                <div key={ride._id} className="bg-white p-3 rounded-lg mb-2 flex justify-between items-center shadow-sm border border-gray-100">
                  <div className="overflow-hidden pr-2">
                    <p className="text-xs font-bold text-gray-800 truncate">{ride.endPoint?.address || 'Destination'}</p>
                    <p className="text-[10px] text-gray-500">{new Date(ride.startTime).toLocaleDateString()}</p>
                  </div>
                  <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                </div>
              )) : <p className="text-xs text-gray-500 italic p-2 text-center">No completed rides.</p>}
            </div>
          )}

          <button className="w-full flex items-center gap-3 p-4 border-b border-gray-50 active:bg-gray-50 transition-colors">
            <MapPin size={20} className="text-gray-400" />
            <span className="font-semibold text-gray-700 text-sm">Saved Places</span>
          </button>
          <button className="w-full flex items-center gap-3 p-4 active:bg-gray-50 transition-colors">
            <ShieldAlert size={20} className="text-red-400" />
            <span className="font-semibold text-red-500 text-sm">SOS Settings</span>
          </button>
        </div>

        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-4 text-gray-500 font-bold text-sm bg-white rounded-xl shadow-sm hover:bg-gray-50 transition-colors">
          <LogOut size={18} /> LOGOUT
        </button>
      </div>
    </div>
  );
};

export default Profile;