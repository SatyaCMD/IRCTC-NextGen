import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import ServicesSection from '@/components/ServicesSection';
import HolidayPackages from '@/components/HolidayPackages';
import SupportBanner from '@/components/SupportBanner';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <Hero />
      <div className="relative z-20 w-full overflow-hidden whitespace-nowrap bg-red-600 shadow-xl shadow-red-600/20 py-2">
        <div className="animate-marquee inline-block text-white font-medium text-sm">
          <span className="mx-4">⚠️ Use of the website implies agreement to terms... </span>
          <span className="mx-4">COVID-19 guidelines for travel inside India have been revised.</span>
          <span className="mx-4">Ticket booking limit per month has been increased to 24 for Aadhaar verified users.</span>
        </div>
      </div>
      <ServicesSection />
      <HolidayPackages />
      <SupportBanner />
      <Footer />
    </main>
  );
}
