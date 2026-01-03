import React from 'react';
import { Product } from '../types.ts';

export interface Badge {
  label: string;
  tone?: 'accent' | 'neutral' | 'warning' | 'success';
}

function deriveBadges(product: Product): Badge[] {
  const out: Badge[] = [];
  if (product.limitedAvailability) out.push({ label: 'Quantités limitées', tone: 'warning' });
  const count = product.rating?.count || 0;
  const rate = product.rating?.rate || 0;
  if (count > 300 && rate >= 4.6) out.push({ label: 'Best‑seller', tone: 'success' });
  if (product.originalPrice && product.originalPrice > product.price) out.push({ label: 'En promo', tone: 'accent' });
  // Category hints
  if (product.category === 'Nouveautés' || /Automatique|Nubuck|Acétate/i.test(product.name)) {
    out.push({ label: 'Nouveau', tone: 'neutral' });
  }
  return out;
}

export const Badges: React.FC<{ product: Product; className?: string }>= ({ product, className }) => {
  const badges = deriveBadges(product);
  if (!badges.length) return null;
  return (
    <div className={className || 'absolute top-3 left-3 flex flex-wrap gap-2'}>
      {badges.map((b, i) => (
        <span key={i} className={
          'text-xs px-2 py-1 rounded-full backdrop-blur-sm ' +
          (b.tone === 'warning' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
           b.tone === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
           b.tone === 'accent' ? 'bg-[#0078FF]/15 text-[#0078FF] border border-[#0078FF]/30' :
           'bg-white/60 text-slate-800 border border-white/80')
        }>{b.label}</span>
      ))}
    </div>
  );
};

export default Badges;
