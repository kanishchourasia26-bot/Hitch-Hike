export const calculateDistanceAndFare = async (startLng, startLat, endLng, endLat) => {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=false`
    );
    const data = await response.json();

    if (data.code === 'Ok') {
      const distanceInKm = data.routes[0].distance / 1000;
      const RATE_PER_KM = 6; // Fixed Rate
      const totalFare = Math.round(distanceInKm * RATE_PER_KM);
      
      return { 
        success: true, 
        distance: distanceInKm.toFixed(1),
        fare: totalFare 
      };
    }
    return { success: false };
  } catch (error) {
    return { success: false };
  }
};