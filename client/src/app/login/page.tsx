'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { Eye, EyeOff, Train, Shield, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '', captcha: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState(0);
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetRetypePassword, setShowResetRetypePassword] = useState(false);
  const [resetData, setResetData] = useState({ email: '', newPassword: '', retypeNewPassword: '', otp: '' });
  const [debugOtp, setDebugOtp] = useState('');
  const router = useRouter();

  useEffect(() => {
    generateCaptcha();
    setDebugOtp(Math.floor(100000 + Math.random() * 900000).toString());
  }, []);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaQuestion(`${num1} + ${num2}`);
    setCaptchaAnswer(num1 + num2);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (resetData.newPassword !== resetData.retypeNewPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (resetData.otp !== debugOtp) {
      toast.error('Invalid OTP. Please use the debug code provided.');
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`, {
        email: resetData.email,
        newPassword: resetData.newPassword
      });
      toast.success('Password reset successfully! Please login.');
      setIsForgotPassword(false);
      setResetData({ email: '', newPassword: '', retypeNewPassword: '', otp: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (parseInt(formData.captcha) !== captchaAnswer) {
      toast.error('Incorrect CAPTCHA answer. Please try again.');
      generateCaptcha();
      setFormData({ ...formData, captcha: '' });
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        email: formData.email,
        password: formData.password
      });
      
      const searchParams = new URLSearchParams(window.location.search);
      const redirectPath = searchParams.get('redirect') || '/';

      if (res.data.requiresOtp) {
        toast.success('Credentials verified! OTP sent to your email.');
        // Pass debugOtp in URL for fallback purposes as requested by user
        router.push(`/otp?email=${encodeURIComponent(formData.email)}&type=login&debug=${res.data.debugOtp}&redirect=${encodeURIComponent(redirectPath)}`);
      } else {
        // Fallback if OTP is bypassed
        import('js-cookie').then((Cookies) => {
          const getCookieOptions = () => {
            if (typeof window !== 'undefined' && window.location.hostname.includes('irctcv2.co.in')) {
              return { domain: '.irctcv2.co.in' };
            }
            return {};
          };
          Cookies.default.set('token', res.data.token, getCookieOptions());
          router.push(redirectPath);
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid credentials check userid and password');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col lg:flex-row bg-[#050505] text-white selection:bg-blue-500/30">
      
      {/* Left side - Branding & Image */}
      <div className="flex lg:w-1/2 h-72 sm:h-96 lg:h-auto relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1474487548417-781cb71495f3?q=80&w=2184&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-10000 hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply" />
        
        <div className="relative z-10 flex flex-col justify-between p-8 sm:p-12 lg:p-16 w-full">
          <Link href="/" className="flex items-center gap-3 w-fit group">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all">
              <Train className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">IRCTC 2.0</span>
          </Link>

          <div className="max-w-md mt-4 lg:mt-0">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-2 sm:mb-4 tracking-tight">
              Your journey starts here.
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-300 font-light hidden sm:block">
              Experience the next generation of train travel with seamless bookings, AI-powered insights, and premium services.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16 relative">
        <div className="absolute top-8 right-8 text-sm text-gray-400 font-medium">
          Don't have an account?{' '}
          <Link href="/signup" className="text-white hover:text-blue-400 transition-colors ml-1 border-b border-transparent hover:border-blue-400 pb-0.5">
            Register now
          </Link>
        </div>

        <div className="w-full max-w-md mt-12 lg:mt-0">
          <div className="mb-10">
            <h2 className="text-3xl font-semibold mb-2">
              {isForgotPassword ? 'Reset Password' : 'Sign in to IRCTC'}
            </h2>
            <p className="text-gray-400 text-sm">
              {isForgotPassword 
                ? 'Enter your email and new password to reset.' 
                : 'Welcome back! Please enter your details.'}
            </p>
          </div>

          {isForgotPassword ? (
            <form onSubmit={handleResetSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Email</label>
                <input 
                  type="email" 
                  required
                  value={resetData.email}
                  onChange={(e) => setResetData({...resetData, email: e.target.value})}
                  className="w-full bg-[#111111] border border-[#222] rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="Enter your email"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">New Password</label>
                  <div className="relative">
                    <input 
                      type={showResetPassword ? "text" : "password"} 
                      required
                      value={resetData.newPassword}
                      onChange={(e) => setResetData({...resetData, newPassword: e.target.value})}
                      className="w-full bg-[#111111] border border-[#222] rounded-xl px-4 py-3.5 pr-12 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                      placeholder="••••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                      {showResetPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Retype</label>
                  <div className="relative">
                    <input 
                      type={showResetRetypePassword ? "text" : "password"} 
                      required
                      value={resetData.retypeNewPassword}
                      onChange={(e) => setResetData({...resetData, retypeNewPassword: e.target.value})}
                      className="w-full bg-[#111111] border border-[#222] rounded-xl px-4 py-3.5 pr-12 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                      placeholder="••••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowResetRetypePassword(!showResetRetypePassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                      {showResetRetypePassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Security OTP</label>
                  <span className="text-xs text-blue-400 font-mono">Debug: {debugOtp}</span>
                </div>
                <input 
                  type="number" 
                  required
                  value={resetData.otp}
                  onChange={(e) => setResetData({...resetData, otp: e.target.value})}
                  className="w-full bg-[#111111] border border-[#222] rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
                  placeholder="Enter 6-digit OTP"
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-white text-black hover:bg-gray-100 font-semibold py-4 rounded-xl transition-all duration-300 mt-4 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Resetting...' : 'Update Password'}
              </button>

              <div className="text-center mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsForgotPassword(false)}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Email</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-[#111111] border border-[#222] rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="Enter your email"
                />
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Password</label>
                  <button 
                    type="button" 
                    onClick={() => setIsForgotPassword(true)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-[#111111] border border-[#222] rounded-xl px-4 py-3.5 pr-12 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Security Question</label>
                  <button type="button" onClick={generateCaptcha} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Reload</button>
                </div>
                <div className="flex gap-3">
                  <div className="bg-[#111111] border border-[#222] rounded-xl px-4 py-3.5 flex-1 flex items-center justify-center font-mono text-gray-300">
                    {captchaQuestion} = ?
                  </div>
                  <input 
                    type="number" 
                    required
                    value={formData.captcha}
                    onChange={(e) => setFormData({...formData, captcha: e.target.value})}
                    className="w-1/2 bg-[#111111] border border-[#222] rounded-xl px-4 py-3.5 text-center text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
                    placeholder="Answer"
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-white text-black hover:bg-gray-100 font-semibold py-4 rounded-xl transition-all duration-300 mt-4 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Authenticating...
                  </span>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
