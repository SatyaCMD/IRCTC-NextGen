'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
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
      category: 'Technical Support',
      question: 'I am logged into my account but the support page asks me to log in again. What should I do?',
      answer: 'This can occasionally occur due to stale browser cache or cross-subdomain transitions. Simply ensure you have allowed third-party cookies for the subdomain support.irctcv2.co.in or try logging out and logging back in from the primary portal page to force a synchronized session state.',
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
              If your question is not resolved here, please log in to raise a support ticket and chat with our helpdesk team.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
              <Link 
                href="/login?redirect=/support"
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/10 flex items-center justify-center gap-2"
              >
                Log In & Support Portal
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
