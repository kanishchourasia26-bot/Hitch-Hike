import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, Search, ShieldCheck, MessageSquare, Route } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 px-5 pt-8 font-sans">
      
      <motion.section 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="space-y-6"
      >
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              Hi, <span className="text-orange-500">{currentUser?.name?.split(' ')[0] || 'Rider'}</span> 👋
            </h1>
            <p className="text-sm text-gray-500 font-semibold mt-0.5">Ready for your commute?</p>
          </div>
          {/* User Avatar */}
          <div 
            onClick={() => navigate('/profile')}
            className="h-12 w-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-black text-lg border-2 border-white shadow-sm cursor-pointer hover:bg-orange-200 transition"
          >
            {currentUser?.name ? currentUser.name[0].toUpperCase() : "U"}
          </div>
        </div>

        {/* Hero Banner (Branding & Tagline) */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg shadow-orange-500/30 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl font-black italic tracking-tighter mb-1">HITCHHIKE</h2>
            <div className="bg-white/20 inline-block px-3 py-1 rounded-full backdrop-blur-sm mt-1">
              <p className="text-white font-bold tracking-widest uppercase text-[9px]">
                Split the ride • Hit the vibe
              </p>
            </div>
          </div>
          {/* Background Graphic */}
          <Car size={120} className="absolute -bottom-6 -right-6 text-orange-400 opacity-40 rotate-12" />
        </div>

        {/* Main Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <button 
            onClick={() => navigate('/search')} 
            className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 hover:shadow-md hover:border-blue-100 transition active:scale-95 cursor-pointer group"
          >
            <div className="h-14 w-14 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <Search size={24} />
            </div>
            <div className="text-center">
              <h3 className="font-black text-gray-900 text-sm">Find Ride</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-wider">Join A Commute</p>
            </div>
          </button>

          <button 
            onClick={() => navigate('/offer')} 
            className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 hover:shadow-md hover:border-orange-100 transition active:scale-95 cursor-pointer group"
          >
            <div className="h-14 w-14 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <Car size={24} />
            </div>
            <div className="text-center">
              <h3 className="font-black text-gray-900 text-sm">Offer Ride</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-wider">Share Empty Seats</p>
            </div>
          </button>
        </div>

        {/* 🔥 NEW: Features Explanation Section */}
        <div className="pt-2">
          <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest mb-4 px-1">Why Hitchhike?</h3>
          
          <div className="space-y-3">
            {/* Feature 1: Route Matching & Savings */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-start gap-4 hover:border-orange-200 transition">
              <div className="bg-orange-50 p-3 rounded-2xl text-orange-500 flex-shrink-0">
                <Route size={22} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Smart Route Matching</h4>
                <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                  Find peers traveling on your exact route. Split the travel costs daily and save your money.
                </p>
              </div>
            </div>

            {/* Feature 2: Real-time Chat */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-start gap-4 hover:border-blue-200 transition">
              <div className="bg-blue-50 p-3 rounded-2xl text-blue-500 flex-shrink-0">
                <MessageSquare size={22} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Real-Time In-App Chat</h4>
                <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                  Coordinate pickups instantly with our live chat. No need to share personal numbers anymore.
                </p>
              </div>
            </div>

            {/* Feature 3: Verified Users */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-start gap-4 hover:border-green-200 transition">
              <div className="bg-green-50 p-3 rounded-2xl text-green-500 flex-shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Verified Trust & Safety</h4>
                <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                  Travel with peace of mind. Our community consists of strictly Govt. ID verified professionals and students.
                </p>
              </div>
            </div>
          </div>
        </div>
        
      </motion.section>
    </div>
  );
};

export default Home;