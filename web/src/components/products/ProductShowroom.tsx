"use client";

import { useEffect, useMemo, useState } from "react";
import { Product } from "@/lib/products";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useCart } from "@/components/cart/useCart";
import { PromoPrice } from "@/components/ui/PromoPrice";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import { IconHeart } from "@/components/ui/Icons";
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

function placeholderSvg(title: string) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1125">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#FAF8F5"/>
        <stop offset="1" stop-color="#F2EEE8"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <g opacity="0.18" stroke="#1C1C1C">
      <path d="M0 120 H900"/>
      <path d="M0 260 H900"/>
      <path d="M0 400 H900"/>
      <path d="M0 540 H900"/>
      <path d="M0 680 H900"/>
      <path d="M0 820 H900"/>
      <path d="M0 960 H900"/>
    </g>
    <text x="48" y="1020" font-family="ui-sans-serif, system-ui" font-size="28" fill="#1C1C1C" opacity="0.75">${title}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function ProductShowroom({ product, related }: { product: Product & { id?: number }; related?: Product[] }) {
  const { addLine } = useCart();
  const { has, toggle } = useFavorites();

  const [color, setColor] = useState(product.colors[0] ?? "");
  const [size, setSize] = useState(product.sizes[0] ?? "");
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const [favPulse, setFavPulse] = useState(false);
  const [promoOverride, setPromoOverride] = useState<number | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isOutOfStock, setIsOutOfStock] = useState(false);

  const isFavorite = has(product.slug);

  useEffect(() => {
    setCartPulse(false);
    setFavPulse(false);
  }, [product.slug]);

  useEffect(() => {
    setPromoOverride(null);
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
      const idKey = (product as any)?.id ? String((product as any).id) : null;
      const v = (idKey && parsed?.[idKey]) ?? parsed?.[product.slug];
      if (v === "Désactivé") setIsDisabled(true);
    } catch {
      // ignore
    }
  }, [product.slug]);

  useEffect(() => {
    setIsOutOfStock(false);
    if (typeof (product as any).stock === "number" && Number.isFinite((product as any).stock)) {
      if ((product as any).stock <= 0) setIsOutOfStock(true);
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
    if (
      typeof (product as any).promoPriceXaf === "number" &&
      Number.isFinite((product as any).promoPriceXaf) &&
      (product as any).promoPriceXaf > 0
    ) {
      return (product as any).promoPriceXaf;
    }
    return discountedXaf(product.priceXaf, PROMO_PERCENT_OFF);
  }, [product.priceXaf, (product as any).promoPriceXaf, promoOverride]);

  const promoPriceXaf = useMemo(() => {
    if (promoOverride !== null && promoOverride > 0 && promoOverride < product.priceXaf) return promoOverride;
    if (
      typeof (product as any).promoPriceXaf === "number" &&
      Number.isFinite((product as any).promoPriceXaf) &&
      (product as any).promoPriceXaf > 0
    ) {
      return (product as any).promoPriceXaf as number;
    }
    return undefined;
  }, [product.priceXaf, (product as any).promoPriceXaf, promoOverride]);

  const media = useMemo<string[]>(() => {
    const rawImages = Array.isArray((product as any).images) ? (product as any).images : [];
    const images = rawImages
      .map((v: any) => (typeof v === "string" ? v.trim() : ""))
      .filter((v: string) => v.length > 0);

    if (images.length) return images;

    const primary = (product as any).imageUrl ? String((product as any).imageUrl) : "";
    return [primary || placeholderSvg(product.name)];
  }, [product.name, (product as any).imageUrl, (product as any).images]);

  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [product.slug]);

  function addToBag() {
    setCartPulse(true);
    window.setTimeout(() => setCartPulse(false), 420);
    addLine({
      slug: product.slug,
      name: product.name,
      priceXaf: effectiveUnitPriceXaf,
      color,
      size,
    });
  }

  function toggleFavorite() {
    setFavPulse(true);
    window.setTimeout(() => setFavPulse(false), 420);
    toggle(product.slug);
  }

  if (isDisabled) {
    return (
      <div className="pb-16">
        <div className="mt-10 rounded-modal border border-border-soft bg-bg-surface p-10 shadow-soft">
          <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Produit</p>
          <h1 className="mt-4 font-serif text-4xl tracking-tight-luxe">Indisponible</h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-text-muted">
            Ce produit a été désactivé par l’administrateur. Il n’est pas disponible à la vente pour le moment.
          </p>
          <div className="mt-7">
            <Button type="button" onClick={() => (window.location.href = "/shop")}>
              Retour à la boutique
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-16">
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-modal border border-border-soft bg-bg-surface shadow-soft">
            <div className="relative aspect-[4/5] bg-bg-subtle">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={media[active]} alt={product.name} className="h-full w-full object-cover" />

              {isOutOfStock ? (
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="-rotate-12 rounded-card border-4 border-promo-old/55 bg-promo-old/10 px-8 py-5 text-center text-4xl font-black uppercase tracking-[0.18em] text-promo-old/70 mix-blend-multiply shadow-soft md:text-5xl">
                    Rupture de stock
                  </div>
                </div>
              ) : null}
            </div>
            <div className="flex gap-3 border-t border-border-soft bg-bg-surface p-4">
              {media.map((src: string, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActive(idx)}
                  className="h-16 w-14 overflow-hidden rounded-card border border-border-soft bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  aria-label={`Voir le visuel ${idx + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Le salon privé</p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight-luxe">{product.name}</h1>
          <p className="mt-3 text-sm text-text-muted">{product.description}</p>

          <div className="mt-6 flex items-baseline justify-between">
            <PromoPrice className="text-base" priceXaf={product.priceXaf} promoPriceXaf={promoPriceXaf} />
            {product.seasonalEdit ? (
              <p className="text-xs text-text-muted">Part of {product.seasonalEdit}</p>
            ) : null}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={toggleFavorite}
              className={
                "inline-flex items-center gap-2 rounded-card border-2 bg-bg-surface px-4 py-2 text-sm font-semibold shadow-soft transition duration-150 ease-premium hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 " +
                (isFavorite ? "border-promo-old/70 text-promo-old" : "border-border-soft text-text-primary") +
                " " +
                (favPulse ? "scale-[1.03]" : "")
              }
              aria-pressed={isFavorite}
              aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <span className={"inline-flex transition-transform duration-200 ease-premium " + (favPulse ? "scale-[1.15]" : "")}
                aria-hidden
              >
                <IconHeart className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} />
              </span>
              {isFavorite ? "Ajouté aux favoris" : "Ajouter aux favoris"}
            </button>
          </div>

          <div className="mt-8 rounded-modal border border-border-soft bg-bg-surface p-5 shadow-soft">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Color</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={
                      "rounded-full border border-border-soft px-4 py-2 text-sm transition duration-150 ease-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 " +
                      (color === c ? "bg-bg-surface text-text-primary" : "bg-bg-subtle text-text-muted")
                    }
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Size</p>
                <button
                  type="button"
                  className="text-xs text-text-muted underline decoration-border-soft underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  onClick={() => setSizeGuideOpen(true)}
                >
                  Guide des tailles
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={
                      "rounded-full border border-border-soft px-4 py-2 text-sm transition duration-150 ease-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 " +
                      (size === s ? "bg-bg-surface text-text-primary" : "bg-bg-subtle text-text-muted")
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-7 hidden md:block">
              <Button
                className={"w-full transition-transform duration-200 ease-premium " + (cartPulse ? "scale-[1.02]" : "")}
                onClick={addToBag}
                type="button"
              >
                Ajouter au panier
              </Button>
              <p className="mt-3 text-xs text-text-muted">
                Emballage offert
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Une note choisie</p>
            <p className="mt-3 font-serif text-xl tracking-tight-luxe-sm">
              {typeof (product as any).editorNote === "string" && String((product as any).editorNote).trim().length > 0
                ? `« ${String((product as any).editorNote).trim()} »`
                : "« La texture est intentionnelle. La finition est silencieuse. Cela ressemble à un goût personnel. »"}
            </p>
            <p className="mt-3 text-sm text-text-muted">— Éditeur Atelier</p>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Compléter le look</p>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {(related ?? [])
            .filter((p) => p.slug !== product.slug)
            .slice(0, 3)
            .map((p) => (
              <div
                key={p.slug}
                className="rounded-modal border border-border-soft bg-bg-surface p-5 shadow-soft"
              >
                <p className="font-medium">{p.name}</p>
                <PromoPrice className="mt-1" priceXaf={p.priceXaf} promoPriceXaf={(p as any).promoPriceXaf} />
                <div className="mt-4">
                  <a
                    className="text-sm text-text-primary underline decoration-border-soft underline-offset-4"
                    href={`/product/${p.slug}`}
                  >
                    Voir le produit
                  </a>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-soft bg-bg-surface/90 px-6 py-4 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-content items-center gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Total</p>
            <PromoPrice className="mt-1" priceXaf={product.priceXaf} promoPriceXaf={promoPriceXaf} />
          </div>
          <Button className="ml-auto" onClick={addToBag} type="button">
            Ajouter au panier
          </Button>
        </div>
      </div>

      <Modal open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} title="Guide des tailles">
        <p>
          Choisissez votre taille habituelle pour une coupe équilibrée. Pour une ligne plus ample, prenez la taille au-dessus.
        </p>
      </Modal>
    </div>
  );
}
