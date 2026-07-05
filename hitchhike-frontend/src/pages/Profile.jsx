import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Clock, MapPin, LifeBuoy, ShieldAlert, LogOut, History, CheckCircle } from 'lucide-react';
import api from '../services/api_service';

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false); // History toggle karne ke liye

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/me');
        setUserData(res.data);
      } catch (error) {
        setUserData({
          name: 'Rahul Sharma',
          phone: '+91 9876543210',
          reliabilityScore: 98,
          isAadhaarVerified: true,
          isDLVerified: true,
          walletBalance: 450
        });
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

    fetchProfile();
    fetchHistory();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user'); 
    localStorage.removeItem('token'); 
    navigate('/login'); 
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading Profile...</div>;
  if (!userData) return <div className="min-h-screen bg-gray-50"></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white pt-10 pb-6 px-5 rounded-b-3xl shadow-sm mb-4 flex flex-col items-center text-center">
        <div className="h-20 w-20 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-3xl font-bold mb-3 shadow-sm">{userData.name[0].toUpperCase()}</div>
        <h1 className="text-xl font-bold text-gray-900">{userData.name}</h1>
        <p className="text-sm text-gray-500 mt-1 font-medium">{userData.phone}</p>
      </div>

      <div className="px-5 space-y-4">
        {/* Trust Score */}
        <div className="bg-white p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-emerald-500" size={24} />
              <span className="font-bold text-gray-800">Trust Score</span>
            </div>
            <span className="text-lg font-extrabold text-emerald-600">{userData.reliabilityScore}%</span>
          </div>
          <div className="space-y-2 text-sm font-semibold text-gray-700">
            <div className="flex items-center gap-2">
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${userData.isAadhaarVerified ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100'}`}>✓</span>
              [Aadhaar Redacted] Verified
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${userData.isDLVerified ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100'}`}>✓</span>
              Driving License Verified
            </div>
          </div>
        </div>

        {/* Menu Options */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center gap-3 p-4 border-b border-gray-50 active:bg-gray-50">
            <History size={20} className="text-gray-400" />
            <span className="font-semibold text-gray-700 text-sm">Ride History</span>
          </button>
          
          {/* History Dropdown */}
          {showHistory && (
            <div className="bg-gray-50 p-3">
              {history.length > 0 ? history.map(ride => (
                <div key={ride._id} className="bg-white p-3 rounded-lg mb-2 flex justify-between items-center shadow-sm border">
                  <div>
                    <p className="text-xs font-bold">{ride.endPoint.address}</p>
                    <p className="text-[10px] text-gray-500">{new Date(ride.startTime).toLocaleDateString()}</p>
                  </div>
                  <CheckCircle size={16} className="text-emerald-500" />
                </div>
              )) : <p className="text-xs text-gray-500 italic p-2">No completed rides.</p>}
            </div>
          )}

          <button className="w-full flex items-center gap-3 p-4 border-b border-gray-50 active:bg-gray-50">
            <MapPin size={20} className="text-gray-400" />
            <span className="font-semibold text-gray-700 text-sm">Saved Places</span>
          </button>
          <button className="w-full flex items-center gap-3 p-4 active:bg-gray-50">
            <ShieldAlert size={20} className="text-red-400" />
            <span className="font-semibold text-red-500 text-sm">SOS Settings</span>
          </button>
        </div>

        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-4 text-gray-500 font-bold text-sm bg-white rounded-xl shadow-sm">
          <LogOut size={18} /> LOGOUT
        </button>
      </div>
    </div>
  );
};

export default Profile;