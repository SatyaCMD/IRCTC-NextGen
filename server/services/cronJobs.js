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
}

module.exports = { startCronJobs };
