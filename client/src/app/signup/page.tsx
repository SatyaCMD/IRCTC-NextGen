'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Train, Shield, ArrowRight } from 'lucide-react';

import toast from 'react-hot-toast';

export default function SignupPage() {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    retypePassword: '',
    captcha: '' 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState(0);
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaQuestion(`${num1} * ${num2}`);
    setCaptchaAnswer(num1 * num2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.retypePassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (parseInt(formData.captcha) !== captchaAnswer) {
      toast.error('Incorrect CAPTCHA answer. Please try again.');
      generateCaptcha();
      setFormData({ ...formData, captcha: '' });
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(`http://localhost:5000/api/auth/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      toast.success('Registration initiated. Please verify OTP.');
      router.push(`/otp?email=${encodeURIComponent(formData.email)}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex bg-[#050505] text-white selection:bg-blue-500/30">
      
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16 relative order-2 lg:order-1">
        <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
          <Train className="w-6 h-6 text-white" />
          <span className="font-bold tracking-tight">IRCTC 2.0</span>
        </div>

        <div className="absolute top-8 right-8 text-sm text-gray-400 font-medium">
          Already a member?{' '}
          <Link href="/login" className="text-white hover:text-blue-400 transition-colors ml-1 border-b border-transparent hover:border-blue-400 pb-0.5">
            Sign in
          </Link>
        </div>

        <div className="w-full max-w-md mt-12 lg:mt-0">
          <div className="mb-10">
            <h2 className="text-3xl font-semibold mb-2">Join IRCTC 2.0</h2>
            <p className="text-gray-400 text-sm">Create an account to start booking tickets.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Full Name</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-[#111111] border border-[#222] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Email</label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-[#111111] border border-[#222] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                placeholder="john@example.com"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-[#111111] border border-[#222] rounded-xl px-4 py-3 pr-10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Retype</label>
                <div className="relative">
                  <input 
                    type={showRetypePassword ? "text" : "password"} 
                    required
                    value={formData.retypePassword}
                    onChange={(e) => setFormData({...formData, retypePassword: e.target.value})}
                    className="w-full bg-[#111111] border border-[#222] rounded-xl px-4 py-3 pr-10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowRetypePassword(!showRetypePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showRetypePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Security Question</label>
                <button type="button" onClick={generateCaptcha} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Reload</button>
              </div>
              <div className="flex gap-3">
                <div className="bg-[#111111] border border-[#222] rounded-xl px-4 py-3 flex-1 flex items-center justify-center font-mono text-gray-300">
                  {captchaQuestion} = ?
                </div>
                <input 
                  type="number" 
                  required
                  value={formData.captcha}
                  onChange={(e) => setFormData({...formData, captcha: e.target.value})}
                  className="w-1/2 bg-[#111111] border border-[#222] rounded-xl px-4 py-3 text-center text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
                  placeholder="Answer"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-white text-black hover:bg-gray-100 font-semibold py-4 rounded-xl transition-all duration-300 mt-6 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Creating Account...
                </span>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>

      {/* Right side - Branding & Image */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden order-1 lg:order-2">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541427468627-a89a96e5ca1d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-10000 hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-indigo-900/20 mix-blend-multiply" />
        
        <div className="relative z-10 flex flex-col justify-between p-16 w-full items-end text-right">
          <Link href="/" className="flex items-center gap-3 w-fit group">
            <span className="text-2xl font-bold tracking-tight">IRCTC 2.0</span>
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all">
              <Train className="w-6 h-6 text-white" />
            </div>
          </Link>

          <div className="max-w-md">
            <h1 className="text-5xl font-bold leading-tight mb-6 tracking-tight">
              Unlock the World.
            </h1>
            <p className="text-lg text-gray-300 font-light">
              Join thousands of travelers who use IRCTC 2.0 to explore destinations, book tickets effortlessly, and manage their trips.
            </p>
          </div>
        </div>
      </div>
      
    </main>
  );
}
