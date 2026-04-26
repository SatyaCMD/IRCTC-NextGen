const Booking = require('../models/Booking');
const Train = require('../models/Train');

exports.createBooking = async (req, res) => {
  try {
    const { trainId, trainClass, passengers, totalPrice } = req.body;
    
    // Simulate seat numbers assignment based on passengers length
    const seatNumbers = passengers.map((_, i) => `${trainClass.charAt(0)}${Math.floor(Math.random() * 100) + 1}`);

    const booking = new Booking({
      userId: req.user.userId,
      trainId,
      trainClass,
      passengers,
      seatNumbers,
      totalPrice,
      status: 'Pending'
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
    
    // Reduce seat availability if confirmed
    if (booking.status === 'Confirmed') {
      const train = await Train.findById(booking.trainId);
      const classIndex = train.classes.findIndex(c => c.type === booking.trainClass);
      if (classIndex > -1) {
        train.classes[classIndex].availableSeats -= booking.passengers.length;
        await train.save();
      }
    }
    
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.userId }).populate('trainId', 'trainNumber name source destination');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
