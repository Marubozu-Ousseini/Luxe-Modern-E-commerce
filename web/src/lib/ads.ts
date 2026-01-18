export type AdKind = "text" | "image" | "video";
export type AdPlacementKey = "home" | "shop" | "category";

export type AdConfig = {
  id: string;
  kind: AdKind;
  placements: AdPlacementKey[];
  eyebrow?: string;
  title: string;
  body: string;
  ctaLabel: string;
  href: string;
  mediaUrl?: string;
};

const STORAGE_KEY = "malafaareh_ads";

export function safeParseAds(value: string | null): AdConfig[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as any;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x: any) => x && typeof x === "object")
      .map((x: any) => ({
        id: String(x.id || ""),
        kind: x.kind as AdKind,
        placements: Array.isArray(x.placements) ? x.placements : [],
        eyebrow: typeof x.eyebrow === "string" ? x.eyebrow : undefined,
        title: String(x.title || ""),
        body: String(x.body || ""),
        ctaLabel: String(x.ctaLabel || ""),
        href: String(x.href || ""),
        mediaUrl: typeof x.mediaUrl === "string" ? x.mediaUrl : undefined,
      }))
      .filter((x: AdConfig) => Boolean(x.id && x.kind && x.title && x.body && x.ctaLabel && x.href));
  } catch {
    return [];
  }
}

export async function fetchAdsFromServer(): Promise<AdConfig[]> {
  const res = await fetch("/api/ads", { headers: { accept: "application/json" }, cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as unknown;
  return safeParseAds(JSON.stringify(data));
}

export function getCachedAds(): AdConfig[] {
  try {
    return safeParseAds(localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

export function cacheAds(ads: AdConfig[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ads));
  } catch {
    // ignore
  }
}

export const adsStorageKey = STORAGE_KEY;
