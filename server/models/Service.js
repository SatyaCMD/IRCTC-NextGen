const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }, // 'Train', 'Flight', 'Hotel', 'Food', 'Package'
  status: { type: String, enum: ['Active', 'Maintenance', 'Disabled'], default: 'Active' },
  revenue: { type: Number, default: 0 },
  description: { type: String },
  imgUrl: { type: String },
  fullDetails: { type: String },
  highlights: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
