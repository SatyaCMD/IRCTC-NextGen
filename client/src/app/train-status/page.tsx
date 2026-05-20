'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Search, Loader2, Train, MapPin, Clock, Calendar, ArrowDown, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function TrainStatusPage() {
  const [trainNo, setTrainNo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const checkStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (trainNo.length < 4) {
      toast.error('Please enter a valid Train Number (e.g. 12951 or TR-3101).');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const res = await axios.get('http://localhost:5000/api/services');
      const trains = res.data.filter((s: any) => s.type === 'Train');
      
      const matchedTrain = trains.find((t: any) => t.trainNumber === trainNo);
      let trainName = trainNo.startsWith('TR-') ? 'SPECIAL CHARTER EXPRESS' : 'VANDE BHARAT EXP';

      if (matchedTrain) {
        trainName = matchedTrain.name;
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const todayIdx = new Date().getDay();
        const todayStr = daysOfWeek[todayIdx];
        const shortTodayStr = shortDays[todayIdx];

        const daysOfRun = matchedTrain.daysOfRun || [];
        const runsToday = daysOfRun.includes('Daily') || daysOfRun.includes(todayStr) || daysOfRun.includes(shortTodayStr) || daysOfRun.includes(todayStr.substring(0,3));

        if (!runsToday) {
           toast.error(`Train ${trainNo} (${trainName}) does not operate on ${todayStr}s.`);
           setIsLoading(false);
           return;
        }
      } else if (trainNo !== 'TR-3101') {
         toast.error(`Train ${trainNo} not found in schedule database.`);
         setIsLoading(false);
         return;
      }

      // Simulate API Call for Live Running Status
      setTimeout(() => {
        setIsLoading(false);

        const now = new Date();
        const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const isLate = Math.random() > 0.4; // 60% chance of being late
      const delayMinutes = isLate ? Math.floor(Math.random() * 120) + 15 : 0; 
      
      const formatTime = (h: number, m: number) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      const addMinutes = (timeStr: string, mins: number) => {
        const [h, m] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m + mins);
        return formatTime(date.getHours(), date.getMinutes());
      };

      const baseStations = [
        { name: 'New Delhi (NDLS)', time: '06:00' },
        { name: 'Agra Cantt (AGC)', time: '07:50' },
        { name: 'Gwalior (GWL)', time: '09:15' },
        { name: 'Bhopal Jn (BPL)', time: '13:10' },
        { name: 'Nagpur (NGP)', time: '17:30' },
        { name: 'Secunderabad (SC)', time: '23:45' }
      ];

      const currentTimeStr = formatTime(currentHour, currentMinute);
      let currentIndex = 0;
      
      for (let i = 0; i < baseStations.length; i++) {
        if (currentTimeStr >= baseStations[i].time) {
          currentIndex = i;
        }
      }

      const stations = baseStations.map((st, i) => {
        const actual = addMinutes(st.time, delayMinutes);
        let status = 'Expected';
        let isPassed = false;
        let isCurrent = false;

        if (i < currentIndex) {
          status = 'Departed';
          isPassed = true;
        } else if (i === currentIndex) {
          status = 'Arrived';
          isCurrent = true;
        }

        if (status === 'Expected') {
          return { ...st, actual: isLate ? actual : '--', status, isCurrent, isPassed };
        }
        
        return { ...st, actual, status, isCurrent, isPassed };
      });

      setResult({
        trainNo: trainNo,
        trainName: trainName,
        startDate: 'Today',
        currentStation: baseStations[currentIndex].name,
        status: isLate ? 'Delayed' : 'On Time',
        delay: isLate ? `Late by ${delayMinutes > 60 ? Math.floor(delayMinutes/60) + 'hr ' + (delayMinutes%60) + 'm' : delayMinutes + ' mins'}` : '0 mins',
        lastUpdated: 'Just now',
        stations
      });
      }, 1800);
    } catch (err) {
      toast.error('Failed to connect to IRCTC Train Database');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white pt-24 pb-12 font-sans selection:bg-orange-500/30">
      <Navbar />

      <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-10 fixed" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#050505]/90 to-[#050505] z-0 fixed" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 lg:px-8 mt-12">
        
        <div className="text-center mb-12">
          <div className="inline-flex p-3 bg-orange-500/10 text-orange-400 rounded-2xl border border-orange-500/20 mb-4 backdrop-blur-md">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 drop-shadow-xl">
            Live Train <span className="text-orange-500">Running Status</span>
          </h1>
          <p className="text-gray-400 text-lg">Track your train in real-time with pinpoint accuracy.</p>
        </div>

        {/* Search Box */}
        <form onSubmit={checkStatus} className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-2xl max-w-2xl mx-auto mb-12">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={trainNo}
                onChange={(e) => setTrainNo(e.target.value.toUpperCase())}
                maxLength={10}
                placeholder="Enter Train Number (e.g. 12951 or TR-3101)"
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 md:py-5 text-white text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:tracking-normal placeholder:font-sans"
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading || trainNo.length < 4}
              className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 md:py-5 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group whitespace-nowrap shadow-[0_0_20px_rgba(234,88,12,0.3)]"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Track Train'}
            </button>
          </div>
        </form>

        {/* Result Area */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-900/40 to-red-900/40 p-6 md:p-8 border-b border-white/10 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-orange-500 text-white font-bold font-mono px-3 py-1 rounded-lg text-sm">{result.trainNo}</span>
                    <h2 className="text-2xl font-black text-white">{result.trainName}</h2>
                  </div>
                  <p className="text-gray-400 text-sm flex items-center gap-2"><Calendar className="w-4 h-4"/> Started: {result.startDate}</p>
                </div>
                <div className="text-left md:text-right bg-black/40 p-4 rounded-2xl border border-white/5">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Current Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${result.status === 'Delayed' ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`} />
                    <span className={`text-xl font-bold ${result.status === 'Delayed' ? 'text-red-400' : 'text-emerald-400'}`}>{result.status}</span>
                  </div>
                  {result.status === 'Delayed' && <p className="text-red-300 text-xs font-bold mt-1">{result.delay}</p>}
                  <p className="text-gray-500 text-xs mt-1">Updated {result.lastUpdated}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-6 md:p-8">
              <h3 className="text-xl font-bold text-white mb-8 border-b border-white/10 pb-4">Live Route Map</h3>
              
              <div className="relative ml-4 md:ml-12 border-l-2 border-white/10 pb-8 space-y-10">
                {result.stations.map((station: any, i: number) => (
                  <div key={i} className="relative pl-8 md:pl-12">
                    {/* Node Dot */}
                    <div className={`absolute -left-[11px] top-1.5 w-5 h-5 rounded-full border-4 border-[#1a1d24] flex items-center justify-center
                      ${station.isCurrent ? 'bg-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.8)]' : 
                        station.isPassed ? 'bg-emerald-500' : 'bg-gray-600'}
                    `}>
                      {station.isCurrent && <div className="absolute inset-0 rounded-full bg-orange-400 animate-ping opacity-50" />}
                    </div>

                    <div className={`bg-black/30 p-4 rounded-2xl border ${station.isCurrent ? 'border-orange-500/30' : 'border-white/5'}`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <h4 className={`text-lg font-bold ${station.isCurrent ? 'text-orange-400' : station.isPassed ? 'text-white' : 'text-gray-500'}`}>
                            {station.name}
                          </h4>
                          <p className={`text-sm font-medium ${station.isPassed ? 'text-emerald-400' : 'text-gray-500'}`}>
                            {station.status}
                          </p>
                        </div>
                        
                        <div className="flex gap-6 mt-2 md:mt-0 text-left md:text-right">
                          <div>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Scheduled</p>
                            <p className="font-mono font-medium text-gray-300">{station.time}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Actual</p>
                            <p className="font-mono font-bold text-white">{station.actual}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
