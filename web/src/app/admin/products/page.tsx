"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { products } from "@/lib/products";
import { formatXaf } from "@/lib/money";
import { subscribeToAuthState } from "@/lib/firebaseClient";

type AdminProduct = {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  category: string;
  imageUrl: string;
  images?: string[];
  colors?: string[];
  sizes?: string[];
  editorNote?: string;
  stock?: number;
};

const PRODUCT_STATUS_KEY = "malafaareh_admin_product_status";

type ProductStatus = "Actif" | "Désactivé";

function safeParseStatusOverrides(value: string | null): Record<string, ProductStatus> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, ProductStatus> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (v === "Actif" || v === "Désactivé") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function slugify(input: string) {
  const base = input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "produit";
}

export default function AdminProductsPage() {
  const baseCategories = useMemo<string[]>(() => Array.from(new Set(products.map((p) => p.category))).sort(), []);
  const [categories, setCategories] = useState<string[]>(baseCategories);

  const [items, setItems] = useState<AdminProduct[]>([]);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, ProductStatus>>({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>("");
  const [authRequired, setAuthRequired] = useState(false);


  const [authStatus, setAuthStatus] = useState<string>("");

  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(baseCategories[0] ?? "Vêtements");
  const [inventoryCount, setInventoryCount] = useState<number>(10);
  const [priceXaf, setPriceXaf] = useState<number>(0);
  const [promoPriceXaf, setPromoPriceXaf] = useState<number | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    try {
      setStatusOverrides(safeParseStatusOverrides(localStorage.getItem(PRODUCT_STATUS_KEY)));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void refreshProducts();
    void refreshCategories();
    const unsub = subscribeToAuthState(() => {
      void refreshProducts();
      void refreshCategories();
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    // Clean up old URLs
    imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    // Create new URLs
    const urls = imageFiles.map((file) => URL.createObjectURL(file));
    setImagePreviewUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageFiles]);

  function saveStatusOverride(slug: string, status: ProductStatus) {
    const next = { ...statusOverrides, [slug]: status };
    setStatusOverrides(next);
    try {
      localStorage.setItem(PRODUCT_STATUS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  async function refreshProducts() {
    setLoading(true);
    setLoadError("");
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch("/api/admin/produits", { headers, credentials: "include" });
      if (res.status === 401 || res.status === 403) {
        setAuthRequired(true);
        setItems([]);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || "Impossible de charger les produits.");
      }
      const data = (await res.json()) as AdminProduct[];
      setItems(Array.isArray(data) ? data : []);
      setAuthRequired(false);
    } catch (e: any) {
      setAuthRequired(true);
      setItems([]);
      setLoadError(e?.message || "Impossible de charger les produits.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshCategories() {
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch("/api/admin/categories", { headers, credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as unknown;
      const list = Array.isArray(data) ? (data.filter((x) => typeof x === "string") as string[]) : [];
      const merged = Array.from(new Set([...(baseCategories || []), ...list])).sort();
      setCategories(merged);
    } catch {
      // ignore
    }
  }

  async function uploadImages(files: File[]): Promise<string[]> {
    if (!files.length) throw new Error("Image requise.");

    const headers = await getAdminAuthHeaders();
    const out: string[] = [];

    for (const file of files) {
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
      const publicUrl = String(body?.publicUrl || "");
      const proxyUrl = String(body?.proxyUrl || "");
      const url = publicUrl || proxyUrl;
      if (!url) throw new Error("Réponse upload invalide.");
      out.push(url);
    }

    return out;
  }

  function parseCommaList(raw: string): string[] {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  function getBasePriceXaf(p: AdminProduct) {
    return typeof p.originalPrice === "number" && Number.isFinite(p.originalPrice) && p.originalPrice > 0 ? p.originalPrice : p.price;
  }

  function getPromoPriceXaf(p: AdminProduct) {
    return typeof p.originalPrice === "number" && Number.isFinite(p.originalPrice) && p.originalPrice > 0 ? p.price : null;
  }

  async function updateRemoteProduct(id: number, patch: Partial<AdminProduct>) {
    const headers = await getAdminAuthHeaders({ "Content-Type": "application/json" });
    const res = await fetch(`/api/admin/produits/${id}`,
      {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify(patch),
      }
    );
    if (res.status === 401 || res.status === 403) {
      setAuthRequired(true);
      throw new Error("Authentification admin requise.");
    }
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.message || "Impossible de mettre à jour.");
    const updated = body as AdminProduct;
    setItems((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }

  async function deleteRemoteProduct(id: number) {
    const headers = await getAdminAuthHeaders();
    const res = await fetch(`/api/admin/produits/${id}`,
      {
        method: "DELETE",
        headers,
        credentials: "include",
      }
    );
    if (res.status === 401 || res.status === 403) {
      setAuthRequired(true);
      throw new Error("Authentification admin requise.");
    }
    if (!res.ok && res.status !== 204) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || "Impossible de supprimer.");
    }
    setItems((prev) => prev.filter((p) => p.id !== id));
  }

  function resetForm() {
    setName("");
    setDescription("");
    setCategory(categories[0] ?? baseCategories[0] ?? "Vêtements");
    setInventoryCount(10);
    setPriceXaf(0);
    setPromoPriceXaf(null);
    setImageFile(null);
    setImageFiles([]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (!description.trim()) return;
    if (imageFiles.length === 0 && !imageFile) return;
    if (!Number.isFinite(priceXaf) || priceXaf <= 0) return;
    if (!Number.isFinite(inventoryCount) || inventoryCount < 0) return;
    if (promoPriceXaf !== null) {
      if (!Number.isFinite(promoPriceXaf) || promoPriceXaf <= 0) return;
      if (promoPriceXaf >= priceXaf) return;
    }

    if (authRequired) {
      setAuthStatus("Connexion admin requise pour créer un produit.");
      return;
    }

    try {
      const files = imageFiles.length ? imageFiles : imageFile ? [imageFile] : [];
      const images = await uploadImages(files);
      const imageUrl = images[0];
      const base = Math.round(priceXaf);
      const promo = promoPriceXaf === null ? null : Math.round(promoPriceXaf);

      const payload = {
        name: name.trim(),
        description: description.trim(),
        category: (category || "").trim(),
        imageUrl,
        images,
        stock: Math.max(0, Math.floor(inventoryCount)),
        // If promo is set: price = promo, originalPrice = base
        // Else: price = base, originalPrice omitted
        price: promo ?? base,
        originalPrice: promo === null ? undefined : base,
      };

      const headers = await getAdminAuthHeaders({ "Content-Type": "application/json" });
      const res = await fetch("/api/admin/produits", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => null);
      if (res.status === 401 || res.status === 403) {
        setAuthRequired(true);
        throw new Error("Authentification admin requise.");
      }
      if (!res.ok) throw new Error(body?.message || "Impossible de créer le produit.");

      const created = body as AdminProduct;
      setItems((prev) => [created, ...prev]);
      resetForm();
    } catch (err: any) {
      setAuthStatus(err?.message || "Impossible de créer le produit.");
    }
  }

  const allCount = items.length;
  const disabledCount = items.filter((p) => (statusOverrides[String(p.id)] ?? "Actif") === "Désactivé").length;
  const activeItems = items.filter((p) => (statusOverrides[String(p.id)] ?? "Actif") !== "Désactivé");
  const disabledItems = items.filter((p) => (statusOverrides[String(p.id)] ?? "Actif") === "Désactivé");

  return (
    <div className="pb-16">
      <div className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Catalogue</p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight-luxe">Produits</h1>
        <p className="mt-3 text-sm text-text-muted">
          Gestion connectée à l’API admin (Cloud Run) via votre compte Firebase admin.
        </p>
        {loading ? <p className="mt-3 text-xs text-text-muted">Chargement…</p> : null}
        {loadError ? <p className="mt-3 text-xs text-text-muted">{loadError}</p> : null}
      </div>

      <div className="mt-6 space-y-4">
        {authRequired ? (
          <section className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Connexion</p>
            <p className="mt-2 font-serif text-2xl tracking-tight-luxe-sm">Admin (Firebase)</p>
            <p className="mt-2 text-sm text-text-muted">
              Connectez-vous sur le site avec votre compte admin, puis revenez ici.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-card bg-accent px-5 py-3 text-sm font-medium text-bg-surface shadow-soft transition duration-150 ease-premium hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                Aller au login
              </Link>
              <button
                type="button"
                onClick={() => {
                  void refreshProducts();
                  void refreshCategories();
                }}
                className="rounded-card border border-border-soft bg-bg-surface px-4 py-3 text-sm text-text-primary shadow-soft transition duration-200 ease-premium hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                Réessayer
              </button>
            </div>
            {authStatus ? <p className="mt-3 text-xs text-text-muted">{authStatus}</p> : null}
          </section>
        ) : null}

        <section className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
          <div className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Créer</p>
            <p className="mt-2 font-serif text-2xl tracking-tight-luxe-sm">Nouveau produit</p>
            <p className="mt-2 text-sm text-text-muted">
              Crée un produit via l’API (upload image + insertion DB).
            </p>

            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs uppercase tracking-[0.12em] text-text-muted">Nom</span>
                <input
                  id="product-name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  placeholder="Ex: Manteau Atelier"
                />
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-[0.12em] text-text-muted">Description</span>
                <textarea
                  id="product-description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  className="mt-2 w-full resize-none rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  placeholder="Décrivez le produit (matière, coupe, sensation…)"
                />
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-[0.12em] text-text-muted">Images (fichiers locaux)</span>
                <input
                  id="product-images"
                  name="images"
                  type="file"
                  accept="image/*"
                  multiple
                  required={imageFiles.length === 0}
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    setImageFiles(files);
                  }}
                  className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft file:mr-4 file:rounded-card file:border-0 file:bg-bg-subtle file:px-4 file:py-2 file:text-sm file:font-medium file:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                />
                {imagePreviewUrls.length > 0 ? (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {imagePreviewUrls.map((url, idx) => (
                      <div key={idx} className="relative overflow-hidden rounded-card border border-border-soft bg-bg-subtle">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Aperçu ${idx + 1}`} className="h-32 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const next = imageFiles.filter((_, i) => i !== idx);
                            setImageFiles(next);
                          }}
                          className="absolute right-2 top-2 rounded-full bg-promo-old/80 p-1.5 text-white shadow-soft transition hover:bg-promo-old focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                          aria-label="Supprimer l'image"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                {imagePreviewUrl ? (
                  <div className="mt-3 overflow-hidden rounded-card border border-border-soft bg-bg-subtle">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreviewUrl} alt="Aperçu" className="h-40 w-full object-cover" />
                  </div>
                ) : null}
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-[0.12em] text-text-muted">Catégorie</span>
                <select
                  id="product-category"
                  name="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-[0.12em] text-text-muted">Nombre d’articles (stock)</span>
                <input
                  id="product-stock"
                  name="stock"
                  value={Number.isFinite(inventoryCount) ? String(inventoryCount) : ""}
                  onChange={(e) => setInventoryCount(e.target.value === "" ? 0 : Number(e.target.value))}
                  type="number"
                  min={0}
                  step={1}
                  required
                  className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  placeholder="Ex: 25"
                />
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-[0.12em] text-text-muted">Prix (XAF)</span>
                <input
                  id="product-price"
                  name="price"
                  value={Number.isFinite(priceXaf) ? (priceXaf ? String(priceXaf) : "") : ""}
                  onChange={(e) => setPriceXaf(e.target.value === "" ? 0 : Number(e.target.value))}
                  inputMode="numeric"
                  type="number"
                  min={1}
                  step={1}
                  required
                  className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  placeholder="Ex: 120000"
                />
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-[0.12em] text-text-muted">Prix promotionnel (XAF)</span>
                <input
                  id="product-promoPrice"
                  name="promoPrice"
                  value={promoPriceXaf === null ? "" : String(promoPriceXaf)}
                  onChange={(e) => setPromoPriceXaf(e.target.value === "" ? null : Number(e.target.value))}
                  inputMode="numeric"
                  type="number"
                  min={1}
                  step={1}
                  className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  placeholder="Optionnel (doit être inférieur au prix)"
                />
                <p className="mt-2 text-xs text-text-muted">Laissez vide si aucune promotion.</p>
              </label>

              <button
                type="submit"
                className="mt-2 inline-flex w-full items-center justify-center rounded-card bg-accent px-5 py-3 text-sm font-medium text-bg-surface shadow-soft transition duration-150 ease-premium hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                Enregistrer
              </button>

              {authStatus ? <p className="text-xs text-text-muted">{authStatus}</p> : null}
            </form>
          </div>
        </section>

        <section>
          <div className="overflow-hidden rounded-modal border border-border-soft bg-bg-surface shadow-soft">
            <div className="flex items-center justify-between border-b border-border-soft px-6 py-4">
              <p className="text-sm font-medium text-text-primary">Liste des produits</p>
              <p className="text-xs text-text-muted">
                {allCount - disabledCount} actifs · {disabledCount} désactivés
              </p>
            </div>

            <div className="overflow-auto">
              <table className="w-full min-w-[720px]">
                <thead className="bg-bg-subtle">
                  <tr className="text-left text-xs uppercase tracking-[0.12em] text-text-muted">
                    <th className="px-6 py-3">Nom</th>
                    <th className="px-6 py-3">Catégorie</th>
                    <th className="px-6 py-3">Stock</th>
                    <th className="px-6 py-3">Prix</th>
                    <th className="px-6 py-3">Promo</th>
                    <th className="px-6 py-3">Statut</th>
                    <th className="px-6 py-3">Lien</th>
                  </tr>
                </thead>
                <tbody>
                  {activeItems.map((p) => {
                    const key = String(p.id);
                    const basePrice = getBasePriceXaf(p);
                    const promoPrice = getPromoPriceXaf(p);
                    const gallery = Array.isArray((p as any).images) ? ((p as any).images as string[]) : [];
                    return (
                      <Fragment key={p.id}>
                        <tr className="border-t border-border-soft text-sm">
                          <td className="px-6 py-4 font-medium text-text-primary">
                            <div className="flex flex-col">
                              <input
                                defaultValue={p.name}
                                onBlur={(e) => {
                                  const nextName = e.currentTarget.value.trim();
                                  if (!nextName) {
                                    e.currentTarget.value = p.name;
                                    return;
                                  }
                                  if (nextName !== p.name) {
                                    void updateRemoteProduct(p.id, { name: nextName });
                                  }
                                }}
                                className="w-full rounded-card border border-border-soft bg-bg-surface px-3 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                aria-label={`Nom ${p.name}`}
                              />
                              <span className="mt-1 text-xs text-text-muted">ID: {p.id}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={p.category}
                              onChange={(e) => {
                                const next = e.target.value;
                                void updateRemoteProduct(p.id, { category: next });
                              }}
                              className="w-full min-w-[160px] rounded-card border border-border-soft bg-bg-surface px-3 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                              aria-label={`Catégorie ${p.name}`}
                            >
                              {categories.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                              {!categories.includes(p.category) ? <option value={p.category}>{p.category}</option> : null}
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              defaultValue={String(p.stock ?? 0)}
                              onBlur={(e) => {
                                const raw = e.currentTarget.value;
                                const n = raw === "" ? NaN : Number(raw);
                                if (!Number.isFinite(n) || n < 0) {
                                  e.currentTarget.value = String(p.stock ?? 0);
                                  return;
                                }
                                const next = Math.floor(n);
                                if (next !== (p.stock ?? 0)) {
                                  void updateRemoteProduct(p.id, { stock: next });
                                }
                              }}
                              inputMode="numeric"
                              type="number"
                              min={0}
                              step={1}
                              className="w-full min-w-[120px] rounded-card border border-border-soft bg-bg-surface px-3 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                              aria-label={`Stock ${p.name}`}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              defaultValue={String(basePrice)}
                              onBlur={(e) => {
                                const raw = e.currentTarget.value;
                                const n = raw === "" ? NaN : Number(raw);
                                if (!Number.isFinite(n) || n <= 0) {
                                  e.currentTarget.value = String(basePrice);
                                  return;
                                }
                                const nextBase = Math.floor(n);
                                if (promoPrice !== null && promoPrice >= nextBase) {
                                  void updateRemoteProduct(p.id, { price: nextBase, originalPrice: null as any });
                                  return;
                                }
                                if (promoPrice !== null) {
                                  void updateRemoteProduct(p.id, { price: promoPrice, originalPrice: nextBase });
                                  return;
                                }
                                void updateRemoteProduct(p.id, { price: nextBase, originalPrice: null as any });
                              }}
                              inputMode="numeric"
                              type="number"
                              min={1}
                              step={1}
                              className="w-full min-w-[140px] rounded-card border border-border-soft bg-bg-surface px-3 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                              aria-label={`Prix ${p.name}`}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <input
                                defaultValue={promoPrice === null ? "" : String(promoPrice)}
                                onBlur={(e) => {
                                  const base = getBasePriceXaf(p);
                                  const raw = e.currentTarget.value;
                                  if (raw === "") {
                                    void updateRemoteProduct(p.id, { price: base, originalPrice: null as any });
                                    return;
                                  }
                                  const n = Number(raw);
                                  if (!Number.isFinite(n) || n <= 0) {
                                    e.currentTarget.value = promoPrice === null ? "" : String(promoPrice);
                                    return;
                                  }
                                  const nextPromo = Math.floor(n);
                                  if (nextPromo >= base) {
                                    e.currentTarget.value = promoPrice === null ? "" : String(promoPrice);
                                    return;
                                  }
                                  void updateRemoteProduct(p.id, { price: nextPromo, originalPrice: base });
                                }}
                                inputMode="numeric"
                                type="number"
                                min={1}
                                max={Math.max(1, basePrice - 1)}
                                step={1}
                                className="w-full min-w-[140px] rounded-card border border-border-soft bg-bg-surface px-3 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                placeholder="—"
                                title="Doit être inférieur au prix"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={statusOverrides[key] ?? "Actif"}
                              onChange={(e) => saveStatusOverride(key, e.target.value as ProductStatus)}
                              className="w-full min-w-[140px] rounded-card border border-border-soft bg-bg-surface px-3 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                              aria-label={`Statut ${p.name}`}
                            >
                              <option value="Actif">Actif</option>
                              <option value="Désactivé">Désactivé</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <a
                                href={(gallery[0] || p.imageUrl) as any}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-text-primary underline decoration-border-soft underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                              >
                                Image
                              </a>
                              <button
                                type="button"
                                onClick={() => setExpandedId((prev) => (prev === p.id ? null : p.id))}
                                className="text-sm text-text-primary underline decoration-border-soft underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                              >
                                Options
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const ok = confirm(`Supprimer “${p.name}” ?`);
                                  if (!ok) return;
                                  void deleteRemoteProduct(p.id).catch((err: any) => {
                                    setAuthStatus(err?.message || "Impossible de supprimer.");
                                  });
                                }}
                                className="text-sm text-text-muted underline decoration-border-soft underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                              >
                                Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>

                        {expandedId === p.id ? (
                          <tr className="border-t border-border-soft bg-bg-subtle/40 text-sm">
                            <td className="px-6 py-4" colSpan={7}>
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <label className="block">
                                  <span className="text-xs uppercase tracking-[0.12em] text-text-muted">Couleurs (séparées par des virgules)</span>
                                  <input
                                    defaultValue={Array.isArray((p as any).colors) ? ((p as any).colors as string[]).join(", ") : ""}
                                    onBlur={(e) => {
                                      const next = parseCommaList(e.currentTarget.value);
                                      void updateRemoteProduct(p.id, { colors: next as any }).catch((err: any) => {
                                        setAuthStatus(err?.message || "Impossible de mettre à jour.");
                                      });
                                    }}
                                    className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                    placeholder="Ex: Noir, Ivoire"
                                  />
                                </label>

                                <label className="block">
                                  <span className="text-xs uppercase tracking-[0.12em] text-text-muted">Tailles (séparées par des virgules)</span>
                                  <input
                                    defaultValue={Array.isArray((p as any).sizes) ? ((p as any).sizes as string[]).join(", ") : ""}
                                    onBlur={(e) => {
                                      const next = parseCommaList(e.currentTarget.value);
                                      void updateRemoteProduct(p.id, { sizes: next as any }).catch((err: any) => {
                                        setAuthStatus(err?.message || "Impossible de mettre à jour.");
                                      });
                                    }}
                                    className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                    placeholder="Ex: S, M, L"
                                  />
                                </label>

                                <label className="block md:col-span-2">
                                  <span className="text-xs uppercase tracking-[0.12em] text-text-muted">Une note choisie</span>
                                  <textarea
                                    defaultValue={typeof (p as any).editorNote === "string" ? String((p as any).editorNote) : ""}
                                    onBlur={(e) => {
                                      const next = e.currentTarget.value.trim();
                                      void updateRemoteProduct(p.id, { editorNote: (next || null) as any }).catch((err: any) => {
                                        setAuthStatus(err?.message || "Impossible de mettre à jour.");
                                      });
                                    }}
                                    rows={3}
                                    className="mt-2 w-full resize-none rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                    placeholder="Texte court (sans guillemets)"
                                  />
                                </label>

                                <div className="md:col-span-2">
                                  <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Images du produit</p>
                                  <div className="mt-2 flex flex-wrap items-center gap-3">
                                    <span className="text-sm text-text-muted">{gallery.length ? `${gallery.length} images` : "1 image"}</span>
                                    {gallery.length ? (
                                      <a
                                        href={gallery[0]}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm text-text-primary underline decoration-border-soft underline-offset-4"
                                      >
                                        Ouvrir la première
                                      </a>
                                    ) : null}
                                  </div>

                                  <div className="mt-3">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      onChange={(e) => {
                                        const files = Array.from(e.target.files ?? []);
                                        if (!files.length) return;
                                        void (async () => {
                                          try {
                                            const urls = await uploadImages(files);
                                            await updateRemoteProduct(p.id, { images: urls as any, imageUrl: urls[0] } as any);
                                            setAuthStatus("");
                                          } catch (err: any) {
                                            setAuthStatus(err?.message || "Impossible de mettre à jour les images.");
                                          } finally {
                                            e.currentTarget.value = "";
                                          }
                                        })();
                                      }}
                                      className="w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft file:mr-4 file:rounded-card file:border-0 file:bg-bg-subtle file:px-4 file:py-2 file:text-sm file:font-medium file:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                    />
                                    <p className="mt-2 text-xs text-text-muted">Sélectionnez des fichiers pour remplacer la galerie.</p>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {disabledCount > 0 ? (
            <div className="mt-4 overflow-hidden rounded-modal border border-border-soft bg-bg-surface shadow-soft">
              <details>
                <summary className="cursor-pointer list-none border-b border-border-soft px-6 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-text-primary">Produits désactivés</p>
                    <p className="text-xs text-text-muted">{disabledCount} éléments</p>
                  </div>
                </summary>

                <div className="overflow-auto">
                  <table className="w-full min-w-[720px]">
                    <thead className="bg-bg-subtle">
                      <tr className="text-left text-xs uppercase tracking-[0.12em] text-text-muted">
                        <th className="px-6 py-3">Nom</th>
                        <th className="px-6 py-3">Catégorie</th>
                        <th className="px-6 py-3">Stock</th>
                        <th className="px-6 py-3">Prix</th>
                        <th className="px-6 py-3">Promo</th>
                        <th className="px-6 py-3">Statut</th>
                        <th className="px-6 py-3">Lien</th>
                      </tr>
                    </thead>
                    <tbody>
                      {disabledItems.map((p) => {
                        const key = String(p.id);
                        const basePrice = getBasePriceXaf(p);
                        const promoPrice = getPromoPriceXaf(p);
                        return (
                          <tr key={p.id} className="border-t border-border-soft text-sm">
                            <td className="px-6 py-4 font-medium text-text-primary">
                              <div className="flex flex-col">
                                <input
                                  defaultValue={p.name}
                                  onBlur={(e) => {
                                    const nextName = e.currentTarget.value.trim();
                                    if (!nextName) {
                                      e.currentTarget.value = p.name;
                                      return;
                                    }
                                    if (nextName !== p.name) {
                                      void updateRemoteProduct(p.id, { name: nextName });
                                    }
                                  }}
                                  className="w-full rounded-card border border-border-soft bg-bg-surface px-3 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                  aria-label={`Nom ${p.name}`}
                                />
                                <span className="mt-1 text-xs text-text-muted">ID: {p.id}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <select
                                value={p.category}
                                onChange={(e) => {
                                  const next = e.target.value;
                                  void updateRemoteProduct(p.id, { category: next });
                                }}
                                className="w-full min-w-[160px] rounded-card border border-border-soft bg-bg-surface px-3 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                aria-label={`Catégorie ${p.name}`}
                              >
                                {categories.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                                {!categories.includes(p.category) ? (
                                  <option value={p.category}>{p.category}</option>
                                ) : null}
                              </select>
                            </td>
                            <td className="px-6 py-4">
                              <input
                                defaultValue={String(p.stock ?? 0)}
                                onBlur={(e) => {
                                  const raw = e.currentTarget.value;
                                  const n = raw === "" ? NaN : Number(raw);
                                  if (!Number.isFinite(n) || n < 0) {
                                    e.currentTarget.value = String(p.stock ?? 0);
                                    return;
                                  }
                                  const next = Math.floor(n);
                                  if (next !== (p.stock ?? 0)) {
                                    void updateRemoteProduct(p.id, { stock: next });
                                  }
                                }}
                                inputMode="numeric"
                                type="number"
                                min={0}
                                step={1}
                                className="w-full min-w-[120px] rounded-card border border-border-soft bg-bg-surface px-3 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                aria-label={`Stock ${p.name}`}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input
                                defaultValue={String(basePrice)}
                                onBlur={(e) => {
                                  const raw = e.currentTarget.value;
                                  const n = raw === "" ? NaN : Number(raw);
                                  if (!Number.isFinite(n) || n <= 0) {
                                    e.currentTarget.value = String(basePrice);
                                    return;
                                  }
                                  const nextBase = Math.floor(n);
                                  if (promoPrice !== null && promoPrice >= nextBase) {
                                    void updateRemoteProduct(p.id, { price: nextBase, originalPrice: null as any });
                                    return;
                                  }
                                  if (promoPrice !== null) {
                                    void updateRemoteProduct(p.id, { price: promoPrice, originalPrice: nextBase });
                                    return;
                                  }
                                  void updateRemoteProduct(p.id, { price: nextBase, originalPrice: null as any });
                                }}
                                inputMode="numeric"
                                type="number"
                                min={1}
                                step={1}
                                className="w-full min-w-[140px] rounded-card border border-border-soft bg-bg-surface px-3 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                aria-label={`Prix ${p.name}`}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <input
                                  defaultValue={promoPrice === null ? "" : String(promoPrice)}
                                  onBlur={(e) => {
                                    const base = getBasePriceXaf(p);
                                    const raw = e.currentTarget.value;
                                    if (raw === "") {
                                      void updateRemoteProduct(p.id, { price: base, originalPrice: null as any });
                                      return;
                                    }
                                    const n = Number(raw);
                                    if (!Number.isFinite(n) || n <= 0) {
                                      e.currentTarget.value = promoPrice === null ? "" : String(promoPrice);
                                      return;
                                    }
                                    const nextPromo = Math.floor(n);
                                    if (nextPromo >= base) {
                                      e.currentTarget.value = promoPrice === null ? "" : String(promoPrice);
                                      return;
                                    }
                                    void updateRemoteProduct(p.id, { price: nextPromo, originalPrice: base });
                                  }}
                                  inputMode="numeric"
                                  type="number"
                                  min={1}
                                  max={Math.max(1, basePrice - 1)}
                                  step={1}
                                  className="w-full min-w-[140px] rounded-card border border-border-soft bg-bg-surface px-3 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                  placeholder="—"
                                  title="Doit être inférieur au prix"
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <select
                                value={statusOverrides[key] ?? "Actif"}
                                onChange={(e) => saveStatusOverride(key, e.target.value as ProductStatus)}
                                className="w-full min-w-[140px] rounded-card border border-border-soft bg-bg-surface px-3 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                aria-label={`Statut ${p.name}`}
                              >
                                <option value="Actif">Actif</option>
                                <option value="Désactivé">Désactivé</option>
                              </select>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <a
                                  href={p.imageUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm text-text-primary underline decoration-border-soft underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                >
                                  Image
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const ok = confirm(`Supprimer “${p.name}” ?`);
                                    if (!ok) return;
                                    void deleteRemoteProduct(p.id).catch((err: any) => {
                                      setAuthStatus(err?.message || "Impossible de supprimer.");
                                    });
                                  }}
                                  className="text-sm text-text-muted underline decoration-border-soft underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                >
                                  Supprimer
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
