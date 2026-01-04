import React from 'react';
import materialsJson from '../data/materials.json';

type Material = { id: string; name: string; description: string; image: string; alt: string };
const materials: Material[] = (materialsJson as Material[]) || [];

const MaterialsBand: React.FC = () => {
  return (
    <section aria-labelledby="materials-title" className="mt-8 mb-10">
      <div className="rounded-lg bg-white shadow-soft border border-sand">
        <div className="px-6 py-5 border-b border-borderSoft">
          <h2 id="materials-title" className="text-2xl md:text-3xl font-serif text-charcoal">Nos matières</h2>
          <p className="mt-1 text-sm text-charcoal/80">Le savoir‑faire du confort et de la durabilité.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
          {materials.map((m) => (
            <div key={m.id} className="flex flex-col border-t border-borderSoft lg:border-t-0 lg:border-l border-borderSoft">
              <div className="relative h-40 w-full overflow-hidden">
                <img
                  src={m.image}
                  alt={m.alt}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-porcelain/60 to-transparent" aria-hidden="true" />
              </div>
              <div className="px-4 py-3">
                <h3 className="text-lg font-serif text-charcoal">{m.name}</h3>
                <p className="mt-1 text-sm text-charcoal/80">{m.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MaterialsBand;
