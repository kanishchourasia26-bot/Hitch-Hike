import React, { useState, useRef, useEffect } from 'react';
import { Bike } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../services/api_service';
import MapComponent from '../components/MapComponent';

const socket = io("http://localhost:5000");

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
  const [fare, setFare] = useState(''); 
  const [hasHelmet, setHasHelmet] = useState(true);
  const [womenOnly, setWomenOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Map and Tracking states
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  
  // NAYA: Multiple Routes handle karne ke liye states
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
        // NAYA: URL mein '&alternatives=true' add kiya hai taaki extra raste milein
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}?geometries=geojson&alternatives=true`;
        try {
          const res = await fetch(osrmUrl);
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            setAvailableRoutes(data.routes); // Saare raste save kar liye
            setSelectedRouteIndex(0); // Default pehla rasta
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

  // Jab user "Change Route" dabaye
  const handleNextRoute = () => {
    if (availableRoutes.length > 1) {
      const nextIndex = (selectedRouteIndex + 1) % availableRoutes.length; // Agla rasta, end pe aake shuru se
      setSelectedRouteIndex(nextIndex);
      setRoutePoints(availableRoutes[nextIndex].geometry.coordinates);
      setExpectedDistanceKm((availableRoutes[nextIndex].distance / 1000).toFixed(1));
    }
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
    if (!pickup || !drop || !fare || !departureTime) {
      alert("Please fill all details and select pickup/drop on the map!");
      return;
    }

    if (!routePoints) {
      alert("Route not found. Please try adjusting your locations.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/rides', {
        startPoint: { coordinates: [pickup.lng, pickup.lat], address: "Pickup Location" },
        endPoint: { coordinates: [drop.lng, drop.lat], address: "Drop Location" },
        routePoints: routePoints, // Jo rasta selected hoga, wahi backend par jayega
        farePerKm: Number(fare),
        expectedDistance: Number(expectedDistanceKm),
        startTime: departureTime,
      });

      const rideId = response.data.ride._id;
      alert("Ride Published Successfully! Live Tracking Started.");
      
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
            routePoints={routePoints} 
            onMapClick={(loc) => !pickup ? setPickup(loc) : setDrop(loc)} 
          />
          <div className="flex flex-col gap-2 p-3">
             <div className="flex justify-between items-center w-full">
               <button onClick={() => {setPickup(null); setDrop(null)}} className="text-xs font-bold text-red-600">Reset Map</button>
               {expectedDistanceKm > 0 && <span className="text-xs font-bold text-gray-500">Dist: {expectedDistanceKm} km</span>}
             </div>
             
             {/* NAYA: Route Change karne ka button */}
             {availableRoutes.length > 1 && (
               <div className="mt-2 flex items-center justify-between bg-blue-50 p-2 rounded-lg">
                 <span className="text-xs font-semibold text-blue-700">
                   Route {selectedRouteIndex + 1} of {availableRoutes.length}
                 </span>
                 <button 
                   onClick={handleNextRoute} 
                   className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-md shadow active:bg-blue-600"
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