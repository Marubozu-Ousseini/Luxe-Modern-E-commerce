"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { AUTH_CHANGED_EVENT, isLoggedIn, logoutEverywhere } from "@/lib/session";

const nav = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/products", label: "Produits" },
  { href: "/admin/orders", label: "Commandes" },
  { href: "/admin/promotions", label: "Promotions" },
  { href: "/admin/ads", label: "Publicités" },
  { href: "/admin/comptabilite", label: "Comptabilité" },
  { href: "/admin/settings", label: "Réglages" },
];

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const update = () => setLoggedIn(isLoggedIn());
    update();
    window.addEventListener(AUTH_CHANGED_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return (
    <div className="min-h-dvh bg-bg-subtle">
      <div className="mx-auto grid w-full max-w-content grid-cols-1 gap-6 px-6 py-6 md:px-8 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="rounded-modal border border-border-soft bg-bg-surface p-5 shadow-soft">
            <Link
              href="/"
              className="inline-flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              aria-label="Retour au site Malafaareh"
            >
              <span className="relative inline-flex h-9 w-9 shrink-0">
                <Image
                  src="/logo.png"
                  alt="Logo Malafaareh"
                  fill
                  sizes="36px"
                  className="object-contain"
                />
              </span>
              <div>
                <p className="font-serif text-lg tracking-tight-luxe-sm text-text-primary">Malafaareh</p>
                <p className="text-xs text-text-muted">Espace admin</p>
              </div>
            </Link>

            <nav className="mt-5 flex flex-wrap gap-2 lg:flex-col">
              {nav.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-card border border-border-soft px-4 py-2 text-sm transition duration-150 ease-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
                      active
                        ? "bg-accent text-bg-surface"
                        : "bg-bg-surface text-text-primary hover:translate-y-[-1px]"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <p className="mt-5 text-xs text-text-muted">Accès sécurisé — réservé à l’équipe.</p>
          </div>
        </aside>

        <div className="lg:col-span-9">
          <header className="rounded-modal border border-border-soft bg-bg-surface p-5 shadow-soft">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Administration</p>
                <p className="mt-1 text-sm text-text-muted">Gérez produits, commandes, promos et placements.</p>
              </div>
              <Link
                href="/"
                className="text-sm text-text-primary underline decoration-border-soft underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                Voir le site
              </Link>

              {loggedIn ? (
                <button
                  type="button"
                  onClick={() => void logoutEverywhere()}
                  className="text-sm text-text-primary underline decoration-border-soft underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  Logout
                </button>
              ) : null}
            </div>
          </header>

          <main className="mt-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
