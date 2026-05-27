const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // req.user is populated by authMiddleware
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Access denied. Authentication required.' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    req.adminUser = user; // Attach the admin user document if needed later
    next();
  } catch (error) {
    console.error('Admin Authorization Error:', error);
    res.status(500).json({ error: 'Internal server authorization error.' });
  }
};
