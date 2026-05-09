const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');

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

module.exports = router;
