'use client';

import { useState, useEffect, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import { jsPDF } from 'jspdf';
import { 
  Download, CheckCircle2, CreditCard, Users, MapPin, 
  ChevronRight, ShieldCheck, Plane, Train, 
  Hotel, Utensils, Bus, User, Loader2, ArrowRightLeft
} from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import axios from 'axios';

function BookingFlowInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const urlTrainId = searchParams.get('trainId') || '';
  const urlClass = searchParams.get('class') || '';
  const urlSource = searchParams.get('source') || 'Delhi';
  const urlDestination = searchParams.get('destination') || 'Mumbai';
  const urlDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const urlDepartureTime = searchParams.get('departureTime') || '10:00';
  const urlPrice = searchParams.get('price');

  const type = params.type as string;
  const title = type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  // Determine service category
  const isHotel = type.includes('hotel') || type.includes('room');
  const isFlight = type.includes('flight');
  const isBus = type.includes('bus');
  const isFood = type.includes('catering');

  // Step 1: Passengers, Step 2: Payment, Step 3: Ticket
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const getBackgroundImage = () => {
    if (isFlight) return 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop';
    if (isHotel) return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop';
    if (isBus) return 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop';
    if (isFood) return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop';
    return 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop';
  };

  const terms = {
    step1Title: isHotel ? 'Guests' : 'Passengers',
    personTerm: isHotel ? 'Guest' : 'Passenger',
    classLabel: isHotel ? 'Room Type' : isFood ? 'Meal Preference' : 'Class of Travel',
  };

  const [journeyDetails] = useState({
    from: urlSource,
    to: urlDestination,
    date1: urlDate,
    travelClass: urlClass,
  });

  const [passengers, setPassengers] = useState([
    { name: '', age: '', gender: 'Male', pref: 'No Preference' }
  ]);
  const [contactInfo, setContactInfo] = useState({ email: '', phone: '' });
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '', expiry: '', cvv: '', nameOnCard: ''
  });
  const [bookingResult, setBookingResult] = useState({ bookingId: '', pnr: '', status: '', serviceClass: '' });
  const [showReturnPrompt, setShowReturnPrompt] = useState(true);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [upiId, setUpiId] = useState('');
  const [bank, setBank] = useState('');

  const getIcon = () => {
    if (isFlight) return <Plane className="w-8 h-8" />;
    if (isHotel) return <Hotel className="w-8 h-8" />;
    if (isFood) return <Utensils className="w-8 h-8" />;
    if (isBus) return <Bus className="w-8 h-8" />;
    return <Train className="w-8 h-8" />;
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    const token = Cookies.get('token');
    if (!token) {
      toast.error('You must log in to proceed with booking.');
      router.push('/login?redirect=auth-required');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(prev => prev + 1);
    }, 800);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = Cookies.get('token');
      const bookingRes = await axios.post('http://localhost:5000/api/bookings', {
        trainId: urlTrainId.startsWith('mock_') ? null : urlTrainId,
        mockTrainId: urlTrainId,
        serviceType: isHotel ? 'Hotel' : isFlight ? 'Flight' : isBus ? 'Bus' : isFood ? 'Food' : 'Train',
        serviceClass: journeyDetails.travelClass || 'Standard',
        passengers,
        totalPrice: Math.round(totalPrice + (totalPrice * 0.18)),
        journeyDate: journeyDetails.date1,
        from: journeyDetails.from,
        to: journeyDetails.to,
        departureTime: urlDepartureTime
      }, { headers: { Authorization: `Bearer ${token}` } });

      const createdBooking = bookingRes.data;

      const confirmRes = await axios.put(`http://localhost:5000/api/bookings/${createdBooking._id}/payment`, {
        paymentId: `PAY${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        status: 'success'
      }, { headers: { Authorization: `Bearer ${token}` } });

      setBookingResult({
        bookingId: confirmRes.data.bookingRef || `BKG${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        pnr: confirmRes.data.pnr || `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        status: confirmRes.data.status || 'Confirmed',
        serviceClass: confirmRes.data.serviceClass || journeyDetails.travelClass
      });
      setStep(3);
      toast.success('Payment successful! Booking confirmed.', { duration: 5000 });
    } catch (err) {
      toast.error('Payment processing failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addPassenger = () => {
    if (passengers.length < 6) {
      setPassengers([...passengers, { name: '', age: '', gender: 'Male', pref: 'No Preference' }]);
    }
  };
  const removePassenger = (index: number) => {
    setPassengers(passengers.filter((_, i) => i !== index));
  };
  const updatePassenger = (index: number, field: string, value: string) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const getBasePrice = () => {
    if (urlPrice) return Number(urlPrice);
    let base = 1250;
    if (isFlight) base = 5500;
    if (isHotel) base = 4200;
    if (isBus) base = 850;
    if (isFood) base = 350;
    return base;
  };

  const isChartPrepared = () => {
    if (!journeyDetails.date1 || !urlDepartureTime) return false;
    const now = new Date();
    const journeyDateTime = new Date(`${journeyDetails.date1}T${urlDepartureTime}`);
    const hoursToDeparture = (journeyDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursToDeparture > 0 && hoursToDeparture <= 4;
  };

  const chartPrepared = isChartPrepared();
  const baseTotal = passengers.length * getBasePrice();
  const totalPrice = chartPrepared ? baseTotal * 1.25 : baseTotal;

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Premium Design Setup
    doc.setFillColor(245, 247, 250); // Light gray background
    doc.rect(0, 0, 210, 297, 'F');
    
    // Header Banner
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, 210, 40, 'F');
    
    // Header Text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text(`IRCTC 2.0 | Premium ${title}`, 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Official Electronic Reservation Slip (ERS)", 105, 28, { align: "center" });
    
    if (chartPrepared) {
      doc.setFillColor(220, 38, 38); // Red 600
      doc.rect(80, 33, 50, 6, 'F');
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("CHART PREPARED", 105, 37, { align: "center" });
    }

    // PNR and Main Details Card
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, 50, 180, 45, 3, 3, 'FD');
    
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Booking Reference:", 20, 60);
    doc.setTextColor(37, 99, 235); // Blue 600
    doc.text(bookingResult.bookingId, 65, 60);
    
    doc.setTextColor(15, 23, 42);
    doc.text("PNR Number:", 120, 60);
    doc.setTextColor(16, 185, 129); // Emerald 500
    doc.setFontSize(16);
    doc.text(bookingResult.pnr, 155, 60);

    // Separator line
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 68, 190, 68);

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    doc.text("Date:", 20, 78);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(journeyDetails.date1, 35, 78);
    
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");
    doc.text("Departure:", 80, 78);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(urlDepartureTime, 100, 78);

    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");
    doc.text("Class:", 140, 78);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(journeyDetails.travelClass || 'Standard', 155, 78);

    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");
    doc.text("Route:", 20, 88);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(`${journeyDetails.from}   -->   ${journeyDetails.to}`, 35, 88);

    // Passenger Table
    doc.setFontSize(14);
    doc.text("Passenger Details", 15, 110);
    
    doc.setFillColor(30, 41, 59); // Slate 800
    doc.roundedRect(15, 115, 180, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("#", 20, 121);
    doc.text("Name", 35, 121);
    doc.text("Age", 100, 121);
    doc.text("Sex", 115, 121);
    doc.text("Status / Seat / Pref", 140, 121);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    let yPos = 132;
    passengers.forEach((p, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(248, 250, 252);
      }
      doc.rect(15, yPos - 5, 180, 8, 'F');
      
      doc.text(`${idx + 1}`, 20, yPos);
      doc.setFont("helvetica", "bold");
      doc.text(p.name || `${terms.personTerm} ${idx+1}`, 35, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(p.age || "-", 100, yPos);
      doc.text(p.gender.charAt(0), 115, yPos);
      
      let statusCode = bookingResult.status === 'WL' ? 'WL' : bookingResult.status === 'RAC' ? 'RAC' : 'CNF';
      doc.text(`${statusCode} / ${bookingResult.serviceClass?.charAt(0) || 'S'}${Math.floor(Math.random() * 80) + 1} / ${p.pref}`, 140, yPos);
      
      yPos += 8;
    });

    // Fare Details
    yPos += 15;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Fare Details", 15, yPos);
    
    yPos += 5;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, yPos, 180, chartPrepared ? 35 : 28, 3, 3, 'FD');
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    yPos += 8;
    doc.text("Base Ticket Fare:", 20, yPos); 
    doc.text(`Rs. ${baseTotal.toLocaleString()}`, 185, yPos, { align: 'right' });
    
    if (chartPrepared) {
      yPos += 7;
      doc.setTextColor(220, 38, 38);
      doc.text("Late Booking Fee (Chart Prepared +25%):", 20, yPos); 
      doc.text(`Rs. ${(baseTotal * 0.25).toLocaleString()}`, 185, yPos, { align: 'right' });
      doc.setTextColor(15, 23, 42);
    }
    
    yPos += 7;
    doc.text("Convenience Fee (Incl. of 18% GST):", 20, yPos); 
    doc.text(`Rs. ${Math.round(totalPrice * 0.18).toLocaleString()}`, 185, yPos, { align: 'right' });
    
    yPos += 8;
    doc.setDrawColor(226, 232, 240);
    doc.line(20, yPos - 5, 190, yPos - 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Total Amount Paid:", 20, yPos); 
    doc.setTextColor(16, 185, 129);
    doc.text(`Rs. ${Math.round(totalPrice + (totalPrice * 0.18)).toLocaleString()}`, 185, yPos, { align: 'right' });

    // Footer
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("* Valid ID proof is required during journey.", 105, 275, { align: "center" });
    doc.text("Contact us at care@irctc.co.in or call 14646 for assistance.", 105, 280, { align: "center" });

    // "Barcode" mockup for professional look
    doc.setFillColor(15, 23, 42);
    for(let i=0; i<30; i++) {
       doc.rect(70 + (i*2.2), 260, Math.random() > 0.5 ? 1 : 0.5, 8, 'F');
    }

    doc.save(`IRCTC2.0_${title.replace(/\s+/g, '')}_${bookingResult.pnr}.pdf`);
    toast.success('Official E-Ticket downloaded successfully!');
  };

  const renderPreferences = () => {
    const optStyle = "bg-gray-900 text-white font-medium";
    if (isHotel) return <><option className={optStyle}>No Preference</option><option className={optStyle}>High Floor</option><option className={optStyle}>Near Elevator</option><option className={optStyle}>Quiet Room</option></>;
    if (isFlight) return <><option className={optStyle}>No Preference</option><option className={optStyle}>Window Seat</option><option className={optStyle}>Aisle Seat</option><option className={optStyle}>Extra Legroom</option></>;
    if (isBus) return <><option className={optStyle}>No Preference</option><option className={optStyle}>Window Seat</option><option className={optStyle}>Front Rows</option></>;
    if (isFood) return <><option className={optStyle}>Regular Spice</option><option className={optStyle}>Extra Spicy</option><option className={optStyle}>Less Spicy</option></>;
    return <><option className={optStyle}>No Preference</option><option className={optStyle}>Lower Berth</option><option className={optStyle}>Middle Berth</option><option className={optStyle}>Upper Berth</option><option className={optStyle}>Side Lower</option><option className={optStyle}>Side Upper</option></>;
  };

  return (
    <main className="min-h-screen pt-24 pb-12 relative selection:bg-blue-500/30 font-sans bg-black">
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 scale-105"
          style={{ backgroundImage: `url('${getBackgroundImage()}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80" />
      </div>
      
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 lg:px-8">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="p-4 bg-white/20 backdrop-blur-xl text-white rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)] mb-4 border border-white/30">
            {getIcon()}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3 drop-shadow-xl">
            {title} Booking
          </h1>
          <p className="text-white/90 text-lg font-medium max-w-2xl drop-shadow-md">
            Journey selected: <span className="font-bold text-white">{journeyDetails.from}</span> to <span className="font-bold text-white">{journeyDetails.to}</span>
          </p>
          <div className="mt-2 inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-md">
            <span className="text-sm font-bold text-white">{journeyDetails.travelClass}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
            <span className="text-sm font-bold text-white">{journeyDetails.date1}</span>
          </div>
        </div>

        <div className="flex items-center justify-center mb-10 max-w-2xl mx-auto drop-shadow-xl">
          {[terms.step1Title, 'Payment', 'Ticket'].map((label, index) => {
            const stepNum = index + 1;
            const isActive = step >= stepNum;
            const isCurrent = step === stepNum;
            return (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center relative">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 z-10 ${
                    isActive ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.8)]' : 'bg-black/50 text-white/50 border border-white/20 backdrop-blur-md'
                  } ${isCurrent ? 'ring-4 ring-white/30 scale-110' : ''}`}>
                    {isActive && stepNum < step ? <CheckCircle2 className="w-6 h-6" /> : stepNum}
                  </div>
                  <span className={`absolute -bottom-8 w-24 text-center text-xs font-bold tracking-wider uppercase transition-colors ${isActive ? 'text-white drop-shadow-md' : 'text-white/40'}`}>
                    {label}
                  </span>
                </div>
                {index < 2 && (
                  <div className={`w-12 md:w-24 h-1.5 mx-2 rounded-full transition-colors duration-500 ${step > stepNum ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-black/30 backdrop-blur-md'}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-black/60 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-6 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] mt-12">
          
          {/* STEP 1: PASSENGERS / GUESTS */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400 border border-blue-500/30"><Users className="w-6 h-6" /></div>
                  <h2 className="text-2xl font-bold text-white tracking-wide">{terms.step1Title} Details</h2>
                </div>
                <button type="button" onClick={addPassenger} disabled={passengers.length >= 6} className="text-sm font-bold bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-xl transition-all border border-white/20 backdrop-blur-md flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                  + Add {terms.personTerm} {passengers.length >= 6 ? '(Max 6)' : ''}
                </button>
              </div>

              <div className="space-y-6 mb-12">
                {passengers.map((p, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl">
                    <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-400 to-indigo-600" />
                    <div className="flex justify-between items-center mb-5 ml-3">
                      <h3 className="text-[11px] font-black text-blue-300 uppercase tracking-widest drop-shadow-md">{terms.personTerm} {idx + 1}</h3>
                      {idx > 0 && (
                        <button type="button" onClick={() => removePassenger(idx)} className="text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider">Remove</button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 ml-3">
                      <div className="md:col-span-5 space-y-2">
                        <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Full Name</label>
                        <input type="text" required value={p.name} onChange={e => updatePassenger(idx, 'name', e.target.value)} placeholder="As per Govt. ID" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:ring-2 focus:ring-blue-500/50" />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Age</label>
                        <input type="number" required min="1" max="120" value={p.age} onChange={e => updatePassenger(idx, 'age', e.target.value)} placeholder="Years" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:ring-2 focus:ring-blue-500/50" />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Gender</label>
                        <select value={p.gender} onChange={e => updatePassenger(idx, 'gender', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:ring-2 focus:ring-blue-500/50 appearance-none">
                          <option className="bg-gray-900 text-white">Male</option><option className="bg-gray-900 text-white">Female</option><option className="bg-gray-900 text-white">Other</option>
                        </select>
                      </div>
                      <div className="md:col-span-3 space-y-2">
                        <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">{isHotel ? 'Room Pref' : 'Seat Pref'}</label>
                        <select value={p.pref} onChange={e => updatePassenger(idx, 'pref', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:ring-2 focus:ring-blue-500/50 appearance-none">
                          {renderPreferences()}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400 border border-indigo-500/30"><User className="w-6 h-6" /></div>
                <h2 className="text-2xl font-bold text-white tracking-wide">Contact Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-blue-300 uppercase tracking-widest ml-1 drop-shadow-md">Email Address</label>
                  <input type="email" required value={contactInfo.email} onChange={e => setContactInfo({...contactInfo, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg font-medium focus:ring-2 focus:ring-blue-500 backdrop-blur-md" placeholder="Tickets will be sent here" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-blue-300 uppercase tracking-widest ml-1 drop-shadow-md">Mobile Number</label>
                  <input type="tel" required value={contactInfo.phone} onChange={e => setContactInfo({...contactInfo, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg font-medium focus:ring-2 focus:ring-blue-500 backdrop-blur-md" placeholder="+91 98765 43210" />
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 mt-8 border-t border-white/10">
                <button type="button" onClick={() => router.push('/search')} className="text-white/60 hover:text-white px-6 py-3 font-bold transition-colors flex items-center gap-2">
                  Cancel Booking
                </button>
                <button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all flex items-center gap-3 disabled:opacity-70 group shadow-[0_10px_30px_rgba(59,130,246,0.4)] hover:shadow-[0_10px_40px_rgba(59,130,246,0.6)] hover:-translate-y-1">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Review & Pay'}
                  {!isLoading && <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: PAYMENT */}
          {step === 2 && (
            <form onSubmit={handlePayment} className="animate-in fade-in zoom-in-95 duration-500">
              <div className="flex flex-col lg:flex-row gap-10">
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/10">
                    <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400 border border-emerald-500/30"><CreditCard className="w-6 h-6" /></div>
                    <h2 className="text-2xl font-bold text-white tracking-wide">Secure Checkout</h2>
                  </div>
                  
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 backdrop-blur-xl">
                    <div className="flex gap-4 mb-6 border-b border-white/10 pb-4">
                      {['card', 'upi', 'netbanking'].map(method => (
                        <button 
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${paymentMethod === method ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-black/40 text-white/60 hover:bg-black/60 border border-white/10'}`}
                        >
                          {method === 'card' ? 'Card' : method === 'upi' ? 'UPI' : 'Net Banking'}
                        </button>
                      ))}
                    </div>

                    {paymentMethod === 'card' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-white/50 uppercase tracking-widest ml-1">Card Number</label>
                          <input type="text" required maxLength={19} value={paymentDetails.cardNumber} onChange={e => {
                            let val = e.target.value.replace(/\D/g, '');
                            val = val.replace(/(.{4})/g, '$1 ').trim();
                            setPaymentDetails({...paymentDetails, cardNumber: val});
                          }} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg font-bold focus:ring-2 focus:ring-emerald-500/50 font-mono tracking-widest" placeholder="0000 0000 0000 0000" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-white/50 uppercase tracking-widest ml-1">Name on Card</label>
                          <input type="text" required value={paymentDetails.nameOnCard} onChange={e => setPaymentDetails({...paymentDetails, nameOnCard: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg font-bold focus:ring-2 focus:ring-emerald-500/50 uppercase" placeholder="JOHN DOE" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-white/50 uppercase tracking-widest ml-1">Expiry Date</label>
                            <input type="text" required maxLength={5} value={paymentDetails.expiry} onChange={e => setPaymentDetails({...paymentDetails, expiry: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg font-bold focus:ring-2 focus:ring-emerald-500/50 font-mono" placeholder="MM/YY" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-white/50 uppercase tracking-widest ml-1">Security Code</label>
                            <input type="password" required maxLength={4} value={paymentDetails.cvv} onChange={e => setPaymentDetails({...paymentDetails, cvv: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg font-bold focus:ring-2 focus:ring-emerald-500/50 font-mono" placeholder="CVV" />
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'upi' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-white/50 uppercase tracking-widest ml-1">UPI ID / VPA</label>
                          <input type="text" required value={upiId} onChange={e => setUpiId(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg font-bold focus:ring-2 focus:ring-emerald-500/50 tracking-wide" placeholder="username@upi" />
                        </div>
                        <p className="text-sm text-emerald-400/80 italic text-center mt-4">Open your UPI app (GPay, PhonePe, Paytm) to approve the payment request after clicking Pay.</p>
                      </div>
                    )}

                    {paymentMethod === 'netbanking' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-white/50 uppercase tracking-widest ml-1">Select Bank</label>
                          <select required value={bank} onChange={e => setBank(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg font-bold focus:ring-2 focus:ring-emerald-500/50 appearance-none">
                            <option value="" className="text-gray-500">Choose your bank...</option>
                            <option className="bg-gray-900 text-white" value="sbi">State Bank of India</option>
                            <option className="bg-gray-900 text-white" value="hdfc">HDFC Bank</option>
                            <option className="bg-gray-900 text-white" value="icici">ICICI Bank</option>
                            <option className="bg-gray-900 text-white" value="axis">Axis Bank</option>
                            <option className="bg-gray-900 text-white" value="pnb">Punjab National Bank</option>
                            <option className="bg-gray-900 text-white" value="kotak">Kotak Mahindra Bank</option>
                          </select>
                        </div>
                        <p className="text-sm text-emerald-400/80 italic text-center mt-4">You will be redirected to your bank's secure portal.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:w-96">
                  <div className="bg-gradient-to-br from-blue-900/60 to-indigo-900/60 border border-blue-500/40 rounded-3xl p-8 backdrop-blur-2xl h-full shadow-[0_15px_40px_rgba(30,58,138,0.5)]">
                    <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2 tracking-wide">
                      Order Summary
                    </h3>
                    
                    <div className="space-y-4 text-[15px] text-blue-100/90 mb-8 border-b border-white/20 pb-6 font-medium">
                      <div className="flex justify-between items-center"><span className="uppercase tracking-wider text-[11px] font-bold text-blue-300">Service</span><span className="text-white font-bold">{title}</span></div>
                      <div className="flex justify-between items-center"><span className="uppercase tracking-wider text-[11px] font-bold text-blue-300">Date</span><span className="text-white font-bold">{journeyDetails.date1 || '-'}</span></div>
                      <div className="flex justify-between items-center"><span className="uppercase tracking-wider text-[11px] font-bold text-blue-300">{terms.step1Title}</span><span className="text-white font-bold">{passengers.length}</span></div>
                      <div className="flex justify-between items-center"><span className="uppercase tracking-wider text-[11px] font-bold text-blue-300">{terms.classLabel}</span><span className="text-white font-bold truncate max-w-[120px] text-right">{journeyDetails.travelClass || 'Standard'}</span></div>
                    </div>

                    <div className="space-y-3 mb-6 font-semibold">
                      <div className="flex justify-between text-blue-100/90 text-sm"><span>Base Fare (x{passengers.length})</span><span>₹{baseTotal.toLocaleString()}</span></div>
                      {chartPrepared && (
                        <div className="flex justify-between text-red-400 font-bold text-sm"><span>Late Booking (Chart Prepared)</span><span>+ ₹{(baseTotal * 0.25).toLocaleString()}</span></div>
                      )}
                      <div className="flex justify-between text-blue-100/90 text-sm"><span>Taxes & Fees (18%)</span><span>₹{Math.round(totalPrice * 0.18).toLocaleString()}</span></div>
                    </div>

                    <div className="border-t border-white/30 pt-6 flex flex-col gap-2">
                      <span className="text-blue-300 text-[11px] uppercase tracking-widest font-black">Total Amount Due</span>
                      <span className="text-4xl font-black text-white drop-shadow-md">₹{Math.round(totalPrice + (totalPrice * 0.18)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-8 mt-10 border-t border-white/10">
                <button type="button" onClick={() => setStep(1)} className="text-white/60 hover:text-white px-6 py-3 font-bold transition-colors">Back to details</button>
                <button type="submit" disabled={isLoading} className="bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all flex items-center gap-3 disabled:opacity-70 group shadow-[0_10px_30px_rgba(16,185,129,0.4)] hover:shadow-[0_10px_40px_rgba(16,185,129,0.6)] hover:-translate-y-1">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
                  {isLoading ? 'Processing securely...' : `Pay ₹${Math.round(totalPrice + (totalPrice * 0.18)).toLocaleString()}`}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: CONFIRMATION */}
          {step === 3 && (
            <div className="animate-in zoom-in-95 duration-700 flex flex-col items-center text-center py-12">
              <div className="w-32 h-32 bg-emerald-500/20 rounded-full flex items-center justify-center mb-8 border border-emerald-500/50 relative shadow-[0_0_50px_rgba(16,185,129,0.4)]">
                <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping duration-1000" />
                <CheckCircle2 className="w-16 h-16 text-emerald-400 relative z-10" />
              </div>
              
              <h2 className="text-5xl font-black text-white mb-4 tracking-tight drop-shadow-xl">Booking Confirmed!</h2>
              <p className="text-blue-100 max-w-lg mx-auto mb-12 text-xl font-medium drop-shadow-md">
                Your payment was processed securely. Get ready for an incredible {title.toLowerCase()} experience.
              </p>

              <div className="bg-white/10 border border-white/20 rounded-3xl p-8 w-full max-w-2xl mx-auto mb-12 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />
                
                <div className="grid grid-cols-2 gap-8 divide-x divide-white/20">
                  <div className="flex flex-col items-center justify-center p-4">
                    <span className="text-white/70 text-[11px] uppercase tracking-widest font-black mb-2">Booking Reference</span>
                    <span className="text-white font-mono font-black text-4xl tracking-wider drop-shadow-md">{bookingResult.bookingId}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4">
                    <span className="text-white/70 text-[11px] uppercase tracking-widest font-black mb-2">PNR Number</span>
                    <span className="text-emerald-400 font-mono font-black text-4xl tracking-wider drop-shadow-md">{bookingResult.pnr}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button 
                  onClick={generatePDF}
                  className="bg-white text-black hover:bg-gray-100 px-8 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-3 group text-lg shadow-[0_10px_40px_rgba(255,255,255,0.3)] hover:-translate-y-1"
                >
                  Download E-Ticket
                  <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                </button>
                <button 
                  onClick={() => router.push('/profile')}
                  className="bg-black/50 text-white hover:bg-black/70 px-8 py-4 rounded-2xl font-black transition-all border border-white/20 backdrop-blur-md flex items-center justify-center text-lg"
                >
                  Go to Profile
                </button>
              </div>

              {showReturnPrompt && journeyDetails.to && (
                <div className="bg-gradient-to-br from-indigo-900/60 to-purple-900/60 border border-indigo-500/40 rounded-3xl p-8 mt-12 w-full max-w-2xl mx-auto shadow-[0_15px_40px_rgba(79,70,229,0.3)] backdrop-blur-2xl animate-in slide-in-from-bottom-8 duration-700">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-indigo-500/20 p-3 rounded-full mb-4">
                      <ArrowRightLeft className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2 tracking-wide">Book Your Return Journey?</h3>
                    <p className="text-indigo-200 text-lg mb-8 max-w-md">
                      Planning to head back? Book your return ticket from <span className="font-bold text-white">{journeyDetails.to}</span> to <span className="font-bold text-white">{journeyDetails.from}</span> now to secure the best seats.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                      <button 
                        onClick={() => {
                          router.push(`/search?source=${encodeURIComponent(journeyDetails.to)}&destination=${encodeURIComponent(journeyDetails.from)}&type=${encodeURIComponent(title)}`);
                        }} 
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/50 hover:-translate-y-1"
                      >
                        Book Return Ticket
                      </button>
                      <button 
                        onClick={() => setShowReturnPrompt(false)} 
                        className="bg-white/10 hover:bg-white/20 text-white/80 hover:text-white px-8 py-3 rounded-xl font-bold transition-colors border border-white/10"
                      >
                        Ignore
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-white/60 font-medium text-sm mt-12 bg-black/40 px-6 py-3 rounded-full backdrop-blur-md">
                A copy of this ticket has also been sent to <span className="text-white">{contactInfo.email}</span>
              </p>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}

export default function ServiceBookingFlow() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading booking flow...</div>}>
        <BookingFlowInner />
      </Suspense>
    </>
  );
}
