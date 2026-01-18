import type { Product } from "@/lib/products";

export type ApiProduct = {
  id: number;
  name: string;
  price: number;
  originalPrice?: number | null;
  description: string;
  category: string;
  imageUrl: string;
  images?: string[] | null;
  colors?: string[] | null;
  sizes?: string[] | null;
  editorNote?: string | null;
  stock?: number | null;
  limitedAvailability?: boolean | null;
  labels?: string[] | null;
};

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

function mapCategory(raw: string): Product["category"] {
  const v = String(raw || "").trim();
  if (v === "Parfums") return "Parfums et Cosmétiques";
  if (v === "Prêt-à-porter" || v === "Vêtements") return "Vêtements";
  if (v === "Chaussures") return "Chaussures";
  if (v === "Montres") return "Montres";
  if (v === "Accessoires") return "Accessoires";
  // fallback: keep storefront functional even if backend adds new categories
  return "Vêtements";
}

export function apiProductToUiProduct(p: ApiProduct): Product & { id: number; imageUrl?: string } {
  const hasOriginal = typeof p.originalPrice === "number" && Number.isFinite(p.originalPrice) && p.originalPrice > 0;
  const basePriceXaf = hasOriginal ? (p.originalPrice as number) : p.price;
  const promoPriceXaf = hasOriginal ? p.price : undefined;

  const images = Array.isArray(p.images) ? p.images.filter((x) => typeof x === "string" && x.trim().length > 0) : [];
  const colors = Array.isArray(p.colors) ? p.colors.filter((x) => typeof x === "string" && x.trim().length > 0) : [];
  const sizes = Array.isArray(p.sizes) ? p.sizes.filter((x) => typeof x === "string" && x.trim().length > 0) : [];

  return {
    id: p.id,
    slug: `${slugify(p.name)}-${p.id}`,
    name: p.name,
    category: mapCategory(p.category),
    priceXaf: basePriceXaf,
    promoPriceXaf,
    materials: [],
    colors: colors.length ? colors : ["Unique"],
    sizes: sizes.length ? sizes : ["Taille unique"],
    fit: "",
    limitedAvailability: Boolean(p.limitedAvailability),
    description: p.description,
    details: [],
    care: [],
    imageUrl: images[0] || p.imageUrl,
    images: images.length ? images : undefined,
    editorNote: typeof p.editorNote === "string" && p.editorNote.trim() ? p.editorNote.trim() : undefined,
    stock: typeof p.stock === "number" && Number.isFinite(p.stock) ? p.stock : undefined,
  };
}

export async function fetchStorefrontProducts(opts?: { q?: string; limit?: number; offset?: number }) {
  const params = new URLSearchParams();
  if (opts?.q) params.set("q", opts.q);
  if (typeof opts?.limit === "number") params.set("limit", String(opts.limit));
  if (typeof opts?.offset === "number") params.set("offset", String(opts.offset));

  const url = `/api/produits${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || "Impossible de charger les produits.");
  }
  const data = (await res.json()) as unknown;
  const list = Array.isArray(data) ? (data as ApiProduct[]) : [];
  return list.filter(Boolean).map(apiProductToUiProduct);
}

export function parseProductIdFromSlug(slug: string): number | null {
  const m = String(slug).match(/-(\d+)$/);
  if (!m) return null;
  const id = Number(m[1]);
  return Number.isFinite(id) ? id : null;
}
