'use client';

import { useState, useRef, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OTPPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [debugOtp, setDebugOtp] = useState('123456');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  
  // Use suspense wrap if using useSearchParams in production next.js,
  // but for simple cases this is fine depending on the next.js config.
  // Using a try-catch or optional handling for search params.
  const [email, setEmail] = useState('');
  const [isLoginType, setIsLoginType] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('/');

  useEffect(() => {
    // Generate random 6-digit OTP
    setDebugOtp(Math.floor(100000 + Math.random() * 900000).toString());
    
    // Basic extraction of search params if available
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get('email');
      const typeParam = params.get('type');
      const debugParam = params.get('debug');
      const redirectParam = params.get('redirect');
      if (emailParam) setEmail(emailParam);
      if (typeParam === 'login') setIsLoginType(true);
      if (debugParam) setDebugOtp(debugParam);
      if (redirectParam) setRedirectUrl(redirectParam);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input if there's a value
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);

    if (isLoginType) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-login-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp: otpValue })
        });
        const data = await res.json();
        
        if (res.ok) {
          import('js-cookie').then((Cookies) => {
            Cookies.default.set('token', data.token);
            localStorage.removeItem('sessionExpiresAt'); 
          });
          toast.success('Successfully logged in!');
          router.push(redirectUrl);
        } else {
          toast.error(data.error || 'Invalid OTP');
          setIsVerifying(false);
        }
      } catch (err) {
        toast.error('Server error during OTP verification');
        setIsVerifying(false);
      }
    } else {
      // Mock for other types (like registration)
      if (otpValue !== debugOtp) {
        toast.error('Invalid OTP code. Try the debug code.');
        setIsVerifying(false);
        return;
      }
      setTimeout(() => {
        toast.success('Account successfully verified!');
        router.push('/login');
      }, 1200);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] pt-24 pb-12 flex items-center justify-center relative">
      <Navbar />
      
      <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-card p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              <ShieldCheck className="w-10 h-10 text-blue-400" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Verify Your Account
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            We've sent a one-time password to<br/>
            <span className="text-gray-200 font-medium">{email || 'your email address'}</span>
          </p>

          <form onSubmit={handleSubmit}>
            <div className="flex justify-between gap-2 mb-8">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={digit}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-center text-xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all shadow-inner"
                />
              ))}
            </div>

            {/* Debug Code Info */}
            <div className="mb-6 p-3 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Developer Debug</p>
              <p className="text-sm font-mono text-blue-400 font-bold tracking-widest">{debugOtp}</p>
            </div>

            <button 
              type="submit" 
              disabled={isVerifying}
              className="btn-primary w-full flex justify-center items-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                <>
                  Verify OTP
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            {resendTimer > 0 ? (
              <p className="text-gray-500 text-sm">
                Resend code available in <span className="text-blue-400 font-mono font-bold">{resendTimer}s</span>
              </p>
            ) : (
              <button 
                type="button"
                onClick={() => {
                  toast.success('New OTP sent successfully!');
                  setOtp(['', '', '', '', '', '']);
                  setDebugOtp(Math.floor(100000 + Math.random() * 900000).toString());
                  setResendTimer(60);
                  inputRefs.current[0]?.focus();
                }}
                className="text-gray-400 text-sm hover:text-white transition-colors"
              >
                Didn't receive the code? <span className="text-blue-400 font-medium">Resend</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
