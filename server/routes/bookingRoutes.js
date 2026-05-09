const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');
router.get('/pnr/:pnr', bookingController.getPnrStatus);

router.use(authMiddleware);

router.post('/', bookingController.createBooking);
router.put('/:id/payment', bookingController.confirmBookingPayment);
router.put('/:id/cancel', bookingController.cancelBooking);
router.get('/history', bookingController.getUserBookings);

module.exports = router;
