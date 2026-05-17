const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  type: { type: String, required: true }, // Removed enum to support Flight/Bus classes
  price: { type: Number, required: true },
  availableSeats: { type: Number, required: true }
}, { _id: false });

const trainSchema = new mongoose.Schema({
  trainNumber: { type: String, required: true }, // Removed unique to prevent mock collisions
  name: { type: String, required: true },
  serviceType: { type: String, default: 'Train' },
  source: { type: String, required: true },
  destination: { type: String, required: true },
  timings: {
    departure: { type: String, required: true },
    arrival: { type: String, required: true },
    duration: { type: String, required: true }
  },
  classes: [classSchema],
  daysOfRun: [{ type: String }],
  image: { type: String },
  description: { type: String },
  rating: { type: Number },
  reviews: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Train', trainSchema);
