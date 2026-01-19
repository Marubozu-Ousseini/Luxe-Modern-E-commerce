"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  cacheAds,
  fetchAdsFromServer,
  getCachedAds,
  type AdConfig,
  type AdPlacementKey,
} from "@/lib/ads";

function normalizeAdHref(rawHref: string): { href: string; isExternal: boolean } {
  const trimmed = String(rawHref || "").trim();
  if (!trimmed) return { href: "/shop", isExternal: false };
  if (/^https?:\/\//i.test(trimmed)) return { href: trimmed, isExternal: true };

  // If the admin entered a bare domain like "www.example.com" or "example.com",
  // browsers treat it as a relative path. Normalize to an absolute https URL.
  const looksLikeDomain =
    /^www\./i.test(trimmed) || /^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(trimmed);
  if (looksLikeDomain) return { href: `https://${trimmed.replace(/^\/+/, "")}`, isExternal: true };

  return { href: trimmed, isExternal: false };
}

function useAdsData() {
  const [ads, setAds] = useState<AdConfig[]>(() => {
    try {
      return getCachedAds();
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let cancelled = false;
    fetchAdsFromServer()
      .then((list) => {
        if (cancelled) return;
        setAds(list);
        cacheAds(list);
      })
      .catch(() => {
        // Keep cached data.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return ads;
}

function PlaceholderMedia() {
  return (
    <div
      className="relative overflow-hidden rounded-card border border-border-soft bg-bg-subtle"
      aria-hidden
      style={{
        background:
          "radial-gradient(80% 80% at 20% 20%, rgba(0,0,0,0.10), rgba(0,0,0,0)), radial-gradient(70% 70% at 75% 75%, rgba(0,0,0,0.10), rgba(0,0,0,0))",
      }}
    >
      <div className="aspect-[16/9]" />
    </div>
  );
}

function AdMedia({ ad }: { ad: AdConfig }) {
  if (ad.kind === "text") return null;
  if (!ad.mediaUrl) return <PlaceholderMedia />;

  if (ad.kind === "video") {
    return (
      <div className="relative overflow-hidden rounded-card border border-border-soft bg-bg-subtle">
        <video
          className="aspect-[16/9] w-full object-cover"
          src={ad.mediaUrl}
          preload="metadata"
          controls
          playsInline
        />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-card border border-border-soft bg-bg-subtle">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="aspect-[16/9] w-full object-cover" src={ad.mediaUrl} alt={ad.title} loading="lazy" />
    </div>
  );
}

export function AdPlacements({
  title = "Publicités",
  placementKey = "home",
}: {
  title?: string;
  placementKey?: AdPlacementKey;
}) {
  const ads = useAdsData();
  const placements = useMemo(() => {
    return ads.filter((a) => Array.isArray(a.placements) && a.placements.includes(placementKey)).slice(0, 3);
  }, [ads, placementKey]);

  if (placements.length === 0) return null;

  return (
    <section>
      <p className="text-xs uppercase tracking-[0.12em] text-text-muted">{title}</p>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {placements.map((ad) => {
          const { href, isExternal } = normalizeAdHref(ad.href);
          const className =
            "group rounded-modal border border-border-soft bg-bg-surface p-5 shadow-soft transition duration-200 ease-premium hover:translate-y-[-2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";
          const inner = (
            <>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-text-muted">{ad.eyebrow || "Annonce"}</p>

              {ad.kind === "text" ? null : (
                <div className="mt-4">
                  <AdMedia ad={ad} />
                </div>
              )}

              <p className="mt-4 font-serif text-xl tracking-tight-luxe-sm text-text-primary">{ad.title}</p>
              <p className="mt-2 text-sm leading-6 text-text-muted">{ad.body}</p>

              <p className="mt-5 text-sm font-medium text-text-primary">
                {ad.ctaLabel}{" "}
                <span className="transition duration-200 ease-premium group-hover:translate-x-0.5">→</span>
              </p>
            </>
          );

          return isExternal ? (
            <a
              key={`${ad.kind}-${ad.title}`}
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`${ad.title} — ${ad.ctaLabel}`}
              className={className}
            >
              {inner}
            </a>
          ) : (
            <Link key={`${ad.kind}-${ad.title}`} href={href} aria-label={`${ad.title} — ${ad.ctaLabel}`} className={className}>
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function InlineAdBanner({
  placementKey,
  eyebrow,
  title,
  body,
  ctaLabel,
  href,
}: {
  placementKey?: Exclude<AdPlacementKey, "home">;
  eyebrow?: string;
  title?: string;
  body?: string;
  ctaLabel?: string;
  href?: string;
}) {
  const ads = useAdsData();

  const derived = useMemo(() => {
    if (!placementKey) return null;
    return ads.find((a) => Array.isArray(a.placements) && a.placements.includes(placementKey)) || null;
  }, [ads, placementKey]);

  const finalEyebrow = derived?.eyebrow || eyebrow || "Annonce";
  const finalTitle = derived?.title || title || "Espace publicité";
  const finalBody = derived?.body || body || "Bannière horizontale (image + texte).";
  const finalCta = derived?.ctaLabel || ctaLabel || "En savoir plus";
  const finalHref = derived?.href || href || "/shop";
  const mediaUrl = derived?.mediaUrl;
  const kind = derived?.kind;

  if (placementKey && !derived) return null;

  const { href: resolvedHref, isExternal } = normalizeAdHref(finalHref);
  const wrapperClassName =
    "group block overflow-hidden rounded-modal border border-border-soft bg-bg-surface shadow-soft transition duration-200 ease-premium hover:translate-y-[-2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

  const content = (
    <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-12 md:items-center">
        <div className="md:col-span-5">
          {kind === "video" && mediaUrl ? (
            <div className="relative overflow-hidden rounded-card border border-border-soft bg-bg-subtle">
              <video
                className="aspect-[16/9] w-full object-cover"
                src={mediaUrl}
                preload="metadata"
                muted
                playsInline
                controls
              />
            </div>
          ) : kind === "image" && mediaUrl ? (
            <div className="relative overflow-hidden rounded-card border border-border-soft bg-bg-subtle">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="aspect-[16/9] w-full object-cover" src={mediaUrl} alt={finalTitle} loading="lazy" />
            </div>
          ) : (
            <div
              className="aspect-[16/9] rounded-card border border-border-soft bg-bg-subtle"
              aria-hidden
              style={{
                background:
                  "radial-gradient(80% 80% at 20% 20%, rgba(0,0,0,0.10), rgba(0,0,0,0)), radial-gradient(70% 70% at 75% 75%, rgba(0,0,0,0.10), rgba(0,0,0,0))",
              }}
            />
          )}
        </div>

        <div className="md:col-span-7">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-text-muted">{finalEyebrow}</p>
          <p className="mt-2 font-serif text-2xl tracking-tight-luxe-sm text-text-primary">{finalTitle}</p>
          <p className="mt-2 text-sm leading-6 text-text-muted">{finalBody}</p>
          <p className="mt-4 text-sm font-medium text-text-primary">
            {finalCta}{" "}
            <span className="transition duration-200 ease-premium group-hover:translate-x-0.5">→</span>
          </p>
        </div>
      </div>
  );

  return isExternal ? (
    <a
      href={resolvedHref}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`${finalTitle} — ${finalCta}`}
      className={wrapperClassName}
    >
      {content}
    </a>
  ) : (
    <Link href={resolvedHref} aria-label={`${finalTitle} — ${finalCta}`} className={wrapperClassName}>
      {content}
    </Link>
  );
}
