const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  seatPreference: { type: String }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' }, // Could also be Train
  trainId: { type: mongoose.Schema.Types.ObjectId, ref: 'Train' }, // Legacy/trains
  serviceType: { type: String, default: 'Train' }, // 'Train', 'Flight', 'Hotel', etc
  serviceClass: { type: String, required: true }, // TrainClass or RoomType or FlightClass
  quota: { type: String, default: 'General' },
  passengers: [passengerSchema],
  seatNumbers: [{ type: String }],
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled', 'WL', 'RAC', 'Verification Pending'], default: 'Pending' },
  paymentId: { type: String },
  pnr: { type: String },
  distance: { type: Number },
  bookingRef: { type: String, required: true, unique: true },
  commissionAmount: { type: Number, default: 0 },
  journeyDate: { type: String },
  from: { type: String },
  to: { type: String },
  departureTime: { type: String },
  pantryItems: {
    meal: { type: String },
    price: { type: Number }
  },
  orderedItems: [{
    name: { type: String },
    price: { type: Number },
    quantity: { type: Number }
  }],
  refundAmount: { type: Number, default: 0 },
  refundStatus: { type: String, enum: ['None', 'Initiated', 'Completed'], default: 'None' },
  chartPreparedEmailSent: { type: Boolean, default: false },
  bookingConfirmationEmailSent: { type: Boolean, default: false },
  contactInfo: {
    email: { type: String },
    phone: { type: String }
  },
  expireAt: { type: Date }
}, { timestamps: true });

// Auto-delete records 30 days after the journey date
bookingSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Booking', bookingSchema);
