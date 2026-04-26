export default function HolidayPackages() {
  const packages = [
    {
      title: "Maharajas' Express",
      description: "Redefining Royalty, Luxury and Comfort, Maharajas' express takes...",
      imgUrl: "https://images.unsplash.com/photo-1560935560-639a66d9f5ff?q=80&w=2148&auto=format&fit=crop",
    },
    {
      title: "International Packages",
      description: "Best deals in International Holiday packages, handpicked by IRCTC...",
      imgUrl: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=2071&auto=format&fit=crop",
    },
    {
      title: "Domestic Air Packages",
      description: "Be it the spiritual devotee seeking blessings of Tirupati, Shirdi or Mata...",
      imgUrl: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?q=80&w=2070&auto=format&fit=crop",
    }
  ];

  return (
    <section className="py-20 px-4 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-white mb-12">Plan your next holiday</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((pkg, idx) => (
            <div key={idx} className="glass-card overflow-hidden hover:-translate-y-2 transition-transform duration-300">
              <div 
                className="h-48 w-full bg-cover bg-center"
                style={{ backgroundImage: `url('${pkg.imgUrl}')` }}
              />
              <div className="p-6 flex flex-col items-center flex-grow text-center">
                <h3 className="text-xl font-bold text-white mb-3">{pkg.title}</h3>
                <p className="text-gray-400 text-sm mb-6 flex-grow">{pkg.description}</p>
                <button className="btn-primary px-8">Read more</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
