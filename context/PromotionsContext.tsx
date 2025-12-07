import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

// Frontend copy of PromotionsState (subset + extras we consume). Keep in sync with backend if extended.
export interface PromotionsState {
  promotionsActive: boolean;
  vouchersActive: boolean;
  bannerText: string;
  voucherText: string;
  loginBackground?: { desktop?: string; mobile?: string; fallback?: string[]; alt?: string };
  pageBackgrounds?: Record<string, { desktop?: string; mobile?: string; fallback?: string[]; alt?: string }>;
  marqueeSpeedSeconds?: number;
  glowEnabled?: boolean;
  stickers?: { id: string; text?: string; imageUrl?: string; href?: string }[];
  updatedAt: string;
}

interface PromotionsContextValue {
  promotions: PromotionsState | null;
  refresh: () => Promise<void>;
}

const PromotionsContext = createContext<PromotionsContextValue | undefined>(undefined);

export const PromotionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [promotions, setPromotions] = useState<PromotionsState | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const load = async () => {
    if (loading) return; // avoid overlapping
    setLoading(true);
    try {
      const res = await fetch('/api/promotions');
      if (!res.ok) return;
      const json = await res.json();
      setPromotions(json);
    } catch {/* ignore */} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      // Clear promotions when logged out and stop polling
      setPromotions(null);
      return;
    }
    load();
    // periodic refresh in case admin changes config
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [user]);

  return (
    <PromotionsContext.Provider value={{ promotions, refresh: load }}>
      {children}
    </PromotionsContext.Provider>
  );
};

export function usePromotions() {
  const ctx = useContext(PromotionsContext);
  if (!ctx) throw new Error('usePromotions must be used within PromotionsProvider');
  return ctx;
}

// Helper hook to resolve a page background (desktop/mobile + fallback chain + load test)
export function usePageBackground(pageKey: string) {
  const { promotions } = usePromotions();
  const [src, setSrc] = useState<string | null>(null);
  const [alt, setAlt] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    const pageCfg = promotions?.pageBackgrounds?.[pageKey];
    if (!pageCfg) { setLoading(false); return; } // nothing configured yet
    setAlt(pageCfg.alt);
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches;
    const candidates = [isMobile ? pageCfg.mobile : pageCfg.desktop, ...(pageCfg.fallback || [])].filter(Boolean) as string[];
    if (!candidates.length) { setLoading(false); return; }
    (async () => {
      for (const candidate of candidates) {
        try {
          await new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = candidate;
          });
          if (!cancelled) { setSrc(candidate); setLoading(false); break; }
        } catch {/* try next */}
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [promotions, pageKey]);

  return { src, alt, loading } as const;
}
