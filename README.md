# 🚂 IRCTC 2.0 - Next Generation Ticket Booking (IRCTC Clone)

Welcome to **IRCTC 2.0**, a full-stack AI-powered travel and hospitality booking platform. Featuring a modern, highly responsive glassmorphism UI, this application is a dramatic upgrade to standard booking systems, introducing dynamic AI support, advanced filtering, official E-ticket generation, and an expansive multi-service architecture spanning all of India.

---

## 🌟 Key Features

### 1. Multi-Service Booking Ecosystem
- **Comprehensive Travel Options**: Book Trains, Domestic Flights (IndiGo, Air India Express), Premium Buses, Hill Railways, Tourist Trains, and Private Charters.
- **Hospitality & Catering**: Directly book luxury Hotels (Taj, ITC, OYO), IRCTC Retiring Rooms at major junctions, and E-Catering deliveries to your train seat (Domino's, Haldiram's).
- **Location Autocomplete**: Seamless, natively-built autocomplete dropdowns powered by a massive client-side registry of major Indian stations, airports, and cities.
- **Strict Booking Logic**: Enforces realistic constraints, such as a **1-month maximum advance booking window** locking the calendar dynamically.

### 2. DishaAI - Intelligent Digital Assistant
- Powered by **Google Gemini 2.5 Flash**, `DishaAI` is a persistent floating chatbot accessible anywhere on the platform (except auth pages).
- Configured specifically to act as an IRCTC customer support agent, answering queries about PNR status, service bookings, routing, and travel rules.
- Features real-time typing indicators and intelligent scroll behavior.

### 3. Professional Ticket Generation (PDF)
- Simulates the official **IRCTC Electronic Reservation Slip (ERS)** format.
- Uses `jsPDF` to dynamically compile PNRs, Transaction IDs, passenger details, strict grid layouts, and an 18% convenience fee breakdown into a downloadable, professional ticket.

### 4. Admin Dashboard & Real-Time Tracking
- Dedicated **`/admin`** panel protected by unique credentials and OTP verification.
  - **Demo Admin ID**: `admin`
  - **Demo Password**: `admin123`
  - **Demo OTP**: `123456`
- **Total Revenue Tracking**: Tracks all incoming revenue. If a user cancels a confirmed booking, the backend intelligently reverses the revenue from the dashboard to maintain financial consistency.
- Full CRUD access to manage the 480+ seeded location services dynamically.

### 5. Security & Session Management
- **JWT Authentication**: Secured routing. Users must be logged in to proceed past the initial search step on any booking flow.
- **30-Minute Session Timer**: A strict inactivity timer sits globally in the bottom corner. It resets upon user interaction (mouse move, keypress) but immediately drops the session token and forces logout if inactivity reaches 00:00. 

---

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Lucide Icons, Axios, jsPDF
- **Backend**: Node.js, Express.js, JWT, Mongoose
- **Database**: MongoDB (Atlas or Local)
- **AI Integration**: `@google/genai` (Gemini API)

---

## 🚀 Setup & Installation

### 1. Prerequisites
- Node.js installed (v18+)
- MongoDB installed locally OR cluster instance ready.
- A valid Google Gemini API Key

### 2. Setting Up the Backend
Navigate to the server directory:
```bash
cd server
```
Create a `.env` file containing:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/irctc-clone
JWT_SECRET=super_secret_jwt_key_1234
GEMINI_API_KEY=your_google_ai_key_here
```
Install dependencies and run the server:
```bash
npm install
node index.js
```
*(The API will be available at `http://localhost:5000`)*

### 3. Database Seeding (Massive Data Injection)
To fully populate the platform with realistic Indian locations and services, run the provided seed scripts:
```bash
node massive_seed.js
node mega_seed.js
```
*This injects over 480 state-wise hotels, retiring rooms, and domestic services into the MongoDB database.*

### 4. Setting Up the Frontend
Navigate to the client directory:
```bash
cd client
```
Install dependencies and start the dev server:
```bash
npm install
npm run dev
```
*(The web app will run on `http://localhost:3000`)*

---

## 📱 Platform Walkthrough

1. **Homepage**: Search for trains with the autocomplete dropdown. Click on secondary services like Hotels or Charter Trains to enter the unified booking pipeline.
2. **Booking Flow**: Pick dates within the 1-month window. Proceed to passenger details (prompts login if unauthenticated). Enter payment details and instantly receive a professional IRCTC PDF Ticket.
3. **My Bookings (`/history`)**: Track past and future bookings (up to 3 months). Use the "Cancel Ticket" button to reverse a transaction.
4. **DishaAI**: Click the floating button to ask questions about your travel plans!
5. **Admin Access**: Navigate to `/admin`, log in, and verify with OTP to access system-wide analytics and service management.

---
*Built with modern design aesthetics and strict functional reliability.*
