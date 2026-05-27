const cron = require('node-cron');
const Booking = require('../models/Booking');
const User = require('../models/User');
const emailService = require('./emailService');

function startCronJobs() {
    console.log('Automated Notification Engine (Cron Jobs) Started.');

    // 1. Chart Preparation & Seat Confirmation (Runs every hour)
    // Sends email to users whose train is departing within the next 4 hours
    cron.schedule('0 * * * *', async () => {
        try {
            console.log('[Cron] Running Chart Preparation Check...');
            const now = new Date();
            
            const bookings = await Booking.find({
                serviceType: 'Train',
                status: 'Confirmed',
                chartPreparedEmailSent: { $ne: true }
            }).populate('userId trainId');

            let count = 0;
            for (const booking of bookings) {
                const datePart = booking.journeyDate ? booking.journeyDate.split('T')[0] : new Date().toISOString().split('T')[0];
                const departureStr = booking.departureTime || '10:00';
                const journeyDateTime = new Date(`${datePart}T${departureStr}`);
                
                const hoursToDeparture = (journeyDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
                
                if (hoursToDeparture > 0 && hoursToDeparture <= 4) {
                    if (booking.userId && booking.userId.email) {
                        const userEmail = booking.userId.email;
                        const userName = booking.userId.name || 'Customer';
                        const pnr = booking.pnr || 'N/A';
                        
                        let trainName = 'IRCTC Train';
                        if (booking.trainId) {
                            trainName = `${booking.trainId.trainNumber} / ${booking.trainId.name}`.toUpperCase();
                        } else if (booking.from) {
                            trainName = `${booking.from.split(' ')[0]} EXPRESS`.toUpperCase();
                        }
                        
                        const departureTime = booking.departureTime || 'TBD';
                        
                        const seatDetails = booking.seatNumbers && booking.seatNumbers.length > 0
                            ? booking.seatNumbers.join(', ')
                            : 'CONFIRMED';
                        
                        await emailService.sendChartPreparationEmail(
                            userEmail,
                            userName,
                            pnr,
                            trainName,
                            departureTime,
                            seatDetails
                        );
                        
                        booking.chartPreparedEmailSent = true;
                        await booking.save();
                        count++;
                        console.log(`[Cron] Sent Chart Prep email to ${userEmail} for PNR ${pnr}`);
                    }
                }
            }
            
            console.log(`[Cron] Chart Preparation check complete. Sent ${count} emails.`);
        } catch (err) {
            console.error('[Cron Error] Chart Prep:', err);
        }
    });

    // 2. Upcoming Journey Reminder (Runs daily at 8:00 AM)
    // Sends "Travel Tomorrow" email to users whose journey Date is tomorrow
    cron.schedule('0 8 * * *', async () => {
        try {
            console.log('[Cron] Running Journey Reminder Check...');
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowRegex = new RegExp(`^${tomorrowStr}`);
            const bookings = await Booking.find({ journeyDate: tomorrowRegex, status: 'Confirmed' }).populate('userId');
            
            for (const booking of bookings) {
                if (booking.userId && booking.userId.email) {
                    await emailService.sendJourneyReminderEmail(
                        booking.userId.email,
                        booking.userId.name,
                        booking.pnr,
                        booking.serviceType + ' Ticket',
                        booking.departureTime || 'TBD'
                    );
                }
            }
            console.log(`[Cron] Sent ${bookings.length} Journey Reminders for ${tomorrowStr}.`);
        } catch (err) {
            console.error('[Cron Error] Journey Reminder:', err);
        }
    });

    // 3. Post-Journey Feedback (Runs daily at 8:00 PM)
    // Sends "Rate your journey" email to users whose journey Date was yesterday
    cron.schedule('0 20 * * *', async () => {
        try {
            console.log('[Cron] Running Feedback Check...');
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayRegex = new RegExp(`^${yesterdayStr}`);
            const bookings = await Booking.find({ journeyDate: yesterdayRegex, status: 'Confirmed' }).populate('userId');
            
            for (const booking of bookings) {
                if (booking.userId && booking.userId.email) {
                    await emailService.sendFeedbackEmail(
                        booking.userId.email,
                        booking.userId.name,
                        booking.pnr,
                        booking.serviceType + ' Ticket'
                    );
                }
            }
            console.log(`[Cron] Sent ${bookings.length} Feedback Emails for ${yesterdayStr}.`);
        } catch (err) {
            console.error('[Cron Error] Feedback:', err);
        }
    });

    // 4. Scans and retries failed e-ticket booking confirmation emails (Runs every minute)
    // Ensures that even if the mail server had a temporary network glitch, the user receives their e-ticket.
    cron.schedule('*/1 * * * *', async () => {
        try {
            const pendingEmails = await Booking.find({
                status: 'Confirmed',
                bookingConfirmationEmailSent: { $ne: true }
            }).populate('trainId serviceId');

            if (pendingEmails.length > 0) {
                console.log(`[Cron Recovery] Found ${pendingEmails.length} confirmed bookings with unsent confirmation emails. Processing...`);
                for (const booking of pendingEmails) {
                    const u = await User.findById(booking.userId._id || booking.userId);
                    const recipientEmail = booking.contactInfo?.email || u?.email;
                    if (recipientEmail) {
                        console.log(`[Cron Recovery] Retrying e-ticket confirmation email for PNR ${booking.pnr || booking.bookingRef} to ${recipientEmail}`);
                        await emailService.sendBookingConfirmation(recipientEmail, booking)
                            .catch(err => console.error(`[Cron Recovery Error] Retry failed for PNR ${booking.pnr || booking.bookingRef}:`, err));
                    }
                }
            }
        } catch (err) {
            console.error('[Cron Recovery Error] Email retry cron failed:', err);
        }
    });

    // 5. Auto-confirm Stuck "Verification Pending" Bookings (Runs every minute)
    // Recovers bookings stuck in "Verification Pending" due to server restarts/interruptions.
    cron.schedule('*/1 * * * *', async () => {
        try {
            const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
            const stuckBookings = await Booking.find({
                status: 'Verification Pending',
                createdAt: { $lte: twoMinutesAgo }
            }).populate('trainId serviceId');

            if (stuckBookings.length > 0) {
                console.log(`[Cron Recovery] Found ${stuckBookings.length} bookings stuck in Verification Pending. Confirming...`);
                for (const booking of stuckBookings) {
                    console.log(`[Cron Recovery] Auto-confirming PNR ${booking.pnr || booking.bookingRef}`);
                    booking.status = 'Confirmed';
                    const u = await User.findById(booking.userId._id || booking.userId);
                    if (u) {
                        u.loyaltyPoints = (u.loyaltyPoints || 0) + (booking.passengers.length * 50);
                        await u.save();
                    }
                    await booking.save();

                    // Send the confirmation email
                    const recipientEmail = booking.contactInfo?.email || u?.email;
                    if (recipientEmail) {
                        await emailService.sendBookingConfirmation(recipientEmail, booking).catch(console.error);
                    }

                    // Process seat allocation if trainId is defined
                    if (booking.trainId) {
                        const Train = require('../models/Train');
                        const train = await Train.findById(booking.trainId);
                        if (train) {
                            let requestedClass = train.classes.find(c => c.type === booking.serviceClass);
                            let numPassengers = booking.passengers.length;
                            if (requestedClass && requestedClass.availableSeats >= numPassengers) {
                                requestedClass.availableSeats -= numPassengers;
                                await train.save();
                                console.log(`[Cron Recovery] Deducted ${numPassengers} seats from class ${booking.serviceClass} for PNR ${booking.pnr}`);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error('[Cron Recovery Error] Verification Pending recovery failed:', err);
        }
    });
}

module.exports = { startCronJobs };
