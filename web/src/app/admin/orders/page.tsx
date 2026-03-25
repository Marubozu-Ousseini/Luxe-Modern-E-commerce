"use client";

import { useEffect, useMemo, useState } from "react";
import { subscribeToAuthState } from "@/lib/firebaseClient";

type OrderStatus = "paid" | "pending" | "failed";

type OrderItem = {
  productId: number;
  quantity: number;
  price: number;
  name?: string;
};

type AdminOrder = {
  id: string;
  userId: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerTown?: string | null;
  items?: OrderItem[];
  total: number;
  currency?: string;
  status: OrderStatus;
  paymentMethod?: "orange_money" | "mtn_mobile_money" | "on_delivery";
  couponCode?: string;
  discountApplied?: number;
  adminConfirmed?: boolean;
  createdAt?: string;
  subtotal?: number;
};

function formatDate(value?: string) {
  if (!value) return "";
  const t = Date.parse(value);
  if (!Number.isFinite(t)) return value;
  return new Date(t).toLocaleString();
}

function formatXaf(value: number) {
  const v = Number(value) || 0;
  return `${v.toLocaleString("fr-FR")} XAF`;
}

function statusLabel(status: OrderStatus) {
  if (status === "paid") return "Payée";
  if (status === "pending") return "En attente";
  return "Échouée";
}

