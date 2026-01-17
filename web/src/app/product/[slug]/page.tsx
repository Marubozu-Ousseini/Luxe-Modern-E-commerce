"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ProductShowroom } from "@/components/products/ProductShowroom";
import type { Product } from "@/lib/products";
import { fetchStorefrontProducts, parseProductIdFromSlug } from "@/lib/storefrontProducts";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import { useCart } from "@/components/cart/useCart";
import {
  PURCHASES_CHANGED_EVENT,
  PURCHASES_KEY,
  recommendCompleteTheLook,
  safeParsePurchaseCounts,
} from "@/lib/recommendations";

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const { slugs: favoriteSlugs } = useFavorites();
  const { lines: cartLines } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [purchaseCounts, setPurchaseCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const read = () => {
      try {
        setPurchaseCounts(safeParsePurchaseCounts(localStorage.getItem(PURCHASES_KEY)));
      } catch {
        setPurchaseCounts({});
      }
    };

    read();
    window.addEventListener(PURCHASES_CHANGED_EVENT, read);
    return () => window.removeEventListener(PURCHASES_CHANGED_EVENT, read);
  }, []);

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
        setLoadError(e?.message || "Impossible de charger le produit.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const product = useMemo(() => {
    if (!slug) return null;
    const id = parseProductIdFromSlug(slug);
    if (typeof id === "number") {
      return (products as Array<Product & { id?: number }>).find((p) => (p as any)?.id === id) ?? null;
    }
    return products.find((p) => p.slug === slug) ?? null;
  }, [products, slug]);

  const related = useMemo(() => {
    if (!product) return [];
    return recommendCompleteTheLook({
      current: product,
      products,
      favoriteSlugs,
      cartLines,
      purchaseCounts,
      limit: 3,
    });
  }, [products, product, favoriteSlugs, cartLines, purchaseCounts]);

  if (loading) {
    return (
      <div className="pb-16">
        <div className="mt-10 rounded-modal border border-border-soft bg-bg-surface p-10 shadow-soft">
          <p className="text-sm text-text-muted">Chargement du produit…</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pb-16">
        <div className="mt-10 rounded-modal border border-border-soft bg-bg-surface p-10 shadow-soft">
          <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Produit</p>
          <h1 className="mt-4 font-serif text-4xl tracking-tight-luxe">Introuvable</h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-text-muted">
            {loadError || "Ce produit n’existe pas ou n’est plus disponible."}
          </p>
          <div className="mt-7">
            <a
              href="/shop"
              className="inline-flex items-center justify-center rounded-card bg-accent px-5 py-3 text-sm font-medium text-bg-surface shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              Retour à la boutique
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <ProductShowroom product={product} related={related} />;
}
