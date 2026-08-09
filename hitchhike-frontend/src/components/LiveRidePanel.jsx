import React, { useState } from 'react';
// NAYA: 'Star' icon ko lucide-react se import kiya
import { Maximize2, Minimize2, Navigation, XCircle, Clock, MapPin, Star } from 'lucide-react';
import api from '../services/api_service';
import MapComponent from './MapComponent';

const calculateETA = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return "10 mins";
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const mins = Math.round(R * c * 2); 
  return `${mins > 0 ? mins : 1} mins`;
};

const LiveRidePanel = ({ ride, currentUser, onClose }) => {
  const [liveStatus, setLiveStatus] = useState(ride?.status);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rideStartedAt, setRideStartedAt] = useState(null);
  
  const [otp, setOtp] = useState(new Array(4).fill(""));
  
  // NAYA LOGIC: Rating aur Review ke liye state
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  const isDriver = currentUser._id === ride?.publisher?._id || currentUser._id === ride?.publisher;
  const isPassenger = currentUser._id === ride?.passenger?._id || currentUser._id === ride?.passenger;

  const pickupPoint = ride?.startPoint?.coordinates ? { lat: ride.startPoint.coordinates[1], lng: ride.startPoint.coordinates[0] } : null;
  const dropPoint = ride?.endPoint?.coordinates ? { lat: ride.endPoint.coordinates[1], lng: ride.endPoint.coordinates[0] } : null;
  
  const estimatedTime = calculateETA(pickupPoint?.lat, pickupPoint?.lng, dropPoint?.lat, dropPoint?.lng);
  const scheduledTime = new Date(ride?.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleChangeOTP = (element, index) => {
    if (isNaN(element.value)) return false;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    if (element.nextSibling && element.value !== "") {
      element.nextSibling.focus();
    }
  };

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      await api.put(`/rides/${ride._id}/status`, { status: newStatus });
      setLiveStatus(newStatus);
      if (newStatus === 'heading_to_pickup') setRideStartedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      if (newStatus === 'cancelled') onClose && onClose();
    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const enteredOtp = otp.join("");
    if(enteredOtp.length !== 4) return alert("Please enter all 4 digits");
    setLoading(true);
    try {
      await api.post(`/rides/${ride._id}/verify-otp`, { otp: enteredOtp });
      setLiveStatus('active'); 
    } catch (error) {
      alert(error.response?.data?.message || "Invalid OTP! Please check with the passenger.");
    } finally {
      setLoading(false);
    }
  };

  // NAYA LOGIC: Rating submit karne ka function
  const handleSubmitRating = async () => {
    if(rating === 0) return alert("Please give at least 1 star!");
    setLoading(true);
    try {
      await api.post(`/rides/${ride._id}/rate`, { rating, review });
      alert("Thank you for your feedback! 🌟");
      onClose && onClose(); // Panel band kar do rating dene ke baad
    } catch (error) {
      alert(error.response?.data?.message || "Failed to submit rating.");
    } finally {
      setLoading(false);
    }
  };

  if (!ride) return null;

  return (
    <div className="w-full bg-white shadow-lg rounded-2xl border border-gray-200 overflow-hidden flex flex-col mb-6 transition-all duration-300">
      
      {/* 🗺️ MAP SECTION */}
      <div className={`relative w-full bg-gray-100 transition-all duration-500 ${isMapExpanded ? 'h-96' : 'h-48'}`}>
        <MapComponent pickup={pickupPoint} drop={dropPoint} />
        <button onClick={() => setIsMapExpanded(!isMapExpanded)} className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md text-gray-700">
          {isMapExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm text-xs font-extrabold text-gray-800 border border-gray-200 z-[1000]">
          Status: <span className="text-orange-500 uppercase">{liveStatus.replace(/_/g, ' ')}</span>
        </div>
      </div>

      {/* ℹ️ INFO & ACTIONS SECTION */}
      <div className="p-5 space-y-4">
        
        {/* PASSENGER VIEW RIDER DETAILS */}
        {isPassenger && liveStatus !== 'completed' && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
            <div>
               <p className="text-xs text-gray-500 font-semibold">Rider Name</p>
               <p className="font-bold text-gray-900">{ride?.publisher?.name || 'Rider'}</p>
            </div>
            <div className="text-right">
               <p className="text-xs text-gray-500 font-semibold">Contact</p>
               <p className="font-bold text-blue-600">{ride?.publisher?.phone || 'Not Available'}</p>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* DRIVER VIEWS                               */}
        {/* ========================================== */}
        {isDriver && (
          <>
            {/* BOOKED, HEADING TO PICKUP, ARRIVED (Purana Code Same Rahega) */}
            {liveStatus === 'booked' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex gap-3">
                  <button onClick={() => handleStatusChange('heading_to_pickup')} className="flex-1 bg-black text-white py-3 rounded-xl font-bold flex justify-center gap-2"><Navigation size={18} /> Start Now</button>
                  <button onClick={() => handleStatusChange('cancelled')} className="flex-1 bg-red-100 text-red-600 py-3 rounded-xl font-bold flex justify-center gap-2"><XCircle size={18} /> Cancel</button>
                </div>
              </div>
            )}

            {liveStatus === 'heading_to_pickup' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex gap-3">
                  <button onClick={() => handleStatusChange('arrived')} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold flex justify-center gap-2"><MapPin size={18} /> Reached Location</button>
                </div>
              </div>
            )}

            {liveStatus === 'arrived' && (
              <div className="space-y-4 animate-fade-in">
                <div className="text-center bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <p className="text-yellow-800 font-bold">Fill the OTP of customer to start the ride.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-center gap-3">
                    {otp.map((data, index) => (
                      <input key={index} type="text" maxLength="1" className="w-14 h-14 bg-gray-100 border border-gray-300 rounded-xl text-center text-2xl font-extrabold outline-none focus:border-black focus:bg-white" value={data} onChange={e => handleChangeOTP(e.target, index)} onFocus={e => e.target.select()}/>
                    ))}
                  </div>
                  <button onClick={handleVerifyOTP} disabled={loading} className="w-full bg-black text-white py-3 rounded-xl font-bold active:scale-95 transition">Verify & Start Ride</button>
                </div>
              </div>
            )}

            {liveStatus === 'active' && (
              <div className="space-y-4 animate-fade-in">
                <div className="text-center bg-green-50 p-4 rounded-xl border border-green-200">
                  <p className="text-green-800 font-extrabold text-lg">Ride in Progress 🚗</p>
                </div>
                <button onClick={() => handleStatusChange('completed')} disabled={loading} className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg shadow-lg">End & Complete Ride</button>
              </div>
            )}

            {/* 🔴 NAYA STATE: COMPLETED (Driver View) */}
            {liveStatus === 'completed' && (
              <div className="space-y-4 animate-fade-in text-center bg-blue-50 p-6 rounded-xl border border-blue-200">
                <p className="text-2xl font-extrabold text-blue-900">Ride Completed! 🎉</p>
                <p className="text-sm text-blue-700 mt-2 font-semibold">Awesome! The fare has been automatically credited to your wallet.</p>
                <button onClick={() => onClose && onClose()} className="w-full bg-blue-600 text-white py-3 mt-4 rounded-xl font-bold">
                  Close & Go Home
                </button>
              </div>
            )}
          </>
        )}

        {/* ========================================== */}
        {/* PASSENGER VIEWS                            */}
        {/* ========================================== */}
        {isPassenger && (
          <>
            {liveStatus === 'booked' && (
              <button onClick={() => handleStatusChange('cancelled')} className="w-full bg-red-100 text-red-600 py-3 rounded-xl font-bold flex justify-center gap-2"><XCircle size={18} /> Cancel Ride</button>
            )}

            {liveStatus === 'heading_to_pickup' && (
              <div className="text-center bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <p className="text-indigo-800 font-bold text-lg">The rider has left for the ride 🛵</p>
                <p className="text-sm text-indigo-700 mt-1">Estimated reach time: ~{estimatedTime}</p>
              </div>
            )}

            {liveStatus === 'arrived' && (
              <div className="text-center bg-green-50 p-5 rounded-xl border border-green-200">
                <p className="text-green-800 font-extrabold text-lg">Rider has reached your location! 📍</p>
                <div className="bg-white border-2 border-green-300 w-max mx-auto mt-3 px-6 py-2 rounded-lg flex gap-2">
                  {(ride?.startOtp?.toString() || "1234").split('').map((digit, i) => (
                    <span key={i} className="text-3xl font-black text-gray-800">{digit}</span>
                  ))}
                </div>
              </div>
            )}

            {liveStatus === 'active' && (
              <div className="text-center bg-green-50 p-5 rounded-xl border border-green-200">
                <p className="text-green-800 font-extrabold text-lg">You are on your way! 🌬️</p>
                <p className="text-sm text-green-700 mt-1">Enjoy your ride. You will reach soon.</p>
              </div>
            )}

            {/* 🔴 NAYA STATE: COMPLETED (Passenger View - RATING UI) */}
            {liveStatus === 'completed' && (
              <div className="space-y-4 animate-fade-in text-center bg-gray-50 p-6 rounded-xl border border-gray-200">
                <p className="text-xl font-extrabold text-gray-900">Ride Completed! 🎉</p>
                <p className="text-sm text-gray-600 mb-4 font-medium">Fare has been automatically deducted from your wallet.</p>
                
                <div className="border-t border-gray-200 pt-4">
                  <p className="font-bold text-gray-800 mb-2">Rate your Rider</p>
                  
                  {/* Star Rating System */}
                  <div className="flex justify-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        size={36} 
                        fill={star <= rating ? "#F59E0B" : "none"} 
                        color={star <= rating ? "#F59E0B" : "#D1D5DB"}
                        onClick={() => setRating(star)}
                        className="cursor-pointer transition-transform hover:scale-110 active:scale-90"
                      />
                    ))}
                  </div>

                  <textarea 
                    placeholder="Write a review (optional)" 
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl p-3 text-sm focus:border-black outline-none mb-3 resize-none h-20"
                  />
                  
                  <button onClick={handleSubmitRating} disabled={loading} className="w-full bg-black text-white py-3 rounded-xl font-bold active:scale-95 transition">
                    Submit Review
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default LiveRidePanel;