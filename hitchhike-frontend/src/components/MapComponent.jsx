
import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const MapComponent = ({ pickup, drop, onMapClick }) => {
  // Ensure your .env file has: VITE_GOOGLE_MAPS_API_KEY=...
  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Jabalpur Coordinates
  const JABALPUR_CENTER = { lat: 23.168, lng: 79.933 };

  return (
    <APIProvider apiKey={API_KEY}>
      <Map
        style={{ width: '100%', height: '400px', borderRadius: '20px' }}
        defaultCenter={JABALPUR_CENTER}
        defaultZoom={13}
        mapId="HITCHHIKE_MAP_ID"
        onClick={(e) => onMapClick && onMapClick(e.detail.latLng)}
        gestureHandling={'greedy'}
        disableDefaultUI={false}
      >
        {/* Pickup Marker (Green) */}
        {pickup && (
          <AdvancedMarker position={pickup}>
            <Pin background={'#22c55e'} glyphColor={'#fff'} borderColor={'#16a34a'} />
          </AdvancedMarker>
        )}

        {/* Drop Marker (Red) */}
        {drop && (
          <AdvancedMarker position={drop}>
            <Pin background={'#ef4444'} glyphColor={'#fff'} borderColor={'#dc2626'} />
          </AdvancedMarker>
        )}
      </Map>
    </APIProvider>
  );
};

export default MapComponent;