"use client";

import { useEffect, useMemo, useState } from "react";
import { HeroImage } from "@/components/layout/HeroImage";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import { ProductCard } from "@/components/products/ProductCard";
import type { Product } from "@/lib/products";
import { fetchStorefrontProducts } from "@/lib/storefrontProducts";

export default function FavoritesPage() {
  const { slugs } = useFavorites();
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

  const favorites = useMemo(() => {
    const set = new Set(slugs);
    return products.filter((p) => set.has(p.slug));
  }, [products, slugs]);

  return (
    <div className="pb-16">
      <div className="mt-10 rounded-modal border border-border-soft bg-bg-surface p-10 shadow-soft">
        <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Favoris</p>
        <h1 className="mt-4 font-serif text-4xl tracking-tight-luxe">Vos pièces enregistrées</h1>
        <p className="mt-5 max-w-2xl text-sm leading-6 text-text-muted">Retrouvez ici votre sélection enregistrée.</p>
      </div>

      <div className="mt-6 overflow-hidden rounded-modal border border-border-soft bg-bg-surface shadow-soft">
        <div className="relative aspect-[21/9] bg-bg-subtle">
          <HeroImage pageKey="favorites" alt="Image héro – Favoris" title="Favoris" subtitle="Vos pièces enregistrées" />
        </div>
      </div>

      <div className="mt-10">
        {loading ? (
          <div className="rounded-modal border border-border-soft bg-bg-surface p-8 shadow-soft">
            <p className="text-sm text-text-muted">Chargement…</p>
          </div>
        ) : loadError ? (
          <div className="rounded-modal border border-border-soft bg-bg-surface p-8 shadow-soft">
            <p className="text-sm text-text-muted">{loadError}</p>
            <p className="mt-2 text-sm text-text-muted">Réessayez dans un instant.</p>
          </div>
        ) : slugs.length === 0 ? (
          <div className="rounded-modal border border-border-soft bg-bg-surface p-8 shadow-soft">
            <p className="text-sm text-text-muted">Aucun favori pour le moment.</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="rounded-modal border border-border-soft bg-bg-surface p-8 shadow-soft">
            <p className="text-sm text-text-muted">
              Vos favoris sont enregistrés, mais ces produits ne sont pas disponibles dans le catalogue chargé.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {favorites.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
