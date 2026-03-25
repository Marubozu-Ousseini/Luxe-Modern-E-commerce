"use client";

import { useEffect, useMemo, useState } from "react";
import { HeroImage } from "@/components/layout/HeroImage";
import { PromoPrice } from "@/components/ui/PromoPrice";
import { ORDER_HISTORY_KEY, safeParseOrderHistory } from "@/lib/orderHistory";
import { subscribeToAuthState } from "@/lib/firebaseClient";
import { fetchStorefrontProducts } from "@/lib/storefrontProducts";
import type { Product } from "@/lib/products";

type ApiOrder = {
  id: string;
  items: Array<{ productId: number; quantity: number; price: number }>;
  total: number;
  currency: "XAF";
  status: "paid" | "pending" | "failed";
  paymentMethod?: "orange_money" | "mtn_mobile_money" | "on_delivery";
  createdAt: string;
  discountApplied?: number;
  couponCode?: string;
  address?: string;
  town?: string;
  shippingAddress?: string;
};

type OrderHistoryItem = {
  orderNumber: string;
  createdAtIso: string;
  paymentMethodLabel: string;
  totalXaf: number;
  discountApplied?: number;
  address?: string;
  items: Array<{
    slug: string;
    name: string;
    quantity: number;
    priceXaf: number;
  }>;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [source, setSource] = useState<"backend" | "local">("local");

  useEffect(() => {
    function loadLocal() {
      try {
        setOrders(safeParseOrderHistory(localStorage.getItem(ORDER_HISTORY_KEY)));
      } catch {
        setOrders([]);
      }
      setSource("local");
    }

    async function loadBackend() {
      const auth = await import("@/lib/firebaseClient").then((m) => m.getFirebaseAuth());
      const user = auth.currentUser;
      if (!user) {
        loadLocal();
        return;
      }

      const idToken = await user.getIdToken();
      const [products, ordersRes] = await Promise.all([
        fetchStorefrontProducts({ limit: 200 }).catch(() => [] as Product[]),
        fetch("/api/orders/me", {
          method: "GET",
          headers: { authorization: `Bearer ${idToken}`, accept: "application/json" },
          credentials: "include",
        }),
      ]);

      if (!ordersRes.ok) {
        loadLocal();
        return;
      }

      const data = (await ordersRes.json()) as unknown;
      const apiOrders = Array.isArray(data) ? (data as ApiOrder[]) : [];

      const productById = new Map<number, Product>();
      for (const p of products) {
        if (typeof (p as any).id === "number") productById.set((p as any).id, p);
      }

      const mapped: OrderHistoryItem[] = apiOrders.map((o) => {
        const paymentMethodLabel = o.paymentMethod === "mtn_mobile_money" ? "MTN Mobile Money" : o.paymentMethod === "orange_money" ? "Orange Money" : "Paiement";
        // Fetch user address (town) if available
        const address = o.address || o.town || o.shippingAddress || "";
        return {
          orderNumber: o.id,
          createdAtIso: o.createdAt,
          paymentMethodLabel,
          totalXaf: o.total,
          discountApplied: o.discountApplied || 0,
          address,
          items: (o.items || []).map((it) => {
            const p = productById.get(it.productId);
            return {
              slug: p?.slug ?? String(it.productId),
              name: p?.name ?? `Produit ${it.productId}`,
              quantity: it.quantity,
              priceXaf: it.price,
            };
          }),
        };
      });

      setOrders(mapped);
      setSource("backend");
    }

    loadBackend();
    const unsub = subscribeToAuthState(() => {
      void loadBackend();
    });
    return () => unsub();
  }, []);

  const hasOrders = orders.length > 0;

  const formatted = useMemo(() => {
    return orders.map((o) => ({
      ...o,
      dateLabel: new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(o.createdAtIso)),
      totalLabel: `${o.totalXaf.toLocaleString("fr-FR")} XAF`,
      itemCount: o.items.reduce((sum, l) => sum + (l.quantity || 0), 0),
      address: o.address || "",
    }));
  }, [orders]);

  return (
    <div className="pb-16">
      <div className="mt-10 rounded-modal border border-border-soft bg-bg-surface p-10 shadow-soft">
        <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Commandes</p>
        <h1 className="mt-4 font-serif text-4xl tracking-tight-luxe">Historique</h1>
        <p className="mt-5 max-w-2xl text-sm leading-6 text-text-muted">
          Retrouvez vos commandes enregistrées{source === "backend" ? " (compte)" : " (cet appareil)"}.
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-modal border border-border-soft bg-bg-surface shadow-soft">
        <div className="relative aspect-[21/9] bg-bg-subtle">
          <HeroImage pageKey="orders" alt="Image héro – Commandes" title="Commandes" subtitle="Historique" />
        </div>
      </div>

      <div className="mt-10">
        {!hasOrders ? (
          <div className="rounded-modal border border-border-soft bg-bg-surface p-8 shadow-soft">
            <p className="text-sm text-text-muted">Aucune commande pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {formatted.map((o) => (
              <div key={o.orderNumber} className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Commande</p>
                    <p className="mt-1 font-serif text-2xl tracking-tight-luxe-sm">{o.orderNumber}</p>
                    <p className="mt-2 text-sm text-text-muted">{o.dateLabel}</p>
                    {o.address && (
                      <p className="mt-2 text-sm text-text-muted">Adresse: {o.address}</p>
                    )}
                  </div>
                  <div className="text-sm">
                    <p className="text-text-muted">Paiement</p>
                    <p className="font-medium text-text-primary">{o.paymentMethodLabel}</p>
                    <p className="mt-2 text-text-muted">Total</p>
                    <p className="font-medium text-text-primary">{o.totalLabel}</p>
                    {typeof o.discountApplied === "number" && o.discountApplied > 0 && (
                      <p className="mt-2 text-sm text-text-muted">Remise: <span className="font-medium text-green-700">{o.discountApplied.toLocaleString("fr-FR")} XAF</span></p>
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-border-soft pt-4">
                  <h2 className="font-serif text-2xl tracking-tight-luxe-sm mb-2">Articles</h2>
                  <div className="space-y-3">
                    {o.items.map((l) => (
                      <div key={l.slug} className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-text-primary">{l.name}</p>
                          <p className="mt-1 text-xs text-text-muted">Qté {l.quantity}</p>
                        </div>
                        {/* Reuse PromoPrice for consistent price display */}
                        <PromoPrice priceXaf={l.priceXaf} quantity={l.quantity} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm font-medium text-text-primary">Total</p>
                    <p className="text-sm font-medium text-text-primary">{o.totalXaf.toLocaleString("fr-FR")} XAF</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
