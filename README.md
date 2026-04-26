# 🚂 RailAI - Next Generation Ticket Booking (IRCTC Clone)

Welcome to RailAI, a full-stack AI-powered train ticket booking platform with a modern, responsive Glassmorphism UI styling inspired by modern IRCTC redesign concepts.

## 🌟 Features
- **Modern UI**: Full Dark-mode, glassmorphism design with responsive TailwindCSS layout.
- **AI Smart Recommendations**: Uses Google Generative AI (Gemini) to recommend the best trains, class, seat type, and predicts comfort level based on user age, budget, gender, and preferences.
- **RESTful Backend**: Node.js & Express API with secure JWT authentication.
- **NoSQL DB**: MongoDB with Mongoose Schema definitions for Users, Trains, and Bookings.
- **User Dashboard**: See your entire booking history alongside your confirmed train tickets natively.

## 🛠 Tech Stack
- **Frontend**: Next.js (React), Tailwind CSS, Lucide Icons, Axios.
- **Backend**: Node.js, Express.js, Mongoose, JWT, Google Generative AI Auth.
- **Database**: MongoDB

## 🚀 Step-by-Step Run Instructions

### 1. Prerequisites
- Node.js installed (v18+)
- MongoDB installed locally OR cluster instance ready.
- Google Gemini API Key

### 2. Setting Up the Backend
1. Open up a terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Create a `.env` file (one is already prepared). Be sure to edit your `GEMINI_API_KEY` in `.env`:
   ```bash
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/irctc-clone
   JWT_SECRET=super_secret_jwt_key_1234
   GEMINI_API_KEY=your_google_ai_key_here
   ```
3. Ensure packages are installed:
   ```bash
   npm install
   ```
4. Start the backend DEV server:
   ```bash
   node index.js
   ```
   *Server will run on `http://localhost:5000`*

### 3. Setting Up the Frontend
1. Open up a new terminal and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install the necessary packages:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *Frontend will run on `http://localhost:3000`*

### 4. Experience the App
1. Go to `http://localhost:3000` in your web browser.
2. The UI is completely generated.
3. Once you search for a route (e.g., `YPR Yesvantpur Jn` to `SUR Solapur Jn`), it calls `http://localhost:5000/api/trains/seed` to seed the database with mock trains automatically if none exist.
4. AI Recommendations will load beautifully with the train data! You can navigate to Login/Signup to authenticate.

---
### 📦 Project Structure
- **client/**: Next.js Frontend. Key files in `src/app/` and `src/components/`.
- **server/**: Express.js Backend. Contains routes, controllers, and Mongoose Models.
- **models/**: Defines Users, Trains, and Bookings.
- **services/**: Connects to Google Gen AI for the Suitability system!

*Enjoy your highly-scalable AI booking platform!*
