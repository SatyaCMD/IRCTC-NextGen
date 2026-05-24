'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function SupportBanner() {
  const { user } = useAuth();
  const router = useRouter();

  const handleGetInTouch = () => {
    if (user) {
      router.push('/support');
    } else {
      router.push('/login?redirect=/support');
    }
  };

  return (
    <section className="relative h-96 my-20">
      <div 
        className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>
      </div>
      
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 flex flex-col justify-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white max-w-lg leading-tight mb-8">
          Have a question or need assistance? We&apos;re here to help.
        </h2>
        <div>
          <button 
            onClick={handleGetInTouch}
            className="btn-primary text-lg px-10"
          >
            Get in touch
          </button>
        </div>
      </div>
    </section>
  );
}
