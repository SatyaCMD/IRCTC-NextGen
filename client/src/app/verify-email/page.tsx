'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');
  const router = useRouter();
  
  useEffect(() => {
    // Read token from URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Token is missing.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/auth/verify-email/${token}`, {
          method: 'GET'
        });
        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Email successfully verified! You can now log in.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to verify email. The link may have expired.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('A network error occurred while verifying your email.');
      }
    };

    verifyEmail();
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] pt-24 pb-12 flex items-center justify-center relative selection:bg-blue-500/30">
      <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1541427468627-a89a96e5ca1d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
      
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-[#111] border border-white/10 rounded-[2rem] p-8 md:p-10 text-center shadow-2xl relative overflow-hidden">
          
          {/* Top accent line */}
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${status === 'success' ? 'from-emerald-400 to-teal-500' : status === 'error' ? 'from-red-500 to-rose-600' : 'from-blue-500 to-indigo-600'}`} />
          
          <div className="flex justify-center mb-6">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border shadow-lg transition-all ${
              status === 'loading' ? 'bg-blue-500/10 border-blue-500/30' : 
              status === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 
              'bg-red-500/10 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
            }`}>
              {status === 'loading' && <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />}
              {status === 'success' && <CheckCircle2 className="w-10 h-10 text-emerald-400" />}
              {status === 'error' && <XCircle className="w-10 h-10 text-red-400" />}
            </div>
          </div>
          
          <h2 className="text-3xl font-black text-white mb-4 tracking-tight">
            {status === 'loading' ? 'Verifying Email' : status === 'success' ? 'Account Verified' : 'Verification Failed'}
          </h2>
          
          <p className={`text-sm mb-8 font-medium ${status === 'error' ? 'text-red-400' : 'text-gray-400'}`}>
            {message}
          </p>

          {(status === 'success' || status === 'error') && (
            <Link 
              href="/login"
              className={`w-full font-bold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg ${
                status === 'success' 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              Return to Login
            </Link>
          )}

        </div>
      </div>
    </main>
  );
}
