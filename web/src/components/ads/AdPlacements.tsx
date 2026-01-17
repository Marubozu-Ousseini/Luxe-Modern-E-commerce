"use client";

import Link from "next/link";

type AdKind = "image" | "text" | "video";

export type AdPlacement = {
  kind: AdKind;
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  href: string;
};

const defaultPlacements: AdPlacement[] = [
  {
    kind: "image",
    eyebrow: "Annonce",
    title: "Collection partenaire",
    body: "Emplacement prévu pour une image (JPG/PNG/SVG) + un message court.",
    ctaLabel: "Découvrir",
    href: "/shop",
  },
  {
    kind: "text",
    eyebrow: "Annonce",
    title: "Offre de bienvenue",
    body: "Texte court pour un message rapide : nouveauté, livraison, avantage membre, ou lancement.",
    ctaLabel: "Voir l’offre",
    href: "/register",
  },
  {
    kind: "video",
    eyebrow: "Annonce",
    title: "Vidéo courte",
    body: "Emplacement prévu pour une vidéo (MP4/WebM) : routine, unboxing, focus matière.",
    ctaLabel: "Regarder",
    href: "/shop",
  },
];

function PlaceholderMedia({ kind }: { kind: Exclude<AdKind, "text"> }) {
  const background =
    kind === "image"
      ? "radial-gradient(80% 80% at 20% 20%, rgba(0,0,0,0.10), rgba(0,0,0,0)), radial-gradient(70% 70% at 75% 75%, rgba(0,0,0,0.10), rgba(0,0,0,0))"
      : "radial-gradient(70% 70% at 50% 45%, rgba(0,0,0,0.12), rgba(0,0,0,0))";

  return (
    <div
      className="relative overflow-hidden rounded-card border border-border-soft bg-bg-subtle"
      aria-hidden
      style={{ background }}
    >
      <div className="aspect-[16/9]" />

      {kind === "video" ? (
        <div className="absolute inset-0 grid place-items-center">
          <div className="grid place-items-center rounded-full border border-border-soft bg-bg-surface/80 p-3 shadow-soft">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-text-primary" aria-hidden>
              <path fill="currentColor" d="M9 7.5v9l8-4.5-8-4.5Z" />
            </svg>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AdPlacements({
  title = "Publicités",
  placements = defaultPlacements,
}: {
  title?: string;
  placements?: AdPlacement[];
}) {
  return (
    <section>
      <p className="text-xs uppercase tracking-[0.12em] text-text-muted">{title}</p>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {placements.map((ad) => (
          <Link
            key={`${ad.kind}-${ad.title}`}
            href={ad.href}
            aria-label={`${ad.title} — ${ad.ctaLabel}`}
            className="group rounded-modal border border-border-soft bg-bg-surface p-5 shadow-soft transition duration-200 ease-premium hover:translate-y-[-2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-text-muted">{ad.eyebrow}</p>

            {ad.kind === "text" ? null : (
              <div className="mt-4">
                <PlaceholderMedia kind={ad.kind} />
              </div>
            )}

            <p className="mt-4 font-serif text-xl tracking-tight-luxe-sm text-text-primary">{ad.title}</p>
            <p className="mt-2 text-sm leading-6 text-text-muted">{ad.body}</p>

            <p className="mt-5 text-sm font-medium text-text-primary">
              {ad.ctaLabel}{" "}
              <span className="transition duration-200 ease-premium group-hover:translate-x-0.5">→</span>
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function InlineAdBanner({
  eyebrow = "Annonce",
  title = "Espace publicité",
  body = "Bannière horizontale (image + texte).",
  ctaLabel = "En savoir plus",
  href = "/shop",
}: {
  eyebrow?: string;
  title?: string;
  body?: string;
  ctaLabel?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={`${title} — ${ctaLabel}`}
      className="group block overflow-hidden rounded-modal border border-border-soft bg-bg-surface shadow-soft transition duration-200 ease-premium hover:translate-y-[-2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-12 md:items-center">
        <div className="md:col-span-5">
          <div
            className="aspect-[16/9] rounded-card border border-border-soft bg-bg-subtle"
            aria-hidden
            style={{
              background:
                "radial-gradient(80% 80% at 20% 20%, rgba(0,0,0,0.10), rgba(0,0,0,0)), radial-gradient(70% 70% at 75% 75%, rgba(0,0,0,0.10), rgba(0,0,0,0))",
            }}
          />
        </div>

        <div className="md:col-span-7">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-text-muted">{eyebrow}</p>
          <p className="mt-2 font-serif text-2xl tracking-tight-luxe-sm text-text-primary">{title}</p>
          <p className="mt-2 text-sm leading-6 text-text-muted">{body}</p>
          <p className="mt-4 text-sm font-medium text-text-primary">
            {ctaLabel}{" "}
            <span className="transition duration-200 ease-premium group-hover:translate-x-0.5">→</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
