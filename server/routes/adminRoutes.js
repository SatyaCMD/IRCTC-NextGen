const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Settings = require('../models/Settings');

// GET all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// UPDATE user role/status
router.put('/users/:id', async (req, res) => {
  try {
    const { role, status, name, email } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role, status, name, email }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE user
router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// GET all services
router.get('/services', async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// CREATE service
router.post('/services', async (req, res) => {
  try {
    const service = new Service(req.body);
    await service.save();
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// UPDATE service
router.put('/services/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// GET all bookings
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeServices = await Service.countDocuments({ status: 'Active' });
    const totalBookings = await Booking.countDocuments();
    // Dummy aggregate for revenue
    const revenue = await Booking.aggregate([{ $group: { _id: null, total: { $sum: '$totalPrice' } } }]);
    
    res.json({
      totalUsers,
      activeServices,
      totalBookings,
      revenue: revenue[0] ? revenue[0].total : 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET Settings
router.get('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// UPDATE Settings
router.put('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();
    if (req.body.maintenanceMode !== undefined) settings.maintenanceMode = req.body.maintenanceMode;
    if (req.body.aiAssistant !== undefined) settings.aiAssistant = req.body.aiAssistant;
    if (req.body.bookingCommission !== undefined) settings.bookingCommission = req.body.bookingCommission;
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
