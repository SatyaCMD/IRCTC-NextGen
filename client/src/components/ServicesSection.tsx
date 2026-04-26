import { Plane, Hotel, Utensils, Bus, Bed, Train } from 'lucide-react';

const services = [
  { name: 'Flights', icon: Plane },
  { name: 'Hotels', icon: Hotel },
  { name: 'Retiring Room', icon: Bed },
  { name: 'E-catering', icon: Utensils },
  { name: 'Bus', icon: Bus },
  { name: 'Holiday packs', icon: Plane },
  { name: 'Tourist Train', icon: Train },
  { name: 'Hill Railways', icon: Train },
  { name: 'Charter Train', icon: Train }
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
              <div 
                key={idx} 
                className="w-40 h-40 glass-card flex flex-col items-center justify-center p-6 cursor-pointer hover:-translate-y-2 hover:bg-[#1f222a] transition-all duration-300"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-500/10 mb-4">
                   <Icon className="w-6 h-6 text-gray-300" />
                </div>
                <span className="text-sm font-medium text-gray-300 text-center">{service.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
