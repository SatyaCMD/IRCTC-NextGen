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
            const fourHoursFromNow = new Date(now.getTime() + (4 * 60 * 60 * 1000));
            
            // Simplified logic: finding bookings for today that haven't had a chart prep email sent
            // In a real system, departureTime is string '14:30', journeyDate is '2026-05-22'.
            // For prototype purposes, we will just simulate it via an admin trigger or a loose match.
            // Since parsing '14:30' and '2026-05-22' dynamically requires timezone logic,
            // we will simulate the check here.
            
            console.log('[Cron] Chart Preparation simulation complete.');
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
            const tomorrowStr = tomorrow.toISOString().split('T')[0];

            const bookings = await Booking.find({ journeyDate: tomorrowStr, status: 'Confirmed' }).populate('userId');
            
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
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            const bookings = await Booking.find({ journeyDate: yesterdayStr, status: 'Confirmed' }).populate('userId');
            
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
}

module.exports = { startCronJobs };
