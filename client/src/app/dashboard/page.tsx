'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter, useSearchParams } from 'next/navigation';
import { Ticket, LogOut, Download, User as UserIcon, Trash2, Edit3, Shield, Loader2, X, AlertTriangle, Phone, Wallet, Home, Plus, MapPin, CheckCircle2, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'profile' ? 'profile' : 'history';
  const [activeTab, setActiveTab] = useState<'history' | 'profile'>(initialTab);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteErrorModal, setDeleteErrorModal] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneStep, setPhoneStep] = useState<'phone' | 'otp'>('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [trackingBooking, setTrackingBooking] = useState<any>(null);
  
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupStep, setTopupStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentDetails, setPaymentDetails] = useState({ cardNumber: '', nameOnCard: '', expiry: '', cvv: '', upiId: '' });
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', age: '', gender: '', travelHabits: '', dob: '', address: '', state: '', pincode: '' });
  const [kycForm, setKycForm] = useState({ documentType: 'Aadhaar', documentNumber: '', documentImage: '' });
  const [paymentStatus, setPaymentStatus] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Get user Profile
    axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      const userData = res.data;
      setUser(userData);
      setEditForm({
        name: userData.name || '',
        phone: userData.phone || '',
        age: userData.preferences?.age || '',
        gender: userData.preferences?.gender || 'Male',
        travelHabits: userData.preferences?.travelHabits || '',
        dob: userData.dob || '',
        address: userData.address || '',
        state: userData.state || '',
        pincode: userData.pincode || ''
      });
      if (!userData.kycStatus && !userData.kycSubmittedAt) {
        setShowKYCModal(true);
      }
    }).catch(() => router.push('/login'));

    // Get Booking History
    axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/bookings/history`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setHistory(res.data)).catch(console.error);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/');
  };

  const handleTopup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topupAmount || isNaN(Number(topupAmount)) || Number(topupAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (topupStep === 1) {
      setTopupStep(2);
    } else if (topupStep === 2) {
      executeTopup();
    }
  };

  const executeTopup = async () => {
    setIsToppingUp(true);
    setPaymentStatus('Connecting to Payment Gateway...');
    
    // Simulate payment gateway steps
    setTimeout(() => setPaymentStatus('Processing Payment...'), 800);
    setTimeout(() => setPaymentStatus('Payment Successful! Adding funds...'), 2000);
    
    setTimeout(async () => {
      try {
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/wallet/add`, 
          { amount: Number(topupAmount) }, 
          { headers: { Authorization: `Bearer ${Cookies.get('token')}` } }
        );
        toast.success('Funds added successfully!');
        setUser({ ...user, walletBalance: res.data.walletBalance, walletTransactions: res.data.transactions });
        setShowTopupModal(false);
        setTopupAmount('');
        setPaymentStatus('');
        setTopupStep(1);
      } catch (err) {
        toast.error('Failed to add funds');
        setPaymentStatus('');
      } finally {
        setIsToppingUp(false);
      }
    }, 2800);
  };

  const downloadTicket = async (booking: any) => {
    // Utility to fetch image and convert to base64 for jsPDF
    const getBase64ImageFromUrl = async (imageUrl: string) => {
      try {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        return null;
      }
    };

    const isFlight = booking.serviceType?.toLowerCase() === 'flight' || booking.serviceType?.toLowerCase() === 'flights';
    const isBus = booking.serviceType?.toLowerCase() === 'bus';

    const g20Base64 = await getBase64ImageFromUrl('/g20-logo.jpg');
    let logoPath = '/ir-logo.png';
    if (isFlight) logoPath = '/flight_logo.png';
    if (isBus) logoPath = '/bus_logo.png';
    const serviceLogoBase64 = await getBase64ImageFromUrl(logoPath);

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text('Electronic Reservation Slip (ERS)', pageWidth / 2, 15, { align: 'center' });

    // Header Logos
    if (serviceLogoBase64) {
      doc.addImage(serviceLogoBase64, 'PNG', 15, 8, 14, 14);
    } else {
      doc.setFontSize(16);
      doc.setTextColor(0, 51, 153);
      doc.text(isFlight ? "AVIATION" : isBus ? "BUS" : "IRCTC", 15, 20);
    }

    if (g20Base64) {
      doc.addImage(g20Base64, 'JPEG', pageWidth - 42, 6, 28, 18);
    } else {
      doc.setTextColor(255, 153, 51);
      doc.setFontSize(16);
      doc.text("G20", pageWidth - 35, 20);
    }

    doc.setTextColor(0, 0, 0);

    // Booked From -> Boarding At -> To (Arrow mockup)
    doc.setFillColor(153, 204, 255);
    doc.rect(70, 32, 70, 6, 'F');
    doc.triangle(140, 30, 140, 40, 145, 35, 'F');

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Booked From", 35, 30, { align: 'center' });
    doc.text("Boarding At", 105, 36, { align: 'center' });
    doc.text("To", 175, 30, { align: 'center' });

    // Stations
    doc.setFont("helvetica", "normal");
    const source = booking.from || booking.trainId?.source || 'HOWRAH JN (HWH)';
    const dest = booking.to || booking.trainId?.destination || 'NEW DELHI (NDLS)';
    doc.text(source.toUpperCase(), 35, 42, { align: 'center' });
    doc.text(source.toUpperCase(), 105, 42, { align: 'center' });
    doc.text(dest.toUpperCase(), 175, 42, { align: 'center' });

    // Date / Time
    const dateStr = booking.journeyDate || new Date(booking.createdAt).toISOString().split('T')[0];
    const timeStr = booking.departureTime || booking.trainId?.departureTime || '18:30';
    const arrTimeStr = booking.trainId?.arrivalTime || '08:45';

    doc.text(`Start Date: ${dateStr}`, 35, 48, { align: 'center' });
    doc.setFont("helvetica", "bold");
    doc.text(`Departure: ${timeStr} | ${dateStr}`, 105, 48, { align: 'center' });
    doc.setFont("helvetica", "normal");
    doc.text(`Arrival: ${arrTimeStr} | ${dateStr}`, 175, 48, { align: 'center' });

    // Main Details Grid
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(10, 52, 200, 52);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("PNR", 35, 57, { align: 'center' });
    doc.text("Train No./Name", 105, 57, { align: 'center' });
    doc.text("Class", 175, 57, { align: 'center' });

    doc.setTextColor(0, 51, 153);
    const pnrStr = booking.pnr || booking._id?.toString().substring(0, 10).toUpperCase() || 'N/A';
    doc.text(pnrStr, 35, 62, { align: 'center' });

    const rawTrainName = booking.trainId?.name?.toUpperCase() || booking.serviceType?.toUpperCase() || 'TRAIN';
    const trainName = rawTrainName === 'TRAIN' ? (booking.from ? `${booking.from.split(' ')[0]} EXPRESS` : 'KAMRUP EXPRESS') : rawTrainName;
    const trainNum = booking.trainId?.trainNumber || (!booking.from ? '15959' : booking.mockTrainId?.substring(booking.mockTrainId.length - 5) || '12345');
    
    const trainDesc = `${trainNum} / ${trainName}`.toUpperCase();
    doc.text(trainDesc.length > 45 ? trainDesc.substring(0, 43) + '...' : trainDesc, 105, 62, { align: 'center' });

    doc.text(booking.serviceClass || booking.trainClass || 'SL', 175, 62, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    doc.setFont("helvetica", "bold");
    doc.text("Quota", 35, 68, { align: 'center' });
    doc.text("Distance", 105, 68, { align: 'center' });
    doc.text("Booking Date", 175, 68, { align: 'center' });

    doc.setFont("helvetica", "normal");
    const quotaStr = booking.quota || 'GENERAL (GN)';
    const distanceStr = booking.trainId?.distance ? `${booking.trainId.distance} KM` : (booking.distance ? `${booking.distance} KM` : `${Math.floor(1200 + Math.random() * 800)} KM`);
    doc.text(quotaStr, 35, 73, { align: 'center' });
    doc.text(distanceStr, 105, 73, { align: 'center' });
    doc.text(new Date(booking.createdAt).toLocaleString(), 175, 73, { align: 'center' });

    doc.line(10, 75, 200, 75);

    // Passenger Details Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Passenger Details", 12, 80);

    // Passenger autoTable
    const passCols = ["#", "Name", "Age", "Gender", "Booking Status", "Current Status"];
    const passRows = booking.passengers.map((p: any, idx: number) => {
      let seat = booking.seatNumbers && booking.seatNumbers[idx] ? booking.seatNumbers[idx] : '';
      if (!seat) {
         if (isFlight) seat = `${idx + 1}A (WINDOW)`;
         else if (isBus) seat = `${idx + 1}W (WINDOW)`;
         else seat = `S6/${60 + idx}/MIDDLE`;
      } else {
         if (isFlight || isBus) {
             const parts = seat.split('/');
             seat = parts[parts.length - 1]; // Removes 'S4/70/' part
         }
      }
      const bStatus = `CNF / ${seat}`;
      const cStatus = booking.status === 'Confirmed' ? bStatus : (booking.status === 'Verification Pending' ? 'Pending' : booking.status);
      return [(idx + 1).toString(), p.name.toUpperCase(), p.age.toString(), p.gender.charAt(0).toUpperCase(), bStatus, cStatus];
    });

    autoTable(doc, {
      startY: 82,
      head: [passCols],
      body: passRows,
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 1, textColor: [0, 0, 0] },
      headStyles: { fontStyle: 'bold' }
    });

    const py = (doc as any).lastAutoTable?.finalY || 100;
    doc.line(10, py + 2, 200, py + 2);

    // Acronyms & Contact Details
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text("Acronyms:             RLWL: REMOTE LOCATION WAITLIST                 PQWL: POOLED QUOTA WAITLIST                 RSWL: ROAD-SIDE WAITLIST", 12, py + 6);
    
    let offsetY = py + 10;
    
    if (user && user.accountType === 'Employee') {
      doc.setTextColor(0, 51, 153);
      doc.text(`Employee Details:    ID: ${user.employeeId || 'N/A'}                 Status: Verified (Staff Discount Applied)`, 12, offsetY);
      doc.setTextColor(0);
      offsetY += 4;
    }
    
    doc.text(`Contact Details:     Email: ${user.email}                 Mobile: ${user.phone || 'N/A'}`, 12, offsetY);

    // Transaction ID
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Transaction ID: ${booking.bookingRef || booking._id}`, 12, offsetY + 6);
    doc.setFont("helvetica", "normal");
    doc.text("IR recovers only 57% of cost of travel on an average.", 12, offsetY + 10);

    // Payment Details
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Payment Details", 12, offsetY + 16);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    const baseFare = booking.totalPrice / 1.18;
    const tax = booking.totalPrice - baseFare;
    doc.text("Ticket Fare", 12, py + 32); doc.text(`Rs. ${baseFare.toFixed(2)}`, 100, py + 32);
    doc.text("IRCTC Convenience Fee (Incl. of GST)", 12, py + 37); doc.text(`Rs. ${tax.toFixed(2)}`, 100, py + 37);
    doc.text("Travel Insurance Premium (Incl. of GST)", 12, py + 42); doc.text("Rs. 1.40", 100, py + 42);
    doc.setFont("helvetica", "bold");
    doc.text("Total Fare (all inclusive)", 12, py + 47); doc.text(`Rs. ${(booking.totalPrice + 1.40).toFixed(2)}`, 100, py + 47);

    // QR Code simulation block
    doc.setFillColor(0, 0, 0);
    const qrSize = 35;
    const px = 150;
    const pY = py + 14;

    // Position markers (3 corners)
    doc.rect(px, pY, 7, 7, 'F'); doc.setFillColor(255, 255, 255); doc.rect(px + 1, pY + 1, 5, 5, 'F'); doc.setFillColor(0, 0, 0); doc.rect(px + 2, pY + 2, 3, 3, 'F');
    doc.rect(px + qrSize - 7, pY, 7, 7, 'F'); doc.setFillColor(255, 255, 255); doc.rect(px + qrSize - 6, pY + 1, 5, 5, 'F'); doc.setFillColor(0, 0, 0); doc.rect(px + qrSize - 5, pY + 2, 3, 3, 'F');
    doc.rect(px, pY + qrSize - 7, 7, 7, 'F'); doc.setFillColor(255, 255, 255); doc.rect(px + 1, pY + qrSize - 6, 5, 5, 'F'); doc.setFillColor(0, 0, 0); doc.rect(px + 2, pY + qrSize - 5, 3, 3, 'F');

    // Fill random squares
    for (let x = 0; x < qrSize; x += 1.5) {
      for (let y = 0; y < qrSize; y += 1.5) {
        if ((x < 8 && y < 8) || (x > qrSize - 8 && y < 8) || (x < 8 && y > qrSize - 8)) continue;
        if (Math.random() > 0.5) doc.rect(px + x, pY + y, 1.5, 1.5, 'F');
      }
    }

    doc.line(10, py + 54, 200, py + 54);

    // Instructions
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("IRCTC Convenience Fee is charged per e-ticket irrespective of number of passengers on the ticket.", 12, py + 59);
    doc.text("* The printed Departure and Arrival Times are liable to change. Please Check correct departure, arrival from Railway Station Enquiry.", 12, py + 63);
    doc.line(10, py + 66, 200, py + 66);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("• This ticket is booked on a personal User ID, its sale/purchase is an offence u/s 143 of the Railways Act, 1989.", 15, py + 71);
    doc.text("• Prescribed original ID proof is required while travelling along with SMS/ VRM/ ERS otherwise will be treated as without ticket.", 15, py + 75);

    // Banner Mockup
    doc.setFillColor(255, 230, 153);
    doc.rect(10, py + 79, 190, 15, 'F');
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 150);
    doc.text("AYUSHMAN BHARAT HEALTH ACCOUNT (ABHA)", pageWidth / 2, py + 88, { align: 'center' });

    // Customer Support & Rules
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Customer Support / Helpline:", 12, py + 102);
    doc.setFont("helvetica", "normal");
    doc.text("For any queries, please contact IRCTC Customer Care: 14646 / 0755-6610661 OR Email: care@irctc.co.in", 12, py + 107);
    
    doc.setFont("helvetica", "bold");
    doc.text("Important Rules & Instructions:", 12, py + 114);
    doc.setFont("helvetica", "normal");
    doc.text("1. Valid original ID proof is mandatory during journey (Aadhaar, Voter ID, Passport, PAN Card, Driving License).", 15, py + 119);
    doc.text("2. Fully Waitlisted (WL) e-tickets are invalid for travel. Passengers found traveling will be treated as ticketless.", 15, py + 124);
    doc.text("3. E-Ticket cancellation is permitted only through the portal before chart preparation.", 15, py + 129);

    // Footer Generation Stamp
    doc.line(10, py + 135, 200, py + 135);
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(`TICKET GENERATED BY: IRCTC 2.0 PORTAL  |  ISSUED ON: ${new Date().toLocaleString()}  |  IP: SECURED`, 12, py + 140);

    doc.save(`IRCTC_ERS_${booking.pnr || booking._id}.pdf`);

  };

  if (!user) return <div className="min-h-screen flex items-center justify-center text-white bg-[var(--background)]">Loading profile...</div>;

  return (
    <main className="min-h-screen bg-[#050505] text-white pt-48 pb-20 selection:bg-blue-500/30">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-12 gap-10 mt-8">

        {/* Sidebar */}
        <div className="md:col-span-3">
          <div className="bg-[#111318] rounded-3xl p-8 border border-white/5 sticky top-40 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-4xl font-black text-white mb-6 shadow-[0_0_30px_rgba(59,130,246,0.3)] border-4 border-[#050505] mx-auto">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white tracking-wide">{user.name}</h2>
              <p className="text-gray-400 text-sm mt-1">{user.email}</p>
            </div>

            <div className="space-y-2">
              <button onClick={() => setActiveTab('history')} className={`w-full text-left px-5 py-3.5 rounded-xl font-bold transition-all shadow-md flex items-center gap-3 ${activeTab === 'history' ? 'bg-[#1e2330] text-blue-400 border border-blue-500/20' : 'hover:bg-white/5 text-gray-300 border border-transparent'}`}>
                <Ticket className="w-5 h-5" /> Booking History
              </button>
              <button onClick={() => setActiveTab('profile')} className={`w-full text-left px-5 py-3.5 rounded-xl transition-all font-bold flex items-center gap-3 ${activeTab === 'profile' ? 'bg-[#1e2330] text-blue-400 border border-blue-500/20' : 'hover:bg-white/5 text-gray-300 border border-transparent'}`}>
                <UserIcon className="w-5 h-5" /> My Profile
              </button>
              <button onClick={() => router.push('/pnr-status')} className="w-full text-left px-5 py-3.5 rounded-xl transition-all font-bold flex items-center gap-3 hover:bg-white/5 text-gray-300 border border-transparent">
                <Ticket className="w-5 h-5" /> PNR Status
              </button>
              <div className="h-px w-full bg-white/5 my-6"></div>

              <button onClick={() => setShowEditModal(true)} className="w-full flex items-center px-5 py-3.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all font-bold">
                <Edit3 className="w-5 h-5 mr-3" /> Edit Profile
              </button>
              <button onClick={() => setShowDeleteModal(true)} className="w-full flex items-center px-5 py-3.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all font-bold">
                <Trash2 className="w-5 h-5 mr-3" /> Delete Account
              </button>
              
              <button onClick={handleLogout} className="w-full flex items-center px-5 py-3.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-bold group mt-2">
                <LogOut className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" /> Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-9">
          {activeTab === 'history' ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black text-white tracking-tight">Booking History</h2>
              </div>

              <div className="space-y-5">
                {history.length > 0 ? (
                  history.map(booking => {
                    const isConfirmed = booking.status === 'Confirmed';
                    const pnr = booking.pnr || Math.floor(1000000000 + Math.random() * 9000000000).toString();
                    return (
                      <div key={booking._id} className="bg-[#111318] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between hover:border-white/10 transition-colors shadow-lg">
                        <div>
                          <div className="flex items-center space-x-3 mb-3">
                            <Ticket className="w-5 h-5 text-blue-500" />
                            <h3 className="text-lg font-black text-white tracking-wide">PNR: {pnr}</h3>
                            <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md font-bold ${isConfirmed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                              {booking.status}
                            </span>
                          </div>
                          <p className="text-gray-300 mb-1 font-medium">
                            {(() => {
                              if (booking.trainId?.name) return booking.trainId.name.toUpperCase();
                              if (!booking.from) return 'KAMRUP EXPRESS';
                              const rawName = booking.serviceType?.toUpperCase() || 'TRAIN';
                              return rawName === 'TRAIN' ? `${booking.from.split(' ')[0]} EXPRESS` : rawName;
                            })()}
                            <span className="text-gray-500 ml-2">({booking.trainId?.trainNumber || (!booking.from ? '15959' : booking.mockTrainId?.substring(booking.mockTrainId.length - 5) || '12345')})</span>
                          </p>
                          <p className="text-sm text-gray-400 flex items-center gap-2">
                            <span>{booking.from || booking.trainId?.source || 'HOWRAH JN (HWH)'}</span>
                            <span className="text-gray-600">→</span>
                            <span>{booking.to || booking.trainId?.destination || 'NEW DELHI (NDLS)'}</span>
                            <span className="text-gray-600">|</span>
                            <span>Class: <span className="text-white font-medium">{booking.serviceClass || booking.trainClass || 'SL'}</span></span>
                          </p>
                        </div>
                        <div className="mt-6 md:mt-0 md:text-right flex flex-col items-start md:items-end w-full md:w-auto border-t md:border-t-0 border-white/10 pt-4 md:pt-0">
                          <p className="text-sm text-gray-400 mb-1">Passengers: <span className="text-white font-medium">{booking.passengers.length}</span></p>
                          <p className="text-sm text-gray-400 mb-2">Seats: <span className="text-white font-medium">{booking.seatNumbers?.length ? booking.seatNumbers.join(', ') : 'Pending'}</span></p>
                          <p className="text-2xl font-black text-white font-mono tracking-tighter mb-4">₹{booking.totalPrice}</p>
                          {isConfirmed && booking.serviceType !== 'E Catering' && (
                            <button
                              onClick={() => downloadTicket(booking)}
                              className="flex items-center justify-center w-full md:w-auto text-sm bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-[0_5px_15px_rgba(37,99,235,0.3)] hover:shadow-[0_5px_20px_rgba(37,99,235,0.5)] hover:-translate-y-0.5"
                            >
                              <Download className="w-4 h-4 mr-2" /> Download Ticket
                            </button>
                          )}
                          {isConfirmed && booking.serviceType === 'E Catering' && (
                            <button
                              onClick={() => setTrackingBooking(booking)}
                              className="flex items-center justify-center w-full md:w-auto text-sm bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-[0_5px_15px_rgba(234,88,12,0.3)] hover:shadow-[0_5px_20px_rgba(234,88,12,0.5)] hover:-translate-y-0.5"
                            >
                              <MapPin className="w-4 h-4 mr-2" /> Track Order
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-[#111318] border border-white/5 rounded-2xl p-16 text-center text-gray-400 shadow-xl flex flex-col items-center">
                    <Ticket className="w-16 h-16 text-gray-600 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Bookings Found</h3>
                    <p>Time to plan your next journey!</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-[#111318] rounded-3xl p-8 border border-white/5 shadow-2xl relative">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black text-white tracking-tight">Personal Information</h2>
                <button onClick={() => router.push('/')} className="flex items-center px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded-xl transition-all font-bold group border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <Home className="w-4 h-4 mr-2 group-hover:-translate-y-0.5 transition-transform" /> Back to Home
                </button>
              </div>

              {/* IRCTC Wallet Section */}
              <div className="bg-gradient-to-r from-emerald-900/20 to-blue-900/20 border border-emerald-500/20 rounded-2xl p-6 mb-8 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-500/20 p-3 rounded-xl border border-emerald-500/30">
                    <Wallet className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">IRCTC Wallet Balance</h3>
                    <p className="text-3xl font-black text-white mt-1">₹{(user?.walletBalance || 0).toLocaleString()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowTopupModal(true)}
                  className="hidden sm:block bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:-translate-y-0.5"
                >
                  Add Funds
                </button>
              </div>

              {/* Wallet Transactions Sync List */}
              {user?.walletTransactions && user.walletTransactions.length > 0 && (
                <div className="bg-black/30 border border-white/5 rounded-2xl p-6 mb-8 shadow-xl">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Database Synced: Recent Transactions</h3>
                  <div className="space-y-3">
                    {user.walletTransactions.slice().reverse().slice(0, 5).map((txn: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5 hover:bg-black/60 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${txn.type === 'Credit' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {txn.type === 'Credit' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{txn.description || (txn.type === 'Credit' ? 'Wallet Topup' : 'Booking Payment')}</p>
                            <p className="text-gray-500 text-xs mt-0.5">Database ID Sync: {txn._id || `txn_${Math.random().toString(36).substr(2, 6)}`} • {new Date(txn.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className={`font-mono font-black text-lg tracking-wider ${txn.type === 'Credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {txn.type === 'Credit' ? '+' : '-'}₹{txn.amount.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Column 1 */}
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 block">Full Name</label>
                    <div className="bg-black/50 border border-white/10 rounded-xl p-4 text-white font-medium text-lg">
                      {user.name}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 block">Email Address</label>
                    <div className="bg-black/50 border border-white/10 rounded-xl p-4 text-white font-medium text-base break-all">
                      {user.email}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 block flex items-center gap-2">Mobile Number <Edit3 className="w-3 h-3 cursor-pointer text-gray-400 hover:text-white" onClick={() => { setPhoneStep('phone'); setPhoneInput(user.phone || ''); setShowPhoneModal(true); }} /></label>
                    <div className="bg-black/50 border border-white/10 rounded-xl p-4 text-gray-400 font-medium text-lg flex justify-between items-center">
                      <span>{user.phone || '+91 - Not Linked'}</span>
                      {!user.phone && <span onClick={() => { setPhoneStep('phone'); setPhoneInput(''); setShowPhoneModal(true); }} className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-bold cursor-pointer hover:bg-blue-500/30">Link Now</span>}
                    </div>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 block">Aadhaar / KYC</label>
                    <div className="bg-black/50 border border-white/10 rounded-xl p-4 text-gray-400 font-medium text-lg flex justify-between items-center">
                      <span className={user?.kycStatus ? 'text-emerald-400' : user?.kycSubmittedAt ? 'text-amber-400' : 'text-gray-400'}>
                        {user?.kycStatus ? 'Verified' : user?.kycSubmittedAt ? 'Under Review' : 'Unverified'}
                      </span>
                      {!user?.kycStatus && !user?.kycSubmittedAt && <span onClick={() => setShowKYCModal(true)} className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full font-bold cursor-pointer hover:bg-amber-500/30">Verify KYC</span>}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 block flex items-center gap-2">Date of Birth <Edit3 className="w-3 h-3 cursor-pointer text-gray-400 hover:text-white" onClick={() => setShowEditModal(true)} /></label>
                    <div className="bg-black/50 border border-white/10 rounded-xl p-4 text-gray-400 font-medium text-lg">
                      {user.dob || 'DD/MM/YYYY'}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 block flex items-center gap-2">Gender <Edit3 className="w-3 h-3 cursor-pointer text-gray-400 hover:text-white" onClick={() => setShowEditModal(true)} /></label>
                    <div className="bg-black/50 border border-white/10 rounded-xl p-4 text-gray-400 font-medium text-lg">
                      {user?.preferences?.gender || 'Not Specified'}
                    </div>
                  </div>
                </div>

                {/* Column 3 */}
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 block flex items-center gap-2">Address <Edit3 className="w-3 h-3 cursor-pointer text-gray-400 hover:text-white" onClick={() => setShowEditModal(true)} /></label>
                    <div className="bg-black/50 border border-white/10 rounded-xl p-4 text-gray-400 font-medium text-lg">
                      {user.address || 'No Address Added'}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 block flex items-center gap-2">State & Pincode <Edit3 className="w-3 h-3 cursor-pointer text-gray-400 hover:text-white" onClick={() => setShowEditModal(true)} /></label>
                    <div className="bg-black/50 border border-white/10 rounded-xl p-4 text-gray-400 font-medium text-lg">
                      {user.state || 'State'} - {user.pincode || '000000'}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 block">Account Role</label>
                    <div className="bg-black/50 border border-white/10 rounded-xl p-4 text-emerald-400 font-bold text-lg flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span> {user.role || 'User'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111] border border-white/10 rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-400" /> Edit Profile
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Email (Cannot be changed)</label>
                  <input 
                    type="email" 
                    value={user?.email} 
                    disabled
                    className="w-full bg-black/50 border border-white/5 rounded-xl py-2 px-3 text-gray-500 cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Date of Birth</label>
                  <input 
                    type="date" 
                    value={editForm.dob}
                    onChange={(e) => setEditForm({...editForm, dob: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-blue-500/50 color-scheme-dark"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Gender</label>
                  <select 
                    value={editForm.gender}
                    onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="Male" className="bg-[#111]">Male</option>
                    <option value="Female" className="bg-[#111]">Female</option>
                    <option value="Other" className="bg-[#111]">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Address</label>
                <input 
                  type="text" 
                  value={editForm.address}
                  onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-blue-500/50"
                  placeholder="Enter full address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">State</label>
                  <select 
                    value={editForm.state}
                    onChange={(e) => setEditForm({...editForm, state: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="" className="bg-[#111]">Select State</option>
                    <option value="Andhra Pradesh" className="bg-[#111]">Andhra Pradesh</option>
                    <option value="Assam" className="bg-[#111]">Assam</option>
                    <option value="Bihar" className="bg-[#111]">Bihar</option>
                    <option value="Delhi" className="bg-[#111]">Delhi</option>
                    <option value="Gujarat" className="bg-[#111]">Gujarat</option>
                    <option value="Haryana" className="bg-[#111]">Haryana</option>
                    <option value="Karnataka" className="bg-[#111]">Karnataka</option>
                    <option value="Kerala" className="bg-[#111]">Kerala</option>
                    <option value="Maharashtra" className="bg-[#111]">Maharashtra</option>
                    <option value="Punjab" className="bg-[#111]">Punjab</option>
                    <option value="Rajasthan" className="bg-[#111]">Rajasthan</option>
                    <option value="Tamil Nadu" className="bg-[#111]">Tamil Nadu</option>
                    <option value="Uttar Pradesh" className="bg-[#111]">Uttar Pradesh</option>
                    <option value="West Bengal" className="bg-[#111]">West Bengal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Pincode</label>
                  <input 
                    type="text" 
                    maxLength={6}
                    value={editForm.pincode}
                    onChange={(e) => setEditForm({...editForm, pincode: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-blue-500/50"
                    placeholder="6-digit Pincode"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Travel Habits</label>
                <input 
                  type="text" 
                  value={editForm.travelHabits}
                  placeholder="e.g. Frequent Flyer, Budget Traveler"
                  onChange={(e) => setEditForm({...editForm, travelHabits: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <button 
                onClick={async () => {
                  setIsProcessing(true);
                  try {
                    await axios.put(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/profile`, 
                      { ...editForm, age: Number(editForm.age) }, 
                      { headers: { Authorization: `Bearer ${Cookies.get('token')}` } }
                    );
                    import('react-hot-toast').then(mod => mod.default.success('Profile updated successfully!'));
                    window.location.reload();
                  } catch (err) {
                    import('react-hot-toast').then(mod => mod.default.error('Failed to update profile'));
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                disabled={isProcessing}
                className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all flex justify-center items-center gap-2"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phone OTP Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-400" /> Link Phone
              </h3>
              <button onClick={() => setShowPhoneModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {phoneStep === 'phone' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Mobile Number</label>
                  <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <span className="px-3 py-3 bg-black/50 text-gray-400 border-r border-white/10 font-bold">+91</span>
                    <input 
                      type="text" 
                      maxLength={10}
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full py-2 px-3 text-white focus:outline-none bg-transparent"
                      placeholder="10-digit number"
                    />
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (phoneInput.length === 10) {
                      const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
                      setGeneratedOtp(newOtp);
                      setPhoneStep('otp');
                      import('react-hot-toast').then(mod => mod.default.success(`OTP sent! (Debug OTP: ${newOtp})`));
                    } else {
                      import('react-hot-toast').then(mod => mod.default.error('Enter valid 10-digit number'));
                    }
                  }}
                  className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all"
                >
                  Send OTP
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-400 text-center mb-4">Enter the 4-digit OTP sent to +91 {phoneInput}</p>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1 text-center">Enter OTP</label>
                  <input 
                    type="text" 
                    maxLength={4}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-center text-2xl font-mono tracking-[1em] text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <button 
                  onClick={async () => {
                    if (otpInput === generatedOtp) {
                      setIsProcessing(true);
                      try {
                        await axios.put(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/profile`, 
                          { phone: phoneInput }, 
                          { headers: { Authorization: `Bearer ${Cookies.get('token')}` } }
                        );
                        import('react-hot-toast').then(mod => mod.default.success('Phone number linked successfully!'));
                        window.location.reload();
                      } catch (err) {
                        import('react-hot-toast').then(mod => mod.default.error('Failed to link phone'));
                      } finally {
                        setIsProcessing(false);
                      }
                    } else {
                      import('react-hot-toast').then(mod => mod.default.error('Invalid OTP. Please check the debug message.'));
                    }
                  }}
                  disabled={isProcessing}
                  className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all flex justify-center items-center gap-2"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Link'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KYC Mandatory Modal */}
      {showKYCModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-blue-500/30 rounded-2xl max-w-md w-full p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-center mb-2">Mandatory KYC Verification</h3>
            <p className="text-gray-400 text-center mb-6 text-sm">
              As per government regulations, you must complete your KYC to book tickets and use the IRCTC Wallet. This is a one-time process.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Document Type</label>
                <select 
                  value={kycForm.documentType}
                  onChange={(e) => setKycForm({...kycForm, documentType: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="Aadhaar" className="bg-[#111]">Aadhaar Card</option>
                  <option value="PAN" className="bg-[#111]">PAN Card</option>
                  <option value="Passport" className="bg-[#111]">Passport</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Document Number</label>
                <input 
                  type="text" 
                  value={kycForm.documentNumber}
                  onChange={(e) => setKycForm({...kycForm, documentNumber: e.target.value.toUpperCase()})}
                  placeholder="Enter Document Number"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500/50 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Document Image</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setKycForm({...kycForm, documentImage: reader.result as string});
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-blue-500/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30"
                />
              </div>

              <button 
                onClick={async () => {
                  if (!kycForm.documentNumber || kycForm.documentNumber.length < 5) {
                    import('react-hot-toast').then(mod => mod.default.error('Please enter a valid document number'));
                    return;
                  }
                  if (!kycForm.documentImage) {
                    import('react-hot-toast').then(mod => mod.default.error('Please upload an image of the document'));
                    return;
                  }
                  setIsProcessing(true);
                  try {
                    const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/kyc`, 
                      kycForm, 
                      { headers: { Authorization: `Bearer ${Cookies.get('token')}` } }
                    );
                    import('react-hot-toast').then(mod => mod.default.success(res.data.message || 'KYC submitted! Under review for 5 minutes.'));
                    setShowKYCModal(false);
                    // Refresh the user data to reflect pending status
                    window.location.reload();
                  } catch (err) {
                    import('react-hot-toast').then(mod => mod.default.error('Failed to complete KYC'));
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                disabled={isProcessing}
                className="w-full mt-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all flex justify-center items-center gap-2"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete KYC'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Delete Account Permanently?</h3>
            <p className="text-gray-400 mb-6 text-sm">
              Are you sure you want to delete your account? This action is irreversible. All your wallet data and history will be lost.
              <br /><br />
              <span className="text-amber-500 font-semibold bg-amber-500/10 px-3 py-2 rounded-lg block">
                Note: If you have active confirmed bookings, your account cannot be deleted until they are completed or cancelled.
              </span>
            </p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors border border-white/10"
              >
                No, Keep It
              </button>
              <button 
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await axios.delete(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/delete-account`, {
                      headers: { Authorization: `Bearer ${Cookies.get('token')}` }
                    });
                    import('react-hot-toast').then(mod => mod.default.success('Account deleted permanently.'));
                    setShowDeleteModal(false);
                    Cookies.remove('token');
                    Cookies.remove('user');
                    setTimeout(() => {
                      router.push('/');
                    }, 1500);
                  } catch (err: any) {
                    if (err.response && err.response.data && err.response.data.hasBookings) {
                      setShowDeleteModal(false);
                      setDeleteErrorModal(true);
                    } else if (err.response && err.response.data && err.response.data.error) {
                      import('react-hot-toast').then(mod => mod.default.error(err.response.data.error, { duration: 5000 }));
                      setShowDeleteModal(false);
                    } else {
                      import('react-hot-toast').then(mod => mod.default.error('Failed to delete account. Please try again later.'));
                      setShowDeleteModal(false);
                    }
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors flex justify-center items-center gap-2"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Error Modal */}
      {deleteErrorModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#111] border border-white/10 rounded-2xl max-w-sm w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-5 border border-blue-500/30">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Action Blocked</h3>
            <p className="text-gray-400 mb-8 text-sm leading-relaxed">
              As you are having bookings associated with this account, your account cannot be deleted. Please wait until your bookings are completed or cancelled before trying again.
            </p>
            <button 
              onClick={() => setDeleteErrorModal(false)}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Topup Modal */}
      {showTopupModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-3xl max-w-sm w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-white">{topupStep === 1 ? 'Add Funds' : 'Secure Payment'}</h3>
              <button onClick={() => { setShowTopupModal(false); setTopupStep(1); }} className="text-white/50 hover:text-white p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleTopup}>
              {topupStep === 1 && (
                <div className="space-y-2 mb-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Amount (₹)</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    value={topupAmount} 
                    onChange={e => setTopupAmount(e.target.value)} 
                    placeholder="Enter amount" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none text-xl" 
                  />
                </div>
              )}

              {topupStep === 2 && (
                 <div className="mb-6 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5 mb-4">
                       <span className="text-gray-400 text-sm">Amount to Pay:</span>
                       <span className="font-bold text-xl text-emerald-400 font-mono">₹{topupAmount}</span>
                    </div>

                    <div className="flex gap-2 mb-4 border-b border-white/10 pb-4">
                      {['card', 'upi'].map(method => (
                        <button 
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${paymentMethod === method ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'}`}
                        >
                          {method === 'card' ? 'Card' : 'UPI'}
                        </button>
                      ))}
                    </div>

                    {paymentMethod === 'card' && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-1">Card Number</label>
                          <input type="text" required maxLength={19} value={paymentDetails.cardNumber} onChange={e => {
                            let val = e.target.value.replace(/\D/g, '');
                            val = val.replace(/(.{4})/g, '$1 ').trim();
                            setPaymentDetails({...paymentDetails, cardNumber: val});
                          }} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500/50 font-mono" placeholder="0000 0000 0000 0000" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-1">Expiry</label>
                            <input type="text" required maxLength={5} value={paymentDetails.expiry} onChange={e => setPaymentDetails({...paymentDetails, expiry: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500/50 font-mono" placeholder="MM/YY" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-1">CVV</label>
                            <input type="password" required maxLength={4} value={paymentDetails.cvv} onChange={e => setPaymentDetails({...paymentDetails, cvv: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500/50 font-mono" placeholder="CVV" />
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'upi' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-1">UPI ID</label>
                        <input type="text" required value={paymentDetails.upiId} onChange={e => setPaymentDetails({...paymentDetails, upiId: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500/50" placeholder="username@upi" />
                      </div>
                    )}
                 </div>
              )}

              <div className="flex gap-3">
                {topupStep === 2 && (
                   <button 
                     type="button" 
                     onClick={() => setTopupStep(1)} 
                     className="px-4 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/10"
                   >
                     Back
                   </button>
                )}
                <button 
                  type="submit" 
                  disabled={isToppingUp} 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-xl font-bold transition-all flex justify-center items-center gap-2"
                >
                  {isToppingUp ? <Loader2 className="w-5 h-5 animate-spin" /> : (topupStep === 1 ? <Plus className="w-5 h-5" /> : <Shield className="w-5 h-5" />)}
                  {isToppingUp ? (paymentStatus || 'Processing...') : (topupStep === 1 ? 'Proceed to Payment' : `Pay ₹${topupAmount}`)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Tracking Modal for E-Catering */}
      {trackingBooking && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111318] border border-[#272a31] rounded-3xl p-8 max-w-lg w-full relative shadow-2xl overflow-hidden">
            <button onClick={() => setTrackingBooking(null)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-4 mb-8">
               <div className="w-14 h-14 bg-orange-500/20 text-orange-500 rounded-2xl flex items-center justify-center border border-orange-500/30">
                  <Utensils className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">Order Status</h3>
                  <p className="text-orange-400 text-sm mt-1">{trackingBooking.trainId?.name || 'Restaurant'}</p>
               </div>
            </div>

            {trackingBooking.orderedItems && trackingBooking.orderedItems.length > 0 && (
               <div className="mb-6 bg-[#1a1c23] border border-white/5 rounded-xl p-4">
                 <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Items Ordered</h4>
                 <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                   {trackingBooking.orderedItems.map((item: any, idx: number) => (
                     <div key={idx} className="flex justify-between items-center text-sm">
                       <span className="text-gray-300"><span className="text-orange-400 font-bold mr-2">{item.quantity}x</span>{item.name}</span>
                       <span className="text-emerald-400 font-mono">₹{item.price * item.quantity}</span>
                     </div>
                   ))}
                 </div>
               </div>
            )}

            <div className="relative pl-8 space-y-8 before:absolute before:inset-0 before:ml-[1.1rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-orange-500 before:via-orange-500/50 before:to-transparent">
               
               {/* Order Placed */}
               <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-[#111318] bg-orange-500 text-white shrink-0 absolute left-0 md:left-1/2 md:-translate-x-1/2 -ml-4 md:ml-0 shadow shadow-orange-500/50">
                     <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 shadow-lg">
                     <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-white">Order Placed</div>
                        <time className="font-mono text-xs font-medium text-orange-400">{new Date(trackingBooking.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</time>
                     </div>
                     <div className="text-gray-400 text-xs">Your order has been received by the restaurant.</div>
                  </div>
               </div>

               {/* Preparing */}
               <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-[#111318] bg-orange-500 text-white shrink-0 absolute left-0 md:left-1/2 md:-translate-x-1/2 -ml-4 md:ml-0 shadow shadow-orange-500/50">
                     <Utensils className="w-4 h-4" />
                  </div>
                  <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-[#1a1c23] border border-[#272a31] shadow">
                     <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-gray-300">Preparing</div>
                     </div>
                     <div className="text-gray-500 text-xs">The chef is cooking your meal.</div>
                  </div>
               </div>

               {/* Out for Delivery */}
               <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-[#111318] bg-[#272a31] text-gray-400 shrink-0 absolute left-0 md:left-1/2 md:-translate-x-1/2 -ml-4 md:ml-0">
                     <MapPin className="w-4 h-4" />
                  </div>
                  <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-[#131418] border border-white/5">
                     <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-gray-500">Out for Delivery</div>
                     </div>
                     <div className="text-gray-600 text-xs">Delivery partner is on the way to your seat.</div>
                  </div>
               </div>
            </div>

            <div className="mt-10 bg-orange-500/10 rounded-xl p-4 border border-orange-500/20 text-center">
               <p className="text-sm text-gray-300 font-medium">Estimated arrival at your seat in</p>
               <p className="text-2xl font-black text-white mt-1">25 - 30 mins</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
