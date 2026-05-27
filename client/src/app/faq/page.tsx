'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  ArrowLeft, 
  Search, 
  ChevronDown, 
  HelpCircle, 
  Train, 
  CreditCard, 
  ShieldAlert, 
  Wrench, 
  MessageSquare,
  ChevronRight
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const categories = [
    { name: 'All', icon: HelpCircle },
    { name: 'Train & PNR', icon: Train },
    { name: 'Payments & Refunds', icon: CreditCard },
    { name: 'Account & Security', icon: ShieldAlert },
    { name: 'Technical Support', icon: Wrench },
  ];

  const faqs: FAQItem[] = [
    {
      category: 'Train & PNR',
      question: 'How do I check my PNR status in real time?',
      answer: 'To check your PNR status, go to the PNR Status page from the main navigation bar. Enter your 10-digit PNR number in the search input and click "Check PNR Status". The system will instantly retrieve and display your current booking class, coach number, and seat confirmation status.',
    },
    {
      category: 'Train & PNR',
      question: 'What is the Aadhaar verification ticket booking limit?',
      answer: 'To provide frequent travelers with more flexibility, IRCTC 2.0 has increased the ticket booking limit per month to 24 tickets for all Aadhaar-verified user accounts. Unverified accounts retain a standard monthly limit of 12 tickets.',
    },
    {
      category: 'Train & PNR',
      question: 'How does the AI predictive confirmation probability work?',
      answer: 'Our proprietary machine learning model processes historical reservation trends, seasonality metrics, current waitlist position decay, and scheduled holiday loads to generate a precise "Confirmation Probability Percentage". This helps you make informed choices before booking waitlisted train berths.',
    },
    {
      category: 'Train & PNR',
      question: 'How does seat allocation auto-upgradation work?',
      answer: 'Auto-upgradation allows waitlisted or lower-class passengers to be promoted to higher vacant classes (e.g., from Sleeper to 3AC, or 3AC to 2AC) at no extra cost. This process is triggered automatically during final chart preparation depending on vacant premium berths and booking class hierarchies.',
    },
    {
      category: 'Train & PNR',
      question: 'What are the timings for Tatkal ticket bookings?',
      answer: 'Tatkal bookings open daily exactly one day in advance of the train departure station start date. For air-conditioned classes (1A, 2A, 3A, CC), the booking window opens at 10:00 AM IST. For non-AC classes (SL, 2S), the window opens at 11:00 AM IST.',
    },
    {
      category: 'Train & PNR',
      question: 'How many passengers can be booked on a single e-ticket?',
      answer: 'A maximum of 6 passengers can be booked on a single standard e-ticket. For Tatkal bookings, the limit is reduced to 4 passengers per ticket to ensure equitable distribution during high-demand booking hours.',
    },
    {
      category: 'Train & PNR',
      question: 'What is the difference between RAC (Reservation Against Cancellation) and WL (Waitlist)?',
      answer: 'RAC passengers are allocated a shared side-lower berth, allowing travel on the train. As passengers with confirmed berths cancel, RAC ticket holders are upgraded to full vacant sleeper berths. WL (Waitlist) passengers are not allocated any seats and are not allowed to board the train unless their status is upgraded to RAC or CNF before departure.',
    },
    {
      category: 'Train & PNR',
      question: 'What are the RLWL and PQWL waitlist quotas?',
      answer: 'RLWL (Remote Location Waitlist) is for passengers boarding from intermediate major stations. PQWL (Pooled Quota Waitlist) is shared across several smaller stations on the route. RLWL generally has a higher confirmation probability than PQWL, as cancellations are pooled regionally.',
    },
    {
      category: 'Train & PNR',
      question: 'Can I change my boarding point after booking a ticket?',
      answer: 'Yes, you can change your boarding point online at least 24 hours prior to the scheduled departure of the train. Once changed, the original boarding point is forfeited, and you cannot board from the original station.',
    },
    {
      category: 'Train & PNR',
      question: 'How do I check the live running status of a train?',
      answer: 'Go to the Live Train Tracking page from the navigation menu, enter the train name or number, and select the start date. The portal will display real-time coordinates, current speed, delay timelines, and upcoming station platforms.',
    },
    {
      category: 'Train & PNR',
      question: 'What is the premium tatkal booking quota and how does dynamic pricing apply?',
      answer: 'Premium Tatkal is a premium quota with dynamic pricing. As booking seats fill up, fare rates scale dynamically based on real-time demand. Dynamic pricing applies to all classes except sleeper, and no concessions (senior citizen, child) apply.',
    },
    {
      category: 'Train & PNR',
      question: 'Are children charged full fare on train reservations?',
      answer: 'Children between the ages of 5 and 12 are charged full adult fare if a separate berth/seat is requested. If no separate berth is opted, they are charged half the base fare. Children under 5 years travel free of charge without seat allocation.',
    },
    {
      category: 'Train & PNR',
      question: 'Can I book a ticket under the ladies quota online?',
      answer: 'Yes, the Ladies Quota (LD) is available online for female passengers traveling alone or with children under 12 years. It allocates standard lower or middle berths in a dedicated compartment segment for safety.',
    },
    {
      category: 'Train & PNR',
      question: 'What is the procedure to book a ticket for Divyangjan (specially-abled)?',
      answer: 'Specially-abled passengers must register their valid government-issued Unique Disability ID (UDID) on their profile. During booking, select the Divyangjan quota to access reserved accessible coaches and dynamic concessions.',
    },
    {
      category: 'Train & PNR',
      question: 'What happens if the chart is prepared and my ticket remains waitlisted?',
      answer: 'If an e-ticket remains fully waitlisted (WL) after final chart preparation, it is automatically cancelled by the system. The refund is credited back to your original payment mode within 2 to 3 working days, and traveling on waitlisted e-tickets is illegal.',
    },
    {
      category: 'Train & PNR',
      question: 'How do I carry my ticket during the journey? Is a digital copy sufficient?',
      answer: 'Yes, a digital copy (SMS, email confirmation, or E-Ticket PDF on your smartphone) is fully accepted by Ticket Collectors. You must carry a valid original government-issued photo ID card (Aadhaar, PAN, Voter ID, Passport, or Driving License) matching passenger names.',
    },
    {
      category: 'Payments & Refunds',
      question: 'What happens if my account is debited but the ticket booking fails?',
      answer: 'Rest assured, your funds are fully secure. In the rare event of a transactional failure where payment is processed but the booking does not succeed, our automated gateway initiates an immediate refund. The funds will be credited back to your original payment source (credit card, UPI, or banking wallet) within 2 to 3 business days.',
    },
    {
      category: 'Payments & Refunds',
      question: 'How can I trace the status of my ticket refund?',
      answer: 'To check a refund, log in to your account and navigate to the Refund History page. You will see a chronological breakdown of cancelled tickets, each marked with a bank transaction Reference Number (UTR) and stage timeline.',
    },
    {
      category: 'Payments & Refunds',
      question: 'What payment methods are supported on the IRCTC 2.0 portal?',
      answer: 'We support all major payment modes, including credit/debit cards (Visa, MasterCard, RuPay, Maestro), Netbanking across all national banks, BHIM UPI (via QR scanning or VPA handle), and the integrated IRCTC Wallet for instant one-click checkouts.',
    },
    {
      category: 'Payments & Refunds',
      question: 'Are there any transaction charges for using international credit cards?',
      answer: 'Yes, international credit and debit cards attract a standard processing surcharge of 1.8% plus applicable GST on the total ticket transaction value. This fee is charged directly by the gateway provider.',
    },
    {
      category: 'Payments & Refunds',
      question: 'How is the convenience fee calculated for e-tickets?',
      answer: 'The convenience fee depends on the class of travel and the payment method used. Non-AC classes (2S, SL) carry a lower convenience fee, whereas AC classes carry a standard fee. Paying via UPI carries a discounted convenience fee compared to credit cards.',
    },
    {
      category: 'Payments & Refunds',
      question: 'What is the refund policy for Tatkal ticket cancellations?',
      answer: 'No refund is granted on the cancellation of confirmed Tatkal tickets. For waitlisted Tatkal tickets, standard cancellation fees apply, and the remaining amount is refunded.',
    },
    {
      category: 'Payments & Refunds',
      question: 'How much refund do I get if I cancel a confirmed ticket 48 hours before departure?',
      answer: 'If cancelled 48 hours or more before the scheduled departure of the train, flat clerkage charges apply: Rs. 240 for 1A/EC, Rs. 200 for 2A/FC, Rs. 180 for 3A/CC, and Rs. 120 for Sleeper class.',
    },
    {
      category: 'Payments & Refunds',
      question: 'What happens to my refund if the train is cancelled by railways?',
      answer: 'If the train is cancelled by railways due to weather, technical, or route reasons, the full ticket amount is automatically refunded to your account without any cancellation charges. You do not need to file a TDR in this case.',
    },
    {
      category: 'Payments & Refunds',
      question: 'How long does it take for a refund to reflect in my IRCTC Wallet?',
      answer: 'If you opt for a refund to your IRCTC Wallet, it is processed instantly. The balance will reflect in your wallet dashboard immediately after confirming the ticket cancellation, ready to use for future bookings.',
    },
    {
      category: 'Payments & Refunds',
      question: 'How does the instant wallet refund system function?',
      answer: 'When cancelling a ticket, the refund engine queries your preference. If "Wallet" is chosen, the engine bypasses traditional banking settle-cycles and instantly credits the booking ledger, allowing one-click re-booking.',
    },
    {
      category: 'Payments & Refunds',
      question: 'Can I pay for my booking using a combination of Wallet and Credit Card?',
      answer: 'Currently, split payments are not supported. If your wallet balance is insufficient to cover the total booking amount (inclusive of taxes and pantry charges), you must pay using credit cards, Netbanking, or UPI.',
    },
    {
      category: 'Payments & Refunds',
      question: 'What is the travel insurance premium and what does it cover?',
      answer: 'Travel insurance is available for a minor premium of Rs. 0.45 per passenger. It covers accidental death, permanent total disability, and hospitalization expenses during transit. It applies to all passengers except children under 5 years.',
    },
    {
      category: 'Payments & Refunds',
      question: 'How can I file a TDR (Ticket Deposit Receipt) if I missed my train?',
      answer: 'If you missed your train, log in to your account, go to Booked Tickets, select the booking, and click "File TDR" within 4 hours of the train scheduled departure. The refund will be cleared by the railways zone within 30 days upon physical validation.',
    },
    {
      category: 'Payments & Refunds',
      question: 'Are convenience fees refundable upon ticket cancellation?',
      answer: 'No. The IRCTC convenience fee is a non-refundable service fee charged for processing the e-ticket transaction. It is not refunded under any cancellation scenario.',
    },
    {
      category: 'Payments & Refunds',
      question: 'What is the refund policy for RAC or partially confirmed waitlist tickets?',
      answer: 'For RAC or partially confirmed tickets cancelled up to 30 minutes before departure, full refund is granted after deducting a standard clerkage charge of Rs. 60 per passenger.',
    },
    {
      category: 'Account & Security',
      question: 'How can I secure my account if I did not authorize a change?',
      answer: 'If your profile information or key details are changed, we instantly dispatch a verification link to your registered email address. This email contains a "Secure Account" action link. Clicking it will immediately lock your credentials, terminate all active browser sessions, and allow you to reset your password safely.',
    },
    {
      category: 'Account & Security',
      question: 'Can I edit my registered mobile number and email ID?',
      answer: 'Yes. Navigate to the "My Profile" dashboard, click "Edit Details", and input your new credentials. For safety, a secure OTP (One-Time Password) will be sent to both your existing and new communication paths. Verification of both codes is required to save modifications.',
    },
    {
      category: 'Account & Security',
      question: 'How do I activate two-factor authentication (2FA) for my login?',
      answer: 'Go to Profile settings, select "Security & Password", and toggle on Two-Factor Authentication. Once active, a secure 6-digit OTP will be emailed to you on every login attempt, ensuring maximum protection for your profile data.',
    },
    {
      category: 'Account & Security',
      question: 'What should I do if I forget my login password?',
      answer: 'On the Login page, click the "Forgot Password?" link. Enter your registered email ID. A secure link will be sent to you to verify your identity and immediately configure a new password.',
    },
    {
      category: 'Account & Security',
      question: 'How do I complete my Aadhaar verification on my profile?',
      answer: 'Navigate to "My Profile", select "Verify Aadhaar", enter your 12-digit Aadhaar number, and click send OTP. Input the verification code received on your Aadhaar-linked mobile number to complete the verification instantly.',
    },
    {
      category: 'Account & Security',
      question: 'Can I delete my registered IRCTC 2.0 account permanently?',
      answer: 'Yes. In your profile dashboard, go to "Account Settings", click "Delete Account", and verify via the secure OTP link sent to your email. This permanently wipes your user profile, saved passengers list, and card credentials.',
    },
    {
      category: 'Account & Security',
      question: 'How do I update my profile security questions?',
      answer: 'Go to Profile Settings, click "Update Security Questions", select your preferred question from the dropdown, enter your answer, and verify using the 6-digit OTP sent to your registered mobile number.',
    },
    {
      category: 'Account & Security',
      question: 'Why is my account locked, and how can I unlock it?',
      answer: 'Accounts are locked automatically after 5 consecutive failed login attempts to prevent brute-force attacks. An email is sent to you immediately with an activation link to verify your identity and unlock your account.',
    },
    {
      category: 'Account & Security',
      question: 'What is the loyalty program and how do I earn loyalty points?',
      answer: 'Our loyalty program rewards frequent travelers. You earn 50 loyalty points for every passenger booked on a confirmed journey. These points can be redeemed during checkout to purchase future e-tickets.',
    },
    {
      category: 'Account & Security',
      question: 'Can I link multiple Aadhaar numbers to a single account?',
      answer: 'No. To prevent abuse and black-marketing, a single user account can only be linked and verified with one unique Aadhaar number. The Aadhaar holder name must match the profile name.',
    },
    {
      category: 'Account & Security',
      question: 'How does the portal prevent automated script or bot bookings?',
      answer: 'We utilize advanced bot-detection algorithms, rate-limiting measures, and contextual multi-factor challenges during peak Tatkal booking hours to ensure fair and manual access for all individual users.',
    },
    {
      category: 'Account & Security',
      question: 'Is my personal information and payment history encrypted on the portal?',
      answer: 'Yes. All data, personal profiles, and transactional details are fully encrypted in transit using industry-standard TLS 1.3 encryption and stored in secure, compliance-hardened databases.',
    },
    {
      category: 'Account & Security',
      question: 'How do I verify a new mobile number if I lost my old SIM card?',
      answer: 'In the event of a lost SIM, go to Profile, select "Change Mobile Number", and click "Verify via Email Verification". A secure verification token will be sent to your email, allowing you to update your mobile number safely.',
    },
    {
      category: 'Account & Security',
      question: 'Can I transfer my ticket to a family member after booking?',
      answer: 'Yes. As per railway rules, you can transfer your confirmed ticket to a close family member (father, mother, brother, sister, son, daughter, husband, or wife) by submitting a request to the nearest railway station counter 24 hours prior to departure.',
    },
    {
      category: 'Account & Security',
      question: 'What should I do if I suspect unauthorized logins on my dashboard?',
      answer: 'If you suspect unauthorized access, reset your password immediately, go to active sessions in settings, and click "Terminate All Other Sessions". You can also verify the login IP logs to report suspicious activity.',
    },
    {
      category: 'Technical Support',
      question: 'I am logged into my account but the support page asks me to log in again. What should I do?',
      answer: 'This can occasionally occur due to stale browser cache or cross-subdomain transitions. Simply ensure you have allowed third-party cookies for the subdomain support.irctcv2.co.in or try logging out and logging back in from the primary portal page to force a synchronized session state.',
    },
    {
      category: 'Technical Support',
      question: 'The website is loading slowly during Tatkal hours. What optimization steps can I take?',
      answer: 'During heavy load hours, ensure you are using a high-speed stable internet connection. Clearing your browser cache, closing background applications, and using clean, extension-free browsers (like Incognito tab) can significantly optimize payment response times.',
    },
    {
      category: 'Technical Support',
      question: 'I did not receive the login OTP email. How can I troubleshoot this?',
      answer: 'Please check your spam or promotions folders first. If the email is missing, click "Resend OTP" on the portal. Make sure that our sender address support@irctcv2.co.in is not blocked or marked as spam in your email provider settings.',
    },
    {
      category: 'Technical Support',
      question: 'Why does the seat selection map not open on my browser?',
      answer: 'The seat map layout is rendered dynamically using React and Tailwind. If it fails to render, verify that JavaScript is enabled in your browser settings and disable any strict ad-blockers that might interfere with page scripts.',
    },
    {
      category: 'Technical Support',
      question: 'How do I report a bug or transactional error on the portal?',
      answer: 'Go to the Support tab, click "Raise a Ticket", select your transaction PNR or category, fill out the issue description with screenshots, and submit. Our technical team is notified instantly and will investigate.',
    },
    {
      category: 'Technical Support',
      question: 'Is there an official mobile application for IRCTC 2.0?',
      answer: 'Yes. Our official mobile applications are available for download on both the Google Play Store and Apple App Store. It is fully synchronized with your web credentials and wallet balance.',
    },
    {
      category: 'Technical Support',
      question: 'What browser versions are officially supported by the portal?',
      answer: 'We officially support the latest stable releases of Google Chrome, Mozilla Firefox, Microsoft Edge, and Apple Safari. Avoid using outdated browsers to prevent layout issues and security alerts.',
    },
    {
      category: 'Technical Support',
      question: 'I am unable to download the E-Ticket PDF. How do I resolve this?',
      answer: 'Ensure that pop-ups are allowed in your browser settings, as the PDF download initiates a secure print stream. If the issue persists, go to Booking History on your dashboard and download the ticket directly from there.',
    },
    {
      category: 'Technical Support',
      question: 'How does the live chat assistant help with my queries?',
      answer: 'Our live chat AI assistant, available in the bottom-right corner of the screen, handles queries related to refund status tracing, active train delays, live PNR checking, and account credential recoveries.',
    },
    {
      category: 'Technical Support',
      question: 'Why does my session expire during a booking transaction?',
      answer: 'For payment security and to prevent bot bookings during peak Tatkal hours, a secure booking session is active for a maximum of 15 minutes. If transaction is not completed in this window, session expires automatically.',
    },
    {
      category: 'Technical Support',
      question: 'What does the "Database Synchronization Error" mean?',
      answer: 'This is a rare technical error where the booking ledger was temporarily unable to verify the transaction against core railway logs. The system is self-healing, and any affected transactions are fully refunded within 24 hours.',
    },
    {
      category: 'Technical Support',
      question: 'The e-catering menu is not loading for my train. What should I check?',
      answer: 'E-Catering is only available for active journeys where intermediate stations have catering facilities. If it fails to load, ensure your PNR is confirmed and check if catering services are scheduled at your boarding hours.',
    },
    {
      category: 'Technical Support',
      question: 'How do I clear cookies and site data specifically for this portal?',
      answer: 'In Chrome, click the lock icon next to the URL, select "Site settings", and click "Clear data". This resolves session sync or cache related errors without logging you out of unrelated sites.',
    },
    {
      category: 'Technical Support',
      question: 'Who should I contact for emergency support at railway stations?',
      answer: 'For emergency security and medical support during your journey, call the centralized Indian Railways customer helpline number 139 immediately or contact the on-duty coach attendant.',
    },
  ];

  // Filter FAQs based on search query and selected category
  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
      const matchesSearch = 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const toggleAccordion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto w-full">
          {/* Back button */}
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6 group text-xs font-semibold bg-white/5 px-3.5 py-1.5 rounded-xl border border-white/5"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </Link>

          {/* Header */}
          <div className="mb-10 text-center sm:text-left">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-white/50 max-w-2xl">
              Quickly find answers to common queries regarding bookings, PNR status tracking, dynamic refunds, and security features.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-all duration-300"></div>
            <div className="relative flex items-center bg-[#111] border border-white/10 rounded-2xl p-1 overflow-hidden">
              <Search className="w-5 h-5 text-white/40 ml-4 mr-2" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for questions, terms, or keywords (e.g. refund, limit)..."
                className="w-full bg-transparent border-0 text-white placeholder-white/30 text-sm focus:ring-0 focus:outline-none py-3 px-2"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-white/40 hover:text-white mr-4 px-2 py-1 rounded bg-white/5"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center sm:justify-start">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    setExpandedIndex(null);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                    isSelected 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/10' 
                      : 'bg-white/5 border-white/5 text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Accordion List */}
          <div className="space-y-3 mb-12">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, idx) => {
                const isExpanded = expandedIndex === idx;
                return (
                  <div 
                    key={idx}
                    className="bg-[#111] border border-white/15 rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/20"
                  >
                    <button
                      onClick={() => toggleAccordion(idx)}
                      className="w-full flex items-center justify-between p-5 text-left font-medium select-none focus:outline-none"
                    >
                      <div className="flex items-center gap-3 pr-4">
                        <span className="inline-block bg-blue-500/15 border border-blue-500/20 text-blue-400 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md">
                          {faq.category}
                        </span>
                        <h3 className="text-white hover:text-blue-400 transition-colors text-sm sm:text-base font-semibold">
                          {faq.question}
                        </h3>
                      </div>
                      <ChevronDown 
                        className={`w-5 h-5 text-white/40 transition-transform duration-300 flex-shrink-0 ${
                          isExpanded ? 'rotate-180 text-blue-400' : ''
                        }`} 
                      />
                    </button>
                    
                    <div 
                      className={`transition-all duration-300 ease-in-out overflow-hidden ${
                        isExpanded ? 'max-h-[300px] border-t border-white/10' : 'max-h-0'
                      }`}
                    >
                      <div className="p-5 bg-black/30 text-white/70 text-sm leading-relaxed">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-[#111] border border-white/10 rounded-2xl">
                <HelpCircle className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60 font-semibold text-lg">No matching questions found</p>
                <p className="text-white/40 text-sm mt-1">Try refining your search keyword or selecting a different category.</p>
              </div>
            )}
          </div>

          {/* Sticky CTA */}
          <div className="bg-gradient-to-r from-blue-900/20 via-cyan-900/10 to-blue-900/20 border border-blue-500/20 rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-400"></div>
            <MessageSquare className="w-10 h-10 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Still need help?</h2>
            <p className="text-white/60 text-sm sm:text-base max-w-xl mx-auto mb-6">
              {isLoggedIn 
                ? "If your question is not resolved here, please click below to raise a support ticket and chat with our helpdesk team."
                : "If your question is not resolved here, please log in to raise a support ticket and chat with our helpdesk team."
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
              <Link 
                href={isLoggedIn ? "/support" : "/login?redirect=/support"}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/10 flex items-center justify-center gap-2"
              >
                {isLoggedIn ? "Go to Support Portal" : "Log In & Support Portal"}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
