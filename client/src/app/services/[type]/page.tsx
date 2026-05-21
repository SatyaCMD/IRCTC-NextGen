'use client';

import { useState, useEffect, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Download, CheckCircle2, CreditCard, Users, MapPin, 
  ChevronRight, ShieldCheck, Plane, Train, 
  Hotel, Utensils, Bus, User, Loader2, ArrowRightLeft, Lock, Wallet, Star
} from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import axios from 'axios';
import TrainSearch from '@/components/TrainSearch';

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
  const urlQuota = searchParams.get('quota') || 'General';

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
  const [showVerificationModal, setShowVerificationModal] = useState(false);

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
    quota: urlQuota
  });

  const [passengers, setPassengers] = useState([
    { name: '', age: '', gender: 'Male', pref: 'No Preference' }
  ]);
  const [contactInfo, setContactInfo] = useState({ email: '', phone: '' });
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '', expiry: '', cvv: '', nameOnCard: ''
  });
  const [bookingResult, setBookingResult] = useState({ bookingId: '', pnr: '', status: '', serviceClass: '', seatNumbers: [] as string[], trainId: null as any });
  const [showReturnPrompt, setShowReturnPrompt] = useState(true);
  
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [showSeatMapForPassenger, setShowSeatMapForPassenger] = useState<number | null>(null);
  const [bookedSeats, setBookedSeats] = useState<Set<string>>(new Set());
  const [wantsPantry, setWantsPantry] = useState(false);
  const [pantryQuantity, setPantryQuantity] = useState(1);
  const [pantryCategory, setPantryCategory] = useState('Veg');
  const [pantryMeal, setPantryMeal] = useState('Standard Veg Thali');
  const [selectedCoach, setSelectedCoach] = useState('S1');

  const pantryMenus: Record<string, {name: string, price: number}[]> = {
    'Veg': [
      { name: 'Standard Veg Thali', price: 150 },
      { name: 'Deluxe Veg Thali', price: 200 },
      { name: 'Paneer Biryani', price: 180 },
      { name: 'Veg Fried Rice with Manchurian', price: 160 },
      { name: 'Chole Bhature', price: 120 }
    ],
    'Non-Veg': [
      { name: 'Standard Non-Veg Thali', price: 250 },
      { name: 'Chicken Biryani', price: 280 },
      { name: 'Egg Curry with Rice', price: 180 },
      { name: 'Chicken Fried Rice', price: 220 },
      { name: 'Butter Chicken with Naan', price: 300 }
    ]
  };

  const currentPantryMenu = pantryCategory === 'Veg' ? pantryMenus['Veg'] : pantryMenus['Non-Veg'];
  const selectedPantryMeal = currentPantryMenu.find(m => m.name === pantryMeal) || currentPantryMenu[0];

  useEffect(() => {
    // Generate some random booked seats depending on the class layout and selected coach
    const generated = new Set<string>();
    const rows = 15; // Max possible rows
    const cols = ['A','B','C','D','E','F'];
    
    const seed = selectedCoach.charCodeAt(0) + (selectedCoach.charCodeAt(1) || 0) + (selectedCoach.charCodeAt(2) || 0);
    const random = (seedIdx: number) => {
      const x = Math.sin(seed + seedIdx) * 10000;
      return x - Math.floor(x);
    };

    let idx = 0;
    for(let r = 1; r <= rows; r++) {
      cols.forEach(c => {
         idx++;
         if (random(idx) < 0.35) generated.add(`${r}${c}`); // 35% booked
      });
    }
    // Generate for numeric standard layouts (1-80)
    for(let s = 1; s <= 80; s++) {
       idx++;
       if (random(idx) < 0.35) generated.add(`${s}`);
    }
    setBookedSeats(generated);
  }, [selectedCoach]);

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [upiId, setUpiId] = useState('');
  const [bank, setBank] = useState('');
  const [userWalletBalance, setUserWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      axios.get('http://localhost:5000/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setUserWalletBalance(res.data.walletBalance || 0))
        .catch(err => console.error(err));
    }
  }, []);

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
    
    // Explicit mandatory validation
    const hasEmptyPassenger = passengers.some(p => !p.name || !p.age);
    if (hasEmptyPassenger || !contactInfo.email || !contactInfo.phone) {
      toast.error('Please fill in all mandatory details before proceeding.');
      return;
    }

    if (journeyDetails.travelClass.includes('1A')) {
      if (passengers.length !== 2) {
        toast.error('1A Class bookings require exactly 2 passengers per ticket (Couples only).');
        return;
      }
      const hasMale = passengers.some(p => p.gender === 'Male');
      const hasFemale = passengers.some(p => p.gender === 'Female');
      if (!hasMale || !hasFemale) {
        toast.error('1A Class is strictly for couples (1 Male and 1 Female).');
        return;
      }
    }

    if (journeyDetails.quota === 'Tatkal') {
      const currentHour = new Date().getHours();
      if (currentHour < 11 || currentHour >= 12) {
        toast.error('Tatkal booking window is only open from 11 AM to 12 PM.');
        return;
      }
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
      let orderedItems: any[] = [];
      if (isFood) {
         try {
            const cartStr = localStorage.getItem('ecatering_cart');
            if (cartStr) {
               const cartObj = JSON.parse(cartStr);
               orderedItems = Object.entries(cartObj).map(([name, data]: any) => ({
                  name,
                  price: data.price,
                  quantity: data.count
               }));
            }
         } catch (e) {}
      }

      const bookingRes = await axios.post('http://localhost:5000/api/bookings', {
        trainId: urlTrainId,
        serviceType: isHotel ? 'Hotels' : isFlight ? 'Flight' : isBus ? 'Bus' : isFood ? 'E Catering' : 'Train',
        serviceClass: journeyDetails.travelClass || 'Standard',
        passengers: passengers.map(p => ({
          name: p.name,
          age: p.age,
          gender: p.gender,
          seatPreference: p.pref
        })),
        totalPrice: Math.round(totalPrice + (totalPrice * 0.18)),
        journeyDate: journeyDetails.date1,
        from: journeyDetails.from,
        to: journeyDetails.to,
        departureTime: urlDepartureTime,
        quota: journeyDetails.quota,
        walletAmountUsed: useWallet ? Math.min(Math.round(totalPrice + (totalPrice * 0.18)), userWalletBalance) : 0,
        orderedItems
      }, { headers: { Authorization: `Bearer ${token}` } });

      const createdBooking = bookingRes.data;

      let finalStatus = (journeyDetails.quota === 'Student' || journeyDetails.quota === 'Armed Forces') ? 'Verification Pending' : 'success';
      if (journeyDetails.quota === 'Tatkal' && Math.random() < 0.3) {
         finalStatus = 'WL';
      }
      const confirmRes = await axios.put(`http://localhost:5000/api/bookings/${createdBooking._id}/payment`, {
        passengers,
        contactInfo,
        totalAmount: totalPrice,
        paymentStatus: 'Completed',
        pantryItems: wantsPantry ? { meal: selectedPantryMeal.name, price: selectedPantryMeal.price * pantryQuantity } : null,
        status: finalStatus
      }, { headers: { Authorization: `Bearer ${token}` } });

      setBookingResult({
        bookingId: confirmRes.data.bookingRef || `BKG${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        pnr: confirmRes.data.pnr || `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        status: confirmRes.data.status || (finalStatus === 'success' ? 'Confirmed' : finalStatus),
        serviceClass: confirmRes.data.serviceClass || journeyDetails.travelClass,
        seatNumbers: confirmRes.data.seatNumbers || [],
        trainId: createdBooking.trainId
      });
      setStep(4);
      
      if (finalStatus === 'Verification Pending') {
         setShowVerificationModal(true);
         
         const pnrToPoll = confirmRes.data.pnr;
         if (pnrToPoll) {
           const pollInterval = setInterval(async () => {
             try {
               const pnrRes = await axios.get(`http://localhost:5000/api/bookings/pnr/${pnrToPoll}`);
               if (pnrRes.data.booking && pnrRes.data.booking.status === 'Confirmed') {
                 setBookingResult(prev => ({ ...prev, status: 'Confirmed' }));
                 toast.success('ID Verification Successful! Ticket Confirmed.');
                 clearInterval(pollInterval);
               }
             } catch (e) {
               console.error("Polling error", e);
             }
           }, 10000); // Check every 10 seconds

           // Fallback cleanup if user navigates away or modal remains open too long
           setTimeout(() => clearInterval(pollInterval), 180000); // Stop polling after 3 minutes max
         } else {
           // Fallback to old setTimeout if no pnr
           setTimeout(() => {
             setBookingResult(prev => ({ ...prev, status: 'Confirmed' }));
             toast.success('ID Verification Successful! Ticket Confirmed.');
           }, 120000);
         }
      } else {
         toast.success('Payment successful! Booking confirmed.', { duration: 5000 });
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error;
      if (errorMsg && errorMsg.includes("cancelled")) {
        toast.error(errorMsg, { duration: 6000 });
        setStep(1);
      } else {
        toast.error('Payment processing failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const submitReview = async () => {
    if (!reviewComment.trim()) return;
    setIsSubmittingReview(true);
    try {
      await axios.post(`http://localhost:5000/api/trains/${urlTrainId}/reviews`, {
        user: contactInfo.email ? contactInfo.email.split('@')[0] : "Guest User",
        rating: reviewRating,
        comment: reviewComment
      });
      setReviewSubmitted(true);
    } catch (e) {
      console.error("Review submission error:", e);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const maxMembers = isHotel ? 2 : 6;
  const addPassenger = () => {
    if (passengers.length < maxMembers) {
      setPassengers([...passengers, { name: '', age: '', gender: 'Male', pref: 'No Preference' }]);
    } else {
      toast.error(`Maximum ${maxMembers} members allowed per booking for ${title}.`);
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
  
  let passengersFare = 0;
  passengers.forEach(p => {
    let price = getBasePrice();
    // Dynamic pricing for Window / Middle seats in Flights and Buses
    if (isFlight || isBus) {
      if (p.pref.includes('Window Seat')) price *= 1.10; // 10% premium
      else if (p.pref.includes('Middle Seat')) price *= 0.95; // 5% discount
    }
    
    // Quota discounts
    if (journeyDetails.quota === 'Student') price *= 0.80; // 20% off
    else if (journeyDetails.quota === 'Senior Citizen') price *= 0.75; // 25% off
    else if (journeyDetails.quota === 'Armed Forces') price *= 0.70; // 30% off
    else if (journeyDetails.quota === 'Tatkal') price *= 1.15; // 15% extra
    
    passengersFare += price;
  });
  
  let pantryFare = 0;
  if (!isHotel && !isFood && wantsPantry) {
    pantryFare = (selectedPantryMeal.price * pantryQuantity);
  }
  
  const baseTotal = chartPrepared ? passengersFare * 1.25 : passengersFare;
  const totalPrice = baseTotal + pantryFare;

  const generatePDF = async () => {
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

    const isSpecialService = isHotel || isFood || type.toLowerCase().includes('holiday') || type.toLowerCase().includes('retiring');
    const g20Base64 = await getBase64ImageFromUrl('/g20-logo.jpg');
    let serviceLogoUrl = '/ir-logo.png';
    if (isFlight) serviceLogoUrl = '/flight_logo.png';
    if (isBus) serviceLogoUrl = '/bus_logo.png';
    if (isSpecialService) serviceLogoUrl = '/hotel_logo.png';
    const mainLogoBase64 = await getBase64ImageFromUrl(serviceLogoUrl);

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    if (isSpecialService) {
      // Specialized PDF for Hotels, Retiring Room, E-Catering
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text('Booking Confirmation Voucher', pageWidth / 2, 15, { align: 'center' });

      // Header Logos
      if (mainLogoBase64) {
        doc.addImage(mainLogoBase64, 'PNG', 10, 4, 26, 26);
      } else {
        doc.setFontSize(16);
        doc.setTextColor(0, 51, 153);
        doc.text("IRCTC", 15, 20);
      }

      if (g20Base64) {
        doc.addImage(g20Base64, 'JPEG', pageWidth - 42, 6, 28, 18);
      } else {
        doc.setTextColor(255, 153, 51);
        doc.setFontSize(16);
        doc.text("G20", pageWidth - 35, 20);
      }

      doc.setTextColor(0, 0, 0);

      // Banner for Location
      doc.setFillColor(153, 204, 255);
      doc.rect(70, 32, 70, 6, 'F');
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(isFood ? "Delivery Station" : "City/Location", 35, 30, { align: 'center' });
      doc.text("Service Details", 105, 36, { align: 'center' });
      doc.text(isFood ? "Delivery Station" : "City/Location", 175, 30, { align: 'center' });

      doc.setFont("helvetica", "normal");
      const dest = journeyDetails.to || 'MUMBAI';
      const formatStationName = (name: string, maxLen = 20) => name.length > maxLen ? name.substring(0, maxLen - 2) + '...' : name;
      doc.text(formatStationName(dest.toUpperCase()), 35, 42, { align: 'center' });
      doc.text(formatStationName(dest.toUpperCase(), 30), 105, 42, { align: 'center' });
      doc.text(formatStationName(dest.toUpperCase()), 175, 42, { align: 'center' });

      // Date / Time
      const dateStr = journeyDetails.date1 || new Date().toISOString().split('T')[0];
      const timeStr = urlDepartureTime || '12:00';
      const arrTimeStr = '08:45';

      doc.text(isFood ? `Delivery Date: ${dateStr}` : `Check-in Date: ${dateStr}`, 35, 48, { align: 'center' });
      doc.setFont("helvetica", "bold");
      doc.text(isFood ? `Time: ${timeStr} | ${dateStr}` : `Check-in: ${timeStr} | ${dateStr}`, 105, 48, { align: 'center' });
      doc.setFont("helvetica", "normal");
      doc.text(isFood ? `Delivery: ${arrTimeStr}` : `Check-out: ${arrTimeStr}`, 175, 48, { align: 'center' });

      // Main Details Grid
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(10, 52, 200, 52);

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Booking ID", 35, 57, { align: 'center' });
      doc.text(isFood ? "Restaurant/Vendor" : "Hotel/Room Name", 105, 57, { align: 'center' });
      doc.text("Type", 160, 57, { align: 'center' });
      doc.text("Booking Date", 190, 57, { align: 'center' });

      doc.setTextColor(0, 51, 153);
      doc.text(bookingResult.bookingId || 'N/A', 35, 62, { align: 'center' });

      const serviceName = bookingResult?.trainId?.name || title.toUpperCase();
      doc.text(serviceName.length > 25 ? serviceName.substring(0, 23) + '...' : serviceName, 105, 62, { align: 'center' });

      doc.text(journeyDetails.travelClass || 'Standard', 160, 62, { align: 'center' });
      doc.setFontSize(8);
      doc.text(new Date().toLocaleDateString(), 190, 62, { align: 'center' });
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);

      doc.line(10, 66, 200, 66);

      // Passenger / Guest Details Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(isFood ? "Order/Customer Details" : "Guest Details", 12, 71);

      // autoTable
      const passCols = ["#", "Name", "Age", "Gender", "Status"];
      const passRows = passengers.map((p: any, idx: number) => {
        return [(idx + 1).toString(), p.name.toUpperCase(), p.age.toString(), p.gender.charAt(0).toUpperCase(), 'CONFIRMED'];
      });

      autoTable(doc, {
        startY: 73,
        head: [passCols],
        body: passRows,
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 1, textColor: [0, 0, 0] },
        headStyles: { fontStyle: 'bold' }
      });

      const py = (doc as any).lastAutoTable?.finalY || 100;
      doc.line(10, py + 2, 200, py + 2);

      // Contact Details
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`Contact Details:     Email: ${contactInfo.email}                 Mobile: ${contactInfo.phone || 'N/A'}`, 12, py + 8);

      // Payment Details
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Payment Details", 12, py + 16);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");

      const tPrice = Math.round(totalPrice + (totalPrice * 0.18));
      const baseFare = tPrice / 1.18;
      const tax = tPrice - baseFare;
      doc.text("Service Fare", 12, py + 22); doc.text(`Rs. ${baseFare.toFixed(2)}`, 100, py + 22);
      doc.text("Taxes & Fees (Incl. of GST)", 12, py + 27); doc.text(`Rs. ${tax.toFixed(2)}`, 100, py + 27);
      doc.setFont("helvetica", "bold");
      doc.text("Total Paid (all inclusive)", 12, py + 32); doc.text(`Rs. ${tPrice.toFixed(2)}`, 100, py + 32);

      // QR Code simulation block
      doc.setFillColor(0, 0, 0);
      const qrSize = 30;
      const px = 150;
      const pY = py + 14;

      doc.rect(px, pY, 7, 7, 'F'); doc.setFillColor(255, 255, 255); doc.rect(px + 1, pY + 1, 5, 5, 'F'); doc.setFillColor(0, 0, 0); doc.rect(px + 2, pY + 2, 3, 3, 'F');
      doc.rect(px + qrSize - 7, pY, 7, 7, 'F'); doc.setFillColor(255, 255, 255); doc.rect(px + qrSize - 6, pY + 1, 5, 5, 'F'); doc.setFillColor(0, 0, 0); doc.rect(px + qrSize - 5, pY + 2, 3, 3, 'F');
      doc.rect(px, pY + qrSize - 7, 7, 7, 'F'); doc.setFillColor(255, 255, 255); doc.rect(px + 1, pY + qrSize - 6, 5, 5, 'F'); doc.setFillColor(0, 0, 0); doc.rect(px + 2, pY + qrSize - 5, 3, 3, 'F');
      for (let x = 0; x < qrSize; x += 1.5) {
        for (let y = 0; y < qrSize; y += 1.5) {
          if ((x < 8 && y < 8) || (x > qrSize - 8 && y < 8) || (x < 8 && y > qrSize - 8)) continue;
          if (Math.random() > 0.5) doc.rect(px + x, pY + y, 1.5, 1.5, 'F');
        }
      }

      doc.line(10, py + 46, 200, py + 46);

      // Amenities & Inclusions
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Inclusions & Amenities", 12, py + 52);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      if (isHotel || type.toLowerCase().includes('retiring')) {
        doc.text("• Complimentary Wi-Fi Internet Access", 15, py + 58);
        doc.text("• Air Conditioned Room with standard furnishing", 15, py + 62);
        doc.text("• 24/7 Room Service & Housekeeping available", 15, py + 66);
        doc.text("• Breakfast included (If explicitly stated in your booking package)", 15, py + 70);
      } else if (isFood) {
        doc.text("• Freshly prepared meal from certified vendor", 15, py + 58);
        doc.text("• Delivery directly to your seat/berth as scheduled", 15, py + 62);
        doc.text("• Cutlery and napkins included in standard packaging", 15, py + 66);
      } else {
        doc.text("• Complete travel package as per itinerary", 15, py + 58);
        doc.text("• Dedicated customer support during transit", 15, py + 62);
      }

      // Important Policies
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Important Policies", 12, py + 80);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("• This voucher must be presented at the time of check-in / delivery along with a valid Govt. ID.", 15, py + 86);
      doc.text("• Standard Check-in is at 12:00 PM and Check-out is at 11:00 AM unless otherwise specified.", 15, py + 90);
      doc.text("• Cancellation policies apply as per the service provider's terms and conditions. Refunds processed within 5-7 days.", 15, py + 94);
      doc.text("• The Service Provider reserves the right to deny admission / delivery if the ID proof is mismatched.", 15, py + 98);

      // Customer Support
      doc.setFillColor(240, 248, 255);
      doc.rect(10, py + 105, 190, 20, 'F');
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("24/7 Customer Support", 15, py + 112);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("For any queries, please contact our dedicated helpdesk at 1800-111-139 or email us at support@irctchospitality.co.in", 15, py + 118);

      // Advertising Banner
      doc.setFillColor(255, 230, 153);
      doc.rect(10, py + 132, 190, 15, 'F');
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 150);
      doc.text("EXPLORE INDIA WITH IRCTC TOURISM - VISIT IRCTC2.0.SATYACMD.DEV", pageWidth / 2, py + 141, { align: 'center' });

      // Footer
      doc.setTextColor(0, 0, 0);
      doc.line(10, py + 155, 200, py + 155);
      doc.setFont("helvetica", "bolditalic");
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7);
      doc.text(`VOUCHER GENERATED BY: IRCTC 2.0 PORTAL  |  ISSUED ON: ${new Date().toLocaleString()}  |  IP: SECURED`, 12, py + 160);

      doc.save(`IRCTC_VOUCHER_${bookingResult.bookingId}.pdf`);
      toast.success('Booking Voucher downloaded successfully!');
      return;
    }

    // ORIGINAL PDF LOGIC FOR TRAINS, FLIGHTS, BUSES


    // Header section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text('Electronic Reservation Slip (ERS)', pageWidth / 2, 15, { align: 'center' });

    // Header Logos
    if (mainLogoBase64) {
      doc.addImage(mainLogoBase64, 'PNG', 15, 8, 14, 14);
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
    doc.text(isHotel ? "City/Location" : "Booked From", 35, 30, { align: 'center' });
    doc.text(isHotel ? "Address Details" : "Boarding At", 105, 36, { align: 'center' });
    doc.text(isHotel ? "City/Location" : "To", 175, 30, { align: 'center' });

    // Stations
    doc.setFont("helvetica", "normal");
    const source = journeyDetails.from || 'HOWRAH JN (HWH)';
    const dest = journeyDetails.to || 'NEW DELHI (NDLS)';
    const formatStationName = (name: string, maxLen = 20) => name.length > maxLen ? name.substring(0, maxLen - 2) + '...' : name;
    doc.text(formatStationName(source.toUpperCase()), 35, 42, { align: 'center' });
    doc.text(formatStationName(isHotel ? dest.toUpperCase() : source.toUpperCase(), 30), 105, 42, { align: 'center' });
    doc.text(formatStationName(isHotel ? source.toUpperCase() : dest.toUpperCase()), 175, 42, { align: 'center' });

    // Date / Time
    const dateStr = journeyDetails.date1 || new Date().toISOString().split('T')[0];
    const timeStr = urlDepartureTime || '18:30';
    const arrTimeStr = '08:45';

    doc.text(isHotel ? `Check-in Date: ${dateStr}` : `Start Date: ${dateStr}`, 35, 48, { align: 'center' });
    doc.setFont("helvetica", "bold");
    doc.text(isHotel ? `Check-in: ${timeStr} | ${dateStr}` : `Departure: ${timeStr} | ${dateStr}`, 105, 48, { align: 'center' });
    doc.setFont("helvetica", "normal");
    doc.text(isHotel ? `Check-out: ${arrTimeStr}` : `Arrival: ${arrTimeStr} | ${dateStr}`, 175, 48, { align: 'center' });

    // Main Details Grid
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(10, 52, 200, 52);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("PNR", 35, 57, { align: 'center' });
    const serviceNameHeader = isHotel ? "Hotel Name" : `${title} No./Name`;
    doc.text(serviceNameHeader, 105, 57, { align: 'center' });
    doc.text("Class", 160, 57, { align: 'center' });
    doc.text("Pantry", 190, 57, { align: 'center' });

    doc.setTextColor(0, 51, 153);
    const pnrStr = bookingResult.pnr || 'N/A';
    doc.text(pnrStr, 35, 62, { align: 'center' });

    const trainName = bookingResult?.trainId?.name || (isHotel ? title.toUpperCase() : (journeyDetails.from ? `${journeyDetails.from.split(' ')[0]} ${isFlight ? 'AIRLINES' : isBus ? 'TRAVELS' : 'EXPRESS'}` : 'KAMRUP EXPRESS'));
    const trainNum = bookingResult?.trainId?.trainNumber || (urlTrainId.startsWith('mock_') ? urlTrainId.substring(urlTrainId.length - 5).toUpperCase() : urlTrainId);
    
    const trainDesc = `${trainNum} / ${trainName}`.toUpperCase();
    doc.text(trainDesc.length > 25 ? trainDesc.substring(0, 23) + '...' : trainDesc, 105, 62, { align: 'center' });

    doc.text(journeyDetails.travelClass || 'SL', 160, 62, { align: 'center' });
    doc.setFontSize(7);
    const pantryText = wantsPantry ? (pantryCategory === 'Veg' ? 'VEG' : 'NON-VEG') : 'N/A';
    doc.text(pantryText, 190, 62, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    doc.setFont("helvetica", "bold");
    doc.text("Quota", 35, 68, { align: 'center' });
    doc.text("Distance", 105, 68, { align: 'center' });
    doc.text("Booking Date", 175, 68, { align: 'center' });

    doc.setFont("helvetica", "normal");
    const quotaStr = journeyDetails.quota ? journeyDetails.quota.toUpperCase() : 'GENERAL (GN)';
    const distanceStr = isHotel ? 'N/A' : `${Math.floor(1200 + Math.random() * 800)} KM`;
    doc.text(isHotel ? 'N/A' : quotaStr, 35, 73, { align: 'center' });
    doc.text(distanceStr, 105, 73, { align: 'center' });
    doc.text(new Date().toLocaleString(), 175, 73, { align: 'center' });

    doc.line(10, 75, 200, 75);

    // Passenger Details Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Passenger Details", 12, 80);

    // Passenger autoTable
    const passCols = ["#", "Name", "Age", "Gender", "Booking Status", "Current Status"];
    const passRows = passengers.map((p: any, idx: number) => {
      let seat = bookingResult.seatNumbers && bookingResult.seatNumbers[idx] ? bookingResult.seatNumbers[idx] : '';
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
      const cStatus = bookingResult.status === 'Confirmed' ? bStatus : (bookingResult.status === 'Verification Pending' ? 'Pending' : bookingResult.status);
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
    doc.text(`Contact Details:     Email: ${contactInfo.email}                 Mobile: ${contactInfo.phone || 'N/A'}`, 12, py + 10);

    // Transaction ID
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Transaction ID: ${bookingResult.bookingId}`, 12, py + 16);
    doc.setFont("helvetica", "normal");
    doc.text("IR recovers only 57% of cost of travel on an average.", 12, py + 20);

    // Payment Details
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Payment Details", 12, py + 26);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    const tPrice = Math.round(totalPrice + (totalPrice * 0.18));
    const baseFare = tPrice / 1.18;
    const tax = tPrice - baseFare;
    doc.text("Ticket Fare", 12, py + 32); doc.text(`Rs. ${baseFare.toFixed(2)}`, 100, py + 32);
    doc.text("IRCTC Convenience Fee (Incl. of GST)", 12, py + 37); doc.text(`Rs. ${tax.toFixed(2)}`, 100, py + 37);
    doc.text("Travel Insurance Premium (Incl. of GST)", 12, py + 42); doc.text("Rs. 1.40", 100, py + 42);
    doc.setFont("helvetica", "bold");
    doc.text("Total Fare (all inclusive)", 12, py + 47); doc.text(`Rs. ${(tPrice + 1.40).toFixed(2)}`, 100, py + 47);

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

    doc.save(`IRCTC_ERS_${bookingResult.pnr || bookingResult.bookingId}.pdf`);
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

  if (!urlTrainId) {
    return (
      <main className="min-h-screen pt-24 pb-12 relative selection:bg-blue-500/30 font-sans bg-[#0a0a0a]">
        <Navbar />
        <div className="fixed inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 scale-105"
            style={{ backgroundImage: `url('${getBackgroundImage()}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/60 to-[#0a0a0a]" />
        </div>
        
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 lg:px-8 mt-10">
          <div className="flex flex-col items-center text-center mb-10">
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-3 drop-shadow-xl">
              Search {title}
            </h1>
            <p className="text-white/80 text-lg max-w-2xl">Find the best available options for your journey.</p>
          </div>
          
          <div className="w-full max-w-4xl mx-auto bg-[#181a20]/90 backdrop-blur-xl border border-[#272a31] rounded-3xl p-6 md:p-8 shadow-2xl">
            <TrainSearch defaultServiceType={title} />
          </div>
        </div>
      </main>
    );
  }

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
            {isHotel ? (
              <>Location: <span className="font-bold text-white">{journeyDetails.from}</span> | Address: <span className="font-bold text-white text-sm">{journeyDetails.to}</span></>
            ) : (
              <>Journey selected: <span className="font-bold text-white">{journeyDetails.from}</span> to <span className="font-bold text-white">{journeyDetails.to}</span></>
            )}
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
                      <div className="md:col-span-4 space-y-2">
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
                      <div className="md:col-span-4 space-y-2">
                        <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">{isHotel ? 'Room Pref' : 'Seat Pref'}</label>
                        {(!isHotel && !isFood) ? (
                          <button 
                            type="button" 
                            onClick={() => setShowSeatMapForPassenger(idx)}
                            className="w-full bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded-xl px-4 py-3 text-blue-300 font-bold transition-colors flex items-center justify-between text-left"
                          >
                            <span className="truncate pr-2 text-[11px] md:text-xs">{p.pref !== 'No Preference' ? p.pref : 'Select Seat'}</span>
                            <span className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded font-black tracking-widest uppercase shadow-md flex-shrink-0">Map</span>
                          </button>
                        ) : (
                          <select value={p.pref} onChange={e => updatePassenger(idx, 'pref', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:ring-2 focus:ring-blue-500/50 appearance-none">
                            {renderPreferences()}
                          </select>
                        )}
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

              {(journeyDetails.quota === 'Student' || journeyDetails.quota === 'Armed Forces') && (
                <div className="mb-10 bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400 border border-indigo-500/30"><ShieldCheck className="w-5 h-5" /></div>
                    <h3 className="text-xl font-bold text-white tracking-wide">ID Verification Required</h3>
                  </div>
                  <p className="text-blue-200/80 mb-6 font-medium">Please upload a valid ID proof for the selected quota ({journeyDetails.quota}). This helps us confirm your special discount.</p>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-indigo-500/30 rounded-2xl cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <span className="text-indigo-400 font-bold text-sm mb-2">{idProofFile ? idProofFile.name : 'Click to upload or drag and drop'}</span>
                      <span className="text-xs text-white/50">SVG, PNG, JPG or PDF (MAX. 5MB)</span>
                    </div>
                    <input type="file" required className="hidden" accept="image/*,.pdf" onChange={e => setIdProofFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              )}

              {(!isHotel && !isFood) && (
                <div className="mb-10 bg-orange-500/10 border border-orange-500/20 p-6 rounded-3xl animate-in fade-in duration-500">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-orange-500/20 p-2 rounded-lg text-orange-400 border border-orange-500/30"><Utensils className="w-5 h-5" /></div>
                    <h3 className="text-xl font-bold text-white tracking-wide">Pantry Car Food Services</h3>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <input type="checkbox" id="pantryCheck" checked={wantsPantry} onChange={(e) => setWantsPantry(e.target.checked)} className="w-5 h-5 accent-orange-500" />
                    <label htmlFor="pantryCheck" className="text-white font-bold cursor-pointer">Yes, I want food from Pantry Car</label>
                  </div>
                  {wantsPantry && (
                    <div className="flex flex-col md:flex-row gap-4 mt-4">
                      <select value={pantryCategory} onChange={(e) => {
                          setPantryCategory(e.target.value);
                          setPantryMeal(e.target.value === 'Veg' ? 'Standard Veg Thali' : 'Standard Non-Veg Thali');
                        }} className="bg-black/40 border border-orange-500/30 rounded-xl px-4 py-3 text-white font-medium focus:ring-2 focus:ring-orange-500/50 outline-none flex-1">
                        <option value="Veg">Vegetarian Menu</option>
                        <option value="Non-Veg">Non-Vegetarian Menu</option>
                      </select>
                      <select value={pantryMeal} onChange={(e) => setPantryMeal(e.target.value)} className="bg-black/40 border border-orange-500/30 rounded-xl px-4 py-3 text-white font-medium focus:ring-2 focus:ring-orange-500/50 outline-none flex-2 w-full md:w-1/2">
                        {currentPantryMenu.map(item => (
                          <option key={item.name} value={item.name}>{item.name} - ₹{item.price}</option>
                        ))}
                      </select>
                      <select value={pantryQuantity} onChange={(e) => setPantryQuantity(Number(e.target.value))} className="bg-black/40 border border-orange-500/30 rounded-xl px-4 py-3 text-white font-medium focus:ring-2 focus:ring-orange-500/50 outline-none flex-1">
                        {[1,2,3,4,5,6].map(q => (
                          <option key={q} value={q}>Qty: {q}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center pt-6 mt-8 border-t border-white/10">
                <button type="button" onClick={() => router.push('/search')} className="text-white/60 hover:text-white px-6 py-3 font-bold transition-colors flex items-center gap-2">
                  Cancel Booking
                </button>
                <button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all flex items-center gap-3 disabled:opacity-70 group shadow-[0_10px_30px_rgba(59,130,246,0.4)] hover:shadow-[0_10px_40px_rgba(59,130,246,0.6)] hover:-translate-y-1">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Review Booking'}
                  {!isLoading && <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: REVIEW */}
          {step === 2 && (
             <div className="animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/10">
                  <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400 border border-blue-500/30"><ShieldCheck className="w-6 h-6" /></div>
                  <h2 className="text-2xl font-bold text-white tracking-wide">Review & Confirm</h2>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 backdrop-blur-xl mb-8">
                  <h3 className="text-lg font-bold text-white/80 uppercase tracking-widest border-b border-white/10 pb-2">Journey Details</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm font-medium">
                     <div><span className="text-gray-500 block">From</span><span className="text-white text-base">{journeyDetails.from || 'N/A'}</span></div>
                     <div><span className="text-gray-500 block">To</span><span className="text-white text-base">{journeyDetails.to || 'N/A'}</span></div>
                     <div><span className="text-gray-500 block">Date</span><span className="text-white text-base">{journeyDetails.date1}</span></div>
                     <div><span className="text-gray-500 block">Class</span><span className="text-white text-base">{journeyDetails.travelClass}</span></div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white/80 uppercase tracking-widest border-b border-white/10 pb-2 mt-8">Passenger Details</h3>
                  <div className="space-y-4">
                     {passengers.map((p, i) => (
                        <div key={i} className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5">
                           <div>
                              <span className="font-bold text-white block">{p.name}</span>
                              <span className="text-gray-400 text-xs">{p.age} Yrs • {p.gender}</span>
                           </div>
                           <div className="text-right">
                              <span className="text-gray-500 text-xs block uppercase">Preference</span>
                              <span className="font-bold text-blue-400">{p.pref || 'None'}</span>
                           </div>
                        </div>
                     ))}
                  </div>

                  <div className="flex justify-between items-center pt-6 mt-8 border-t border-white/10">
                    <div>
                       <span className="text-gray-400 block text-sm">Total Amount to Pay</span>
                       <span className="text-3xl font-black text-emerald-400 font-mono">₹{Math.max(0, Math.round(totalPrice + (totalPrice * 0.18)) - (useWallet ? Math.min(Math.round(totalPrice + (totalPrice * 0.18)), userWalletBalance) : 0)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <button type="button" onClick={() => setStep(1)} className="text-white/60 hover:text-white px-6 py-3 font-bold transition-colors">Edit Details</button>
                  <button type="button" onClick={() => setStep(3)} className="bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all flex items-center gap-3 hover:-translate-y-1 shadow-[0_10px_30px_rgba(16,185,129,0.3)]">
                    Make Payment <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
             </div>
          )}

          {/* STEP 3: PAYMENT */}
          {step === 3 && (
            <form onSubmit={handlePayment} className="animate-in fade-in zoom-in-95 duration-500">
              <div className="flex flex-col lg:flex-row gap-10">
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/10">
                    <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400 border border-emerald-500/30"><CreditCard className="w-6 h-6" /></div>
                    <h2 className="text-2xl font-bold text-white tracking-wide">Secure Checkout</h2>
                  </div>
                  
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 backdrop-blur-xl">
                    {Math.max(0, Math.round(totalPrice + (totalPrice * 0.18)) - (useWallet ? Math.min(Math.round(totalPrice + (totalPrice * 0.18)), userWalletBalance) : 0)) > 0 ? (
                      <>
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
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 space-y-4">
                    <div className="bg-emerald-500/20 p-4 rounded-full border border-emerald-500/30">
                      <Wallet className="w-12 h-12 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-black text-white">Fully Covered by Wallet</h3>
                    <p className="text-emerald-400/80 font-medium text-center max-w-sm">
                      Your IRCTC Wallet balance covers the full amount. No additional payment methods are required. Click Pay to complete booking.
                    </p>
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
                      <div className="flex justify-between text-blue-100/90 text-sm"><span>Base Fare (x{passengers.length})</span><span>₹{passengersFare.toLocaleString()}</span></div>
                      {chartPrepared && (
                        <div className="flex justify-between text-red-400 font-bold text-sm"><span>Late Booking (Chart Prepared)</span><span>+ ₹{(passengersFare * 0.25).toLocaleString()}</span></div>
                      )}
                      {wantsPantry && (
                        <div className="flex justify-between text-orange-400 font-bold text-sm"><span>Pantry Car ({selectedPantryMeal.name} x{pantryQuantity})</span><span>+ ₹{pantryFare.toLocaleString()}</span></div>
                      )}
                      <div className="flex justify-between text-blue-100/90 text-sm"><span>Taxes & Fees (18%)</span><span>₹{Math.round(totalPrice * 0.18).toLocaleString()}</span></div>
                    </div>

                    {userWalletBalance > 0 && (
                      <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" id="walletCheck" checked={useWallet} onChange={e => setUseWallet(e.target.checked)} className="w-5 h-5 accent-emerald-500" />
                          <label htmlFor="walletCheck" className="text-emerald-400 font-bold cursor-pointer">Use IRCTC Wallet</label>
                        </div>
                        <span className="text-emerald-400 font-bold">Bal: ₹{userWalletBalance.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="border-t border-white/30 pt-6 flex flex-col gap-2">
                      {useWallet && (
                         <div className="flex justify-between text-emerald-400 text-sm font-bold mb-2">
                            <span>Wallet Deduction</span>
                            <span>- ₹{Math.min(Math.round(totalPrice + (totalPrice * 0.18)), userWalletBalance).toLocaleString()}</span>
                         </div>
                      )}
                      <span className="text-blue-300 text-[11px] uppercase tracking-widest font-black">Total Amount Payable</span>
                      <span className="text-4xl font-black text-white drop-shadow-md">
                        ₹{Math.max(0, Math.round(totalPrice + (totalPrice * 0.18)) - (useWallet ? Math.min(Math.round(totalPrice + (totalPrice * 0.18)), userWalletBalance) : 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-8 mt-10 border-t border-white/10">
                <button type="button" onClick={() => setStep(2)} className="text-white/60 hover:text-white px-6 py-3 font-bold transition-colors">Back to review</button>
                <button type="submit" disabled={isLoading} className="bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all flex items-center gap-3 disabled:opacity-70 group shadow-[0_10px_30px_rgba(16,185,129,0.4)] hover:shadow-[0_10px_40px_rgba(16,185,129,0.6)] hover:-translate-y-1">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
                  {isLoading ? 'Processing securely...' : `Pay ₹${Math.max(0, Math.round(totalPrice + (totalPrice * 0.18)) - (useWallet ? Math.min(Math.round(totalPrice + (totalPrice * 0.18)), userWalletBalance) : 0)).toLocaleString()}`}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: CONFIRMATION */}
          {step === 4 && (
            <div className="animate-in zoom-in-95 duration-700 flex flex-col items-center text-center py-12">
              <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 border relative ${bookingResult.status === 'Verification Pending' ? 'bg-orange-500/20 border-orange-500/50 shadow-[0_0_50px_rgba(249,115,22,0.4)]' : 'bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.4)]'}`}>
                <div className={`absolute inset-0 rounded-full animate-ping duration-1000 ${bookingResult.status === 'Verification Pending' ? 'bg-orange-400/20' : 'bg-emerald-400/20'}`} />
                {bookingResult.status === 'Verification Pending' ? <Loader2 className="w-16 h-16 text-orange-400 relative z-10 animate-spin" /> : <CheckCircle2 className="w-16 h-16 text-emerald-400 relative z-10" />}
              </div>
              
              <h2 className="text-5xl font-black text-white mb-4 tracking-tight drop-shadow-xl">
                {bookingResult.status === 'Verification Pending' ? 'Verification Pending' : 'Booking Confirmed!'}
              </h2>
              <p className="text-blue-100 max-w-lg mx-auto mb-12 text-xl font-medium drop-shadow-md">
                {bookingResult.status === 'Verification Pending' ? 'Your ticket is temporarily booked. We are verifying your ID proof. Once verified, you will receive the confirmed ticket.' : `Your payment was processed securely. Get ready for an incredible ${title.toLowerCase()} experience.`}
              </p>

              <div className="bg-white/10 border border-white/20 rounded-3xl p-8 w-full max-w-2xl mx-auto mb-12 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
                <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${bookingResult.status === 'Verification Pending' ? 'from-orange-400 to-amber-500' : 'from-emerald-400 to-teal-500'}`} />
                
                <div className="grid grid-cols-2 gap-8 divide-x divide-white/20">
                  <div className="flex flex-col items-center justify-center p-4">
                    <span className="text-white/70 text-[11px] uppercase tracking-widest font-black mb-2">Booking Reference</span>
                    <span className="text-white font-mono font-black text-4xl tracking-wider drop-shadow-md">{bookingResult.bookingId}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4">
                    <span className="text-white/70 text-[11px] uppercase tracking-widest font-black mb-2">{(isHotel || isFood || type.includes('holiday')) ? 'Booking Number' : 'PNR Number'}</span>
                    <span className={`${bookingResult.status === 'Verification Pending' ? 'text-orange-400' : 'text-emerald-400'} font-mono font-black text-4xl tracking-wider drop-shadow-md`}>{bookingResult.pnr}</span>
                  </div>
                </div>
              </div>

              {bookingResult.status === 'Verification Pending' ? (
                <div className="text-white/60 font-medium text-lg mt-4 bg-black/40 px-6 py-4 rounded-xl backdrop-blur-md border border-white/10 animate-pulse">
                  Please wait while our system verifies your document... (Simulated 15s delay)
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row gap-4 mt-8">
                    <button 
                      onClick={generatePDF}
                      className="bg-white text-black hover:bg-gray-100 px-8 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-3 group text-lg shadow-[0_10px_40px_rgba(255,255,255,0.3)] hover:-translate-y-1"
                    >
                      Download E-Ticket
                      <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                    </button>
                    <button 
                      onClick={() => router.push('/dashboard?tab=profile')}
                      className="bg-black/50 text-white hover:bg-black/70 px-8 py-4 rounded-2xl font-black transition-all border border-white/20 backdrop-blur-md flex items-center justify-center text-lg"
                    >
                      Go to Profile
                    </button>
                  </div>

                  {/* Leave a Review Section for Hotels, Retiring Rooms, and E-Catering */}
                  {(isHotel || type === 'retiring-room' || isFood) && !reviewSubmitted && (
                    <div className="bg-black/40 border border-white/10 rounded-3xl p-8 mt-8 w-full max-w-2xl mx-auto backdrop-blur-xl">
                      <h3 className="text-xl font-bold text-white mb-4">How was your booking experience?</h3>
                      <div className="flex gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            onClick={() => setReviewRating(star)}
                            className={`w-8 h-8 cursor-pointer transition-colors ${reviewRating >= star ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} 
                          />
                        ))}
                      </div>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your thoughts about this place..."
                        className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white placeholder:text-white/30 outline-none focus:border-blue-500 transition-colors mb-4 resize-none h-24"
                      ></textarea>
                      <button
                        onClick={submitReview}
                        disabled={isSubmittingReview || !reviewComment.trim()}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg w-full sm:w-auto"
                      >
                        {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </div>
                  )}

                  {reviewSubmitted && (
                    <div className="bg-green-500/20 border border-green-500/30 text-green-400 rounded-3xl p-6 mt-8 w-full max-w-2xl mx-auto text-center font-bold">
                      Thank you! Your review has been posted successfully.
                    </div>
                  )}

                  {showReturnPrompt && journeyDetails.to && (
                    <div className="bg-gradient-to-br from-indigo-900/60 to-purple-900/60 border border-indigo-500/40 rounded-3xl p-8 mt-12 w-full max-w-2xl mx-auto shadow-[0_15px_40px_rgba(79,70,229,0.3)] backdrop-blur-2xl animate-in slide-in-from-bottom-8 duration-700">
                      <div className="flex flex-col items-center text-center">
                        <div className="bg-indigo-500/20 p-3 rounded-full mb-4">
                          <ArrowRightLeft className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2 tracking-wide">{(isHotel || isFood || type.toLowerCase().includes('holiday') || type.toLowerCase().includes('tourist') || type.toLowerCase().includes('charter') || type.toLowerCase().includes('hill')) ? 'Book Your Next Journey?' : 'Book Your Return Journey?'}</h3>
                        <p className="text-indigo-200 text-lg mb-8 max-w-md">
                          {(isHotel || isFood || type.toLowerCase().includes('holiday') || type.toLowerCase().includes('tourist') || type.toLowerCase().includes('charter') || type.toLowerCase().includes('hill')) ? 
                            'Planning your next move? Book your onward journey ticket now to secure the best seats.' : 
                            `Planning to head back? Book your return ticket from ${journeyDetails.to} to ${journeyDetails.from} now to secure the best seats.`
                          }
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                          <button 
                            onClick={() => {
                              router.push(`/search?source=${encodeURIComponent(journeyDetails.to)}&destination=${encodeURIComponent(journeyDetails.from)}&type=${encodeURIComponent(title)}`);
                            }} 
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/50 hover:-translate-y-1"
                          >
                            {(isHotel || isFood || type.toLowerCase().includes('holiday') || type.toLowerCase().includes('tourist') || type.toLowerCase().includes('charter') || type.toLowerCase().includes('hill')) ? 'Book Next Journey' : 'Book Return Ticket'}
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
                </>
              )}
            </div>
          )}


          {/* SEAT MAP MODAL */}
          {showSeatMapForPassenger !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-[#1a1c23] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Select Seat for {passengers[showSeatMapForPassenger].name || `Passenger ${showSeatMapForPassenger + 1}`}</h3>
                  <button onClick={() => setShowSeatMapForPassenger(null)} className="text-white/50 hover:text-white p-2">✕</button>
                </div>

                {(!isFlight && !isBus && !isHotel && !isFood) && (
                  <div className="flex gap-4 justify-center mb-4 border-b border-white/10 pb-4">
                     <label className="text-white/60 text-sm font-bold uppercase tracking-widest mt-2">Coach:</label>
                     <select value={selectedCoach} onChange={(e) => setSelectedCoach(e.target.value)} className="bg-black/40 border border-white/20 rounded-lg px-3 py-1 text-white font-medium outline-none">
                       {Array.from({length: 6}).map((_, i) => {
                         const prefix = journeyDetails.travelClass.includes('1A') ? 'H' : 
                                        journeyDetails.travelClass.includes('2A') ? 'A' : 
                                        journeyDetails.travelClass.includes('3A') ? 'B' : 
                                        journeyDetails.travelClass.includes('EC') ? 'E' : 
                                        journeyDetails.travelClass.includes('CC') ? 'C' : 'S';
                         return <option key={i} value={`${prefix}${i+1}`}>{prefix}{i+1}</option>;
                       })}
                     </select>
                  </div>
                )}
                
                <div className="flex gap-4 justify-center mb-6 text-xs font-bold uppercase tracking-widest text-white/60">
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-600/20 border border-blue-500/50"></div> Window (+10%)</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-white/5 border border-white/20"></div> Middle (-5%)</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-white/10 border border-white/30"></div> Aisle</div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar overscroll-contain space-y-4 pb-4">
                  {(() => {
                    let seatRows = 12;
                    let seatLeft = ['A', 'B', 'C'];
                    let seatRight = ['D', 'E', 'F'];
                    
                    if (isFlight) {
                      if (journeyDetails.travelClass === 'First Class') {
                        seatRows = 4; seatLeft = ['A']; seatRight = ['F'];
                      } else if (journeyDetails.travelClass === 'Business') {
                        seatRows = 6; seatLeft = ['A', 'C']; seatRight = ['D', 'F'];
                      }
                    } else if (isBus) {
                      if (journeyDetails.travelClass.includes('Sleeper')) {
                        seatRows = 8; seatLeft = ['A', 'B']; seatRight = ['C'];
                      } else {
                        seatRows = 10; seatLeft = ['A', 'B']; seatRight = ['C', 'D'];
                      }
                    } else if (!isHotel && !isFood) {
                       if (journeyDetails.travelClass.includes('EC')) {
                         seatRows = 10; seatLeft = ['A', 'B']; seatRight = ['C', 'D'];
                       } else if (journeyDetails.travelClass.includes('CC') || journeyDetails.travelClass.includes('2S')) {
                         seatRows = 15; seatLeft = ['A', 'B', 'C']; seatRight = ['D', 'E'];
                       } else if (journeyDetails.travelClass.includes('1A')) {
                         seatRows = 10; 
                         seatLeft = ['U1', 'L1']; 
                         seatRight = [];
                       } else if (journeyDetails.travelClass.includes('2A')) {
                         seatRows = 10; 
                         seatLeft = ['SU', 'SL']; 
                         seatRight = ['L1', 'U1', 'L2', 'U2'];
                       } else {
                         seatRows = 10; 
                         seatLeft = ['SU', 'SL']; 
                         seatRight = ['L1', 'M1', 'U1', 'L2', 'M2', 'U2'];
                       }
                    }

                    return Array.from({ length: seatRows }).map((_, rowIdx) => (
                      <div key={rowIdx} className="flex justify-between items-center gap-2">
                        <div className="w-6 text-center text-white/30 text-xs font-bold">{rowIdx + 1}</div>
                        <div className="flex flex-col gap-2">
                          {seatLeft.map(col => {
                            let displayCol = col;
                            let seatId = `${rowIdx + 1}${col}`;
                            
                            if (journeyDetails.travelClass.includes('1A')) {
                               const base = rowIdx * 2;
                               if (col === 'L1') seatId = (base + 1).toString();
                               displayCol = `${seatId} ${col.replace(/[0-9]/g, '')}`;
                            } else if (journeyDetails.travelClass.includes('2A')) {
                               const base = rowIdx * 6;
                               if (col === 'SL') seatId = (base + 5).toString();
                               if (col === 'SU') seatId = (base + 6).toString();
                               displayCol = `${seatId} ${col.replace(/[0-9]/g, '')}`;
                            } else if (['SL', '3A'].some(cls => journeyDetails.travelClass.includes(cls))) {
                               const base = rowIdx * 8;
                               if (col === 'SL') seatId = (base + 7).toString();
                               if (col === 'SU') seatId = (base + 8).toString();
                               displayCol = `${seatId} ${col.replace(/[0-9]/g, '')}`;
                            }

                            const isBlocked = bookedSeats.has(seatId);
                            const isWindow = col === 'A' || col === 'SL' || col === 'L1';
                            const isMiddle = col === 'B' && !isBus;
                            const seatType = isWindow ? 'Window Seat' : isMiddle ? 'Middle Seat' : 'Aisle/Berth';
                            
                            const trainPrefStr = `${selectedCoach}/${seatId}/${seatType.replace(' Seat', '').toUpperCase()}`;
                            const isSelected = (!isFlight && !isBus && !isHotel && !isFood) 
                               ? passengers[showSeatMapForPassenger].pref === trainPrefStr 
                               : passengers[showSeatMapForPassenger].pref === `${seatId} (${seatType})`;

                            return (
                              <button 
                                key={col}
                                disabled={isBlocked}
                                onClick={() => {
                                  const newPref = (!isFlight && !isBus && !isHotel && !isFood) ? trainPrefStr : `${seatId} (${seatType})`;
                                  updatePassenger(showSeatMapForPassenger, 'pref', newPref);
                                  setShowSeatMapForPassenger(null);
                                }}
                                className={`w-11 h-11 rounded-lg font-bold text-[10px] sm:text-[11px] flex items-center justify-center transition-all ${
                                  isBlocked ? 'bg-red-500/10 text-red-500/50 border border-red-500/20 cursor-not-allowed' :
                                  isSelected ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 border-emerald-400' :
                                  isWindow ? 'bg-blue-600/20 text-blue-300 border border-blue-500/50 hover:bg-blue-600/40' :
                                  isMiddle ? 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/20' :
                                  'bg-white/10 text-white/80 border border-white/20 hover:bg-white/30'
                                }`}
                              >
                                {isBlocked ? <Lock className="w-4 h-4" /> : displayCol}
                              </button>
                            );
                          })}
                        </div>
                        <div className="w-4"></div>
                        <div className={`grid gap-2 ${seatRight.length > 3 ? (seatRight.length === 6 ? 'grid-cols-3' : 'grid-cols-2') : 'flex'}`}>
                          {seatRight.map(col => {
                            let displayCol = col;
                            let seatId = `${rowIdx + 1}${col}`;
                            
                            if (journeyDetails.travelClass.includes('1A')) {
                               const base = rowIdx * 2;
                               if (col === 'U1') seatId = (base + 2).toString();
                               displayCol = `${seatId} ${col.replace(/[0-9]/g, '')}`;
                            } else if (journeyDetails.travelClass.includes('2A')) {
                               const base = rowIdx * 6;
                               if (col === 'L1') seatId = (base + 1).toString();
                               if (col === 'U1') seatId = (base + 2).toString();
                               if (col === 'L2') seatId = (base + 3).toString();
                               if (col === 'U2') seatId = (base + 4).toString();
                               displayCol = `${seatId} ${col.replace(/[0-9]/g, '')}`;
                            } else if (['SL', '3A'].some(cls => journeyDetails.travelClass.includes(cls))) {
                               const base = rowIdx * 8;
                               if (col === 'L1') seatId = (base + 1).toString();
                               if (col === 'M1') seatId = (base + 2).toString();
                               if (col === 'U1') seatId = (base + 3).toString();
                               if (col === 'L2') seatId = (base + 4).toString();
                               if (col === 'M2') seatId = (base + 5).toString();
                               if (col === 'U2') seatId = (base + 6).toString();
                               displayCol = `${seatId} ${col.replace(/[0-9]/g, '')}`;
                            }

                            const isBlocked = bookedSeats.has(seatId);
                            const isWindow = col === 'F' || (isBus && col === 'D') || (isBus && col === 'C' && seatRight.length === 1) || col === 'SU' || col === 'L2';
                            const isMiddle = col === 'E';
                            const seatType = isWindow ? 'Window Seat' : isMiddle ? 'Middle Seat' : 'Aisle/Berth';
                            
                            const trainPrefStr = `${selectedCoach}/${seatId}/${seatType.replace(' Seat', '').toUpperCase()}`;
                            const isSelected = (!isFlight && !isBus && !isHotel && !isFood) 
                               ? passengers[showSeatMapForPassenger].pref === trainPrefStr 
                               : passengers[showSeatMapForPassenger].pref === `${seatId} (${seatType})`;

                            return (
                              <button 
                                key={col}
                                disabled={isBlocked}
                                onClick={() => {
                                  const newPref = (!isFlight && !isBus && !isHotel && !isFood) ? trainPrefStr : `${seatId} (${seatType})`;
                                  updatePassenger(showSeatMapForPassenger, 'pref', newPref);
                                  setShowSeatMapForPassenger(null);
                                }}
                                className={`w-11 h-11 rounded-lg font-bold text-[10px] sm:text-[11px] flex items-center justify-center transition-all ${
                                  isBlocked ? 'bg-red-500/10 text-red-500/50 border border-red-500/20 cursor-not-allowed' :
                                  isSelected ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 border-emerald-400' :
                                  isWindow ? 'bg-blue-600/20 text-blue-300 border border-blue-500/50 hover:bg-blue-600/40' :
                                  isMiddle ? 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/20' :
                                  'bg-white/10 text-white/80 border border-white/20 hover:bg-white/30'
                                }`}
                              >
                                {isBlocked ? <Lock className="w-4 h-4" /> : displayCol}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {showVerificationModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#1a1c23] border border-yellow-500/30 p-8 rounded-3xl text-center shadow-[0_0_50px_rgba(234,179,8,0.2)] max-w-md w-[90%] animate-in zoom-in-90 duration-300">
             <ShieldCheck className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
             <h3 className="text-2xl font-bold text-white mb-2">Verification Pending</h3>
             <p className="text-yellow-200/80 mb-6">Your ticket is temporarily booked. Please wait while we verify your ID proof.</p>
             <button onClick={() => setShowVerificationModal(false)} className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-3 rounded-xl font-bold transition-colors">Got it</button>
          </div>
        </div>
      )}
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
