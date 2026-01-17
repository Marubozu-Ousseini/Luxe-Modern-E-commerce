"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-modal border border-border-soft bg-bg-surface p-5 shadow-soft">
      <p className="text-xs uppercase tracking-[0.12em] text-text-muted">{label}</p>
      <p className="mt-2 font-serif text-3xl tracking-tight-luxe-sm text-text-primary">{value}</p>
      <p className="mt-2 text-sm text-text-muted">{hint}</p>
    </div>
  );
}

type AdminDashboardPayload = {
  generatedAt: string;
  db: { configured: boolean; available: boolean };
  storage: { bucket: string | null; productsPersistence: boolean };
  products: { count: number };
  orders: { total: number; last7d: number; revenue7dXaf: number };
  heroImages: { pages: number; images: number };
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardPayload | null>(null);
  const [status, setStatus] = useState<string>("");

  const formatInt = useMemo(
    () => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }),
    []
  );
  const formatXaf = useMemo(
    () => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }),
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus("");
      try {
        const firebase = await import("@/lib/firebaseClient");
        const auth = await firebase.getFirebaseAuth();

        // Firebase may restore the persisted session asynchronously.
        // If we read auth.currentUser too early, we incorrectly treat the user as logged out.
        const waitForUser = async (): Promise<User | null> => {
          if (auth.currentUser) return auth.currentUser;
          return await new Promise<User | null>((resolve) => {
            const stop = firebase.subscribeToAuthState((u) => {
              stop();
              resolve(u);
            });
            // Safety net: don't hang forever if the callback never fires.
            setTimeout(() => {
              try {
                stop();
              } finally {
                resolve(auth.currentUser);
              }
            }, 3500);
          });
        };

        const user = await waitForUser();
        if (!user) {
          setStatus("Connexion admin requise.");
          return;
        }
        const idToken = await user.getIdToken();
        const res = await fetch("/api/admin/dashboard", {
          headers: { accept: "application/json", authorization: `Bearer ${idToken}` },
          credentials: "include",
        });
        if (res.status === 401 || res.status === 403) {
          setStatus("Accès admin requis.");
          return;
        }
        if (!res.ok) throw new Error("load_failed");
        const json = (await res.json()) as AdminDashboardPayload;
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setStatus(e?.message || "Impossible de charger le tableau de bord.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const orders7d = data?.orders?.last7d ?? 0;
  const revenue7d = data?.orders?.revenue7dXaf ?? 0;
  const productsCount = data?.products?.count ?? 0;
  const dbLabel = data?.db?.available ? "Connectée" : data?.db?.configured ? "Hors ligne" : "Non configurée";
  const storageBucketLabel = data?.storage?.bucket ? data.storage.bucket : "Non configuré";
  const productsPersistenceLabel = data?.storage?.productsPersistence ? "Activée" : "Désactivée";

  return (
    <div className="pb-16">
      <div className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Tableau de bord</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight-luxe">Admin Malafaareh</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
          Vue d’ensemble des indicateurs clés et actions prioritaires.
        </p>
        {status ? <p className="mt-2 text-sm text-text-muted">{status}</p> : null}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Commandes payées (7j)"
          value={formatInt.format(orders7d)}
          hint={data ? `Total commandes: ${formatInt.format(data.orders.total)}` : "Chargement…"}
        />
        <StatCard
          label="CA (7j)"
          value={formatXaf.format(revenue7d)}
          hint={data ? `Images héros: ${formatInt.format(data.heroImages.images)} (pages: ${formatInt.format(data.heroImages.pages)})` : "Chargement…"}
        />
        <StatCard
          label="Catalogue"
          value={formatInt.format(productsCount)}
          hint={data ? `DB: ${dbLabel}` : "Chargement…"}
        />
      </div>

      <div className="mt-6">
        <section className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Diagnostics</p>
          <p className="mt-3 text-sm text-text-muted">
            Base de données : <span className="font-medium text-text-primary">{dbLabel}</span>
            {data ? (
              <span className="text-text-muted"> (config: {data.db.configured ? "oui" : "non"})</span>
            ) : null}
          </p>
          <p className="mt-2 text-sm text-text-muted">
            Stockage : <span className="font-medium text-text-primary">{storageBucketLabel}</span>
          </p>
          <p className="mt-2 text-sm text-text-muted">
            Catalogue persistant (GCS) : <span className="font-medium text-text-primary">{productsPersistenceLabel}</span>
          </p>
          {data ? (
            <p className="mt-2 text-xs text-text-muted">Dernière mise à jour: {new Date(data.generatedAt).toLocaleString("fr-FR")}</p>
          ) : null}
        </section>
      </div>

      <div className="mt-6">
        <section className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.12em] text-text-muted">À surveiller</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[{
              title: "Stock & variantes",
              body: "Vérifier les tailles/couleurs manquantes sur les best-sellers.",
            },{
              title: "Publicités",
              body: "Tester une bannière Shop + un carrousel Home (2 variantes).",
            },{
              title: "Promotions",
              body: "Valider le libellé promo et la cohérence des prix affichés.",
            }].map((i) => (
              <div key={i.title} className="rounded-card border border-border-soft bg-bg-subtle p-4">
                <p className="text-sm font-medium text-text-primary">{i.title}</p>
                <p className="mt-1 text-sm text-text-muted">{i.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
