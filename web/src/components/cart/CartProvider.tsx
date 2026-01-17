"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CartDrawer } from "@/components/cart/CartDrawer";
import type { CartLine } from "@/components/cart/types";

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addLine: (line: Omit<CartLine, "quantity"> & { quantity?: number }) => void;
  setQuantity: (slug: string, nextQty: number) => void;
  removeLine: (slug: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotalXaf: number;
};

const CartContext = createContext<CartState | null>(null);

const STORAGE_KEY = "malafaareh-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CartLine[];
      if (Array.isArray(parsed)) setLines(parsed);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // ignore
    }
  }, [lines]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addLine: CartState["addLine"] = useCallback((line) => {
    setLines((prev) => {
      const qty = line.quantity ?? 1;
      const next = [...prev];
      const i = next.findIndex((l) => l.slug === line.slug);
      if (i >= 0) next[i] = { ...next[i], quantity: next[i].quantity + qty };
      else next.push({ ...line, quantity: qty });
      return next;
    });
    setIsOpen(true);
  }, []);

  const setQuantity = useCallback((slug: string, nextQty: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.slug === slug ? { ...l, quantity: nextQty } : l))
        .filter((l) => l.quantity > 0)
    );
  }, []);

  const removeLine = useCallback((slug: string) => {
    setLines((prev) => prev.filter((l) => l.slug !== slug));
  }, []);

  const clearCart = useCallback(() => {
    setLines([]);
  }, []);

  const itemCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines]
  );

  const subtotalXaf = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity * l.priceXaf, 0),
    [lines]
  );

  const value = useMemo<CartState>(
    () => ({
      lines,
      isOpen,
      openCart,
      closeCart,
      addLine,
      setQuantity,
      removeLine,
      clearCart,
      itemCount,
      subtotalXaf,
    }),
    [lines, isOpen, openCart, closeCart, addLine, setQuantity, removeLine, clearCart, itemCount, subtotalXaf]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
