const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  type: { type: String, enum: ['1AC', '2AC', '3AC', 'SL', 'CC', '2S'], required: true },
  price: { type: Number, required: true },
  availableSeats: { type: Number, required: true }
}, { _id: false });

const trainSchema = new mongoose.Schema({
  trainNumber: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  source: { type: String, required: true },
  destination: { type: String, required: true },
  timings: {
    departure: { type: String, required: true },
    arrival: { type: String, required: true },
    duration: { type: String, required: true }
  },
  classes: [classSchema],
  daysOfRun: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Train', trainSchema);
