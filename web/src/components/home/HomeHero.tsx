"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { heroImagesStorageKey } from "@/components/layout/HeroImage";

type HeroImages = Record<string, string[]>;

function heroSvg(title: string, subtitle: string, accentA: string, accentB: string) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FAF8F5"/>
      <stop offset="1" stop-color="#F2EEE8"/>
    </linearGradient>
    <radialGradient id="a" cx="20%" cy="18%" r="65%">
      <stop offset="0" stop-color="${accentA}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="${accentA}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="b" cx="82%" cy="74%" r="72%">
      <stop offset="0" stop-color="${accentB}" stop-opacity="0.18"/>
      <stop offset="1" stop-color="${accentB}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#bg)"/>
  <rect width="1600" height="900" fill="url(#a)"/>
  <rect width="1600" height="900" fill="url(#b)"/>
  <g fill="#1C1C1C" fill-opacity="0.92">
    <text x="120" y="420" font-family="Georgia, 'Times New Roman', serif" font-size="92" letter-spacing="-1">${title}</text>
    <text x="120" y="500" font-family="system-ui, -apple-system, Segoe UI, Roboto" font-size="32" opacity="0.72">${subtitle}</text>
  </g>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function safeParseHeroImages(value: string | null): HeroImages {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: HeroImages = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "string") {
        out[k] = [v];
        continue;
      }
      if (Array.isArray(v)) {
        const imgs = v.filter((x): x is string => typeof x === "string" && x.length > 0);
        if (imgs.length > 0) out[k] = imgs;
      }
    }
    return out;
  } catch {
    return {};
  }
}

async function fetchHeroImagesFromServer(): Promise<HeroImages> {
  const res = await fetch("/api/hero-images", { headers: { accept: "application/json" }, cache: "no-store" });
  if (!res.ok) return {};
  const data = (await res.json()) as unknown;
  if (!data || typeof data !== "object") return {};
  const out: HeroImages = {};
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (typeof v === "string") {
      out[k] = [v];
      continue;
    }
    if (Array.isArray(v)) {
      const imgs = v.filter((x): x is string => typeof x === "string" && x.length > 0);
      if (imgs.length > 0) out[k] = imgs;
    }
  }
  return out;
}

export function HomeHero() {
  const slides = useMemo(
    () => [
      heroSvg("Malafaareh", "Édition exclusive", "#0F3D3E", "#1C1C1C"),
      heroSvg("Malafaareh", "Matières durables", "#8A7E72", "#0F3D3E"),
      heroSvg("Malafaareh", "Silence & texture", "#1C1C1C", "#8A7E72"),
      heroSvg("Malafaareh", "Gestes essentiels", "#0F3D3E", "#8A7E72"),
    ],
    []
  );

  const [override, setOverride] = useState<string[] | null>(null);
  const [serverOverride, setServerOverride] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const server = await fetchHeroImagesFromServer();
        const next = (server.home ?? []).filter((x) => typeof x === "string" && x.length > 0);
        if (!cancelled && next.length > 0) {
          setServerOverride(next);
          setIndex(0);
          return;
        }
      } catch {
        // ignore
      }

      try {
        const map = safeParseHeroImages(localStorage.getItem(heroImagesStorageKey));
        const v = map.home;
        const imgs = (v ?? []).filter((x) => x.startsWith("data:image/"));
        if (!cancelled && imgs.length > 0) {
          setOverride(imgs);
          setIndex(0);
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const effectiveSlides = useMemo(() => {
    if (serverOverride && serverOverride.length > 0) return serverOverride;
    if (override && override.length > 0) return override;
    return slides;
  }, [override, serverOverride, slides]);

  useEffect(() => {
    if (effectiveSlides.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % effectiveSlides.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [effectiveSlides.length]);

  function goPrev() {
    if (effectiveSlides.length <= 1) return;
    setIndex((i) => (i - 1 + effectiveSlides.length) % effectiveSlides.length);
  }

  function goNext() {
    if (effectiveSlides.length <= 1) return;
    setIndex((i) => (i + 1) % effectiveSlides.length);
  }

  return (
    <section className="relative mx-auto mt-6 w-full overflow-hidden rounded-modal bg-bg-surface shadow-soft">
      <div className="absolute inset-0">
        <div className="h-full w-full overflow-hidden">
          <div
            className={cn(
              "flex h-full w-full transition-transform duration-700 ease-premium motion-reduce:transition-none",
              "motion-reduce:translate-x-0"
            )}
            style={{ transform: "translateX(-" + index * 100 + "%)" }}
            aria-hidden
          >
            {effectiveSlides.map((src) => (
              <div key={src} className="h-full w-full shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-3 md:px-5">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Image précédente"
            disabled={effectiveSlides.length <= 1}
            className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-card border-2 border-white/15 bg-white/10 text-[var(--header-gold)] shadow-soft backdrop-blur transition duration-150 ease-premium hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <span className="text-lg font-semibold" aria-hidden>
              ←
            </span>
          </button>

          <button
            type="button"
            onClick={goNext}
            aria-label="Image suivante"
            disabled={effectiveSlides.length <= 1}
            className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-card border-2 border-white/15 bg-white/10 text-[var(--header-gold)] shadow-soft backdrop-blur transition duration-150 ease-premium hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <span className="text-lg font-semibold" aria-hidden>
              →
            </span>
          </button>
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_20%_10%,rgba(15,61,62,0.10),transparent_55%),radial-gradient(900px_500px_at_80%_70%,rgba(0,0,0,0.06),transparent_60%)]" />
      </div>

      <div className="relative px-6 py-16 md:px-12 md:py-24">
        <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Édition exclusive</p>
        <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-[1.1] tracking-tight-luxe md:text-6xl">
          Le luxe qui murmure, la beauté.... Une présence qui reste.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-text-muted">
          Une sélection curatée, guidée par le savoir-faire, la texture et une certitude tranquille.
        </p>
        <div className="mt-10">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-card bg-accent px-6 py-3 text-sm font-medium text-bg-surface shadow-soft transition duration-150 ease-premium hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 motion-reduce:transform-none"
          >
            Explorer la collection
          </Link>
        </div>
      </div>
    </section>
  );
}
