import React, { useState } from 'react';
import type { Product } from '../types.ts';
import { translate } from '../src/utils/i18n.ts';

export interface FilterState {
  materials: string[];
  colors: string[];
  sizes: string[];
  fit: string[]; // keep as array for consistency, even if single select
}

interface FilterBarProps {
  products: Product[];
  value: FilterState;
  onChange: (next: FilterState) => void;
}

const unique = (arr: (string | undefined | null)[]) => Array.from(new Set(arr.filter(Boolean) as string[])).sort();

const Section: React.FC<{ title: string; children: React.ReactNode }>=({ title, children })=>{
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-full bg-bone border border-sand">
      <button
        className="px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2"
        onClick={()=>setOpen(!open)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className={`transition-transform duration-150 ease-premium ${open ? 'rotate-180' : ''}`}>⌄</span>
      </button>
      <div className={`overflow-hidden transition-[max-height,opacity] duration-200 ease-premium ${open ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-3 flex flex-wrap gap-2">{children}</div>
      </div>
    </div>
  );
};

const Pill: React.FC<{ active?: boolean; onClick: ()=>void; children: React.ReactNode }>=({ active, onClick, children })=> (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-sm border transition-all duration-150 ease-premium ${active ? 'bg-accent text-white border-accent' : 'bg-white text-charcoal border-sand hover:border-taupe'}`}
  >
    {children}
  </button>
);

const FilterBar: React.FC<FilterBarProps> = ({ products, value, onChange }) => {
  const materials = unique(products.flatMap(p => p.materials || []));
  const colors = unique(products.flatMap(p => p.colors || []));
  const sizes = unique(products.flatMap(p => p.sizes || []));
  const fits = unique(products.map(p => p.fit));
  const update = (key: keyof FilterState, item: string) => {
    const current = value[key];
    const isActive = current.includes(item);
    const next = isActive ? current.filter(v=>v!==item) : [...current, item];
    onChange({ ...value, [key]: next });
  };
  const clearAll = () => onChange({ materials: [], colors: [], sizes: [], fit: [] });

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <Section title="Matériaux">
          {materials.length === 0 ? <span className="text-sm text-slate-600">Aucun</span> : materials.map(m => (
            <Pill key={m} active={value.materials.includes(m)} onClick={()=>update('materials', m)}>{translate('material', m)}</Pill>
          ))}
        </Section>
        <Section title="Couleur">
          {colors.length === 0 ? <span className="text-sm text-slate-600">Aucune</span> : colors.map(c => (
            <Pill key={c} active={value.colors.includes(c)} onClick={()=>update('colors', c)}>{translate('color', c)}</Pill>
          ))}
        </Section>
        <Section title="Taille">
          {sizes.length === 0 ? <span className="text-sm text-slate-600">Aucune</span> : sizes.map(s => (
            <Pill key={s} active={value.sizes.includes(s)} onClick={()=>update('sizes', s)}>{s}</Pill>
          ))}
        </Section>
        <Section title="Coupe">
          {fits.length === 0 ? <span className="text-sm text-slate-600">Aucune</span> : fits.map(f => (
            <Pill key={f} active={value.fit.includes(f)} onClick={()=>update('fit', f)}>{translate('fit', f)}</Pill>
          ))}
        </Section>
        <button onClick={clearAll} className="ml-auto text-sm text-slate hover:text-charcoal">Réinitialiser</button>
      </div>
    </div>
  );
};

export default FilterBar;
