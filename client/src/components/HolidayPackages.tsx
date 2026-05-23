'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';

const DEFAULT_PACKAGES = [
  {
    _id: "default-kashmir",
    type: "Package",
    name: "Kashmir Valley Retreat",
    imgUrl: "https://images.unsplash.com/photo-1566837430227-72377b63d919?q=80&w=1000",
    description: "Experience paradise on earth with our 5-day Kashmir valley tour including Srinagar, Gulmarg, and Pahalgam.",
    highlights: ["Srinagar Houseboat Stay", "Shikara Ride on Dal Lake", "Gulmarg Gondola Ride", "Pahalgam Valley Tour"],
    fullDetails: "Discover the unmatched beauty of Jammu & Kashmir. This package takes you through the romantic Dal Lake in Srinagar, the snow-covered meadows of Gulmarg, and the pristine Lidder River in Pahalgam. Includes premium stays, private transport, and local culinary experiences."
  },
  {
    _id: "default-kerala",
    type: "Package",
    name: "Kerala Backwaters Paradise",
    imgUrl: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?q=80&w=1000",
    description: "Relax in God's Own Country with a 4-day houseboat stay and cultural tour of Kerala.",
    highlights: ["Luxury Houseboat Cruise", "Kumarakom Bird Sanctuary", "Alleppey Backwater Tour", "Traditional Kathakali Show"],
    fullDetails: "Immerse yourself in the serene waterways of Kerala. Sail through emerald backwaters on a private luxury Kettuvallam (houseboat), enjoy fresh coconut water, explore spice plantations in Munnar, and experience the rich cultural heritage of Kochi."
  },
  {
    _id: "default-triangle",
    type: "Package",
    name: "Golden Triangle Heritage",
    imgUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=1000",
    description: "Discover the rich history of India exploring Delhi, Agra, and Jaipur over 6 magical days.",
    highlights: ["Taj Mahal Sunrise Tour", "Jaipur Amber Fort Visit", "Old Delhi Rickshaw Ride", "Qutub Minar & Red Fort Visit"],
    fullDetails: "Unveil the royal history of India with our signature Golden Triangle tour. Witness the pristine beauty of the Taj Mahal at sunrise, explore the majestic forts of the Pink City (Jaipur), and experience the vibrant markets and monuments of Old and New Delhi."
  },
  {
    _id: "default-rajasthan",
    type: "Package",
    name: "Royal Rajasthan Odyssey",
    imgUrl: "https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=1000",
    description: "A majestic 7-day journey through the blue city of Jodhpur and the romantic lake city of Udaipur.",
    highlights: ["Udaipur Lake Pichola Cruise", "Mehrangarh Fort Tour in Jodhpur", "Desert Safari in Jaisalmer", "Heritage Haveli Stays"],
    fullDetails: "Experience the regal lifestyle of Rajput kings. Visit Udaipur's iconic Lake Palace, walk the massive ramparts of Jodhpur's Mehrangarh Fort, and sleep under the stars in the golden sand dunes of Jaisalmer."
  },
  {
    _id: "default-varanasi",
    type: "Package",
    name: "Spiritual Varanasi & Ganges",
    imgUrl: "https://images.unsplash.com/photo-1561361531-99e224be4c2a?q=80&w=1000",
    description: "Experience the ancient spiritual heart of India with a 3-day sacred tour of Varanasi.",
    highlights: ["Subah-e-Banaras Boat Ride", "Ganga Aarti Ceremony", "Sarnath Buddhist Site Tour", "Weaving Village Visit"],
    fullDetails: "Journey to the oldest living city in the world. Witness the mesmerizing evening Ganga Aarti at Dashashwamedh Ghat, explore the narrow lanes filled with ancient temples, and visit Sarnath where Lord Buddha gave his first sermon."
  },
  {
    _id: "default-goa",
    type: "Package",
    name: "Goa Sun-Kissed Escape",
    imgUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000",
    description: "Unwind in the tropical paradise of Goa with premium beach resort stays and water sports.",
    highlights: ["5-Star Beach Resort", "Dudhsagar Waterfalls Trek", "Private Yacht Cruise", "Scuba Diving & Jet Skiing"],
    fullDetails: "Relax under the palm trees of North and South Goa. Enjoy pristine white-sand beaches, historical Portuguese churches, thrilling water activities, and vibrant beach shacks offering delicious seafood and music."
  },
  {
    _id: "default-ladakh",
    type: "Package",
    name: "Ladakh High Altitude Adventure",
    imgUrl: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=1000",
    description: "A thrilling 6-day tour of Leh, Nubra Valley, and the breathtaking Pangong Lake.",
    highlights: ["Pangong Tso Lake Camping", "Khardung La Pass Crossing", "Nubra Valley Camel Safari", "Magnetic Hill Experience"],
    fullDetails: "Travel to the land of high passes. Drive through Khardung La (one of the highest motorable roads in the world), ride double-humped camels in Nubra's sand dunes, and witness the color-changing waters of the high-altitude Pangong Lake."
  },
  {
    _id: "default-sikkim",
    type: "Package",
    name: "Sikkim & Darjeeling Himalayan Beauty",
    imgUrl: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=1000",
    description: "Explore the stunning tea gardens, monasteries, and viewpoints of the Eastern Himalayas.",
    highlights: ["Tiger Hill Sunrise over Kanchenjunga", "Darjeeling Toy Train Ride", "Tsomgo Lake Excursion", "Rumtek Monastery Visit"],
    fullDetails: "Discover the serene beauty of Northeast India. Watch the sunrise over Mt. Kanchenjunga, ride the UNESCO World Heritage Toy Train, and explore the tranquil monasteries and high-altitude lakes of Gangtok."
  },
  {
    _id: "default-andaman",
    type: "Package",
    name: "Andaman Tropical Wonder",
    imgUrl: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?q=80&w=1000",
    description: "A 5-day tropical getaway to Havelock and Neil islands with crystal clear waters.",
    highlights: ["Radhanagar Beach Sunset", "Coral Reef Snorkeling", "Havelock Island Scuba Diving", "Cellular Jail Sound & Light Show"],
    fullDetails: "Escape to the exotic Andaman and Nicobar Islands. Relax on Radhanagar Beach, rated as one of Asia's best, snorkel amidst colorful coral reefs at Elephant Beach, and explore the historic Cellular Jail in Port Blair."
  },
  {
    _id: "default-himachal",
    type: "Package",
    name: "Himachal Scenic Splendor",
    imgUrl: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=1000",
    description: "Journey through Shimla, Manali, and the Solang Valley over 6 days.",
    highlights: ["Solang Valley Paragliding", "Rohtang Pass Snow Tour", "Shimla Mall Road Walk", "Atal Tunnel Drive"],
    fullDetails: "Experience the crisp mountain air of Himachal Pradesh. Explore the colonial charm of Shimla, visit the lively town of Manali, go paragliding in Solang, and witness pristine snow at the high-altitude Rohtang Pass."
  },
  {
    _id: "default-ranthambore",
    type: "Package",
    name: "Ranthambore Wildlife Safari",
    imgUrl: "https://images.unsplash.com/photo-1602491453979-04de48866c2a?q=80&w=1000",
    description: "A thrilling 3-day wildlife expedition in Ranthambore National Park to spot Bengal Tigers.",
    highlights: ["Exclusive open-Jeep Safaris", "Ranthambore Fort Visit", "Luxury Jungle Lodge Stay", "Guided Nature Walk"],
    fullDetails: "Venture into the former hunting grounds of the Maharajas of Jaipur. Take deep-jungle safaris to observe Royal Bengal Tigers, leopards, and crocodiles in their natural habitat, and explore the ancient 10th-century Ranthambore Fort."
  },
  {
    _id: "default-munnar",
    type: "Package",
    name: "Munnar & Thekkady Hills",
    imgUrl: "https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?q=80&w=1000",
    description: "A lush 4-day trip to Munnar tea plantations and Periyar wildlife sanctuary.",
    highlights: ["Munnar Tea Museum Tour", "Periyar Lake Boat Safari", "Spice Plantation Walk", "Eravikulam National Park Visit"],
    fullDetails: "Indulge in the green hills of the Western Ghats. Breathe in the aroma of fresh tea leaves in Munnar, observe wild elephants and birds from a boat safari in Periyar Lake, and shop for exotic spices directly from organic farms in Thekkady."
  }
];

