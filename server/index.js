const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { startCronJobs } = require('./services/cronJobs');

const app = express();

// Enable Helmet for secure HTTP headers
app.use(helmet());

// Custom NoSQL Query Injection sanitization (Express 5.x compatible)
const mongoSanitize = (req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (key.startsWith('$') || key.includes('.')) {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          sanitize(obj[key]);
        }
      }
    }
  };
  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  next();
};

app.use(mongoSanitize);

// Configure strict but flexible CORS origin validation
const whitelist = [
  'http://localhost:3000',
  'https://irctcv2.vercel.app',
  'https://irctc-nextgen.vercel.app',
  'https://support.irctcv2.co.in'
];
const corsOptions = {
  origin: function (origin, callback) {
    if (
      !origin || 
      whitelist.includes(origin) || 
      origin.endsWith('irctcv2.co.in') || 
      origin.endsWith('vercel.app') || 
      origin.includes('localhost') || 
      origin.includes('127.0.0.1') ||
      process.env.NODE_ENV !== 'production'
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const authRoutes = require('./routes/authRoutes');
const trainRoutes = require('./routes/trainRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const aiRoutes = require('./routes/aiRoutes');
const supportRoutes = require('./routes/supportRoutes');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many authentication attempts from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/trains', trainRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/support', supportRoutes);

// Serve public directory for email images and uploaded documents
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;

const { execSync } = require('child_process');
const Service = require('./models/Service');

app.get("/", (req, res) => {
  res.send("IRCTC Backend API Running");
});

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Ensure all Mongoose model indexes are fully synchronized with the database in real-time
    try {
      await Promise.all(mongoose.modelNames().map(modelName => mongoose.model(modelName).syncIndexes()));
      console.log('Database indexes synchronized successfully.');
    } catch (syncErr) {
      console.warn('Index synchronization warning:', syncErr);
    }

    // Auto-populate services that have zero or missing revenue with realistic values
    try {
      const zeroRevServices = await Service.find({ $or: [{ revenue: 0 }, { revenue: { $exists: false } }, { revenue: null }] });
      if (zeroRevServices.length > 0) {
        console.log(`Found ${zeroRevServices.length} services with ₹0 or missing revenue. Seeding realistic revenue values...`);
        for (const s of zeroRevServices) {
          let minRev = 100000;
          let maxRev = 500000;
          const serviceType = s.type || '';
          
          if (['Train', 'Tourist Train', 'Charter Train', 'Hill Railway'].includes(serviceType)) {
            minRev = 1200000;
            maxRev = 5800000;
          } else if (serviceType === 'Flight') {
            minRev = 2500000;
            maxRev = 8500000;
          } else if (serviceType === 'Bus') {
            minRev = 300000;
            maxRev = 1500000;
          } else if (['Hotel', 'Retiring Room'].includes(serviceType)) {
            minRev = 800000;
            maxRev = 3500000;
          } else if (serviceType === 'Food') {
            minRev = 150000;
            maxRev = 750000;
          } else if (serviceType === 'Package') {
            minRev = 1000000;
            maxRev = 4000000;
          }
          
          const randomRev = Math.floor(Math.random() * (maxRev - minRev + 1) + minRev);
          const roundedRev = Math.round(randomRev / 1000) * 1000;
          s.revenue = roundedRev;
          await s.save();
          console.log(`Successfully updated revenue for ${s.name} (${s.type}) to ₹${roundedRev.toLocaleString()}`);
        }
        console.log('Auto-population of service revenues finished successfully.');
      }
    } catch (revErr) {
      console.error('Error auto-populating service revenues:', revErr);
    }
    
    if (!process.env.VERCEL && !process.env.VERCEL_REGION) {
      startCronJobs();
      try {
        const serviceCount = await Service.countDocuments();
        if (serviceCount === 0) {
          console.log('Database is empty. Running auto-seeding scripts...');
          execSync('node massive_seed.js', { stdio: 'inherit' });
          execSync('node mega_seed.js', { stdio: 'inherit' });
          console.log('Auto-seeding completed successfully.');
        }
      } catch (seedErr) {
        console.error('Error during auto-seeding:', seedErr);
      }
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));
} else {
  console.error('CRITICAL: MONGODB_URI is not defined!');
}

// BIND THE PORT IMMEDIATELY FOR RENDER HEALTH CHECKS
if (!process.env.VERCEL && !process.env.VERCEL_REGION) {
  const port = process.env.PORT || 10000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

// Export the Express API for Vercel Serverless Functions
module.exports = app;
