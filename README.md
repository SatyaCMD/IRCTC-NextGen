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

### 3. Dual-Format Professional Ticket Generation (PDF)
- **Transit Services (Trains/Flights/Buses)**: Generates the classic **IRCTC Electronic Reservation Slip (ERS)** format with PNRs, Coach/Seat details, Waitlist Acronyms, and an 18% convenience fee breakdown.
- **Specialized Services (Hotels/Retiring Rooms/Catering/Holiday Packs)**: Dynamically switches to generate a professional **Booking Confirmation Voucher** featuring Booking IDs, Service Fare summaries, Check-in/Delivery timelines, and explicit presentation instructions.

### 4. Integrated IRCTC Wallet & Instant Refunds
- **Wallet System**: Users have a dedicated IRCTC Wallet visible on their Profile dashboard, allowing them to explicitly recharge funds.
- **Split Payments**: On the checkout screen, the platform automatically detects wallet balances and allows users to deduct wallet funds directly against the total payable amount, leaving only the remainder for Card/UPI processing.
- **Instant Refunds**: Any ticket cancellation instantly calculates the eligible refund amount (based on time to departure) and credits it directly to the IRCTC Wallet with a secure transaction history logged on the backend.

### 5. Rich UI Metadata & Dynamic Service Generation
- Advanced interactive UI for specialized services. Searching for Hotels or E-Catering automatically generates localized, randomized metadata including **premium interactive images, context-aware descriptions, ratings, and review counts** to replicate a highly polished booking experience.
- The platform enforces strict mandatory form validation across passenger and contact details to ensure data integrity during checkout.

### 6. Admin Dashboard & Real-Time Tracking
- Dedicated **`/admin`** panel protected by unique credentials and OTP verification.
  - **Admin ID**: `admin`
  - **Password**: `admin@321`
  - **Random OTP**: `******`
- **Total Revenue Tracking**: Tracks all incoming revenue. If a user cancels a confirmed booking, the backend intelligently reverses the revenue from the dashboard to maintain financial consistency.
- Full CRUD access to manage the 480+ seeded location services dynamically.

### 7. Security & Session Management
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
