import React, { useState, useRef, useEffect } from 'react';
import { Bike } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../services/api_service'; // API import karna zaroori hai
import MapComponent from '../components/MapComponent';

const socket = io("http://localhost:5000");

// Toggle Component (Same as yours)
const Toggle = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="flex w-full items-center justify-between py-1"
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
  const [departureTime, setDepartureTime] = useState('');
  const [fare, setFare] = useState(''); // Naya State Fare ke liye
  const [hasHelmet, setHasHelmet] = useState(true);
  const [womenOnly, setWomenOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Map and Tracking states
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const watchIdRef = useRef(null);

  // Live Tracking Logic
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

  // Publish API Call
  const handlePublish = async () => {
    if (!pickup || !drop || !fare || !departureTime) {
      alert("Please fill all details and select pickup/drop on the map!");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/rides', {
        startPoint: { coordinates: [pickup.lng, pickup.lat], address: "Pickup Location" },
        endPoint: { coordinates: [drop.lng, drop.lat], address: "Drop Location" },
        farePerKm: Number(fare),
        expectedDistance: 10, // Abhi dummy 10km rakha hai, baad me map routing se nikal sakte ho
        startTime: departureTime,
      });

      const rideId = response.data.ride._id;
      alert("Ride Published Successfully! Live Tracking Started.");
      
      // Tracking chalu karo backend mein ride create hone ke baad
      startTracking(rideId);
      
    } catch (error) {
      alert("Failed to publish ride: " + (error.response?.data?.message || "Server Error"));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      // Clean up tracking when component unmounts
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen pb-24 bg-gray-50">
      <header className="px-5 pt-8 pb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Give <span className="text-orange-500">a Ride.</span>
        </h1>
      </header>

      <main className="px-5 space-y-4">
        {/* Map Section */}
        <section className="rounded-2xl bg-white p-2 shadow-sm">
          <MapComponent 
            pickup={pickup} 
            drop={drop} 
            onMapClick={(loc) => !pickup ? setPickup(loc) : setDrop(loc)} 
          />
          <div className="flex gap-2 p-3">
             <button onClick={() => setPickup(null)} className="text-xs font-bold text-green-600">Reset Pickup</button>
             <button onClick={() => setDrop(null)} className="text-xs font-bold text-red-600">Reset Drop</button>
          </div>
        </section>

        {/* Form Fields Section */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
           <input 
             type="text" 
             placeholder="Vehicle e.g. TVS Wego" 
             value={vehicleName}
             className="w-full mb-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm" 
             onChange={(e) => setVehicleName(e.target.value)} 
           />
           <input 
             type="number" 
             placeholder="Fare per km (e.g. 5)" 
             value={fare}
             className="w-full mb-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm" 
             onChange={(e) => setFare(e.target.value)} 
             required
           />
           <input 
             type="datetime-local" 
             value={departureTime}
             className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm" 
             onChange={(e) => setDepartureTime(e.target.value)} 
             required
           />
        </section>

        {/* Preferences / Toggles Section */}
        <section className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
          <Toggle checked={hasHelmet} onChange={setHasHelmet} label="I have a spare helmet" />
          <Toggle checked={womenOnly} onChange={setWomenOnly} label="Women-only ride" />
        </section>

        {/* Publish Button */}
        <button
          onClick={handlePublish}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-4 text-sm font-bold text-white shadow-lg active:bg-orange-600 transition disabled:opacity-70"
        >
          {loading ? 'PUBLISHING...' : <><Bike size={18} /> PUBLISH RIDE</>}
        </button>
      </main>
    </div>
  );
};

export default OfferRide;