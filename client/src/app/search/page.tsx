'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import axios from 'axios';
import { Sparkles, Train as TrainIcon, Clock, MoveRight } from 'lucide-react';

function SearchResults() {
  const searchParams = useSearchParams();
  const source = searchParams.get('source') || '';
  const destination = searchParams.get('destination') || '';
  
  const [trains, setTrains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    // Seed and fetch mock trains
    axios.post('http://localhost:5000/api/trains/seed').then(() => {
      axios.get(`http://localhost:5000/api/trains?source=${source}&destination=${destination}`)
        .then(res => {
          setTrains(res.data);
          setLoading(false);
          fetchAIRecommendation(res.data);
        })
        .catch(err => setLoading(false));
    });
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
            <div className="text-white text-center py-10">Loading trains...</div>
          ) : trains.length > 0 ? (
            trains.map((train) => (
              <div key={train._id} className="glass-card p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1 flex items-center">
                      {train.name} <span className="text-sm text-gray-400 font-normal ml-2">({train.trainNumber})</span>
                    </h3>
                    <p className="text-sm text-gray-400">Runs On: {train.daysOfRun.join(', ')}</p>
                  </div>
                  <div className="flex items-center space-x-6 mt-4 md:mt-0 text-center">
                    <div>
                      <p className="text-lg font-bold text-white">{train.timings.departure}</p>
                      <p className="text-xs text-gray-400">{train.source}</p>
                    </div>
                    <div className="flex flex-col items-center">
                       <Clock className="w-4 h-4 text-gray-500 mb-1" />
                       <p className="text-xs text-gray-400">{train.timings.duration}</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{train.timings.arrival}</p>
                      <p className="text-xs text-gray-400">{train.destination}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  {train.classes.map((cls: any) => (
                    <div key={cls.type} className="border border-[#272a31] bg-[#1f222a] rounded-xl p-4 flex-1 min-w-[200px] cursor-pointer hover:border-blue-500 transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-white">{cls.type}</span>
                        <span className="text-blue-400 font-bold">₹{cls.price}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${cls.availableSeats > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {cls.availableSeats > 0 ? `AVAILABLE ${cls.availableSeats}` : 'WL 12'}
                        </span>
                        <button className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors">
                          Book Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 glass-card">
              <TrainIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl text-white font-medium">No Trains Found</h3>
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
