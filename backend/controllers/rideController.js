const Ride = require('../models/Ride');

const EARTH_RADIUS_KM = 6378.1;
/**
 * @route   POST /api/rides
 * @desc    Rider publishes a new ride
 * @access  Private (protected)
 */
const createRide = async (req, res) => {
  try {
    // NAYA LOGIC: Yahan se farePerKm aur expectedDistance hata diya
    const { startPoint, endPoint, startTime, availableSeats } = req.body;

    // --- Validation ---
    if (!startPoint?.coordinates || !endPoint?.coordinates) {
      return res.status(400).json({
        message: 'startPoint and endPoint are required, each as { coordinates: [lng, lat] }',
      });
    }

    if (!startTime) {
      return res.status(400).json({ message: 'startTime is required' });
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

    // --- Create Ride (Fixed 6 Rs/km) ---
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
  startTime,
  availableSeats: availableSeats || 1, // Agar availableSeats model mein hai
  farePerKm: 6,         // Hardcoded default
  expectedDistance: 0,  // Hardcoded default
  status: 'published'
});
    return res.status(201).json({
      message: 'Ride published successfully',
      ride,
    });
  } catch (error) {
    console.error(`createRide error: ${error.message}`);
    return res.status(500).json({ message: 'Server error while creating ride' });
  }
};
/**
 * @route   POST /api/rides/search
 * @desc    CORE MATCHMAKING ENGINE.
 *          Finds published rides where the ride's startPoint is within radius.
 * @access  Private (protected)
 */
const searchRides = async (req, res) => {
  try {
    const { startLng, startLat, endLng, endLat, radiusInKm } = req.body;

    // --- Validation ---
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

    if (
      [startLngNum, startLatNum, endLngNum, endLatNum, radiusKmNum].some((n) => Number.isNaN(n))
    ) {
      return res.status(400).json({ message: 'All coordinate and radius values must be numbers' });
    }

    if (radiusKmNum <= 0) {
      return res.status(400).json({ message: 'radiusInKm must be a positive number' });
    }

    // $centerSphere expects the radius in radians: distance(km) / earthRadius(km)
    const radiusInRadians = radiusKmNum / EARTH_RADIUS_KM;

    const matchingRides = await Ride.find({
      status: 'published',
      startPoint: {
        $geoWithin: {
          $centerSphere: [[startLngNum, startLatNum], radiusInRadians],
        },
      },
      endPoint: {
        $geoWithin: {
          $centerSphere: [[endLngNum, endLatNum], radiusInRadians],
        },
      },
    })
      .populate('publisher', 'name phone reliabilityScore isAadhaarVerified isDLVerified')
      .sort({ startTime: 1 });

    return res.status(200).json({
      count: matchingRides.length,
      rides: matchingRides,
    });
  } catch (error) {
    console.error(`searchRides error: ${error.message}`);
    return res.status(500).json({ message: 'Server error while searching rides' });
  }
};

/**
 * @route   GET /api/rides/my-rides
 * @desc    Get rides offered and booked by the logged-in user
 * @access  Private
 */
const getMyRides = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Rides jo user ne OFFER ki hain (User is the publisher)
    const offeredRides = await Ride.find({ publisher: userId })
      .populate('passenger', 'name phone') 
      .sort({ startTime: -1 });

    // 2. Rides jo user ne BOOK ki hain (User is the passenger)
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
      'name phone reliabilityScore isAadhaarVerified isDLVerified'
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
 * @desc    Book a ride
 * @access  Private
 */
const bookRide = async (req, res) => {
  try {
    const { rideId } = req.body;
    const passengerId = req.user._id; 

    // 1. Ride ko database mein dhoondho
    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // 2. Check karo ki ride available hai ya nahi
    if (ride.status !== 'published') {
      return res.status(400).json({ error: 'This ride is no longer available (already booked or cancelled).' });
    }

    // 3. Publisher khud ki ride book na kar le
    if (ride.publisher.toString() === passengerId.toString()) {
      return res.status(400).json({ error: 'You cannot book the ride you published.' });
    }

    // 4. Ride ko update karo
    ride.passenger = passengerId;
    ride.status = 'booked'; 

    // 5. Database mein save karo
    await ride.save();

    return res.status(200).json({ message: 'Ride booked successfully', ride });
  } catch (error) {
    console.error(`bookRide error: ${error.message}`);
    return res.status(500).json({ error: 'Server error while booking the ride' });
  }
};
/**
 * @route   PUT /api/rides/:id/status
 * @desc    Update ride status to 'active', 'completed' or 'cancelled'
 * @access  Private (protected)
 */
const updateRideStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const rideId = req.params.id;
    const userId = req.user._id.toString();

    // 1. NAYA LOGIC: 'active' status ko allow kiya
    if (!['active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Can only be active, completed or cancelled.' });
    }

    // 2. Find the ride
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    const isPublisher = ride.publisher.toString() === userId;
    const isPassenger = ride.passenger ? ride.passenger.toString() === userId : false;

    // 3. Authorization Checks
    if (!isPublisher && !isPassenger) {
      return res.status(403).json({ message: 'Not authorized to update this ride.' });
    }

    // Sirf driver (publisher) hi ride ko 'active' ya 'complete' kar sakta hai
    if ((status === 'active' || status === 'completed') && !isPublisher) {
      return res.status(403).json({ message: 'Only the driver can mark the ride as active or completed.' });
    }

    // 4. Update and Save
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
// EXPORT ALL CONTROLLERS
module.exports = {
  createRide,
  searchRides,
  getMyRides, // Add kiya yahan
  getRideById,
  bookRide,
  updateRideStatus
};