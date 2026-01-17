import type { CartLine } from "@/components/cart/types";
import type { Product } from "@/lib/products";

export type PurchaseCounts = Record<string, number>;

export const PURCHASES_KEY = "malafaareh-purchases-v1";
export const PURCHASES_CHANGED_EVENT = "malafaareh-purchases-changed";

export function safeParsePurchaseCounts(value: string | null): PurchaseCounts {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: PurchaseCounts = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof k !== "string") continue;
      if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) continue;
      out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function inc(map: Record<string, number>, key: string, by: number) {
  if (!key) return;
  map[key] = (map[key] ?? 0) + by;
}

function normalizeToken(s: string): string {
  return s.trim().toLowerCase();
}

function getCategoryTokens(product: Product): string[] {
  const out: string[] = [];
  if (product.category) out.push(normalizeToken(product.category));

  // Backward/forward compatibility: some API-mapped products may carry richer category structures.
  const maybeCategories = (product as any)?.categories;
  if (Array.isArray(maybeCategories)) {
    for (const c of maybeCategories) {
      const title = typeof c?.title === "string" ? c.title : typeof c === "string" ? c : "";
      if (title) out.push(normalizeToken(title));
    }
  }

  return Array.from(new Set(out));
}

function addProductTokens(map: Record<string, number>, product: Product, by: number) {
  for (const title of getCategoryTokens(product)) inc(map, `cat:${title}`, by);
  for (const m of product.materials ?? []) {
    inc(map, `mat:${normalizeToken(m)}`, by);
  }
  for (const col of product.colors ?? []) {
    inc(map, `col:${normalizeToken(col)}`, by);
  }
}

function buildUserTokenWeights(products: Product[], favoriteSlugs: string[], cartLines: CartLine[], purchases: PurchaseCounts) {
  const weights: Record<string, number> = {};

  const bySlug = new Map<string, Product>();
  for (const p of products) bySlug.set(p.slug, p);

  for (const slug of favoriteSlugs) {
    const p = bySlug.get(slug);
    if (p) addProductTokens(weights, p, 3);
  }

  for (const line of cartLines) {
    const p = bySlug.get(line.slug);
    if (p) addProductTokens(weights, p, 2 * Math.max(1, line.quantity ?? 1));
  }

  for (const [slug, count] of Object.entries(purchases)) {
    const p = bySlug.get(slug);
    if (p) addProductTokens(weights, p, 4 * Math.max(1, count));
  }

  return weights;
}

function overlapScore(current: Product, candidate: Product) {
  let score = 0;

  const curCats = new Set(getCategoryTokens(current));
  const candCats = getCategoryTokens(candidate);
  for (const c of candCats) if (curCats.has(c)) score += 6;

  const curMats = new Set((current.materials ?? []).map(normalizeToken));
  for (const m of candidate.materials ?? []) if (curMats.has(normalizeToken(m))) score += 2;

  const curColors = new Set((current.colors ?? []).map(normalizeToken));
  for (const col of candidate.colors ?? []) if (curColors.has(normalizeToken(col))) score += 1;

  return score;
}

function userAffinityScore(userTokens: Record<string, number>, candidate: Product) {
  let score = 0;

  for (const title of getCategoryTokens(candidate)) score += (userTokens[`cat:${title}`] ?? 0) * 1.5;

  for (const m of candidate.materials ?? []) {
    score += (userTokens[`mat:${normalizeToken(m)}`] ?? 0) * 0.6;
  }

  for (const col of candidate.colors ?? []) {
    score += (userTokens[`col:${normalizeToken(col)}`] ?? 0) * 0.3;
  }

  return score;
}

export function recommendCompleteTheLook(opts: {
  current: Product;
  products: Product[];
  favoriteSlugs: string[];
  cartLines: CartLine[];
  purchaseCounts: PurchaseCounts;
  limit?: number;
}): Product[] {
  const { current, products, favoriteSlugs, cartLines, purchaseCounts, limit = 3 } = opts;

  const userTokens = buildUserTokenWeights(products, favoriteSlugs, cartLines, purchaseCounts);
  const favoritesSet = new Set(favoriteSlugs);
  const cartSet = new Set(cartLines.map((l) => l.slug));

  const scored = products
    .filter((p) => p.slug !== current.slug)
    .filter((p) => {
      const stock = (p as any).stock;
      return !(typeof stock === "number" && Number.isFinite(stock) && stock <= 0);
    })
    .map((candidate) => {
      let score = 0;
      score += overlapScore(current, candidate);
      score += userAffinityScore(userTokens, candidate);
      if (favoritesSet.has(candidate.slug)) score += 4;
      if (cartSet.has(candidate.slug)) score += 2;
      return { candidate, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.candidate.name.localeCompare(b.candidate.name);
    });

  return scored.slice(0, Math.max(0, limit)).map((x) => x.candidate);
}
