const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: true,
    },
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
    otpCode: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          // Allow null/undefined (not yet generated) or a strict 4-digit code
          return v == null || /^\d{4}$/.test(v);
        },
        message: 'otpCode must be exactly 4 digits',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Prevent the same passenger from double-booking the same ride
bookingSchema.index({ ride: 1, passenger: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);
