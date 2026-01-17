import Link from "next/link";

const tiles = [
  {
    href: "/categories/vetements",
    title: "Vêtements",
    description: "Silhouettes calmes, pensées pour durer.",
  },
  {
    href: "/categories/parfums-et-cosmetiques",
    title: "Parfums et Cosmétiques",
    description: "Sillage discret, gestes de soin.",
  },
  {
    href: "/categories/chaussures",
    title: "Chaussures",
    description: "Un ancrage précis. Confort silencieux.",
  },
  {
    href: "/categories/montres",
    title: "Montres",
    description: "Le temps, sculpté et serein.",
  },
  {
    href: "/categories/accessoires",
    title: "Accessoires",
    description: "Détails choisis, utilité raffinée.",
  },
];

export function GuidedTiles() {
  return (
    <section>
      <h2 className="font-serif text-2xl tracking-tight-luxe">Catégories</h2>
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3 lg:grid-cols-5">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="group rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft transition duration-200 ease-premium hover:translate-y-[-2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Sélection</p>
            <p className="mt-3 font-serif text-xl tracking-tight-luxe-sm">{tile.title}</p>
            <p className="mt-2 text-sm text-text-muted">{tile.description}</p>
            <p className="mt-6 text-sm text-text-primary">
              Explorer la catégorie <span className="transition duration-200 ease-premium group-hover:translate-x-0.5">→</span>
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
