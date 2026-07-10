const Ride = require('../models/Ride');
const User = require('../models/User'); 

// ==========================================
// GLOBAL CONFIG & HELPERS
// ==========================================
const JABALPUR_CENTER = { lat: 23.1815, lng: 79.9864 };
const MAX_CITY_RADIUS_KM = 20; // 20 km ke bahar ki ride cancel
const EARTH_RADIUS_KM = 6378.1;

// Haversine Formula for Distance Calculation
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Dharti ka radius kilometers mein
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Ye kilometers mein distance dega
};

/**
 * @route   POST /api/rides
 * @desc    Rider publishes a new ride (Geofenced, Path Saved, No Schedule Clash)
 * @access  Private (protected)
 */
const createRide = async (req, res) => {
  try {
    const { startPoint, endPoint, startTime, availableSeats, routePoints } = req.body;

    // --- Validation ---
    if (!startPoint?.coordinates || !endPoint?.coordinates) {
      return res.status(400).json({
        message: 'startPoint and endPoint are required, each as { coordinates: [lng, lat] }',
      });
    }

    if (!startTime) {
      return res.status(400).json({ message: 'startTime is required' });
    }

    if (!routePoints || !Array.isArray(routePoints) || routePoints.length === 0) {
      return res.status(400).json({
        message: 'routePoints array is required to map the exact road path.',
      });
    }

    const isValidCoordPair = (coords) =>
      Array.isArray(coords) &&
      coords.length === 2 &&
      coords[0] >= -180 &&
      coords[0] <= 180 &&
      coords[1] >= -90 &&
      coords[1] <= 90;

    if (!isValidCoordPair(startPoint.coordinates) || !isValidCoordPair(endPoint.coordinates)) {
      return res.status(400).json({
        message: 'Coordinates must be valid [longitude, latitude] pairs',
      });
    }

    // ==========================================
    // 1. TIME TRAVEL BOUNDARY (No Past Rides) ⏳
    // ==========================================
    const proposedStartTime = new Date(startTime);
    if (proposedStartTime < new Date()) {
      return res.status(400).json({ 
        message: 'Bhai, time travel possible nahi hai! Please select a future time for the ride.' 
      });
    }

    // ==========================================
    // 2. GEOFENCING FOR JABALPUR ONLY
    // ==========================================
    const startDistanceFromCenter = calculateDistance(
      JABALPUR_CENTER.lat, JABALPUR_CENTER.lng,
      startPoint.coordinates[1], startPoint.coordinates[0] 
    );
    
    const endDistanceFromCenter = calculateDistance(
      JABALPUR_CENTER.lat, JABALPUR_CENTER.lng,
      endPoint.coordinates[1], endPoint.coordinates[0]
    );

    if (startDistanceFromCenter > MAX_CITY_RADIUS_KM) {
      return res.status(400).json({ 
        message: 'Sorry! Pickup location is outside our Jabalpur service area (20km limit).' 
      });
    }

    if (endDistanceFromCenter > MAX_CITY_RADIUS_KM) {
      return res.status(400).json({ 
        message: 'Sorry! Drop location is outside our Jabalpur service area (20km limit).' 
      });
    }

    // ==========================================
    // 3. DRIVER SCHEDULE CLASH LOCK 🕒
    // ==========================================
    const twoHoursInMs = 2 * 60 * 60 * 1000; // 2 Ghante ms mein

    const overlappingRide = await Ride.findOne({
      publisher: req.user._id,
      status: { $in: ['published', 'booked', 'active'] }, 
      startTime: {
        $gte: new Date(proposedStartTime.getTime() - twoHoursInMs),
        $lte: new Date(proposedStartTime.getTime() + twoHoursInMs)
      }
    });

    if (overlappingRide) {
      return res.status(400).json({ 
        message: 'Aapki is waqt ke aas-paas pehle se ek ride scheduled hai! Do rides ke beech kam se kam 2 ghante ka gap rakhein.' 
      });
    }

    // --- Create Ride ---
    const ride = await Ride.create({
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
      startTime,
      availableSeats: availableSeats || 1,
      farePerKm: 6,         
      expectedDistance: req.body.expectedDistance || 0,  
      status: 'published'
    });

    return res.status(201).json({
      message: 'Ride published successfully with complete route path!',
      ride,
    });
  } catch (error) {
    console.error(`createRide error: ${error.message}`);
    return res.status(500).json({ message: 'Server error while creating ride' });
  }
};

