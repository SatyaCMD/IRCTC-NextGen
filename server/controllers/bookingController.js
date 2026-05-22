const Booking = require('../models/Booking');
const Train = require('../models/Train');
const Service = require('../models/Service');
const User = require('../models/User');
const Settings = require('../models/Settings');
const emailService = require('../services/emailService');

exports.createBooking = async (req, res) => {
  try {
    const { trainId, serviceId, serviceType, trainClass, serviceClass, quota, passengers, totalPrice, walletAmountUsed, bookingRef, journeyDate, from, to, departureTime, pantryItems, orderedItems } = req.body;
    
    const cls = serviceClass || trainClass || 'SL';
    const qta = quota || 'General';
    
    let coachPrefix = 'S';
    let capacity = 80;
    let isSpecialCoach = false;

    if (qta === 'Ladies') {
       coachPrefix = 'L'; capacity = 80; isSpecialCoach = true;
    } else if (qta === 'Divyangjan') {
       coachPrefix = 'D'; capacity = 80; isSpecialCoach = true;
    } else {
       if (cls.includes('1A') || cls.includes('1AC')) { coachPrefix = 'H'; capacity = 25; }
       else if (cls.includes('2A') || cls.includes('2AC')) { coachPrefix = 'A'; capacity = 50; }
       else if (cls.includes('3A') || cls.includes('3AC')) { coachPrefix = 'B'; capacity = 60; }
       else if (cls.includes('GS') || cls.includes('General')) { coachPrefix = 'GEN'; capacity = 150; }
       else { coachPrefix = 'S'; capacity = 80; } // Default to Sleeper
    }

    const seatNumbers = passengers.map((p, i) => {
      const pref = p.seatPreference || p.pref;
      if (pref && pref.includes('/')) return pref.toUpperCase(); // Respect exact train seat selection from frontend
      if (pref && pref.match(/^\d+[A-F]\b/)) return pref.toUpperCase();
      const coachNum = isSpecialCoach ? 1 : Math.floor(Math.random() * (coachPrefix === 'GEN' ? 2 : 5)) + 1;
      const seatNum = Math.floor(Math.random() * capacity) + 1;
      let seatType = 'MIDDLE';
      if (pref && pref !== 'No Preference') {
         if (pref.includes('Lower')) seatType = 'LOWER';
         else if (pref.includes('Upper')) seatType = 'UPPER';
         else if (pref.includes('Middle')) seatType = 'MIDDLE';
         else if (pref.includes('Side Lower')) seatType = 'SIDE LOWER';
         else if (pref.includes('Side Upper')) seatType = 'SIDE UPPER';
         else seatType = pref.toUpperCase();
      } else {
         if (coachPrefix === 'A' || coachPrefix === 'H') {
            seatType = seatNum % 2 === 0 ? 'UPPER' : 'LOWER';
         } else {
            if (seatNum % 3 === 0) seatType = 'UPPER';
            else if (seatNum % 3 === 1) seatType = 'LOWER';
            else seatType = 'MIDDLE';
         }
      }
      return `${coachPrefix}${coachNum}/${seatNum}/${seatType}`;
    });

    let isRunningOnDate = true;
    let notRunningMsg = '';
    if (trainId) {
      const train = await Train.findById(trainId);
      if (train && train.daysOfRun && train.daysOfRun.length > 0) {
         if (!train.daysOfRun.includes('Daily')) {
            const dateObj = new Date(journeyDate);
            const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const fullDayMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const shortDay = daysMap[dateObj.getDay()];
            const longDay = fullDayMap[dateObj.getDay()];
            
            const runsToday = train.daysOfRun.some(d => d.includes(shortDay) || d.includes(longDay));
            if (!runsToday) {
                isRunningOnDate = false;
                notRunningMsg = `Not available. This service does not run on ${longDay}s. Booking automatically cancelled and transaction reversed.`;
            }
         }
      }
    }

    const pnr = Math.floor(1000000000 + Math.random() * 9000000000).toString(); // 10 digit PNR

    let finalPrice = totalPrice;
    let employeeDiscountApplied = 0;
    const user = await User.findById(req.user.userId);
    
    if (user && user.accountType === 'Employee' && user.isEmployeeVerified) {
       let discountPercentage = 0;
       const roll = Math.random();
       
       if (roll < 0.05) {
          discountPercentage = 10; // Very rare (5% chance)
       } else if (roll < 0.20) {
          discountPercentage = 5 + (Math.random() * 4.9); // Rare (15% chance for >5 to <10)
       } else {
          discountPercentage = 1 + (Math.random() * 4); // Often (80% chance for 1 to 5)
       }
       
       employeeDiscountApplied = Math.round((finalPrice * discountPercentage) / 100);
       finalPrice = finalPrice - employeeDiscountApplied;
    }
    
    let commissionAmount = 0;
    const settings = await Settings.findOne();
    if (settings && settings.bookingCommission > 0) {
       commissionAmount = Math.round((finalPrice * settings.bookingCommission) / 100);
       finalPrice = finalPrice + commissionAmount;
    }

    if (!isRunningOnDate) {
      const cancelledBooking = new Booking({
        userId: req.user.userId, trainId, serviceId, serviceType: serviceType || 'Train', serviceClass: cls, quota: qta, passengers, seatNumbers: [], totalPrice: finalPrice, commissionAmount,
        status: 'Cancelled', refundAmount: finalPrice, refundStatus: 'Completed', pnr, bookingRef: bookingRef || `REF${Date.now()}`, journeyDate, from, to, departureTime
      });
      await cancelledBooking.save();
      return res.status(400).json({ error: notRunningMsg });
    }

    const booking = new Booking({
      userId: req.user.userId,
      trainId,
      serviceId,
      serviceType: serviceType || 'Train',
      serviceClass: cls,
      quota: qta,
      passengers,
      seatNumbers,
      totalPrice: finalPrice,
      commissionAmount,
      status: 'Pending',
      pnr,
      bookingRef,
      journeyDate: new Date(journeyDate).toISOString(),
      from,
      to,
      departureTime,
      pantryItems,
      orderedItems,
      expireAt: new Date(Date.now() + 15 * 60000)
    });

    await booking.save();
    
    if (walletAmountUsed && walletAmountUsed > 0) {
       let deduction = walletAmountUsed;
       if (deduction > finalPrice) deduction = finalPrice;
       
       if (user && user.walletBalance >= deduction) {
           user.walletBalance -= deduction;
           user.walletTransactions.push({
             amount: deduction,
             type: 'Debit',
             description: `Booking Payment for ${serviceType || 'Train'}${employeeDiscountApplied > 0 ? ' (Emp. Discount Applied)' : ''}`,
             referenceId: pnr
           });
           await user.save();
       }
    }
    
    // Populate train details so the frontend has accurate name/number for immediate PDF generation
    const populatedBooking = await Booking.findById(booking._id).populate('trainId');
    res.status(201).json(populatedBooking);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.confirmBookingPayment = async (req, res) => {
  try {
    const { paymentId, status } = req.body;
    const booking = await Booking.findById(req.params.id).populate('trainId serviceId userId');
    
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    booking.paymentId = paymentId;
    if (status === 'success') booking.status = 'Confirmed';
    else if (status === 'Verification Pending') booking.status = 'Verification Pending';
    else booking.status = 'Cancelled';

    const processSeatAllocation = async (bookingDoc) => {
      // Core Seat Management & Auto-Upgradation Logic
      if (bookingDoc.status === 'Confirmed' && bookingDoc.trainId) {
        const train = await Train.findById(bookingDoc.trainId);
        if (train) {
          let requestedClass = train.classes.find(c => c.type === bookingDoc.serviceClass);
          let numPassengers = bookingDoc.passengers.length;

          if (requestedClass) {
            if (requestedClass.availableSeats >= numPassengers) {
              requestedClass.availableSeats -= numPassengers;
            } else {
              const classHierarchy = ['SL', '3A', '2A', '1A', 'Economy', 'Premium Economy', 'Business', 'First Class', 'Non-AC Seater', 'AC Seater', 'Non-AC Sleeper', 'Volvo AC Sleeper'];
              let currentIndex = classHierarchy.indexOf(bookingDoc.serviceClass);
              let upgraded = false;
              
              if (currentIndex !== -1) {
                for (let i = currentIndex + 1; i < classHierarchy.length; i++) {
                  let higherClass = train.classes.find(c => c.type === classHierarchy[i]);
                  if (higherClass && higherClass.availableSeats >= numPassengers) {
                    higherClass.availableSeats -= numPassengers;
                    bookingDoc.serviceClass = classHierarchy[i];
                    bookingDoc.status = 'Confirmed';
                    upgraded = true;
                    break;
                  }
                }
              }

              if (!upgraded) {
                bookingDoc.status = 'WL';
              }
            }
            await train.save();
          }
        }
      }
      
      // Update revenue
      if (bookingDoc.status === 'Confirmed' && bookingDoc.serviceId) {
        await Service.findByIdAndUpdate(bookingDoc.serviceId, { $inc: { revenue: bookingDoc.totalPrice } });
      }
      
      await bookingDoc.save();
    };

    if (booking.status === 'Confirmed') {
      const user = await User.findById(booking.userId._id || booking.userId);
      if (user) {
        user.loyaltyPoints = (user.loyaltyPoints || 0) + (booking.passengers.length * 50);
        await user.save();
        try { await emailService.sendBookingConfirmation(user.email, booking); } catch(err) { console.error("Email silently failed:", err.message); }
      }
      await processSeatAllocation(booking);
    } else if (booking.status === 'Verification Pending') {
      await booking.save();
      // Auto-confirm after 2 minutes
      setTimeout(async () => {
         try {
           const b = await Booking.findById(booking._id);
           if (!b || b.status !== 'Verification Pending') return;
           b.status = 'Confirmed';
           const u = await User.findById(b.userId._id || b.userId);
           if (u) {
              u.loyaltyPoints = (u.loyaltyPoints || 0) + (b.passengers.length * 50);
              await u.save();
              const fullB = await Booking.findById(b._id).populate('trainId serviceId');
              try { await emailService.sendBookingConfirmation(u.email, fullB); } catch(err) { console.error("Email silently failed:", err.message); }
           }
           await processSeatAllocation(b);
         } catch(e) {
            console.error('Auto confirmation failed:', e);
         }
      }, 120000);
    } else {
      await booking.save();
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('trainId serviceId');
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
    booking.refundAmount = refundAmount;
    booking.refundStatus = 'Completed';
    await booking.save();
    
    if (refundAmount > 0) {
      const user = await User.findById(booking.userId);
      if (user) {
         user.walletBalance = (user.walletBalance || 0) + refundAmount;
         user.walletTransactions.push({
           amount: refundAmount,
           type: 'Credit',
           description: 'Ticket Cancellation Refund',
           referenceId: booking.pnr || booking.bookingRef
         });
         await user.save();
         try { await emailService.sendCancellationNotice(user.email, booking); } catch(err) { console.error("Email silently failed:", err.message); }
      }
    }
    
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
    
    // Filter out completed journeys
    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingBookings = bookings.filter(b => {
      if (!b.journeyDate) return true; // Keep legacy without date
      return b.journeyDate >= todayStr;
    });

    res.json(upcomingBookings);
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
