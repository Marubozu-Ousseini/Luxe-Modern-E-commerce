"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/components/cart/useCart";
import { PromoPrice } from "@/components/ui/PromoPrice";
import { promoAmountsXaf, PROMO_PERCENT_OFF } from "@/lib/promo";
import { HeroImage } from "@/components/layout/HeroImage";
import { PURCHASES_CHANGED_EVENT, PURCHASES_KEY, safeParsePurchaseCounts } from "@/lib/recommendations";
import { addToOrderHistory } from "@/lib/orderHistory";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { parseProductIdFromSlug } from "@/lib/storefrontProducts";

type PaymentMethod = "orange_money" | "mtn_mobile_money";

type Receipt = {
  orderNumber: string;
  createdAtIso: string;
  paymentMethod: PaymentMethod;
  items: Array<{ slug: string; name: string; quantity: number; priceXaf: number }>;
  totalXaf: number;
};

type BackendOrder = {
  id: string;
  items: Array<{ productId: number; quantity: number; price: number }>;
  total: number;
  paymentMethod?: PaymentMethod | "on_delivery";
  createdAt: string;
  couponCode?: string;
  discountApplied?: number;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, subtotalXaf, clearCart } = useCart();
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discount: number } | null>(null);
  const [voucherError, setVoucherError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("orange_money");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [savedToHistory, setSavedToHistory] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");

  const promoSubtotalXaf = lines.reduce((sum, l) => {
    return sum + promoAmountsXaf(l.priceXaf, l.quantity, PROMO_PERCENT_OFF).promoTotal;
  }, 0);

  const voucherDiscountXaf = appliedVoucher ? Math.round((promoSubtotalXaf * appliedVoucher.discount) / 100) : 0;
  const finalTotalXaf = Math.max(0, promoSubtotalXaf - voucherDiscountXaf);

  function applyVoucher() {
    const code = voucherCode.trim().toUpperCase();
    if (!code) {
      setVoucherError("Veuillez saisir un code");
      return;
    }

    const validVouchers: Record<string, number> = {
      BIENVENUE10: 10,
      LUXE20: 20,
      VIP30: 30,
      SPECIAL15: 15,
    };

    const discount = validVouchers[code];
    if (discount) {
      setAppliedVoucher({ code, discount });
      setVoucherError("");
    } else {
      setVoucherError("Code invalide");
      setAppliedVoucher(null);
    }
  }

  function removeVoucher() {
    setAppliedVoucher(null);
    setVoucherCode("");
    setVoucherError("");
  }

  function recordPurchase() {
    try {
      const next = { ...safeParsePurchaseCounts(localStorage.getItem(PURCHASES_KEY)) };
      for (const l of lines) {
        const qty = Math.max(1, l.quantity ?? 1);
        next[l.slug] = (next[l.slug] ?? 0) + qty;
      }
      localStorage.setItem(PURCHASES_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(PURCHASES_CHANGED_EVENT));
    } catch {
      // ignore
    }
  }

  const paymentLabel = useMemo(() => {
    return paymentMethod === "orange_money" ? "Orange Money" : "MTN Mobile Money";
  }, [paymentMethod]);

  function backHomeFromReceipt() {
    if (receipt && !savedToHistory) {
      addToOrderHistory({
        orderNumber: receipt.orderNumber,
        createdAtIso: receipt.createdAtIso,
        paymentMethodLabel: paymentLabel,
        items: receipt.items,
        totalXaf: receipt.totalXaf,
      });
      setSavedToHistory(true);
    }
    router.push("/");
  }

  async function placeOrder() {
    if (lines.length === 0) return;
    if (placingOrder) return;

    setOrderError("");
    setPlacingOrder(true);

    recordPurchase();

    const fallbackReceipt: Receipt = {
      orderNumber: `LM-${Date.now().toString(36).toUpperCase()}`,
      createdAtIso: new Date().toISOString(),
      paymentMethod,
      items: lines.map((l) => ({ slug: l.slug, name: l.name, quantity: l.quantity, priceXaf: l.priceXaf })),
      totalXaf: finalTotalXaf,
    };

    // If user is logged-in (Firebase), persist order in backend/DB.
    try {
      const auth = await getFirebaseAuth();
      const user = auth.currentUser;
      if (user) {
        const idToken = await user.getIdToken();

        const items = lines
          .map((l) => {
            const productId = parseProductIdFromSlug(l.slug);
            if (productId === null) return null;
            return { productId, quantity: l.quantity };
          })
          .filter(Boolean) as Array<{ productId: number; quantity: number }>;

        if (items.length !== lines.length) {
          throw new Error("Impossible d’identifier certains produits.");
        }

        const res = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${idToken}`,
            accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            items,
            paymentMethod,
            couponCode: appliedVoucher?.code,
          }),
        });

        const body = (await res.json().catch(() => null)) as BackendOrder | { message?: string } | null;
        if (!res.ok) {
          const msg = (body as any)?.message || "Commande échouée";
          throw new Error(msg);
        }

        const order = body as BackendOrder;
        const idToName = new Map(items.map((it, idx) => [it.productId, lines[idx]!.name] as const));
        const idToSlug = new Map(items.map((it, idx) => [it.productId, lines[idx]!.slug] as const));

        setReceipt({
          orderNumber: order.id,
          createdAtIso: order.createdAt,
          paymentMethod: (order.paymentMethod === "mtn_mobile_money" || order.paymentMethod === "orange_money") ? order.paymentMethod : paymentMethod,
          items: order.items.map((it) => ({
            slug: idToSlug.get(it.productId) ?? String(it.productId),
            name: idToName.get(it.productId) ?? `Produit ${it.productId}`,
            quantity: it.quantity,
            priceXaf: it.price,
          })),
          totalXaf: order.total,
        });

        clearCart();
        setPlacingOrder(false);
        return;
      }
    } catch (e: any) {
      // If backend persistence fails, keep the existing local receipt flow.
      setOrderError(e?.message || "Commande échouée");
    }

    setReceipt(fallbackReceipt);
    clearCart();
    setPlacingOrder(false);
  }

  return (
    <div className="mx-auto w-full max-w-content px-6 md:px-8">
      <header className="sticky top-0 z-40 -mx-6 border-b border-border-soft bg-bg-subtle/80 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="font-serif text-lg tracking-tight-luxe-sm">
            Malafaareh
          </Link>
          <p className="text-sm text-text-muted">Paiement sécurisé</p>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
          <span className="rounded-full border border-border-soft bg-bg-surface px-3 py-1">Livraison</span>
          <span className="opacity-50">→</span>
          <span className="rounded-full border border-border-soft bg-bg-surface px-3 py-1">Paiement</span>
          <span className="opacity-50">→</span>
          <span className="rounded-full border border-border-soft bg-bg-surface px-3 py-1">Récapitulatif</span>
        </div>
      </header>

      <div className="py-10">
        {receipt ? (
          <div className="grid grid-cols-1 gap-10">
            <div className="overflow-hidden rounded-modal border border-border-soft bg-bg-surface shadow-soft">
              <div className="relative aspect-[21/9] bg-bg-subtle">
                <HeroImage pageKey="checkout" alt="Image héro – Paiement" title="Reçu" subtitle="Commande confirmée" />
              </div>
            </div>

            <section className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
              <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Merci pour votre commande</p>
              <h1 className="mt-3 font-serif text-3xl tracking-tight-luxe">Reçu</h1>

              <div className="mt-6 grid gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Numéro</span>
                  <span className="font-medium text-text-primary">{receipt.orderNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Date</span>
                  <span className="font-medium text-text-primary">
                    {new Intl.DateTimeFormat("fr-FR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(receipt.createdAtIso))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Paiement</span>
                  <span className="font-medium text-text-primary">{paymentLabel}</span>
                </div>
              </div>

              <div className="mt-6 border-t border-border-soft pt-5">
                <h2 className="font-serif text-2xl tracking-tight-luxe-sm">Articles</h2>
                <div className="mt-4 space-y-3">
                  {receipt.items.map((l) => (
                    <div key={l.slug} className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{l.name}</p>
                        <p className="mt-1 text-xs text-text-muted">Qté {l.quantity}</p>
                      </div>
                      <PromoPrice priceXaf={l.priceXaf} quantity={l.quantity} />
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm font-medium text-text-primary">Total</p>
                  <p className="text-sm font-medium text-text-primary">{receipt.totalXaf.toLocaleString("fr-FR")} XAF</p>
                </div>
              </div>

              <div className="mt-8">
                <Button type="button" className="w-full" onClick={backHomeFromReceipt}>
                  Retour à l’accueil
                </Button>
              </div>
            </section>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-modal border border-border-soft bg-bg-surface shadow-soft">
              <div className="relative aspect-[21/9] bg-bg-subtle">
                <HeroImage pageKey="checkout" alt="Image héro – Paiement" title="Paiement" subtitle="Le passage sans friction" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Le passage sans friction</p>
                <h1 className="mt-3 font-serif text-4xl tracking-tight-luxe">Paiement</h1>
                <p className="mt-3 text-sm text-text-muted">Continuer en invité</p>

                <form className="mt-8 space-y-6">
                  <section className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
                    <h2 className="font-serif text-2xl tracking-tight-luxe-sm">Livraison</h2>
                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <input
                        id="checkout-firstName"
                        name="firstName"
                        autoComplete="given-name"
                        className="rounded-card border border-border-soft bg-bg-subtle px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                        placeholder="Prénom"
                      />
                      <input
                        id="checkout-lastName"
                        name="lastName"
                        autoComplete="family-name"
                        className="rounded-card border border-border-soft bg-bg-subtle px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                        placeholder="Nom"
                      />
                      <input
                        id="checkout-address"
                        name="address"
                        autoComplete="street-address"
                        className="md:col-span-2 rounded-card border border-border-soft bg-bg-subtle px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                        placeholder="Adresse"
                      />
                      <input
                        id="checkout-city"
                        name="city"
                        autoComplete="address-level2"
                        className="rounded-card border border-border-soft bg-bg-subtle px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                        placeholder="Ville"
                      />
                      <input
                        id="checkout-postalCode"
                        name="postalCode"
                        autoComplete="postal-code"
                        className="rounded-card border border-border-soft bg-bg-subtle px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                        placeholder="Code postal"
                      />
                      <input
                        id="checkout-email"
                        name="email"
                        autoComplete="email"
                        className="md:col-span-2 rounded-card border border-border-soft bg-bg-subtle px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                        placeholder="E-mail"
                        type="email"
                      />
                    </div>
                    <p className="mt-4 text-xs text-text-muted">Aucun frais surprise. Estimation de livraison avant paiement.</p>
                  </section>

                  <section className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
                    <h2 className="font-serif text-2xl tracking-tight-luxe-sm">Code promotionnel</h2>
                    <p className="mt-2 text-sm text-text-muted">Appliquer un code de réduction à votre commande.</p>
                    <div className="mt-4 flex items-start gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={voucherCode}
                          onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                          placeholder="Ex: BIENVENUE10"
                          disabled={appliedVoucher !== null}
                          className="w-full rounded-card border border-border-soft bg-bg-subtle px-4 py-3 text-sm uppercase outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-50"
                        />
                        {voucherError && <p className="mt-2 text-xs text-promo-old">{voucherError}</p>}
                        {appliedVoucher && (
                          <p className="mt-2 text-xs text-green-600">
                            Code {appliedVoucher.code} appliqué : -{appliedVoucher.discount}%
                          </p>
                        )}
                      </div>
                      {appliedVoucher ? (
                        <button
                          type="button"
                          onClick={removeVoucher}
                          className="rounded-card border border-border-soft bg-bg-surface px-4 py-3 text-sm text-text-primary shadow-soft transition duration-150 ease-premium hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                        >
                          Retirer
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={applyVoucher}
                          className="rounded-card bg-accent px-4 py-3 text-sm font-medium text-bg-surface shadow-soft transition duration-150 ease-premium hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                        >
                          Appliquer
                        </button>
                      )}
                    </div>
                  </section>

                  <section className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
                    <h2 className="font-serif text-2xl tracking-tight-luxe-sm">Paiement</h2>
                    <div className="mt-5 space-y-3">
                      <label className="flex items-center justify-between rounded-card border border-border-soft bg-bg-subtle px-4 py-3 text-sm">
                        <span className="text-text-primary">Orange Money</span>
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === "orange_money"}
                          onChange={() => setPaymentMethod("orange_money")}
                          className="accent-[var(--accent)]"
                        />
                      </label>
                      <label className="flex items-center justify-between rounded-card border border-border-soft bg-bg-subtle px-4 py-3 text-sm">
                        <span className="text-text-primary">MTN Mobile Money</span>
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === "mtn_mobile_money"}
                          onChange={() => setPaymentMethod("mtn_mobile_money")}
                          className="accent-[var(--accent)]"
                        />
                      </label>
                    </div>
                    <p className="mt-4 text-xs text-text-muted">Chiffrement sécurisé. Protections acheteur appliquées avec calme.</p>
                  </section>

                  <section className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
                    <h2 className="font-serif text-2xl tracking-tight-luxe-sm">Récapitulatif</h2>
                    <p className="mt-3 text-sm text-text-muted">La création de compte est optionnelle après l’achat.</p>
                    <div className="mt-6">
                      <Button type="button" className="w-full" disabled={lines.length === 0} onClick={placeOrder}>
                        Passer commande
                      </Button>
                      <p className="mt-3 text-xs text-text-muted">Les indications apparaissent ici dans une intégration réelle.</p>
                    </div>
                  </section>
                </form>
              </div>

              <aside className="lg:col-span-5">
                <div className="sticky top-28 rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
                  <h2 className="font-serif text-2xl tracking-tight-luxe-sm">Récapitulatif</h2>

                  <div className="mt-6 space-y-4">
                    {lines.length === 0 ? (
                      <p className="text-sm text-text-muted">Aucun article — retour à la boutique.</p>
                    ) : (
                      lines.map((l) => (
                        <div key={l.slug} className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-text-primary">{l.name}</p>
                            <p className="mt-1 text-xs text-text-muted">Qté {l.quantity}</p>
                          </div>
                          <PromoPrice priceXaf={l.priceXaf} quantity={l.quantity} />
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-8 border-t border-border-soft pt-5">
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
                    {appliedVoucher && (
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-sm text-green-600">Code promo ({appliedVoucher.code})</p>
                        <p className="text-sm font-medium text-green-600">-{voucherDiscountXaf.toLocaleString("fr-FR")} XAF</p>
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm text-text-muted">Livraison</p>
                      <p className="text-sm text-text-muted">Calculée</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm text-text-muted">Paiement</p>
                      <p className="text-sm text-text-muted">{paymentLabel}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm font-medium text-text-primary">Total</p>
                      <p className="text-sm font-medium text-text-primary">{finalTotalXaf.toLocaleString("fr-FR")} XAF</p>
                    </div>
                    <p className="mt-3 text-xs text-text-muted">—</p>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
