import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Loader2, MapPin, Navigation, 
  Footprints, User, ShieldCheck, AlertCircle, 
  RefreshCw, Clock, Calendar, MessageCircle, X, Phone, Mail
} from 'lucide-react';
import api from '../services/api_service';
import MapComponent from '../components/MapComponent';
import { useChatContext } from '../contexts/ChatContext';

function Search() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { openChat } = useChatContext();

  // 🔥 PROFILE MODAL STATE 🔥
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // 1. Safely Parse URL Parameters
  const pickUpLat = parseFloat(searchParams.get("pickuplat")) || 0;
  const pickUpLon = parseFloat(searchParams.get("pickuplon")) || 0;
  const dropLat = parseFloat(searchParams.get("droplat")) || 0;
  const dropLon = parseFloat(searchParams.get("droplon")) || 0;
  
  const radiusKm = parseFloat(searchParams.get("radius")) || 1.5;
  const passengers = parseInt(searchParams.get("passengers")) || 1;
  const reachTime = searchParams.get("reachTime") || "";
  const daysQuery = searchParams.get("days") || "";
  const activeDays = daysQuery ? daysQuery.split(",") : [];
  
  const kycVerified = searchParams.get("kycVerified") === "true";

  // Safely check if coordinates exist
  const hasValidCoords = pickUpLat !== 0 && pickUpLon !== 0 && dropLat !== 0 && dropLon !== 0;
  
  const pickupCoords = hasValidCoords ? { lat: pickUpLat, lng: pickUpLon } : null;
  const dropCoords = hasValidCoords ? { lat: dropLat, lng: dropLon } : null;

  // 2. Local States
  const [loading, setLoading] = useState(true);
  const [availableCommutes, setAvailableCommutes] = useState([]);
  const [tripDistance, setTripDistance] = useState(null);

  // 3. Auto-Search Commutes on Page Load
  useEffect(() => {
    if (hasValidCoords) {
      findMatchingCommutes();
    } else {
      setLoading(false);
      setAvailableCommutes([]);
    }
  }, [hasValidCoords]);

  const findMatchingCommutes = async () => {
    setLoading(true);
    try {
      const response = await api.post('/rides/search', {
        startLng: pickUpLon,
        startLat: pickUpLat,
        endLng: dropLon,
        endLat: dropLat,
        radiusInKm: radiusKm,
        days: activeDays,
        reachTime: reachTime,
        passengers: passengers,
        kycVerified: kycVerified
      });
      
      const fetchedRides = response.data?.rides || response.data || [];
      setAvailableCommutes(Array.isArray(fetchedRides) ? fetchedRides : []);

      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickUpLon},${pickUpLat};${dropLon},${dropLat}?overview=false`;
      const osrmRes = await fetch(osrmUrl);
      const osrmData = await osrmRes.json();
      
      if (osrmData.routes && osrmData.routes.length > 0) {
        const distKm = (osrmData.routes[0].distance / 1000).toFixed(1);
        setTripDistance(distKm);
      }

    } catch (error) {
      console.error("API Error fetching commutes:", error);
      setAvailableCommutes([]); 
    } finally {
      setLoading(false); 
    }
  };

  const handleViewProfile = async (userId) => {
    setShowProfileModal(true);
    setLoadingProfile(true);
    try {
      const response = await api.get(`/users/${userId}`);
      setSelectedUserProfile(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      alert('Failed to load profile');
      setShowProfileModal(false);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleCloseProfile = () => {
    setShowProfileModal(false);
    setSelectedUserProfile(null);
  };

  const handleStartChat = (userId) => {
    openChat(userId);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* PROFILE MODAL */}
      <AnimatePresence>
        {showProfileModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseProfile}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
                {loadingProfile ? (
                  <div className="p-12 flex flex-col items-center justify-center">
                    <Loader2 size={32} className="animate-spin text-orange-500 mb-3" />
                    <p className="text-sm text-gray-500">Loading profile...</p>
                  </div>
                ) : selectedUserProfile ? (
                  <>
                    {/* Header with gradient */}
                    <div className="bg-gradient-to-br from-orange-500 to-rose-500 p-6 text-center relative sticky top-0 z-10">
                      <button
                        onClick={handleCloseProfile}
                        className="absolute top-3 right-3 text-white/80 hover:text-white p-1.5 hover:bg-white/20 rounded-full transition"
                      >
                        <X size={18} />
                      </button>
                      
                      {/* Avatar */}
                      <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-white/30 shadow-xl">
                        <span className="text-4xl font-black text-white">
                          {selectedUserProfile.name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      
                      <h2 className="text-xl font-black text-white mb-1">
                        {selectedUserProfile.name || 'Unknown User'}
                      </h2>
                      
                      <p className="text-white/90 text-xs capitalize">
                        {selectedUserProfile.role || 'User'}
                      </p>
                    </div>

                    {/* Details */}
                    <div className="p-4 space-y-3">
                      {/* Email */}
                      {selectedUserProfile.email && (
                        <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                          <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Mail size={16} className="text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Email</p>
                            <p className="text-xs font-bold text-gray-800 truncate">{selectedUserProfile.email}</p>
                          </div>
                        </div>
                      )}

                      {/* Phone */}
                      {selectedUserProfile.phone && (
                        <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Phone size={16} className="text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Phone</p>
                            <p className="text-xs font-bold text-gray-800">{selectedUserProfile.phone}</p>
                          </div>
                        </div>
                      )}

                      {/* Gender */}
                      {selectedUserProfile.gender && (
                        <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                          <div className="w-9 h-9 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-base">
                              {selectedUserProfile.gender === 'male' ? '👨' : selectedUserProfile.gender === 'female' ? '👩' : '🧑'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Gender</p>
                            <p className="text-xs font-bold text-gray-800 capitalize">{selectedUserProfile.gender}</p>
                          </div>
                        </div>
                      )}

                      {/* Age */}
                      {selectedUserProfile.age && (
                        <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                          <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-base">🎂</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Age</p>
                            <p className="text-xs font-bold text-gray-800">{selectedUserProfile.age} years</p>
                          </div>
                        </div>
                      )}

                      {/* Vehicle Number (for riders) */}
                      {selectedUserProfile.vehicleNumber && (
                        <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                          <div className="w-9 h-9 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-base">🚗</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Vehicle</p>
                            <p className="text-xs font-bold text-gray-800">{selectedUserProfile.vehicleNumber}</p>
                          </div>
                        </div>
                      )}

                      {/* Verification Badges */}
                      {(selectedUserProfile.isAadhaarVerified || selectedUserProfile.isDlVerified) && (
                        <div className="flex gap-2 flex-wrap">
                          {selectedUserProfile.isAadhaarVerified && (
                            <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-[10px] font-bold">
                              <span>✓</span> Aadhaar
                            </div>
                          )}
                          {selectedUserProfile.isDlVerified && (
                            <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-bold">
                              <span>✓</span> DL
                            </div>
                          )}
                        </div>
                      )}

                      {/* Member Since */}
                      {selectedUserProfile.createdAt && (
                        <div className="text-center pt-3 border-t border-gray-100">
                          <p className="text-[10px] text-gray-400">
                            Member since {new Date(selectedUserProfile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="p-4 pt-0 sticky bottom-0 bg-white flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          handleCloseProfile();
                          handleStartChat(selectedUserProfile.id);
                        }}
                        className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-black rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                      >
                        <MessageCircle size={16} />
                        <span>Chat</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCloseProfile}
                        className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-black rounded-xl hover:bg-gray-200 transition-all"
                      >
                        Close
                      </motion.button>
                    </div>
                  </>
                ) : null}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center transition cursor-pointer"
            >
              <ArrowLeft size={16} className="text-gray-900" />
            </motion.button>
            <div>
              <h1 className="text-gray-900 font-black text-lg leading-tight">Available Commutes</h1>
              <p className="text-gray-500 text-xs">Walking radius: {radiusKm}km</p>
            </div>
          </div>

          <button
            onClick={findMatchingCommutes}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-100 text-orange-700 text-xs font-bold hover:bg-orange-200 transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-5 space-y-6">
        
        {/* COMMUTE PREFERENCES SUMMARY */}
        <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar size={16} className="text-orange-500" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {activeDays.length} Days/Wk
            </span>
          </div>
          <div className="w-px h-6 bg-gray-200" />
          <div className="flex items-center gap-2 text-gray-700">
            <Clock size={16} className="text-orange-500" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Reach by {reachTime || "N/A"}
            </span>
          </div>
          <div className="w-px h-6 bg-gray-200" />
          <div className="flex items-center gap-2 text-gray-700">
            <User size={16} className="text-orange-500" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {passengers} Seat(s)
            </span>
          </div>
        </div>

        {/* MAP CARD */}
        {hasValidCoords && (
          <section className="rounded-3xl bg-white p-2 border border-gray-200 shadow-sm overflow-hidden">
            <div className="h-[250px] w-full rounded-2xl overflow-hidden relative">
              <MapComponent
                pickup={pickupCoords}
                drop={dropCoords}
                onMapClick={() => {}}
              />
            </div>
          </section>
        )}

        {/* COMMUTERS LIST SECTION */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-gray-900 font-black text-base uppercase tracking-wider">
              Peer Commuters ({availableCommutes.length})
            </h2>
          </div>

          {/* LOADING STATE */}
          {loading && (
            <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center flex flex-col items-center justify-center space-y-3 shadow-sm">
              <Loader2 size={32} className="animate-spin text-orange-500" />
              <p className="text-sm font-bold text-gray-600">Matching with daily commuters near your route...</p>
            </div>
          )}

          {/* EMPTY STATE */}
          {!loading && availableCommutes.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white p-8 rounded-3xl border border-gray-200 text-center space-y-3 shadow-sm"
            >
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto text-gray-400">
                <AlertCircle size={24} />
              </div>
              <h3 className="font-extrabold text-gray-900 text-lg">No peers passing by right now</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                We couldn't find anyone going your way matching your days and time within a <b>{radiusKm}km</b> walking radius. 
              </p>
              <button
                onClick={() => navigate(-1)}
                className="mt-2 px-6 py-2.5 bg-orange-500 text-white text-xs font-extrabold rounded-xl hover:bg-orange-600 transition cursor-pointer shadow-md"
              >
                Adjust Preferences
              </button>
            </motion.div>
          )}

          {/* MATCHED COMMUTE CARDS */}
          {!loading && availableCommutes.map((ride) => (
            <motion.div
              key={ride._id || Math.random()}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow space-y-5"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-black">
                    <User size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-gray-900 text-base">
                        {ride.publisher?.name || "Peer Commuter"}
                      </h3>
                      {ride.publisher?.kycVerified && (
                        <ShieldCheck size={15} className="text-green-500" />
                      )}
                    </div>
                    
                    {/* Phone Number Display Added Here */}
                    <p className="text-xs text-orange-600 font-bold mt-0.5">
                      📞 {ride.publisher?.phone || ride.phone || "Phone N/A"}
                    </p>

                    <p className="text-[11px] text-gray-400 font-semibold mt-0.5">
                      {ride.vehicleName || "Vehicle Info N/A"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="px-3 py-1.5 bg-orange-50 rounded-xl border border-orange-200">
                    <p className="text-[10px] text-orange-600 font-black uppercase">Fare via Chat</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-l-2 border-dashed border-gray-200 pl-4 ml-1">
                <div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-gray-900" />
                    <p className="text-[11px] font-black text-gray-900 uppercase tracking-wider">Pickup Point</p>
                  </div>
                  {ride.matchStartDist !== undefined && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-gray-50 text-gray-700 px-3 py-1 rounded-lg mt-1 border border-gray-200">
                      <Footprints size={13} className="text-orange-500" />
                      Walk {Math.round(ride.matchStartDist * 1000)}m to board
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <Navigation size={13} className="text-gray-900" />
                    <p className="text-[11px] font-black text-gray-900 uppercase tracking-wider">Dropoff Point</p>
                  </div>
                  {ride.matchEndDist !== undefined && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-gray-50 text-gray-700 px-3 py-1 rounded-lg mt-1 border border-gray-200">
                      <Footprints size={13} className="text-orange-500" />
                      Walk {Math.round(ride.matchEndDist * 1000)}m to destination
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button - View Profile */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleViewProfile(ride.publisher?._id || ride.publisher)}
                  disabled={!ride.publisher?._id && !ride.publisher}
                  className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white py-3.5 rounded-xl text-xs font-extrabold uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <User size={16} />
                  <span>View Profile</span>
                </motion.button>
              </div>
              
            </motion.div>
          ))}
        </section>
      </main>
    </div>
  );
}

export default Search;