'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import axios from 'axios';
import { Sparkles, Train as TrainIcon, Clock, MoveRight, Plane, Bus, Mountain, Star, Calendar, Hotel, Utensils } from 'lucide-react';

function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get('source') || '';
  const destination = searchParams.get('destination') || '';
  const searchDate = searchParams.get('date') || '';
  const requestedType = searchParams.get('type') || 'Train';
  const requestedQuota = searchParams.get('quota') || 'General';
  
  const [trains, setTrains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedTrainForReviews, setSelectedTrainForReviews] = useState<any>(null);
  const [vegFilter, setVegFilter] = useState<'All' | 'Veg' | 'Non-Veg'>('All');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [cart, setCart] = useState<{ [trainId: string]: { [itemName: string]: { count: number, price: number } } }>({});
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setImgIdx(i => i + 1), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/trains/seed`).then(() => {
      axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/trains?source=${source}&destination=${destination}&type=${requestedType}`)
        .then(res => {
          let results = res.data;
          
          if (requestedType) {
             const rt = requestedType.toLowerCase();
             results = results.filter((r: any) => {
               const st = (r.serviceType || 'Train').toLowerCase();
               return st === rt || st + 's' === rt || st === rt + 's' || st + 'es' === rt || st === rt + 'es' || (st === 'bus' && rt === 'busses');
             });
          }

          if (searchDate) {
             const dateObj = new Date(searchDate);
             const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
             const fullDayMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
             const shortDay = daysMap[dateObj.getDay()];
             const longDay = fullDayMap[dateObj.getDay()];
             
             results = results.filter((r: any) => {
               if (!r.daysOfRun || r.daysOfRun.length === 0 || r.daysOfRun.includes('Daily')) return true;
               return r.daysOfRun.some((d: string) => d.includes(shortDay) || d.includes(longDay));
             });
          }
          
          setTrains(results);
          setLoading(false);
          fetchAIRecommendation(results);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, destination, requestedType]);

  const fetchAIRecommendation = async (trainData: any) => {
    if (trainData.length === 0) return;
    setAiLoading(true);
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/trains/recommend`, {
        source, destination,
        age: 30, gender: "Male", budget: "Medium", preferences: "Speed and comfort", // mock user pref
        trainData: trainData.slice(0, 5) // send the mock/fetched trains
      });
      setAiRecommendation(res.data);
    } catch (err) {
      console.error(err);
      setAiRecommendation(null);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] pt-24 pb-12">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4 text-white">
             <h1 className="text-2xl font-bold">{source || 'Any'}</h1>
             {!(requestedType === 'Hotels' || requestedType === 'Retiring Room') && (
               <>
                 <MoveRight className="w-6 h-6 text-gray-500" />
                 <h1 className="text-2xl font-bold">{destination || 'Any'}</h1>
               </>
             )}
             {searchDate && (
               <span className="ml-4 px-3 py-1 bg-white/10 rounded-full text-sm">
                 {searchDate} ({new Date(searchDate).toLocaleDateString('en-US', { weekday: 'long' })})
               </span>
             )}
          </div>
          
          {requestedType === 'E Catering' && (
             <div className="flex items-center bg-[#131418] border border-[#272a31] rounded-lg p-1">
                {(['All', 'Veg', 'Non-Veg'] as const).map(f => (
                   <button
                     key={f}
                     onClick={() => setVegFilter(f)}
                     className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${vegFilter === f ? (f === 'Veg' ? 'bg-green-600 text-white' : f === 'Non-Veg' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white') : 'text-gray-400 hover:text-white'}`}
                   >
                     {f}
                   </button>
                ))}
             </div>
          )}
        </div>

        {/* AI Recommendation Banner */}
        <div className="glass-card p-6 mb-8 border border-purple-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2 flex items-center">
                AI Smart Recommendation
                {aiLoading && <span className="ml-3 text-sm text-gray-400 animate-pulse font-normal">Analyzing suitability...</span>}
              </h2>
              {aiRecommendation ? (
                <div className="text-gray-300">
                  <p className="mb-2"><span className="text-white font-medium">Best Train:</span> {aiRecommendation.recommendedTrain}</p>
                  <p className="mb-2"><span className="text-white font-medium">Suggested Class & Seat:</span> {aiRecommendation.class} - {aiRecommendation.seatType}</p>
                  <p className="mb-2"><span className="text-white font-medium">Comfort Level:</span> <span className="text-green-400">{aiRecommendation.predictedComfortLevel}</span></p>
                  <p className="text-purple-300 text-sm italic">"{aiRecommendation.reason}"</p>
                </div>
              ) : (
                !aiLoading && <p className="text-gray-400">No recommendations available for this route.</p>
              )}
            </div>
          </div>
        </div>

        {/* Train List */}
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-6 h-48 animate-pulse flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-48 h-6 bg-white/10 rounded"></div>
                    <div className="w-32 h-6 bg-white/10 rounded"></div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-24 h-16 bg-white/10 rounded"></div>
                    <div className="w-24 h-16 bg-white/10 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : trains.length > 0 ? (
            trains
            .filter(t => {
               if (requestedType === 'E Catering') {
                  if (vegFilter === 'Veg') return t.vegType === 'Veg' || t.vegType === 'Both';
                  if (vegFilter === 'Non-Veg') return t.vegType === 'Non-Veg' || t.vegType === 'Both';
               }
               return true;
            })
            .map((train) => {
              const type = train.serviceType || 'Train';
              let Icon = TrainIcon;
              let iconColor = "text-blue-400";
              
              if (type === 'Flight' || type === 'Flights') { Icon = Plane; iconColor = "text-indigo-400"; }
              else if (type === 'Bus') { Icon = Bus; iconColor = "text-emerald-400"; }
              else if (type === 'Hill Railways' || type === 'Hill Railway') { Icon = Mountain; iconColor = "text-green-500"; }
              else if (type === 'Charter Train') { Icon = Star; iconColor = "text-yellow-400"; }
              else if (type === 'Tourist Train') { Icon = Calendar; iconColor = "text-pink-400"; }
              else if (type === 'Hotels' || type === 'Retiring Room') { Icon = Hotel; iconColor = "text-teal-400"; }
              else if (type === 'E Catering') { Icon = Utensils; iconColor = "text-orange-400"; }

              const handleBook = (clsType: string, price?: number) => {
                const typeSlug = type.toLowerCase().replace(/\s+/g, '-');
                router.push(`/services/${typeSlug}?trainId=${train._id}&class=${encodeURIComponent(clsType)}&price=${price || ''}&source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(searchDate)}&departureTime=${encodeURIComponent(train.timings?.departure || '10:00')}&quota=${encodeURIComponent(requestedQuota)}`);
              };

              // Determine if train has already departed today
              const now = new Date();
              const todayStr = now.toISOString().split('T')[0];
              const isToday = !searchDate || searchDate === todayStr;
              
              const currentHour = now.getHours();
              const currentMin = now.getMinutes();
              let isDeparted = false;
              let statusTag = 'Departed';
              
              if (type === 'E Catering' && train.timings?.arrival) {
                 const [closeHour, closeMin] = train.timings.arrival.split(':').map(Number);
                 const closeTime = new Date();
                 closeTime.setHours(closeHour, closeMin, 0, 0);
                 const diffMins = (closeTime.getTime() - now.getTime()) / (1000 * 60);
                 if (diffMins <= 10 && diffMins > 0) {
                     isDeparted = true;
                     statusTag = 'Closing Soon';
                 } else if (diffMins <= 0) {
                     isDeparted = true;
                     statusTag = 'Closed';
                 }
              } else if (isToday && train.timings?.departure) {
                 const [depHour, depMin] = train.timings.departure.split(':').map(Number);
                 if (currentHour > depHour || (currentHour === depHour && currentMin > depMin)) {
                    isDeparted = true;
                 }
              }

              return (
              <div key={train._id} className={`glass-card p-6 ${isDeparted ? 'opacity-80 grayscale-[20%]' : ''}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                      {train.name} <span className="text-sm text-gray-400 font-normal ml-2">({train.trainNumber})</span>
                      {isDeparted && <span className="ml-3 px-2 py-0.5 rounded text-[10px] font-black bg-red-500/20 text-red-500 uppercase tracking-widest border border-red-500/30">{statusTag}</span>}
                    </h3>
                    <p className="text-sm text-gray-400">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold mr-2 ${type === 'Flight' ? 'bg-indigo-500/20 text-indigo-400' : type === 'Bus' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {type}
                      </span>
                      {type === 'E Catering' ? (
                        <>Opens On: {train.daysOfRun?.join(', ') || 'Daily'}</>
                      ) : (type !== 'Hotels' && type !== 'Retiring Room' && type !== 'Holiday Packs') ? (
                        <>Runs On: {train.daysOfRun?.join(', ') || 'Daily'}</>
                      ) : null}
                    </p>
                  </div>
                  {type === 'Hotels' || type === 'Retiring Room' ? (
                    <div className="mt-4 md:mt-0 text-right">
                       <p className="text-sm font-bold text-white max-w-[200px] md:max-w-xs">{train.destination}</p>
                       <p className="text-xs text-blue-400 mt-1">Check-in: {train.timings?.departure} | Check-out: {train.timings?.arrival}</p>
                    </div>
                  ) : type === 'E Catering' ? (
                    <div className="mt-4 md:mt-0 text-right">
                       <p className="text-sm font-bold text-white max-w-[200px] md:max-w-xs">{train.destination}</p>
                       <p className="text-xs text-orange-400 mt-1">Delivery: {train.timings?.arrival} | {train.timings?.duration}</p>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-6 mt-4 md:mt-0 text-center">
                      <div>
                        <p className="text-lg font-bold text-white">{train.timings?.departure || '10:00'}</p>
                        <p className="text-xs text-gray-400">{train.source}</p>
                      </div>
                      <div className="flex flex-col items-center">
                         <Clock className="w-4 h-4 text-gray-500 mb-1" />
                         <p className="text-xs text-gray-400">{train.timings?.duration || '2h 30m'}</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">{train.timings?.arrival || '12:30'}</p>
                        <p className="text-xs text-gray-400">{train.destination}</p>
                      </div>
                    </div>
                  )}
                </div>

                {train.image && train.description && (() => {
                  const images = train.image.split(',');
                  return (
                  <div className="flex flex-col md:flex-row gap-6 mb-6 mt-4 p-4 bg-[#131418] border border-[#272a31] rounded-2xl hover:border-blue-500/50 transition-colors cursor-pointer group">
                    {images.length > 1 ? (
                      <div className="relative w-full md:w-56 h-40 overflow-hidden rounded-xl border border-white/5">
                        <img key={imgIdx} src={images[imgIdx % images.length]} alt={train.name} className="w-full h-full object-cover animate-[fade_1s_ease-in-out]" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                           {images.map((_: any, idx: number) => (
                              <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === (imgIdx % images.length) ? 'bg-white' : 'bg-white/30'}`} />
                           ))}
                        </div>
                      </div>
                    ) : (
                      <div className="relative overflow-hidden rounded-xl w-full md:w-56 h-40 border border-white/5">
                        <img src={images[0]} alt={train.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      </div>
                    )}
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="text-sm text-gray-300 leading-relaxed mb-4">{train.description}</p>
                      {train.rating && (
                        <div className="flex items-center gap-3">
                           <div className="flex items-center bg-green-500/20 text-green-400 px-2 py-1 rounded-lg text-sm font-bold border border-green-500/30">
                              <Star className="w-4 h-4 fill-current mr-1" /> {train.rating.toFixed(1)}
                           </div>
                           <span 
                             onClick={() => setSelectedTrainForReviews(train)}
                             className="text-sm text-blue-400 font-medium underline cursor-pointer hover:text-blue-300 transition-colors">
                             See {train.reviews} Reviews
                           </span>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })()}

                {type === 'E Catering' ? (
                   <div className="mt-2">
                     <button 
                        onClick={() => setActiveMenuId(activeMenuId === train._id ? null : train._id)}
                        className="w-full py-3 bg-orange-500/20 text-orange-400 font-bold rounded-xl hover:bg-orange-500/30 transition-colors"
                     >
                        {activeMenuId === train._id ? 'Hide Menu' : 'View Full Menu'}
                     </button>
                     {activeMenuId === train._id && (
                        <div className="mt-4 p-4 border border-[#272a31] bg-[#1a1c23] rounded-xl max-h-[500px] overflow-y-auto">
                           {train.menu?.map((category: any) => (
                              <div key={category.category} className="mb-6">
                                 <h4 className="text-lg font-bold text-white mb-3 pb-2 border-b border-[#272a31]">{category.category}</h4>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {category.items?.map((item: any) => {
                                       const count = cart[train._id]?.[item.name]?.count || 0;
                                       return (
                                          <div key={item.name} className="flex justify-between items-center p-3 bg-[#131418] rounded-lg border border-[#272a31]">
                                             <div>
                                                <div className="flex items-center gap-2">
                                                   <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${item.isVeg ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}><span className="w-1.5 h-1.5 rounded-full bg-current"></span></span>
                                                   <span className="text-sm font-medium text-white">{item.name}</span>
                                                </div>
                                                <p className="text-sm text-gray-400 mt-1">₹{item.price}</p>
                                             </div>
                                             {count > 0 ? (
                                                <div className="flex items-center gap-3 bg-blue-600/20 text-blue-400 rounded-lg px-2 py-1">
                                                   <button onClick={() => {
                                                      const n = count - 1;
                                                      setCart(prev => ({...prev, [train._id]: {...(prev[train._id] || {}), [item.name]: { count: n, price: item.price }}}));
                                                   }} className="px-2 font-bold">-</button>
                                                   <span className="font-bold">{count}</span>
                                                   <button onClick={() => {
                                                      const n = count + 1;
                                                      if (n > 6) return;
                                                      setCart(prev => ({...prev, [train._id]: {...(prev[train._id] || {}), [item.name]: { count: n, price: item.price }}}));
                                                   }} className="px-2 font-bold">+</button>
                                                </div>
                                             ) : (
                                                <button onClick={() => {
                                                   setCart(prev => ({...prev, [train._id]: {...(prev[train._id] || {}), [item.name]: { count: 1, price: item.price }}}));
                                                }} className="px-4 py-1.5 border border-orange-500 text-orange-500 rounded-lg text-sm font-bold hover:bg-orange-500/10">Add</button>
                                             )}
                                          </div>
                                       );
                                    })}
                                 </div>
                              </div>
                           ))}
                           
                           {/* Checkout Bar */}
                           {Object.values(cart[train._id] || {}).some(i => i.count > 0) && (
                              <div className="sticky bottom-0 bg-[#272a31] p-4 rounded-xl flex justify-between items-center shadow-2xl border border-white/10 mt-4">
                                 <div>
                                    <p className="text-sm text-gray-400">Total Amount</p>
                                    <p className="text-xl font-bold text-white">
                                       ₹{Object.values(cart[train._id] || {}).reduce((acc, curr) => acc + (curr.count * curr.price), 0)}
                                    </p>
                                 </div>
                                 <button onClick={() => {
                                    const total = Object.values(cart[train._id] || {}).reduce((acc, curr) => acc + (curr.count * curr.price), 0);
                                    handleBook('E-Catering Menu Order', total);
                                 }} className="bg-orange-500 hover:bg-orange-400 text-white px-6 py-2 rounded-lg font-bold">
                                    Place Order
                                 </button>
                              </div>
                           )}
                        </div>
                     )}
                   </div>
                ) : (
                   <div className="flex flex-wrap gap-4">
                     {train.classes?.map((cls: any) => {
                       const effectiveAvailability = isDeparted ? -100 : cls.availableSeats;
                       const isRegret = effectiveAvailability < -50;

                       return (
                       <div key={cls.type} className={`border border-[#272a31] bg-[#1f222a] rounded-xl p-4 flex-1 min-w-[200px] transition-colors ${isRegret ? 'opacity-80' : 'cursor-pointer hover:border-blue-500'} group/cls relative`}>
                         <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-xs text-white px-3 py-1.5 rounded-lg opacity-0 group-hover/cls:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none border border-white/10 shadow-xl">
                           {cls.type === '1A' ? 'First Class AC' : 
                            cls.type === '2A' ? 'Second AC (2-Tier)' : 
                            cls.type === '3A' ? 'Third AC (3-Tier)' : 
                            cls.type === 'SL' ? 'Sleeper Class (Non-AC)' : 
                            cls.type === '2S' ? 'Second Seater (Non-AC)' : 
                            cls.type === 'CC' ? 'AC Chair Car' : 
                            cls.type === 'EC' ? 'Executive Chair Car' : 
                            cls.type === 'Economy' ? 'Standard Economy' : 
                            cls.type === 'Business' ? 'Business Class' : `${cls.type} Class`}
                         </div>
                         <div className="flex justify-between items-center mb-2">
                           <span className="font-bold text-white">{cls.type}</span>
                           <span className="text-blue-400 font-bold">₹{Math.round(cls.price)}</span>
                         </div>
                         <div className="flex justify-between items-center">
                           <span className={`text-sm font-bold ${effectiveAvailability > 0 ? 'text-green-400' : isRegret ? 'text-red-500' : 'text-orange-400'}`}>
                             {effectiveAvailability > 0 
                               ? `AVAILABLE ${effectiveAvailability}` 
                               : isRegret 
                                 ? 'REGRET' 
                                 : `WL ${Math.abs(effectiveAvailability)}`}
                           </span>
                           <button 
                             onClick={() => handleBook(cls.type, cls.price)}
                             disabled={isRegret}
                             className={`text-xs text-white px-3 py-1.5 rounded-lg transition-colors ${isRegret ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-500'}`}
                           >
                             {isRegret ? 'Unavailable' : 'Book Now'}
                           </button>
                         </div>
                       </div>
                     )})}
                   </div>
                )}
              </div>
            )})
          ) : (
            <div className="text-center py-20 glass-card">
              <TrainIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl text-white font-medium">No Services Found</h3>
              <p className="text-gray-400">Try changing your search route or date.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Modal */}
      {selectedTrainForReviews && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1f222a] border border-[#272a31] rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedTrainForReviews.name} Reviews</h3>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center bg-green-500/20 text-green-400 px-2 py-1 rounded-lg text-sm font-bold">
                    <Star className="w-4 h-4 fill-current mr-1" /> {selectedTrainForReviews.rating?.toFixed(1) || '0.0'}
                  </div>
                  <span className="text-gray-400 text-sm">Based on {selectedTrainForReviews.reviews} reviews</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTrainForReviews(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {selectedTrainForReviews.reviewsList && selectedTrainForReviews.reviewsList.length > 0 ? (
                selectedTrainForReviews.reviewsList.map((review: any, idx: number) => (
                  <div key={idx} className="bg-[#131418] p-4 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-white">{review.user}</span>
                      <div className="flex items-center text-yellow-400 text-sm">
                        <Star className="w-4 h-4 fill-current mr-1" /> {review.rating}
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{review.comment}</p>
                    <span className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString()}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>No reviews yet for this service.</p>
                  <p className="text-sm mt-2">Be the first to leave a review after your stay!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f1115] text-white flex items-center justify-center">Loading search...</div>}>
      <SearchResults />
    </Suspense>
  )
}
