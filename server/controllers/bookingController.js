const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Train = require('../models/Train');
const Service = require('../models/Service');
const User = require('../models/User');
const Settings = require('../models/Settings');
const emailService = require('../services/emailService');

exports.createBooking = async (req, res) => {
  try {
    const { trainId, serviceId, serviceType, trainClass, serviceClass, quota, passengers, totalPrice, walletAmountUsed, bookingRef, journeyDate, from, to, departureTime, pantryItems, orderedItems, contactInfo } = req.body;
    
    // 60-day Advance Reservation Period limit validation
    const journeyDateObj = new Date(journeyDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxBookingDate = new Date(today);
    maxBookingDate.setDate(today.getDate() + 60);

    if (journeyDateObj > maxBookingDate) {
      return res.status(400).json({ error: "Advance Reservation Period is limited to 60 days." });
    }

    const cls = serviceClass || trainClass || 'SL';
    let qta = quota || 'General';
    
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

    // Senior Citizen Logic:
    // 15% seats reserved for senior citizens, only if booked at least 2 days before the journey date
    const journeyDay = new Date(journeyDateObj);
    journeyDay.setHours(0, 0, 0, 0);
    const diffTime = journeyDay.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const seniorCitizens = passengers.filter(p => p.age >= 60);
    const hasSeniorCitizen = seniorCitizens.length > 0;
    
    let seniorDiscount = 0;
    let seniorLogicApplied = false;
    const cleanTrainId = (trainId && mongoose.Types.ObjectId.isValid(trainId)) ? trainId : undefined;

    if (hasSeniorCitizen && diffDays >= 2) {
      // Check 15% quota
      const existingBookings = await Booking.find({
        trainId: cleanTrainId,
        journeyDate: new Date(journeyDate).toISOString(),
        serviceClass: cls,
        status: { $ne: 'Cancelled' }
      });
      
      let bookedSeniorSeats = 0;
      existingBookings.forEach(b => {
        if (b.quota === 'Senior Citizen (SS)') {
          bookedSeniorSeats += b.passengers.filter(p => p.age >= 60).length;
        }
      });
      
      let maxSeniorSeats = Math.floor(capacity * 0.15);
      if (maxSeniorSeats < 1) maxSeniorSeats = 1;

      if (bookedSeniorSeats + seniorCitizens.length <= maxSeniorSeats) {
        seniorLogicApplied = true;
        qta = 'Senior Citizen (SS)';
        
        const basePricePerPassenger = totalPrice / passengers.length;
        passengers.forEach(p => {
          if (p.age >= 60) {
            seniorDiscount += basePricePerPassenger * 0.40;
            p.seatPreference = 'Lower'; // Force Lower Berth auto-allocation
          }
        });
      }
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
    if (trainId && mongoose.Types.ObjectId.isValid(trainId)) {
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

    const getPnrDistance = (pnrStr) => {
      const digits = (pnrStr || '').replace(/\D/g, '');
      if (!digits) return 1530;
      const num = parseInt(digits.substring(0, 6)) || 0;
      return 1200 + (num % 800);
    };
    const distance = getPnrDistance(pnr);

    let finalPrice = totalPrice - (seniorDiscount || 0);
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

    const cleanServiceId = (serviceId && mongoose.Types.ObjectId.isValid(serviceId)) ? serviceId : undefined;
    const ref = bookingRef || `BKG${Date.now()}${Math.floor(100 + Math.random() * 900)}`;

    if (!isRunningOnDate) {
      const cancelledBooking = new Booking({
        userId: req.user.userId, 
        trainId: cleanTrainId, 
        serviceId: cleanServiceId, 
        serviceType: serviceType || 'Train', 
        serviceClass: cls, 
        quota: qta, 
        passengers, 
        seatNumbers: [], 
        totalPrice: finalPrice, 
        commissionAmount,
        status: 'Cancelled', 
        refundAmount: finalPrice, 
        refundStatus: 'Completed', 
        pnr, 
        distance,
        bookingRef: ref, 
        journeyDate, 
        from, 
        to, 
        departureTime,
        contactInfo: contactInfo ? {
          email: contactInfo.email || '',
          phone: contactInfo.phone || ''
        } : undefined
      });
      await cancelledBooking.save();
      return res.status(400).json({ error: notRunningMsg });
    }

    const booking = new Booking({
      userId: req.user.userId,
      trainId: cleanTrainId,
      serviceId: cleanServiceId,
      serviceType: serviceType || 'Train',
      serviceClass: cls,
      quota: qta,
      passengers,
      seatNumbers,
      totalPrice: finalPrice,
      commissionAmount,
      status: 'Pending',
      pnr,
      distance,
      bookingRef: ref,
      journeyDate: new Date(journeyDate).toISOString(),
      from,
      to,
      departureTime,
      pantryItems,
      orderedItems,
      contactInfo: contactInfo ? {
        email: contactInfo.email || '',
        phone: contactInfo.phone || ''
      } : undefined,
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
    
    if (booking.status === 'Confirmed' || booking.status === 'Cancelled') {
      console.log(`[Payment] PNR ${booking.pnr || booking.bookingRef} is already processed with status: ${booking.status}. Skipping duplicate execution.`);
      return res.json(booking);
    }
    
    booking.paymentId = paymentId;
    if (status === 'success') booking.status = 'Confirmed';
    else if (status === 'Verification Pending') booking.status = 'Verification Pending';
    else booking.status = 'Cancelled';

    // Extend expireAt to 30 days after the journey date so it is kept in database history
    const journeyTime = booking.journeyDate ? new Date(booking.journeyDate).getTime() : Date.now();
    booking.expireAt = new Date(journeyTime + 30 * 24 * 60 * 60 * 1000);

    if (req.body.contactInfo) {
      booking.contactInfo = {
        email: req.body.contactInfo.email || '',
        phone: req.body.contactInfo.phone || ''
      };
      booking.markModified('contactInfo');
    }

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
        emailService.sendBookingConfirmation(booking.contactInfo?.email || user.email, booking).catch(console.error);
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
              emailService.sendBookingConfirmation(fullB.contactInfo?.email || u.email, fullB).catch(console.error);
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
    const datePart = booking.journeyDate ? booking.journeyDate.split('T')[0] : new Date().toISOString().split('T')[0];
    const journeyDateTime = new Date(`${datePart}T${booking.departureTime || '10:00'}`);
    
    // Normalize both times to local date objects to check calendar day difference
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const journeyDateObj = new Date(journeyDateTime.getFullYear(), journeyDateTime.getMonth(), journeyDateTime.getDate());
    const daysToJourney = Math.ceil((journeyDateObj.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const hoursSinceBooking = (now.getTime() - new Date(booking.createdAt).getTime()) / (1000 * 60 * 60);

    let refundAmount = 0;
    
    if (daysToJourney <= 0) {
      // Non-refundable on the date of journey or later
      refundAmount = 0;
    } else {
      // Future bookings
      if (hoursSinceBooking <= 24) {
        refundAmount = booking.totalPrice * 0.90; // 90% refund
      } else if (hoursSinceBooking <= 48) {
        refundAmount = booking.totalPrice * 0.75; // 75% refund
      } else if (hoursSinceBooking <= 72) {
        refundAmount = booking.totalPrice * 0.50; // 50% refund
      } else {
        // Outside 72 hours window since booking
        if (daysToJourney >= 2) {
          refundAmount = booking.totalPrice * 0.15; // 15% refund if >= 2 days to journey
        } else {
          refundAmount = 0; // Non-refundable if < 2 days to journey
        }
      }
    }
    
    refundAmount = Math.round(refundAmount);

    const prevStatus = booking.status;
    booking.status = 'Cancelled';
    booking.refundAmount = refundAmount;
    booking.refundStatus = 'Completed';
    
    // Extend expireAt to 30 days after the journey date so it is kept in database history
    const journeyTime = booking.journeyDate ? new Date(booking.journeyDate).getTime() : Date.now();
    booking.expireAt = new Date(journeyTime + 30 * 24 * 60 * 60 * 1000);
    
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
         emailService.sendCancellationNotice(booking.contactInfo?.email || user.email, booking).catch(console.error);
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
    const bookings = await Booking.find({ 
      userId: req.user.userId
    }).populate('trainId', 'trainNumber name source destination').populate('serviceId', 'name type')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getPnrStatus = async (req, res) => {
  try {
    const booking = await Booking.findOne({ pnr: req.params.pnr }).populate('trainId', 'trainNumber name').populate('userId');
    if (!booking) return res.status(404).json({ error: 'PNR not found' });

    const now = new Date();
    const datePart = booking.journeyDate ? booking.journeyDate.split('T')[0] : new Date().toISOString().split('T')[0];
    const journeyDateTime = new Date(`${datePart}T${booking.departureTime || '10:00'}`);
    const hoursToDeparture = (journeyDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isChartPrepared = hoursToDeparture > 0 && hoursToDeparture <= 4;
    const hasDeparted = hoursToDeparture <= 0;

    const chartStatus = hasDeparted ? 'Train Departed' : (isChartPrepared ? 'Chart Prepared' : 'Chart Not Prepared');

    // Trigger Chart Prepared email if prepared and not yet sent
    if (isChartPrepared && !booking.chartPreparedEmailSent && booking.status === 'Confirmed') {
      const user = booking.userId;
      if (user && user.email) {
        let trainName = 'IRCTC Train';
        if (booking.trainId) {
          trainName = `${booking.trainId.trainNumber} / ${booking.trainId.name}`.toUpperCase();
        } else if (booking.from) {
          trainName = `${booking.from.split(' ')[0]} EXPRESS`.toUpperCase();
        }
        
        const seatDetails = booking.seatNumbers && booking.seatNumbers.length > 0
          ? booking.seatNumbers.join(', ')
          : 'CONFIRMED';

        emailService.sendChartPreparationEmail(
          user.email,
          user.name || 'Customer',
          booking.pnr,
          trainName,
          booking.departureTime || 'TBD',
          seatDetails
        ).catch(console.error);

        booking.chartPreparedEmailSent = true;
        await booking.save();
      }
    }

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
