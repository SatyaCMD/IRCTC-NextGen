'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { User, Mail, Calendar, Shield, CreditCard, Clock, Train, CheckCircle2, Ticket, X, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [walletAmount, setWalletAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchProfileData = async () => {
      const token = Cookies.get('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const [userRes, bookingsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/bookings/history', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setUser(userRes.data);
        setBookings(bookingsRes.data);
      } catch (err) {
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white pt-24 pb-12">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-blue-900/40 border border-white/10 p-8 backdrop-blur-sm">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <User className="w-64 h-64" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-[#050505] shadow-2xl">
              <span className="text-5xl font-bold text-white uppercase">{user?.name?.charAt(0) || 'U'}</span>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                <h1 className="text-4xl font-bold">{user?.name}</h1>
                {user?.role === 'Admin' && (
                  <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Admin
                  </span>
                )}
              </div>
              <p className="text-gray-400 flex items-center gap-2 justify-center md:justify-start mb-4">
                <Mail className="w-4 h-4" /> {user?.email}
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="bg-black/50 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                  <span className="text-sm text-gray-400">User ID:</span>
                  <span className="font-mono text-blue-400 font-bold">{user?._id?.substring(0, 8).toUpperCase()}</span>
                </div>
                <div className="bg-black/50 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                  <span className="text-sm text-gray-400">Joined:</span>
                  <span className="text-gray-200">{new Date(user?.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Loyalty Points Badge */}
            <div className="bg-gradient-to-b from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 p-6 rounded-2xl flex flex-col items-center justify-center min-w-[150px] shadow-lg shadow-yellow-500/5">
              <Ticket className="w-8 h-8 text-yellow-500 mb-2" />
              <div className="text-4xl font-bold text-yellow-500 mb-1">{user?.loyaltyPoints || 150}</div>
              <div className="text-xs text-yellow-500/70 uppercase tracking-widest font-semibold">Loyalty Points</div>
            </div>

            {/* Wallet Balance Badge */}
            <div className="bg-gradient-to-b from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 p-6 rounded-2xl flex flex-col items-center justify-center min-w-[180px] shadow-lg shadow-emerald-500/5">
              <CreditCard className="w-8 h-8 text-emerald-500 mb-2" />
              <div className="text-4xl font-bold text-emerald-500 mb-1">₹{user?.walletBalance || 0}</div>
              <div className="text-xs text-emerald-500/70 uppercase tracking-widest font-semibold">IRCTC Wallet</div>
              <button 
                 onClick={() => setShowWalletModal(true)}
                 className="mt-3 text-[10px] bg-emerald-500 hover:bg-emerald-400 transition-colors text-white px-3 py-1.5 rounded-full uppercase tracking-wider font-bold cursor-pointer relative z-20">
                 + Add Money
              </button>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Details */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" /> Personal Info
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Account Status</label>
                  <p className="font-medium text-emerald-400 flex items-center gap-2 mt-1">
                    <CheckCircle2 className="w-4 h-4" /> {user?.status || 'Active'}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Role</label>
                  <p className="font-medium text-gray-200 mt-1">{user?.role}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-400" /> Payment Methods
              </h3>
              <div className="text-sm text-gray-400 bg-black/40 p-4 rounded-xl border border-white/5">
                No saved payment methods. Book a ticket to save your card securely.
              </div>
            </div>

            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 backdrop-blur-sm mt-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-red-400">
                <Shield className="w-5 h-5" /> Danger Zone
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Permanently delete your account and all associated personal data.
              </p>
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors border border-red-500/30 font-bold text-sm"
              >
                <Trash2 className="w-4 h-4" /> Delete Account
              </button>
            </div>
          </div>

          {/* Right Column - Bookings */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Train className="w-6 h-6 text-blue-500" /> Recent Bookings
                </h2>
                <span className="text-sm text-gray-400 bg-white/5 px-3 py-1 rounded-full">{bookings.length} Total</span>
              </div>

              {bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-black/20 rounded-xl border border-dashed border-white/10">
                  <Calendar className="w-12 h-12 mb-4 opacity-50" />
                  <p>You haven't made any bookings yet.</p>
                  <button 
                    onClick={() => router.push('/')}
                    className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Explore Services
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking: any) => (
                    <div key={booking._id} className="bg-black/40 border border-white/10 p-5 rounded-xl hover:border-blue-500/50 transition-colors group">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                            <Train className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="font-bold text-lg">{booking.service?.name || 'IRCTC Service'}</p>
                            <p className="text-xs text-gray-400 font-mono">PNR: {booking.pnr || booking._id.substring(0, 10).toUpperCase()}</p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="font-bold text-lg text-emerald-400">₹{booking.totalPrice}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            booking.status === 'Confirmed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            booking.status === 'Cancelled' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/5">
                        <div>
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Date</p>
                          <p className="text-sm font-medium">{booking.journeyDate || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Passengers</p>
                          <p className="text-sm font-medium">{booking.passengers?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Payment</p>
                          <p className="text-sm font-medium text-blue-400">{booking.paymentStatus}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Wallet Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" /> Top Up Wallet
              </h3>
              <button onClick={() => setShowWalletModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-400 mb-4">Enter the amount you wish to add to your IRCTC Wallet.</p>
            
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400 font-bold">₹</span>
              </div>
              <input 
                type="number" 
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-xl font-mono"
              />
            </div>
            
            <div className="flex gap-3">
              {[500, 1000, 5000].map(amt => (
                <button 
                  key={amt}
                  onClick={() => setWalletAmount(amt.toString())}
                  className="flex-1 py-2 rounded-lg border border-white/10 text-xs font-bold text-gray-300 hover:bg-white/5 hover:border-white/20 transition-all"
                >
                  +₹{amt}
                </button>
              ))}
            </div>

            <button 
              onClick={async () => {
                if (!walletAmount || isNaN(Number(walletAmount)) || Number(walletAmount) <= 0) {
                  toast.error('Please enter a valid amount');
                  return;
                }
                setIsProcessing(true);
                try {
                  await axios.post('http://localhost:5000/api/auth/wallet/add', 
                    { amount: Number(walletAmount) }, 
                    { headers: { Authorization: `Bearer ${Cookies.get('token')}` } }
                  );
                  toast.success('Successfully added to wallet!');
                  setShowWalletModal(false);
                  window.location.reload();
                } catch (err) {
                  toast.error('Failed to add money');
                } finally {
                  setIsProcessing(false);
                }
              }}
              disabled={isProcessing || !walletAmount}
              className="w-full mt-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 flex justify-center items-center gap-2"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Proceed to Add'}
            </button>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Delete Account Permanently?</h3>
            <p className="text-gray-400 mb-6 text-sm">
              Are you sure you want to delete your account? This action is irreversible. All your wallet data and history will be lost.
              <br /><br />
              <span className="text-amber-500 font-semibold bg-amber-500/10 px-3 py-2 rounded-lg block">
                Note: If you have active confirmed bookings, your account cannot be deleted until they are completed or cancelled.
              </span>
            </p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors border border-white/10"
              >
                No, Keep It
              </button>
              <button 
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await axios.delete('http://localhost:5000/api/auth/delete', {
                      headers: { Authorization: `Bearer ${Cookies.get('token')}` }
                    });
                    toast.success('Account deleted permanently.');
                    Cookies.remove('token');
                    Cookies.remove('user');
                    setTimeout(() => {
                      router.push('/');
                      window.location.reload();
                    }, 1500);
                  } catch (err: any) {
                    if (err.response && err.response.data && err.response.data.error) {
                      toast.error(err.response.data.error, { duration: 5000 });
                    } else {
                      toast.error('Failed to delete account. Please try again later.');
                    }
                    setShowDeleteModal(false);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors flex justify-center items-center gap-2"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
