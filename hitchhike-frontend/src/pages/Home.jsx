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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50/20 text-slate-900 font-sans pb-24 overflow-hidden">

      {/* Refined background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-1/4 -right-32 h-96 w-96 rounded-full bg-gradient-to-b from-purple-200 to-orange-200 blur-3xl" />
        <div className="absolute bottom-1/4 -left-32 h-96 w-96 rounded-full bg-gradient-to-t from-purple-200 to-pink-200 blur-3xl" />
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
            <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Car size={24} strokeWidth={2.5} className="text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">HITCHHIKE</h1>
          </div>

          {/* City Badge */}
          <div className="flex items-center gap-4">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              A CITY-ORIENTED BIKE POOL
            </div>
            
            {/* Profile */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => navigate('/profile')}
              className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-orange-500 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-purple-500/30 cursor-pointer hover:shadow-xl transition-all duration-300"
            >
              {currentUser?.name ? currentUser.name[0].toUpperCase() : 'U'}
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
            </motion.button>
          </div>
        </motion.header>


        {/* ================= MAIN CONTENT GRID ================= */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* LEFT SIDE - HERO TEXT */}
          <motion.div variants={itemVariants} className="space-y-8">
            
           
            {/* Main Heading */}
            <div className="space-y-2">
              <h2 className="text-7xl font-black tracking-tighter leading-[0.9] text-slate-900">
                SPLIT
              </h2>
              <h2 className="text-7xl font-black tracking-tighter leading-[0.9] bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 bg-clip-text text-transparent">
                THE RIDE.
              </h2>
              <h2 className="text-7xl font-black tracking-tighter leading-[0.9] text-slate-300" style={{WebkitTextStroke: '2px #cbd5e1'}}>
                NOT THE
              </h2>
              <h2 className="text-7xl font-black tracking-tighter leading-[0.9] text-slate-300" style={{WebkitTextStroke: '2px #cbd5e1'}}>
                VIBE.
              </h2>
            </div>

            {/* Description */}
          

          
            {/* CTA Buttons - Enhanced */}
            <div className="flex gap-4 pt-4">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(249, 115, 22, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/book')}
                className="flex-1 bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 text-white py-4 px-8 rounded-2xl font-black uppercase tracking-wider text-sm shadow-xl shadow-purple-500/30 cursor-pointer transition flex items-center justify-center gap-2 border border-purple-400/20"
              >
                <Search size={20} strokeWidth={2.5} />
                Find Ride
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(14, 165, 233, 0.2)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/offer')}
                className="flex-1 bg-gradient-to-r from-cyan-50 to-teal-50 hover:from-cyan-100 hover:to-teal-100 border-2 border-teal-300 text-slate-900 py-4 px-8 rounded-2xl font-black uppercase tracking-wider text-sm cursor-pointer transition flex items-center justify-center gap-2"
              >
                <Car size={20} strokeWidth={2.5} />
                Offer Ride
              </motion.button>
            </div>
          </motion.div>

          {/* RIGHT SIDE - ADVENTURE IMAGE */}
          <motion.div 
            variants={itemVariants}
            className="relative -mt-24"
          >
            {/* Adventure Image - No Box */}
            <div className="relative">
              <img 
                src={AdventureImg} 
                alt="Adventure Begins Outside the Comfort Zone" 
                className="w-full h-auto object-contain drop-shadow-2xl"
              />
            </div>

            {/* Stats Overlay - Enhanced */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4">
              <div className="grid grid-cols-3 gap-3">
             
                
              
                
             
              </div>
            </div>

            {/* Floating Badge */}
        
          </motion.div>

        </div>


        {/* ================= BOTTOM FEATURES ================= */}
        <motion.div 
          variants={itemVariants}
          className="mt-20 grid md:grid-cols-3 gap-6"
        >
          {/* Feature 1 - Routes */}
          <motion.div 
            whileHover={{ translateY: -8, boxShadow: '0 20px 40px rgba(20, 184, 166, 0.2)' }}
            className="bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200/60 rounded-3xl p-6 hover:border-teal-300/50 transition-all group"
          >
            <div className="h-12 w-12 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl flex items-center justify-center mb-4 group-hover:from-teal-200 group-hover:to-cyan-200 transition">
              <Route size={24} className="text-teal-600" strokeWidth={2} />
            </div>
            <h4 className="text-slate-900 font-black text-lg mb-2">Smart Matching</h4>
            <p className="text-slate-600 text-sm leading-relaxed">
              AI finds commuters on overlapping routes automatically
            </p>
          </motion.div>

          {/* Feature 2 - Chat */}
          <motion.div 
            whileHover={{ translateY: -8, boxShadow: '0 20px 40px rgba(139, 92, 246, 0.2)' }}
            className="bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200/60 rounded-3xl p-6 hover:border-violet-300/50 transition-all group"
          >
            <div className="h-12 w-12 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4 group-hover:from-violet-200 group-hover:to-purple-200 transition">
              <MessageSquare size={24} className="text-violet-600" strokeWidth={2} />
            </div>
            <h4 className="text-slate-900 font-black text-lg mb-2">In-App Chat</h4>
            <p className="text-slate-600 text-sm leading-relaxed">
              Negotiate fares and coordinate via secure messaging
            </p>
          </motion.div>

          {/* Feature 3 - Verification */}
          <motion.div 
            whileHover={{ translateY: -8, boxShadow: '0 20px 40px rgba(16, 185, 129, 0.2)' }}
            className="bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200/60 rounded-3xl p-6 hover:border-emerald-300/50 transition-all group"
          >
            <div className="h-12 w-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mb-4 group-hover:from-emerald-200 group-hover:to-teal-200 transition">
              <ShieldCheck size={24} className="text-emerald-600" strokeWidth={2} />
            </div>
            <h4 className="text-slate-900 font-black text-lg mb-2">Verified Trust</h4>
            <p className="text-slate-600 text-sm leading-relaxed">
              Connect with verified members for safer commutes
            </p>
          </motion.div>
        </motion.div>

      </motion.main>
    </div>
  );
};

export default Home;