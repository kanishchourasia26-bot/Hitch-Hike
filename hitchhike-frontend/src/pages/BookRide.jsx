import React, { useState, useEffect } from 'react';
import { Search, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MapComponent from '../components/MapComponent';

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

const BookRide = () => {
  const navigate = useNavigate();

  // Form States
  const [passengers, setPassengers] = useState('');
  const [selectedDays, setSelectedDays] = useState(['mon', 'tue', 'wed', 'thu', 'fri']); 
  const [reachTime, setReachTime] = useState('09:30'); 
  const [radiusKm, setRadiusKm] = useState(1.5);
  const [womenOnly, setWomenOnly] = useState(false);
  
  // NAYA: KYC Verified state
  const [kycVerified, setKycVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Map and Tracking states
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  
  // Multiple Routes states
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [routePoints, setRoutePoints] = useState(null); 
  const [expectedDistanceKm, setExpectedDistanceKm] = useState(0); 

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

 const handleSearch = () => {
    if (!pickup || !drop || !passengers || selectedDays.length === 0 || !reachTime) {
      alert("Please fill commute details, select days/time, and choose locations on the map!");
      return;
    }
    if (!routePoints) {
      alert("Route not found. Please try adjusting your locations.");
      return;
    }

    setLoading(true);
    const daysQuery = selectedDays.join(',');
    
    // 🔥 FIX: /user/search ki jagah sirf /search kar diya hai
    setTimeout(() => {
      navigate(`/search?pickuplat=${pickup.lat}&pickuplon=${pickup.lng}&droplat=${drop.lat}&droplon=${drop.lng}&passengers=${passengers}&womenOnly=${womenOnly}&kycVerified=${kycVerified}&days=${daysQuery}&reachTime=${encodeURIComponent(reachTime)}&radius=${radiusKm}`);
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen pb-24 bg-gray-50">
      <header className="px-5 pt-8 pb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Find <span className="text-orange-500">a Commute.</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1 font-medium">Pair up with regular commuters</p>
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

        {/* Schedule & Commute Details Section */}
        <section className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
           <input 
             type="number" 
             placeholder="Seats Needed (e.g. 1)" 
             value={passengers}
             className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-orange-500" 
             onChange={(e) => setPassengers(e.target.value)} 
             min="1" max="4"
           />
           
           {/* Days Selector */}
           <div className="space-y-2">
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

           {/* Reach Time */}
           <div className="space-y-2">
             <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
               <Clock size={12} /> Expected Reach Time
             </label>
             <input 
               type="time" 
               value={reachTime}
               className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-orange-500 cursor-pointer font-bold" 
               onChange={(e) => setReachTime(e.target.value)} 
             />
           </div>
        </section>

        {/* Preferences & Radius */}
        <section className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
          <Toggle checked={womenOnly} onChange={setWomenOnly} label="Women-only commute" />
          
          {/* NAYA: KYC Verified Toggle */}
          <Toggle checked={kycVerified} onChange={setKycVerified} label="KYC Verified" />
          
          {/* Radius Slider */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-2">
              <span>Walk Distance</span>
              <span className="bg-gray-100 px-2 py-1 rounded-md text-orange-600">{radiusKm} km</span>
            </div>
            <input 
              type="range" 
              min={0.5} 
              max={5.0} 
              step={0.1} 
              value={radiusKm} 
              onChange={(e) => setRadiusKm(parseFloat(e.target.value))} 
              className="w-full cursor-pointer accent-orange-500" 
            />
          </div>
        </section>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-4 text-sm font-bold text-white shadow-lg active:bg-orange-600 transition disabled:opacity-70 cursor-pointer"
        >
          {loading ? 'SEARCHING...' : <><Search size={18} /> FIND COMMUTERS</>}
        </button>
      </main>
    </div>
  );
};

export default BookRide;