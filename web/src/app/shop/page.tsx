"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/products";
import { ProductCard } from "@/components/products/ProductCard";
import { FilterBar, type Filters } from "@/components/products/FilterBar";
import { SortSelect, type SortKey } from "@/components/products/SortSelect";
import { InlineAdBanner } from "@/components/ads/AdPlacements";
import { HeroImage } from "@/components/layout/HeroImage";
import { fetchStorefrontProducts } from "@/lib/storefrontProducts";

const emptyFilters: Filters = { materials: [], colors: [], sizes: [], fit: [] };

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    fetchStorefrontProducts({ limit: 200 })
      .then((list) => {
        if (cancelled) return;
        setProducts(list);
      })
      .catch((e: any) => {
        if (cancelled) return;
        setLoadError(e?.message || "Impossible de charger les produits.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // By default, show all products (no filters applied)
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [sort, setSort] = useState<SortKey>("curated");
  const [visible, setVisible] = useState(8);

  const options = useMemo<Filters>(() => {
    const mats = new Set<string>();
    const cols = new Set<string>();
    const sizes = new Set<string>();
    const fits = new Set<string>();

    for (const p of products) {
      p.materials.forEach((m) => mats.add(m));
      p.colors.forEach((c) => cols.add(c));
      p.sizes.forEach((s) => sizes.add(s));
      fits.add(p.fit);
    }

    return {
      materials: Array.from(mats).sort(),
      colors: Array.from(cols).sort(),
      sizes: Array.from(sizes).sort(),
      fit: Array.from(fits).sort(),
    };
  }, []);

  const filtered = useMemo(() => {
    // If no filters, show all products
    if (
      filters.materials.length === 0 &&
      filters.colors.length === 0 &&
      filters.sizes.length === 0 &&
      filters.fit.length === 0
    ) {
      const sorted = [...products];
      if (sort === "price") sorted.sort((a, b) => a.priceXaf - b.priceXaf);
      else if (sort === "newest") sorted.reverse();
      return sorted;
    }
    // Otherwise, apply filters
    const base = products.filter((p) => {
      const matOk = filters.materials.length === 0 || filters.materials.some((m) => p.materials.includes(m));
      const colorOk = filters.colors.length === 0 || filters.colors.some((c) => p.colors.includes(c));
      const sizeOk = filters.sizes.length === 0 || filters.sizes.some((s) => p.sizes.includes(s));
      const fitOk = filters.fit.length === 0 || filters.fit.includes(p.fit);
      return matOk && colorOk && sizeOk && fitOk;
    });
    const sorted = [...base];
    if (sort === "price") sorted.sort((a, b) => a.priceXaf - b.priceXaf);
    else if (sort === "newest") sorted.reverse();
    return sorted;
  }, [products, filters, sort]);

  const shown = filtered.slice(0, visible);
  const canLoad = visible < filtered.length;

  return (
    <div className="pb-16">
      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-text-muted">La galerie curatée</p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight-luxe">Boutique</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
            Des pièces qui respirent, pensées pour l’image — guidées par un œil éditorial, sans bruit.
          </p>
        </div>
        <div className="w-full md:max-w-xs">
          <SortSelect value={sort} onChange={setSort} />
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-modal border border-border-soft bg-bg-surface shadow-soft">
        <div className="relative aspect-[21/9] bg-bg-subtle">
          <HeroImage pageKey="shop" alt="Image héro – Boutique" title="Boutique" subtitle="La galerie curatée" />
        </div>
      </div>

      <div className="mt-8">
        <FilterBar options={options} value={filters} onChange={(next) => { setFilters(next); setVisible(8); }} />
      </div>

      <div className="mt-8">
        <InlineAdBanner placementKey="shop" />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-modal border border-border-soft bg-bg-surface p-8 shadow-soft">
          {loading ? (
            <p className="text-sm text-text-muted">Chargement de la boutique…</p>
          ) : loadError ? (
            <>
              <p className="text-sm text-text-muted">{loadError}</p>
              <p className="mt-2 text-sm text-text-muted">Réessayez dans un instant.</p>
            </>
          ) : (
            <>
              <p className="text-sm text-text-muted">Aucun résultat pour cet affinage.</p>
              <p className="mt-2 text-sm text-text-muted">Explorez les essentiels pour revenir à une sélection plus calme.</p>
            </>
          )}
        </div>
      ) : (
        <div className="mt-10">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {shown.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            {canLoad ? (
              <button
                type="button"
                onClick={() => setVisible((v) => v + 4)}
                className="rounded-card border border-border-soft bg-bg-surface px-6 py-3 text-sm text-text-primary shadow-soft transition duration-200 ease-premium hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                Voir plus
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
