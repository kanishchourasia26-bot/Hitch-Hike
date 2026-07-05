const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const User = require('../models/User');

/**
 * @desc    Request a ride (Passenger)
 */
const requestBooking = async (req, res) => {
    try {
        const { rideId } = req.body;
        
        // 1. CHECK: Double Booking Prevention
        const activeBooking = await Booking.findOne({
            passenger: req.user.id,
            status: { $in: ['pending', 'confirmed', 'active'] }
        });

        if (activeBooking) {
            return res.status(400).json({ 
                error: 'Aapki pehle se ek ride booking process mein hai. Doosri ride book karne ke liye pehli wali complete ya cancel karein.' 
            });
        }

        // 2. Process Booking
        const ride = await Ride.findById(rideId);
        
        if (!ride || ride.status !== 'published') {
            return res.status(404).json({ error: 'Ride not found or unavailable' });
        }

        const booking = await Booking.create({
            ride: rideId,
            passenger: req.user.id,
            status: 'pending'
        });

        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * @desc    Accept a booking (Rider)
 */
const acceptBooking = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const booking = await Booking.findById(bookingId).populate('ride');

        if (!booking || booking.status !== 'pending') {
            return res.status(400).json({ error: 'Invalid or already processed booking' });
        }

        const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
        
        booking.status = 'confirmed';
        booking.otpCode = otpCode;
        await booking.save();

        await Ride.findByIdAndUpdate(booking.ride._id, { status: 'booked' });

        res.status(200).json({ message: 'Booking confirmed', otpCode });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * @desc    Start ride (Rider verifies OTP)
 */
const startRide = async (req, res) => {
    try {
        const { bookingId, otpCode } = req.body;
        const booking = await Booking.findById(bookingId).populate('ride');

        if (!booking || booking.otpCode !== otpCode) {
            return res.status(400).json({ error: 'Invalid OTP or booking' });
        }

        await Ride.findByIdAndUpdate(booking.ride._id, { status: 'active' });
        res.status(200).json({ message: 'Ride started successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * @desc    End ride & Calculate Fare (Rider)
 */
const endRide = async (req, res) => {
    try {
        const { bookingId, actualTraveledDistance } = req.body;
        const booking = await Booking.findById(bookingId).populate({
            path: 'ride',
            populate: { path: 'publisher' }
        });
        
        const rider = await User.findById(booking.ride.publisher._id);
        const passenger = await User.findById(booking.passenger);

        // Fare Calculation: Using ride.fare as base, or per km if defined
        const finalFare = actualTraveledDistance * 4; 

        if (passenger.walletBalance < finalFare) {
            return res.status(400).json({ error: 'Insufficient wallet balance' });
        }

        passenger.walletBalance -= finalFare;
        rider.walletBalance += finalFare;
        
        await passenger.save();
        await rider.save();
        await Ride.findByIdAndUpdate(booking.ride._id, { status: 'completed' });

        res.status(200).json({ message: 'Ride completed', finalFare });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * @desc    Get Active Booking for the logged-in passenger
 */
const getActiveBooking = async (req, res) => {
    try {
        const booking = await Booking.findOne({
            passenger: req.user.id,
            status: { $in: ['pending', 'confirmed', 'active'] }
        }).populate('ride');
        
        res.status(200).json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { requestBooking, acceptBooking, startRide, endRide, getActiveBooking };
