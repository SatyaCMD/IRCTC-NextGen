const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  maintenanceMode: { type: Boolean, default: false },
  aiAssistant: { type: Boolean, default: true },
  bookingCommission: { type: Number, default: 5 }
});

module.exports = mongoose.model('Settings', settingsSchema);
