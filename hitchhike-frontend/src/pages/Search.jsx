import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { 
  ArrowLeft, Loader2, MapPin, Navigation, 
  Footprints, User, ShieldCheck, AlertCircle, 
  RefreshCw, CheckCircle2, Clock, Calendar, MessageSquare
} from 'lucide-react';
import api from '../services/api_service';
import MapComponent from '../components/MapComponent';
import Chat from './Chat'; // 🔥 YAHAN CHAT IMPORT KIYA HAI 🔥

function Search() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // 🔥 CHAT MODAL KE LIYE STATE 🔥
  const [activeChatPeerId, setActiveChatPeerId] = useState(null);

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
  const [estimatedFare, setEstimatedFare] = useState(null);
  const [bookingLoadingId, setBookingLoadingId] = useState(null);

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
        setEstimatedFare(Math.round(distKm * 6)); 
      }

    } catch (error) {
      console.error("API Error fetching commutes:", error);
      setAvailableCommutes([]); 
    } finally {
      setLoading(false); 
    }
  };

  const handleBookSeat = async (rideId) => {
    setBookingLoadingId(rideId);
    try {
      await api.post('/rides/book', { rideId, passengers });
      alert("🎉 Commute matched successfully!");
      setAvailableCommutes((prev) => prev.filter(ride => ride._id !== rideId));
    } catch (error) {
      alert("Request failed: " + (error.response?.data?.error || "Please try again"));
    } finally {
      setBookingLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
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
                  <span className="text-gray-900 font-black text-2xl">
                    ₹{estimatedFare || ride.farePerKm || 0}
                  </span>
                  <p className="text-[10px] text-gray-400 font-black uppercase">Est. Cost Share</p>
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

              {/* 🔥 NEW ACTION BUTTONS ROW: DM & JOIN COMMUTE 🔥 */}
              <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
                {/* 🔥 YAHAN ONCLICK CHANGE KIYA HAI 🔥 */}
                <button
                  onClick={() => setActiveChatPeerId(ride.publisher?._id || ride.publisher)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 text-orange-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-orange-100 border border-orange-200 transition cursor-pointer"
                >
                  <MessageSquare size={16} />
                  <span>DM</span>
                </button>

                {/* Join Commute Button */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleBookSeat(ride._id)}
                  disabled={bookingLoadingId === ride._id}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl text-xs font-extrabold uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {bookingLoadingId === ride._id ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Requesting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Join Commute</span>
                    </>
                  )}
                </motion.button>
              </div>
              
            </motion.div>
          ))}
        </section>
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
}

export default Search;