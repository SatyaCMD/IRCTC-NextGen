const User = require('../models/User');
const Booking = require('../models/Booking');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { name, email, password, preferences, accountType, employeeId, employeeImage } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: 'User already exists' });

    user = new User({ 
      name, 
      email, 
      password, 
      preferences,
      accountType: accountType || 'User',
      employeeId,
      employeeImage,
      employeeSubmittedAt: accountType === 'Employee' ? new Date() : null,
      isEmployeeVerified: false
    });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, preferences: user.preferences } });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials ckeck userid and password' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials ckeck userid and password' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, preferences: user.preferences } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    let needsSave = false;
    
    // Check 5-minute approval
    if (!user.kycStatus && user.kycSubmittedAt) {
      const fiveMinsMs = 5 * 60 * 1000;
      if (Date.now() - new Date(user.kycSubmittedAt).getTime() > fiveMinsMs) {
        user.kycStatus = true;
        user.kycUpdatedAt = new Date();
        user.kycSubmittedAt = null;
        needsSave = true;
      }
    }
    
    // Check Employee 5-minute approval
    if (user.accountType === 'Employee' && !user.isEmployeeVerified && user.employeeSubmittedAt) {
      const fiveMinsMs = 5 * 60 * 1000;
      if (Date.now() - new Date(user.employeeSubmittedAt).getTime() > fiveMinsMs) {
        user.isEmployeeVerified = true;
        // Optionally promote to Admin if verified employee?
        // user.role = 'Admin'; 
        needsSave = true;
      }
    }
    
    // Check 6-month expiry
    if (user.kycStatus && user.kycUpdatedAt) {
      const sixMonthsMs = 6 * 30 * 24 * 60 * 60 * 1000; // approx 6 months
      if (Date.now() - new Date(user.kycUpdatedAt).getTime() > sixMonthsMs) {
        user.kycStatus = false;
        needsSave = true;
      }
    }
    
    if (needsSave) {
      await user.save();
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ error: 'Server error during password reset' });
  }
};

exports.addMoneyToWallet = async (req, res) => {
  try {
    const { amount, referenceId } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.walletBalance = (user.walletBalance || 0) + amount;
    user.walletTransactions.push({
      amount,
      type: 'Credit',
      description: 'Wallet Recharge',
      referenceId: referenceId || `RECH${Date.now()}`
    });

    await user.save();
    res.json({ message: 'Wallet recharged successfully', walletBalance: user.walletBalance, transactions: user.walletTransactions });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Check if user has active/future confirmed bookings
    const activeBookings = await Booking.find({ 
      userId, 
      status: 'Confirmed' 
    });

    if (activeBookings && activeBookings.length > 0) {
      return res.status(400).json({ 
        error: 'You are having some active bookings. After completion or cancellation of those, your account will be deleted.' 
      });
    }

    // Delete User
    await User.findByIdAndDelete(userId);
    res.json({ message: 'Account deleted permanently.' });

  } catch (error) {
    console.error('Delete Account Error:', error);
    res.status(500).json({ error: 'Server error during account deletion' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, phone, age, gender, travelHabits, dob, address, state, pincode } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Update only allowed fields (no email change)
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (age) user.preferences.age = age;
    if (gender) user.preferences.gender = gender;
    if (travelHabits) user.preferences.travelHabits = travelHabits;
    if (dob) user.dob = dob;
    if (address) user.address = address;
    if (state) user.state = state;
    if (pincode) user.pincode = pincode;

    await user.save();

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ error: 'Server error during profile update' });
  }
};

exports.updateKYC = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentType, documentNumber, documentImage } = req.body;

    if (!documentType || !documentNumber) {
      return res.status(400).json({ error: 'Document type and number are required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.kycStatus = false;
    user.kycSubmittedAt = new Date();
    user.kycDetails = {
      documentType,
      documentNumber,
      documentImage
    };

    await user.save();

    res.json({ message: 'KYC submitted successfully and is under review.', user });
  } catch (error) {
    console.error('KYC Update Error:', error);
    res.status(500).json({ error: 'Server error during KYC update' });
  }
};
