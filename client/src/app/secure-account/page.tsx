'use client';

import { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldAlert, AlertTriangle, Loader2, Home, ArrowRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

function SecureAccountContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Securing your account, please wait...');

  useEffect(() => {
    const lockAccount = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid or missing security token. If your account is compromised, please contact customer support immediately.');
        toast.error('Invalid or missing security token.');
        return;
      }

      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/secure-account?token=${token}`);
        setStatus('success');
        setMessage(res.data.message || 'Your account has been successfully secured and suspended! Future logins are blocked until security review.');
        toast.success('Account secured successfully!', {
          duration: 6000,
          icon: '🔒',
        });
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Failed to secure account. The token may be expired or invalid.');
        toast.error(err.response?.data?.error || 'Failed to secure account.');
      }
    };

    lockAccount();
  }, [token]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 sm:p-12 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />

      {status === 'loading' && (
        <div className="text-center space-y-6 py-8">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-red-500/20 rounded-full" />
            <Loader2 className="w-20 h-20 text-red-500 animate-spin absolute inset-0" />
          </div>
          <h2 className="text-2xl font-bold text-white">Verifying Security Token</h2>
          <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
            We are validating your secure action request and communicating with our live database. Please do not close or refresh this window.
          </p>
        </div>
      )}

      {status === 'success' && (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/10 animate-in zoom-in duration-300">
            <ShieldCheck className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-extrabold text-white">Account Locked & Secured</h2>
          <p className="text-gray-300 text-base leading-relaxed max-w-md mx-auto">
            {message}
          </p>
          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-5 text-emerald-300 text-sm leading-relaxed text-left">
            <strong>🔒 Security Actions Applied:</strong>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-emerald-200/80">
              <li>Password modification access revoked.</li>
              <li>All active browser and mobile sessions terminated.</li>
              <li>Account status set to <strong>Suspended</strong>.</li>
              <li>All automatic 2FA SMS and email codes blocked.</li>
            </ul>
          </div>
          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row gap-4">
            <Link
              href="/"
              className="flex-1 btn-primary py-4 px-6 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/15 text-white transition-all border border-white/10 flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" /> Go to Home
            </Link>
            <Link
              href="/login"
              className="flex-1 btn-primary py-4 px-6 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-500 text-white transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
            >
              Contact Support <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-red-500/10 animate-in zoom-in duration-300">
            <AlertTriangle className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-extrabold text-white">Action Verification Failed</h2>
          <p className="text-red-200/80 text-base leading-relaxed max-w-md mx-auto">
            {message}
          </p>
          <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-5 text-red-300 text-sm leading-relaxed text-left">
            <strong>💡 Why did this happen?</strong>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-red-200/80">
              <li>The link may have already been used.</li>
              <li>The security token expired (expires after 7 days).</li>
              <li>The email address was modified or deleted.</li>
            </ul>
          </div>
          <div className="pt-6 border-t border-white/5">
            <Link
              href="/"
              className="w-full btn-primary py-4 px-6 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/15 text-white transition-all border border-white/10 flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" /> Go to Home Page
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SecureAccountPage() {
  return (
    <div className="min-h-screen bg-[#070708] flex items-center justify-center px-4 py-12 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 bg-red-500/10 border border-red-500/20 px-6 py-2.5 rounded-full mb-6 backdrop-blur-md">
            <ShieldAlert className="w-5 h-5 text-red-500 animate-bounce" />
            <span className="text-red-200 text-sm font-semibold tracking-wide uppercase">Security Action Desk</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            IRCTC <span className="bg-gradient-to-r from-red-500 via-orange-400 to-yellow-500 bg-clip-text text-transparent">NextGen</span>
          </h1>
        </div>

        <Suspense fallback={
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 sm:p-12 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center py-16 text-white space-y-4">
            <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
            <p className="text-gray-400">Loading Secure Action Desk...</p>
          </div>
        }>
          <SecureAccountContent />
        </Suspense>
      </div>
    </div>
  );
}
