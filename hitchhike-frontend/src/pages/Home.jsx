import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Car,
  Search,
  ShieldCheck,
  MessageSquare,
  Route,
  Sparkles,
  Users,
  TrendingDown,
  Shield,
} from 'lucide-react';
import AdventureImg from '../assets/adventure.png';

const Home = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [offeredCommutes, setOfferedCommutes] = useState([]);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      setUserData(user);
    }
  }, []);

  const firstName = currentUser?.name?.split(' ')[0] || 'Rider';

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 18,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: 'easeOut',
      },
    },
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans pb-24 overflow-hidden">

      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-1/4 -right-32 h-96 w-96 rounded-full bg-orange-100 blur-3xl" />
        <div className="absolute bottom-1/4 -left-32 h-96 w-96 rounded-full bg-orange-50 blur-3xl" />
      </div>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative max-w-7xl mx-auto px-6 pt-6"
      >

        {/* ================= HEADER ================= */}
        <motion.header
          variants={itemVariants}
          className="flex items-center justify-between mb-12"
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <Car size={24} strokeWidth={2.5} className="text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900">HITCHHIKE</h1>
          </div>

          {/* City Badge */}
          <div className="flex items-center gap-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
              A CITY-ORIENTED BIKE POOL
            </div>
            
            {/* Profile */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => navigate('/profile')}
              className="relative h-10 w-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-sm shadow-lg cursor-pointer"
            >
              {currentUser?.name ? currentUser.name[0].toUpperCase() : 'U'}
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white" />
            </motion.button>
          </div>
        </motion.header>


        {/* ================= MAIN CONTENT GRID ================= */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* LEFT SIDE - HERO TEXT */}
          <motion.div variants={itemVariants} className="space-y-8">
            
            {/* Cities Badge */}
            <div className="inline-flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              LIVE IN MUMBAI • PUNE • BENGALURU
            </div>

            {/* Main Heading */}
            <div className="space-y-2">
              <h2 className="text-7xl font-black tracking-tighter leading-[0.9] text-gray-900">
                SPLIT
              </h2>
              <h2 className="text-7xl font-black tracking-tighter leading-[0.9] text-gray-900">
                THE <span className="text-orange-500">RIDE.</span>
              </h2>
              <h2 className="text-7xl font-black tracking-tighter leading-[0.9] text-gray-300" style={{WebkitTextStroke: '2px #e5e7eb'}}>
                NOT THE
              </h2>
              <h2 className="text-7xl font-black tracking-tighter leading-[0.9] text-gray-300" style={{WebkitTextStroke: '2px #e5e7eb'}}>
                VIBE.
              </h2>
            </div>

            {/* Description */}
            <p className="text-gray-600 text-base leading-relaxed max-w-lg font-medium">
              Hitchhike is a hyper-local bike-pool for daily commutes. Verified pods, 
              women-only rides, spare helmet policy, and geofenced SOS — built for 
              two-wheeler cities.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-2">
                <Shield size={16} className="text-orange-500" />
                <span className="text-xs font-bold text-gray-700">Auto-SOS</span>
              </div>
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-2">
                <Users size={16} className="text-orange-500" />
                <span className="text-xs font-bold text-gray-700">Women-Only</span>
              </div>
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-2">
                <ShieldCheck size={16} className="text-orange-500" />
                <span className="text-xs font-bold text-gray-700">Verified Pods</span>
              </div>
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-2">
                <TrendingDown size={16} className="text-orange-500" />
                <span className="text-xs font-bold text-gray-700">₹2.5/km</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-4 pt-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/book')}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-4 px-8 rounded-2xl font-black uppercase tracking-wider text-sm shadow-2xl shadow-orange-500/30 cursor-pointer transition flex items-center justify-center gap-2"
              >
                <Search size={20} strokeWidth={2.5} />
                Find Ride
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/offer')}
                className="flex-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-900 py-4 px-8 rounded-2xl font-black uppercase tracking-wider text-sm cursor-pointer transition flex items-center justify-center gap-2"
              >
                <Car size={20} strokeWidth={2.5} />
                Offer Ride
              </motion.button>
            </div>
          </motion.div>

          {/* RIGHT SIDE - ADVENTURE IMAGE */}
          <motion.div 
            variants={itemVariants}
            className="relative"
          >
            {/* Main Image Card */}
            <div className="relative bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200 rounded-[40px] p-8 overflow-hidden shadow-2xl">
              
              {/* Adventure Image */}
              <div className="relative aspect-square flex items-center justify-center">
                <img 
                  src={AdventureImg} 
                  alt="Adventure Begins Outside the Comfort Zone" 
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Stats Overlay */}
              <div className="absolute bottom-8 left-8 right-8">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center border border-orange-100 shadow-lg">
                    <p className="text-2xl font-black text-orange-500">{offeredCommutes.length}</p>
                    <p className="text-[10px] text-gray-600 font-bold uppercase mt-1">Routes</p>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center border border-orange-100 shadow-lg">
                    <p className="text-2xl font-black text-orange-500">{userData?.reliabilityScore || 100}%</p>
                    <p className="text-[10px] text-gray-600 font-bold uppercase mt-1">Trust</p>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center border border-orange-100 shadow-lg">
                    <p className="text-2xl font-black text-orange-500">₹{userData?.walletBalance || 0}</p>
                    <p className="text-[10px] text-gray-600 font-bold uppercase mt-1">Wallet</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Badge */}
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-4 -right-4 bg-green-500 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-2xl border-2 border-white"
            >
              ✓ Verified Rider
            </motion.div>
          </motion.div>

        </div>


        {/* ================= BOTTOM FEATURES ================= */}
        <motion.div 
          variants={itemVariants}
          className="mt-20 grid md:grid-cols-3 gap-6"
        >
          {/* Feature 1 */}
          <div className="bg-white border-2 border-orange-100 rounded-3xl p-6 hover:border-orange-300 hover:shadow-lg transition group">
            <div className="h-12 w-12 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-orange-200 transition">
              <Route size={24} className="text-orange-500" strokeWidth={2} />
            </div>
            <h4 className="text-gray-900 font-black text-lg mb-2">Smart Matching</h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              AI finds commuters on overlapping routes automatically
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white border-2 border-orange-100 rounded-3xl p-6 hover:border-orange-300 hover:shadow-lg transition group">
            <div className="h-12 w-12 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-orange-200 transition">
              <MessageSquare size={24} className="text-orange-500" strokeWidth={2} />
            </div>
            <h4 className="text-gray-900 font-black text-lg mb-2">In-App Chat</h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              Negotiate fares and coordinate via secure messaging
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white border-2 border-orange-100 rounded-3xl p-6 hover:border-orange-300 hover:shadow-lg transition group">
            <div className="h-12 w-12 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-orange-200 transition">
              <ShieldCheck size={24} className="text-orange-500" strokeWidth={2} />
            </div>
            <h4 className="text-gray-900 font-black text-lg mb-2">Verified Trust</h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              Connect with verified members for safer commutes
            </p>
          </div>
        </motion.div>

      </motion.main>
    </div>
  );
};

export default Home;
