const Booking = require('../models/Booking');
const Train = require('../models/Train');
const Service = require('../models/Service');
const User = require('../models/User');

exports.createBooking = async (req, res) => {
  try {
    const { trainId, serviceId, serviceType, trainClass, serviceClass, passengers, totalPrice, bookingRef, journeyDate, from, to, departureTime } = req.body;
    
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
      bookingRef: bookingRef || `REF${Date.now()}`,
      journeyDate,
      from,
      to,
      departureTime
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

    if (booking.status === 'Confirmed') {
      const user = await User.findById(booking.userId);
      if (user) {
        user.loyaltyPoints = (user.loyaltyPoints || 0) + (booking.passengers.length * 50);
        await user.save();
      }
    }
    
    // Core Seat Management & Auto-Upgradation Logic
    if (booking.status === 'Confirmed' && booking.trainId) {
      const train = await Train.findById(booking.trainId);
      if (train) {
        let requestedClass = train.classes.find(c => c.type === booking.serviceClass);
        let numPassengers = booking.passengers.length;

        if (requestedClass) {
          if (requestedClass.availableSeats >= numPassengers) {
            requestedClass.availableSeats -= numPassengers;
          } else {
            // Waitlist & Auto-Upgradation Logic
            // If requested class is full, look for a higher class
            const classHierarchy = ['SL', '3A', '2A', '1A', 'Economy', 'Premium Economy', 'Business', 'First Class', 'Non-AC Seater', 'AC Seater', 'Non-AC Sleeper', 'Volvo AC Sleeper'];
            let currentIndex = classHierarchy.indexOf(booking.serviceClass);
            let upgraded = false;
            
            if (currentIndex !== -1) {
              for (let i = currentIndex + 1; i < classHierarchy.length; i++) {
                let higherClass = train.classes.find(c => c.type === classHierarchy[i]);
                if (higherClass && higherClass.availableSeats >= numPassengers) {
                  higherClass.availableSeats -= numPassengers;
                  booking.serviceClass = classHierarchy[i]; // Free Upgrade
                  booking.status = 'Confirmed';
                  upgraded = true;
                  break;
                }
              }
            }

            if (!upgraded) {
              booking.status = 'WL';
            }
          }
          await train.save();
        }
      }
    }
    
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
    
    // Calculate refund based on time
    const now = new Date();
    const journeyDateTime = new Date(`${booking.journeyDate}T${booking.departureTime}`);
    const hoursToDeparture = (journeyDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const hoursSinceBooking = (now.getTime() - new Date(booking.createdAt).getTime()) / (1000 * 60 * 60);

    let refundAmount = 0;
    const isChartPrepared = hoursToDeparture > 0 && hoursToDeparture <= 4;
    
    if (isChartPrepared) {
      refundAmount = 0; // No refund after chart prepared
    } else if (hoursSinceBooking <= 8) {
      refundAmount = booking.totalPrice;
    } else if (hoursSinceBooking <= 24) {
      refundAmount = booking.totalPrice * 0.50;
    } else if (hoursSinceBooking <= 36) {
      refundAmount = booking.totalPrice * 0.15;
    } else {
      refundAmount = 0;
    }

    const prevStatus = booking.status;
    booking.status = 'Cancelled';
    await booking.save();
    
    // Seat recovery and WL -> RAC promotion
    if (booking.trainId && (prevStatus === 'Confirmed' || prevStatus === 'RAC')) {
      const train = await Train.findById(booking.trainId);
      if (train) {
        let trainClass = train.classes.find(c => c.type === booking.serviceClass);
        if (trainClass) {
          trainClass.availableSeats += booking.passengers.length;
          
          // Find waiting list users to promote
          const wlBookings = await Booking.find({ 
            trainId: booking.trainId, 
            serviceClass: booking.serviceClass, 
            status: 'WL' 
          }).sort({ createdAt: 1 });
          
          for (let wlBooking of wlBookings) {
            if (trainClass.availableSeats >= wlBooking.passengers.length) {
              trainClass.availableSeats -= wlBooking.passengers.length;
              wlBooking.status = 'RAC';
              await wlBooking.save();
            }
          }
          await train.save();
        }
      }
    }
    
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

exports.getPnrStatus = async (req, res) => {
  try {
    const booking = await Booking.findOne({ pnr: req.params.pnr }).populate('trainId', 'trainNumber name');
    if (!booking) return res.status(404).json({ error: 'PNR not found' });

    const now = new Date();
    const journeyDateTime = new Date(`${booking.journeyDate}T${booking.departureTime}`);
    const hoursToDeparture = (journeyDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isChartPrepared = hoursToDeparture > 0 && hoursToDeparture <= 4;
    const hasDeparted = hoursToDeparture <= 0;

    const chartStatus = hasDeparted ? 'Train Departed' : (isChartPrepared ? 'Chart Prepared' : 'Chart Not Prepared');

    res.json({
      pnr: booking.pnr,
      trainNo: booking.trainId ? booking.trainId.trainNumber : 'MOCK-123',
      trainName: booking.trainId ? booking.trainId.name : 'Express Train',
      doj: booking.journeyDate,
      from: booking.from,
      to: booking.to,
      class: booking.serviceClass,
      chartStatus: chartStatus,
      passengers: booking.passengers.map((p, i) => {
        let statusStr = booking.status === 'Cancelled' ? 'CAN' : (booking.status === 'Confirmed' ? 'CNF' : booking.status);
        let seatStr = (booking.status === 'Confirmed' && booking.seatNumbers && booking.seatNumbers[i]) ? ` / ${booking.seatNumbers[i]}` : '';
        return {
          no: i + 1,
          bookingStatus: statusStr,
          currentStatus: statusStr + seatStr
        };
      })
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
