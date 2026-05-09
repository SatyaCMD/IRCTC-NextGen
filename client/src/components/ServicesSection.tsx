import { Plane, Hotel, Utensils, Bus, Bed, Train } from 'lucide-react';

import Link from 'next/link';

const services = [
  { name: 'Flights', icon: Plane, path: '/services/flights' },
  { name: 'Hotels', icon: Hotel, path: '/services/hotels' },
  { name: 'Retiring Room', icon: Bed, path: '/services/retiring-room' },
  { name: 'E-catering', icon: Utensils, path: '/services/e-catering' },
  { name: 'Bus', icon: Bus, path: '/services/bus' },
  { name: 'Holiday packs', icon: Plane, path: '/services/holiday-packs' },
  { name: 'Tourist Train', icon: Train, path: '/services/tourist-train' },
  { name: 'Hill Railways', icon: Train, path: '/services/hill-railways' },
  { name: 'Charter Train', icon: Train, path: '/services/charter-train' }
];

export default function ServicesSection() {
  return (
    <section className="py-20 px-4 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-white mb-12">Our other popular services</h2>
        
        <div className="flex flex-wrap justify-center gap-6">
          {services.map((service, idx) => {
            const Icon = service.icon;
            return (
              <Link 
                key={idx}
                href={service.path}
                className="w-36 h-36 bg-[#131418] border border-[#272a31] rounded-2xl flex flex-col items-center justify-center p-6 cursor-pointer hover:border-gray-500 hover:-translate-y-1 transition-all duration-300 shadow-xl"
              >
                <div className="mb-4">
                   <Icon className="w-8 h-8 text-blue-400 font-light" strokeWidth={1} />
                </div>
                <span className="text-[13px] font-medium text-gray-300 text-center tracking-wide">{service.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
