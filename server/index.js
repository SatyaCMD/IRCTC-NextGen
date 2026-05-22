const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { startCronJobs } = require('./services/cronJobs');

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    callback(null, true); // Automatically allow all domains for deployment ease
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const authRoutes = require('./routes/authRoutes');
const trainRoutes = require('./routes/trainRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const aiRoutes = require('./routes/aiRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/trains', trainRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/ai', aiRoutes);

const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;

const { execSync } = require('child_process');
const Service = require('./models/Service');

app.get("/", (req, res) => {
  res.send("IRCTC Backend API Running");
});

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
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

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));
