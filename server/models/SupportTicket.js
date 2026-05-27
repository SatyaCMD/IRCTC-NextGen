const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issueType: {
    type: String,
    required: true,
    enum: ['Booking Issue', 'Payment Failure', 'Account Management', 'Technical Error', 'Other']
  },
  description: {
    type: String,
    required: true
  },
  documents: [{
    type: String // URLs or relative paths to the uploaded files
  }],
  status: {
    type: String,
    default: 'Open',
    enum: ['Open', 'Resolved', 'Insufficient Details']
  }
}, { timestamps: true });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
