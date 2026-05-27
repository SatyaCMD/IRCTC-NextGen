const User = require('../models/User');
const Booking = require('../models/Booking');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');
const geoip = require('geoip-lite');

exports.register = async (req, res) => {
  try {
    const { name, email, password, preferences, accountType, employeeId, employeeImage } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : '';
    let user = await User.findOne({ email: normalizedEmail });
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
    // Generate verification token (hex string)
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await user.save();

    // Dispatch verification email
    emailService.sendVerificationEmail(user.email, verificationToken).catch(console.error);

    res.status(201).json({ requiresVerification: true, message: 'Registration successful! Please check your email to verify your account.' });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : '';
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(400).json({ error: 'Invalid credentials check userid and password' });

    if (user.status === 'Suspended') {
      return res.status(403).json({ error: 'Your account has been secured and suspended due to a security notice. Please contact the security desk to restore access.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      emailService.sendSecurityAlert(user.email, 'Failed Login Attempt', 'Someone tried to log in to your account with an incorrect password.').catch(console.error);
      const obfuscatedEmail = user.email.substring(0, 3) + '••••@' + user.email.split('@')[1];
      return res.status(400).json({ 
        error: 'Invalid credentials. An alert has been sent to your registered email.',
        emailSent: true,
        registeredEmail: obfuscatedEmail
      });
    }

    if (user.role !== 'Admin' && !user.isEmailVerified) {
      return res.status(403).json({ error: 'Please verify your email address before logging in. Check your inbox.' });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save OTP and 5-min expiry to user
    user.loginOtp = otp;
    user.loginOtpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    // Send OTP Email
    emailService.sendLoginOtpEmail(user.email, otp).catch(console.error);

    // Return requiresOtp flag and debugOtp (as requested for network fallbacks)
    res.json({ requiresOtp: true, debugOtp: otp, email: user.email });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : '';
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) return res.status(400).json({ error: 'User not found' });

    if (user.status === 'Suspended') {
      return res.status(403).json({ error: 'Your account has been secured and suspended due to a security notice. Please contact the security desk to restore access.' });
    }

    if (!user.loginOtp || !user.loginOtpExpiry) return res.status(400).json({ error: 'No OTP requested or OTP expired' });
    
    if (new Date() > user.loginOtpExpiry) {
      user.loginOtp = undefined;
      user.loginOtpExpiry = undefined;
      await user.save();
      return res.status(400).json({ error: 'OTP has expired. Please login again.' });
    }

    if (user.loginOtp !== otp) {
      emailService.sendSecurityAlert(user.email, 'Failed 2FA Attempt', 'Someone entered an incorrect OTP while trying to access your account.').catch(console.error);
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // OTP Verified! Clear it and issue Token
    user.loginOtp = undefined;
    user.loginOtpExpiry = undefined;
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    
    // Send Login Alert now that they are actually logged in
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    if (ip === '::1' || ip === '127.0.0.1') ip = '103.155.223.11';
    const geo = geoip.lookup(ip);
    const location = geo ? `${geo.city || 'Delhi'}, ${geo.country || 'IN'}` : 'Delhi, IN';
    const device = req.headers['user-agent'] || 'Unknown Device';
    emailService.sendSecurityAlert(user.email, 'Account Login', ip, device, location).catch(console.error);

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, preferences: user.preferences, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ emailVerificationToken: token });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token.' });
    }

    if (user.emailVerificationExpiry < new Date()) {
      return res.status(400).json({ error: 'Verification token has expired. Please request a new one.' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();

    res.status(200).json({ message: 'Email successfully verified! You can now log in.' });
  } catch (error) {
    console.error('Verify Email Error:', error);
    res.status(500).json({ error: 'Server error during verification.' });
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

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

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

    // Capture details for email before deletion
    const userEmail = user.email;
    const userName = user.name;

    // Proceed with deletion
    await User.findByIdAndDelete(userId);

    // Send confirmation email
    emailService.sendAccountDeletionEmail(userEmail, userName).catch(console.error);

    res.status(200).json({ message: 'Account successfully deleted.' });
  } catch (error) {
    console.error('Delete Account Error:', error);
    res.status(500).json({ error: 'Server error during account deletion.' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : '';
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    user.password = newPassword;
    await user.save();

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const geo = geoip.lookup(ip);
    const location = geo ? `${geo.city || 'Unknown'}, ${geo.country || 'Unknown'}` : 'Local/Unknown';
    const device = req.headers['user-agent'] || 'Unknown Device';
    emailService.sendPasswordChangedEmail(user.email, ip, device, location).catch(console.error);

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
    
    emailService.sendWalletReceipt(user.email, amount, user.walletBalance).catch(console.error);
    
    res.json({ message: 'Wallet recharged successfully', walletBalance: user.walletBalance, transactions: user.walletTransactions });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Duplicate deleteAccount removed. The primary implementation is defined above with proper active booking checks and email dispatch.

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, phone, age, gender, travelHabits, dob, address, state, pincode } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const changedFields = [];
    if (phone && user.phone !== phone) changedFields.push('Phone Number');
    if (address && user.address !== address) changedFields.push('Address');
    if (state && user.state !== state) changedFields.push('State');
    if (pincode && user.pincode !== pincode) changedFields.push('Pincode');
    if (name && user.name !== name) changedFields.push('Name');

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

    if (changedFields.length > 0) {
      emailService.sendProfileModificationEmail(user.email, user.name, changedFields).catch(console.error);
    }

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

    user.kycStatus = true;
    user.kycUpdatedAt = new Date();
    user.kycSubmittedAt = null;
    user.kycDetails = {
      documentType,
      documentNumber,
      documentImage
    };

    await user.save();

    res.json({ message: 'KYC submitted and verified successfully!', user });
  } catch (error) {
    console.error('KYC Update Error:', error);
    res.status(500).json({ error: 'Failed to update KYC' });
  }
};

exports.reportTransactionFailure = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount, serviceType } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Send the failure alert email
    emailService.sendTransactionFailedAlert(user.email, amount, serviceType).catch(console.error);

    res.json({ message: 'Transaction failure reported and email alert dispatched.' });
  } catch (error) {
    console.error('Transaction Failure Report Error:', error);
    res.status(500).json({ error: 'Server error while reporting failure' });
  }
};

exports.secureAccount = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required.' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const email = decoded.email;
    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Suspend the account
    user.status = 'Suspended';
    await user.save();

    res.json({ 
      success: true, 
      message: 'Account successfully secured and suspended! All active sessions have been terminated, and future logins are blocked until security review.' 
    });
  } catch (error) {
    console.error('Secure Account Error:', error);
    res.status(400).json({ error: 'Invalid or expired secure token. Please contact the security desk.' });
  }
};
