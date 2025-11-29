import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import * as AuthAPI from '../services/authClient';
import { onAuthChange, getCurrentIdToken, loginWithEmail as fbLoginWithEmail, registerWithEmail as fbRegisterWithEmail, logoutFirebase, loginWithGoogle as fbLoginWithGoogle } from '../services/firebaseClient';

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
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle?: () => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextShape | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Subscribe to Firebase auth changes if configured
    const unsub = onAuthChange(async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        return;
      }
      const token = await getCurrentIdToken();
      const role = (fbUser?.admin || fbUser?.role) ? (fbUser.admin ? 'admin' : (fbUser.role || 'user')) : 'user';
      setUser({ id: fbUser.uid, email: fbUser.email || '', name: fbUser.displayName || undefined, role });
      // Optionally notify backend about login or sync user
      if (token) {
        try { await AuthAPI.setIdToken(token); } catch (e) { /* ignore */ }
      }
    });
    return () => unsub && unsub();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Prefer Firebase login if configured
      try {
        const fbUser = await fbLoginWithEmail(email, password);
        const token = await getCurrentIdToken();
        const role = fbUser?.admin ? 'admin' : 'user';
        setUser({ id: fbUser.uid, email: fbUser.email || '', name: fbUser.displayName || undefined, role });
        if (token) await AuthAPI.setIdToken(token);
        return;
      } catch (_) {
        const data = await AuthAPI.login(email, password);
        setUser(data);
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
        setUser({ id: fbUser.uid, email: fbUser.email || '', name: fbUser.displayName || undefined, role });
        // Log Google account sign-in for debugging/observability
        // eslint-disable-next-line no-console
        console.info('[auth] Google sign-in:', { uid: fbUser.uid, email: fbUser.email, name: fbUser.displayName });
        if (token) await AuthAPI.setIdToken(token);
        return fbUser;
      } catch (_) {
        // If firebase not configured, there's no fallback via AuthAPI for Google popup
        throw new Error('Firebase Google sign-in failed or is not configured');
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      try {
        const fbUser = await fbRegisterWithEmail(email, password);
        const token = await getCurrentIdToken();
        setUser({ id: fbUser.uid, email: fbUser.email || '', name, role: 'user' });
        if (token) await AuthAPI.setIdToken(token);
        return;
      } catch (_) {
        const data = await AuthAPI.register(name, email, password);
        setUser(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try { await logoutFirebase(); } catch (_) { /* ignore */ }
    try { await AuthAPI.logout(); } catch (_) { /* ignore */ }
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, register, loginWithGoogle, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
