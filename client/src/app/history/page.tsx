'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { Calendar, Train, Plane, Hotel, Ticket, XCircle, CheckCircle2, Clock, Loader2, Home } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookingHistory() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        router.push('/login');
        return;
      }
      const res = await axios.get('http://localhost:5000/api/bookings/history', {
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

  const cancelBooking = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this ticket? Cancellation charges may apply.')) return;
    
    try {
      const token = Cookies.get('token');
      await axios.put(`http://localhost:5000/api/bookings/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Ticket cancelled successfully. Refund initiated.');
      fetchHistory(); // Refresh
    } catch (err) {
      toast.error('Failed to cancel ticket.');
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
            onClick={() => router.push('/dashboard')} 
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
              <div key={booking._id} className="bg-[#111] border border-white/10 rounded-2xl p-6 transition-all hover:border-white/20">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  
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
                    
                    {booking.status === 'Confirmed' && (
                      <button 
                        onClick={() => cancelBooking(booking._id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-bold transition-colors w-full md:w-auto"
                      >
                        <XCircle className="w-4 h-4" /> Cancel Ticket
                      </button>
                    )}
                    {booking.status === 'Cancelled' && (
                      <div className="text-xs text-red-400 font-medium">
                        Cancellation Processed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
