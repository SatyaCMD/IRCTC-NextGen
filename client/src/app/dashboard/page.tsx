'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { Ticket, LogOut } from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
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

  if (!user) return <div className="min-h-screen flex items-center justify-center text-white bg-[var(--background)]">Loading profile...</div>;

  return (
    <main className="min-h-screen bg-[var(--background)] pt-24 pb-12">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="glass-card p-6 border-blue-500/30 border-t-4">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-xl font-bold text-white mb-4">
              {user.name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-white">{user.name}</h2>
            <p className="text-gray-400 text-sm mb-6">{user.email}</p>

            <div className="space-y-2">
              <button className="w-full text-left px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg font-medium">
                Booking History
              </button>
              <button className="w-full text-left px-4 py-2 hover:bg-[#1f222a] text-gray-300 rounded-lg transition-colors">
                Profile Edit
              </button>
              <button onClick={handleLogout} className="w-full flex items-center px-4 py-2 mt-4 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3">
          <h2 className="text-2xl font-bold text-white mb-6">Booking History</h2>
          
          <div className="space-y-4">
            {history.length > 0 ? (
               history.map(booking => (
                 <div key={booking._id} className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <Ticket className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-bold text-white">PNR: {Math.floor(Math.random()*10000000000)}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${booking.status === 'Confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-gray-300 mb-1">{booking.trainId?.name} ({booking.trainId?.trainNumber})</p>
                      <p className="text-sm text-gray-400">
                        {booking.trainId?.source} → {booking.trainId?.destination} | Class: {booking.trainClass}
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0 text-right">
                       <p className="text-sm text-gray-400 mb-1">Passengers: {booking.passengers.length}</p>
                       <p className="text-sm text-gray-400 mb-1">Seats: {booking.seatNumbers.join(', ')}</p>
                       <p className="text-xl font-bold text-white font-mono">₹{booking.totalPrice}</p>
                    </div>
                 </div>
               ))
            ) : (
               <div className="glass-card p-10 text-center text-gray-400">
                 No bookings found. Time to plan your next journey!
               </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
