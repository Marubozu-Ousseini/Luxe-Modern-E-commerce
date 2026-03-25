"use client";

import { useEffect, useMemo, useState } from "react";
import { subscribeToAuthState } from "@/lib/firebaseClient";
import { cn } from "@/lib/cn";
import { formatXaf } from "@/lib/money";

type ApiOrderStatus = "paid" | "pending" | "failed";

type ApiOrder = {
  id: string;
  userId: string;
  total: number;
  status: ApiOrderStatus;
  adminConfirmed?: boolean;
  createdAt?: string;
};

type AccountingRow = {
  id: string;
  monthKey: string;
  date: string;
  number: string;
  product: string;
  quantity: number;
  unitPriceXaf: number;
  totalPriceXaf: number;
  notes: string;
};

type SortKey = "number" | "product" | "quantity" | "unitPrice" | "totalPrice" | "notes";
type SortDir = "asc" | "desc";

const MONTHS_KEY = "malafaareh_admin_accounting_months_v2";

function currentMonthKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function parseMonthLabel(monthKey: string) {
  const [yRaw, mRaw] = monthKey.split("-");
  const y = Number(yRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return monthKey;
  const date = new Date(y, m - 1, 1);
  try {
    const fmt = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
    const label = fmt.format(date);
    return label.charAt(0).toUpperCase() + label.slice(1);
  } catch {
    return monthKey;
  }
}

function safeParseMonths(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string" && /^\d{4}-\d{2}$/.test(x));
  } catch {
    return [];
  }
}

function formatDateFr(iso?: string): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  try {
    return new Date(t).toLocaleDateString("fr-FR");
  } catch {
    return iso;
  }
}

