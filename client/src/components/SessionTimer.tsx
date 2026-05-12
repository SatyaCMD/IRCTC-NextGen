'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useRouter, usePathname } from 'next/navigation';
import { Timer, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SessionTimer() {
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuthAndTimer = () => {
      const token = Cookies.get('token');
      if (token) {
        setIsLoggedIn(true);
        // Ensure expiration is set securely in localStorage
        let expiry = localStorage.getItem('sessionExpiresAt');
        if (!expiry) {
          expiry = (Date.now() + 30 * 60 * 1000).toString();
          localStorage.setItem('sessionExpiresAt', expiry);
        }
        
        const remaining = Math.max(0, Math.floor((parseInt(expiry) - Date.now()) / 1000));
        setTimeLeft(remaining);

        if (remaining === 0) {
          Cookies.remove('token');
          localStorage.removeItem('sessionExpiresAt');
          setIsLoggedIn(false);
          toast.error('Session Expired. Please log in again.');
          router.push('/login');
        }
      } else {
        setIsLoggedIn(false);
        localStorage.removeItem('sessionExpiresAt');
        setTimeLeft(30 * 60); // Visual reset when logged out
      }
    };

    checkAuthAndTimer();
    
    // Single absolute-time driven interval
    const interval = setInterval(checkAuthAndTimer, 1000);
    return () => clearInterval(interval);
  }, [pathname, router]);

  // Removed activity listeners to enforce strict 30-minute session
  if (!isLoggedIn) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isWarning = timeLeft <= 300; // Warning at 5 minutes

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${
      isWarning 
        ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' 
        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
    }`}>
      {isWarning ? <AlertTriangle className="w-4 h-4" /> : <Timer className="w-4 h-4" />}
      <span className="text-sm font-mono font-bold tracking-wider">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
