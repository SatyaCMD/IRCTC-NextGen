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
  
  const [trains, setTrains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    // Seed and fetch mock trains
    axios.post('http://localhost:5000/api/trains/seed').then(() => {
      axios.get(`http://localhost:5000/api/trains?source=${source}&destination=${destination}`)
        .then(res => {
          // If requestedType is Train, use API results, else ignore API trains
          let results = requestedType === 'Train' ? (res.data || []) : [];
          
          // Generate 18-25 mock services of the SPECIFIC requested type
          const targetCount = Math.floor(18 + Math.random() * 8);
          if (results.length < targetCount) {
            const mockServices = Array.from({ length: targetCount - results.length }).map((_, i) => {
              const type = requestedType;
              const idStr = Math.random().toString(36).substring(2, 8).toUpperCase();
              
              let prefix = 'TR';
              let name = '';
              let classes = [];

              const isRegretRoute = source.toLowerCase().includes('delhi') && destination.toLowerCase().includes('bhubanes');
              const getSeats = (base: number) => {
                 if (isRegretRoute) return -Math.floor(60 + Math.random() * 50); // -60 to -110 (Regret)
                 const random = Math.floor(Math.random() * 100);
                 if (random < 20) return -Math.floor(1 + Math.random() * 40); // 20% chance of Waitlist (-1 to -40)
                 return Math.floor(1 + Math.random() * base); // Available
              };

              if (type === 'Flight' || type === 'Flights') {
                prefix = 'FL';
                const airlines = ['IndiGo', 'Air India', 'Vistara', 'SpiceJet', 'Akasa Air', 'AirAsia India'];
                name = `${airlines[Math.floor(Math.random() * airlines.length)]} Express`;
                classes = [
                  { type: 'Economy', price: Math.floor(2500 + Math.random() * 3000), availableSeats: getSeats(50) },
                  { type: 'Premium Economy', price: Math.floor(4500 + Math.random() * 3000), availableSeats: getSeats(30) },
                  { type: 'Business', price: Math.floor(8000 + Math.random() * 10000), availableSeats: getSeats(15) },
                  { type: 'First Class', price: Math.floor(15000 + Math.random() * 20000), availableSeats: getSeats(5) }
                ];
              } else if (type === 'Bus') {
                prefix = 'BS';
                const busOperators = ['RedBus Express', 'VRL Travels', 'SRS Travels', 'IntrCity SmartBus', 'Orange Tours', 'Zingbus'];
                name = `${busOperators[Math.floor(Math.random() * busOperators.length)]}`;
                classes = [
                  { type: 'Non-AC Seater', price: Math.floor(300 + Math.random() * 400), availableSeats: getSeats(40) },
                  { type: 'AC Seater', price: Math.floor(600 + Math.random() * 500), availableSeats: getSeats(30) },
                  { type: 'Non-AC Sleeper', price: Math.floor(800 + Math.random() * 600), availableSeats: getSeats(20) },
                  { type: 'Volvo AC Sleeper', price: Math.floor(1200 + Math.random() * 1000), availableSeats: getSeats(15) }
                ];
              } else if (type === 'Hill Railways' || type === 'Hill Railway') {
                prefix = 'HR';
                const hillTrains = ['Himalayan Queen', 'Darjeeling Mail', 'Nilgiri Express', 'Kangra Valley Toy Train', 'Kalka Shatabdi'];
                name = `${hillTrains[Math.floor(Math.random() * hillTrains.length)]}`;
                classes = [
                  { type: 'Second Class (2S)', price: Math.floor(100 + Math.random() * 200), availableSeats: getSeats(50) },
                  { type: 'First Class (FC)', price: Math.floor(500 + Math.random() * 800), availableSeats: getSeats(20) },
                  { type: 'Vistadome', price: Math.floor(1200 + Math.random() * 1000), availableSeats: getSeats(10) }
                ];
              } else if (type === 'Charter Train' || type === 'Tourist Train') {
                prefix = type === 'Charter Train' ? 'CT' : 'TT';
                const specialTrains = ['Maharaja Express', 'Golden Chariot', 'Deccan Odyssey', 'Palace on Wheels', 'Fairy Queen', 'Bharat Gaurav'];
                name = `${specialTrains[Math.floor(Math.random() * specialTrains.length)]}`;
                classes = [
                  { type: 'Deluxe Cabin', price: Math.floor(50000 + Math.random() * 20000), availableSeats: getSeats(10) },
                  { type: 'Junior Suite', price: Math.floor(80000 + Math.random() * 30000), availableSeats: getSeats(5) },
                  { type: 'Presidential Suite', price: Math.floor(150000 + Math.random() * 50000), availableSeats: getSeats(2) }
                ];
              } else {
                // Standard Train
                const trainsList = ['Rajdhani Express', 'Shatabdi Express', 'Vande Bharat Express', 'Duronto Express', 'Garib Rath', 'Jan Shatabdi', 'Sampark Kranti', 'Humsafar Express'];
                name = `${trainsList[Math.floor(Math.random() * trainsList.length)]}`;
                classes = [
                  { type: '2S', price: Math.floor(150 + Math.random() * 150), availableSeats: getSeats(150) },
                  { type: 'SL', price: Math.floor(300 + Math.random() * 200), availableSeats: getSeats(200) },
                  { type: '3A', price: Math.floor(800 + Math.random() * 600), availableSeats: getSeats(100) },
                  { type: '2A', price: Math.floor(1200 + Math.random() * 800), availableSeats: getSeats(50) },
                  { type: '1A', price: Math.floor(2500 + Math.random() * 1500), availableSeats: getSeats(20) }
                ];
              }
              
              return {
                _id: `mock_${idStr}`,
                name: name,
                trainNumber: `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`,
                serviceType: type,
                source: source || 'Any Source',
                destination: destination || 'Any Destination',
                daysOfRun: ['Daily'],
                timings: {
                  departure: `${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
                  arrival: `${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
                  duration: `${Math.floor(1 + Math.random() * 20)}h ${Math.floor(Math.random() * 60)}m`
                },
                classes: classes
              };
            });
            results = [...results, ...mockServices];
          }
          
          setTrains(results);
          setLoading(false);
          fetchAIRecommendation(results);
        })
        .catch(err => {
          setLoading(false);
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, destination]);

  const fetchAIRecommendation = async (trainData: any) => {
    if (trainData.length === 0) return;
    setAiLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/trains/recommend', {
        source, destination,
        age: 30, gender: "Male", budget: "Medium", preferences: "Speed and comfort" // mock user pref
      });
      setAiRecommendation(res.data);
    } catch (err) {
      console.error(err);
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
                router.push(`/services/${typeSlug}?trainId=${train._id}&class=${encodeURIComponent(clsType)}&price=${price || ''}&source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(searchDate)}&departureTime=${encodeURIComponent(train.timings?.departure || '10:00')}`);
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
