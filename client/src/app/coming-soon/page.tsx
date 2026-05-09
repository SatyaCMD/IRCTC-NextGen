import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ComingSoon() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center pt-20 px-4">
        <div className="glass-card max-w-2xl w-full p-12 text-center border-t-4 border-blue-500/30 shadow-2xl">
          <div className="mb-6 inline-flex p-4 rounded-full bg-blue-500/10">
            <span className="text-4xl">🚀</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">Coming Soon</h1>
          <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
            We are working hard to bring this feature to life. Check back later to experience the Next Generation of IRCTC 2.0 services!
          </p>
          <a href="/" className="btn-primary inline-flex items-center px-8 text-base">
            Return to Home
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
