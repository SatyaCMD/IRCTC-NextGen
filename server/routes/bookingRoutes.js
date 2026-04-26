const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', bookingController.createBooking);
router.put('/:id/payment', bookingController.confirmBookingPayment);
router.get('/history', bookingController.getUserBookings);

module.exports = router;
