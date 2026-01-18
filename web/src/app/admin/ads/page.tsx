"use client";

import { useEffect, useMemo, useState } from "react";
import { subscribeToAuthState } from "@/lib/firebaseClient";
import type { AdConfig, AdKind, AdPlacementKey } from "@/lib/ads";

const placementsMeta: Array<{ key: AdPlacementKey; title: string; desc: string }> = [
  { key: "home", title: "Home", desc: "Section Publicités (3 cartes)." },
  { key: "shop", title: "Shop", desc: "Bannière inline sous les filtres." },
  { key: "category", title: "Catégorie", desc: "Bannière inline sous l’image héro." },
];

function makeNewAd(): AdConfig {
  return {
    id: `ad_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    kind: "text",
    placements: ["home"],
    eyebrow: "Annonce",
    title: "",
    body: "",
    ctaLabel: "Découvrir",
    href: "/shop",
  };
}

export default function AdminAdsPage() {
  const [items, setItems] = useState<AdConfig[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [authRequired, setAuthRequired] = useState(false);

  const selected = useMemo(() => items.find((a) => a.id === selectedId) || null, [items, selectedId]);

  useEffect(() => {
    void refresh();
    const unsub = subscribeToAuthState(() => void refresh());
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId && items.length > 0) setSelectedId(items[0].id);
  }, [items, selectedId]);

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

  async function refresh() {
    setLoading(true);
    setStatus("");
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch("/api/admin/ads", { headers, credentials: "include" });
      if (res.status === 401 || res.status === 403) {
        setAuthRequired(true);
        setItems([]);
        return;
      }
      const data = (await res.json().catch(() => [])) as unknown;
      const list = Array.isArray(data) ? (data as AdConfig[]) : [];
      setItems(list);
      setAuthRequired(false);
    } catch (e: any) {
      setAuthRequired(true);
      setItems([]);
      setStatus(e?.message || "Impossible de charger.");
    } finally {
      setLoading(false);
    }
  }

  function updateSelected(patch: Partial<AdConfig>) {
    if (!selectedId) return;
    setItems((prev) => prev.map((a) => (a.id === selectedId ? { ...a, ...patch } : a)));
  }

  function togglePlacement(key: AdPlacementKey) {
    if (!selected) return;
    const has = selected.placements.includes(key);
    const next = has ? selected.placements.filter((p) => p !== key) : [...selected.placements, key];
    updateSelected({ placements: next });
  }

  async function uploadMedia(file: File): Promise<string> {
    const headers = await getAdminAuthHeaders();
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      headers,
      credentials: "include",
      body: form,
    });
    if (res.status === 401 || res.status === 403) {
      setAuthRequired(true);
      throw new Error("Authentification admin requise.");
    }
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.message || "Upload serveur échoué.");
    const url = String(body?.publicUrl || body?.proxyUrl || "");
    if (!url) throw new Error("Réponse upload invalide.");
    return url;
  }

  async function saveAll() {
    setSaving(true);
    setStatus("");
    try {
      const headers = await getAdminAuthHeaders({ "Content-Type": "application/json" });

      // Basic client-side checks to avoid 400s.
      for (const ad of items) {
        if (!ad.id || !ad.kind) throw new Error("Annonce invalide.");
        if (!Array.isArray(ad.placements) || ad.placements.length === 0) throw new Error("Choisissez au moins 1 emplacement.");
        if (!ad.title.trim() || !ad.body.trim() || !ad.ctaLabel.trim() || !ad.href.trim()) {
          throw new Error("Veuillez remplir titre, texte, CTA et URL.");
        }
        if ((ad.kind === "image" || ad.kind === "video") && !ad.mediaUrl) {
          throw new Error("Une annonce Image/Vidéo doit avoir un média.");
        }
      }

      const res = await fetch("/api/admin/ads", {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify(items),
      });
      if (res.status === 401 || res.status === 403) {
        setAuthRequired(true);
        throw new Error("Authentification admin requise.");
      }
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message || "Impossible d'enregistrer.");
      setStatus("Publicités enregistrées.");
    } catch (e: any) {
      setStatus(e?.message || "Impossible d'enregistrer.");
    } finally {
      setSaving(false);
    }
  }

  function addNew() {
    setStatus("");
    const ad = makeNewAd();
    setItems((prev) => [ad, ...prev]);
    setSelectedId(ad.id);
  }

  function removeSelected() {
    if (!selected) return;
    setStatus("");
    setItems((prev) => prev.filter((a) => a.id !== selected.id));
    setSelectedId("");
  }

  return (
    <div className="pb-16">
      <div className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Marketing</p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight-luxe">Publicités</h1>
        <p className="mt-3 text-sm text-text-muted">Ajoutez des annonces (texte / image / vidéo) et choisissez les emplacements.</p>
        {status ? <p className="mt-3 text-sm text-text-muted">{status}</p> : null}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="lg:col-span-7">
          <div className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Emplacements</p>
                <p className="mt-2 font-serif text-2xl tracking-tight-luxe-sm">Où ça s’affiche</p>
              </div>
              <button
                type="button"
                onClick={addNew}
                className="rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft transition duration-200 ease-premium hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                + Nouvelle annonce
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {placementsMeta.map((i) => (
                <div key={i.key} className="rounded-card border border-border-soft bg-bg-subtle p-4">
                  <p className="text-sm font-medium text-text-primary">{i.title}</p>
                  <p className="mt-1 text-sm text-text-muted">{i.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-modal border border-border-soft bg-bg-surface shadow-soft">
            <div className="border-b border-border-soft px-6 py-4">
              <p className="text-sm font-medium text-text-primary">Annonces ({items.length})</p>
            </div>
            <div className="p-6">
              {authRequired ? (
                <div className="rounded-card border border-border-soft bg-bg-subtle p-4">
                  <p className="text-sm text-text-muted">Connexion admin requise.</p>
                </div>
              ) : loading ? (
                <div className="rounded-card border border-border-soft bg-bg-subtle p-4">
                  <p className="text-sm text-text-muted">Chargement…</p>
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-card border border-border-soft bg-bg-subtle p-4">
                  <p className="text-sm text-text-muted">Aucune annonce. Cliquez sur “Nouvelle annonce”.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((ad) => {
                    const active = ad.id === selectedId;
                    return (
                      <button
                        key={ad.id}
                        type="button"
                        onClick={() => setSelectedId(ad.id)}
                        className={
                          "w-full rounded-card border border-border-soft px-4 py-3 text-left shadow-soft transition duration-150 ease-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 " +
                          (active ? "bg-accent text-bg-surface" : "bg-bg-surface text-text-primary hover:translate-y-[-1px]")
                        }
                      >
                        <p className={"text-xs uppercase tracking-[0.12em] " + (active ? "text-bg-surface/80" : "text-text-muted")}>
                          {ad.kind} · {ad.placements.join(", ")}
                        </p>
                        <p className="mt-1 text-sm font-medium">{ad.title || "(Sans titre)"}</p>
                        <p className={"mt-1 text-sm " + (active ? "text-bg-surface/80" : "text-text-muted")}>
                          {ad.body ? ad.body.slice(0, 90) + (ad.body.length > 90 ? "…" : "") : "(Sans texte)"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="lg:col-span-5">
          <div className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Édition</p>
            <p className="mt-2 font-serif text-2xl tracking-tight-luxe-sm">Annonce</p>
            <p className="mt-2 text-sm text-text-muted">Configurez le texte et (optionnellement) un média.</p>

            {!selected ? (
              <div className="mt-4 rounded-card border border-border-soft bg-bg-subtle p-4">
                <p className="text-sm text-text-muted">Sélectionnez une annonce.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-xs uppercase tracking-[0.12em] text-text-muted">Type</span>
                  <select
                    value={selected.kind}
                    onChange={(e) => updateSelected({ kind: e.target.value as AdKind, mediaUrl: e.target.value === "text" ? undefined : selected.mediaUrl })}
                    className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  >
                    <option value="text">Texte</option>
                    <option value="image">Image</option>
                    <option value="video">Vidéo</option>
                  </select>
                </label>

                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Emplacements</p>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    {placementsMeta.map((p) => {
                      const checked = selected.placements.includes(p.key);
                      return (
                        <label key={p.key} className="flex items-center gap-3 rounded-card border border-border-soft bg-bg-subtle px-3 py-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePlacement(p.key)}
                            className="h-4 w-4"
                          />
                          <span className="text-sm text-text-primary">{p.title}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <label className="block">
                  <span className="text-xs uppercase tracking-[0.12em] text-text-muted">Eyebrow (optionnel)</span>
                  <input
                    value={selected.eyebrow || ""}
                    onChange={(e) => updateSelected({ eyebrow: e.target.value })}
                    className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    placeholder="Annonce"
                  />
                </label>

                <label className="block">
                  <span className="text-xs uppercase tracking-[0.12em] text-text-muted">Titre</span>
                  <input
                    value={selected.title}
                    onChange={(e) => updateSelected({ title: e.target.value })}
                    className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  />
                </label>

                <label className="block">
                  <span className="text-xs uppercase tracking-[0.12em] text-text-muted">Texte</span>
                  <textarea
                    value={selected.body}
                    onChange={(e) => updateSelected({ body: e.target.value })}
                    className="mt-2 min-h-28 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  />
                </label>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="block">
                    <span className="text-xs uppercase tracking-[0.12em] text-text-muted">CTA</span>
                    <input
                      value={selected.ctaLabel}
                      onChange={(e) => updateSelected({ ctaLabel: e.target.value })}
                      className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      placeholder="Découvrir"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs uppercase tracking-[0.12em] text-text-muted">URL</span>
                    <input
                      value={selected.href}
                      onChange={(e) => updateSelected({ href: e.target.value })}
                      className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      placeholder="/shop"
                    />
                  </label>
                </div>

                {selected.kind === "text" ? null : (
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Média</p>
                    <div className="mt-2 space-y-3">
                      <label className="block">
                        <span className="text-xs uppercase tracking-[0.12em] text-text-muted">Fichier</span>
                        <input
                          type="file"
                          accept={selected.kind === "video" ? "video/*" : "image/*"}
                          className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft"
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            if (!f) return;
                            setStatus("");
                            void uploadMedia(f)
                              .then((url) => {
                                updateSelected({ mediaUrl: url });
                                setStatus("Média uploadé.");
                              })
                              .catch((err: any) => setStatus(err?.message || "Upload échoué."));
                          }}
                        />
                      </label>

                      <label className="block">
                        <span className="text-xs uppercase tracking-[0.12em] text-text-muted">mediaUrl</span>
                        <input
                          value={selected.mediaUrl || ""}
                          onChange={(e) => updateSelected({ mediaUrl: e.target.value })}
                          className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                          placeholder="/api/media/..."
                        />
                      </label>

                      {selected.mediaUrl ? (
                        <div className="overflow-hidden rounded-card border border-border-soft bg-bg-subtle">
                          {selected.kind === "video" ? (
                            <video className="aspect-[16/9] w-full object-cover" src={selected.mediaUrl} controls playsInline preload="metadata" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img className="aspect-[16/9] w-full object-cover" src={selected.mediaUrl} alt={selected.title || "Aperçu"} />
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                <div className="mt-2 grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void saveAll()}
                    className="inline-flex w-full items-center justify-center rounded-card bg-accent px-5 py-3 text-sm font-medium text-bg-surface shadow-soft transition duration-150 ease-premium hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-60"
                  >
                    {saving ? "Enregistrement…" : "Enregistrer"}
                  </button>

                  <button
                    type="button"
                    onClick={removeSelected}
                    className="inline-flex w-full items-center justify-center rounded-card border border-border-soft bg-bg-surface px-5 py-3 text-sm font-medium text-text-primary shadow-soft transition duration-150 ease-premium hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