/**
 * @route   POST /api/rides/search
 * @desc    CORE MATCHMAKING ENGINE (Along-the-route matching with direction check)
 * @access  Private (protected)
 */
const searchRides = async (req, res) => {
  try {
    const { startLng, startLat, endLng, endLat, radiusInKm } = req.body;

    if (!startLng || !startLat || !endLng || !endLat || !radiusInKm) {
      return res.status(400).json({
        message: 'startLng, startLat, endLng, endLat and radiusInKm are all required',
      });
    }

    const startLngNum = parseFloat(startLng);
    const startLatNum = parseFloat(startLat);
    const endLngNum = parseFloat(endLng);
    const endLatNum = parseFloat(endLat);
    const radiusKmNum = parseFloat(radiusInKm);

    if ([startLngNum, startLatNum, endLngNum, endLatNum, radiusKmNum].some((n) => Number.isNaN(n))) {
      return res.status(400).json({ message: 'All coordinate and radius values must be numbers' });
    }

    if (radiusKmNum <= 0) {
      return res.status(400).json({ message: 'radiusInKm must be a positive number' });
    }

    const searchRadiusInMeters = radiusKmNum * 1000;

    // STEP 1: MONGODB SPATIAL QUERY
    const ridesNearPickup = await Ride.find({
      status: 'published',
      startTime: { $gte: new Date() },
      routePath: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [startLngNum, startLatNum],
          },
          $maxDistance: searchRadiusInMeters,
        },
      },
    })
      .populate('publisher', 'name phone reliabilityScore isAadhaarVerified isDlVerified')
      .sort({ startTime: 1 });

    // STEP 2: JAVASCRIPT DIRECTION & DROP-OFF FILTER
    const validRides = ridesNearPickup.filter((ride) => {
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

      const isDropoffNearRoute = minEndDist <= radiusKmNum;
      const isCorrectDirection = closestStartIdx < closestEndIdx;

      return isDropoffNearRoute && isCorrectDirection;
    });

    return res.status(200).json({
      count: validRides.length,
      rides: validRides,
    });
  } catch (error) {
    console.error(`searchRides error: ${error.message}`);
    return res.status(500).json({ message: 'Server error while searching rides' });
  }
};

/**
 * @route   GET /api/rides/my-rides
 * @desc    Get rides offered and booked by the logged-in user (With Auto-Expiry)
 * @access  Private
 */
const getMyRides = async (req, res) => {
  try {
    const userId = req.user._id;

    let offeredRides = await Ride.find({ publisher: userId })
      .populate('passenger', 'name phone') 
      .sort({ startTime: -1 });

    offeredRides = offeredRides.map(ride => {
      const rideObj = ride.toObject(); 
      if (rideObj.status === 'published' && new Date(rideObj.startTime) < new Date()) {
        rideObj.status = 'expired'; 
      }
      return rideObj;
    });

    const bookedRides = await Ride.find({ passenger: userId })
      .populate('publisher', 'name phone reliabilityScore') 
      .sort({ startTime: -1 });

    return res.status(200).json({
      offeredRides,
      bookedRides
    });
  } catch (error) {
    console.error(`getMyRides error: ${error.message}`);
    return res.status(500).json({ message: 'Server error while fetching my rides' });
  }
};

/**
 * @route   GET /api/rides/:id
 * @desc    Get a single ride by id
 * @access  Private (protected)
 */
const getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).populate(
      'publisher',
      'name phone reliabilityScore isAadhaarVerified isDlVerified'
    );

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    return res.status(200).json({ ride });
  } catch (error) {
    console.error(`getRideById error: ${error.message}`);
    return res.status(500).json({ message: 'Server error while fetching ride' });
  }
};

/**
 * @route   POST /api/rides/book
 * @desc    Book a ride (With Active Trip Lock)
 * @access  Private
 */
const bookRide = async (req, res) => {
  try {
    const { rideId } = req.body;
    const passengerId = req.user._id; 

    const existingActiveRide = await Ride.findOne({
      passenger: passengerId,
      status: { $in: ['booked', 'active'] } 
    });

    if (existingActiveRide) {
      return res.status(400).json({ 
        error: 'Aapki pehle se ek ride chal rahi hai! Nayi ride book karne ke liye purani ride ko complete ya cancel karein.' 
      });
    }

    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (ride.status !== 'published') {
      return res.status(400).json({ error: 'This ride is no longer available (already booked or cancelled).' });
    }

    if (ride.publisher.toString() === passengerId.toString()) {
      return res.status(400).json({ error: 'You cannot book the ride you published.' });
    }

    ride.passenger = passengerId;
    ride.status = 'booked'; 
    await ride.save();

    return res.status(200).json({ message: 'Ride booked successfully', ride });
  } catch (error) {
    console.error(`bookRide error: ${error.message}`);
    return res.status(500).json({ error: 'Server error while booking the ride' });
  }
};

