'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle2, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function HolidayPackages() {
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/services`);
        const activePackages = res.data.filter((s: any) => s.type === 'Package');
        setPackages(activePackages);
      } catch (err) {
        console.error('Failed to fetch packages', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPackages();
  }, []);



  return (
    <section className="py-20 px-4 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-white mb-12">Plan your next holiday</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {isLoading ? (
            <div className="col-span-3 flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : packages.length === 0 ? (
            <div className="col-span-3 text-center py-12 text-gray-400">
              No holiday packages are currently active.
            </div>
          ) : (
            packages.map((pkg, idx) => (
              <div key={pkg._id || idx} className="glass-card overflow-hidden hover:-translate-y-2 transition-transform duration-300 flex flex-col">
                <div className="h-48 w-full relative">
                  <img 
                    src={pkg.imgUrl} 
                    alt={pkg.name || pkg.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col items-center flex-grow text-center">
                  <h3 className="text-xl font-bold text-white mb-3">{pkg.name || pkg.title}</h3>
                  <p className="text-gray-400 text-sm mb-6 flex-grow">{pkg.description}</p>
                  <button 
                    onClick={() => setSelectedPackage(pkg)} 
                    className="btn-primary px-8 mt-auto"
                  >
                    Read more
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Overlay */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            
            <button 
              onClick={() => setSelectedPackage(null)} 
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="h-64 w-full relative flex-shrink-0">
              <img 
                src={selectedPackage.imgUrl} 
                alt={selectedPackage.name || selectedPackage.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent" />
              <h2 className="absolute bottom-6 left-8 text-3xl font-bold text-white drop-shadow-lg">
                {selectedPackage.name || selectedPackage.title}
              </h2>
            </div>

            <div className="p-8 overflow-y-auto">
              <h3 className="text-lg font-bold text-blue-400 mb-3 tracking-wide uppercase text-sm">Overview</h3>
              <p className="text-gray-300 leading-relaxed mb-8">
                {selectedPackage.fullDetails}
              </p>

              <h3 className="text-lg font-bold text-blue-400 mb-4 tracking-wide uppercase text-sm">Package Highlights</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedPackage.highlights.map((highlight: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-gray-200 text-sm font-medium">{highlight}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                <button 
                  onClick={() => setSelectedPackage(null)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
