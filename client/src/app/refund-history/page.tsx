'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { RefreshCcw, Home, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RefundHistory() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        router.push('/login');
        return;
      }
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter only Cancelled bookings with a refundAmount > 0 OR refundStatus !== 'None'
      const cancelled = res.data.filter((b: any) => b.status === 'Cancelled');
      const sorted = cancelled.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setRefunds(sorted);
    } catch (err) {
      toast.error('Failed to load refund history.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white pt-24 pb-12 px-4 selection:bg-purple-500/30">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/30">
              <RefreshCcw className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Refund History</h1>
              <p className="text-gray-400 text-sm">Track your cancelled tickets and refund status</p>
            </div>
          </div>
          <button 
            onClick={() => router.push('/')} 
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl transition-all border border-white/10 font-bold text-sm shadow-lg hover:-translate-y-0.5"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : refunds.length === 0 ? (
          <div className="bg-[#111] border border-white/10 rounded-2xl p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No Refunds Found</h2>
            <p className="text-gray-400">You haven't cancelled any tickets recently.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {refunds.map((refund) => (
              <div key={refund._id} className="bg-[#111] border border-white/10 rounded-2xl p-6 transition-all hover:border-emerald-500/30">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap gap-3 items-center">
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-md text-xs font-bold tracking-wider uppercase">
                        {refund.refundStatus || 'Completed'}
                      </span>
                      <span className="text-gray-400 text-sm font-medium">
                        Cancelled on: {new Date(refund.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold mb-1">
                        {refund.serviceType} Journey • {refund.from} to {refund.to}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Original Journey Date: <span className="text-white font-medium">{refund.journeyDate || 'N/A'}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-black/40 rounded-xl border border-white/5">
                      <div>
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Transaction ID</p>
                        <p className="font-mono text-sm">{refund.bookingRef || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Booking PNR</p>
                        <p className="font-mono text-sm">{refund.pnr || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Passengers</p>
                        <p className="font-medium text-sm">{refund.passengers?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Class</p>
                        <p className="font-medium text-sm">{refund.serviceClass || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="md:border-l border-white/10 md:pl-6 flex flex-col justify-center items-start md:items-end md:min-w-[150px]">
                    <div className="text-left md:text-right w-full">
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Refund Amount</p>
                      <p className="text-3xl font-black text-emerald-400 drop-shadow-md">
                        ₹{refund.refundAmount?.toLocaleString() || Math.round(refund.totalPrice * 0.5).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-emerald-500/80 mt-2 font-bold uppercase tracking-wider">Credited to IRCTC Wallet</p>
                    </div>
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
