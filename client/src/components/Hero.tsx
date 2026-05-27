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
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 text-center tracking-tight">
          Welcome to <span className="inline-block mx-2 align-middle">
            <svg className="w-14 h-10 inline-block align-middle shadow-lg hover:scale-105 transition-transform duration-300" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
              <style>{`
                @keyframes flag-float {
                  0% { transform: translateY(0px) rotate(0deg); }
                  50% { transform: translateY(-1.5px) rotate(0.8deg); }
                  100% { transform: translateY(0px) rotate(0deg); }
                }
                .flag-waving {
                  animation: flag-float 3s ease-in-out infinite;
                  transform-origin: left center;
                }
              `}</style>
              <defs>
                <linearGradient id="wave-shadow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="black" stopOpacity="0.35" />
                  <stop offset="25%" stopColor="white" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="black" stopOpacity="0.4" />
                  <stop offset="75%" stopColor="white" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="black" stopOpacity="0.35" />
                </linearGradient>
                <clipPath id="flag-clip">
                  <path d="M 0 0 C 30 10, 60 -10, 120 0 L 120 75 C 60 65, 30 85, 0 75 Z" />
                </clipPath>
              </defs>
              <g clipPath="url(#flag-clip)" className="flag-waving">
                <path d="M 0 0 C 30 10, 60 -10, 120 0 L 120 27 C 60 17, 30 37, 0 27 Z" fill="#FF9933" />
                <path d="M 0 27 C 30 37, 60 17, 120 27 L 120 53 C 60 43, 30 63, 0 53 Z" fill="#FFFFFF" />
                <path d="M 0 53 C 30 63, 60 43, 120 53 L 120 80 C 60 70, 30 90, 0 80 Z" fill="#138808" />
                <g transform="translate(60, 40) scale(0.12)">
                  <circle r="92" fill="none" stroke="#000080" stroke-width="6" />
                  <circle r="16" fill="#000080" />
                  <path d="M 0 0 L 0 -92 M 0 0 L 0 92 M 0 0 L -92 0 M 0 0 L 92 0 M 0 0 L -46 -80 M 0 0 L 46 80 M 0 0 L -80 -46 M 0 0 L 80 46 M 0 0 L -80 46 M 0 0 L 80 -46 M 0 0 L -46 80 M 0 0 L 46 -80 M 0 0 L -24 -89 M 0 0 L 24 89 M 0 0 L -89 -24 M 0 0 L 89 24 M 0 0 L -89 24 M 0 0 L 89 -24 M 0 0 L -24 89 M 0 0 L 24 -89 M 0 0 L -65 -65 M 0 0 L 65 65 M 0 0 L -65 65 M 0 0 L 65 -65" stroke="#000080" stroke-width="2" />
                </g>
                <rect width="120" height="80" fill="url(#wave-shadow)" style={{ mixBlendMode: 'overlay' }} />
                {/* Crisp silver dynamic wave border outline */}
                <path d="M 0 0 C 30 10, 60 -10, 120 0 L 120 75 C 60 65, 30 85, 0 75 Z" fill="none" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1.5" />
              </g>
            </svg>
          </span> Indian Railways
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
