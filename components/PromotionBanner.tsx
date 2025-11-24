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

  const speed = state.marqueeSpeedSeconds || 18;
  const stickers = state.stickers || [];
  return (
    <div className={`promo-banner ${state.glowEnabled ? 'glow' : ''}`}
      style={{ ['--marquee-duration' as any]: `${speed}s` }}>
      <div className="scroll">
        <span>{state.bannerText}</span>
        {state.vouchersActive && (
          <span className="voucher-badge">{state.voucherText}</span>
        )}
        {stickers.length > 0 && stickers.map(s => (
          s.href ? (
            <a key={s.id} href={s.href} className="voucher-badge" style={{ textDecoration: 'none' }}>
              {s.imageUrl ? <img src={s.imageUrl} alt={s.text || s.id} className="h-6 w-6 object-contain" /> : (s.text || s.id)}
            </a>
          ) : (
            <span key={s.id} className="voucher-badge">
              {s.imageUrl ? <img src={s.imageUrl} alt={s.text || s.id} className="h-6 w-6 object-contain" /> : (s.text || s.id)}
            </span>
          )
        ))}
      </div>
    </div>
  );
}
