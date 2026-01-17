"use client";

import { useEffect, useState } from "react";

export function DeliveryBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-accent via-accent/90 to-accent">
      <div className="animate-marquee whitespace-nowrap py-2.5">
        <span className="mx-8 inline-flex items-center gap-2 text-sm font-medium text-bg-surface">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          Livraison gratuite pour les commandes de plus de 100 000 XAF à Douala uniquement
        </span>
        <span className="mx-8 inline-flex items-center gap-2 text-sm font-medium text-bg-surface">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          Livraison gratuite pour les commandes de plus de 100 000 XAF à Douala uniquement
        </span>
        <span className="mx-8 inline-flex items-center gap-2 text-sm font-medium text-bg-surface">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          Livraison gratuite pour les commandes de plus de 100 000 XAF à Douala uniquement
        </span>
        <span className="mx-8 inline-flex items-center gap-2 text-sm font-medium text-bg-surface">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          Livraison gratuite pour les commandes de plus de 100 000 XAF à Douala uniquement
        </span>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-bg-surface/20 p-1 text-bg-surface transition hover:bg-bg-surface/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bg-surface/40"
        aria-label="Fermer la bannière"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
