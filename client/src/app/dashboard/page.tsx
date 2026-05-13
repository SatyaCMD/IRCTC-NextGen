'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter, useSearchParams } from 'next/navigation';
import { Ticket, LogOut, Download, User as UserIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'profile' ? 'profile' : 'history';
  const [activeTab, setActiveTab] = useState<'history' | 'profile'>(initialTab);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Get user Profile
    axios.get('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setUser(res.data)).catch(() => router.push('/login'));

    // Get Booking History
    axios.get('http://localhost:5000/api/bookings/history', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setHistory(res.data)).catch(console.error);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/');
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
    doc.text(trainDesc.length > 25 ? trainDesc.substring(0, 23) + '...' : trainDesc, 105, 62, { align: 'center' });

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
    doc.text(`Contact Details:     Email: ${user.email}                 Mobile: ${user.phone || 'N/A'}`, 12, py + 10);

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
              <button onClick={handleLogout} className="w-full flex items-center px-5 py-3.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-bold group">
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
                          {isConfirmed && (
                            <button
                              onClick={() => downloadTicket(booking)}
                              className="flex items-center justify-center w-full md:w-auto text-sm bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-[0_5px_15px_rgba(37,99,235,0.3)] hover:shadow-[0_5px_20px_rgba(37,99,235,0.5)] hover:-translate-y-0.5"
                            >
                              <Download className="w-4 h-4 mr-2" /> Download Ticket
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
            <div className="bg-[#111318] rounded-3xl p-8 border border-white/5 shadow-2xl">
              <h2 className="text-3xl font-black text-white tracking-tight mb-8">Personal Information</h2>

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
                    <div className="bg-black/50 border border-white/10 rounded-xl p-4 text-white font-medium text-lg">
                      {user.email}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 block">Mobile Number</label>
                    <div className="bg-black/50 border border-white/10 rounded-xl p-4 text-gray-400 font-medium text-lg flex justify-between items-center">
                      <span>{user.phone || '+91 - Not Linked'}</span>
                      {!user.phone && <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-bold cursor-pointer hover:bg-blue-500/30">Link Now</span>}
                    </div>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 block">Aadhaar / KYC</label>
                    <div className="bg-black/50 border border-white/10 rounded-xl p-4 text-gray-400 font-medium text-lg flex justify-between items-center">
                      <span>{user.aadhaar || 'Unverified'}</span>
                      {!user.aadhaar && <span className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full font-bold cursor-pointer hover:bg-amber-500/30">Verify KYC</span>}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 block">Date of Birth</label>
                    <div className="bg-black/50 border border-white/10 rounded-xl p-4 text-gray-400 font-medium text-lg">
                      {user.dob || 'DD/MM/YYYY'}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 block">Gender</label>
                    <div className="bg-black/50 border border-white/10 rounded-xl p-4 text-gray-400 font-medium text-lg">
                      {user.gender || 'Not Specified'}
                    </div>
                  </div>
                </div>

                {/* Column 3 */}
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 block">Address</label>
                    <div className="bg-black/50 border border-white/10 rounded-xl p-4 text-gray-400 font-medium text-lg">
                      {user.address || 'No Address Added'}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 block">State & Pincode</label>
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

              <div className="mt-12 pt-8 border-t border-white/10 flex justify-end">
                <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-[0_5px_15px_rgba(37,99,235,0.3)] hover:shadow-[0_5px_20px_rgba(37,99,235,0.5)] hover:-translate-y-0.5">
                  Edit Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
