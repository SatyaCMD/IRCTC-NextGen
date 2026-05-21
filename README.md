# IRCTC NextGen (IRCTC 2.0)

Welcome to **IRCTC NextGen**, a fully reimagined, state-of-the-art railway ticketing and management platform. This project brings the classic Indian Railways catering and tourism application into the modern era with a sleek UI, robust backend architecture, AI-driven recommendations, and comprehensive administrative controls.

---

## 🌟 Key Features

### 🚄 For Travelers
*   **Sleek & Modern UI:** A beautiful, dark-themed responsive interface designed to feel premium and incredibly intuitive.
*   **Multi-Modal Bookings:** Book Trains, Flights, Hotels, Retiring Rooms, E-Catering, and Holiday Packages all in one place.
*   **AI Smart Assistant:** A built-in AI concierge that recommends alternative routes, optimal layovers, and travel insights based on live inventory.
*   **Digital Wallet & Instant Refunds:** Top-up your IRCTC wallet seamlessly. Cancelled tickets result in instant, 0-latency wallet refunds.
*   **Automated Notification Engine:** You will receive beautifully branded HTML emails for every major event:
    *   Mandatory Email Verifications
    *   2FA Login OTPs
    *   Booking Confirmations & PDF e-Tickets
    *   Cancellation & Refund Receipts
    *   Wallet Top-up Alerts
    *   Train Reschedule/Delay Alerts
    *   Profile Modification Security Alerts
    *   "Travel Tomorrow" Journey Reminders
    *   Post-Journey Feedback Requests
*   **Automated E-Tickets:** Dynamically generated PDF tickets attached directly to your booking confirmation emails.
*   **Strict Security:** Mandatory Email Verification, Two-Factor Authentication (OTP) for login, and secure session management.

### 🛡️ For Administrators (Super Admin Panel)
*   **Real-Time Analytics Dashboard:** Monitor live active users, total bookings, system health, and MTD revenue.
*   **Database Management:** Full CRUD control over Users, Trains, and Services directly from the UI.
*   **Wallet Adjustments:** Admins can manually credit or debit user wallets to resolve disputes (automatically notifying the user via email).
*   **Mass Marketing Engine:** A built-in mass-mailer tool to dispatch promotional HTML emails (e.g., Holiday Specials) to all verified users simultaneously.
*   **System Toggles:** Single-click toggles for "Maintenance Mode", enabling/disabling the AI Assistant, and setting global commission rates.

---

## 🛠️ Technology Stack

**Frontend:**
*   Next.js 14 (App Router)
*   React
*   Tailwind CSS (Vanilla Custom Configurations)
*   Lucide React (Icons)
*   jsPDF & jsPDF-AutoTable (Client-side PDF Generation)

**Backend:**
*   Node.js & Express.js
*   MongoDB & Mongoose
*   JSON Web Tokens (JWT) & bcryptjs
*   Nodemailer (Automated SMTP Email Engine)
*   Node-Cron (Background scheduling)
*   Google Gemini AI (Integration for the AI Assistant)

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   MongoDB instance (Local or Atlas)
*   SMTP Email Account (e.g., Gmail App Password)
*   Google Gemini API Key (for AI features)

### 1. Environment Setup

Create a `.env` file in the `server` directory with the following variables:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_google_gemini_api_key

# Email SMTP Setup (For real emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 2. Run the Backend (Server)
```bash
cd server
npm install
node index.js
```
*The server will boot up on `http://localhost:5000`. It will automatically seed mock trains and start the background Cron jobs.*

### 3. Run the Frontend (Client)
```bash
cd client
npm install
npm run dev
```
*The frontend will boot up on `http://localhost:3000`.*

---

## 🤖 Automated Cron Jobs
The system runs background tasks continuously:
1.  **Chart Preparation (Hourly):** Scans for trains departing in 4 hours and emails waitlisted users their final seat assignments.
2.  **Journey Reminders (Daily at 8 AM):** Emails "Travel Tomorrow" alerts to users whose journeys start the next day.
3.  **Journey Feedback (Daily at 8 PM):** Emails a "Rate Your Journey" request to users whose journeys concluded yesterday.

---

## 🔒 Security Architecture
*   **Smart Account Deletion:** Users cannot delete their accounts if they have active/past bookings. If they are clean, the account is securely wiped via a cascading delete, wiping them from the database and Admin panels instantly.
*   **No Demo Backdoors:** All "demo" buttons have been purged. Admins must log in using the secure, hashed `admin@952` password.
*   **Mandatory OTP Verification:** If network drops prevent email delivery, the screen will always display the exact fallback code to prevent lockouts.

---

*Built for the future of Indian Railways.*
