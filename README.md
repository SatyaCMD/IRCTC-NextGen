# 🚂 IRCTC 2.0 - Next Generation Ticket Booking

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Version](https://img.shields.io/badge/version-2.0.0-success.svg) ![React](https://img.shields.io/badge/React-18.x-61dafb.svg?logo=react) ![Next.js](https://img.shields.io/badge/Next.js-14.x-black.svg?logo=next.js) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg?logo=mongodb)

Welcome to **IRCTC 2.0**, a full-stack AI-powered travel and hospitality booking platform. Featuring a modern, highly responsive glassmorphism UI, this application is a dramatic upgrade to standard booking systems, introducing dynamic AI support, advanced filtering, official E-ticket generation, and an expansive multi-service architecture spanning all of India.

> [!TIP]
> Experience seamless bookings across Trains, Flights, Buses, and Hospitality.

---

## 🌟 Key Features

### 1. 🧳 Multi-Service Booking Ecosystem
- **Comprehensive Travel Options**: Book Trains, Domestic Flights (IndiGo, Air India Express), Premium Buses, Hill Railways, Tourist Trains, and Private Charters.
- **Hospitality & Catering**: Directly book luxury Hotels (Taj, ITC, OYO), IRCTC Retiring Rooms at major junctions, and E-Catering deliveries to your train seat (Domino's, Haldiram's).
- **Location Autocomplete**: Seamless, natively-built autocomplete dropdowns powered by a massive client-side registry of major Indian stations, airports, and cities.

### 2. 🤖 DishaAI - Intelligent Digital Assistant
- Powered by **Google Gemini 1.5 Flash**, `DishaAI` is a persistent floating chatbot accessible anywhere on the platform (except auth pages).
- Configured specifically to act as an IRCTC customer support agent, answering queries about PNR status, service bookings, routing, and travel rules.

### 3. 🎫 Dual-Format Professional Ticket Generation (PDF)
- **Transit Services (Trains/Flights/Buses)**: Generates the classic **IRCTC Electronic Reservation Slip (ERS)** format with PNRs, Coach/Seat details, Waitlist Acronyms, and an 18% convenience fee breakdown.
- **Specialized Services**: Dynamically switches to generate a professional **Booking Confirmation Voucher** featuring Booking IDs, Service Fare summaries, Check-in/Delivery timelines, and explicit presentation instructions.

### 4. 💳 Integrated IRCTC Wallet & Instant Refunds
- **Wallet System**: Users have a dedicated IRCTC Wallet visible on their Profile dashboard, allowing them to explicitly recharge funds.
- **Split Payments**: Automatically detects wallet balances and allows users to deduct wallet funds directly against the total payable amount.
- **Instant Refunds**: Any ticket cancellation instantly calculates the eligible refund amount (based on time to departure) and credits it directly to the IRCTC Wallet.

### 5. 🖼️ Rich UI Metadata & Dynamic Service Generation
- Advanced interactive UI for specialized services. Searching for Hotels or E-Catering automatically generates localized, randomized metadata including **premium interactive images, context-aware descriptions, real user reviews, and 5-star rating metrics**.

### 6. 📊 Admin Dashboard & Real-Time Tracking
- Dedicated **`/admin`** panel protected by unique credentials and OTP verification.
  - **Admin ID**: `admin`
  - **Password**: `admin@321`
  - **Random OTP**: `******`
- **Total Revenue Tracking**: Tracks all incoming revenue. Cancellations intelligently reverse the revenue to maintain financial consistency.

---

## 🛠 Tech Stack

| Frontend | Backend | AI Integration |
| :--- | :--- | :--- |
| Next.js 14, React, Tailwind CSS | Node.js, Express.js | `@google/generative-ai` |
| Lucide Icons, Axios, jsPDF | MongoDB, JWT | Gemini 1.5 Flash & Pro |

---

## 🚀 Setup & Installation

> [!IMPORTANT]
> Make sure you have a valid Google Gemini API Key and MongoDB instance ready.

### 1. Setting Up the Backend
```bash
cd server
npm install
```
Create a `.env` file containing:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/irctc-clone
JWT_SECRET=super_secret_jwt_key_1234
GEMINI_API_KEY=your_google_ai_key_here
```
Run the server:
```bash
node index.js
```
*(The API will be available at `http://localhost:5000`)*

### 2. Database Seeding (Massive Data Injection)
To fully populate the platform with realistic Indian locations and services, run the provided seed scripts:
```bash
node massive_seed.js
node mega_seed.js
```
*This injects over 480 state-wise hotels, retiring rooms, and domestic services into the MongoDB database.*

### 3. Setting Up the Frontend
```bash
cd client
npm install
npm run dev
```
*(The web app will run on `http://localhost:3000`)*

---

## 📱 Platform Walkthrough

1. **Homepage**: Search for trains with the autocomplete dropdown. Click on secondary services like Hotels or Charter Trains to enter the unified booking pipeline.
2. **Booking Flow**: Pick dates within the 1-month window. Proceed to passenger details (prompts login if unauthenticated). Enter payment details and instantly receive a professional IRCTC PDF Ticket.
3. **My Bookings (`/history`)**: Track past and future bookings (up to 3 months). Use the "Cancel Ticket" button to reverse a transaction.
4. **Interactive Reviews**: View and post interactive 5-star reviews for Hospitality services!

---
*Built with modern design aesthetics and strict functional reliability.*