export default function AdminOrdersPage() {
  const [items, setItems] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>("");
  const [authRequired, setAuthRequired] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailsById, setDetailsById] = useState<Record<string, AdminOrder>>({});
  const [detailsLoadingId, setDetailsLoadingId] = useState<string | null>(null);
  const [discountDraftById, setDiscountDraftById] = useState<Record<string, string>>({});

  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [query, setQuery] = useState<string>("");

  async function getAdminAuthHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
    const auth = await import("@/lib/firebaseClient").then((m) => m.getFirebaseAuth());
    const user = auth.currentUser;
    if (!user) throw new Error("Connexion requise");
    const idToken = await user.getIdToken();
    return {
      accept: "application/json",
      authorization: `Bearer ${idToken}`,
      ...(extra || {}),
    };
  }

  async function refreshOrders() {
    setLoading(true);
    setLoadError("");
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch("/api/admin/orders", { headers, credentials: "include" });
      if (res.status === 401 || res.status === 403) {
        setAuthRequired(true);
        setItems([]);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || "Impossible de charger les commandes.");
      }
      const data = (await res.json()) as AdminOrder[];
      setItems(Array.isArray(data) ? data : []);
      setAuthRequired(false);
    } catch (e: any) {
      setAuthRequired(true);
      setItems([]);
      setLoadError(e?.message || "Impossible de charger les commandes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshOrders();
    const unsub = subscribeToAuthState(() => {
      void refreshOrders();
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...items];

    list.sort((a, b) => {
      const ta = Date.parse(String(a.createdAt || ""));
      const tb = Date.parse(String(b.createdAt || ""));
      if (Number.isFinite(tb) && Number.isFinite(ta)) return tb - ta;
      return String(b.id).localeCompare(String(a.id));
    });

    if (filterStatus !== "all") list = list.filter((o) => o.status === filterStatus);

    if (q) {
      list = list.filter((o) => {
        const id = String(o.id || "").toLowerCase();
        const userId = String(o.userId || "").toLowerCase();
        const coupon = String(o.couponCode || "").toLowerCase();
        return id.includes(q) || userId.includes(q) || coupon.includes(q);
      });
    }

    return list;
  }, [items, filterStatus, query]);

  async function updateStatus(id: string, status: OrderStatus) {
    const headers = await getAdminAuthHeaders({ "Content-Type": "application/json" });
    const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers,
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    if (res.status === 401 || res.status === 403) {
      setAuthRequired(true);
      throw new Error("Authentification admin requise.");
    }
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.message || "Impossible de mettre à jour la commande.");
    const updated = body as AdminOrder;
    setItems((prev) => prev.map((o) => (o.id === id ? updated : o)));
  }

  async function fetchDetails(id: string) {
    setDetailsLoadingId(id);
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, { headers, credentials: "include" });
      if (res.status === 401 || res.status === 403) {
        setAuthRequired(true);
        throw new Error("Authentification admin requise.");
      }
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message || "Impossible de charger les détails.");
      const detailed = body as AdminOrder;
      setDetailsById((prev) => ({ ...prev, [id]: detailed }));
      setDiscountDraftById((prev) => ({ ...prev, [id]: String((detailed as any)?.discountApplied ?? 0) }));
    } finally {
      setDetailsLoadingId((prev) => (prev === id ? null : prev));
    }
  }

  async function saveDiscount(id: string) {
    const draft = discountDraftById[id] ?? "0";
    const discountApplied = Math.max(0, Math.round(Number(draft) || 0));
    const headers = await getAdminAuthHeaders({ "Content-Type": "application/json" });
    const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}/discount`, {
      method: "PATCH",
      headers,
      credentials: "include",
      body: JSON.stringify({ discountApplied }),
    });
    if (res.status === 401 || res.status === 403) {
      setAuthRequired(true);
      throw new Error("Authentification admin requise.");
    }
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.message || "Impossible d'appliquer la remise.");
    const updated = body as AdminOrder;
    setItems((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));
    setDetailsById((prev) => {
      const current = prev[id];
      if (!current) return prev;
      return { ...prev, [id]: { ...current, ...updated } };
    });
  }

  async function confirmShipment(id: string) {
    const headers = await getAdminAuthHeaders({ "Content-Type": "application/json" });
    const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}/confirm-shipment`, {
      method: "PATCH",
      headers,
      credentials: "include",
    });
    if (res.status === 401 || res.status === 403) {
      setAuthRequired(true);
      throw new Error("Authentification admin requise.");
    }
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.message || "Impossible de confirmer l'expédition.");
    const updated = body as AdminOrder;
    setItems((prev) => prev.map((o) => (o.id === id ? updated : o)));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Commandes</h1>
          <p className="text-sm text-muted-foreground">Liste connectée à l'API (pas de données d'exemple).</p>
        </div>
        <button
          onClick={() => void refreshOrders()}
          className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium"
          disabled={loading}
        >
          Rafraîchir
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Statut</label>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="all">Tous</option>
            <option value="paid">Payées</option>
            <option value="pending">En attente</option>
            <option value="failed">Échouées</option>
          </select>
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <label className="text-sm font-medium">Recherche</label>
          <input
            className="h-10 rounded-md border bg-background px-3 text-sm"
            placeholder="ID, userId, coupon…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {authRequired && (
        <div className="rounded-md border p-4 text-sm">
          Connexion admin requise (Firebase). Ouvrez l'admin et reconnectez-vous.
        </div>
      )}

      {loadError && <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError}</div>}

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">Client</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Total</th>
                <th className="px-4 py-3 text-left font-medium">Paiement</th>
                <th className="px-4 py-3 text-left font-medium">Statut</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="px-4 py-4" colSpan={7}>
                    Chargement…
                  </td>
                </tr>
              )}

              {!loading && visible.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground" colSpan={7}>
                    Aucune commande.
                  </td>
                </tr>
              )}

              {!loading &&
                visible.map((o) => (
                  <>
                    <tr key={o.id} className="border-b last:border-b-0">
                      <td className="px-4 py-3 font-medium">{o.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span>{o.customerName || o.userId}</span>
                          {o.customerPhone ? <span className="text-xs text-muted-foreground">{o.customerPhone}</span> : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">{formatDate(o.createdAt)}</td>
                      <td className="px-4 py-3">{formatXaf(o.total)}</td>
                      <td className="px-4 py-3">{o.paymentMethod || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="mr-2 inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                          {statusLabel(o.status)}
                        </span>
                        {o.adminConfirmed ? (
                          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">Expédition confirmée</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="h-9 rounded-md border px-3 text-sm"
                            onClick={async () => {
                              const next = expandedId === o.id ? null : o.id;
                              setExpandedId(next);
                              if (next && !detailsById[o.id]) {
                                // Show details immediately, keep loading state until fetch completes
                                setDetailsById((prev) => ({ ...prev, [o.id]: prev[o.id] || {} }));
                                try {
                                  await fetchDetails(o.id);
                                } catch (err) {
                                  setLoadError(String((err && (err as any).message) || err || 'Erreur de chargement'));
                                }
                              }
                            }}
                          >
                            Détails
                          </button>

                          <select
                            className="h-9 rounded-md border bg-background px-2 text-sm"
                            value={o.status}
                            onChange={(e) => {
                              const next = e.target.value as OrderStatus;
                              void updateStatus(o.id, next).catch((err) => setLoadError(String(err?.message || err)));
                            }}
                          >
                            <option value="paid">Payée</option>
                            <option value="pending">En attente</option>
                            <option value="failed">Échouée</option>
                          </select>

                          <button
                            className="h-9 rounded-md border px-3 text-sm"
                            disabled={Boolean(o.adminConfirmed)}
                            onClick={() => {
                              void confirmShipment(o.id).catch((err) => setLoadError(String(err?.message || err)));
                            }}
                          >
                            Confirmer expédition
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expandedId === o.id ? (
                      <tr className="border-b last:border-b-0">
                        <td colSpan={7} className="px-4 py-4">
                          {detailsLoadingId === o.id ? (
                            <div className="text-sm text-muted-foreground">Chargement des détails…</div>
                          ) : null}

                          {detailsById[o.id] ? (
                            <div className="grid gap-4 rounded-md border bg-muted/10 p-4">
                              <div className="grid gap-1 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Client: </span>
                                  <span className="font-medium">{detailsById[o.id].customerName || detailsById[o.id].userId}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Téléphone: </span>
                                  <span className="font-medium">{detailsById[o.id].customerPhone || "—"}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Ville: </span>
                                  <span className="font-medium">{detailsById[o.id].customerTown || "—"}</span>
                                </div>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                  <thead className="border-b">
                                    <tr className="text-left">
                                      <th className="py-2 pr-4 font-medium">Produit</th>
                                      <th className="py-2 pr-4 font-medium">Qté</th>
                                      <th className="py-2 pr-4 font-medium">Prix</th>
                                      <th className="py-2 pr-4 font-medium">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(detailsById[o.id].items || []).map((it, idx) => (
                                      <tr key={`${it.productId}-${idx}`} className="border-b last:border-b-0">
                                        <td className="py-2 pr-4">{it.name ? `${it.name} (#${it.productId})` : `#${it.productId}`}</td>
                                        <td className="py-2 pr-4">{it.quantity}</td>
                                        <td className="py-2 pr-4">{formatXaf(it.price)}</td>
                                        <td className="py-2 pr-4">{formatXaf(it.price * it.quantity)}</td>
                                      </tr>
                                    ))}
                                    {(detailsById[o.id].items || []).length === 0 ? (
                                      <tr>
                                        <td colSpan={4} className="py-3 text-muted-foreground">
                                          Aucun article (détails indisponibles).
                                        </td>
                                      </tr>
                                    ) : null}
                                  </tbody>
                                </table>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="grid gap-1 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Sous-total: </span>
                                    <span className="font-medium">{formatXaf(Number(detailsById[o.id].subtotal ?? 0))}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Remise appliquée: </span>
                                    <span className="font-medium">{formatXaf(Number(detailsById[o.id].discountApplied ?? 0))}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Total: </span>
                                    <span className="font-medium">{formatXaf(Number(detailsById[o.id].total ?? 0))}</span>
                                  </div>
                                </div>

                                <div className="grid gap-2">
                                  <label className="text-sm font-medium">Ajouter / modifier remise (XAF)</label>
                                  <div className="flex gap-2">
                                    <input
                                      className="h-9 w-40 rounded-md border bg-background px-3 text-sm"
                                      type="number"
                                      min={0}
                                      step={1}
                                      value={discountDraftById[o.id] ?? "0"}
                                      onChange={(e) =>
                                        setDiscountDraftById((prev) => ({
                                          ...prev,
                                          [o.id]: e.target.value,
                                        }))
                                      }
                                    />
                                    <button
                                      className="h-9 rounded-md border px-3 text-sm"
                                      onClick={() => {
                                        void saveDiscount(o.id).catch((err) => setLoadError(String(err?.message || err)));
                                      }}
                                    >
                                      Appliquer
                                    </button>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    La remise est plafonnée automatiquement au sous-total.
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ) : null}
                  </>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
