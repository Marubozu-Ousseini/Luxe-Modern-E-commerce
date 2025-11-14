import React from 'react';

const Story: React.FC = () => {
  return (
    <main className="min-h-screen bg-porcelain text-charcoal">
      <section className="container mx-auto max-w-content px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <h1 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight">Notre Histoire</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-700">
          Une vision sereine du style. Des formes justes, des matières durables, une attention discrète aux détails.
        </p>
      </section>

      <section className="container mx-auto max-w-content px-4 sm:px-6 lg:px-8 pb-16 grid md:grid-cols-2 gap-10 items-start">
        <div className="bg-white rounded-lg shadow-soft p-6">
          <h2 className="text-2xl font-serif font-semibold tracking-tight">Les Matières</h2>
          <p className="mt-3 text-slate-700 leading-relaxed">
            Nous sélectionnons des tissus pensés pour durer : toucher, drapé, tenue. La qualité se ressent au quotidien.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-soft p-6">
          <h2 className="text-2xl font-serif font-semibold tracking-tight">L'Atelier</h2>
          <p className="mt-3 text-slate-700 leading-relaxed">
            Des finitions sobres, des coupes maîtrisées, et des gestes précis. Un luxe tranquille.
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-content px-4 sm:px-6 lg:px-8 pb-24">
        <div className="bg-bone rounded-lg p-8 text-slate-800">
          <h3 className="text-xl font-semibold">La Promesse</h3>
          <p className="mt-3">Confort, tenue, et élégance calme. Sans compromis.</p>
        </div>
      </section>
    </main>
  );
};

export default Story;
