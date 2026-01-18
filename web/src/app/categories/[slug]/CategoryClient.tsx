"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/products/ProductCard";
import { InlineAdBanner } from "@/components/ads/AdPlacements";
import { HeroImage } from "@/components/layout/HeroImage";
import type { Product } from "@/lib/products";
import { fetchStorefrontProducts } from "@/lib/storefrontProducts";

export type CategoryConfig = {
  slug: string;
  title: string;
  eyebrow: string;
  intro: string;
  noteTitle: string;
  noteQuote: string;
  noteByline: string;
  heroAccent: { from: string; to: string };
};

function heroDataUri(config: CategoryConfig) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="686" viewBox="0 0 1600 686">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FAF8F5"/>
      <stop offset="1" stop-color="#F2EEE8"/>
    </linearGradient>
    <radialGradient id="a" cx="25%" cy="18%" r="68%">
      <stop offset="0" stop-color="${config.heroAccent.from}" stop-opacity="0.14"/>
      <stop offset="1" stop-color="${config.heroAccent.from}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="b" cx="78%" cy="72%" r="70%">
      <stop offset="0" stop-color="${config.heroAccent.to}" stop-opacity="0.10"/>
      <stop offset="1" stop-color="${config.heroAccent.to}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1600" height="686" fill="url(#bg)"/>
  <rect width="1600" height="686" fill="url(#a)"/>
  <rect width="1600" height="686" fill="url(#b)"/>
  <g opacity="0.18" stroke="#1C1C1C">
    <path d="M0 110 H1600"/>
    <path d="M0 240 H1600"/>
    <path d="M0 370 H1600"/>
    <path d="M0 500 H1600"/>
    <path d="M0 630 H1600"/>
  </g>
  <text x="64" y="560" font-family="ui-serif, Georgia, serif" font-size="54" fill="#1C1C1C" opacity="0.92">${config.title}</text>
  <text x="64" y="610" font-family="ui-sans-serif, system-ui" font-size="18" fill="#1C1C1C" opacity="0.68">${config.eyebrow}</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function CategoryClient({ slug, config }: { slug: string; config: CategoryConfig }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchStorefrontProducts({ limit: 200 })
      .then((list) => {
        if (cancelled) return;
        setProducts(list);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const picks = useMemo(() => {
    return products.filter((p) => p.category === (config.title as any)).slice(0, 3);
  }, [products, config.title]);

  return (
    <div className="pb-16">
      <div className="mt-8">
        <p className="text-xs uppercase tracking-[0.12em] text-text-muted">{config.eyebrow}</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight-luxe">{config.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">{config.intro}</p>
      </div>

      <div className="mt-8 overflow-hidden rounded-modal border border-border-soft bg-bg-surface shadow-soft">
        <div className="relative aspect-[21/9] bg-bg-subtle">
          <HeroImage
            pageKey={`category:${slug}`}
            alt={`Image héro – ${config.title}`}
            fallbackSrc={heroDataUri(config)}
            title={config.title}
            subtitle={config.eyebrow}
          />
        </div>
      </div>

      <div className="mt-8">
        <InlineAdBanner placementKey="category" />
      </div>

      <div className="mt-10">
        {loading ? (
          <div className="rounded-modal border border-border-soft bg-bg-surface p-8 shadow-soft">
            <p className="text-sm text-text-muted">Chargement…</p>
          </div>
        ) : picks.length === 0 ? (
          <div className="rounded-modal border border-border-soft bg-bg-surface p-8 shadow-soft">
            <p className="text-sm text-text-muted">La sélection arrive bientôt.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {picks.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-12 rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.12em] text-text-muted">{config.noteTitle}</p>
        <p className="mt-3 font-serif text-xl tracking-tight-luxe-sm">{config.noteQuote}</p>
        <p className="mt-3 text-sm text-text-muted">{config.noteByline}</p>
      </div>
    </div>
  );
}
