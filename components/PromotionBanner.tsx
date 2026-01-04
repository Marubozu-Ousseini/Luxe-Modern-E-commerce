import React, { useEffect, useState } from 'react';

type PromotionsState = {
  promotionsActive: boolean;
  vouchersActive: boolean;
  bannerText: string;
  voucherText: string;
  marqueeSpeedSeconds?: number;
  glowEnabled?: boolean;
  stickers?: { id: string; text?: string; imageUrl?: string; href?: string }[];
  updatedAt: string;
};

export default function PromotionBanner() {
  const [state, setState] = useState<PromotionsState | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch('/api/promotions');
        if (!res.ok) return;
        const json = await res.json();
        if (alive) setState(json);
      } catch { /* noop */ }
    };
    load();
    const id = setInterval(load, 30_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (!state || (!state.promotionsActive && !state.vouchersActive)) return null;

  const stickers = state.stickers || [];
  return (
    <div className={`w-full bg-accent/10 border-b border-borderSoft py-2`}>
      <div className="container mx-auto px-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <strong className="text-charcoal mr-2">{state.bannerText}</strong>
          {state.vouchersActive && (
            <span className="inline-block bg-accent text-white px-2 py-1 rounded">{state.voucherText}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {stickers.slice(0,2).map(s => (
            s.href ? (
              <a key={s.id} href={s.href} className="inline-flex items-center justify-center" style={{ textDecoration: 'none' }}>
                {s.imageUrl ? <img src={s.imageUrl} alt={s.text || s.id} className="h-6 w-6 object-contain" /> : (s.text || s.id)}
              </a>
            ) : (
              <span key={s.id} className="inline-flex items-center justify-center">{s.imageUrl ? <img src={s.imageUrl} alt={s.text || s.id} className="h-6 w-6 object-contain" /> : (s.text || s.id)}</span>
            )
          ))}
        </div>
      </div>
    </div>
  );
}
