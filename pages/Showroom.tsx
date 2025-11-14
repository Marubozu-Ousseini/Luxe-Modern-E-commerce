import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Showroom: React.FC = () => {
  // Reuse hero fallbacks (local first, then remote)
  const heroSources = [
    '/showroom.jpg',
    '/showroom.png',
    '/showroom.webp',
    'https://images.unsplash.com/photo-1521337581680-649f040db2d7?q=80&w=1600&auto=format&fit=crop' // interior showroom fallback
  ];
  const [heroIndex, setHeroIndex] = useState(0);

  return (
    <div className="min-h-screen bg-beige text-charcoal">
      {/* Full-bleed hero background */}
      <section className="relative mb-10 overflow-hidden">
        <div className="relative h-[52vh] min-h-[360px] w-full">
          <img
            src={heroSources[heroIndex]}
            alt="Showroom Hero"
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setHeroIndex(i => Math.min(i + 1, heroSources.length - 1))}
          />
          <div className="absolute inset-0 bg-royal/35" />
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
            <h1 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-white">Showroom</h1>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-content px-4 sm:px-6 lg:px-8 pb-10">
        <p className="text-slate mb-8">Découvrez nos espaces, matières et savoir-faire à travers une sélection soignée.</p>
        <Link to="/" className="px-4 py-2 rounded-md border border-charcoal/20 text-charcoal hover:bg-charcoal/5 transition">Retour à l’accueil</Link>
      </div>
    </div>
  );
};

export default Showroom;
