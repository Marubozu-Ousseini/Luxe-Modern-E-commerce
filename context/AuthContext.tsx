import React, { createContext, useContext, useState, useMemo } from 'react';
import * as AuthAPI from '../services/authClient';

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
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextShape | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await AuthAPI.login(email, password);
      setUser(data);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const data = await AuthAPI.register(name, email, password);
      setUser(data);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await AuthAPI.logout();
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
