import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Car,
  Search,
  ShieldCheck,
  MessageSquare,
  Route,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  Users,
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');

    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
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
    <div className="min-h-screen bg-[#f7f7f5] text-gray-900 font-sans pb-24">

      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-orange-200/20 blur-3xl" />
        <div className="absolute top-[45%] -left-40 h-80 w-80 rounded-full bg-gray-300/20 blur-3xl" />
      </div>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative max-w-xl mx-auto px-5 pt-7"
      >

        {/* ================= HEADER ================= */}
        <motion.header
          variants={itemVariants}
          className="flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
                Welcome back
              </p>

              <Sparkles
                size={13}
                className="text-orange-500"
              />
            </div>

            <h1 className="text-[27px] leading-tight font-black tracking-tight">
              Hey,{' '}
              <span className="text-orange-500">
                {firstName}
              </span>
            </h1>

            <p className="text-sm text-gray-500 mt-1 font-medium">
              Where are you heading today?
            </p>
          </div>

          {/* Profile */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.04 }}
            onClick={() => navigate('/profile')}
            className="relative h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center font-black text-lg shadow-lg shadow-black/10 cursor-pointer"
          >
            {currentUser?.name
              ? currentUser.name[0].toUpperCase()
              : 'U'}

            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-[#f7f7f5]" />
          </motion.button>
        </motion.header>


        {/* ================= HERO ================= */}
        <motion.section
          variants={itemVariants}
          className="mt-7"
        >
          <div className="relative overflow-hidden rounded-[30px] bg-black min-h-[225px] p-7 shadow-2xl shadow-black/15">

            {/* Decorative circles */}
            <div className="absolute -right-16 -top-20 h-60 w-60 rounded-full border-[35px] border-orange-500/20" />
            <div className="absolute -right-4 -bottom-24 h-48 w-48 rounded-full bg-orange-500/10" />

            {/* Car icon */}
            <motion.div
              animate={{
                x: [0, 5, 0],
                rotate: [0, 1, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute right-4 bottom-4 text-orange-500/90"
            >
              <Car size={125} strokeWidth={1.2} />
            </motion.div>

            <div className="relative z-10 max-w-[75%]">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-md px-3 py-1.5 mb-5">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-300">
                  Ride together
                </span>
              </div>

              <h2 className="text-[42px] leading-[0.9] font-black tracking-[-0.06em] text-white">
                HITCH
                <span className="text-orange-500">HIKE</span>
              </h2>

              <p className="mt-4 text-sm leading-relaxed text-gray-400 font-medium max-w-[230px]">
                Share your journey.
                <br />
                Split the cost. Meet your people.
              </p>
            </div>

            {/* Bottom label */}
            <div className="absolute bottom-6 left-7 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                Smart • Social • Simple
              </span>
            </div>
          </div>
        </motion.section>


        {/* ================= ACTIONS ================= */}
        <motion.section
          variants={itemVariants}
          className="mt-5"
        >
          <div className="grid grid-cols-2 gap-3">

            {/* Find Ride */}
            <motion.button
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/search')}
              className="group relative overflow-hidden bg-white rounded-[26px] p-5 text-left border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-900 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                  <Search size={22} strokeWidth={2.5} />
                </div>

                <ArrowUpRight
                  size={19}
                  className="text-gray-300 group-hover:text-blue-500 transition-colors"
                />
              </div>

              <div className="mt-7">
                <h3 className="font-black text-[16px]">
                  Find a ride
                </h3>

                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mt-1">
                  Join a commute
                </p>
              </div>
            </motion.button>


            {/* Offer Ride */}
            <motion.button
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/offer')}
              className="group relative overflow-hidden bg-orange-500 rounded-[26px] p-5 text-left shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/25 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center text-white group-hover:bg-white group-hover:text-orange-500 transition-all duration-300">
                  <Car size={22} strokeWidth={2.5} />
                </div>

                <ArrowUpRight
                  size={19}
                  className="text-orange-200 group-hover:text-white transition-colors"
                />
              </div>

              <div className="mt-7">
                <h3 className="font-black text-[16px] text-white">
                  Offer a ride
                </h3>

                <p className="text-[10px] uppercase tracking-wider text-orange-100 font-bold mt-1">
                  Share empty seats
                </p>
              </div>
            </motion.button>

          </div>
        </motion.section>


        {/* ================= QUICK STATS ================= */}
        <motion.section
          variants={itemVariants}
          className="mt-4"
        >
          <div className="bg-white rounded-[22px] border border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <Users size={17} />
              </div>

              <div>
                <p className="text-[11px] font-black text-gray-900">
                  Ride together
                </p>
                <p className="text-[9px] text-gray-400 font-semibold">
                  Save money & meet people
                </p>
              </div>
            </div>

            <ChevronRight
              size={17}
              className="text-gray-300"
            />
          </div>
        </motion.section>


        {/* ================= WHY HITCHHIKE ================= */}
        <motion.section
          variants={itemVariants}
          className="mt-8"
        >
          <div className="flex items-end justify-between mb-4 px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
                Built for commuters
              </p>

              <h3 className="text-xl font-black tracking-tight mt-1">
                Why Hitchhike?
              </h3>
            </div>

            <span className="text-[10px] font-bold text-gray-400">
              03 FEATURES
            </span>
          </div>


          <div className="space-y-3">

            {/* Feature 1 */}
            <motion.div
              whileHover={{ x: 3 }}
              className="group bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex gap-4">

                <div className="h-12 w-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <Route size={21} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm">
                      Smart route matching
                    </h4>

                    <ArrowUpRight
                      size={15}
                      className="text-gray-300 group-hover:text-orange-500 transition-colors"
                    />
                  </div>

                  <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1.5 pr-2">
                    Find people travelling your way and split
                    the cost of your daily commute.
                  </p>
                </div>

              </div>
            </motion.div>


            {/* Feature 2 */}
            <motion.div
              whileHover={{ x: 3 }}
              className="group bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex gap-4">

                <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <MessageSquare size={21} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm">
                      In-app chat
                    </h4>

                    <ArrowUpRight
                      size={15}
                      className="text-gray-300 group-hover:text-blue-500 transition-colors"
                    />
                  </div>

                  <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1.5 pr-2">
                    Coordinate pickups and drop-offs instantly
                    without sharing your personal number.
                  </p>
                </div>

              </div>
            </motion.div>


            {/* Feature 3 */}
            <motion.div
              whileHover={{ x: 3 }}
              className="group bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex gap-4">

                <div className="h-12 w-12 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500 group-hover:text-white transition-colors">
                  <ShieldCheck size={21} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm">
                      Trust & safety
                    </h4>

                    <ArrowUpRight
                      size={15}
                      className="text-gray-300 group-hover:text-green-500 transition-colors"
                    />
                  </div>

                  <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1.5 pr-2">
                    Connect with verified members and travel
                    with greater peace of mind.
                  </p>
                </div>

              </div>
            </motion.div>

          </div>
        </motion.section>


        {/* ================= BOTTOM CTA ================= */}
        <motion.section
          variants={itemVariants}
          className="mt-7"
        >
          <div className="relative overflow-hidden rounded-[25px] bg-gray-900 p-5">

            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-orange-500/10" />

            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-orange-500">
                  Your next journey
                </p>

                <h4 className="text-white font-black text-lg mt-1">
                  Ready to hit the road?
                </h4>
              </div>

              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate('/search')}
                className="h-11 w-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 cursor-pointer"
              >
                <ArrowUpRight size={21} />
              </motion.button>
            </div>

          </div>
        </motion.section>

      </motion.main>
    </div>
  );
};

export default Home;