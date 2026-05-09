const mongoose = require('mongoose');
const User = require('./models/User');
const Service = require('./models/Service');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/irctc-clone';

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    await User.deleteMany({});
    await Service.deleteMany({});

    const users = [
      { name: 'Rahul Sharma', email: 'rahul@example.com', password: 'password123', role: 'User', status: 'Active' },
      { name: 'Priya Patel', email: 'priya@example.com', password: 'password123', role: 'User', status: 'Active' },
      { name: 'Admin Manager', email: 'admin@irctc2.co.in', password: 'adminpassword', role: 'Admin', status: 'Active' },
      { name: 'Amit Kumar', email: 'amit@example.com', password: 'password123', role: 'User', status: 'Suspended' }
    ];

    await User.insertMany(users);

    const services = [
      {
        name: "Maharajas' Express",
        type: 'Package',
        status: 'Active',
        revenue: 4200000,
        description: "Redefining Royalty, Luxury and Comfort, Maharajas' express takes...",
        fullDetails: "Redefining Royalty, Luxury and Comfort, Maharajas' Express takes you on a magnificent journey across the most iconic destinations in India.",
        imgUrl: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop",
        highlights: ["Welcome Drink on Arrival", "Royal Dining Experience", "Guided Off-Train Excursions", "Butler Service"]
      },
      {
        name: "International Packages",
        type: 'Package',
        status: 'Active',
        revenue: 5100000,
        description: "Best deals in International Holiday packages, handpicked by IRCTC...",
        fullDetails: "Explore the globe with IRCTC's exclusive International Packages. Handpicked for premium comfort and unforgettable experiences.",
        imgUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=2020&auto=format&fit=crop",
        highlights: ["Flights Included", "Premium 4/5 Star Hotels", "Visa Assistance", "Guided City Tours"]
      },
      {
        name: "Domestic Air Packages",
        type: 'Package',
        status: 'Active',
        revenue: 2800000,
        description: "Be it the spiritual devotee seeking blessings of Tirupati, Shirdi or Mata...",
        fullDetails: "Travel seamlessly across India with our comprehensive Domestic Air Packages.",
        imgUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop",
        highlights: ["Round-trip Flights", "Airport Transfers", "AC Accommodations", "Meals Included"]
      },
      {
        name: "Vande Bharat Express",
        type: 'Train',
        status: 'Active',
        revenue: 8500000,
        description: "High-speed premium travel across India.",
        fullDetails: "Experience India's fastest train network.",
        imgUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop",
        highlights: ["High Speed", "AC Chair Car", "Catering Included"]
      }
    ];

    await Service.insertMany(services);

    console.log('Database Seeded Successfully');
    process.exit();
  } catch (err) {
    console.error('Seeding error', err);
    process.exit(1);
  }
};

seedDatabase();
