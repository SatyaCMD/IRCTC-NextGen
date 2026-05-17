'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ArrowRightLeft } from 'lucide-react';
import Cookies from 'js-cookie';
import LocationInput from '@/components/LocationInput';

export default function TrainSearch({ defaultServiceType = 'Train' }: { defaultServiceType?: string }) {
  const router = useRouter();
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [date, setDate] = useState(tomorrow.toISOString().split('T')[0]);
  const [ticketType, setTicketType] = useState('General');
  const [className, setClassName] = useState('All Classes');

  const [serviceType, setServiceType] = useState(defaultServiceType);
  const serviceTypes = ['Train', 'Flights', 'Bus', 'Hill Railways', 'Charter Train', 'Tourist Train'];

  const handleServiceChange = (type: string) => {
    setServiceType(type);
    setSource('');
    setDestination('');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login?redirect=auth-required');
      return;
    }
    router.push(`/search?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(date)}&quota=${encodeURIComponent(ticketType)}&class=${encodeURIComponent(className)}&type=${encodeURIComponent(serviceType)}`);
  };

  const isHotel = defaultServiceType === 'Hotels' || defaultServiceType === 'Retiring Room';
  const isCatering = defaultServiceType === 'E Catering';
  const isHoliday = defaultServiceType === 'Holiday Packs';
  const isSpecialService = isHotel || isCatering || isHoliday;

  if (isSpecialService) {
    return (
      <form onSubmit={handleSearch} className="space-y-6">
        <div className="mb-2">
          <h2 className="text-xl font-medium text-white mb-6">Search for {defaultServiceType.toLowerCase()}!</h2>
        </div>
        
        {isHotel && (
          <>
            <div className="flex flex-col gap-4">
              <LocationInput label="City / Station" value={source} onChange={setSource} type={defaultServiceType} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Check-in Date</label>
                <div className="relative">
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="input-field cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Check-out Date</label>
                <div className="relative">
                  <input type="date" min={date} className="input-field cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Rooms</label>
                <select className="input-field appearance-none" value={ticketType} onChange={e => setTicketType(e.target.value)}>
                  <option>1 Room</option><option>2 Rooms</option><option>3 Rooms</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Guests</label>
                <select className="input-field appearance-none" value={className} onChange={e => setClassName(e.target.value)}>
                  <option>1 Guest</option><option>2 Guests</option><option>3 Guests</option><option>4 Guests</option>
                </select>
              </div>
            </div>
          </>
        )}

        {isCatering && (
          <>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 w-full relative group">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 block group-focus-within:text-blue-400 transition-colors">
                  PNR Number
                </label>
                <div className="relative flex items-center">
                  <input type="text" placeholder="Enter 10-digit PNR..." value={destination} onChange={e => setDestination(e.target.value)} maxLength={10} className="w-full bg-[#131418] border-2 border-[#272a31] rounded-2xl px-5 py-4 text-white text-lg font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none" />
                </div>
              </div>
              <div className="flex-1 w-full">
                <LocationInput label="Delivery Station" value={source} onChange={setSource} type="Train" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Delivery Date</label>
                <div className="relative">
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="input-field cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Meal Preference</label>
                <select className="input-field appearance-none" value={className} onChange={e => setClassName(e.target.value)}>
                  <option>All Types</option><option>Veg</option><option>Non-Veg</option><option>Jain</option>
                </select>
              </div>
            </div>
          </>
        )}

        {isHoliday && (
          <>
            <div className="flex flex-col gap-4">
              <LocationInput label="Destination" value={destination} onChange={setDestination} type="Train" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Departure Date</label>
                <div className="relative">
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="input-field cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Duration</label>
                <select className="input-field appearance-none" value={ticketType} onChange={e => setTicketType(e.target.value)}>
                  <option>1-3 Days</option><option>4-7 Days</option><option>8-14 Days</option><option>15+ Days</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Travelers</label>
                <select className="input-field appearance-none" value={className} onChange={e => setClassName(e.target.value)}>
                  <option>1 Traveler</option><option>2 Travelers</option><option>3-5 Travelers</option><option>6+ Travelers</option>
                </select>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end pt-4 border-t border-[#272a31]">
          <button type="submit" className="btn-primary w-full md:w-auto px-10">
            Search {defaultServiceType}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSearch} className="space-y-6">
      <div className="mb-4 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex space-x-2">
          {serviceTypes.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => handleServiceChange(type)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                serviceType === type 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'bg-[#131418] border border-[#272a31] text-gray-300 hover:bg-[#1a1c23]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-2">
        <h2 className="text-xl font-medium text-white mb-6">Search for {serviceType.toLowerCase()}!</h2>
      </div>
      
      <div className="flex flex-col md:flex-row items-center gap-4 relative">
        <LocationInput 
          label="From" 
          value={source} 
          onChange={setSource} 
          type={serviceType}
        />
        
        <div className="z-10 mt-6 bg-blue-600 rounded-full p-2 flex-shrink-0 cursor-pointer hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">
          <ArrowRightLeft className="w-5 h-5 text-white" />
        </div>
        
        <LocationInput 
          label="To" 
          value={destination} 
          onChange={setDestination} 
          type={serviceType}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
           <label className="text-xs text-gray-400 mb-1 block">Departure Date</label>
           <div className="relative">
             <input 
               type="date" 
               value={date}
               onChange={(e) => setDate(e.target.value)}
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
               min={date} 
               max={new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]} 
               className="input-field cursor-pointer" 
             />
           </div>
        </div>
        <div>
           <label className="text-xs text-gray-400 mb-1 block">Quota</label>
           <select className="input-field appearance-none" value={ticketType} onChange={e => setTicketType(e.target.value)}>
             {serviceType === 'Flights' && <><option>General</option><option>Armed Forces</option><option>Student</option><option>Senior Citizen</option></>}
             {serviceType === 'Bus' && <><option>General</option><option>Ladies</option></>}
             {serviceType === 'Hill Railways' && <><option>General</option><option>Tourist Quota</option></>}
             {(serviceType === 'Charter Train' || serviceType === 'Tourist Train') && <><option>General</option><option>Foreign Tourist</option></>}
             {serviceType === 'Train' && <><option>General</option><option>Tatkal</option><option>Premium Tatkal</option><option>Ladies</option><option>Divyangjan</option></>}
           </select>
        </div>
        <div>
           <label className="text-xs text-gray-400 mb-1 block">Classes</label>
           <select className="input-field appearance-none" value={className} onChange={e => setClassName(e.target.value)}>
             {serviceType === 'Flights' && <><option>All Classes</option><option>Economy</option><option>Premium Economy</option><option>Business</option><option>First Class</option></>}
             {serviceType === 'Bus' && <><option>All Classes</option><option>AC Seater</option><option>Non-AC Seater</option><option>Volvo AC Sleeper</option><option>Non-AC Sleeper</option></>}
             {serviceType === 'Hill Railways' && <><option>All Classes</option><option>First Class (FC)</option><option>Second Class (2S)</option><option>Vistadome</option></>}
             {(serviceType === 'Charter Train' || serviceType === 'Tourist Train') && <><option>All Classes</option><option>Deluxe Cabin</option><option>Junior Suite</option><option>Presidential Suite</option></>}
             {serviceType === 'Train' && <><option>All Classes</option><option>1AC</option><option>2AC</option><option>3AC</option><option>Sleeper (SL)</option></>}
           </select>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-[#272a31]">
        <button type="submit" className="btn-primary w-full md:w-auto px-10">
          Search
        </button>
      </div>
    </form>
  );
}
