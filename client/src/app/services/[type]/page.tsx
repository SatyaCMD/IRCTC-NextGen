'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LocationInput from '@/components/LocationInput';
import { jsPDF } from 'jspdf';
import { 
  Download, CheckCircle2, CreditCard, Users, MapPin, 
  ChevronRight, ShieldCheck, Plane, Train, 
  Hotel, Utensils, Bus, User, Loader2, BedDouble, Coffee
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function ServiceBookingFlow() {
  const params = useParams();
  const router = useRouter();
  const type = params.type as string;
  const title = type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  // No immediate redirect needed, let user view first

  // Determine service category
  const isHotel = type.includes('hotel') || type.includes('room');
  const isFlight = type.includes('flight');
  const isBus = type.includes('bus');
  const isFood = type.includes('catering');
  const isTrain = !isHotel && !isFlight && !isBus && !isFood; // Default

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic Background Image - Using premium high-res images
  const getBackgroundImage = () => {
    if (isFlight) return 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop';
    if (isHotel) return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop'; // Better luxury hotel image
    if (isBus) return 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop';
    if (isFood) return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop';
    return 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop'; // Train/Default
  };

  // Terminology helpers based on service
  const terms = {
    step1Title: isHotel ? 'Stay Details' : isFood ? 'Order Details' : 'Journey Details',
    step2Title: isHotel ? 'Guests' : 'Passengers',
    personTerm: isHotel ? 'Guest' : 'Passenger',
    primaryLocation: isHotel ? 'Destination / City' : isFood ? 'Station / Train' : 'Leaving From',
    secondaryLocation: isHotel ? null : isFood ? 'Restaurant' : 'Going To',
    date1Label: isHotel ? 'Check-In Date' : isFood ? 'Delivery Date' : 'Departure Date',
    date2Label: isHotel ? 'Check-Out Date' : isFlight ? 'Return Date' : null,
    classLabel: isHotel ? 'Room Type' : isFood ? 'Meal Preference' : 'Class of Travel',
    icon1: isHotel ? <BedDouble className="w-6 h-6" /> : isFood ? <Coffee className="w-6 h-6" /> : <MapPin className="w-6 h-6" />
  };

  // Form Data States
  const [journeyDetails, setJourneyDetails] = useState({
    from: '',
    to: '',
    date1: '', 
    date2: '', 
    travelClass: '',
    quota: 'General'
  });

  const [passengers, setPassengers] = useState([
    { name: '', age: '', gender: 'Male', pref: 'No Preference' }
  ]);

  const [contactInfo, setContactInfo] = useState({ email: '', phone: '' });
  
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '', expiry: '', cvv: '', nameOnCard: ''
  });

  const [bookingResult, setBookingResult] = useState({ bookingId: '', pnr: '' });

  // Get appropriate icon for header
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
      // 1. Create booking (simulate getting a temporary booking)
      const bookingRes = await axios.post('http://localhost:5000/api/bookings', {
        serviceType: isHotel ? 'Hotel' : isFlight ? 'Flight' : isBus ? 'Bus' : isFood ? 'Food' : 'Train',
        serviceClass: journeyDetails.travelClass || 'Standard',
        passengers,
        totalPrice: totalPrice + Math.round(totalPrice * 0.18)
      }, { headers: { Authorization: `Bearer ${token}` } });

      const createdBooking = bookingRes.data;

      // 2. Confirm payment
      const confirmRes = await axios.put(`http://localhost:5000/api/bookings/${createdBooking._id}/payment`, {
        paymentId: `PAY${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        status: 'success'
      }, { headers: { Authorization: `Bearer ${token}` } });

      setBookingResult({
        bookingId: confirmRes.data.bookingRef || `BKG${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        pnr: confirmRes.data.pnr || `${Math.floor(1000000000 + Math.random() * 9000000000)}` 
      });
      setStep(4);
      toast.success('Payment successful! Booking confirmed.', { duration: 5000 });
    } catch (err) {
      toast.error('Payment processing failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addPassenger = () => setPassengers([...passengers, { name: '', age: '', gender: 'Male', pref: 'No Preference' }]);
  
  const updatePassenger = (index: number, field: string, value: string) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  // Pricing Logic
  const getBasePrice = () => {
    if (isFlight) return 5500;
    if (isHotel) return 4200;
    if (isBus) return 850;
    if (isFood) return 350;
    return 1250; 
  };
  const totalPrice = passengers.length * getBasePrice();

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // IRCTC Official E-Ticket Style
    doc.setFillColor(255, 255, 255); 
    doc.rect(0, 0, 210, 297, 'F');
    
    // Header Bar
    doc.setFillColor(0, 51, 102); // IRCTC Blue
    doc.rect(10, 10, 190, 25, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("IRCTC e-Ticketing Service", 105, 22, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Electronic Reservation Slip (ERS)", 105, 29, { align: "center" });

    // PNR and Details Box
    doc.setDrawColor(0, 51, 102);
    doc.rect(10, 40, 190, 45);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`PNR No: ${bookingResult.pnr}`, 15, 50);
    doc.setFontSize(10);
    doc.text(`Transaction ID: ${bookingResult.bookingId}`, 15, 58);
    
    doc.setFont("helvetica", "normal");
    if (isHotel) {
      doc.text(`Location: ${journeyDetails.from}`, 15, 68);
      doc.text(`Check-in: ${journeyDetails.date1} | Check-out: ${journeyDetails.date2 || 'N/A'}`, 15, 76);
      doc.text(`Room Type: ${journeyDetails.travelClass || 'Standard'}`, 120, 68);
    } else {
      doc.text(`Journey Date: ${journeyDetails.date1}`, 15, 68);
      doc.text(`From: ${journeyDetails.from}`, 15, 76);
      doc.text(`To: ${journeyDetails.to}`, 120, 76);
      doc.text(`Class: ${journeyDetails.travelClass || 'Standard'}`, 120, 68);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Passenger Details", 10, 95);
    
    // Passenger Table
    doc.setFillColor(230, 230, 230);
    doc.rect(10, 100, 190, 8, 'F');
    doc.setFontSize(9);
    doc.text("S.No.", 12, 106);
    doc.text("Name", 30, 106);
    doc.text("Age", 100, 106);
    doc.text("Sex", 120, 106);
    doc.text("Booking Status/Current Status/Coach No/Seat No", 140, 106);

    doc.setFont("helvetica", "normal");
    let yPos = 114;
    passengers.forEach((p, idx) => {
      doc.text(`${idx + 1}`, 12, yPos);
      doc.text(p.name || `${terms.personTerm} ${idx+1}`, 30, yPos);
      doc.text(p.age || "-", 100, yPos);
      doc.text(p.gender.charAt(0), 120, yPos);
      doc.text(`CNF / ${journeyDetails.travelClass?.charAt(0) || 'S'} / ${Math.floor(Math.random() * 80) + 1} / ${p.pref}`, 140, yPos);
      yPos += 8;
    });

    yPos += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Fare Details", 10, yPos);
    
    yPos += 5;
    doc.rect(10, yPos, 190, 25);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    yPos += 6;
    doc.text("Ticket Fare:", 15, yPos); doc.text(`Rs. ${totalPrice}.00`, 180, yPos, { align: 'right' });
    yPos += 6;
    doc.text("IRCTC Convenience Fee (Incl. of GST):", 15, yPos); doc.text(`Rs. ${Math.round(totalPrice * 0.18)}.00`, 180, yPos, { align: 'right' });
    yPos += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Total Fare (all inclusive):", 15, yPos); doc.text(`Rs. ${totalPrice + Math.round(totalPrice * 0.18)}.00`, 180, yPos, { align: 'right' });

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text("* This ticket is booked on a personal user ID and cannot be sold by an agent.", 105, 275, { align: "center" });
    doc.text("Contact us at care@irctc.co.in or call 14646 for assistance.", 105, 280, { align: "center" });

    doc.save(`IRCTC2.0_${title.replace(/\s+/g, '')}_${bookingResult.pnr}.pdf`);
    toast.success('Ticket downloaded successfully!');
  };

  const renderClassOptions = () => {
    if (isFlight) return (
      <><option value="">Select Flight Class</option><option>Economy Class</option><option>Premium Economy</option><option>Business Class</option><option>First Class</option></>
    );
    if (isHotel) return (
      <><option value="">Select Room Type</option><option>Standard Room</option><option>Deluxe Room</option><option>Ocean View Suite</option><option>Presidential Suite</option></>
    );
    if (isBus) return (
      <><option value="">Select Bus Type</option><option>Non-AC Seater</option><option>AC Seater</option><option>Non-AC Sleeper</option><option>Volvo AC Sleeper</option></>
    );
    if (isFood) return (
      <><option value="">Select Cuisine Type</option><option>North Indian Thali</option><option>South Indian</option><option>Continental</option><option>Jain Meals</option></>
    );
    return (
      <><option value="">Select Train Class</option><option>Sleeper (SL)</option><option>AC 3 Tier (3A)</option><option>AC 2 Tier (2A)</option><option>AC First Class (1A)</option><option>Second Sitting (2S)</option></>
    );
  };

  const renderPreferences = () => {
    if (isHotel) return <><option>No Preference</option><option>High Floor</option><option>Near Elevator</option><option>Quiet Room</option></>;
    if (isFlight) return <><option>No Preference</option><option>Window Seat</option><option>Aisle Seat</option><option>Extra Legroom</option></>;
    if (isBus) return <><option>No Preference</option><option>Window Seat</option><option>Front Rows</option></>;
    if (isFood) return <><option>Regular Spice</option><option>Extra Spicy</option><option>Less Spicy</option></>;
    return <><option>No Preference</option><option>Lower Berth</option><option>Middle Berth</option><option>Upper Berth</option><option>Side Lower</option></>;
  };

  return (
    <main className="min-h-screen pt-24 pb-12 relative selection:bg-blue-500/30 font-sans bg-black">
      <Navbar />
      
      {/* Dynamic Background with reduced darkening for much better visibility */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 scale-105"
          style={{ backgroundImage: `url('${getBackgroundImage()}')` }}
        />
        {/* Lighter, elegant gradient overlay to let the image shine through */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80" />
      </div>
      
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="p-4 bg-white/20 backdrop-blur-xl text-white rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)] mb-4 border border-white/30">
            {getIcon()}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3 drop-shadow-xl">
            {title} Booking
          </h1>
          <p className="text-white/90 text-lg font-medium max-w-2xl drop-shadow-md">
            Experience the pinnacle of {isHotel ? 'hospitality' : 'travel'}. Fast, secure, and elegantly designed for your convenience.
          </p>
        </div>

        {/* Premium Stepper */}
        <div className="flex items-center justify-center mb-10 max-w-3xl mx-auto drop-shadow-xl">
          {['Search', terms.step2Title, 'Payment', 'Ticket'].map((label, index) => {
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
                {index < 3 && (
                  <div className={`w-12 md:w-24 h-1.5 mx-2 rounded-full transition-colors duration-500 ${step > stepNum ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-black/30 backdrop-blur-md'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Form Container - Premium Glassmorphism */}
        <div className="bg-black/60 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-6 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] mt-12">
          
          {/* STEP 1: JOURNEY / STAY DETAILS */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/10">
                <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400 border border-blue-500/30">
                  {terms.icon1}
                </div>
                <h2 className="text-2xl font-bold text-white tracking-wide">{terms.step1Title}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                {/* Primary Location */}
                <LocationInput 
                  label={terms.primaryLocation} 
                  value={journeyDetails.from} 
                  onChange={val => setJourneyDetails({...journeyDetails, from: val})} 
                  type={isFlight ? 'Flight' : isHotel ? 'City' : 'Train'} 
                  placeholder={isHotel ? "E.g. Taj Mahal Palace, Mumbai" : "City or Station Code"}
                />

                {/* Secondary Location */}
                {terms.secondaryLocation && (
                  <LocationInput 
                    label={terms.secondaryLocation} 
                    value={journeyDetails.to} 
                    onChange={val => setJourneyDetails({...journeyDetails, to: val})} 
                    type={isFlight ? 'Flight' : isHotel ? 'City' : 'Train'} 
                    placeholder={isFood ? "Select Restaurant" : "City or Station Code"}
                  />
                )}

                {/* Date 1 */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-blue-300 uppercase tracking-widest ml-1 drop-shadow-md">
                    {terms.date1Label}
                  </label>
                  <input type="date" min={new Date().toISOString().split('T')[0]} max={new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]} required value={journeyDetails.date1} onChange={e => setJourneyDetails({...journeyDetails, date1: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all backdrop-blur-md font-medium [color-scheme:dark]" />
                </div>

                {/* Date 2 */}
                {terms.date2Label && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-blue-300 uppercase tracking-widest ml-1 drop-shadow-md">
                      {terms.date2Label}
                    </label>
                    <input type="date" min={new Date().toISOString().split('T')[0]} max={new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]} required={isHotel} value={journeyDetails.date2} onChange={e => setJourneyDetails({...journeyDetails, date2: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all backdrop-blur-md font-medium [color-scheme:dark]" />
                  </div>
                )}

                {/* Class / Quota Fields */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-blue-300 uppercase tracking-widest ml-1 drop-shadow-md">
                    {terms.classLabel}
                  </label>
                  <select required value={journeyDetails.travelClass} onChange={e => setJourneyDetails({...journeyDetails, travelClass: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all backdrop-blur-md font-medium appearance-none cursor-pointer">
                    {renderClassOptions()}
                  </select>
                </div>

                {isTrain && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-blue-300 uppercase tracking-widest ml-1 drop-shadow-md">Quota</label>
                    <select value={journeyDetails.quota} onChange={e => setJourneyDetails({...journeyDetails, quota: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all backdrop-blur-md font-medium appearance-none cursor-pointer">
                      <option>General Quota</option>
                      <option>Tatkal</option>
                      <option>Ladies</option>
                      <option>Senior Citizen</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-6 mt-8 border-t border-white/10">
                <button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all flex items-center gap-3 disabled:opacity-70 group shadow-[0_10px_30px_rgba(59,130,246,0.4)] hover:shadow-[0_10px_40px_rgba(59,130,246,0.6)] hover:-translate-y-1">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : `Continue to ${terms.step2Title}`}
                  {!isLoading && <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: PASSENGERS / GUESTS */}
          {step === 2 && (
            <form onSubmit={handleNextStep} className="animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400 border border-blue-500/30"><Users className="w-6 h-6" /></div>
                  <h2 className="text-2xl font-bold text-white tracking-wide">{terms.step2Title} Details</h2>
                </div>
                <button type="button" onClick={addPassenger} className="text-sm font-bold bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-xl transition-all border border-white/20 backdrop-blur-md flex items-center gap-2 shadow-lg">
                  + Add {terms.personTerm}
                </button>
              </div>

              <div className="space-y-6 mb-12">
                {passengers.map((p, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl">
                    <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-400 to-indigo-600" />
                    <h3 className="text-[11px] font-black text-blue-300 uppercase tracking-widest mb-5 ml-3 drop-shadow-md">{terms.personTerm} {idx + 1}</h3>
                    
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
                          <option>Male</option><option>Female</option><option>Other</option>
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
                <button type="button" onClick={() => setStep(1)} className="text-white/60 hover:text-white px-6 py-3 font-bold transition-colors flex items-center gap-2">
                  Back
                </button>
                <button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all flex items-center gap-3 disabled:opacity-70 group shadow-[0_10px_30px_rgba(59,130,246,0.4)] hover:shadow-[0_10px_40px_rgba(59,130,246,0.6)] hover:-translate-y-1">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Review & Pay'}
                  {!isLoading && <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: PAYMENT */}
          {step === 3 && (
            <form onSubmit={handlePayment} className="animate-in fade-in zoom-in-95 duration-500">
              <div className="flex flex-col lg:flex-row gap-10">
                
                {/* Left: Payment Form */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/10">
                    <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400 border border-emerald-500/30"><CreditCard className="w-6 h-6" /></div>
                    <h2 className="text-2xl font-bold text-white tracking-wide">Secure Checkout</h2>
                  </div>
                  
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 backdrop-blur-xl">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-white/50 uppercase tracking-widest ml-1">Card Number</label>
                      <input type="text" required maxLength={19} value={paymentDetails.cardNumber} onChange={e => setPaymentDetails({...paymentDetails, cardNumber: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg font-bold focus:ring-2 focus:ring-emerald-500/50 font-mono tracking-widest" placeholder="0000 0000 0000 0000" />
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
                </div>

                {/* Right: Order Summary */}
                <div className="lg:w-96">
                  <div className="bg-gradient-to-br from-blue-900/60 to-indigo-900/60 border border-blue-500/40 rounded-3xl p-8 backdrop-blur-2xl h-full shadow-[0_15px_40px_rgba(30,58,138,0.5)]">
                    <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2 tracking-wide">
                      Order Summary
                    </h3>
                    
                    <div className="space-y-4 text-[15px] text-blue-100/90 mb-8 border-b border-white/20 pb-6 font-medium">
                      <div className="flex justify-between items-center"><span className="uppercase tracking-wider text-[11px] font-bold text-blue-300">Service</span><span className="text-white font-bold">{title}</span></div>
                      <div className="flex justify-between items-center"><span className="uppercase tracking-wider text-[11px] font-bold text-blue-300">Date</span><span className="text-white font-bold">{journeyDetails.date1 || '-'}</span></div>
                      <div className="flex justify-between items-center"><span className="uppercase tracking-wider text-[11px] font-bold text-blue-300">{terms.step2Title}</span><span className="text-white font-bold">{passengers.length}</span></div>
                      <div className="flex justify-between items-center"><span className="uppercase tracking-wider text-[11px] font-bold text-blue-300">{terms.classLabel}</span><span className="text-white font-bold truncate max-w-[120px] text-right">{journeyDetails.travelClass || 'Standard'}</span></div>
                    </div>

                    <div className="space-y-3 mb-6 font-semibold">
                      <div className="flex justify-between text-blue-100/90 text-sm"><span>Base Fare (x{passengers.length})</span><span>₹{totalPrice.toLocaleString()}</span></div>
                      <div className="flex justify-between text-blue-100/90 text-sm"><span>Taxes & Fees (18%)</span><span>₹{Math.round(totalPrice * 0.18).toLocaleString()}</span></div>
                    </div>

                    <div className="border-t border-white/30 pt-6 flex flex-col gap-2">
                      <span className="text-blue-300 text-[11px] uppercase tracking-widest font-black">Total Amount Due</span>
                      <span className="text-4xl font-black text-white drop-shadow-md">₹{(totalPrice + Math.round(totalPrice * 0.18)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-8 mt-10 border-t border-white/10">
                <button type="button" onClick={() => setStep(2)} className="text-white/60 hover:text-white px-6 py-3 font-bold transition-colors">Back to details</button>
                <button type="submit" disabled={isLoading} className="bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all flex items-center gap-3 disabled:opacity-70 group shadow-[0_10px_30px_rgba(16,185,129,0.4)] hover:shadow-[0_10px_40px_rgba(16,185,129,0.6)] hover:-translate-y-1">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
                  {isLoading ? 'Processing securely...' : `Pay ₹${(totalPrice + Math.round(totalPrice * 0.18)).toLocaleString()}`}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: CONFIRMATION */}
          {step === 4 && (
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

              <button 
                onClick={generatePDF}
                className="bg-white text-black hover:bg-gray-100 px-12 py-5 rounded-2xl font-black transition-all flex items-center gap-3 group text-xl shadow-[0_10px_40px_rgba(255,255,255,0.3)] hover:-translate-y-1"
              >
                Download Official E-Ticket
                <Download className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
              </button>
              
              <p className="text-white/60 font-medium text-sm mt-8 bg-black/40 px-6 py-3 rounded-full backdrop-blur-md">
                A copy of this ticket has also been sent to <span className="text-white">{contactInfo.email}</span>
              </p>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
