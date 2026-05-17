const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['User', 'Admin'], default: 'User' },
  status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' },
  preferences: {
    age: { type: Number },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    travelHabits: { type: String }
  },
  loyaltyPoints: { type: Number, default: 150 }, // Give new users 150 points bonus
  walletBalance: { type: Number, default: 0 },
  walletTransactions: [{
    amount: Number,
    type: { type: String, enum: ['Credit', 'Debit'] },
    description: String,
    date: { type: Date, default: Date.now },
    referenceId: String
  }]
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
