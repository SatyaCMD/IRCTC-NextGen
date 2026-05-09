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
    const checkAuth = () => {
      const token = Cookies.get('token');
      setIsLoggedIn(!!token);
      if (!token) {
        setTimeLeft(30 * 60); // Reset timer if logged out
      }
    };
    checkAuth();
    
    // Check every second for auth state changes
    const authInterval = setInterval(checkAuth, 1000);
    return () => clearInterval(authInterval);
  }, [pathname]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isLoggedIn && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isLoggedIn && timeLeft <= 0) {
      // Session expired
      Cookies.remove('token');
      setIsLoggedIn(false);
      toast.error('Session Expired. Please log in again.');
      router.push('/login');
    }

    return () => clearInterval(timer);
  }, [isLoggedIn, timeLeft, router]);

  // Reset timer on user activity
  useEffect(() => {
    const resetTimer = () => {
      if (isLoggedIn) setTimeLeft(30 * 60);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [isLoggedIn]);

  if (!isLoggedIn) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isWarning = timeLeft <= 300; // Warning at 5 minutes

  return (
    <div className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg backdrop-blur-md border transition-colors ${
      isWarning 
        ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse' 
        : 'bg-black/60 border-white/10 text-gray-300'
    }`}>
      {isWarning ? <AlertTriangle className="w-4 h-4" /> : <Timer className="w-4 h-4" />}
      <span className="text-sm font-mono font-bold tracking-wider">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
