"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { useCart } from "@/components/cart/useCart";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import { IconBag, IconHeart, IconReceipt, IconUser } from "@/components/ui/Icons";
import { logoutEverywhere } from "@/lib/session";
import { subscribeToAuthState } from "@/lib/firebaseClient";

const nav = [
  { href: "/shop", label: "Boutique" },
  { href: "/story", label: "Histoire" },
  { href: "/journal", label: "Journal" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { openCart, itemCount } = useCart();
  const { count: favoritesCount } = useFavorites();
  const [scrolled, setScrolled] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    function update() {
      setScrolled(window.scrollY > 8);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    if (itemCount <= 0) return;
    setCartPulse(true);
    const id = window.setTimeout(() => setCartPulse(false), 420);
    return () => window.clearTimeout(id);
  }, [itemCount]);

  useEffect(() => {
    let cancelled = false;
    const ADMIN_EMAIL_FALLBACKS = new Set(["admin@malafaareh.com", "admin@malafaareh"]);

    async function refreshSession() {
      try {
        const auth = await import("@/lib/firebaseClient").then((m) => m.getFirebaseAuth());
        const user = auth.currentUser;
        if (!user) {
          if (cancelled) return;
          setLoggedIn(false);
          setIsAdmin(false);
          return;
        }

        if (cancelled) return;
        setLoggedIn(true);

        const email = String(user.email || "").toLowerCase();
        const isAdminByEmail = ADMIN_EMAIL_FALLBACKS.has(email);
        const idToken = await user.getIdToken();
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          headers: {
            accept: "application/json",
            ...(idToken ? { authorization: `Bearer ${idToken}` } : {}),
          },
        });
        if (!res.ok) {
          if (cancelled) return;
          setIsAdmin(isAdminByEmail);
          return;
        }
        const data = (await res.json()) as { role?: string };
        if (cancelled) return;
        setIsAdmin(data?.role === "admin" || isAdminByEmail);
      } catch {
        if (cancelled) return;
        // If the backend check fails but Firebase is signed in, keep a best-effort UI.
        try {
          const auth = await import("@/lib/firebaseClient").then((m) => m.getFirebaseAuth());
          const user = auth.currentUser;
          const email = String(user?.email || "").toLowerCase();
          setLoggedIn(Boolean(user));
          setIsAdmin(ADMIN_EMAIL_FALLBACKS.has(email));
        } catch {
          setLoggedIn(false);
          setIsAdmin(false);
        }
      }
    }

    void refreshSession();
    const unsub = subscribeToAuthState(() => {
      void refreshSession();
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const headerClassName = cn(
    "sticky top-0 z-50 transition-colors duration-200 ease-premium",
    scrolled
      ? "border-b border-white/10 bg-[color:color-mix(in_srgb,var(--header-navy)_55%,transparent)] text-[var(--header-gold)] backdrop-blur"
      : "border-b border-white/10 bg-[var(--header-navy)] text-[var(--header-gold)]"
  );

  const navLinkClassName = (active: boolean) =>
    cn(
      "text-sm font-semibold transition duration-150 ease-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
      scrolled
        ? cn("text-[var(--header-gold)] hover:text-[var(--header-gold)]", active && "text-[var(--header-gold)]")
        : cn("text-[var(--header-gold)] hover:text-[var(--header-gold)]", active && "text-[var(--header-gold)]")
    );

  const actionClassName = cn(
    "inline-flex items-center justify-center rounded-card border-2 p-2.5 transition duration-150 ease-premium hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
    scrolled
      ? "border-white/15 bg-white/10 text-[var(--header-gold)] shadow-soft"
      : "border-white/15 bg-white/10 text-[var(--header-gold)] shadow-soft"
  );

  return (
    <header className={headerClassName}>
      <div className="mx-auto flex h-16 max-w-content items-center gap-6 px-6 md:px-8">
        <Link
          href="/"
          className={cn(
            "inline-flex items-center gap-3 font-serif text-xl font-semibold tracking-tight-luxe-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
            scrolled ? "text-[var(--header-gold)]" : "text-[var(--header-gold)]"
          )}
        >
          <span
            className="relative inline-flex h-9 w-9 shrink-0"
          >
            <Image
              src="/logo.png"
              alt="Logo Malafaareh"
              fill
              sizes="36px"
              className="object-contain"
              priority
            />
          </span>
          <span>Malafaareh</span>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          {nav.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={navLinkClassName(active)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {loggedIn ? (
            <button
              type="button"
              onClick={() => void logoutEverywhere()}
              className={cn(actionClassName, "px-3")}
              aria-label="Déconnexion"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.12em]">Déconnexion</span>
            </button>
          ) : null}

          {isAdmin ? (
            <Link
              href="/admin"
              className={cn(actionClassName, "px-3")}
              aria-label="Admin"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.12em]">Admin</span>
            </Link>
          ) : null}

          <Link
            href="/favorites"
            className={cn("relative", actionClassName)}
            aria-label="Favoris"
          >
            <IconHeart className="h-6 w-6" />
            {favoritesCount > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-xs text-bg-surface">
                {favoritesCount}
              </span>
            ) : null}
          </Link>

          <Link
            href="/orders"
            className={actionClassName}
            aria-label="Commandes"
          >
            <IconReceipt className="h-6 w-6" />
          </Link>

          <Link
            href="/account"
            className={actionClassName}
            aria-label="Compte"
          >
            <IconUser className="h-6 w-6" />
          </Link>

          <button
            type="button"
            onClick={openCart}
            className={cn("relative", actionClassName)}
            aria-label="Panier"
          >
            <span className={cn("inline-flex", cartPulse && "scale-[1.10]", "transition-transform duration-200 ease-premium")}
              aria-hidden
            >
              <IconBag className="h-6 w-6" />
            </span>
            {itemCount > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-xs text-bg-surface">
                {itemCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </header>
  );
}
