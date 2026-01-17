"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PasswordInput } from "@/components/ui/PasswordInput";
import type { User } from "firebase/auth";

type HeroImages = Record<string, string[]>;

function safeParseHeroImages(value: string | null): HeroImages {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: HeroImages = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "string") {
        out[k] = [v];
        continue;
      }
      if (Array.isArray(v)) {
        const imgs = v.filter((x): x is string => typeof x === "string" && x.length > 0);
        if (imgs.length > 0) out[k] = imgs;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export default function AdminSettingsPage() {
  const [heroImages, setHeroImages] = useState<HeroImages>({});
  const heroImagesRef = useRef<HeroImages>({});
  const serverHeroImagesRef = useRef<HeroImages>({});
  const hasServerSnapshotRef = useRef(false);
  const [heroStatus, setHeroStatus] = useState<string>("");
  const [heroAuthRequired, setHeroAuthRequired] = useState(false);

  const [brandName, setBrandName] = useState("Malafaareh");
  const [tagline, setTagline] = useState("Le luxe qui murmure, la beauté.... Une présence qui reste.");
  const [identityStatus, setIdentityStatus] = useState<string>("");
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<string>("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const heroTargets = useMemo(
    () => [
      { key: "home", label: "Accueil" },
      { key: "shop", label: "Boutique" },
      { key: "story", label: "Histoire" },
      { key: "contact", label: "Contact" },
      { key: "account", label: "Compte" },
      { key: "register", label: "Inscription" },
      { key: "checkout", label: "Paiement" },
      { key: "favorites", label: "Favoris" },
      { key: "orders", label: "Commandes" },
      { key: "journal", label: "Journal" },
      { key: "category:vetements", label: "Catégorie: Vêtements" },
      { key: "category:parfums-et-cosmetiques", label: "Catégorie: Parfums et Cosmétiques" },
      { key: "category:chaussures", label: "Catégorie: Chaussures" },
      { key: "category:montres", label: "Catégorie: Montres" },
      { key: "category:accessoires", label: "Catégorie: Accessoires" },
    ],
    []
  );

  function updateHeroImages(updater: (prev: HeroImages) => HeroImages) {
    setHeroImages((prev) => {
      const next = updater(prev);
      heroImagesRef.current = next;
      return next;
    });
  }

  function isBlobUrl(url: string) {
    return url.startsWith("blob:");
  }

  function sanitizeHeroImages(input: HeroImages): HeroImages {
    const out: HeroImages = {};
    for (const [key, value] of Object.entries(input)) {
      const list = (Array.isArray(value) ? value : []).filter((x): x is string => typeof x === "string" && x.length > 0);
      const cleaned = list.filter((x) => !isBlobUrl(x));
      if (cleaned.length > 0) out[key] = cleaned;
    }
    return out;
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const firebase = await import("@/lib/firebaseClient");
        const auth = await firebase.getFirebaseAuth();

        const waitForUser = async (): Promise<User | null> => {
          if (auth.currentUser) return auth.currentUser;
          return await new Promise<User | null>((resolve) => {
            const stop = firebase.subscribeToAuthState((u) => {
              stop();
              resolve(u);
            });
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
          setHeroAuthRequired(true);
          return;
        }
        const idToken = await user.getIdToken();

        // Load site settings (brand identity)
        try {
          const ssRes = await fetch("/api/admin/site-settings", {
            headers: { accept: "application/json", authorization: `Bearer ${idToken}` },
            credentials: "include",
          });
          if (ssRes.ok) {
            const data = (await ssRes.json()) as any;
            if (!cancelled) {
              setBrandName(String(data?.brandName || "Malafaareh"));
              setTagline(String(data?.tagline || "Le luxe qui murmure, la beauté.... Une présence qui reste."));
            }
          }
        } catch {
          // ignore
        }

        const res = await fetch("/api/admin/hero-images", {
          headers: { accept: "application/json", authorization: `Bearer ${idToken}` },
          credentials: "include",
        });
        if (res.status === 401 || res.status === 403) {
          setHeroAuthRequired(true);
          return;
        }
        if (!res.ok) throw new Error("load_failed");
        const data = (await res.json()) as unknown;
        if (cancelled) return;
        const parsed = safeParseHeroImages(JSON.stringify(data));
        serverHeroImagesRef.current = parsed;
        hasServerSnapshotRef.current = true;
        updateHeroImages(() => parsed);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function onSaveIdentity() {
    setIdentityStatus("");
    const next = {
      brandName: brandName.trim(),
      tagline: tagline.trim(),
    };
    if (!next.brandName || !next.tagline) {
      setIdentityStatus("Veuillez remplir tous les champs.");
      return;
    }

    setIsSavingIdentity(true);
    try {
      const headers = await getAdminAuthHeaders({ "Content-Type": "application/json" });
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify(next),
      });
      if (res.status === 401 || res.status === 403) {
        setHeroAuthRequired(true);
        throw new Error("Authentification admin requise.");
      }
      if (!res.ok) throw new Error("save_failed");
      setIdentityStatus("Enregistré.");
      try {
        localStorage.setItem("malafaareh_site_settings", JSON.stringify(next));
      } catch {
        // ignore
      }
    } catch (e: any) {
      setIdentityStatus(e?.message || "Impossible d'enregistrer.");
    } finally {
      setIsSavingIdentity(false);
    }
  }

  async function getAdminAuthHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
    const firebase = await import("@/lib/firebaseClient");
    const auth = await firebase.getFirebaseAuth();

    const waitForUser = async (): Promise<User | null> => {
      if (auth.currentUser) return auth.currentUser;
      return await new Promise<User | null>((resolve) => {
        const stop = firebase.subscribeToAuthState((u) => {
          stop();
          resolve(u);
        });
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
    if (!user) throw new Error("Connexion requise");
    const idToken = await user.getIdToken();
    return {
      accept: "application/json",
      authorization: `Bearer ${idToken}`,
      ...(extra || {}),
    };
  }

  async function persistHeroImages(next: HeroImages, opts?: { deletedKeys?: string[] }) {
    const sanitized = sanitizeHeroImages(next);
    updateHeroImages(() => sanitized);

    const headers = await getAdminAuthHeaders({ "Content-Type": "application/json" });
    const authHeaders = await getAdminAuthHeaders();

    // Defensive: merge with latest server map to avoid accidentally wiping other keys
    // when the initial load hasn't completed (or failed transiently).
    let serverMap: HeroImages | null = null;
    try {
      const res = await fetch("/api/admin/hero-images", {
        method: "GET",
        headers: authHeaders,
        credentials: "include",
      });
      if (res.status === 401 || res.status === 403) {
        setHeroAuthRequired(true);
        throw new Error("Authentification admin requise.");
      }
      if (res.ok) {
        const data = (await res.json()) as unknown;
        serverMap = safeParseHeroImages(JSON.stringify(data));
        serverHeroImagesRef.current = serverMap;
        hasServerSnapshotRef.current = true;
      }
    } catch {
      // If we can't fetch server state and we don't have a snapshot, abort rather than risk wiping.
      if (!hasServerSnapshotRef.current) {
        throw new Error("Impossible de charger la configuration actuelle. Réessayez dans quelques secondes.");
      }
    }

    const base = serverMap ?? serverHeroImagesRef.current;
    const merged: HeroImages = { ...base, ...sanitized };
    for (const key of opts?.deletedKeys ?? []) delete merged[key];
    updateHeroImages(() => merged);

    const putRes = await fetch("/api/admin/hero-images", {
      method: "PUT",
      headers,
      credentials: "include",
      body: JSON.stringify(merged),
    });
    if (putRes.status === 401 || putRes.status === 403) {
      setHeroAuthRequired(true);
      throw new Error("Authentification admin requise.");
    }
    if (!putRes.ok) throw new Error("save_failed");
    serverHeroImagesRef.current = merged;
    hasServerSnapshotRef.current = true;
  }

  async function onPickHeroImages(key: string, files: FileList | null) {
    setHeroStatus("");
    if (!files || files.length === 0) return;

    const list = Array.from(files);
    const previewUrls = list.map((file) => URL.createObjectURL(file));

    updateHeroImages((prev) => {
      const existing = prev[key] ?? [];
      return { ...prev, [key]: [...existing, ...previewUrls] };
    });

    try {
      const headers = await getAdminAuthHeaders();
      const uploadedUrls: string[] = [];
      let uploadFailures = 0;

      for (let i = 0; i < list.length; i += 1) {
        const file = list[i];
        const previewUrl = previewUrls[i];
        try {
          const form = new FormData();
          form.append("file", file);
          const res = await fetch("/api/admin/upload", {
            method: "POST",
            headers,
            credentials: "include",
            body: form,
          });
          if (res.status === 401 || res.status === 403) {
            setHeroAuthRequired(true);
            throw new Error("Authentification admin requise.");
          }
          const body = await res.json().catch(() => null);
          if (!res.ok) throw new Error(body?.message || "Upload serveur échoué.");
          const url = String(body?.publicUrl || body?.proxyUrl || "");
          if (!url) throw new Error("Réponse upload invalide.");
          uploadedUrls.push(url);

          updateHeroImages((prev) => {
            const existing = prev[key] ?? [];
            let replacedOnce = false;
            const nextList = existing.map((src) => {
              if (!replacedOnce && src === previewUrl) {
                replacedOnce = true;
                return url;
              }
              return src;
            });
            return { ...prev, [key]: nextList };
          });
        } catch {
          uploadFailures += 1;
          updateHeroImages((prev) => {
            const existing = prev[key] ?? [];
            const nextList = existing.filter((src) => src !== previewUrl);
            const next = { ...prev };
            if (nextList.length === 0) delete next[key];
            else next[key] = nextList;
            return next;
          });
        } finally {
          URL.revokeObjectURL(previewUrl);
        }
      }

      // Replace any remaining previews with uploaded urls and persist.
      updateHeroImages((prev) => {
        const existing = prev[key] ?? [];
        const nextList = existing.filter((src) => !isBlobUrl(src));
        const next = { ...prev };
        if (nextList.length === 0) delete next[key];
        else next[key] = nextList;
        return next;
      });

      const sanitized = sanitizeHeroImages(heroImagesRef.current);
      await persistHeroImages(sanitized);

      if (uploadedUrls.length > 0 && uploadFailures === 0) setHeroStatus("Images héros enregistrées.");
      else if (uploadedUrls.length > 0) setHeroStatus("Certaines images ont été enregistrées (quelques uploads ont échoué).");
      else setHeroStatus("Aucune image n’a pu être uploadée.");
    } catch (e: any) {
      setHeroStatus(e?.message || "Impossible d'enregistrer.");
    }
  }

  function removeHeroImage(key: string, index: number) {
    setHeroStatus("");
    const existing = heroImages[key] ?? [];
    const nextList = existing.filter((_, i) => i !== index);
    const next = { ...heroImages };
    const deletedKeys: string[] = [];
    if (nextList.length === 0) {
      delete next[key];
      deletedKeys.push(key);
    } else {
      next[key] = nextList;
    }
    void persistHeroImages(next, { deletedKeys })
      .then(() => setHeroStatus("Image supprimée."))
      .catch((e: any) => setHeroStatus(e?.message || "Impossible d'enregistrer."));
  }

  function clearHeroImages(key: string) {
    setHeroStatus("");
    const next = { ...heroImages };
    delete next[key];
    void persistHeroImages(next, { deletedKeys: [key] })
      .then(() => setHeroStatus("Images supprimées."))
      .catch((e: any) => setHeroStatus(e?.message || "Impossible d'enregistrer."));
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordStatus("");

    if (!currentPassword.trim() || !newPassword.trim()) {
      setPasswordStatus("Veuillez remplir tous les champs.");
      return;
    }
    if (newPassword.trim() !== confirmPassword.trim()) {
      setPasswordStatus("La confirmation ne correspond pas.");
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPassword.trim(), newPassword: newPassword.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        if (data.error === "wrong_password") setPasswordStatus("Mot de passe actuel incorrect.");
        else if (data.error === "weak_password") setPasswordStatus("Mot de passe trop court (min 4).");
        else setPasswordStatus("Erreur lors de l’enregistrement.");
        return;
      }

      setPasswordStatus("Mot de passe admin mis à jour. Rafraîchissez: le navigateur demandera le nouveau mot de passe.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordStatus("Erreur réseau.");
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <div className="pb-16">
      <div className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Configuration</p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight-luxe">Réglages</h1>
          <p className="mt-3 text-sm text-text-muted">Paramètres d’administration et configuration du site.</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Marque</p>
          <p className="mt-2 font-serif text-2xl tracking-tight-luxe-sm">Identité</p>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.12em] text-text-muted">Nom</span>
              <input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              />
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.12em] text-text-muted">Slogan</span>
              <textarea
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="mt-2 min-h-24 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              />
            </label>

            <button
              type="button"
              disabled={isSavingIdentity || heroAuthRequired}
              onClick={() => void onSaveIdentity()}
              className="mt-2 inline-flex w-full items-center justify-center rounded-card bg-accent px-5 py-3 text-sm font-medium text-bg-surface shadow-soft transition duration-150 ease-premium hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              Enregistrer
            </button>

            {identityStatus ? <p className="text-xs text-text-muted">{identityStatus}</p> : null}
          </div>
        </section>

        <section className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Boutique</p>
          <p className="mt-2 font-serif text-2xl tracking-tight-luxe-sm">Préférences</p>

          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between gap-4 rounded-card border border-border-soft bg-bg-subtle p-4">
              <div>
                <p className="text-sm font-medium text-text-primary">Affichage des promotions</p>
                <p className="mt-1 text-sm text-text-muted">Afficher les prix promo et le gain.</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-[var(--accent)]" />
            </label>

            <label className="flex items-center justify-between gap-4 rounded-card border border-border-soft bg-bg-subtle p-4">
              <div>
                <p className="text-sm font-medium text-text-primary">Publicités</p>
                <p className="mt-1 text-sm text-text-muted">Afficher les emplacements (Home/Shop/Catégories).</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-[var(--accent)]" />
            </label>

            <p className="text-xs text-text-muted">Ces réglages sont UI uniquement pour le moment.</p>
          </div>
        </section>

        <section className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Admin</p>
          <p className="mt-2 font-serif text-2xl tracking-tight-luxe-sm">Sécurité</p>

          <form onSubmit={onChangePassword} className="mt-4 space-y-3">
            <div>
              <span className="text-xs uppercase tracking-[0.12em] text-text-muted">Mot de passe actuel</span>
              <PasswordInput
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="py-2 shadow-soft"
              />
            </div>

            <div>
              <span className="text-xs uppercase tracking-[0.12em] text-text-muted">Nouveau mot de passe</span>
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 4 caractères"
                required
                className="py-2 shadow-soft"
              />
            </div>

            <div>
              <span className="text-xs uppercase tracking-[0.12em] text-text-muted">Confirmer</span>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="py-2 shadow-soft"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingPassword}
              className="mt-2 inline-flex w-full items-center justify-center rounded-card bg-accent px-5 py-3 text-sm font-medium text-bg-surface shadow-soft transition duration-150 ease-premium hover:scale-[1.02] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              Enregistrer
            </button>

            {passwordStatus ? <p className="text-xs text-text-muted">{passwordStatus}</p> : null}
            <p className="text-xs text-text-muted">Le mot de passe admin est stocké dans un cookie signé (HttpOnly).</p>
          </form>
        </section>

        <section className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft md:col-span-2">
          <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Site</p>
          <p className="mt-2 font-serif text-2xl tracking-tight-luxe-sm">Images héros</p>
          <p className="mt-2 text-sm text-text-muted">
            Ajoutez une image par page. Les changements s’appliquent au site.
          </p>
          {heroAuthRequired ? (
            <p className="mt-2 text-xs text-text-muted">Connexion admin requise pour charger et enregistrer les images héros.</p>
          ) : null}

          <div className="mt-4 space-y-4">
            {heroTargets.map((t) => (
              <div key={t.key} className="rounded-card border border-border-soft bg-bg-subtle p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{t.label}</p>
                    <p className="mt-1 text-xs text-text-muted">Clé: {t.key}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => onPickHeroImages(t.key, e.target.files)}
                      className="w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft file:mr-4 file:rounded-card file:border-0 file:bg-bg-surface file:px-4 file:py-2 file:text-sm file:font-medium file:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    />

                    {heroImages[t.key]?.length ? (
                      <button
                        type="button"
                        onClick={() => clearHeroImages(t.key)}
                        className="text-xs text-text-muted underline decoration-border-soft underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      >
                        Tout retirer
                      </button>
                    ) : null}
                  </div>
                </div>

                {heroImages[t.key]?.length ? (
                  <div className="mt-3">
                    <p className="text-xs text-text-muted">{heroImages[t.key].length} image(s)</p>
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      {heroImages[t.key].map((src, idx) => (
                        <div key={src + String(idx)} className="overflow-hidden rounded-card border border-border-soft bg-bg-surface">
                          <div className="relative aspect-[21/9] bg-bg-surface">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="Prévisualisation" className="h-full w-full object-cover" />
                          </div>
                          <div className="flex items-center justify-between gap-3 border-t border-border-soft px-4 py-3">
                            <p className="text-xs text-text-muted">Image {idx + 1}</p>
                            <button
                              type="button"
                              onClick={() => removeHeroImage(t.key, idx)}
                              className="text-xs text-text-muted underline decoration-border-soft underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                            >
                              Retirer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}

            {heroStatus ? <p className="text-xs text-text-muted">{heroStatus}</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
