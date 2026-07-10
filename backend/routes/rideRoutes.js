const express = require('express');
const router = express.Router();

// YAHAN MAINE 'rateRide' KO ADD KAR DIYA HAI 👇
const { 
  createRide, 
  searchRides, 
  getRideById, 
  bookRide, 
  getMyRides, 
  updateRideStatus, 
  rateRide 
} = require('../controllers/rideController');

const { protect } = require('../middleware/authMiddleware');

// @route  POST /api/rides
router.post('/', protect, createRide);

// @route  POST /api/rides/search
router.post('/search', protect, searchRides);

// @route  POST /api/rides/book
router.post('/book', protect, bookRide);

// @route  GET /api/rides/my-rides
// IMPORTANT: Isko /:id se pehle rakhna!
router.get('/my-rides', protect, getMyRides);

// @route  GET /api/rides/:id
router.get('/:id', protect, getRideById);

// @route  PUT /api/rides/:id/status
router.put('/:id/status', protect, updateRideStatus);

// @route  POST /api/rides/:id/rate
// Rate a ride
router.post('/:id/rate', protect, rateRide);

module.exports = router;