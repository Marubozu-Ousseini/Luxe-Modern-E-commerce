"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/products";
import { PROMO_PERCENT_OFF } from "@/lib/promo";
import { PromoPrice } from "@/components/ui/PromoPrice";
import { fetchStorefrontProducts } from "@/lib/storefrontProducts";

export function PromotionBanners() {
  const percentOff = PROMO_PERCENT_OFF;
  const [picks, setPicks] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchStorefrontProducts({ limit: 3 })
      .then((list) => {
        if (cancelled) return;
        setPicks(list.slice(0, 3));
      })
      .catch(() => {
        if (cancelled) return;
        setPicks([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Promotions</p>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {picks.map((p) => {
          return (
            <Link
              key={p.slug}
              href={`/product/${p.slug}`}
              className="group rounded-modal border border-border-soft bg-bg-surface p-5 shadow-soft transition duration-200 ease-premium hover:translate-y-[-2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-text-muted">-10% OFF</p>
              <p className="mt-3 font-serif text-xl tracking-tight-luxe-sm text-text-primary">{p.name}</p>

              <div className="mt-4">
                <PromoPrice priceXaf={p.priceXaf} percentOff={percentOff} />
              </div>

              <p className="mt-5 text-sm font-medium text-text-primary">
                Voir l’offre <span className="transition duration-200 ease-premium group-hover:translate-x-0.5">→</span>
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
