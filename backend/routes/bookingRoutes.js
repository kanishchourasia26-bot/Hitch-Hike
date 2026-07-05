const express = require('express');
const router = express.Router();

// Yahan maine getActiveBooking ko import mein add kar diya hai
const {
  requestBooking,
  acceptBooking,
  startRide,
  endRide,
  getActiveBooking 
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

// @route  POST /api/bookings  (Passenger requests a booking)
router.post('/', protect, requestBooking);

// @route  PATCH /api/bookings/:id/accept  (Rider accepts, OTP generated)
router.patch('/:id/accept', protect, acceptBooking);

// @route  POST /api/bookings/start  (Rider verifies OTP, ride goes active)
router.post('/start', protect, startRide);

// @route  POST /api/bookings/end  (Rider or passenger ends ride, wallet settled)
router.post('/end', protect, endRide);

// @route  GET /api/bookings/active (Get active ride for dashboard)
router.get('/active', protect, getActiveBooking); 

module.exports = router;
