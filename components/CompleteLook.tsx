import React from 'react';
import type { Product } from '../types.ts';
import { formatCurrency } from '../src/utils/formatter.ts';

interface Props {
  items: Product[];
  onSelect: (p: Product) => void;
}

const CompleteLook: React.FC<Props> = ({ items, onSelect }) => {
  if (!items || items.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-serif font-semibold tracking-tight text-charcoal">Complete the Look</h2>
      <div className="mt-4 grid sm:grid-cols-3 gap-6">
        {items.slice(0,3).map(p => (
          <button key={p.id} onClick={()=>onSelect(p)} className="text-left bg-white rounded-card shadow-soft border border-sand overflow-hidden">
            <div className="aspect-square w-full overflow-hidden">
              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-serif font-semibold tracking-tight text-charcoal truncate">{p.name}</h3>
              <p className="text-sm text-slate-700 mt-1">{p.category}</p>
              <p className="mt-2 text-charcoal font-semibold">{formatCurrency(p.price)}</p>
              <span className="mt-2 inline-block text-sm px-3 py-1 rounded-full bg-bone text-slate-800">View Details</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default CompleteLook;
