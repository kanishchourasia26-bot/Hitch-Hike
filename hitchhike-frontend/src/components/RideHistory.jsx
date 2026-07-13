import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Clock, Navigation, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api_service';

const RideHistory = () => {
  const [offeredRides, setOfferedRides] = useState([]);
  const [bookedRides, setBookedRides] = useState([]);
  const [activeTab, setActiveTab] = useState('booked'); // 'booked' or 'offered'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyRides = async () => {
      try {
        const response = await api.get('/rides/my-rides');
        setOfferedRides(response.data.offeredRides);
        setBookedRides(response.data.bookedRides);
      } catch (error) {
        console.error("Error fetching rides:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyRides();
  }, []);

  // Helper function to color code the status
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase">Completed</span>;
      case 'active': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase">Active</span>;
      case 'booked': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold uppercase">Booked</span>;
      case 'expired': return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold uppercase">Expired</span>;
      case 'cancelled': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold uppercase">Cancelled</span>;
      default: return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold uppercase">{status}</span>;
    }
  };

  const RideCard = ({ ride, type }) => (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4">
      <div className="flex justify-between items-center border-b pb-3 mb-3">
        {getStatusBadge(ride.status)}
        <div className="text-right">
          <p className="text-sm font-bold text-gray-800">₹{ride.farePerKm}/km</p>
          <p className="text-xs text-gray-500">{new Date(ride.startTime).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="space-y-3 relative">
        <div className="flex gap-3 items-start">
          <MapPin size={18} className="text-green-500 mt-1" />
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase">Pickup</p>
            <p className="text-sm font-medium text-gray-800 line-clamp-1">
              {ride.startPoint?.address || "Selected Location"}
            </p>
          </div>
        </div>
        
        {/* Visual Line connector */}
        <div className="absolute left-[8px] top-[24px] bottom-[24px] w-0.5 bg-gray-200"></div>

        <div className="flex gap-3 items-start">
          <MapPin size={18} className="text-red-500 mt-1" />
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase">Drop</p>
            <p className="text-sm font-medium text-gray-800 line-clamp-1">
              {ride.endPoint?.address || "Selected Location"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t flex justify-between items-center">
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <Clock size={16} />
          <span>{new Date(ride.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
        
        {/* Yahan par hum Driver/Passenger ki details dikha rahe hain based on tab */}
        <div className="text-sm">
          {type === 'booked' && ride.publisher ? (
            <p><span className="text-gray-500 text-xs">Driver:</span> <span className="font-semibold">{ride.publisher.name}</span></p>
          ) : type === 'offered' && ride.passenger ? (
            <p><span className="text-gray-500 text-xs">Passenger:</span> <span className="font-semibold">{ride.passenger.name}</span></p>
          ) : (
            <p className="text-gray-400 text-xs italic">Waiting for booking...</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24 bg-gray-50">
      <header className="px-5 pt-8 pb-4 bg-white shadow-sm">
        <h1 className="text-2xl font-extrabold text-gray-900">
          My <span className="text-orange-500">Rides.</span>
        </h1>
      </header>

      {/* Tabs */}
      <div className="flex w-full bg-white border-b">
        <button
          onClick={() => setActiveTab('booked')}
          className={`flex-1 py-3 text-sm font-bold text-center ${activeTab === 'booked' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500'}`}
        >
          Rides Booked
        </button>
        <button
          onClick={() => setActiveTab('offered')}
          className={`flex-1 py-3 text-sm font-bold text-center ${activeTab === 'offered' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500'}`}
        >
          Rides Offered
        </button>
      </div>

      <main className="px-5 mt-5">
        {loading ? (
          <p className="text-center text-gray-500 font-medium mt-10">Loading your history...</p>
        ) : activeTab === 'booked' ? (
          bookedRides.length > 0 ? (
            bookedRides.map(ride => <RideCard key={ride._id} ride={ride} type="booked" />)
          ) : (
            <p className="text-center text-gray-400 mt-10">No rides booked yet.</p>
          )
        ) : (
          offeredRides.length > 0 ? (
            offeredRides.map(ride => <RideCard key={ride._id} ride={ride} type="offered" />)
          ) : (
            <p className="text-center text-gray-400 mt-10">You haven't offered any rides.</p>
          )
        )}
      </main>
    </div>
  );
};

export default RideHistory;