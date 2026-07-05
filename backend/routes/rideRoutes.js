const express = require('express');
const router = express.Router();
// getMyRides ko import mein add kiya
const { createRide, searchRides, getRideById, bookRide, getMyRides ,updateRideStatus} = require('../controllers/rideController');
const { protect } = require('../middleware/authMiddleware');

// @route  POST /api/rides
router.post('/', protect, createRide);

// @route  POST /api/rides/search
router.post('/search', protect, searchRides);

// @route  POST /api/rides/book
router.post('/book', protect, bookRide);

// @route  GET /api/rides/my-rides (YE NAYA ROUTE HAI)
// IMPORTANT: Isko /:id se pehle rakhna!
router.get('/my-rides', protect, getMyRides);

// @route  GET /api/rides/:id
router.get('/:id', protect, getRideById);
router.put('/:id/status', protect, updateRideStatus);
module.exports = router;