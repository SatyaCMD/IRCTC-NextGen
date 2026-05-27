import TrainSearch from '@/components/TrainSearch';

export default function Hero() {
  return (
    <div className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-20">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1115]/90 via-[#0f1115]/60 to-[#0f1115]"></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 flex flex-col items-center mt-12">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 text-center tracking-tight flex items-center justify-center gap-2 md:gap-3 flex-wrap">
          <span>Welcome to</span>
          <span className="inline-flex items-center justify-center mx-1">
            <style>{`
              @keyframes premium-flag-wave {
                0% { transform: translateY(0px) rotate(0deg) scale(1); }
                50% { transform: translateY(-3px) rotate(1.2deg) scale(1.03); }
                100% { transform: translateY(0px) rotate(0deg) scale(1); }
              }
              .premium-flag {
                animation: premium-flag-wave 3.5s ease-in-out infinite;
                transform-origin: left center;
              }
            `}</style>
            <img 
              src="/flag.svg" 
              alt="🇮🇳" 
              className="premium-flag w-12 h-8 md:w-16 md:h-11 object-cover rounded-lg hover:scale-110 transition-transform duration-300 drop-shadow-[0_6px_16px_rgba(0,0,0,0.5)] select-none border border-white/20" 
              loading="eager"
            />
          </span>
          <span>Indian Railways</span>
        </h1>

        <div className="w-full max-w-4xl bg-[#181a20]/80 backdrop-blur-xl border border-[#272a31] rounded-3xl p-6 md:p-8 shadow-2xl">
          <TrainSearch />
        </div>
      </div>

      {/* Decorative Grid at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3Ryb2tlPSIjMjcyYTMxIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiPjxwYXRoIGQ9Ik0wIDQwaDQwVDB6Ii8+PC9nPjwvc3ZnPg==')] opacity-20 pointer-events-none"></div>
    </div>
  );
}