/**
 * @route   PUT /api/rides/:id/status
 * @desc    Update ride status & Process Dynamic Wallet Payment
 * @access  Private (protected)
 */
const updateRideStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const rideId = req.params.id;
    const userId = req.user._id.toString();

    if (!['active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Can only be active, completed or cancelled.' });
    }

    const ride = await Ride.findById(rideId).populate('publisher').populate('passenger');
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    const isPublisher = ride.publisher._id.toString() === userId;
    const isPassenger = ride.passenger ? ride.passenger._id.toString() === userId : false;

    if (!isPublisher && !isPassenger) {
      return res.status(403).json({ message: 'Not authorized to update this ride.' });
    }

    if ((status === 'active' || status === 'completed') && !isPublisher) {
      return res.status(403).json({ message: 'Only the driver can mark the ride as active or completed.' });
    }

    // DYNAMIC DISTANCE & WALLET PAYMENT
    if (status === 'completed' && ride.status !== 'completed') {
      let finalFare = 50; 

      if (ride.startPoint?.coordinates && ride.endPoint?.coordinates) {
        const startLng = ride.startPoint.coordinates[0];
        const startLat = ride.startPoint.coordinates[1];
        const endLng = ride.endPoint.coordinates[0];
        const endLat = ride.endPoint.coordinates[1];

        const distanceKm = calculateDistance(startLat, startLng, endLat, endLng);
        finalFare = Math.round(distanceKm * 6);
        if (finalFare < 20) finalFare = 20; 
      }
      
      if (ride.passenger && ride.publisher) {
        const passenger = await User.findById(ride.passenger._id);
        const driver = await User.findById(ride.publisher._id);

        if (passenger.walletBalance < finalFare) {
          return res.status(400).json({ message: `Passenger has insufficient balance! Need ₹${finalFare} for the distance covered.` });
        }

        passenger.walletBalance -= finalFare;
        driver.walletBalance += finalFare;

        await passenger.save();
        await driver.save();
        
        console.log(`✅ Payment Successful: ₹${finalFare} transferred dynamically based on distance!`);
      }
    }

    ride.status = status;
    await ride.save();

    return res.status(200).json({ 
      message: `Ride successfully marked as ${status}`, 
      ride 
    });

  } catch (error) {
    console.error(`updateRideStatus error: ${error.message}`);
    return res.status(500).json({ message: 'Server error while updating ride status' });
  }
};

/**
 * @route   POST /api/rides/:id/rate
 * @desc    Rate a completed ride (Passenger rates Driver)
 * @access  Private
 */
const rateRide = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const rideId = req.params.id;
    const userId = req.user._id.toString();

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Please provide a valid rating between 1 and 5.' });
    }

    const ride = await Ride.findById(rideId).populate('publisher');
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.passenger?.toString() !== userId) {
      return res.status(403).json({ message: 'Only the passenger can rate this ride.' });
    }

    if (ride.status !== 'completed') {
      return res.status(400).json({ message: 'You can only rate completed rides.' });
    }

    if (ride.rating) {
      return res.status(400).json({ message: 'You have already rated this ride.' });
    }

    ride.rating = rating;
    ride.review = review || '';
    await ride.save();

    const driver = ride.publisher;
    if (rating >= 4 && driver.reliabilityScore < 100) {
      driver.reliabilityScore = Math.min(100, driver.reliabilityScore + 2); 
    } else if (rating <= 2 && driver.reliabilityScore > 0) {
      driver.reliabilityScore = Math.max(0, driver.reliabilityScore - 5); 
    }
    await driver.save();

    return res.status(200).json({ message: 'Review submitted successfully!', ride });
  } catch (error) {
    console.error(`rateRide error: ${error.message}`);
    return res.status(500).json({ message: 'Server error while submitting rating' });
  }
};

module.exports = {
  createRide,
  searchRides,
  getMyRides,
  getRideById,
  bookRide,
  updateRideStatus,
  rateRide 
};