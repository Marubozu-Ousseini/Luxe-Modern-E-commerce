import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import * as AuthAPI from '../services/authClient';
import { initFirebaseClient, onAuthChange, getCurrentIdToken, loginWithEmail as fbLoginWithEmail, registerWithEmail as fbRegisterWithEmail, logoutFirebase, loginWithGoogle as fbLoginWithGoogle } from '../services/firebaseClient';

type Role = 'user' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: Role;
}

interface AuthContextShape {
  user: AuthUser | null;
  loading: boolean;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string, town?: string) => Promise<void>;
  loginWithGoogle?: () => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextShape | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  // Persisted key for quick UI rehydration across refreshes. Server session is still
  // authoritative; we call `/api/auth/me` to validate and overwrite this cached value.
  const STORAGE_KEY = 'luxe:auth:user';

  useEffect(() => {
    // Rehydrate from localStorage immediately for smoother UX
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthUser;
        setUser(parsed);
      }
    } catch (_) {
      // ignore malformed storage
    }

    // Verify server session (cookie) and replace cached user with authoritative data.
    (async () => {
      try {
        const me = await AuthAPI.me();
        if (me) {
          setUser(me);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(me)); } catch (_) { /* ignore */ }
        } else {
          setUser(null);
          try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* ignore */ }
        }
      } catch (_) {
        // If the validation call fails, keep the rehydrated user temporarily but do not trust it.
      } finally {
        setInitializing(false);
      }
    })();

    // Subscribe to Firebase auth changes if configured
    let unsub: (() => void) | null = null;
    (async () => {
      try {
        await initFirebaseClient();
        const maybeUnsub = await onAuthChange(async (fbUser) => {
          if (!fbUser) {
            setUser(null);
            try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* ignore */ }
            return;
          }
          const token = await getCurrentIdToken();
          const role = (fbUser?.admin || fbUser?.role) ? (fbUser.admin ? 'admin' : (fbUser.role || 'user')) : 'user';
          const u = { id: fbUser.uid, email: fbUser.email || '', name: fbUser.displayName || undefined, role };
          setUser(u);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(u)); } catch (_) { /* ignore */ }
          // Optionally notify backend about login or sync user
          if (token) {
            try { await AuthAPI.setIdToken(token); } catch (e) { /* ignore */ }
            // Persist the Firebase user into the DB for consistency
            try { await AuthAPI.syncUser(u.name); } catch (_) { /* ignore */ }
          }
        });
        if (typeof maybeUnsub === 'function') unsub = maybeUnsub;
      } catch (e) {
        // ignore
      }
    })();
    return () => { try { if (unsub) unsub(); } catch (_) { /* ignore */ } };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Firebase-only authentication (no server fallback)
      const fbUser = await fbLoginWithEmail(email, password);
      const token = await getCurrentIdToken();
      const role = fbUser?.admin ? 'admin' : 'user';
      const u = { id: fbUser.uid, email: fbUser.email || '', name: fbUser.displayName || undefined, role };
      setUser(u);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(u)); } catch (_) { /* ignore */ }
      if (token) {
        await AuthAPI.setIdToken(token);
        // Persist the Firebase user into the DB for consistency
        try { await AuthAPI.syncUser(u.name); } catch (_) { /* ignore */ }
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      try {
        const fbUser = await fbLoginWithGoogle();
        const token = await getCurrentIdToken();
        const role = fbUser?.admin ? 'admin' : 'user';
        const u = { id: fbUser.uid, email: fbUser.email || '', name: fbUser.displayName || undefined, role };
        setUser(u);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(u)); } catch (_) { /* ignore */ }
        // Log Google account sign-in for debugging/observability
        // eslint-disable-next-line no-console
        console.info('[auth] Google sign-in:', { uid: fbUser.uid, email: fbUser.email, name: fbUser.displayName });
        if (token) {
          await AuthAPI.setIdToken(token);
          // Persist the Firebase user into the DB for consistency
          try { await AuthAPI.syncUser(u.name); } catch (_) { /* ignore */ }
        }
        return fbUser;
      } catch (_) {
        // If firebase not configured, there's no fallback via AuthAPI for Google popup
        throw new Error('Firebase Google sign-in failed or is not configured');
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, _phone?: string, _town?: string) => {
    setLoading(true);
    try {
      // Firebase-only registration (no server fallback)
      const fbUser = await fbRegisterWithEmail(email, password);
      const token = await getCurrentIdToken();
      const u = { id: fbUser.uid, email: fbUser.email || '', name, role: 'user' };
      setUser(u);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(u)); } catch (_) { /* ignore */ }
      if (token) {
        await AuthAPI.setIdToken(token);
        // Persist the Firebase user into the DB for consistency
        try { await AuthAPI.syncUser(u.name); } catch (_) { /* ignore */ }
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try { await logoutFirebase(); } catch (_) { /* ignore */ }
    try { await AuthAPI.logout(); } catch (_) { /* ignore */ }
    setUser(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* ignore */ }
  };

  const value = useMemo(() => ({ user, loading, initializing, login, register, loginWithGoogle, logout }), [user, loading, initializing]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
