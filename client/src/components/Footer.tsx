import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#181a20] border-t border-[#272a31] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div>
          <h3 className="text-xl font-bold text-white mb-6">IRCTC 2.0</h3>
          <p className="text-gray-400 text-sm">
            Next generation AI-powered Indian Railways clone. Bringing modern design and intelligence to your train booking experience.
          </p>
        </div>
        <div>
          <h4 className="text-white font-medium mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link href="/search" className="hover:text-blue-500 transition-colors">Search Trains</Link></li>
            <li><Link href="/pnr-status" className="hover:text-blue-500 transition-colors">PNR Status</Link></li>
            <li><Link href="/train-status" className="hover:text-blue-500 transition-colors">Train Running Status</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-medium mb-4">Services</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link href="/services/e-catering" className="hover:text-blue-500 transition-colors">E-Catering</Link></li>
            <li><Link href="/services/retiring-rooms" className="hover:text-blue-500 transition-colors">Retiring Rooms</Link></li>
            <li><Link href="/services/premium-tatkal" className="hover:text-blue-500 transition-colors">Premium Tatkal</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-medium mb-4">Contact</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>1800-111-139</li>
            <li>care@irctc2.co.in</li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 text-center border-t border-[#272a31] pt-8">
         <p className="text-gray-500 text-sm">© 2026 IRCTC 2.0 Booking Platform. Inspired by IRCTC. For demo purposes only.</p>
      </div>
    </footer>
  );
}