export default function HolidayPackages() {
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/services`);
        const activePackages = res.data.filter((s: any) => s.type === 'Package');
        // Merge fetched packages with default ones to ensure 10-15 active choices
        const merged = [...activePackages];
        DEFAULT_PACKAGES.forEach(def => {
          if (!merged.some(m => m.name === def.name)) {
            merged.push(def);
          }
        });
        setPackages(merged);
      } catch (err) {
        console.error('Failed to fetch packages, using fallbacks', err);
        setPackages(DEFAULT_PACKAGES);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const nextSlide = () => {
    if (packages.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % packages.length);
  };

  const prevSlide = () => {
    if (packages.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + packages.length) % packages.length);
  };

  // Infinite Circular Carousel logic: Slice exactly 3 elements starting at currentIndex
  const getVisiblePackages = () => {
    if (packages.length === 0) return [];
    if (packages.length <= 3) return packages;
    
    const items = [];
    for (let i = 0; i < 3; i++) {
      items.push(packages[(currentIndex + i) % packages.length]);
    }
    return items;
  };

  const visiblePackages = getVisiblePackages();

  return (
    <section className="py-24 px-4 bg-[#0a0a0a] relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-black text-center text-white tracking-tight mb-4 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Plan your next holiday
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Discover breathtaking destinations across India with premium amenities, handpicked hotels, and tailored experiences.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-lg border border-white/5 bg-white/5 rounded-3xl backdrop-blur-md">
            No holiday packages are currently active.
          </div>
        ) : (
          <div className="relative px-2 sm:px-12">
            
            {/* Carousel Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-500">
              {visiblePackages.map((pkg, idx) => (
                <div 
                  key={pkg._id || idx} 
                  className="glass-card overflow-hidden hover:-translate-y-3 transition-all duration-300 flex flex-col group relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl hover:shadow-blue-500/10"
                >
                  {/* Glowing hover state */}
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-500/0 via-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  {/* Image container */}
                  <div className="h-56 w-full relative overflow-hidden flex-shrink-0">
                    <img 
                      src={pkg.imgUrl} 
                      alt={pkg.name || pkg.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-8 flex flex-col items-center flex-grow text-center relative z-10">
                    <h3 className="text-2xl font-bold text-white mb-4 line-clamp-1 group-hover:text-blue-400 transition-colors">
                      {pkg.name || pkg.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-8 flex-grow leading-relaxed line-clamp-3">
                      {pkg.description}
                    </p>
                    <button 
                      onClick={() => setSelectedPackage(pkg)} 
                      className="btn-primary w-full py-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/20 group-hover:shadow-blue-500/30 flex items-center justify-center gap-2"
                    >
                      Read more
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Chevrons */}
            {packages.length > 3 && (
              <>
                {/* Left Button */}
                <button
                  onClick={prevSlide}
                  aria-label="Previous slide"
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:bg-blue-600 hover:border-blue-500 text-white flex items-center justify-center transition-all shadow-2xl hover:scale-110 active:scale-95 backdrop-blur-md z-20 group"
                >
                  <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
                </button>

                {/* Right Button */}
                <button
                  onClick={nextSlide}
                  aria-label="Next slide"
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:bg-blue-600 hover:border-blue-500 text-white flex items-center justify-center transition-all shadow-2xl hover:scale-110 active:scale-95 backdrop-blur-md z-20 group"
                >
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </>
            )}

            {/* Pagination Indicator Dots */}
            {packages.length > 3 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                {packages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      idx === currentIndex 
                        ? 'w-8 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' 
                        : 'w-2.5 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}

          </div>
        )}
      </div>

      {/* Package Detail Modal Overlay */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#111] border border-white/10 rounded-[2rem] w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            
            <button 
              onClick={() => setSelectedPackage(null)} 
              aria-label="Close details modal"
              className="absolute top-6 right-6 z-20 p-2.5 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Image banner */}
            <div className="h-72 w-full relative flex-shrink-0">
              <img 
                src={selectedPackage.imgUrl} 
                alt={selectedPackage.name || selectedPackage.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/30 to-transparent" />
              <h2 className="absolute bottom-6 left-8 right-8 text-3xl sm:text-4xl font-extrabold text-white drop-shadow-lg leading-tight">
                {selectedPackage.name || selectedPackage.title}
              </h2>
            </div>

            {/* Modal Content body */}
            <div className="p-8 overflow-y-auto space-y-8">
              <div>
                <h3 className="text-xs font-black text-blue-400 tracking-widest uppercase mb-3">Overview</h3>
                <p className="text-gray-300 leading-relaxed text-base font-light">
                  {selectedPackage.fullDetails}
                </p>
              </div>

              {selectedPackage.highlights && selectedPackage.highlights.length > 0 && (
                <div>
                  <h3 className="text-xs font-black text-blue-400 tracking-widest uppercase mb-4">Package Highlights</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedPackage.highlights.map((highlight: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <span className="text-gray-200 text-sm font-medium">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-white/10 flex justify-end">
                <button 
                  onClick={() => setSelectedPackage(null)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
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
