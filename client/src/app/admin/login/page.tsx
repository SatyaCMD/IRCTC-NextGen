'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ShieldAlert, ArrowRight, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [formData, setFormData] = useState({ adminId: '', password: '', captcha: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState(0);
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    setCaptchaQuestion(`${num1} + ${num2}`);
    setCaptchaAnswer(num1 + num2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (parseInt(formData.captcha) !== captchaAnswer) {
      toast.error('Security Check Failed: Incorrect CAPTCHA.');
      generateCaptcha();
      setFormData({ ...formData, captcha: '' });
      return;
    }

    setIsLoading(true);

    try {
      // Map adminId to email since the backend expects email
      // If adminId is 'admin', we will append the domain used for admin
      let loginEmail = formData.adminId;
      if (!loginEmail.includes('@')) {
        loginEmail = `${loginEmail}@irctc2.co.in`; // fallback domain mapping if they just typed 'admin'
      }

      const res = await fetch(`http://localhost:5000/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: formData.password })
      });
      const data = await res.json();

      if (res.ok) {
        if (data.requiresOtp) {
          toast.success('Admin verified! OTP sent to email.');
          router.push(`/admin/otp?email=${encodeURIComponent(loginEmail)}&type=login&debug=${data.debugOtp}`);
        } else {
          // Fallback if OTP is bypassed
          import('js-cookie').then((Cookies) => {
            Cookies.default.set('token', data.token);
            router.push('/admin/dashboard');
          });
        }
      } else {
        toast.error(data.error || 'Access Denied: Invalid admin credentials.');
        setIsLoading(false);
      }
    } catch (err: any) {
      toast.error('Server error during authentication.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex bg-[#050505] text-white selection:bg-purple-500/30">
      
      {/* Left side - Dark Admin Branding */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-[#0a0a0a]">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 transition-transform duration-10000 hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
        <div className="absolute inset-0 border-r border-white/5" />
        
        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          <Link href="/" className="flex items-center gap-3 w-fit group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 backdrop-blur-md flex items-center justify-center border border-purple-500/30 group-hover:bg-purple-500/20 transition-all">
              <ShieldAlert className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-2xl font-bold tracking-tight">IRCTC <span className="text-purple-400">Admin</span></span>
          </Link>

          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold mb-6">
              <Lock className="w-3 h-3" /> RESTRICTED ACCESS
            </div>
            <h1 className="text-5xl font-bold leading-tight mb-6 tracking-tight">
              System Control Portal.
            </h1>
            <p className="text-lg text-gray-400 font-light">
              Authorized personnel only. Accessing this system without proper authorization is strictly prohibited.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16 relative">
        <Link href="/" className="absolute top-8 right-8 text-sm text-gray-500 hover:text-white transition-colors">
          Return to public site
        </Link>

        <div className="w-full max-w-md mt-12 lg:mt-0">
          <div className="mb-10 text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
               <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/30">
                 <ShieldAlert className="w-8 h-8 text-purple-400" />
               </div>
            </div>
            <h2 className="text-3xl font-semibold mb-2">Admin Login</h2>
            <p className="text-gray-400 text-sm">Please authenticate to access the dashboard.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Admin ID</label>
              <input 
                type="text" 
                required
                value={formData.adminId}
                onChange={(e) => setFormData({...formData, adminId: e.target.value})}
                className="w-full bg-[#111111] border border-[#222] rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-mono"
                placeholder="Enter Admin ID"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Master Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-[#111111] border border-[#222] rounded-xl px-4 py-3.5 pr-12 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-mono"
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
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Security Captcha</label>
                <button type="button" onClick={generateCaptcha} className="text-xs text-purple-400 hover:text-purple-300 transition-colors">Reload</button>
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
                  className="w-1/2 bg-[#111111] border border-[#222] rounded-xl px-4 py-3.5 text-center text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-mono"
                  placeholder="Answer"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition-all duration-300 mt-4 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(168,85,247,0.3)]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Authenticating...
                </span>
              ) : (
                <>
                  Proceed to 2FA
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            
          </form>

        </div>
      </div>
    </main>
  );
}
