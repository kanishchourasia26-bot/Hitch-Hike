import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import api from '../services/api_service';
import MapComponent from '../components/MapComponent';
// 1. Fare Calculator Import
import { calculateDistanceAndFare } from '../utils/fareCalculator'; 

const PREFERENCES = [
  { id: 'women-only', label: 'Women-only riders' },
  { id: 'quiet', label: 'Quiet ride' },
  { id: 'chat', label: 'Happy to chat' },
  { id: 'kyc', label: 'KYC verified' },
];

const BookRide = () => {
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [activePrefs, setActivePrefs] = useState([]);
  const [radiusKm, setRadiusKm] = useState(1.5);
  const [loading, setLoading] = useState(false);
  const [availableRides, setAvailableRides] = useState([]);
  
  // NAYA: Search track karne ke liye state
  const [hasSearched, setHasSearched] = useState(false); 

  // Distance aur Fare save karne ke liye state
  const [tripDistance, setTripDistance] = useState(null);
  const [estimatedFare, setEstimatedFare] = useState(null);

  const togglePreference = (id) => {
    setActivePrefs((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const findRides = async () => {
    if (!pickup || !drop) {
      alert("Please select pickup and drop points on the map!");
      return;
    }
    
    setLoading(true);
    setHasSearched(false); // Search shuru hote hi isko reset kar do
    
    try {
      // Backend se rides search karo
      const response = await api.post('/rides/search', {
        startLng: pickup.lng,
        startLat: pickup.lat,
        endLng: drop.lng,
        endLat: drop.lat,
        radiusInKm: radiusKm,
        preferences: activePrefs 
      });
      
      setAvailableRides(response.data.rides || []);
      setHasSearched(true); // Search complete ho gaya

      // OSRM API call lagayi Distance aur Fare ke liye
      const fareData = await calculateDistanceAndFare(
        pickup.lng, pickup.lat,
        drop.lng, drop.lat
      );

      // Agar map API se sahi data aaya, toh usko state mein daal do
      if (fareData.success) {
        setTripDistance(fareData.distance);
        setEstimatedFare(fareData.fare);
      }

    } catch (error) {
      // Agar backend error de (no rides found), toh list clear karke message dikhao
      setAvailableRides([]);
      setHasSearched(true);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookRide = async (rideId) => {
    try {
      const response = await api.post('/rides/book', { rideId });
      alert("Ride booked successfully!");
      setAvailableRides((prevRides) => prevRides.filter(ride => ride._id !== rideId));
    } catch (error) {
      alert("Booking failed: " + (error.response?.data?.error || "Please try again"));
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-gray-50">
      <header className="px-5 pt-8 pb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Book a <span className="text-orange-500">Ride.</span>
        </h1>
      </header>

      <main className="px-5 space-y-6">
        {/* Map Integration */}
        <section className="rounded-2xl bg-white p-2 shadow-sm">
          <MapComponent 
            pickup={pickup} 
            drop={drop} 
            onMapClick={(loc) => !pickup ? setPickup(loc) : setDrop(loc)} 
          />
          <div className="flex gap-4 p-3 border-t">
             <button onClick={() => setPickup(null)} className="text-xs font-bold text-green-600">Reset Pickup</button>
             <button onClick={() => setDrop(null)} className="text-xs font-bold text-red-600">Reset Drop</button>
          </div>
        </section>

        <div className="rounded-2xl bg-white p-5 shadow-sm space-y-6">
          {/* Preferences UI */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-3">Preferences</p>
            <div className="flex flex-wrap gap-2">
              {PREFERENCES.map((pref) => (
                <button
                  key={pref.id}
                  onClick={() => togglePreference(pref.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full border transition ${
                    activePrefs.includes(pref.id) 
                      ? 'bg-orange-500 text-white border-orange-500' 
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {pref.label}
                </button>
              ))}
            </div>
          </div>

          {/* Radius Slider */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Search Radius</p>
            <input
              type="range"
              min={0.5} max={5.0} step={0.1}
              value={radiusKm}
              onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-orange-500"
            />
            <span className="text-sm font-bold text-orange-500">{radiusKm.toFixed(1)} km</span>
          </div>

          <button
            onClick={findRides}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-4 text-sm font-bold text-white shadow-lg shadow-orange-200 transition active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Search size={18} /> FIND RIDES</>}
          </button>
        </div>

        {/* NAYA LOGIC: Agar search complete hua aur koi ride nahi mili */}
        {hasSearched && availableRides.length === 0 && (
          <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 text-center mt-2">
            <p className="text-orange-800 font-bold text-lg">No rides found 😔</p>
            <p className="text-sm text-orange-600 mt-1">
              Try increasing your search radius to find riders further away.
            </p>
          </div>
        )}

        {/* Results aane par Fare aur Distance ka Smart Banner */}
        {estimatedFare !== null && tripDistance !== null && availableRides.length > 0 && (
          <div className="bg-green-50 p-4 rounded-xl shadow-sm border border-green-200 mb-2">
            <h3 className="text-green-800 font-extrabold text-xl">
              Trip Fare: ₹{estimatedFare}
            </h3>
            <p className="text-sm font-medium text-green-700 mt-1">
              Total Distance: {tripDistance} km (@ ₹6/km)
            </p>
          </div>
        )}

        {/* Results List */}
        {availableRides.length > 0 && (
          <section className="space-y-3">
            <h3 className="font-bold text-gray-900">Available Rides</h3>
            {availableRides.map((ride) => (
              <div key={ride._id} className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 flex flex-col gap-2">
                
                <div className="flex justify-between items-center">
                  <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    Rider: {ride.publisher.name}
                  </p>
                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
                    ₹{estimatedFare}
                  </span>
                </div>
                
                <button 
                  onClick={() => handleBookRide(ride._id)}
                  className="mt-2 w-full bg-black text-white py-3 rounded-xl text-sm font-bold transition hover:bg-gray-800 active:scale-[0.98]"
                >
                  BOOK NOW
                </button>
                
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
};

export default BookRide;