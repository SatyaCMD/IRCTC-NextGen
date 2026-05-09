const express = require('express');
const router = express.Router();
const Service = require('../models/Service');

// GET all active services (for public frontend)
router.get('/', async (req, res) => {
  try {
    const services = await Service.find({ status: 'Active' });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

module.exports = router;
