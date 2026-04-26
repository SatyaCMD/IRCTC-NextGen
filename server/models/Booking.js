const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trainId: { type: mongoose.Schema.Types.ObjectId, ref: 'Train', required: true },
  trainClass: { type: String, required: true },
  passengers: [passengerSchema],
  seatNumbers: [{ type: String }],
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled'], default: 'Pending' },
  paymentId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
