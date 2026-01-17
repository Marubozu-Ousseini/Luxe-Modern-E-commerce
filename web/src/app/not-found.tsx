import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20">
      <p className="text-sm text-text-muted">Introuvable</p>
      <h1 className="mt-3 font-serif text-3xl tracking-tight-luxe">Cette page n’existe pas</h1>
      <p className="mt-3 max-w-lg text-text-muted">
        Retournez à la sélection curatée et poursuivez votre exploration.
      </p>
      <div className="mt-8">
        <Link
          className="inline-flex rounded-card border border-border-soft bg-bg-surface px-5 py-3 text-sm shadow-soft transition duration-200 ease-premium hover:translate-y-[-1px] hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          href="/"
        >
          Retour à l’accueil
        </Link>
      </div>
    </div>
  );
}
