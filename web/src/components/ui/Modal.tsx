"use client";

import { useEffect } from "react";
import { cn } from "@/lib/cn";

export function Modal({
  open,
  onClose,
  title,
  eyebrow = "Guide",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] transition duration-200 ease-premium",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/20 transition duration-200 ease-premium",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute left-1/2 top-1/2 w-[min(520px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft transition duration-250 ease-premium",
          open ? "scale-100 opacity-100" : "scale-[0.98] opacity-0"
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-text-muted">{eyebrow}</p>
            <h3 className="mt-2 font-serif text-2xl tracking-tight-luxe-sm">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-card border border-border-soft bg-bg-subtle px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            Fermer
          </button>
        </div>
        <div className="mt-5 text-sm leading-6 text-text-muted">{children}</div>
      </div>
    </div>
  );
}