function parseIsoToMonthKey(input?: string): string | null {
  if (!input) return null;
  const t = Date.parse(input);
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string) {
  const s = String(value);
  if (/[\n\r",;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function AdminComptabilitePage() {
  const [months, setMonths] = useState<string[]>([]);
  const [activeMonth, setActiveMonth] = useState<string>(currentMonthKey());
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [monthToAdd, setMonthToAdd] = useState<string>(currentMonthKey());

  const [sortKey, setSortKey] = useState<SortKey>("number");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [status, setStatus] = useState<string>("");
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>("");
  const [authRequired, setAuthRequired] = useState(false);

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
        setOrders([]);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || "Impossible de charger les commandes.");
      }
      const data = (await res.json()) as ApiOrder[];
      setOrders(Array.isArray(data) ? data : []);
      setAuthRequired(false);
    } catch (e: any) {
      setAuthRequired(true);
      setOrders([]);
      setLoadError(e?.message || "Impossible de charger les commandes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    try {
      const storedMonths = safeParseMonths(localStorage.getItem(MONTHS_KEY));
      const now = currentMonthKey();
      const combined = Array.from(new Set<string>([...storedMonths, now]))
        .filter((m) => /^\d{4}-\d{2}$/.test(m))
        .sort()
        .reverse();

      const initial = combined[0] ?? now;
      setMonths(combined.length ? combined : [now]);
      setActiveMonth(initial);
      setSelectedMonths([initial]);
      setMonthToAdd(now);
    } catch {
      const now = currentMonthKey();
      setMonths([now]);
      setActiveMonth(now);
      setSelectedMonths([now]);
      setMonthToAdd(now);
    }
    void refreshOrders();
    const unsub = subscribeToAuthState(() => {
      void refreshOrders();
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const eligible = orders.filter((o) => o.status === "paid" || Boolean(o.adminConfirmed));
    const orderMonths = new Set<string>();
    for (const o of eligible) {
      const mk = parseIsoToMonthKey(o.createdAt) ?? currentMonthKey();
      if (mk) orderMonths.add(mk);
    }

    const now = currentMonthKey();
    const combined = Array.from(new Set<string>([...months, ...Array.from(orderMonths), now]))
      .filter((m) => /^\d{4}-\d{2}$/.test(m))
      .sort()
      .reverse();
    if (combined.length === 0) return;
    if (combined.join("|") !== months.join("|")) persistMonths(combined);

    setActiveMonth((prev) => (combined.includes(prev) ? prev : combined[0] ?? now));
    setSelectedMonths((prev) => {
      const kept = prev.filter((m) => combined.includes(m));
      if (kept.length > 0) return kept;
      const initial = combined[0] ?? now;
      return [initial];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  function persistMonths(nextMonths: string[]) {
    setMonths(nextMonths);
    try {
      localStorage.setItem(MONTHS_KEY, JSON.stringify(nextMonths));
    } catch {
      // ignore
    }
  }

  function ensureMonth(monthKey: string) {
    setStatus("");
    if (!/^\d{4}-\d{2}$/.test(monthKey)) {
      setStatus("Mois invalide.");
      return;
    }

    if (!months.includes(monthKey)) {
      const nextMonths = [monthKey, ...months].sort().reverse();
      persistMonths(nextMonths);
    }

    setActiveMonth(monthKey);
    setSelectedMonths((prev) => {
      if (prev.includes(monthKey)) return prev;
      const next = [monthKey, ...prev];
      return next.slice(0, 6);
    });
  }

  function toggleSelectedMonth(monthKey: string) {
    setStatus("");
    setSelectedMonths((prev) => {
      const isSelected = prev.includes(monthKey);
      if (isSelected) {
        if (prev.length === 1) {
          setStatus("Sélectionnez au moins 1 mois.");
          return prev;
        }
        return prev.filter((m) => m !== monthKey);
      }
      if (prev.length >= 6) {
        setStatus("Maximum 6 mois à la fois.");
        return prev;
      }
      return [monthKey, ...prev];
    });
  }

  function onSort(nextKey: SortKey) {
    setStatus("");
    setSortKey((prev) => {
      if (prev !== nextKey) {
        setSortDir("asc");
        return nextKey;
      }
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return prev;
    });
  }

  const rows = useMemo<AccountingRow[]>(() => {
    const wanted = new Set(selectedMonths);
    const eligibleOrders = orders.filter((o) => o.status === "paid" || Boolean(o.adminConfirmed));

    const out: AccountingRow[] = [];
    for (const o of eligibleOrders) {
      const monthKey = parseIsoToMonthKey(o.createdAt) ?? currentMonthKey();
      if (!wanted.has(monthKey)) continue;
      const total = Number(o.total) || 0;
      const paidLabel = o.status === "paid" ? "Payée" : "En attente";
      const shipLabel = o.adminConfirmed ? "Expédition confirmée" : "Non confirmée";
      out.push({
        id: o.id,
        monthKey,
        date: formatDateFr(o.createdAt),
        number: o.id,
        product: "Commande",
        quantity: 1,
        unitPriceXaf: total,
        totalPriceXaf: total,
        notes: `${o.userId} · ${paidLabel} · ${shipLabel}`,
      });
    }
    return out;
  }, [orders, selectedMonths]);

  const sortedRows = useMemo(() => {
    const list = [...rows];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === "number") return dir * a.number.localeCompare(b.number, "fr");
      if (sortKey === "product") return dir * a.product.localeCompare(b.product, "fr");
      if (sortKey === "quantity") return dir * (a.quantity - b.quantity);
      if (sortKey === "unitPrice") return dir * (a.unitPriceXaf - b.unitPriceXaf);
      if (sortKey === "totalPrice") return dir * (a.totalPriceXaf - b.totalPriceXaf);
      return dir * a.notes.localeCompare(b.notes, "fr");
    });
    return list;
  }, [rows, sortDir, sortKey]);

  const monthlySummary = useMemo(() => {
    const map = new Map<string, { monthKey: string; count: number; totalXaf: number }>();
    for (const mk of selectedMonths) {
      map.set(mk, { monthKey: mk, count: 0, totalXaf: 0 });
    }
    for (const r of rows) {
      const agg = map.get(r.monthKey);
      if (!agg) continue;
      agg.count += 1;
      agg.totalXaf += r.totalPriceXaf;
    }
    return selectedMonths
      .map((m) => map.get(m)!)
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [rows, selectedMonths]);

  function exportCsv() {
    const headers = ["number", "product", "quantity", "unit_price_xaf", "total_price_xaf", "notes", "date", "month"];
    const lines = [headers.join(",")];
    for (const r of sortedRows) {
      lines.push(
        [
          csvEscape(r.number),
          csvEscape(r.product),
          String(r.quantity),
          String(r.unitPriceXaf),
          String(r.totalPriceXaf),
          csvEscape(r.notes),
          csvEscape(r.date),
          csvEscape(r.monthKey),
        ].join(",")
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const fname = `comptabilite_${selectedMonths.slice().sort().join("-")}.csv`;
    downloadBlob(fname, blob);
  }

  function exportExcel() {
    const headers = ["number", "product", "quantity", "unit_price_xaf", "total_price_xaf", "notes", "date", "month"];
    const lines = [headers.join("\t")];
    for (const r of sortedRows) {
      lines.push(
        [r.number, r.product, String(r.quantity), String(r.unitPriceXaf), String(r.totalPriceXaf), r.notes, r.date, r.monthKey]
          .map((v) => String(v).replace(/[\n\r\t]/g, " "))
          .join("\t")
      );
    }
    const blob = new Blob(["\ufeff", lines.join("\n")], { type: "application/vnd.ms-excel;charset=utf-8" });
    const fname = `comptabilite_${selectedMonths.slice().sort().join("-")}.xls`;
    downloadBlob(fname, blob);
  }

  return (
    <div className="pb-16">
      <div className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Finance</p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight-luxe">Comptabilité</h1>
        <p className="mt-3 text-sm text-text-muted">
          Les lignes sont générées automatiquement à partir des commandes. Aucune saisie manuelle.
        </p>
      </div>

      {authRequired && (
        <div className="mt-6 rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft text-sm">
          Connexion admin requise (Firebase). Ouvrez l'admin et reconnectez-vous.
        </div>
      )}

      {loadError ? (
        <div className="mt-6 rounded-modal border border-red-200 bg-red-50 p-6 shadow-soft text-sm text-red-700">{loadError}</div>
      ) : null}

      <div className="mt-6 rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">Mois</p>
            <p className="mt-1 text-xs text-text-muted">1 à 6 mois maximum</p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <input
              type="month"
              value={monthToAdd}
              onChange={(e) => setMonthToAdd(e.target.value)}
              className="w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 md:w-auto"
              aria-label="Choisir un mois"
            />
            <button
              type="button"
              onClick={() => ensureMonth(monthToAdd)}
              className="rounded-card bg-accent px-5 py-2 text-sm font-medium text-bg-surface shadow-soft transition duration-150 ease-premium hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              Nouveau mois
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {months.map((m) => {
            const isActive = m === activeMonth;
            const isSelected = selectedMonths.includes(m);
            return (
              <button
                key={m}
                type="button"
                onClick={() => setActiveMonth(m)}
                className={cn(
                  "rounded-card border border-border-soft px-4 py-2 text-sm transition duration-150 ease-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
                  isActive ? "bg-accent text-bg-surface" : "bg-bg-surface text-text-primary hover:translate-y-[-1px]"
                )}
              >
                {parseMonthLabel(m)}
                <span className={cn("ml-2 text-xs", isActive ? "text-bg-surface/80" : "text-text-muted")}>
                  {isSelected ? "•" : ""}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {months.map((m) => {
            const checked = selectedMonths.includes(m);
            const disableAdd = !checked && selectedMonths.length >= 6;
            const disableRemove = checked && selectedMonths.length <= 1;
            return (
              <label
                key={m}
                className="flex items-center justify-between gap-4 rounded-card border border-border-soft bg-bg-subtle px-4 py-3"
              >
                <span className="text-sm text-text-primary">{parseMonthLabel(m)}</span>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disableAdd || disableRemove}
                  onChange={() => toggleSelectedMonth(m)}
                  className="h-4 w-4 accent-[var(--accent)]"
                  aria-label={`Inclure ${parseMonthLabel(m)}`}
                />
              </label>
            );
          })}
        </div>

        {status ? <p className="mt-3 text-xs text-text-muted">{status}</p> : null}
      </div>

      <div className="mt-6 rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">Résumé mensuel</p>
            <p className="mt-1 text-xs text-text-muted">Basé sur les commandes payées ou expédition confirmée</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft transition duration-150 ease-premium hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              Exporter CSV
            </button>
            <button
              type="button"
              onClick={exportExcel}
              className="rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft transition duration-150 ease-premium hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              Exporter Excel
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-auto">
          <table className="w-full min-w-[560px]">
            <thead className="bg-bg-subtle">
              <tr className="text-left text-xs uppercase tracking-[0.12em] text-text-muted">
                <th className="px-6 py-3">Mois</th>
                <th className="px-6 py-3">Lignes</th>
                <th className="px-6 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {monthlySummary.map((m) => (
                <tr key={m.monthKey} className="border-t border-border-soft text-sm">
                  <td className="px-6 py-4 font-medium text-text-primary">{parseMonthLabel(m.monthKey)}</td>
                  <td className="px-6 py-4 text-text-primary">{m.count}</td>
                  <td className="px-6 py-4 text-text-primary">{formatXaf(m.totalXaf)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-modal border border-border-soft bg-bg-surface shadow-soft">
        <div className="flex items-center justify-between border-b border-border-soft px-6 py-4">
          <div>
            <p className="text-sm font-medium text-text-primary">Table</p>
            <p className="mt-1 text-xs text-text-muted">
              {parseMonthLabel(activeMonth)} (onglet) · {selectedMonths.length} mois sélectionné(s)
            </p>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full min-w-[920px]">
            <thead className="bg-bg-subtle">
              <tr className="text-left text-xs uppercase tracking-[0.12em] text-text-muted">
                <th className="px-6 py-3">
                  <button
                    type="button"
                    onClick={() => onSort("number")}
                    className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  >
                    Numéro
                    <span className="text-[10px]">{sortKey === "number" ? (sortDir === "asc" ? "▲" : "▼") : ""}</span>
                  </button>
                </th>
                <th className="px-6 py-3">
                  <button
                    type="button"
                    onClick={() => onSort("product")}
                    className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  >
                    Produit
                    <span className="text-[10px]">{sortKey === "product" ? (sortDir === "asc" ? "▲" : "▼") : ""}</span>
                  </button>
                </th>
                <th className="px-6 py-3">
                  <button
                    type="button"
                    onClick={() => onSort("quantity")}
                    className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  >
                    Quantité
                    <span className="text-[10px]">{sortKey === "quantity" ? (sortDir === "asc" ? "▲" : "▼") : ""}</span>
                  </button>
                </th>
                <th className="px-6 py-3">
                  <button
                    type="button"
                    onClick={() => onSort("unitPrice")}
                    className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  >
                    Prix unitaire
                    <span className="text-[10px]">{sortKey === "unitPrice" ? (sortDir === "asc" ? "▲" : "▼") : ""}</span>
                  </button>
                </th>
                <th className="px-6 py-3">
                  <button
                    type="button"
                    onClick={() => onSort("totalPrice")}
                    className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  >
                    Prix total
                    <span className="text-[10px]">{sortKey === "totalPrice" ? (sortDir === "asc" ? "▲" : "▼") : ""}</span>
                  </button>
                </th>
                <th className="px-6 py-3">
                  <button
                    type="button"
                    onClick={() => onSort("notes")}
                    className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  >
                    Notes
                    <span className="text-[10px]">{sortKey === "notes" ? (sortDir === "asc" ? "▲" : "▼") : ""}</span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.length === 0 ? (
                <tr className="border-t border-border-soft">
                  <td colSpan={6} className="px-6 py-8 text-sm text-text-muted">
                    Aucune ligne pour la sélection actuelle (payées / expédition confirmée).
                  </td>
                </tr>
              ) : (
                sortedRows.map((r) => (
                  <tr key={r.id} className="border-t border-border-soft text-sm">
                    <td className="px-6 py-4 font-medium text-text-primary">{r.number}</td>
                    <td className="px-6 py-4 text-text-primary">{r.product}</td>
                    <td className="px-6 py-4 text-text-primary">{r.quantity}</td>
                    <td className="px-6 py-4 text-text-primary">{formatXaf(r.unitPriceXaf)}</td>
                    <td className="px-6 py-4 text-text-primary">{formatXaf(r.totalPriceXaf)}</td>
                    <td className="px-6 py-4 text-text-muted">{r.notes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
