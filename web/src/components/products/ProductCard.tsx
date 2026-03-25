"use client";

import Link from "next/link";
import { Product } from "@/lib/products";
import { PromoPrice } from "@/components/ui/PromoPrice";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import { IconHeart } from "@/components/ui/Icons";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart/useCart";
import { discountedXaf, PROMO_PERCENT_OFF } from "@/lib/promo";

const PROMO_OVERRIDES_KEY = "malafaareh_admin_promo_overrides";
const PRODUCT_STATUS_KEY = "malafaareh_admin_product_status";
const DRAFT_PRODUCTS_KEY = "malafaareh_admin_products_draft";

type DraftProduct = {
  slug: string;
  inventoryCount: number;
};

function safeParseDraftProducts(value: string | null): DraftProduct[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(Boolean)
      .map((p) => p as Partial<DraftProduct>)
      .filter((p): p is DraftProduct => typeof p.slug === "string" && typeof p.inventoryCount === "number" && Number.isFinite(p.inventoryCount));
  } catch {
    return [];
  }
}

export function ProductCard({ product }: { product: Product }) {
  const { addLine } = useCart();
  const { has, toggle } = useFavorites();
  const [pulse, setPulse] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const [promoOverride, setPromoOverride] = useState<number | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isOutOfStock, setIsOutOfStock] = useState(false);
  const isFavorite = has(product.slug);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROMO_OVERRIDES_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const v = parsed?.[product.slug];
      if (typeof v === "number" && Number.isFinite(v) && v > 0) setPromoOverride(v);
    } catch {
      // ignore
    }
  }, [product.slug]);

  useEffect(() => {
    setIsDisabled(false);
    try {
      const raw = localStorage.getItem(PRODUCT_STATUS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const idKey = typeof (product as any)?.id === "number" ? String((product as any).id) : null;
      const v = (idKey && parsed?.[idKey]) ?? parsed?.[product.slug];
      if (v === "Désactivé") setIsDisabled(true);
    } catch {
      // ignore
    }
  }, [product.slug]);

  useEffect(() => {
    setIsOutOfStock(false);
    if (typeof product.stock === "number" && Number.isFinite(product.stock)) {
      if (product.stock <= 0) setIsOutOfStock(true);
      return;
    }
    try {
      const drafts = safeParseDraftProducts(localStorage.getItem(DRAFT_PRODUCTS_KEY));
      const match = drafts.find((d) => d.slug === product.slug);
      if (match && match.inventoryCount <= 0) setIsOutOfStock(true);
    } catch {
      // ignore
    }
  }, [product.slug]);

  const effectiveUnitPriceXaf = useMemo(() => {
    if (promoOverride !== null && promoOverride > 0 && promoOverride < product.priceXaf) return promoOverride;
    if (typeof product.promoPriceXaf === "number" && Number.isFinite(product.promoPriceXaf) && product.promoPriceXaf > 0) {
      return product.promoPriceXaf;
    }
    return discountedXaf(product.priceXaf, PROMO_PERCENT_OFF);
  }, [product.priceXaf, product.promoPriceXaf, promoOverride]);

  const promoPercentLabel = useMemo(() => {
    if (promoOverride === null || promoOverride <= 0 || promoOverride >= product.priceXaf) return PROMO_PERCENT_OFF;
    const pct = Math.round((1 - promoOverride / product.priceXaf) * 100);
    return Math.max(1, Math.min(95, pct));
  }, [product.priceXaf, promoOverride]);

  const promoPriceXaf = useMemo(() => {
    if (promoOverride !== null && promoOverride > 0 && promoOverride < product.priceXaf) return promoOverride;
    if (typeof product.promoPriceXaf === "number" && Number.isFinite(product.promoPriceXaf) && product.promoPriceXaf > 0) {
      return product.promoPriceXaf;
    }
    return undefined;
  }, [product.priceXaf, product.promoPriceXaf, promoOverride]);

  function addToCart() {
    setCartPulse(true);
    window.setTimeout(() => setCartPulse(false), 420);
    addLine({ slug: product.slug, name: product.name, priceXaf: effectiveUnitPriceXaf });
  }

  if (isDisabled) return null;

  return (
    <div className="group">
      <Link
        href={`/product/${product.slug}`}
        className="block overflow-hidden rounded-modal border border-border-soft bg-bg-surface shadow-soft transition duration-200 ease-premium hover:translate-y-[-2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <div className="relative aspect-[4/5] bg-bg-subtle">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-[radial-gradient(800px_400px_at_30%_20%,rgba(0,0,0,0.06),transparent_60%)]" />

          {isOutOfStock ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="-rotate-12 rounded-card border-4 border-red-600/70 bg-red-100/80 px-10 py-6 text-center text-4xl font-black uppercase tracking-[0.18em] text-red-700 mix-blend-multiply shadow-lg sm:text-5xl md:text-6xl">
                Rupture de stock
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPulse(true);
              window.setTimeout(() => setPulse(false), 420);
              toggle(product.slug);
            }}
            aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            aria-pressed={isFavorite}
            className={
              "absolute right-4 top-4 inline-flex items-center justify-center rounded-card border-2 bg-bg-surface/90 p-2 shadow-soft backdrop-blur transition duration-150 ease-premium hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 " +
              (isFavorite ? "border-promo-old/70 text-promo-old" : "border-border-soft text-text-primary") +
              " " +
              (pulse ? "scale-[1.08]" : "")
            }
          >
            <span className={"inline-flex transition-transform duration-200 ease-premium " + (pulse ? "scale-[1.15]" : "")} aria-hidden>
              <IconHeart className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} />
            </span>
          </button>

          <div className="absolute left-4 top-4 flex flex-col gap-2">
            <div className="rounded-full border-2 border-border-soft bg-[var(--header-gold)] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--header-navy)] shadow-soft">
              -{promoPercentLabel}% OFF
            </div>
          </div>

          {product.limitedAvailability ? (
            <div className="absolute left-4 top-4 rounded-full border border-border-soft bg-bg-surface/80 px-3 py-1 text-[11px] text-text-muted backdrop-blur">
              Disponibilité limitée
            </div>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 p-4">
            <div className="rounded-card border border-border-soft bg-bg-surface/80 p-3 opacity-0 backdrop-blur transition duration-200 ease-premium group-hover:opacity-100 motion-reduce:opacity-100">
              <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">
                Aperçu
              </p>
              <p className="mt-2 text-xs text-text-muted">
                {product.materials.join(", ")} · {product.colors.join(" / ")}
              </p>
              <p className="mt-2 text-xs text-text-primary">Voir le produit</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-4">
          <p className="font-medium text-text-primary">{product.name}</p>
          <PromoPrice className="mt-1" priceXaf={product.priceXaf} promoPriceXaf={promoPriceXaf} />

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart();
            }}
            className={
              "mt-3 w-full rounded-card border-2 border-border-soft bg-bg-surface px-4 py-2 text-sm font-semibold text-text-primary shadow-soft transition duration-150 ease-premium hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 " +
              (cartPulse ? "scale-[1.02]" : "")
            }
            aria-label={`Ajouter ${product.name} au panier`}
          >
            Ajouter au panier
          </button>
        </div>
      </Link>
    </div>
  );
}
