'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Search, Loader2, Train, MapPin, CheckCircle, Clock, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import Cookies from 'js-cookie';

export default function PnrStatusPage() {
  const [pnr, setPnr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const checkPnr = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pnr.length !== 10) {
      toast.error('Please enter a valid 10-digit PNR number.');
      return;
    }

    setIsLoading(true);
    setResult(null);

    // API Call
    axios.get(`http://localhost:5000/api/bookings/pnr/${pnr}`, {
      headers: { Authorization: `Bearer ${Cookies.get('token')}` }
    })
      .then(res => {
        setIsLoading(false);
        setResult(res.data);
      })
      .catch(err => {
        setIsLoading(false);
        toast.error(err.response?.data?.error || 'Failed to fetch PNR status.');
      });
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white pt-24 pb-12 font-sans selection:bg-blue-500/30">
      <Navbar />

      <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1541427468627-a89a96e5ca1d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 fixed" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#050505]/80 to-[#050505] z-0 fixed" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 lg:px-8 mt-12">
        
        <div className="text-center mb-12">
          <div className="inline-flex p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20 mb-4 backdrop-blur-md">
            <Search className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 drop-shadow-xl">
            PNR Status <span className="text-blue-500">Enquiry</span>
          </h1>
          <p className="text-gray-400 text-lg">Check the current reservation status of your ticket.</p>
        </div>

        {/* Search Box */}
        <form onSubmit={checkPnr} className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-2xl max-w-2xl mx-auto mb-12">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={pnr}
                onChange={(e) => setPnr(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
                placeholder="Enter 10-digit PNR Number"
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 md:py-5 text-white text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:tracking-normal placeholder:font-sans"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                {pnr.length}/10
              </span>
            </div>
            <button 
              type="submit" 
              disabled={isLoading || pnr.length !== 10}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 md:py-5 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group whitespace-nowrap shadow-[0_0_20px_rgba(37,99,235,0.3)]"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Get Status'}
            </button>
          </div>
        </form>

        {/* Result Area */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl">
            
            {/* Ticket Header */}
            <div className="bg-gradient-to-r from-blue-900/60 to-indigo-900/60 p-6 md:p-8 border-b border-white/10 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 text-white/5 rotate-12">
                <Train className="w-64 h-64" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
                <div>
                  <p className="text-blue-300 text-sm font-bold uppercase tracking-widest mb-1">PNR Number</p>
                  <h2 className="text-4xl font-black text-white font-mono tracking-wider">{result.pnr}</h2>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-blue-300 text-sm font-bold uppercase tracking-widest mb-1">Charting Status</p>
                  <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full border border-emerald-500/30">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-bold">{result.chartStatus}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Journey Details */}
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 pb-10 border-b border-white/10">
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Train</p>
                  <p className="text-white font-bold text-lg">{result.trainNo}</p>
                  <p className="text-gray-400 text-sm">{result.trainName}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Journey Date</p>
                  <p className="text-white font-bold text-lg">{result.doj}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Route</p>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold">{result.from}</span>
                    <div className="flex-1 h-px bg-white/20 relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1a1d24] px-2 text-blue-400">
                        <ArrowRightIcon className="w-4 h-4" />
                      </div>
                    </div>
                    <span className="text-white font-bold">{result.to}</span>
                  </div>
                </div>
              </div>

              {/* Passenger Status Table */}
              <h3 className="text-xl font-bold text-white mb-6">Passenger Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/30 border-y border-white/10">
                      <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">#</th>
                      <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Booking Status</th>
                      <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Current Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.passengers.map((p: any, i: number) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4 text-white font-medium">Passenger {p.no}</td>
                        <td className="p-4 text-gray-400 font-mono">{p.bookingStatus}</td>
                        <td className="p-4">
                          <span className="inline-flex font-mono font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-lg">
                            {p.currentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-8 flex items-start gap-3 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-200/80">
                  Current status is updated in real-time. If your ticket is waitlisted, check back closer to the journey date or after chart preparation.
                </p>
              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  );
}

function ArrowRightIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
  )
}
