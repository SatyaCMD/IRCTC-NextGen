'use client';
import Link from 'next/link';
import { Train, Menu, ShieldAlert, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import SessionTimer from './SessionTimer';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = () => {
      const token = Cookies.get('token');
      setIsLoggedIn(!!token);
    };
    checkAuth();
    // Re-check periodically or listen to changes if needed, but for simplicity:
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    Cookies.remove('token');
    localStorage.removeItem('sessionExpiresAt');
    setIsLoggedIn(false);
    router.push('/login');
  };
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0f1115]/80 backdrop-blur-md border-b border-[#272a31]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Train className="h-8 w-8 text-blue-500" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">IRCTC 2.0</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
            <Link href="/pnr-status" className="text-gray-300 hover:text-white transition-colors">PNR Status</Link>
            <Link href="/train-status" className="text-gray-300 hover:text-white transition-colors">Running Status</Link>
            {isLoggedIn && (
              <>
                <Link href="/history" className="text-gray-300 hover:text-white transition-colors">My Bookings</Link>
                <Link href="/refund-history" className="text-gray-300 hover:text-white transition-colors">Refund History</Link>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link href="/admin" className="text-purple-400 hover:text-purple-300 font-medium border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Admin
            </Link>
            {isLoggedIn ? (
              <div className="flex items-center gap-4 ml-4">
                <Link href="/dashboard?tab=profile" className="text-gray-300 hover:text-white font-medium text-sm transition-colors">
                  My Profile
                </Link>
                <SessionTimer />
                <button 
                  onClick={handleLogout}
                  className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-4 py-2 rounded-lg transition-all text-sm font-bold flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" className="text-gray-300 hover:text-white font-medium ml-2">Register</Link>
                <Link href="/login" className="btn-primary">Login</Link>
              </>
            )}
          </div>
          
          <div className="md:hidden">
            <Menu className="h-6 w-6 text-gray-300" />
          </div>
        </div>
      </div>
    </nav>
  );
}
