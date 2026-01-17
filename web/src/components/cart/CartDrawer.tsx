"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/components/cart/CartProvider";
import { PromoPrice } from "@/components/ui/PromoPrice";
import { promoAmountsXaf, PROMO_PERCENT_OFF } from "@/lib/promo";

export function CartDrawer() {
  const { isOpen, closeCart, lines, setQuantity, removeLine, subtotalXaf } = useCart();

  const promoSubtotalXaf = lines.reduce((sum, l) => {
    return sum + promoAmountsXaf(l.priceXaf, l.quantity, PROMO_PERCENT_OFF).promoTotal;
  }, 0);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] transition duration-200 ease-premium",
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!isOpen}
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/20 transition duration-200 ease-premium",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={closeCart}
      />

      <aside
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border-soft bg-bg-surface shadow-soft transition duration-250 ease-premium",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Panier"
      >
        <div className="flex items-center justify-between border-b border-border-soft px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Panier</p>
            <p className="mt-1 text-sm text-text-muted">Paiement sécurisé · Qualité garantie</p>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-card border border-border-soft bg-bg-subtle px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            Fermer
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-6">
          {lines.length === 0 ? (
            <div className="rounded-modal border border-border-soft bg-bg-subtle p-6">
              <p className="text-sm text-text-muted">Aucun article pour l’instant — découvrez nos essentiels.</p>
              <div className="mt-5">
                <Link
                  href="/shop?edit=essentials"
                  onClick={closeCart}
                  className="text-sm text-text-primary underline decoration-border-soft underline-offset-4"
                >
                  Découvrir les essentiels
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {lines.map((l) => (
                <div
                  key={l.slug}
                  className="rounded-modal border border-border-soft bg-bg-subtle p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{l.name}</p>
                      {(l.size || l.color) && (
                        <p className="mt-2 text-xs text-text-muted">
                          {[l.color, l.size].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(l.slug)}
                      className="text-sm text-text-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    >
                      Retirer
                    </button>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      className="h-9 w-9 rounded-card border border-border-soft bg-bg-surface text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      onClick={() => setQuantity(l.slug, Math.max(0, l.quantity - 1))}
                      aria-label="Diminuer la quantité"
                    >
                      −
                    </button>
                    <div className="min-w-10 text-center text-sm text-text-primary">{l.quantity}</div>
                    <button
                      type="button"
                      className="h-9 w-9 rounded-card border border-border-soft bg-bg-surface text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      onClick={() => setQuantity(l.slug, l.quantity + 1)}
                      aria-label="Augmenter la quantité"
                    >
                      +
                    </button>

                    <div className="ml-auto text-sm text-text-muted">
                      <PromoPrice priceXaf={l.priceXaf} quantity={l.quantity} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border-soft px-6 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">Sous-total</p>
            <PromoPrice
              priceXaf={subtotalXaf}
              totals={{
                oldTotal: subtotalXaf,
                promoTotal: promoSubtotalXaf,
                gain: Math.max(0, subtotalXaf - promoSubtotalXaf),
              }}
            />
          </div>
          <p className="mt-2 text-xs text-text-muted">Estimation des frais de livraison au paiement.</p>

          <div className="mt-5 flex gap-3">
            <Link
              href="/checkout"
              onClick={closeCart}
              className={cn(
                "inline-flex flex-1 items-center justify-center rounded-card bg-accent px-5 py-3 text-sm font-medium text-bg-surface shadow-soft transition duration-150 ease-premium hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 motion-reduce:transform-none",
                lines.length === 0 && "pointer-events-none opacity-50"
              )}
            >
              Commander
            </Link>
            <Button variant="subtle" className="px-4" onClick={closeCart} type="button">
              Continuer le shopping
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
