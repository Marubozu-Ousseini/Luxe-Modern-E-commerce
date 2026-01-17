import { PROMO_PERCENT_OFF } from "@/lib/promo";

export default function AdminPromotionsPage() {
  return (
    <div className="pb-16">
      <div className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Campagnes</p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight-luxe">Promotions</h1>
        <p className="mt-3 text-sm text-text-muted">
          Paramètres de promotion. Les prix affichés utilisent actuellement une remise globale.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Statut</p>
          <p className="mt-2 font-serif text-2xl tracking-tight-luxe-sm">Promo active</p>
          <p className="mt-2 text-sm text-text-muted">
            Remise globale actuelle : <span className="font-semibold text-text-primary">{PROMO_PERCENT_OFF}%</span>
          </p>

          <div className="mt-4 rounded-card border border-border-soft bg-bg-subtle p-4">
            <p className="text-sm font-medium text-text-primary">Recommandation</p>
            <p className="mt-1 text-sm text-text-muted">
              Stabiliser la durée (ex: 7 jours) et limiter la fréquence des popups pour éviter la fatigue.
            </p>
          </div>
        </section>

        <section className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Édition</p>
          <p className="mt-2 font-serif text-2xl tracking-tight-luxe-sm">Modifier</p>
          <p className="mt-2 text-sm text-text-muted">Ajustez les paramètres de promotion.</p>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.12em] text-text-muted">Pourcentage</span>
              <input
                inputMode="numeric"
                defaultValue={PROMO_PERCENT_OFF}
                className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              />
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.12em] text-text-muted">Fin (date)</span>
              <input
                placeholder="Ex: 2026-01-31"
                className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              />
            </label>

            <button
              type="button"
              className="mt-2 inline-flex w-full items-center justify-center rounded-card bg-accent px-5 py-3 text-sm font-medium text-bg-surface shadow-soft transition duration-150 ease-premium hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              Enregistrer
            </button>
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Texte</p>
        <p className="mt-2 font-serif text-2xl tracking-tight-luxe-sm">Messages promo</p>
        <p className="mt-2 text-sm text-text-muted">
          Vérifiez la cohérence entre Home, cartes produit, panier et checkout.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { label: "Badge", value: "-10% OFF" },
            { label: "Gain", value: "Gagnez" },
            { label: "CTA", value: "Explorer la collection" },
          ].map((i) => (
            <div key={i.label} className="rounded-card border border-border-soft bg-bg-subtle p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-text-muted">{i.label}</p>
              <p className="mt-2 text-sm font-medium text-text-primary">{i.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
