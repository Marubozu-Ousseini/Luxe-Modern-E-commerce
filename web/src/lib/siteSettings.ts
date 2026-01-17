export type SiteSettings = {
  brandName: string;
  tagline: string;
};

const STORAGE_KEY = "malafaareh_site_settings";

const DEFAULT_SETTINGS: SiteSettings = {
  brandName: "Malafaareh",
  tagline: "Le luxe qui murmure, la beauté.... Une présence qui reste.",
};

export function safeParseSiteSettings(value: string | null): SiteSettings | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as any;
    const brandName = typeof parsed?.brandName === "string" ? parsed.brandName.trim() : "";
    const tagline = typeof parsed?.tagline === "string" ? parsed.tagline.trim() : "";
    if (!brandName && !tagline) return null;
    return {
      brandName: brandName || DEFAULT_SETTINGS.brandName,
      tagline: tagline || DEFAULT_SETTINGS.tagline,
    };
  } catch {
    return null;
  }
}

export async function fetchSiteSettingsFromServer(): Promise<SiteSettings | null> {
  try {
    const res = await fetch("/api/site-settings", { headers: { accept: "application/json" }, cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const brandName = typeof data?.brandName === "string" ? data.brandName.trim() : "";
    const tagline = typeof data?.tagline === "string" ? data.tagline.trim() : "";
    if (!brandName && !tagline) return null;
    return {
      brandName: brandName || DEFAULT_SETTINGS.brandName,
      tagline: tagline || DEFAULT_SETTINGS.tagline,
    };
  } catch {
    return null;
  }
}

export function getCachedSiteSettings(): SiteSettings | null {
  try {
    return safeParseSiteSettings(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function cacheSiteSettings(settings: SiteSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export const siteSettingsStorageKey = STORAGE_KEY;
export const defaultSiteSettings = DEFAULT_SETTINGS;
