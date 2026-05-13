'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import axios from 'axios';
import { Sparkles, Train as TrainIcon, Clock, MoveRight, Plane, Bus, Mountain, Star, Calendar } from 'lucide-react';

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

  useEffect(() => {
    // Seed and fetch real/generated multi-modal services from the DB
    axios.post('http://localhost:5000/api/trains/seed').then(() => {
      axios.get(`http://localhost:5000/api/trains?source=${source}&destination=${destination}`)
        .then(res => {
          let results = res.data;
          
          // Optionally filter by requestedType if needed, or just show all
          if (requestedType && requestedType !== 'Train') {
             results = results.filter((r: any) => r.serviceType === requestedType);
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
      const res = await axios.post('http://localhost:5000/api/trains/recommend', {
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
        <div className="flex items-center space-x-4 mb-8 text-white">
           <h1 className="text-2xl font-bold">{source || 'Any'}</h1>
           <MoveRight className="w-6 h-6 text-gray-500" />
           <h1 className="text-2xl font-bold">{destination || 'Any'}</h1>
           {searchDate && <span className="ml-4 px-3 py-1 bg-white/10 rounded-full text-sm">{searchDate}</span>}
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
            <div className="text-white text-center py-10">Searching routes...</div>
          ) : trains.length > 0 ? (
            trains.map((train) => {
              const type = train.serviceType || 'Train';
              let Icon = TrainIcon;
              let iconColor = "text-blue-400";
              
              if (type === 'Flight' || type === 'Flights') { Icon = Plane; iconColor = "text-indigo-400"; }
              else if (type === 'Bus') { Icon = Bus; iconColor = "text-emerald-400"; }
              else if (type === 'Hill Railways' || type === 'Hill Railway') { Icon = Mountain; iconColor = "text-green-500"; }
              else if (type === 'Charter Train') { Icon = Star; iconColor = "text-yellow-400"; }
              else if (type === 'Tourist Train') { Icon = Calendar; iconColor = "text-pink-400"; }

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
              
              if (isToday && train.timings?.departure) {
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
                      {isDeparted && <span className="ml-3 px-2 py-0.5 rounded text-[10px] font-black bg-red-500/20 text-red-500 uppercase tracking-widest border border-red-500/30">Departed</span>}
                    </h3>
                    <p className="text-sm text-gray-400">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold mr-2 ${type === 'Flight' ? 'bg-indigo-500/20 text-indigo-400' : type === 'Bus' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {type}
                      </span>
                      Runs On: {train.daysOfRun?.join(', ') || 'Daily'}
                    </p>
                  </div>
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
                </div>

                <div className="flex flex-wrap gap-4">
                  {train.classes?.map((cls: any) => {
                    const effectiveAvailability = isDeparted ? -100 : cls.availableSeats;
                    const isRegret = effectiveAvailability < -50;

                    return (
                    <div key={cls.type} className={`border border-[#272a31] bg-[#1f222a] rounded-xl p-4 flex-1 min-w-[200px] transition-colors ${isRegret ? 'opacity-80' : 'cursor-pointer hover:border-blue-500'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-white">{cls.type}</span>
                        <span className="text-blue-400 font-bold">₹{cls.price}</span>
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
