const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['User', 'Admin'], default: 'User' },
  accountType: { type: String, enum: ['User', 'Employee'], default: 'User' },
  employeeId: String,
  employeeImage: String,
  isEmployeeVerified: { type: Boolean, default: false },
  employeeSubmittedAt: { type: Date, default: null },
  status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' },
  preferences: {
    age: { type: Number },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    travelHabits: { type: String }
  },
  dob: String,
  address: String,
  state: String,
  pincode: String,
  loyaltyPoints: { type: Number, default: 0 }, 
  walletBalance: { type: Number, default: 0 },
  walletTransactions: [{
    amount: Number,
    type: { type: String, enum: ['Credit', 'Debit'] },
    description: String,
    date: { type: Date, default: Date.now },
    referenceId: String
  }],
  kycStatus: { type: Boolean, default: false },
  kycSubmittedAt: { type: Date, default: null },
  kycUpdatedAt: { type: Date, default: null },
  kycDetails: {
    documentType: String,
    documentNumber: String,
    documentImage: String
  },
  phone: String,
  loginOtp: String,
  loginOtpExpiry: Date,
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpiry: Date
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
