'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ArrowRightLeft } from 'lucide-react';
import Cookies from 'js-cookie';
import LocationInput from '@/components/LocationInput';

export default function TrainSearch() {
  const router = useRouter();
  const [source, setSource] = useState('YPR - Yesvantpur Jn');
  const [destination, setDestination] = useState('SUR - Solapur Jn');
  const [date] = useState('Tue 27 Apr');
  const [ticketType, setTicketType] = useState('General');
  const [className, setClassName] = useState('All Classes');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login?redirect=auth-required');
      return;
    }
    router.push(`/search?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}`);
  };

  return (
    <form onSubmit={handleSearch} className="space-y-6">
      <div className="mb-2">
        <h2 className="text-xl font-medium text-white mb-6">Search for trains!</h2>
      </div>
      
      <div className="flex flex-col md:flex-row items-center gap-4 relative">
        <LocationInput 
          label="From" 
          value={source} 
          onChange={setSource} 
          type="Train" 
        />
        
        <div className="z-10 mt-6 bg-blue-600 rounded-full p-2 flex-shrink-0 cursor-pointer hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">
          <ArrowRightLeft className="w-5 h-5 text-white" />
        </div>
        
        <LocationInput 
          label="To" 
          value={destination} 
          onChange={setDestination} 
          type="Train" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
           <label className="text-xs text-gray-400 mb-1 block">Departure Date</label>
           <div className="relative">
             <input 
               type="date" 
               min={new Date().toISOString().split('T')[0]} 
               max={new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]} 
               className="input-field cursor-pointer" 
             />
           </div>
        </div>
        <div>
           <label className="text-xs text-gray-400 mb-1 block">Return Date</label>
           <div className="relative">
             <input 
               type="date" 
               min={new Date().toISOString().split('T')[0]} 
               max={new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]} 
               className="input-field cursor-pointer" 
             />
           </div>
        </div>
        <div>
           <label className="text-xs text-gray-400 mb-1 block">Quota</label>
           <select className="input-field appearance-none" value={ticketType} onChange={e => setTicketType(e.target.value)}>
             <option>General</option>
             <option>Tatkal</option>
             <option>Premium Tatkal</option>
             <option>Ladies</option>
           </select>
        </div>
        <div>
           <label className="text-xs text-gray-400 mb-1 block">Classes</label>
           <select className="input-field appearance-none" value={className} onChange={e => setClassName(e.target.value)}>
             <option>All Classes</option>
             <option>1AC</option>
             <option>2AC</option>
             <option>3AC</option>
             <option>Sleeper (SL)</option>
           </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center pt-4 border-t border-[#272a31] gap-4">
        <div className="flex flex-wrap gap-2">
          {['2A (160) Avbl', '3A (240) Avbl', 'SL (540) Avbl', 'GN (1) Avbl'].map(pill => (
            <span key={pill} className="text-xs font-medium bg-[#1f222a] border border-[#272a31] text-gray-300 px-3 py-1.5 rounded-full">
              {pill}
            </span>
          ))}
        </div>
        
        <button type="submit" className="btn-primary w-full md:w-auto px-10">
          Search trains
        </button>
      </div>
    </form>
  );
}
