"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";

const HERO_IMAGES_KEY = "malafaareh_admin_hero_images";

type HeroImages = Record<string, string[]>;

function safeParseHeroImages(value: string | null): HeroImages {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: HeroImages = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "string" && v.startsWith("data:image/")) {
        out[k] = [v];
        continue;
      }

      if (Array.isArray(v)) {
        const imgs = v.filter((x): x is string => typeof x === "string" && x.startsWith("data:image/"));
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

function placeholderSvg(title?: string, subtitle?: string) {
  const t = title?.trim() ? title.trim() : "Malafaareh";
  const s = subtitle?.trim() ? subtitle.trim() : "Image héro";

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="686" viewBox="0 0 1600 686">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FAF8F5"/>
      <stop offset="1" stop-color="#F2EEE8"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="686" fill="url(#bg)"/>
  <g opacity="0.18" stroke="#1C1C1C">
    <path d="M0 110 H1600"/>
    <path d="M0 240 H1600"/>
    <path d="M0 370 H1600"/>
    <path d="M0 500 H1600"/>
    <path d="M0 630 H1600"/>
  </g>
  <text x="64" y="560" font-family="ui-serif, Georgia, serif" font-size="54" fill="#1C1C1C" opacity="0.92">${t}</text>
  <text x="64" y="610" font-family="ui-sans-serif, system-ui" font-size="18" fill="#1C1C1C" opacity="0.68">${s}</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function HeroImage({
  pageKey,
  alt,
  className,
  fallbackSrc,
  title,
  subtitle,
}: {
  pageKey: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  title?: string;
  subtitle?: string;
}) {
  const [images, setImages] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const server = await fetchHeroImagesFromServer();
        if (!cancelled && Object.keys(server).length > 0) {
          setImages(server[pageKey] ?? null);
          return;
        }
      } catch {
        // ignore
      }

      try {
        if (!cancelled) setImages(safeParseHeroImages(localStorage.getItem(HERO_IMAGES_KEY))[pageKey] ?? null);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pageKey]);

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [images]);

  useEffect(() => {
    setIndex(0);
  }, [pageKey, images?.length]);

  const finalSrc = useMemo(() => {
    if (images && images.length > 0) return images[Math.min(index, images.length - 1)] ?? images[0];
    if (fallbackSrc) return fallbackSrc;
    return placeholderSvg(title, subtitle);
  }, [fallbackSrc, images, index, subtitle, title]);

  const slides = useMemo(() => {
    if (images && images.length > 0) return images;
    return [finalSrc];
  }, [finalSrc, images]);

  function goPrev() {
    if (slides.length <= 1) return;
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }

  function goNext() {
    if (slides.length <= 1) return;
    setIndex((i) => (i + 1) % slides.length);
  }

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <div
        className={cn(
          "flex h-full w-full transition-transform duration-700 ease-premium motion-reduce:transition-none",
          "motion-reduce:translate-x-0"
        )}
        style={{ transform: "translateX(-" + Math.min(index, slides.length - 1) * 100 + "%)" }}
        aria-hidden
      >
        {slides.map((src) => (
          <div key={src} className="h-full w-full shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-3 md:px-5">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Image précédente"
          disabled={slides.length <= 1}
          className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-card border-2 border-white/15 bg-white/10 text-[var(--header-gold)] shadow-soft backdrop-blur transition duration-150 ease-premium hover:translate-y-[-1px] disabled:opacity-40 disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <span className="text-lg font-semibold" aria-hidden>
            ←
          </span>
        </button>

        <button
          type="button"
          onClick={goNext}
          aria-label="Image suivante"
          disabled={slides.length <= 1}
          className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-card border-2 border-white/15 bg-white/10 text-[var(--header-gold)] shadow-soft backdrop-blur transition duration-150 ease-premium hover:translate-y-[-1px] disabled:opacity-40 disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <span className="text-lg font-semibold" aria-hidden>
            →
          </span>
        </button>
      </div>

      <span className="sr-only">{alt}</span>
    </div>
  );
}

export const heroImagesStorageKey = HERO_IMAGES_KEY;
