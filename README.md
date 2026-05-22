<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/en/4/45/IRCTC_Logo.svg" alt="IRCTC Logo" width="150" />

  # IRCTC NextGen (IRCTC 2.0)
  
  **The Definitive Modernization of Indian Railways Ticketing & Management**

  [![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
  [![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
  [![Gemini AI](https://img.shields.io/badge/AI-Google_Gemini-blue?style=for-the-badge&logo=google)](https://ai.google.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

  *A fully reimagined, state-of-the-art railway ticketing platform featuring a sleek UI, robust backend architecture, AI-driven recommendations, automated Cron engine, and comprehensive administrative controls.*
</div>

---

## 🌟 The Vision

IRCTC NextGen is not just a ticketing portal; it is an intelligent, highly resilient travel ecosystem. We have taken the core functionalities of the classic Indian Railways platform and supercharged them with modern web technologies to deliver an unparalleled user experience. From instantaneous digital wallet refunds to an AI concierge that plans your itinerary, IRCTC 2.0 is built for speed, security, and enterprise-grade scale. 

The traditional system handles millions of concurrent hits, which requires rigorous architectural decisions. This clone aims to replicate the vast array of services—including Trains, Flights, Hotels, and E-Catering—while abstracting the heavy lifting behind a beautiful, dark-themed, ultra-fast interface.

---

## 🚀 Flagship Capabilities

### 🚄 1. Multi-Modal Unified Booking
Gone are the days of jumping between applications. IRCTC 2.0 unifies the entire travel ecosystem:
- **Trains:** Real-time inventory mapping, dynamic seat generation, and instant PNR assignment.
- **Flights & Hotels:** Integrated booking flows generating mock cross-service itineraries.
- **Retiring Rooms & E-Catering:** Book station retiring rooms seamlessly and have hot food delivered directly to your train coach based on your PNR.

### 🤖 2. "Ask Disha" - AI Smart Assistant
Powered by the cutting-edge **Google Gemini API**, the built-in AI concierge understands natural language and context to help users:
- Find optimal train routes for obscure destinations and layovers.
- Suggest alternative travel dates based on historical availability patterns.
- Provide real-time travel tips, baggage guidelines, and local weather forecasts for destination stations.

### 💳 3. Digital Wallet & Zero-Latency Refunds
The custom-built IRCTC Digital Wallet eliminates the frustration of waiting 3-5 business days for bank refunds.
- **Instant Top-ups:** Add funds instantly via secure, mocked payment gateway endpoints.
- **0-Latency Refunds:** If a ticket is cancelled by the user, or if a waitlisted ticket fails to confirm upon chart preparation, funds are instantaneously reversed back to the IRCTC Wallet. This ledger system maintains perfect transactional integrity.

### 📧 4. Automated Communication Engine
A highly sophisticated background **CRON engine** handles all asynchronous communications. By detaching email dispatch from the main event loop, the API remains lightning-fast. The system delivers beautifully branded HTML emails for every major lifecycle event:
- **Pre-Journey:** "Travel Tomorrow" reminders and Chart Preparation (Seat Confirmation) alerts.
- **Security:** Profile modification alerts and 2FA Login OTPs.
- **Post-Journey:** Automated feedback requests to rate cleanliness and punctuality.
- **Disruptions:** Real-time Train Delay and Reschedule broadcasts sent to all affected passengers.
- **Admin Adjustments:** Receipts sent automatically whenever an Admin manually adjusts a user's wallet balance.

---

## 🛡️ Enterprise-Grade Security Architecture

We take user data and system integrity seriously. The platform is fortified with multiple layers of proactive and reactive security protocols:

> [!IMPORTANT]  
> **Smart Account Deletion Protocol**
> Users cannot blindly delete their accounts to wipe historical data. The system performs a deep validation check against the database; if active or historical bookings exist, deletion is hard-blocked to preserve financial and PNR ledger integrity. If no bookings exist, a cascading delete completely scrubs the user from the MongoDB collections.

- **Mandatory Email Verification:** No ghost accounts allowed. Every registration requires a secure token-based email validation before the very first login is permitted.
- **Two-Factor Authentication (2FA):** Every login attempt is secured by a dynamic 6-digit OTP sent to the registered email address. Without access to the email inbox, the account cannot be breached.
- **Device & IP Tracking:** Security alert emails are instantly dispatched if an account is accessed from an unknown device, detailing the IP address, User-Agent, and Geolocation.
- **Stateless Sessions:** Using strictly verified `jsonwebtoken` (JWT), sessions are managed securely without taxing the database. Tokens are transmitted via secure HTTP headers.

---

## 📊 Super Admin Command Center

The backend isn't a black box. The platform includes a visually stunning, dark-themed **Super Admin Control Panel** giving operators God-level control over the ecosystem.

### Command Center Modules:

| Module | Description | Operational Scope |
| :--- | :--- | :--- |
| **Live Analytics** | Monitor active users, system health, active bookings, and Month-to-Date (MTD) revenue streams. | View Only |
| **User Ledger Management** | Manually credit or debit user wallets to resolve support disputes. Modifying a wallet instantly triggers an automated receipt email explaining the adjustment. | Read / Write |
| **Service Status Controls** | Place individual trains, hotels, or flights into "Maintenance Mode", instantly hiding them from user searches to prevent booking failures during outages. | Read / Write |
| **Train Delay Broadcasts** | Update the schedule of a delayed train. The system will automatically query all active bookings for that train and blast a Schedule Update email to the passengers. | Read / Write |
| **Mass Marketing Engine** | A built-in rich-text mass-mailer tool. Compose and dispatch promotional HTML emails (e.g., *Diwali Special 10% Cashback*) to all verified users simultaneously. | Execute |
| **Global System Toggles** | Single-click switches to activate global "Maintenance Mode", throttle AI features, or adjust global booking commission rates. | Write |

---

## 🏗️ System Architecture & Data Flow

The system is built on a decoupled Client-Server architecture ensuring high availability, separation of concerns, and easy scalability.

### Frontend (Client-Side)
- **Framework:** Next.js 14 utilizing the modern App Router architecture for optimal Server-Side Rendering (SSR) and Client-Side Routing.
- **Styling:** Bespoke, utility-first styling using Tailwind CSS. The design heavily leans into glassmorphism, smooth micro-animations, and a highly polished dark mode.
- **State Management:** React Hooks and local storage for non-sensitive UI states, prioritizing speed.
- **Client-Side PDF Generation:** To prevent server bottlenecking during peak booking hours, the `jsPDF` library generates the beautiful, printable e-Tickets directly on the client's machine.

### Backend (Server-Side)
- **Framework:** Express.js running on a Node.js runtime.
- **Database:** MongoDB (Atlas or Local), utilizing Mongoose for strict schema validation.
- **Background Processes:** `node-cron` handles tasks that run hourly and daily (like Chart Preparations and Journey Reminders).
- **Mailing Service:** `nodemailer` integrates with secure SMTP servers (e.g., Gmail) to deliver rich HTML templates seamlessly.

### Database Schema Overview
The MongoDB database is strictly typed utilizing Mongoose Models:
1. **User Schema:** Handles authentication details, encrypted passwords (`bcryptjs`), wallet balances, KYC statuses, and nested preferences.
2. **Train & Service Schema:** Dynamic inventory tables handling Classes (1AC, 2AC, CC), dynamic pricing, and seat availability.
3. **Booking Schema:** The central ledger linking Users to Services. Tracks PNRs, passenger lists, payment statuses, and transaction timestamps.

---

## 🛠️ API Documentation (Core Endpoints)

The REST API is organized logically and secured via JWT middleware.

### Auth & User (`/api/auth`)
*   `POST /register` - Creates a new unverified user.
*   `POST /verify-email` - Validates the email token.
*   `POST /login` - Validates credentials and dispatches 2FA OTP.
*   `POST /verify-otp` - Validates OTP and returns the final JWT token.
*   `PUT /profile` - Updates user details and triggers Security Email.
*   `DELETE /delete-account` - Validates booking history and deletes the account.

### Bookings (`/api/bookings`)
*   `POST /create` - Deducts wallet balance, generates PNR, decrements live seat inventory, and sends confirmation email.
*   `PUT /cancel/:id` - Reverts inventory, credits the user's wallet with the refund, updates ledger, and sends cancellation email.

### Admin (`/api/admin`)
*   `GET /stats` - Aggregates total users, bookings, and revenue.
*   `PUT /users/:id/wallet` - Adjusts user balance and triggers Admin Action email.
*   `PUT /trains/:id/status` - Updates train times and triggers Train Delay emails.
*   `POST /promo` - Loops through all verified users and dispatches promotional HTML emails.

---

## 🚀 Getting Started & Installation Guide

Follow these steps to get a local instance of IRCTC NextGen running on your machine.

### Prerequisites
*   **Node.js:** v18.0.0 or higher.
*   **MongoDB:** A local MongoDB instance or a free MongoDB Atlas cluster URI.
*   **SMTP Credentials:** A standard Gmail account with an "App Password" generated for Nodemailer.
*   **Google Gemini API Key:** Required to power the Ask Disha AI Assistant.

### 1. Environment Variable Setup

Navigate to the `server` directory and create a `.env` file. Do not commit this file to version control.

```env
# Server Configuration
PORT=5000

# Database Configuration
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/irctc?retryWrites=true&w=majority

# Security Keys
JWT_SECRET=generate_a_random_very_long_secure_string_here

# AI Integration
GEMINI_API_KEY=your_google_gemini_api_key_here

# Automated Email Engine Setup (SMTP)
# Using Gmail as an example
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_digit_gmail_app_password
```

### 2. Booting up the Backend Engine

Open a terminal and navigate to the backend directory. Install the dependencies and start the Node.js server.

```bash
cd server
npm install
npm start
```

*Expected Output:*
```
Connected to MongoDB
Automated Notification Engine (Cron Jobs) Started.
Server running on port 5000
```
*Note: The server will automatically seed mock Trains and Services into your database upon the first boot.*

### 3. Booting up the Frontend Interface

Open a second, separate terminal window. Navigate to the client directory, install the dependencies, and run the Next.js development server.

```bash
cd client
npm install
npm run dev
```

*Expected Output:*
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### 4. Accessing the Platforms

*   **Main User Portal:** Open your browser and navigate to `http://localhost:3000`. You can register a new account here.
*   **Super Admin Portal:** Navigate to `http://localhost:3000/admin`. 
    *   *Default Admin Login:* Use the email `admin@irctc.com` and password `admin@952` to access the Command Center.

---

## 🚢 Deployment Strategies

To take IRCTC NextGen to production, follow these recommended strategies:

1. **Frontend (Vercel):** The Next.js application is highly optimized for deployment on Vercel. Connect your GitHub repository to Vercel and it will automatically handle build steps and Serverless Functions mapping.
2. **Backend (Render / Railway / AWS EC2):** The Node.js server requires a persistent environment to ensure the `node-cron` background jobs run continuously. Deploy the server folder to a service like Render or an AWS EC2 instance. Ensure you inject your `.env` variables into the host's environment settings.
3. **Database (MongoDB Atlas):** Scale your MongoDB Atlas cluster depending on concurrent user traffic. Ensure your IP whitelists are configured to allow access from your backend host server.

---

## 🔮 Future Roadmap

While IRCTC 2.0 is highly robust, continuous improvement is critical. Planned future updates include:

*   **Visual Seat Maps:** Implementing a graphical coach layout for premium trains (Shatabdi, Vande Bharat) allowing users to select exact seats before checkout.
*   **Waitlist Prediction AI:** Utilizing machine learning models to analyze historical confirmation trends and provide users with a "Probability of Confirmation" percentage when booking WL tickets.
*   **Live Train Tracking Map:** Integrating external APIs and Mapbox to show the real-time physical location of trains on a graphical interface.
*   **Progressive Web App (PWA):** Making the web client installable on mobile devices with native push notifications for boarding alerts.
*   **Payment Gateway Webhooks:** Upgrading the mock wallet top-up logic to utilize secure, signed webhooks from Stripe or Razorpay to absolutely guarantee payment finality.

<div align="center">
  <br>
  <i>Built by <a href="https://www.satyacmd.dev">Er.SatyaCMD</a> for the future of Indian Railways.</i>
</div>
