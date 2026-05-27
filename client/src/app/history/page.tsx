'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { Calendar, Train, Plane, Hotel, Ticket, XCircle, CheckCircle2, Clock, Loader2, Home, ChevronDown, ChevronUp, Download, Users, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function BookingHistory() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [cancelModal, setCancelModal] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchHistory();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const token = Cookies.get('token');
      if (token) {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` }});
        setUser(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch user', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        router.push('/login');
        return;
      }
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Sort by date descending
      const sorted = res.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBookings(sorted);
    } catch (err) {
      toast.error('Failed to load booking history.');
    } finally {
      setIsLoading(false);
    }
  };

  const executeCancel = async (id: string) => {
    setIsCancelling(true);
    try {
      const token = Cookies.get('token');
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Ticket cancelled successfully. Refund initiated to wallet.');
      setCancelModal(null);
      fetchHistory(); // Refresh
    } catch (err) {
      toast.error('Failed to cancel ticket.');
    } finally {
      setIsCancelling(false);
    }
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'Train': return <Train className="w-6 h-6 text-indigo-400" />;
      case 'Flight': return <Plane className="w-6 h-6 text-sky-400" />;
      case 'Hotel': return <Hotel className="w-6 h-6 text-amber-400" />;
      default: return <Ticket className="w-6 h-6 text-emerald-400" />;
    }
  };

  const downloadTicket = async (booking: any) => {
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

    const tPrice = booking.totalPrice;
    const isFlight = booking.serviceType === 'Flight';
    const isBus = booking.serviceType === 'Bus';
    const isHotel = booking.serviceType === 'Hotel' || booking.serviceType === 'Hotels' || booking.serviceType.toLowerCase().includes('retiring');
    const isFood = booking.serviceType === 'Food' || booking.serviceType === 'E Catering';
    const isSpecialService = isHotel || isFood || booking.serviceType.toLowerCase().includes('holiday') || booking.serviceType.toLowerCase().includes('retiring');

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
      const dest = booking.to || booking.from || 'N/A';
      doc.text(dest.toUpperCase(), 35, 42, { align: 'center' });
      doc.text(dest.toUpperCase(), 105, 42, { align: 'center' });
      doc.text(dest.toUpperCase(), 175, 42, { align: 'center' });

      // Date / Time
      const dateStr = booking.journeyDate ? booking.journeyDate.split('T')[0] : new Date(booking.createdAt).toISOString().split('T')[0];
      const timeStr = booking.departureTime || '12:00';
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
      doc.text(booking._id.substring(0, 8).toUpperCase(), 35, 62, { align: 'center' });

      const serviceName = booking.serviceId?.name || booking.trainId?.name || booking.serviceType.toUpperCase();
      doc.text(serviceName.length > 25 ? serviceName.substring(0, 23) + '...' : serviceName, 105, 62, { align: 'center' });

      doc.text(booking.serviceClass || 'Standard', 160, 62, { align: 'center' });
      doc.setFontSize(8);
      doc.text(new Date(booking.createdAt).toLocaleDateString(), 190, 62, { align: 'center' });
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);

      doc.line(10, 66, 200, 66);

      // Passenger / Guest Details Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(isFood ? "Order/Customer Details" : "Guest Details", 12, 71);

      // autoTable
      const passCols = ["#", "Name", "Age", "Gender", "Status"];
      const passRows = booking.passengers?.map((p: any, idx: number) => {
        return [(idx + 1).toString(), p.name.toUpperCase(), p.age.toString(), p.gender.charAt(0).toUpperCase(), 'CONFIRMED'];
      }) || [];

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
      const cEmail = booking.contactInfo?.email || user?.email || 'N/A';
      const cPhone = booking.contactInfo?.phone || user?.phone || 'N/A';
      doc.text(`Contact Details:     Email: ${cEmail}                 Mobile: ${cPhone}`, 12, py + 8);

      // Payment Details
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Payment Details", 12, py + 16);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");

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
      if (isHotel) {
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
      doc.text(`VOUCHER GENERATED BY: IRCTC 2.0 PORTAL  |  ISSUED ON: ${new Date(booking.createdAt).toLocaleString()}  |  IP: SECURED`, 12, py + 160);

      doc.save(`IRCTC_VOUCHER_${booking._id.substring(0, 8).toUpperCase()}.pdf`);
      toast.success('Booking Voucher downloaded successfully!');
      return;
    }

    // ORIGINAL PDF LOGIC FOR TRAINS, FLIGHTS, BUSES
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
    const source = booking.from || 'HOWRAH JN (HWH)';
    const dest = booking.to || 'NEW DELHI (NDLS)';
    doc.text(source.toUpperCase(), 35, 42, { align: 'center' });
    doc.text(source.toUpperCase(), 105, 42, { align: 'center' });
    doc.text(dest.toUpperCase(), 175, 42, { align: 'center' });

    // Date / Time
    const dateStr = booking.journeyDate ? booking.journeyDate.split('T')[0] : new Date(booking.createdAt).toISOString().split('T')[0];
    const timeStr = booking.departureTime || '18:30';
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
    const serviceNameHeader = isHotel ? "Hotel Name" : `${booking.serviceType} No./Name`;
    doc.text(serviceNameHeader, 105, 57, { align: 'center' });
    doc.text("Class", 160, 57, { align: 'center' });
    doc.text("Pantry", 190, 57, { align: 'center' });

    doc.setTextColor(0, 51, 153);
    const pnrStr = booking.pnr || 'N/A';
    doc.text(pnrStr, 35, 62, { align: 'center' });

    const trainName = booking.trainId?.name || (booking.from ? `${booking.from.split(' ')[0]} ${isFlight ? 'AIRLINES' : isBus ? 'TRAVELS' : 'EXPRESS'}` : 'KAMRUP EXPRESS');
    const trainNum = booking.trainId?.trainNumber || booking.trainId?._id?.substring(0, 5).toUpperCase() || 'MOCK';
    
    const trainDesc = `${trainNum} / ${trainName}`.toUpperCase();
    doc.text(trainDesc, 105, 62, { align: 'center' });

    doc.text(booking.serviceClass || 'SL', 160, 62, { align: 'center' });
    doc.setFontSize(7);
    const wantsPantry = !!booking.pantryItems?.meal;
    const pantryText = wantsPantry ? 'YES' : 'N/A';
    doc.text(pantryText, 190, 62, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    doc.setFont("helvetica", "bold");
    doc.text("Quota", 35, 68, { align: 'center' });
    doc.text("Distance", 105, 68, { align: 'center' });
    doc.text("Booking Date", 175, 68, { align: 'center' });

    doc.setFont("helvetica", "normal");
    const quotaStr = booking.quota ? booking.quota.toUpperCase() : 'GENERAL (GN)';
    const distanceStr = isHotel ? 'N/A' : (booking.distance ? `${booking.distance} KM` : `${booking.trainId?.distance || 1200} KM`);
    doc.text(isHotel ? 'N/A' : quotaStr, 35, 73, { align: 'center' });
    doc.text(distanceStr, 105, 73, { align: 'center' });
    doc.text(new Date(booking.createdAt).toLocaleString(), 175, 73, { align: 'center' });

    doc.line(10, 75, 200, 75);

    // Passenger Details Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Passenger Details", 12, 80);

    // Passenger autoTable
    const passCols = ["#", "Name", "Age", "Gender", "Booking Status", "Current Status"];
    const passRows = booking.passengers?.map((p: any, idx: number) => {
      let seat = booking.seatNumbers && booking.seatNumbers[idx] ? booking.seatNumbers[idx] : '';
      if (!seat) {
         if (isFlight) seat = `${idx + 1}A (WINDOW)`;
         else if (isBus) seat = `${idx + 1}W (WINDOW)`;
         else seat = `S6/${60 + idx}/MIDDLE`;
      } else {
         if (isFlight || isBus) {
             const parts = seat.split('/');
             seat = parts[parts.length - 1];
         }
      }
      const bStatus = `CNF / ${seat}`;
      const cStatus = booking.status === 'Confirmed' ? bStatus : (booking.status === 'Verification Pending' ? 'Pending' : booking.status);
      return [(idx + 1).toString(), p.name.toUpperCase(), p.age.toString(), p.gender.charAt(0).toUpperCase(), bStatus, cStatus];
    }) || [];

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
    const contactEmail = booking.contactInfo?.email || user?.email || 'N/A';
    const contactPhone = booking.contactInfo?.phone || user?.phone || 'N/A';
    doc.text(`Contact Details:     Email: ${contactEmail}                 Mobile: ${contactPhone}`, 12, py + 10);

    // Transaction ID
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Transaction ID: ${booking.bookingRef || booking._id}`, 12, py + 16);
    doc.setFont("helvetica", "normal");
    doc.text("IR recovers only 57% of cost of travel on an average.", 12, py + 20);

    // Payment Details
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Payment Details", 12, py + 26);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    const baseFareAmt = tPrice / 1.18;
    const taxAmt = tPrice - baseFareAmt;
    doc.text("Ticket Fare", 12, py + 32); doc.text(`Rs. ${baseFareAmt.toFixed(2)}`, 100, py + 32);
    doc.text("IRCTC Convenience Fee (Incl. of GST)", 12, py + 37); doc.text(`Rs. ${taxAmt.toFixed(2)}`, 100, py + 37);
    doc.text("Travel Insurance Premium (Incl. of GST)", 12, py + 42); doc.text("Rs. 1.40", 100, py + 42);
    doc.setFont("helvetica", "bold");
    doc.text("Total Fare (all inclusive)", 12, py + 47); doc.text(`Rs. ${(tPrice + 1.40).toFixed(2)}`, 100, py + 47);

    // QR Code simulation block
    doc.setFillColor(0, 0, 0);
    const qrSize = 35;
    const pxVal = 150;
    const pyVal = py + 14;

    // Position markers (3 corners)
    doc.rect(pxVal, pyVal, 7, 7, 'F'); doc.setFillColor(255, 255, 255); doc.rect(pxVal + 1, pyVal + 1, 5, 5, 'F'); doc.setFillColor(0, 0, 0); doc.rect(pxVal + 2, pyVal + 2, 3, 3, 'F');
    doc.rect(pxVal + qrSize - 7, pyVal, 7, 7, 'F'); doc.setFillColor(255, 255, 255); doc.rect(pxVal + qrSize - 6, pyVal + 1, 5, 5, 'F'); doc.setFillColor(0, 0, 0); doc.rect(pxVal + qrSize - 5, pyVal + 2, 3, 3, 'F');
    doc.rect(pxVal, pyVal + qrSize - 7, 7, 7, 'F'); doc.setFillColor(255, 255, 255); doc.rect(pxVal + 1, pyVal + qrSize - 6, 5, 5, 'F'); doc.setFillColor(0, 0, 0); doc.rect(pxVal + 2, pyVal + qrSize - 5, 3, 3, 'F');

    // Fill random squares
    for (let x = 0; x < qrSize; x += 1.5) {
      for (let y = 0; y < qrSize; y += 1.5) {
        if ((x < 8 && y < 8) || (x > qrSize - 8 && y < 8) || (x < 8 && y > qrSize - 8)) continue;
        if (Math.random() > 0.5) doc.rect(pxVal + x, pyVal + y, 1.5, 1.5, 'F');
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
    doc.text(`TICKET GENERATED BY: IRCTC 2.0 PORTAL  |  ISSUED ON: ${new Date(booking.createdAt).toLocaleString()}  |  IP: SECURED`, 12, py + 140);

    doc.save(`IRCTC_ERS_${booking.pnr || booking._id.substring(0, 8).toUpperCase()}.pdf`);
    toast.success('Official E-Ticket downloaded successfully!');
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white pt-24 pb-12 px-4 selection:bg-purple-500/30">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/30">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Booking History</h1>
              <p className="text-gray-400 text-sm">View your past and upcoming journeys (3 Months)</p>
            </div>
          </div>
          <button 
            onClick={() => router.push('/')} 
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl transition-all border border-white/10 font-bold text-sm shadow-lg hover:-translate-y-0.5"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-[#111] border border-white/10 rounded-2xl p-12 text-center">
            <Ticket className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No Bookings Found</h2>
            <p className="text-gray-400 mb-6">You haven't made any bookings in the last 3 months.</p>
            <button onClick={() => router.push('/')} className="btn-primary">Plan a Trip</button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden transition-all hover:border-white/20">
                <div 
                  className="p-6 flex flex-col md:flex-row justify-between gap-6 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedBooking(expandedBooking === booking._id ? null : booking._id)}
                >
                  
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                      {getServiceIcon(booking.serviceType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold">
                          {booking.serviceId?.name || booking.trainId?.name || 'IRCTC Service'}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          booking.status === 'Confirmed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          booking.status === 'Cancelled' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">
                        {booking.serviceType} • Class: {booking.serviceClass} • PNR: <span className="font-mono text-white">{booking.pnr || 'N/A'}</span>
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                        <Calendar className="w-3 h-3" /> Booked on: {new Date(booking.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end justify-between border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                    <div className="mb-4 md:text-right">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Amount</p>
                      <p className="text-2xl font-mono font-bold text-white">₹{booking.totalPrice.toLocaleString()}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                      {expandedBooking === booking._id ? (
                        <><ChevronUp className="w-4 h-4" /> Hide Details</>
                      ) : (
                        <><ChevronDown className="w-4 h-4" /> View Details</>
                      )}
                    </div>
                  </div>
                </div>

                {/* EXPANDED DETAILS */}
                {expandedBooking === booking._id && (
                  <div className="border-t border-white/10 p-6 bg-black/40 animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-sm uppercase tracking-widest text-gray-500 font-bold mb-4 flex items-center gap-2">
                          <MapPin className="w-4 h-4" /> Journey Information
                        </h4>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Boarding Station</span>
                            <span className="font-bold">{booking.from || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Destination Station</span>
                            <span className="font-bold">{booking.to || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Date</span>
                            <span className="font-bold">{new Date(booking.journeyDate || booking.createdAt).toLocaleDateString()}</span>
                          </div>
                          {booking.departureTime && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Time</span>
                              <span className="font-bold">{booking.departureTime}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm uppercase tracking-widest text-gray-500 font-bold mb-4 flex items-center gap-2">
                          <Users className="w-4 h-4" /> Passenger Details
                        </h4>
                        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-white/5 text-gray-400 font-medium">
                              <tr>
                                <th className="px-4 py-2">Name</th>
                                <th className="px-4 py-2">Age</th>
                                <th className="px-4 py-2">Gender</th>
                                <th className="px-4 py-2">Preference</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                              {booking.passengers?.map((p: any, idx: number) => (
                                <tr key={idx} className="hover:bg-white/5 transition-colors">
                                  <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                                  <td className="px-4 py-3 text-gray-300">{p.age}</td>
                                  <td className="px-4 py-3 text-gray-300">{p.gender}</td>
                                  <td className="px-4 py-3 text-gray-300">{p.seatPreference || 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-4 items-center justify-end border-t border-white/10 pt-6">
                      <button 
                        onClick={(e) => { e.stopPropagation(); downloadTicket(booking); }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors"
                      >
                        <Download className="w-4 h-4" /> Download Ticket
                      </button>
                      
                      {booking.status === 'Confirmed' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setCancelModal(booking._id); }}
                          className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl font-bold transition-colors"
                        >
                          <XCircle className="w-4 h-4" /> Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-center mb-2">Cancel Ticket?</h3>
            <p className="text-gray-400 text-center mb-6">
              Are you sure you want to cancel this booking? This action cannot be undone. Applicable refunds will be instantly credited to your IRCTC Wallet.
            </p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setCancelModal(null)}
                disabled={isCancelling}
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors border border-white/10"
              >
                Keep Ticket
              </button>
              <button 
                onClick={() => executeCancel(cancelModal)}
                disabled={isCancelling}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors flex justify-center items-center gap-2"
              >
                {isCancelling ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
