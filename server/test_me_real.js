require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

async function testMe() {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ email: 'saisatyabrata952@gmail.com' });
    if (!user) {
        console.log("USER NOT FOUND");
        process.exit(1);
    }
    
    console.log("Real User ID:", user._id.toString());
    const token = jwt.sign(
      { userId: user._id, role: user.role, accountType: user.accountType },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    
    try {
        console.log("Testing Render with Real User Token...");
        const resRender = await fetch('https://irctc-nextgen.onrender.com/api/auth/me', { headers: { Authorization: `Bearer ${token}` }});
        const data = await resRender.text();
        console.log("Render Result:", resRender.status, data);
    } catch(err) {
        console.error("Render Error:", err);
    }
    process.exit(0);
}
testMe();
