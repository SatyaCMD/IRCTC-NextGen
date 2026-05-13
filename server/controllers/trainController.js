const Train = require('../models/Train');
const { recommendTrain } = require('../services/aiService');

// Seed mock trains if empty
exports.seedTrains = async (req, res) => {
  const count = await Train.countDocuments();
  if (count === 0) {
    const mockTrains = [
      {
        trainNumber: "12951",
        name: "Mumbai Rajdhani",
        source: "Mumbai Central",
        destination: "New Delhi",
        timings: { departure: "17:00", arrival: "08:32", duration: "15h 32m" },
        classes: [
          { type: '1AC', price: 4500, availableSeats: 12 },
          { type: '2AC', price: 3000, availableSeats: 45 },
          { type: '3AC', price: 2000, availableSeats: 120 }
        ],
        daysOfRun: ["Daily"]
      },
      {
        trainNumber: "12009",
        name: "Shatabdi Express",
        source: "Mumbai Central",
        destination: "Ahmedabad",
        timings: { departure: "06:20", arrival: "13:00", duration: "6h 40m" },
        classes: [
          { type: 'CC', price: 1000, availableSeats: 250 },
          { type: '1AC', price: 2200, availableSeats: 20 },
        ],
        daysOfRun: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      },
      {
        trainNumber: "22691",
        name: "Rajdhani Express",
        source: "KSR Bengaluru",
        destination: "Nizamuddin",
        timings: { departure: "20:00", arrival: "05:30", duration: "33h 30m" },
        classes: [
          { type: '1AC', price: 5500, availableSeats: 5 },
          { type: '2AC', price: 3800, availableSeats: 24 },
          { type: '3AC', price: 2600, availableSeats: 80 }
        ],
        daysOfRun: ["Daily"]
      }
    ];
    await Train.insertMany(mockTrains);
  }
  res.json({ message: "Mock trains ready" });
};

exports.searchTrains = async (req, res) => {
  try {
    const { source, destination, date } = req.query;
    // Basic search filtering (you'd typically filter by regex or exact match depending on UI)
    const filters = {};
    if (source) filters.source = new RegExp(source, 'i');
    if (destination) filters.destination = new RegExp(destination, 'i');
    
    let trains = await Train.find(filters);
    
    // Auto-generate and persist multi-modal services for new routes so seats decrement globally
    if (trains.length === 0 && source && destination) {
      const getSeats = (max) => Math.floor(Math.random() * max) + 10;
      
      const newServices = [
        {
          trainNumber: `FL-${Math.floor(1000 + Math.random() * 9000)}`,
          name: "IndiGo Airlines",
          serviceType: "Flight",
          source: source,
          destination: destination,
          timings: { departure: "06:00", arrival: "08:30", duration: "2h 30m" },
          classes: [
            { type: 'Economy', price: 3500, availableSeats: getSeats(50) },
            { type: 'Business', price: 12000, availableSeats: getSeats(15) }
          ],
          daysOfRun: ["Daily"]
        },
        {
          trainNumber: `BS-${Math.floor(1000 + Math.random() * 9000)}`,
          name: "Zingbus Travels",
          serviceType: "Bus",
          source: source,
          destination: destination,
          timings: { departure: "22:00", arrival: "06:00", duration: "8h 00m" },
          classes: [
            { type: 'AC Seater', price: 800, availableSeats: getSeats(30) },
            { type: 'Volvo AC Sleeper', price: 1500, availableSeats: getSeats(20) }
          ],
          daysOfRun: ["Daily"]
        },
        {
          trainNumber: `1${Math.floor(1000 + Math.random() * 9000)}`,
          name: "Vande Bharat Express",
          serviceType: "Train",
          source: source,
          destination: destination,
          timings: { departure: "05:45", arrival: "13:15", duration: "7h 30m" },
          classes: [
            { type: 'CC', price: 1200, availableSeats: getSeats(100) },
            { type: 'EC', price: 2400, availableSeats: getSeats(25) }
          ],
          daysOfRun: ["Daily"]
        }
      ];
      
      await Train.insertMany(newServices);
      trains = await Train.find(filters);
    }
    
    res.json(trains);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getTrainById = async (req, res) => {
  try {
    const train = await Train.findById(req.params.id);
    if (!train) return res.status(404).json({ error: 'Train not found' });
    res.json(train);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getSmartRecommendation = async (req, res) => {
  try {
    const { source, destination, age, gender, budget, preferences, trainData } = req.body;
    
    let trains = [];
    if (trainData && trainData.length > 0) {
      trains = trainData.slice(0, 5); // Take top 5 to avoid token limit
    } else {
      // Fallback: Find trains matching the route in DB
      const filters = {};
      if (source) filters.source = new RegExp(source, 'i');
      if (destination) filters.destination = new RegExp(destination, 'i');
      trains = await Train.find(filters).select('trainNumber name timings classes').limit(5);
    }
    
    if (trains.length === 0) {
      return res.status(404).json({ error: 'No trains found for this route.' });
    }

    const recommendation = await recommendTrain({ age, gender, budget, preferences }, trains);
    res.json(recommendation);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}
