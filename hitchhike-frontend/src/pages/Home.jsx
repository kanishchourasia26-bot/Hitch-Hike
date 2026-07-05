import React, { useState, useEffect } from 'react';
import { ShieldCheck, Wallet, Plus, MapPinned, Bike, ChevronRight, Clock } from 'lucide-react';
import api from '../services/api_service';

const Home = () => {
  const [userData, setUserData] = useState({ name: 'User', trustScore: 0, walletBalance: 0 });
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch User Profile
        const userRes = await api.get('/users/me');
        setUserData({
          name: userRes.data.name,
          trustScore: userRes.data.reliabilityScore || 98,
          walletBalance: userRes.data.walletBalance
        });

        // 2. Fetch Active Ride (Assuming we build this route or use existing booking logic)
        // Agar koi ride active hai, wo yahan aa jayegi
        // const rideRes = await api.get('/bookings/active');
        // setActiveRide(rideRes.data);
        
      } catch (err) {
        console.error("Data fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen pb-24 bg-gray-50">
      <header className="flex items-center justify-between px-5 pt-8 pb-5">
        <div>
          <p className="text-xs font-medium text-gray-400">Welcome back</p>
          <h1 className="text-xl font-bold text-gray-900">Hello, {userData.name} 👋</h1>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5">
          <ShieldCheck size={14} className="text-emerald-600" strokeWidth={2.4} />
          <span className="text-xs font-bold text-emerald-700">{userData.trustScore}%</span>
        </div>
      </header>

      <main className="px-5 space-y-6">
        {/* Wallet Card */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Wallet size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Wallet Balance</p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">₹{userData.walletBalance}</p>
              </div>
            </div>
            <button className="flex items-center gap-1 rounded-full bg-indigo-600 pl-2.5 pr-3 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-200">
              <Plus size={14} strokeWidth={2.6} /> Add Money
            </button>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate('/book')} className="group flex flex-col items-start gap-3 rounded-2xl bg-blue-50 p-4 text-left shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm"><MapPinned size={20} /></div>
            <div><p className="text-sm font-bold text-gray-900">Book a Ride</p><p className="text-xs text-gray-500 mt-0.5">Find a rider nearby</p></div>
          </button>
          <button onClick={() => navigate('/offer')} className="group flex flex-col items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-left shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm"><Bike size={20} /></div>
            <div><p className="text-sm font-bold text-gray-900">Offer a Ride</p><p className="text-xs text-gray-500 mt-0.5">Earn on your commute</p></div>
          </button>
        </section>

        {/* Dynamic Upcoming Ride Section */}
        {activeRide && (
          <section>
            <h2 className="text-sm font-bold text-gray-900 mb-3">Your Upcoming Ride</h2>
            <div className="rounded-2xl bg-white p-4 shadow-sm border-l-4 border-indigo-600">
              <div className="flex items-center gap-1.5 text-indigo-600 mb-3"><Clock size={13} /> <span className="text-xs font-semibold">{activeRide.time}</span></div>
              <p className="text-sm font-semibold">{activeRide.from} to {activeRide.to}</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Home;