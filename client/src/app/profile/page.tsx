'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { User, Mail, Calendar, Shield, CreditCard, Clock, Train, CheckCircle2, Ticket, X, Loader2, Trash2, AlertTriangle, Edit3, Phone, LogOut } from 'lucide-react';
import Navbar from '@/components/Navbar';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [walletAmount, setWalletAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', age: '', gender: '', travelHabits: '' });
  const [kycForm, setKycForm] = useState({ documentType: 'Aadhaar', documentNumber: '' });
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
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/history`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const userData = userRes.data;
        setUser(userData);
        setBookings(bookingsRes.data || []);
        setEditForm({
          name: userData.name || '',
          phone: userData.phone || '',
          age: userData.preferences?.age || '',
          gender: userData.preferences?.gender || 'Male',
          travelHabits: userData.preferences?.travelHabits || ''
        });

        if (!userData.kycStatus) {
          setShowKYCModal(true);
        }
      } catch (err) {
        toast.error('Failed to load profile');
        router.push('/login');
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

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white pt-24 pb-12 flex justify-center">
      <div className="max-w-6xl w-full px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-80 shrink-0 bg-[#0a0a0c] border border-white/5 rounded-3xl p-6 flex flex-col shadow-2xl h-fit">
          <div className="flex flex-col items-center text-center mb-8 mt-4">
            <div className="w-24 h-24 rounded-full bg-blue-600/20 flex items-center justify-center border-2 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)] mb-4">
              <span className="text-4xl font-bold text-white uppercase">{user?.name?.charAt(0) || 'U'}</span>
            </div>
            <h2 className="text-2xl font-bold">{user?.name || 'Loading...'}</h2>
            <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
          </div>

          <div className="flex flex-col gap-2 mt-4 flex-1">
            <button onClick={() => router.push('/history')} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-medium text-sm text-left">
              <Ticket className="w-5 h-5" /> Booking History
            </button>
            <button className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 transition-colors font-medium text-sm text-left">
              <User className="w-5 h-5" /> My Profile
            </button>
            <button onClick={() => router.push('/pnr-status')} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-medium text-sm text-left">
              <Train className="w-5 h-5" /> PNR Status
            </button>
            
            <div className="my-4 border-t border-white/5"></div>

            <button onClick={() => setShowEditModal(true)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-medium text-sm text-left">
              <Edit3 className="w-5 h-5" /> Edit Profile
            </button>
            <button onClick={() => setShowDeleteModal(true)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors font-medium text-sm text-left">
              <Trash2 className="w-5 h-5" /> Delete Account
            </button>
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors font-bold text-sm text-left mt-2">
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-[#0a0a0c] border border-white/5 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold mb-8">Personal Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* FULL NAME */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name</label>
              <div className="bg-[#111113] border border-white/5 rounded-xl px-4 py-3 text-white font-medium min-h-[50px] flex items-center">
                {user?.name}
              </div>
            </div>

            {/* AADHAAR / KYC */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Aadhaar / KYC</label>
              <div className="bg-[#111113] border border-white/5 rounded-xl px-4 py-3 text-white font-medium min-h-[50px] flex items-center justify-between">
                <span className={user?.kycStatus ? 'text-emerald-400' : 'text-gray-400'}>
                  {user?.kycStatus ? 'Verified' : 'Unverified'}
                </span>
                {!user?.kycStatus && (
                  <button 
                    onClick={() => setShowKYCModal(true)} 
                    className="bg-yellow-600/20 text-yellow-500 border border-yellow-600/30 px-3 py-1 rounded-lg text-xs font-bold"
                  >
                    Verify KYC
                  </button>
                )}
              </div>
            </div>

            {/* ADDRESS */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Address</label>
              <div className="bg-[#111113] border border-white/5 rounded-xl px-4 py-3 text-gray-400 font-medium min-h-[50px] flex items-center">
                No Address Added
              </div>
            </div>

            {/* EMAIL ADDRESS */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
              <div className="bg-[#111113] border border-white/5 rounded-xl px-4 py-3 text-white font-medium min-h-[50px] flex items-center">
                {user?.email}
              </div>
            </div>

            {/* DATE OF BIRTH */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Date of Birth</label>
              <div className="bg-[#111113] border border-white/5 rounded-xl px-4 py-3 text-gray-400 font-medium min-h-[50px] flex items-center">
                DD/MM/YYYY
              </div>
            </div>

            {/* STATE & PINCODE */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">State & Pincode</label>
              <div className="bg-[#111113] border border-white/5 rounded-xl px-4 py-3 text-gray-400 font-medium min-h-[50px] flex items-center">
                State - 000000
              </div>
            </div>

            {/* MOBILE NUMBER */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Mobile Number</label>
              <div className="bg-[#111113] border border-white/5 rounded-xl px-4 py-3 text-white font-medium min-h-[50px] flex items-center justify-between">
                <span className={user?.phone ? 'text-white' : 'text-gray-400'}>
                  {user?.phone ? `+91 - ${user.phone}` : '+91 - Not Linked'}
                </span>
                {!user?.phone && (
                  <button 
                    onClick={() => setShowEditModal(true)} 
                    className="bg-blue-600/20 text-blue-400 border border-blue-600/30 px-3 py-1 rounded-lg text-xs font-bold"
                  >
                    Link Now
                  </button>
                )}
              </div>
            </div>

            {/* GENDER */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Gender</label>
              <div className="bg-[#111113] border border-white/5 rounded-xl px-4 py-3 text-gray-400 font-medium min-h-[50px] flex items-center">
                {user?.preferences?.gender || 'Not Specified'}
              </div>
            </div>

            {/* ACCOUNT ROLE */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Account Role</label>
              <div className="bg-[#111113] border border-white/5 rounded-xl px-4 py-3 text-emerald-400 font-bold min-h-[50px] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                {user?.role || 'User'}
              </div>
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
                  await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/wallet/add`, 
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
                    await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/delete`, {
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

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-400" /> Edit Profile
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Email (Cannot be changed)</label>
                <input 
                  type="email" 
                  value={user?.email} 
                  disabled
                  className="w-full bg-black/50 border border-white/5 rounded-xl py-2 px-3 text-gray-500 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Phone Number</label>
                <input 
                  type="text" 
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Age</label>
                  <input 
                    type="number" 
                    value={editForm.age}
                    onChange={(e) => setEditForm({...editForm, age: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Gender</label>
                  <select 
                    value={editForm.gender}
                    onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="Male" className="bg-[#111]">Male</option>
                    <option value="Female" className="bg-[#111]">Female</option>
                    <option value="Other" className="bg-[#111]">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Travel Habits</label>
                <input 
                  type="text" 
                  value={editForm.travelHabits}
                  placeholder="e.g. Frequent Flyer, Budget Traveler"
                  onChange={(e) => setEditForm({...editForm, travelHabits: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <button 
                onClick={async () => {
                  setIsProcessing(true);
                  try {
                    await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, 
                      { ...editForm, age: Number(editForm.age) }, 
                      { headers: { Authorization: `Bearer ${Cookies.get('token')}` } }
                    );
                    toast.success('Profile updated successfully!');
                    window.location.reload();
                  } catch (err) {
                    toast.error('Failed to update profile');
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                disabled={isProcessing}
                className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all flex justify-center items-center gap-2"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KYC Mandatory Modal */}
      {showKYCModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-blue-500/30 rounded-2xl max-w-md w-full p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-center mb-2">Mandatory KYC Verification</h3>
            <p className="text-gray-400 text-center mb-6 text-sm">
              As per government regulations, you must complete your KYC to book tickets and use the IRCTC Wallet. This is a one-time process.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Document Type</label>
                <select 
                  value={kycForm.documentType}
                  onChange={(e) => setKycForm({...kycForm, documentType: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="Aadhaar" className="bg-[#111]">Aadhaar Card</option>
                  <option value="PAN" className="bg-[#111]">PAN Card</option>
                  <option value="Passport" className="bg-[#111]">Passport</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Document Number</label>
                <input 
                  type="text" 
                  value={kycForm.documentNumber}
                  onChange={(e) => setKycForm({...kycForm, documentNumber: e.target.value.toUpperCase()})}
                  placeholder="Enter Document Number"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500/50 uppercase"
                />
              </div>

              <button 
                onClick={async () => {
                  if (!kycForm.documentNumber || kycForm.documentNumber.length < 5) {
                    toast.error('Please enter a valid document number');
                    return;
                  }
                  setIsProcessing(true);
                  try {
                    await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/kyc`, 
                      kycForm, 
                      { headers: { Authorization: `Bearer ${Cookies.get('token')}` } }
                    );
                    toast.success('KYC completed successfully!');
                    setShowKYCModal(false);
                    window.location.reload();
                  } catch (err) {
                    toast.error('Failed to complete KYC');
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                disabled={isProcessing}
                className="w-full mt-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all flex justify-center items-center gap-2"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete KYC'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
