const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' }, // Could also be Train
  trainId: { type: mongoose.Schema.Types.ObjectId, ref: 'Train' }, // Legacy/trains
  serviceType: { type: String, default: 'Train' }, // 'Train', 'Flight', 'Hotel', etc
  serviceClass: { type: String, required: true }, // TrainClass or RoomType or FlightClass
  passengers: [passengerSchema],
  seatNumbers: [{ type: String }],
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled', 'WL', 'RAC'], default: 'Pending' },
  paymentId: { type: String },
  pnr: { type: String },
  bookingRef: { type: String },
  journeyDate: { type: String },
  from: { type: String },
  to: { type: String },
  departureTime: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
