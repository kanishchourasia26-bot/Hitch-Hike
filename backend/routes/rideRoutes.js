const express = require('express');
const router = express.Router();

// SIRF wahi import karo jo naye rideController mein define kiya hai
const { 
  createRide, 
  searchRides, 
  getRideById, 
  bookRide, 
  getMyRides, 
  deleteRide
} = require('../controllers/rideController');

const { protect } = require('../middleware/authMiddleware'); // Agar middleware ka folder 'middlewares' hai toh naam theek kar lena

// @route   POST /api/rides (Offer Commute)
router.post('/', protect, createRide);

// @route   POST /api/rides/search (Find Commutes)
router.post('/search', protect, searchRides);

// @route   POST /api/rides/book (Join Commute)
router.post('/book', protect, bookRide);

// @route   GET /api/rides/my-rides (Dashboard Offered & Booked)
// IMPORTANT: Isko /:id se pehle rakhna zaroori hai!
router.get('/my-rides', protect, getMyRides);

// @route   DELETE /api/rides/:id (Commuter deletes active commute)
router.delete('/:id', protect, deleteRide);

// @route   GET /api/rides/:id (Single ride detail)
router.get('/:id', protect, getRideById);

module.exports = router;