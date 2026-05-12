'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowRight, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

export default function AdminOTPPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [captchaAnswer, setCaptchaAnswer] = useState(0);
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [debugOtp, setDebugOtp] = useState('999999');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  useEffect(() => {
    generateCaptcha();
    setDebugOtp(Math.floor(100000 + Math.random() * 900000).toString());
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

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;
    setCaptchaQuestion(`${num1} x ${num2}`);
    setCaptchaAnswer(num1 * num2);
  };

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

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
    
    if (parseInt(captchaInput) !== captchaAnswer) {
      toast.error('Security Check Failed: Incorrect CAPTCHA.');
      generateCaptcha();
      setCaptchaInput('');
      return;
    }

    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      toast.error('Please enter the full 6-digit access code.');
      return;
    }

    if (otpValue !== debugOtp) {
      toast.error('Invalid 2FA code. Use the secure debug code.');
      return;
    }

    setIsVerifying(true);

    setTimeout(() => {
      // Using a session cookie (no expires attribute) instead of persistent
      Cookies.set('admin_token', 'secure_admin_session_789');
      toast.success('Authentication Complete. Welcome Admin.');
      router.push('/admin');
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-[#050505] pt-24 pb-12 flex items-center justify-center relative selection:bg-purple-500/30">
      
      <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
      
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-[#111] border border-white/10 rounded-[2rem] p-8 md:p-10 text-center shadow-2xl relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-600" />
          
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <Lock className="w-10 h-10 text-purple-400" />
            </div>
          </div>
          
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
            2FA Verification
          </h2>
          <p className="text-gray-400 text-sm mb-8 font-medium">
            Enter the 6-digit security code sent to your registered admin device.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="flex justify-between gap-2 md:gap-3 mb-8">
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
                  className="w-full h-14 md:h-16 bg-black/50 border border-white/10 rounded-xl text-center text-2xl text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-inner"
                />
              ))}
            </div>

            <div className="space-y-1.5 mb-8 text-left">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Final Security Check</label>
              <div className="flex gap-3">
                <div className="bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 flex-1 flex items-center justify-center font-mono text-gray-300">
                  {captchaQuestion} = ?
                </div>
                <input 
                  type="number" 
                  required
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  className="w-1/2 bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-center text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-mono"
                  placeholder="Answer"
                />
              </div>
            </div>

            <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-xl text-left">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Secure Debug Bypass</p>
              <p className="text-sm font-mono text-purple-400 font-bold tracking-widest">{debugOtp}</p>
            </div>

            <button 
              type="submit" 
              disabled={isVerifying}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(168,85,247,0.3)] mb-4"
            >
              {isVerifying ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authorizing...
                </span>
              ) : (
                <>
                  Verify & Access Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="text-center">
              {resendTimer > 0 ? (
                <p className="text-gray-500 text-sm">
                  Resend code available in <span className="text-purple-400 font-mono font-bold">{resendTimer}s</span>
                </p>
              ) : (
                <button 
                  type="button"
                  onClick={() => {
                    toast.success('New 2FA code sent to Admin device!');
                    setOtp(['', '', '', '', '', '']);
                    setDebugOtp(Math.floor(100000 + Math.random() * 900000).toString());
                    setResendTimer(60);
                    inputRefs.current[0]?.focus();
                  }}
                  className="text-gray-400 text-sm hover:text-white transition-colors"
                >
                  Didn't receive the code? <span className="text-purple-400 font-medium">Resend</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
