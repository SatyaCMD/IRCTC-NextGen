const express = require('express');
const router = express.Router();
const trainController = require('../controllers/trainController');

router.post('/seed', trainController.seedTrains);
router.get('/', trainController.searchTrains);
router.get('/:id', trainController.getTrainById);
router.post('/recommend', trainController.getSmartRecommendation);

module.exports = router;
