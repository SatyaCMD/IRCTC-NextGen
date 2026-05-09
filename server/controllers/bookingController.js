const Booking = require('../models/Booking');
const Train = require('../models/Train');
const Service = require('../models/Service');

exports.createBooking = async (req, res) => {
  try {
    const { trainId, serviceId, serviceType, trainClass, serviceClass, passengers, totalPrice, bookingRef } = req.body;
    
    // Simulate seat numbers assignment based on passengers length
    const seatNumbers = passengers.map((_, i) => `${(trainClass || serviceClass || 'S').charAt(0)}${Math.floor(Math.random() * 100) + 1}`);
    const pnr = Math.floor(1000000000 + Math.random() * 9000000000).toString(); // 10 digit PNR

    const booking = new Booking({
      userId: req.user.userId,
      trainId,
      serviceId,
      serviceType: serviceType || 'Train',
      serviceClass: serviceClass || trainClass || 'Standard',
      passengers,
      seatNumbers,
      totalPrice,
      status: 'Pending',
      pnr,
      bookingRef: bookingRef || `REF${Date.now()}`
    });

    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.confirmBookingPayment = async (req, res) => {
  try {
    const { paymentId, status } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    booking.paymentId = paymentId;
    booking.status = status === 'success' ? 'Confirmed' : 'Cancelled';
    
    // Update revenue
    if (booking.status === 'Confirmed' && booking.serviceId) {
      await Service.findByIdAndUpdate(booking.serviceId, { $inc: { revenue: booking.totalPrice } });
    }
    
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.userId.toString() !== req.user.userId) return res.status(403).json({ error: 'Unauthorized' });
    
    booking.status = 'Cancelled';
    await booking.save();
    
    if (booking.serviceId) {
       await Service.findByIdAndUpdate(booking.serviceId, { $inc: { revenue: -booking.totalPrice } });
    }
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const threeMonthsFuture = new Date();
    threeMonthsFuture.setMonth(threeMonthsFuture.getMonth() + 3);

    const bookings = await Booking.find({ 
      userId: req.user.userId,
      createdAt: { $gte: threeMonthsAgo, $lte: threeMonthsFuture }
    }).populate('trainId', 'trainNumber name source destination').populate('serviceId', 'name type');
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
