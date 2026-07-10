import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { io } from 'socket.io-client';
import L from 'leaflet';

// Leaflet ke default icons fix karne ke liye
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Ye ek chhota helper component hai jo map ko ghoomti hui gaadi par focus rakhega
const RecenterAutomatically = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng]);
  return null;
};

const LiveTracking = ({ rideId, isDriver }) => {
  // Default location (India ka center rakha hai, par location aate hi update ho jayega)
  const [position, setPosition] = useState([20.5937, 78.9629]); 
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Backend se connect karo
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    if (!socket) return;

    if (isDriver) {
      // DRIVER LOGIC: GPS se location lo aur Socket ke through bhejo
      const watchId = navigator.geolocation.watchPosition(
        (loc) => {
          const { latitude, longitude } = loc.coords;
          setPosition([latitude, longitude]);
          
          // Backend ko apni nayi location bhejo
          socket.emit('send-location', { 
            rideId, 
            lat: latitude, 
            lng: longitude 
          });
        },
        (err) => console.error(err),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      // PASSENGER LOGIC: Driver ki aati hui location ko receive karo
      socket.on('receive-location', (data) => {
        if (data.rideId === rideId) {
          setPosition([data.lat, data.lng]);
        }
      });

      return () => socket.off('receive-location');
    }
  }, [socket, rideId, isDriver]);

  return (
    <div className="h-64 w-full rounded-xl overflow-hidden border-2 border-orange-200 mt-4 relative z-0">
      {/* Absolute badge to show Live Status */}
      <div className="absolute top-2 right-2 z-[1000] bg-black text-green-400 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        LIVE TRACKING
      </div>

      <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />
        <Marker position={position}>
          <Popup>{isDriver ? 'You are here' : 'Driver is here'}</Popup>
        </Marker>
        <RecenterAutomatically lat={position[0]} lng={position[1]} />
      </MapContainer>
    </div>
  );
};

export default LiveTracking;