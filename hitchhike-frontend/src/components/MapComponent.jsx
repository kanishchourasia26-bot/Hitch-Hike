import React, { useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';

// ==========================================
// NAYA COMPONENT: Map ke upar Blue Line draw karne ke liye
// ==========================================
const RoutePolyline = ({ routePoints }) => {
  const map = useMap(); // Ye map ka current instance nikalta hai

  useEffect(() => {
    if (!map || !routePoints || routePoints.length === 0) return;

    // OSRM ke [lng, lat] format ko Google Maps ke {lat, lng} format mein badlo
    const path = routePoints.map(point => ({ lat: point[1], lng: point[0] }));

    // Google Maps ka Polyline (Blue Line) object banao
    const polyline = new window.google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: '#3b82f6', // Ekdum chamakti hui Blue line
      strokeOpacity: 0.8,
      strokeWeight: 5, // Line ki motai
    });

    polyline.setMap(map); // Line ko map par chipka do

    // Cleanup: Agar user reset dabaye toh purani line hata do
    return () => {
      polyline.setMap(null);
    };
  }, [map, routePoints]);

  return null;
};

// ==========================================
// MAIN MAP COMPONENT
// ==========================================
const MapComponent = ({ pickup, drop, onMapClick, routePoints }) => {
  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
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

        {/* NAYA LOGIC: Agar route points aate hain, toh blue line draw karo */}
        {routePoints && <RoutePolyline routePoints={routePoints} />}
      </Map>
    </APIProvider>
  );
};

export default MapComponent;