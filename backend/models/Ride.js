const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema(
  {
    publisher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // NAYA: Ab multiple passengers join kar sakte hain
    passengers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        seatsBooked: {
          type: Number,
          default: 1,
        }
      }
    ],
    startPoint: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], required: true },
      address: String,
    },
    endPoint: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], required: true },
      address: String,
    },
    routePath: {
      type: { type: String, default: 'LineString' },
      coordinates: { type: [[Number]], required: true },
    },
    
    // NAYA LOGIC: Daily Commute ke liye 'days' aur 'reachTime'
    days: [
      {
        type: String, 
        required: true 
      }
    ],
    reachTime: {
      type: String,
      required: true,
    },
    vehicleName: {
      type: String,
      default: 'Commuter Vehicle'
    },
    womenOnly: {
      type: Boolean,
      default: false
    },
    
    farePerKm: {
      type: Number,
      default: 6,
    },
    expectedDistance: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'completed'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Indexes for GeoSpatial queries
rideSchema.index({ startPoint: '2dsphere' });
rideSchema.index({ endPoint: '2dsphere' });
rideSchema.index({ routePath: '2dsphere' });

module.exports = mongoose.model('Ride', rideSchema);