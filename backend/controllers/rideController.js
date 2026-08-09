const Ride = require('../models/Ride');
const User = require('../models/User'); 

// ==========================================
// GLOBAL CONFIG & HELPERS
// ==========================================
const JABALPUR_CENTER = { lat: 23.1815, lng: 79.9864 };
const MAX_CITY_RADIUS_KM = 20; 

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; 
};

/**
 * @route   POST /api/rides
 * @desc    Commuter publishes a permanent recurring daily commute
 */
const createRide = async (req, res) => {
  try {
    const { startPoint, endPoint, days, reachTime, vehicleName, womenOnly, routePoints, expectedDistance } = req.body;

    if (!startPoint?.coordinates || !endPoint?.coordinates) {
      return res.status(400).json({
        message: 'startPoint and endPoint are required as [lng, lat]',
      });
    }

    if (!days || !Array.isArray(days) || days.length === 0) {
      return res.status(400).json({ message: 'Please select at least one commute day (e.g. mon, tue).' });
    }

    if (!reachTime) {
      return res.status(400).json({ message: 'Reach time is required.' });
    }

    if (!routePoints || !Array.isArray(routePoints) || routePoints.length === 0) {
      return res.status(400).json({ message: 'Route path points are required.' });
    }

    // Geofence check inside Jabalpur bounds
    const startDist = calculateDistance(JABALPUR_CENTER.lat, JABALPUR_CENTER.lng, startPoint.coordinates[1], startPoint.coordinates[0]);
    const endDist = calculateDistance(JABALPUR_CENTER.lat, JABALPUR_CENTER.lng, endPoint.coordinates[1], endPoint.coordinates[0]);

    if (startDist > MAX_CITY_RADIUS_KM || endDist > MAX_CITY_RADIUS_KM) {
      return res.status(400).json({ message: 'Sorry! Locations must be within Jabalpur service area (20km limit).' });
    }

    const commute = await Ride.create({
      publisher: req.user._id,
      startPoint: {
        type: 'Point',
        coordinates: startPoint.coordinates,
        address: startPoint.address,
      },
      endPoint: {
        type: 'Point',
        coordinates: endPoint.coordinates,
        address: endPoint.address,
      },
      routePath: {
        type: 'LineString',
        coordinates: routePoints 
      },
      days,
      reachTime,
      vehicleName: vehicleName || 'Commuter Vehicle',
      womenOnly: womenOnly || false,
      farePerKm: 6,         
      expectedDistance: expectedDistance || 0,  
      status: 'active'
    });

    return res.status(201).json({
      message: 'Daily commute published successfully and will remain active until you delete it!',
      commute,
    });
  } catch (error) {
    console.error(`createRide error: ${error.message}`);
    return res.status(500).json({ message: 'Server error while publishing commute' });
  }
};

/**
 * @route   POST /api/rides/search
 * @desc    Match peer commutes along the route, filtering by days and time
 */
