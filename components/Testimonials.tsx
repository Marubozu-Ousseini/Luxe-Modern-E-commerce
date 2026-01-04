import React from 'react';

export interface Testimonial {
  quote: string;
  name: string;
  role?: string;
}

interface Props {
  quotes: Testimonial[];
}

const Testimonials: React.FC<Props> = ({ quotes }) => {
  if (!quotes || quotes.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-serif font-semibold tracking-tight text-charcoal">Témoignages</h2>
      <div className="mt-4 grid md:grid-cols-2 gap-6">
        {quotes.map((t, i) => (
          <blockquote key={i} className="bg-bone rounded-card p-6 shadow-soft animate-fade-in">
            <p className="text-slate-800 leading-relaxed">{t.quote}</p>
            <footer className="mt-3 text-sm text-slate-700">
              <span className="font-medium text-charcoal">{t.name}</span>
              {t.role ? <span className="ml-1">— {t.role}</span> : null}
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
