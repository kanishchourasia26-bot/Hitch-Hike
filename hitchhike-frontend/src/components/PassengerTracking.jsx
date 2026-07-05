import React, { useState, useEffect } from 'react';
import { Marker } from 'react-leaflet';
import { io } from 'socket.io-client';

const socket = io("http://localhost:5000");

const PassengerTracking = ({ rideId }) => {
  const [riderPosition, setRiderPosition] = useState(null);

  useEffect(() => {
    // 1. Ride room join karo
    socket.emit('join-ride', rideId);

    // 2. Location updates suno
    socket.on('location-update', (data) => {
      console.log("Rider moved to:", data.lat, data.lng);
      setRiderPosition([data.lat, data.lng]);
    });

    return () => {
      socket.off('location-update'); // Cleanup
    };
  }, [rideId]);

  // Agar rider position mile, toh map pe marker dikhao
  return riderPosition ? <Marker position={riderPosition} /> : null;
};

export default PassengerTracking;