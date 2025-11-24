import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from './AuthContext.tsx';
import { fetchFavorites, toggleFavoriteRemote } from '../services/favoritesClient.ts';

interface FavoritesContextShape {
  favorites: number[];
  isFavorite: (id: number) => boolean;
  toggleFavorite: (id: number) => void;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextShape | undefined>(undefined);

const storageKeyFor = (userId: string | undefined) => `favorites:${userId || 'guest'}`;

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<number[]>([]);

  // Load favorites when user changes
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(storageKeyFor(user?.id)) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setFavorites(parsed.filter(n => typeof n === 'number'));
        } else {
          setFavorites([]);
        }
      } else {
        setFavorites([]);
      }
    } catch (e) {
      console.warn('Failed to load favorites', e);
      setFavorites([]);
    }
  }, [user?.id]);

  // Persist favorites
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKeyFor(user?.id), JSON.stringify(favorites));
      }
    } catch (e) {
      console.warn('Failed to persist favorites', e);
    }
  }, [favorites, user?.id]);

  const isFavorite = useCallback((id: number) => favorites.includes(id), [favorites]);

  // Maintain a ref of remote snapshot to minimize API calls (not exposed outside)
  const remoteSnapshotRef = React.useRef<number[]>([]);
  const pendingDesiredRef = React.useRef<Map<number, boolean>>(new Map());
  const flushTimerRef = React.useRef<number | null>(null);

  const scheduleFlush = useCallback(() => {
    if (!user) return; // no remote sync for guest
    if (flushTimerRef.current) {
      window.clearTimeout(flushTimerRef.current);
    }
    flushTimerRef.current = window.setTimeout(async () => {
      flushTimerRef.current = null;
      // Build operations list comparing desired vs remote snapshot
      const desired = pendingDesiredRef.current;
      if (desired.size === 0) return;
      for (const [productId, shouldBeFav] of desired.entries()) {
        const currentlyFav = remoteSnapshotRef.current.includes(productId);
        if (currentlyFav !== shouldBeFav) {
          try {
            // Call toggle only when state difference exists
            const updated = await toggleFavoriteRemote(productId);
            remoteSnapshotRef.current = updated;
            setFavorites(updated); // sync local in case of server-side adjustments
          } catch (e) {
            console.warn('Echec sync favoris (debounce batch item)', e);
          }
        }
      }
      // Clear pending map after flush
      pendingDesiredRef.current.clear();
      // Fetch final authoritative list to ensure consistency (optional extra round)
      try {
        const finalRemote = await fetchFavorites();
        remoteSnapshotRef.current = finalRemote;
        setFavorites(finalRemote);
      } catch (e) {
        // If fetch fails we keep last known state
        console.warn('Verification finale des favoris échouée');
      }
    }, 500); // 500ms debounce window
  }, [user]);

  const toggleFavorite = useCallback((id: number) => {
    // Optimistic local change immediately
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
    // Record desired final state
    const nextLocal = favorites.includes(id) ? false : true;
    pendingDesiredRef.current.set(id, nextLocal);
    // If user authenticated, schedule batch flush
    scheduleFlush();
  }, [favorites, scheduleFlush, user]);

  // On login load remote favorites (override local) if possible
  useEffect(() => {
    (async () => {
      if (!user) return; // guest uses local only
      try {
        const remote = await fetchFavorites();
        remoteSnapshotRef.current = remote;
        setFavorites(remote);
      } catch (e) {
        console.warn('Chargement favoris serveur échoué, fallback local.', e);
      }
    })();
  }, [user]);

  const clearFavorites = useCallback(() => setFavorites([]), []);

  const value = useMemo(() => ({ favorites, isFavorite, toggleFavorite, clearFavorites }), [favorites, isFavorite, toggleFavorite, clearFavorites]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
};
