'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { stations, airports, cities } from '@/lib/locations';

type LocationType = 'Train' | 'Flight' | 'City';

interface LocationInputProps {
  value: string;
  onChange: (val: string) => void;
  label: string;
  placeholder?: string;
  type?: LocationType;
}

export default function LocationInput({ value, onChange, label, placeholder, type = 'Train' }: LocationInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Select the appropriate dataset
  const dataset = type === 'Train' ? stations : type === 'Flight' ? airports : cities;
  
  // Filter based on input
  const filteredOptions = dataset.filter(option => 
    option.toLowerCase().includes(value.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full relative" ref={wrapperRef}>
      <label className="text-xs text-gray-400 mb-1 block">{label}</label>
      <div className="relative">
        {/* If type is train and value matches format "CODE - Name", show CODE floating */}
        {type === 'Train' && value.includes(' - ') && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-300 w-8 z-10 pointer-events-none">
            {value.split(' - ')[0]}
          </span>
        )}
        <input 
          type="text" 
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className={`input-field w-full ${type === 'Train' && value.includes(' - ') ? 'pl-16' : 'pl-4'}`}
          placeholder={placeholder || "Enter location..."}
        />
        <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
      </div>

      {/* Custom Dropdown */}
      {isOpen && filteredOptions.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-[#111]/95 backdrop-blur-xl border border-white/10 rounded-xl max-h-60 overflow-y-auto shadow-[0_10px_40px_rgba(0,0,0,0.5)] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent divide-y divide-white/5">
          {filteredOptions.map((option, idx) => (
            <li 
              key={idx}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className="px-4 py-3 hover:bg-blue-500/20 cursor-pointer transition-colors text-white text-sm flex items-center gap-3"
            >
              <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>{option}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
