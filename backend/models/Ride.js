const mongoose = require('mongoose');

// Reusable GeoJSON Point sub-schema
const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      // [longitude, latitude] - GeoJSON order, NOT [lat, lng]
      type: [Number],
      required: true,
      validate: {
        validator: function (coords) {
          return (
            Array.isArray(coords) &&
            coords.length === 2 &&
            coords[0] >= -180 &&
            coords[0] <= 180 &&
            coords[1] >= -90 &&
            coords[1] <= 90
          );
        },
        message: 'Coordinates must be a valid [longitude, latitude] pair',
      },
    },
    address: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const rideSchema = new mongoose.Schema(
  {
    publisher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
   // Purana status field:
  status: {
    type: String,
    enum: ['published', 'booked', 'active', 'completed', 'cancelled'],
    default: 'published',
  },
  // NAYA LOGIC: Rating aur Review add karo
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    trim: true
  },
    startPoint: {
      type: pointSchema,
      required: true,
    },
    endPoint: {
      type: pointSchema,
      required: true,
    },
    farePerKm: {
      type: Number,
      required: false,
      min: 0,
    },
    expectedDistance: {
      type: Number,
      required: false,
      min: 0,
    },
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    startTime: {
      type: Date,
      required: true,
    },
   
routePath: {
  type: {
    type: String,
    enum: ['LineString'],
    default: 'LineString'
  },
  coordinates: {
    type: [[Number]], 
    required: true
  }
},
  },
  {
    timestamps: true,
  }
);

// Critical: 2dsphere indexes to enable future radius-based ($near / $geoWithin) searching
rideSchema.index({ startPoint: '2dsphere' });
rideSchema.index({ endPoint: '2dsphere' });
rideSchema.index({ routePath: '2dsphere' }); // LineString par spatial index lagaya
module.exports = mongoose.model('Ride', rideSchema);