const searchRides = async (req, res) => {
  try {
    const { startLng, startLat, endLng, endLat, radiusInKm, days, reachTime, womenOnly } = req.body;

    if (!startLng || !startLat || !endLng || !endLat || !radiusInKm) {
      return res.status(400).json({ message: 'Pickup, drop coordinates and radius are required.' });
    }

    const startLngNum = parseFloat(startLng);
    const startLatNum = parseFloat(startLat);
    const endLngNum = parseFloat(endLng);
    const endLatNum = parseFloat(endLat);
    const radiusKmNum = parseFloat(radiusInKm);

    const searchRadiusInMeters = radiusKmNum * 1000;

    // Build filter query
    let query = { status: 'active' };
    
    if (womenOnly === true) {
      query.womenOnly = true;
    }

    // Find active commutes passing near the pickup point
    const matchingCommutes = await Ride.find(query)
      .populate('publisher', 'name phone kycVerified reliabilityScore')
      .sort({ createdAt: -1 });

    const validCommutes = matchingCommutes.map((ride) => {
      // Day matching check: Check if at least one day overlaps
      const rideDays = ride.days || [];
      const userDays = days || [];
      const hasDayOverlap = userDays.length === 0 || rideDays.some(d => userDays.includes(d));

      if (!hasDayOverlap) return null;

      let closestStartIdx = -1;
      let minStartDist = Infinity;
      let closestEndIdx = -1;
      let minEndDist = Infinity;

      ride.routePath.coordinates.forEach((coord, index) => {
        const distToStart = calculateDistance(startLatNum, startLngNum, coord[1], coord[0]);
        if (distToStart < minStartDist) {
          minStartDist = distToStart;
          closestStartIdx = index;
        }

        const distToEnd = calculateDistance(endLatNum, endLngNum, coord[1], coord[0]);
        if (distToEnd < minEndDist) {
          minEndDist = distToEnd;
          closestEndIdx = index;
        }
      });

      const isPickupNearRoute = minStartDist <= radiusKmNum;
      const isDropoffNearRoute = minEndDist <= radiusKmNum;
      const isCorrectDirection = closestStartIdx < closestEndIdx;

      if (isPickupNearRoute && isDropoffNearRoute && isCorrectDirection) {
        return {
          ...ride.toObject(),
          matchStartDist: minStartDist,
          matchEndDist: minEndDist
        };
      }
      return null;
    }).filter(ride => ride !== null);

    return res.status(200).json({
      count: validCommutes.length,
      rides: validCommutes,
    });
  } catch (error) {
    console.error(`searchRides error: ${error.message}`);
    return res.status(500).json({ message: 'Server error while searching commutes' });
  }
};

/**
 * @route   GET /api/rides/my-rides
 * @desc    Get user's offered permanent commutes and joined seats
 */
const getMyRides = async (req, res) => {
  try {
    const userId = req.user._id;

    const offeredRides = await Ride.find({ publisher: userId })
      .populate('passengers.user', 'name phone') 
      .sort({ createdAt: -1 });

    const bookedRides = await Ride.find({ 'passengers.user': userId })
      .populate('publisher', 'name phone reliabilityScore') 
      .sort({ createdAt: -1 });

    return res.status(200).json({
      offeredRides,
      bookedRides
    });
  } catch (error) {
    console.error(`getMyRides error: ${error.message}`);
    return res.status(500).json({ message: 'Server error while fetching my commutes' });
  }
};

/**
 * @route   DELETE /api/rides/:id
 * @desc    Commuter deletes their active offered commute
 */
const deleteRide = async (req, res) => {
  try {
    const rideId = req.params.id;
    const userId = req.user._id.toString();

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Commute not found' });
    }

    if (ride.publisher.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this commute.' });
    }

    await Ride.findByIdAndDelete(rideId);

    return res.status(200).json({ message: 'Commute deleted permanently from the network.' });
  } catch (error) {
    console.error(`deleteRide error: ${error.message}`);
    return res.status(500).json({ message: 'Server error while deleting commute' });
  }
};

/**
 * @route   POST /api/rides/book
 * @desc    Join a peer's commute
 */
const bookRide = async (req, res) => {
  try {
    const { rideId, passengers } = req.body;
    const passengerId = req.user._id; 

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ error: 'Commute not found' });
    }

    if (ride.publisher.toString() === passengerId.toString()) {
      return res.status(400).json({ error: 'You cannot join your own commute.' });
    }

    // Check if user already joined
    const alreadyJoined = ride.passengers.some(p => p.user.toString() === passengerId.toString());
    if (alreadyJoined) {
      return res.status(400).json({ error: 'Aapne pehle hi is commute ko join kar liya hai!' });
    }

    ride.passengers.push({
      user: passengerId,
      seatsBooked: passengers || 1
    });

    await ride.save();

    return res.status(200).json({ message: 'Commute joined successfully!', ride });
  } catch (error) {
    console.error(`bookRide error: ${error.message}`);
    return res.status(500).json({ error: 'Server error while joining commute' });
  }
};

const getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).populate(
      'publisher',
      'name phone reliabilityScore kycVerified'
    );

    if (!ride) {
      return res.status(404).json({ message: 'Commute not found' });
    }

    return res.status(200).json({ ride });
  } catch (error) {
    console.error(`getRideById error: ${error.message}`);
    return res.status(500).json({ message: 'Server error while fetching commute' });
  }
};
module.exports = {
  createRide,
  searchRides,
  getMyRides,
  deleteRide,
  getRideById,
  bookRide
};