const mongoose = require('mongoose');
const Service = require('./models/Service');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/irctc-clone';

const statesAndCities = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Tirupati"],
  "Arunachal Pradesh": ["Itanagar", "Tawang"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  "Haryana": ["Faridabad", "Gurugram", "Panipat"],
  "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad"],
  "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik"],
  "Manipur": ["Imphal"],
  "Meghalaya": ["Shillong"],
  "Mizoram": ["Aizawl"],
  "Nagaland": ["Kohima", "Dimapur"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
  "Sikkim": ["Gangtok"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad"],
  "Tripura": ["Agartala"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Prayagraj"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Rishikesh"],
  "West Bengal": ["Kolkata", "Darjeeling", "Siliguri"]
};

const hotelPrefixes = ["Taj", "ITC", "Oberoi", "Radisson", "Hyatt", "Marriott", "Novotel", "Lemon Tree", "OYO Premium", "Sarovar Portico"];
const hotelSuffixes = ["Palace", "Resort", "Grand", "Plaza", "Inn", "Suites", "Retreat", "Heights"];

function generateServices() {
  const services = [];

  // Generate 10-15 Hotels and Retiring Rooms per state
  for (const [state, cities] of Object.entries(statesAndCities)) {
    cities.forEach(city => {
      // 4 Hotels per city (Avg 12 per state)
      for (let i = 0; i < 4; i++) {
        const prefix = hotelPrefixes[Math.floor(Math.random() * hotelPrefixes.length)];
        const suffix = hotelSuffixes[Math.floor(Math.random() * hotelSuffixes.length)];
        const rating = (Math.random() * 2 + 3).toFixed(1); // 3.0 to 5.0
        
        services.push({
          name: `${prefix} ${suffix} ${city}`,
          type: 'Hotel',
          description: `Premium luxury stay in ${city}, ${state}. Rating: ${rating}/5 Stars. Features AC, WiFi, and Room Service.`,
          imgUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop',
          status: 'Active',
          revenue: Math.floor(Math.random() * 50000)
        });
      }

      // 2 Retiring Rooms per city
      for (let i = 1; i <= 2; i++) {
        services.push({
          name: `IRCTC Retiring Room - ${city} Jn (AC Class ${i})`,
          type: 'Retiring Room',
          description: `Convenient transit accommodation at ${city} Railway Station, ${state}. Safe, clean, and managed by IRCTC.`,
          imgUrl: 'https://images.unsplash.com/photo-1549294413-26f195200c16?q=80&w=2064&auto=format&fit=crop',
          status: 'Active',
          revenue: Math.floor(Math.random() * 10000)
        });
      }
    });
  }

  return services;
}

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB...');
    
    const servicesToInsert = generateServices();
    console.log(`Generated ${servicesToInsert.length} location-specific services...`);
    
    await Service.insertMany(servicesToInsert);
    console.log('Successfully injected massive State-wise DB records!');
    
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seedData();
