import React, { useState, useRef, useEffect } from 'react';
import { Bike, Clock } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../services/api_service';
import MapComponent from '../components/MapComponent';

const socket = io("http://localhost:5000");

const DAYS_OF_WEEK = [
  { id: 'mon', label: 'M' },
  { id: 'tue', label: 'T' },
  { id: 'wed', label: 'W' },
  { id: 'thu', label: 'T' },
  { id: 'fri', label: 'F' },
  { id: 'sat', label: 'S' },
  { id: 'sun', label: 'S' },
];

const Toggle = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="flex w-full items-center justify-between py-1 cursor-pointer"
  >
    <span className="text-sm font-medium text-gray-800">{label}</span>
    <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-orange-500' : 'bg-gray-200'}`}>
      <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} style={{ height: '18px', width: '18px' }} />
    </span>
  </button>
);

const OfferRide = () => {
  // Form States
  const [vehicleName, setVehicleName] = useState('');
  const [fare, setFare] = useState(''); 
  const [selectedDays, setSelectedDays] = useState(['mon', 'tue', 'wed', 'thu', 'fri']); // Default Weekdays
  const [reachTime, setReachTime] = useState('09:30'); // Default Office Time
  const [hasHelmet, setHasHelmet] = useState(true);
  const [womenOnly, setWomenOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Map and Tracking states
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  
  // Multiple Routes states
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [routePoints, setRoutePoints] = useState(null); 
  const [expectedDistanceKm, setExpectedDistanceKm] = useState(0); 

  const watchIdRef = useRef(null);

  // ==========================================
  // MULTIPLE ROUTES LOGIC 🛣️
  // ==========================================
  useEffect(() => {
    if (pickup && drop) {
      const fetchRoute = async () => {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}?geometries=geojson&alternatives=true`;
        try {
          const res = await fetch(osrmUrl);
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            setAvailableRoutes(data.routes);
            setSelectedRouteIndex(0);
            setRoutePoints(data.routes[0].geometry.coordinates);
            setExpectedDistanceKm((data.routes[0].distance / 1000).toFixed(1));
          }
        } catch (err) {
          console.error("Route Error:", err);
        }
      };
      fetchRoute();
    } else {
      setAvailableRoutes([]);
      setRoutePoints(null); 
      setExpectedDistanceKm(0);
    }
  }, [pickup, drop]);

  const handleNextRoute = () => {
    if (availableRoutes.length > 1) {
      const nextIndex = (selectedRouteIndex + 1) % availableRoutes.length;
      setSelectedRouteIndex(nextIndex);
      setRoutePoints(availableRoutes[nextIndex].geometry.coordinates);
      setExpectedDistanceKm((availableRoutes[nextIndex].distance / 1000).toFixed(1));
    }
  };

  const toggleDay = (id) => {
    setSelectedDays((prev) => 
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const startTracking = (rideId) => {
    socket.emit('join-ride', rideId);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        socket.emit('update-location', { rideId, lat: latitude, lng: longitude });
      },
      (err) => console.error("Tracking Error:", err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

const handlePublish = async () => {
    if (!pickup || !drop || !fare || selectedDays.length === 0 || !reachTime) {
      alert("Please fill all details, select days/time, and choose locations on the map!");
      return;
    }

    if (!routePoints) {
      alert("Route not found. Please try adjusting your locations.");
      return;
    }

    setLoading(true);
    try {
      console.log("📤 Sending data to backend..."); 

      const payload = {
        startPoint: { coordinates: [pickup.lng, pickup.lat], address: "Pickup Location" },
        endPoint: { coordinates: [drop.lng, drop.lat], address: "Drop Location" },
        routePoints: routePoints, 
        farePerKm: Number(fare),
        expectedDistance: Number(expectedDistanceKm),
        days: selectedDays,
        reachTime: reachTime,
        vehicleName: vehicleName || "My Vehicle",
        womenOnly: womenOnly || false
      };
      
      console.log("📦 Payload Data:", payload);

      // Backend ko request
      const response = await api.post('/rides', payload);
      
      console.log("✅ Backend Response Came:", response.data); 

      // Safely extracting ID (Commute ya Ride, jo bhi backend bheje)
      const publishedId = response.data?.commute?._id || response.data?.ride?._id; 
      
      if (!publishedId) {
        console.error("❌ ID missing in response!");
        alert("Published, but tracking failed to start. Redirecting...");
        return;
      }
      
      alert("Commute Published Successfully! Live Tracking Started.");
      startTracking(publishedId);
      
    } catch (error) {
      console.error("🚨 THE REAL ERROR IS:", error); 
      
      if (error.response) {
        // Agar Backend ne request reject ki hai (jaise validation error)
        console.error("❌ Backend error message:", error.response.data);
        alert("Backend Error: " + (error.response.data.message || "Failed to publish"));
      } else {
        // Agar Frontend React mein hi code fatt gaya (jaise TypeError)
        alert("Frontend Error: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen pb-24 bg-gray-50">
      <header className="px-5 pt-8 pb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Offer <span className="text-orange-500">a Commute.</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1 font-medium">Share your daily route</p>
      </header>

      <main className="px-5 space-y-4">
        {/* Map Section */}
        <section className="rounded-2xl bg-white p-2 shadow-sm">
          <MapComponent 
            pickup={pickup} 
            drop={drop} 
            routePoints={routePoints} 
            onMapClick={(loc) => !pickup ? setPickup(loc) : setDrop(loc)} 
          />
          <div className="flex flex-col gap-2 p-3">
             <div className="flex justify-between items-center w-full">
               <button onClick={() => {setPickup(null); setDrop(null)}} className="text-xs font-bold text-red-600 cursor-pointer">Reset Map</button>
               {expectedDistanceKm > 0 && <span className="text-xs font-bold text-gray-500">Dist: {expectedDistanceKm} km</span>}
             </div>
             
             {availableRoutes.length > 1 && (
               <div className="mt-2 flex items-center justify-between bg-orange-50 p-2 rounded-lg">
                 <span className="text-xs font-semibold text-orange-700">
                   Route {selectedRouteIndex + 1} of {availableRoutes.length}
                 </span>
                 <button 
                   onClick={handleNextRoute} 
                   className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-md shadow active:bg-orange-600 cursor-pointer"
                 >
                   🔄 Change Route
                 </button>
               </div>
             )}
          </div>
        </section>

        {/* Form Fields Section */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
           <input 
             type="text" 
             placeholder="Vehicle e.g. TVS Wego" 
             value={vehicleName}
             className="w-full mb-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-orange-500" 
             onChange={(e) => setVehicleName(e.target.value)} 
           />
           <input 
             type="number" 
             placeholder="Fare per km (e.g. 5)" 
             value={fare}
             className="w-full mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-orange-500" 
             onChange={(e) => setFare(e.target.value)} 
             required
           />

           {/* NAYA: Days Selector */}
           <div className="space-y-2 mb-4">
             <label className="text-xs font-bold text-gray-500 uppercase">Commute Days</label>
             <div className="flex justify-between gap-1">
               {DAYS_OF_WEEK.map((d) => (
                 <button
                   key={d.id}
                   type="button"
                   onClick={() => toggleDay(d.id)}
                   className={`w-9 h-9 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                     selectedDays.includes(d.id) 
                       ? 'bg-orange-500 text-white shadow-md' 
                       : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                   }`}
                 >
                   {d.label}
                 </button>
               ))}
             </div>
           </div>

           {/* NAYA: Reach Time */}
           <div className="space-y-2">
             <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
               <Clock size={12} /> Expected Reach Time
             </label>
             <input 
               type="time" 
               value={reachTime}
               className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-orange-500 cursor-pointer font-bold" 
               onChange={(e) => setReachTime(e.target.value)} 
               required
             />
           </div>
        </section>

        {/* Preferences / Toggles Section */}
        <section className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
          <Toggle checked={hasHelmet} onChange={setHasHelmet} label="I have a spare helmet" />
          <Toggle checked={womenOnly} onChange={setWomenOnly} label="Women-only commute" />
        </section>

        {/* Publish Button */}
        <button
          onClick={handlePublish}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-4 text-sm font-bold text-white shadow-lg active:bg-orange-600 transition disabled:opacity-70 cursor-pointer"
        >
          {loading ? 'PUBLISHING...' : <><Bike size={18} /> PUBLISH COMMUTE</>}
        </button>
      </main>
    </div>
  );
};

export default OfferRide;