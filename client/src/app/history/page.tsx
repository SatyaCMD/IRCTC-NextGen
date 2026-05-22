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

  const downloadTicket = (booking: any) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    const isSpecialService = booking.serviceType === 'Hotel' || booking.serviceType === 'Food' || booking.serviceType.includes('Holiday');
    
    doc.text(isSpecialService ? 'Booking Confirmation Voucher' : 'Electronic Reservation Slip (ERS)', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Booking Reference: ${booking._id.substring(0, 8).toUpperCase()}`, 105, 22, { align: 'center' });
    
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(10, 28, 200, 28);
    
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(isSpecialService ? "Service Info" : "Journey Info", 15, 35);
    doc.setFont("helvetica", "normal");
    
    const serviceName = booking.serviceId?.name || booking.trainId?.name || 'IRCTC Service';
    doc.text(`Service: ${serviceName} (${booking.serviceType})`, 15, 42);
    if (!isSpecialService) {
      doc.text(`From: ${booking.from || 'N/A'}`, 15, 48);
      doc.text(`To: ${booking.to || 'N/A'}`, 105, 48);
      doc.text(`Date: ${new Date(booking.journeyDate || booking.createdAt).toLocaleDateString()}`, 15, 54);
    } else {
      doc.text(`Location: ${booking.to || booking.from || 'N/A'}`, 15, 48);
      doc.text(`Date: ${new Date(booking.journeyDate || booking.createdAt).toLocaleDateString()}`, 15, 54);
    }
    
    doc.text(`Class: ${booking.serviceClass}`, 105, 54);
    doc.text(`Status: ${booking.status.toUpperCase()}`, 15, 60);
    doc.text(`PNR/Booking ID: ${booking.pnr || 'N/A'}`, 105, 60);

    doc.setFont("helvetica", "bold");
    doc.text(isSpecialService ? "Guest Details" : "Passenger Details", 15, 75);
    
    const passRows = booking.passengers?.map((p: any, idx: number) => [
      (idx + 1).toString(),
      p.name.toUpperCase(),
      p.age.toString(),
      p.gender.charAt(0).toUpperCase(),
      p.seatPreference || 'No Preference'
    ]) || [];

    autoTable(doc, {
      startY: 80,
      head: [['#', 'Name', 'Age', 'Gender', 'Preference']],
      body: passRows,
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40] }
    });

    const py = (doc as any).lastAutoTable?.finalY || 100;
    
    let offsetY = py + 15;
    
    if (user && user.accountType === 'Employee') {
       doc.setFontSize(9);
       doc.setFont("helvetica", "bold");
       doc.setTextColor(0, 51, 153);
       doc.text(`Employee Booking: ID [${user.employeeId || 'N/A'}] - Status: ${user.isEmployeeVerified ? 'Verified' : 'Pending'} (Staff Booking)`, 15, offsetY);
       doc.setTextColor(0);
       offsetY += 10;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Payment Details", 15, offsetY);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Amount Paid: Rs. ${booking.totalPrice.toLocaleString()}`, 15, offsetY + 7);
    
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Downloaded on ${new Date().toLocaleString()} from IRCTC 2.0.SATYACMD.DEV`, 105, 280, { align: 'center' });

    doc.save(`IRCTC_${booking.pnr || booking._id.substring(0,8)}.pdf`);
    toast.success('Ticket downloaded successfully!');
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
