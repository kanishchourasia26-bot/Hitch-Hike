import React, { useState, useEffect } from 'react';
import { Loader2, MapPin, Calendar, Clock, User, CheckCircle, XCircle, Play } from 'lucide-react';
import api from '../services/api_service';

const MyRides = () => {
  const [activeTab, setActiveTab] = useState('booked');
  const [rides, setRides] = useState({ offered: [], booked: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyRides();
  }, []);

  const fetchMyRides = async () => {
    try {
      const response = await api.get('/rides/my-rides');
      setRides({
        offered: response.data.offeredRides,
        booked: response.data.bookedRides
      });
    } catch (error) {
      console.error("Error fetching rides:", error);
      alert("Failed to load your rides.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (rideId, newStatus) => {
    const isConfirmed = window.confirm(`Are you sure you want to mark this ride as ${newStatus.toUpperCase()}?`);
    if (!isConfirmed) return;

    try {
      await api.put(`/rides/${rideId}/status`, { status: newStatus });
      alert(`Ride ${newStatus} successfully!`);
      fetchMyRides();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to update ride status");
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const renderRideCard = (ride, type) => {
    const { day, time } = formatDateTime(ride.startTime);
    const otherPerson = type === 'booked' ? ride.publisher : ride.passenger;
    const isDriver = type === 'offered'; 
    
    return (
      <div key={ride._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
        {/* Status Badge */}
        <div className="flex justify-between items-center mb-4">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
            ride.status === 'published' ? 'bg-blue-100 text-blue-700' :
            ride.status === 'booked' ? 'bg-green-100 text-green-700' :
            ride.status === 'active' ? 'bg-orange-100 text-orange-700' :
            ride.status === 'completed' ? 'bg-gray-800 text-white' :
            'bg-red-100 text-red-700'
          }`}>
            {ride.status.toUpperCase()}
          </span>
          <span className="font-bold text-lg text-gray-900">₹6/km</span>
        </div>

        {/* Locations */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3">
            <MapPin size={16} className="text-green-500" />
            <p className="text-sm font-medium text-gray-800 truncate">{ride.startPoint?.address || 'Pickup Point'}</p>
          </div>
          <div className="flex items-center gap-3">
            <MapPin size={16} className="text-red-500" />
            <p className="text-sm font-medium text-gray-800 truncate">{ride.endPoint?.address || 'Drop Point'}</p>
          </div>
        </div>

        {ride.status === 'booked' && otherPerson && (
          <div className="bg-orange-50 p-3 rounded-xl mb-4 border border-orange-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-orange-500">{isDriver ? 'Passenger' : 'Driver'} Details</p>
              <p className="text-sm font-bold text-gray-900">{otherPerson.name}</p>
            </div>
            <a href={`tel:${otherPerson.phone}`} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-orange-600 transition">CALL</a>
          </div>
        )}
        
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 text-xs text-gray-600 font-medium">
            <div className="flex items-center gap-1"><Calendar size={14}/> {day}</div>
            <div className="flex items-center gap-1"><Clock size={14}/> {time}</div>
          </div>
        </div>

        {/* Action Buttons */}
        {(ride.status === 'published' || ride.status === 'booked' || ride.status === 'active') && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            {ride.status !== 'active' && ride.status !== 'completed' && (
              <button onClick={() => handleUpdateStatus(ride._id, 'cancelled')} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-red-600 bg-red-50 rounded-xl">
                <XCircle size={18} /> CANCEL
              </button>
            )}
            {isDriver && (
              <>
                {ride.status === 'booked' && (
                  <button onClick={() => handleUpdateStatus(ride._id, 'active')} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-blue-600 bg-blue-50 rounded-xl">
                    <Play size={18} /> START
                  </button>
                )}
                {ride.status === 'active' && (
                  <button onClick={() => handleUpdateStatus(ride._id, 'completed')} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-green-600 bg-green-50 rounded-xl">
                    <CheckCircle size={18} /> COMPLETE
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24 bg-gray-50">
      <header className="px-5 pt-8 pb-4">
        <h1 className="text-3xl font-extrabold text-gray-900">My <span className="text-orange-500">Activity.</span></h1>
      </header>

      <div className="px-5 mb-6">
        <div className="flex bg-gray-200 p-1 rounded-xl">
          <button onClick={() => setActiveTab('booked')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'booked' ? 'bg-white shadow-sm' : ''}`}>Booked Rides</button>
          <button onClick={() => setActiveTab('offered')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'offered' ? 'bg-white shadow-sm' : ''}`}>Offered Rides</button>
        </div>
      </div>

      <main className="px-5">
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" size={32} /></div> : (
          <div>
            {activeTab === 'booked' && (rides.booked.length > 0 ? rides.booked.map(ride => renderRideCard(ride, 'booked')) : <p className="text-center text-gray-500 mt-10">No booked rides.</p>)}
            {activeTab === 'offered' && (rides.offered.length > 0 ? rides.offered.map(ride => renderRideCard(ride, 'offered')) : <p className="text-center text-gray-500 mt-10">No offered rides.</p>)}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyRides;