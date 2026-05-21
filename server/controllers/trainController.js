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
    const { source, destination, date, type } = req.query;
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const isSpecialType = type === 'Hotels' || type === 'Retiring Room' || type === 'E Catering' || type === 'Holiday Packs';
    const isHotelOrRoom = type === 'Hotels' || type === 'Retiring Room';

    const filters = {};
    if (type === 'Hotels' || type === 'Retiring Room' || type === 'E Catering') {
        if (source) filters.source = new RegExp(escapeRegExp(source.split(' - ')[0]), 'i');
        filters.serviceType = new RegExp(escapeRegExp(type), 'i');
    } else if (type === 'Holiday Packs') {
        if (destination) filters.source = new RegExp(escapeRegExp(destination.split(' - ')[0]), 'i');
        filters.serviceType = new RegExp(escapeRegExp(type), 'i');
    } else {
        if (source) filters.source = new RegExp(escapeRegExp(source), 'i');
        if (destination) filters.destination = new RegExp(escapeRegExp(destination), 'i');
    }
    
    let trains = await Train.find(filters);

    // Auto-generate and persist multi-modal services for new routes so seats decrement globally
    if (trains.length === 0 && (source || destination || isSpecialType)) {
      const newServices = [];
      
      const getSeats = (base) => {
         const random = Math.floor(Math.random() * 100);
         if (random < 15) return -Math.floor(1 + Math.random() * 40); // 15% chance of Waitlist (-1 to -40)
         return Math.floor(1 + Math.random() * base); // Available
      };

      const generateTimings = (baseDurationHours) => {
        const h = Math.floor(Math.random() * 24);
        const m = Math.floor(Math.random() * 60);
        const arrH = (h + baseDurationHours) % 24;
        return {
          departure: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
          arrival: `${arrH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
          duration: `${baseDurationHours}h ${Math.floor(Math.random() * 60)}m`
        };
      };

      const generateDays = () => {
        const patterns = [
          ["Daily"], 
          ["Weekly (Sunday)"], ["Weekly (Monday)"], ["Weekly (Friday)"], 
          ["Bi-Weekly (Mon, Thu)"], ["Bi-Weekly (Wed, Sat)"], ["Bi-Weekly (Tue, Fri)"],
          ["Mon", "Wed", "Fri"], ["Tue", "Thu", "Sat"], ["Sun", "Mon"]
        ];
        return patterns[Math.floor(Math.random() * patterns.length)];
      };

      // Generate 25+ Hotels, Retiring Rooms, E Catering if requested
      if (isSpecialType) {
          const locationName = source.split(' - ')[0];
          
          if (type === 'Hotels') {
             const hotelNames = ['Taj', 'Oberoi', 'ITC', 'Leela', 'Marriott', 'Hyatt', 'Radisson', 'Novotel', 'Lemon Tree', 'Ginger', 'Holiday Inn', 'Sheraton', 'The Lalit', 'Park', 'Westin'];
             const hotelCount = Math.floor(25 + Math.random() * 10);
             const hImages = ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&auto=format&fit=crop', 'https://images.unsplash.com/photo-1551882547-ff40c0d509af?w=500&auto=format&fit=crop', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500&auto=format&fit=crop', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=500&auto=format&fit=crop', 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=500&auto=format&fit=crop', 'https://images.unsplash.com/photo-1542314831-c6a4d2759876?w=500&auto=format&fit=crop'];
             for (let i = 0; i < hotelCount; i++) {
                const brand = hotelNames[Math.floor(Math.random() * hotelNames.length)];
                const randomSuffix = ['Grand', 'Resort', 'Plaza', 'Palace', 'Suites', 'Boutique', 'Inn', 'Express'];
                const name = `${brand} ${randomSuffix[Math.floor(Math.random() * randomSuffix.length)]} ${locationName}`;
                const baseP = Math.floor(2000 + Math.random() * 8000);
                const address = `${Math.floor(10 + Math.random() * 90)}, ${locationName} Main Road, City Center, ${locationName}`;
                
                const numReviews = Math.floor(10 + Math.random() * 15);
                const rating = Number((3.5 + Math.random() * 1.5).toFixed(1));
                const mockReviews = Array.from({ length: numReviews }).map((_, idx) => ({
                    user: `Guest User ${idx + 1}`,
                    rating: Math.floor(3 + Math.random() * 3),
                    comment: ["Great place!", "Very clean and nice.", "Loved the view.", "Staff was very polite.", "Average experience.", "Will come again!"][Math.floor(Math.random() * 6)],
                    date: new Date(Date.now() - Math.floor(Math.random() * 10000000000))
                }));
                
                newServices.push({
                  trainNumber: `HTL-${Math.floor(1000 + Math.random() * 9000)}`,
                  name, serviceType: "Hotels", source, destination: address,
                  timings: { departure: "12:00", arrival: "11:00", duration: "1 Night" },
                  image: hImages[Math.floor(Math.random() * hImages.length)],
                  description: `Experience the best of ${locationName} at ${name}. We offer world-class amenities, clean rooms, and exceptional hospitality perfect for every traveler.`,
                  rating,
                  reviews: numReviews,
                  reviewsList: mockReviews,
                  classes: [
                    { type: 'Standard Room', price: baseP, availableSeats: getSeats(20) },
                    { type: 'Deluxe Room', price: Math.floor(baseP * 1.5), availableSeats: getSeats(10) },
                    { type: 'Suite', price: Math.floor(baseP * 3), availableSeats: getSeats(5) }
                  ],
                  daysOfRun: ["Daily"]
                });
             }
          } else if (type === 'Retiring Room') {
             const roomTypes = ['AC Dormitory', 'Non-AC Dormitory', 'AC Double Bed', 'Non-AC Double Bed', 'AC Single Bed', 'Family Room', 'Premium Suite AC'];
             const roomCount = Math.floor(25 + Math.random() * 10);
             const rImages = ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&auto=format&fit=crop', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=500&auto=format&fit=crop', 'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=500&auto=format&fit=crop', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&auto=format&fit=crop'];
             for (let i = 0; i < roomCount; i++) {
                const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
                const name = `IRCTC Retiring Room - ${roomType}`;
                const baseP = Math.floor(200 + Math.random() * 800);
                const address = `${locationName} Railway Station, Platform ${Math.floor(1 + Math.random() * 5)}`;
                
                const numReviews = Math.floor(5 + Math.random() * 15);
                const rating = Number((3.0 + Math.random() * 1.5).toFixed(1));
                const mockReviews = Array.from({ length: numReviews }).map((_, idx) => ({
                    user: `Passenger ${idx + 1}`,
                    rating: Math.floor(3 + Math.random() * 3),
                    comment: ["Good place to rest.", "Clean beds and safe.", "Very near to platform.", "Decent for the price."][Math.floor(Math.random() * 4)],
                    date: new Date(Date.now() - Math.floor(Math.random() * 10000000000))
                }));
                
                newServices.push({
                  trainNumber: `RR-${Math.floor(1000 + Math.random() * 9000)}`,
                  name, serviceType: "Retiring Room", source, destination: address,
                  timings: { departure: "12:00", arrival: "11:00", duration: "24 Hours" },
                  image: rImages[Math.floor(Math.random() * rImages.length)],
                  description: `Rest at ease at ${locationName} station in our clean and secure ${roomType}. A perfect transit stop for passengers.`,
                  rating,
                  reviews: numReviews,
                  reviewsList: mockReviews,
                  classes: [
                    { type: '12 Hours', price: baseP, availableSeats: getSeats(30) },
                    { type: '24 Hours', price: Math.floor(baseP * 1.8), availableSeats: getSeats(20) },
                    { type: '48 Hours', price: Math.floor(baseP * 3.5), availableSeats: getSeats(10) }
                  ],
                  daysOfRun: ["Daily"]
                });
             }
          } else if (type === 'E Catering') {
             const restNames = ['Bikanerwala', 'Haldirams', 'Dominos', 'KFC', 'Subway', 'Sagar Ratna', 'Punjabi Dhaba', 'South Indian Express', 'Mughlai Darbar', 'The Foodie Station', 'Biryani Blues', 'Behrouz', 'Faasos', 'Street Food Hub'];
             const restCount = Math.floor(30 + Math.random() * 15);
             const eImages = ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop', 'https://images.unsplash.com/photo-1512152272829-e3139592d56f?w=500&auto=format&fit=crop', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop', 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=500&auto=format&fit=crop', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&auto=format&fit=crop'];
             for (let i = 0; i < restCount; i++) {
                const restName = restNames[Math.floor(Math.random() * restNames.length)];
                const randomSuffix = ['- Fast Food', '- Premium Thali', '- North Indian', '- South Indian', '- Bakery', '- Pure Veg', '- Multi Cuisine'];
                const name = `${restName} ${randomSuffix[Math.floor(Math.random() * randomSuffix.length)]}`;
                const baseP = Math.floor(150 + Math.random() * 300);
                const address = `Delivering at ${locationName} Station`;
                const numReviews = Math.floor(15 + Math.random() * 20);
                const mockReviews = Array.from({ length: numReviews }).map((_, idx) => ({
                    user: `Diner ${idx + 1}`,
                    rating: Math.floor(3 + Math.random() * 3),
                    comment: ["Very tasty food!", "Delivery was exactly on time.", "Hygiene was maintained.", "Good portions."][Math.floor(Math.random() * 4)],
                    date: new Date(Date.now() - Math.floor(Math.random() * 10000000000))
                }));
                newServices.push({
                  trainNumber: `FOD-${Math.floor(1000 + Math.random() * 9000)}`,
                  name, serviceType: "E Catering", source, destination: address,
                  timings: { departure: "Lunch / Dinner", arrival: "At Seat", duration: "Freshly Cooked" },
                  image: eImages[Math.floor(Math.random() * eImages.length)],
                  description: `Delicious and fresh food delivered directly to your train seat by ${restName}. Satisfaction guaranteed on your journey!`,
                  rating: Number((3.8 + Math.random() * 1.0).toFixed(1)),
                  reviews: numReviews,
                  reviewsList: mockReviews,
                  classes: [
                    { type: 'Standard Thali', price: baseP, availableSeats: getSeats(100) },
                    { type: 'Premium Thali', price: Math.floor(baseP * 1.5), availableSeats: getSeats(100) },
                    { type: 'Combo Meal', price: Math.floor(baseP * 1.2), availableSeats: getSeats(100) },
                    { type: 'Snacks & Beverages', price: Math.floor(baseP * 0.5), availableSeats: getSeats(100) }
                  ],
                  daysOfRun: ["Daily"]
                });
             }
          } else if (type === 'Holiday Packs') {
             const packNames = ['Golden Triangle Tour', 'Kerala Backwaters', 'Goa Beach Retreat', 'Kashmir Paradise', 'Rajasthan Heritage', 'Himachal Escapade', 'North East Explorer', 'Andaman Delight'];
             const packCount = Math.floor(15 + Math.random() * 10);
             for (let i = 0; i < packCount; i++) {
                const pName = packNames[Math.floor(Math.random() * packNames.length)];
                const duration = Math.floor(3 + Math.random() * 10);
                const baseP = Math.floor(15000 + Math.random() * 25000);
                const userDest = req.query.destination ? req.query.destination.split(' - ')[0] : 'Anywhere';
                newServices.push({
                  trainNumber: `HP-${Math.floor(1000 + Math.random() * 9000)}`,
                  name: `${pName} from ${userDest}`, serviceType: "Holiday Packs", source: userDest, destination: "Multiple Attractions",
                  timings: { departure: "09:00", arrival: "18:00", duration: `${duration} Days` },
                  image: "https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=500&auto=format&fit=crop",
                  description: `A breathtaking ${duration}-day journey exploring the very best of ${pName}. All-inclusive tour with expert guides.`,
                  rating: Number((4.0 + Math.random() * 1.0).toFixed(1)),
                  reviews: Math.floor(50 + Math.random() * 500),
                  classes: [
                    { type: 'Standard Package', price: baseP, availableSeats: getSeats(30) },
                    { type: 'Comfort Package', price: Math.floor(baseP * 1.5), availableSeats: getSeats(20) },
                    { type: 'Luxury Package', price: Math.floor(baseP * 2.5), availableSeats: getSeats(10) }
                  ],
                  daysOfRun: ["Daily"]
                });
             }
          }
      } else if (!isSpecialType) {
        // Generate 15-20 Trains
        const trainNames = ['Rajdhani Express', 'Shatabdi Express', 'Garib Rath', 'Duronto Express', 'Humsafar Express', 'Vande Bharat', 'Tejas Express', 'Sampark Kranti', 'Jan Shatabdi', 'Mail Express', 'Superfast Express', 'Intercity Exp'];
        const trainCount = Math.floor(18 + Math.random() * 5);
      for (let i = 0; i < trainCount; i++) {
         const name = trainNames[Math.floor(Math.random() * trainNames.length)] + (Math.random() > 0.5 ? ' Special' : '');
         const isPremium = name.includes('Rajdhani') || name.includes('Duronto') || name.includes('Vande');
         const baseP = Math.floor(200 + Math.random() * 300);
         const classes = isPremium ? [
           { type: '3A', price: baseP * 3, availableSeats: getSeats(100) },
           { type: '2A', price: baseP * 4.5, availableSeats: getSeats(40) },
           { type: '1A', price: baseP * 7, availableSeats: getSeats(15) }
         ] : [
           { type: '2S', price: baseP, availableSeats: getSeats(200) },
           { type: 'SL', price: Math.floor(baseP * 1.5), availableSeats: getSeats(300) },
           { type: '3A', price: baseP * 3, availableSeats: getSeats(100) },
           { type: '2A', price: baseP * 4.5, availableSeats: getSeats(40) }
         ];
         newServices.push({
           trainNumber: `TR-${Math.floor(1000 + Math.random() * 9000)}`,
           name, serviceType: "Train", source, destination,
           timings: generateTimings(Math.floor(6 + Math.random() * 20)),
           classes, daysOfRun: generateDays()
         });
      }

      // Generate 15-20 Flights
      const flightNames = ['IndiGo Airlines', 'Air India', 'Vistara Premium', 'SpiceJet', 'Akasa Air', 'GoFirst Airways'];
      const flightCount = Math.floor(18 + Math.random() * 5);
      for (let i = 0; i < flightCount; i++) {
         const name = flightNames[Math.floor(Math.random() * flightNames.length)];
         const baseP = Math.floor(2500 + Math.random() * 4000);
         newServices.push({
           trainNumber: `FL-${Math.floor(100 + Math.random() * 900)}`,
           name, serviceType: "Flight", source, destination,
           timings: generateTimings(Math.floor(1 + Math.random() * 3)),
           classes: [
             { type: 'Economy', price: baseP, availableSeats: getSeats(120) },
             { type: 'Premium Economy', price: Math.floor(baseP * 1.5), availableSeats: getSeats(40) },
             { type: 'Business', price: baseP * 3, availableSeats: getSeats(20) },
             { type: 'First Class', price: baseP * 5, availableSeats: getSeats(10) }
           ],
           daysOfRun: generateDays()
         });
      }

      // Generate 15-20 Buses
      const busNames = ['Zingbus Travels', 'IntrCity SmartBus', 'VRL Travels', 'Orange Tours', 'SRS Travels', 'Kallada Travels'];
      const busCount = Math.floor(18 + Math.random() * 5);
      for (let i = 0; i < busCount; i++) {
         const name = busNames[Math.floor(Math.random() * busNames.length)];
         const baseP = Math.floor(500 + Math.random() * 800);
         newServices.push({
           trainNumber: `BS-${Math.floor(1000 + Math.random() * 9000)}`,
           name, serviceType: "Bus", source, destination,
           timings: generateTimings(Math.floor(8 + Math.random() * 10)),
           classes: [
             { type: 'Non-AC Seater', price: Math.floor(baseP * 0.7), availableSeats: getSeats(50) },
             { type: 'Non-AC Sleeper', price: Math.floor(baseP * 0.9), availableSeats: getSeats(40) },
             { type: 'AC Seater', price: baseP, availableSeats: getSeats(40) },
             { type: 'AC Semi-Sleeper', price: Math.floor(baseP * 1.3), availableSeats: getSeats(35) },
             { type: 'Volvo AC Sleeper', price: Math.floor(baseP * 1.8), availableSeats: getSeats(30) }
           ],
           daysOfRun: generateDays()
         });
      }

      // Generate 15-20 Hill Railways
      const hillNames = ['Darjeeling Himalayan Rly', 'Kalka Shimla Railway', 'Nilgiri Mountain Railway', 'Matheran Hill Railway', 'Kangra Valley Railway'];
      const hillCount = Math.floor(18 + Math.random() * 5);
      for (let i = 0; i < hillCount; i++) {
         const name = hillNames[Math.floor(Math.random() * hillNames.length)];
         const baseP = Math.floor(300 + Math.random() * 500);
         newServices.push({
           trainNumber: `HR-${Math.floor(100 + Math.random() * 900)}`,
           name, serviceType: "Hill Railways", source, destination,
           timings: generateTimings(Math.floor(4 + Math.random() * 4)),
           classes: [
             { type: 'Second Class (2S)', price: baseP, availableSeats: getSeats(60) },
             { type: 'First Class (FC)', price: Math.floor(baseP * 2.5), availableSeats: getSeats(20) },
             { type: 'Vistadome (VC)', price: Math.floor(baseP * 3.5), availableSeats: getSeats(15) },
             { type: 'Chair Car (CC)', price: Math.floor(baseP * 1.5), availableSeats: getSeats(40) }
           ],
           daysOfRun: generateDays()
         });
      }

      // Generate 15-20 Charter Trains
      const charterNames = ['Maharaja Express', 'Palace on Wheels', 'Deccan Odyssey', 'Golden Chariot', 'Royal Rajasthan', 'Fairy Queen Charter'];
      const charterCount = Math.floor(18 + Math.random() * 5);
      for (let i = 0; i < charterCount; i++) {
         const name = charterNames[Math.floor(Math.random() * charterNames.length)];
         const baseP = Math.floor(15000 + Math.random() * 10000);
         newServices.push({
           trainNumber: `CT-${Math.floor(1000 + Math.random() * 9000)}`,
           name, serviceType: "Charter Train", source, destination,
           timings: generateTimings(Math.floor(24 + Math.random() * 48)),
           classes: [
             { type: 'Standard Charter', price: baseP, availableSeats: getSeats(50) },
             { type: 'Executive Class', price: Math.floor(baseP * 1.5), availableSeats: getSeats(30) },
             { type: 'Premium Saloon', price: Math.floor(baseP * 2.5), availableSeats: getSeats(10) },
             { type: 'Full Carriage', price: Math.floor(baseP * 5), availableSeats: getSeats(2) }
           ],
           daysOfRun: generateDays()
         });
      }

      // Generate 15-20 Tourist Trains
      const touristNames = ['Bharat Gaurav', 'Buddhist Circuit', 'Ramayana Express', 'Shri Ramayana Yatra', 'Jyotirlinga Yatra', 'Pilgrim Special'];
      const touristCount = Math.floor(18 + Math.random() * 5);
      for (let i = 0; i < touristCount; i++) {
         const name = touristNames[Math.floor(Math.random() * touristNames.length)];
         const baseP = Math.floor(3000 + Math.random() * 5000);
         newServices.push({
           trainNumber: `TT-${Math.floor(1000 + Math.random() * 9000)}`,
           name, serviceType: "Tourist Train", source, destination,
           timings: generateTimings(Math.floor(48 + Math.random() * 72)),
           classes: [
             { type: 'Standard Tourist', price: baseP, availableSeats: getSeats(100) },
             { type: 'Sleeper Class (SL)', price: Math.floor(baseP * 1.2), availableSeats: getSeats(80) },
             { type: 'AC Third Class (3A)', price: Math.floor(baseP * 2.5), availableSeats: getSeats(50) },
             { type: 'AC First Class (1A)', price: Math.floor(baseP * 4), availableSeats: getSeats(20) }
           ],
           daysOfRun: generateDays()
         });
      }
      } // Close the else if (!isSpecialType) block
      
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
      const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const filters = {};
      if (source) filters.source = new RegExp(escapeRegExp(source), 'i');
      if (destination) filters.destination = new RegExp(escapeRegExp(destination), 'i');
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
};

exports.addReview = async (req, res) => {
  try {
    const { user, rating, comment } = req.body;
    const train = await Train.findById(req.params.id);
    if (!train) return res.status(404).json({ error: 'Service not found' });
    
    train.reviewsList.push({ user, rating, comment });
    train.reviews = train.reviewsList.length; // Ensure count stays in sync
    
    // Recalculate average rating
    const totalRating = train.reviewsList.reduce((acc, curr) => acc + curr.rating, 0) + (train.rating * (train.reviews - 1));
    train.rating = Number((totalRating / train.reviews).toFixed(1));

    await train.save();
    res.json(train);
  } catch (error) {
    console.error("Add review error:", error);
    res.status(500).json({ error: 'Server error' });
  }
};
