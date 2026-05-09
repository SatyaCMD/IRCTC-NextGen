const mongoose = require('mongoose');
const Service = require('./models/Service');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/irctc-clone';

const massiveServices = [
  // Domestic Flights
  { name: 'Air India Express (Domestic)', type: 'Flight', description: 'Affordable domestic flights across India.', imgUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop', status: 'Active' },
  { name: 'IndiGo Airlines (Domestic)', type: 'Flight', description: 'On-time domestic performance.', imgUrl: 'https://images.unsplash.com/photo-1517400508447-f8dd518b86db?q=80&w=2070&auto=format&fit=crop', status: 'Active' },
  { name: 'Vistara Airlines (Domestic)', type: 'Flight', description: 'Premium domestic air travel.', imgUrl: 'https://images.unsplash.com/photo-1542296332-2e4473faf563?q=80&w=2070&auto=format&fit=crop', status: 'Active' },
  { name: 'SpiceJet (Domestic)', type: 'Flight', description: 'Budget friendly domestic routes.', imgUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop', status: 'Active' },

  // Buses
  { name: 'RedBus Premium Services', type: 'Bus', description: 'AC Sleeper buses for inter-state travel.', imgUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop', status: 'Active' },
  { name: 'UPSRTC / KSRTC State Buses', type: 'Bus', description: 'State transport integration for daily routes.', imgUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop', status: 'Active' },
  { name: 'ZingBus AC Sleeper', type: 'Bus', description: 'Comfortable overnight bus journeys.', imgUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop', status: 'Active' },

  // Specialty Trains
  { name: 'Vande Bharat Express', type: 'Train', description: 'Semi-high speed premium trains across India.', imgUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop', status: 'Active' },
  { name: 'Rajdhani Express', type: 'Train', description: 'Connecting capitals with Delhi.', imgUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop', status: 'Active' },
  { name: 'Shatabdi Express', type: 'Train', description: 'Fast day-trains between major cities.', imgUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop', status: 'Active' },
  { name: 'Darjeeling Himalayan Railway', type: 'Hill Railway', description: 'UNESCO World Heritage toy train.', imgUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop', status: 'Active' },
  { name: 'Kalka-Shimla Railway', type: 'Hill Railway', description: 'Scenic mountain train to Shimla.', imgUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop', status: 'Active' },
  { name: 'Nilgiri Mountain Railway', type: 'Hill Railway', description: 'Historic rack railway in Tamil Nadu.', imgUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop', status: 'Active' },
  { name: 'Golden Chariot', type: 'Tourist Train', description: 'Luxury tourist train in South India.', imgUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop', status: 'Active' },
  { name: 'Deccan Odyssey', type: 'Tourist Train', description: 'Luxury train touring Maharashtra and Goa.', imgUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop', status: 'Active' },
  { name: 'Private Charter Train', type: 'Charter Train', description: 'Book a full private train for events or tours.', imgUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop', status: 'Active' },

  // Hotels & Retiring Rooms
  { name: 'Taj Hotels (All India)', type: 'Hotel', description: 'Luxury 5-star hotel chains.', imgUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop', status: 'Active' },
  { name: 'ITC Hotels', type: 'Hotel', description: 'Premium sustainable luxury hotels.', imgUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop', status: 'Active' },
  { name: 'OYO Premium Rooms', type: 'Hotel', description: 'Affordable stays in every city.', imgUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop', status: 'Active' },
  { name: 'IRCTC Retiring Rooms (New Delhi)', type: 'Retiring Room', description: 'AC rooms at New Delhi Railway Station.', imgUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop', status: 'Active' },
  { name: 'IRCTC Retiring Rooms (Mumbai CSMT)', type: 'Retiring Room', description: 'Transit accommodation at Mumbai CSMT.', imgUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop', status: 'Active' },
  { name: 'IRCTC Retiring Rooms (Bengaluru SBC)', type: 'Retiring Room', description: 'Convenient station stays in Bengaluru.', imgUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop', status: 'Active' },

  // Food / E-Catering
  { name: 'Domino\'s E-Catering', type: 'Food', description: 'Get pizzas delivered to your train seat.', imgUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop', status: 'Active' },
  { name: 'Haldiram\'s Thali', type: 'Food', description: 'Premium vegetarian North Indian thalis.', imgUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop', status: 'Active' },
  { name: 'Comesum Express', type: 'Food', description: 'Multi-cuisine delivery network across major junctions.', imgUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop', status: 'Active' },
  { name: 'KFC On-Train', type: 'Food', description: 'Hot and crispy chicken delivered to your berth.', imgUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop', status: 'Active' }
];

async function seedMassive() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB for massive seed.');
    
    // We won't delete existing data so we keep user's existing packages.
    // Let's just insert these new services.
    
    await Service.insertMany(massiveServices);
    console.log('Massive seeding successful! Added 25+ new diverse services.');
    
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seedMassive();
