"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

function formatCountdown(totalSeconds: number) {
  const minutes = Math.max(0, Math.floor(totalSeconds / 60));
  const seconds = Math.max(0, totalSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function PromoOverlay() {
  const router = useRouter();
  const initialSeconds = 10 * 60;
  const [open, setOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  const deadline = useMemo(() => Date.now() + initialSeconds * 1000, []);

  useEffect(() => {
    // Check if promo has been shown before
    try {
      const promoShown = localStorage.getItem("malafaareh_promo_shown");
      if (promoShown === "1") {
        return; // Don't show if already displayed
      }
    } catch {
      // ignore
    }

    const showId = window.setTimeout(() => {
      setOpen(true);
      // Mark promo as shown
      try {
        localStorage.setItem("malafaareh_promo_shown", "1");
      } catch {
        // ignore
      }
    }, 1500);
    return () => window.clearTimeout(showId);
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => {
      const remaining = Math.ceil((deadline - Date.now()) / 1000);
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        setOpen(false);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [deadline, open]);

  const countdown = formatCountdown(secondsLeft);

  function onActivate() {
    let registered = false;
    try {
      registered = localStorage.getItem("malafaareh_registered") === "1";
    } catch {
      registered = false;
    }

    if (!registered) {
      setOpen(false);
      router.push("/register");
      return;
    }

    setOpen(false);
  }

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="10% OFF" eyebrow="PROMO">
      <div className="space-y-4">
        <p className="text-base font-black uppercase tracking-[0.18em] text-text-primary animate-pulse">
          DÉPÊCHEZ-VOUS !
        </p>

        <div className="rounded-card border-2 border-border-soft bg-bg-subtle p-4">
          <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-text-primary">
            Offre -10% (temps limité)
          </p>
          <p className="mt-2 text-sm font-bold text-text-primary">
            Fin dans <span className="animate-pulse">{countdown}</span>
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            className="w-full bg-[var(--header-gold)] text-[var(--header-navy)] shadow-soft hover:scale-[1.03]"
            onClick={onActivate}
          >
            Activer -10%
          </Button>

          <Link
            href="/shop"
            className="inline-flex w-full items-center justify-center rounded-card border-2 border-border-soft bg-bg-surface px-5 py-3 text-sm font-extrabold uppercase tracking-[0.14em] text-text-primary shadow-soft transition duration-150 ease-premium hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            onClick={() => setOpen(false)}
          >
            Voir la boutique
          </Link>
        </div>

      </div>
    </Modal>
  );
}
