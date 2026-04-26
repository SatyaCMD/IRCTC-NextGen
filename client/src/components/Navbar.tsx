import Link from 'next/link';
import { Train, Menu } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0f1115]/80 backdrop-blur-md border-b border-[#272a31]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Train className="h-8 w-8 text-blue-500" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">RailAI</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">Trains</Link>
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">Food</Link>
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">Ask Disha<span className="ml-1 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">AI</span></Link>
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">Rooms</Link>
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">Other services</Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login" className="text-gray-300 hover:text-white font-medium">Register</Link>
            <Link href="/login" className="btn-primary">Login</Link>
          </div>
          
          <div className="md:hidden">
            <Menu className="h-6 w-6 text-gray-300" />
          </div>
        </div>
      </div>
    </nav>
  );
}
