export default function AdminAdsPage() {
  return (
    <div className="pb-16">
      <div className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Marketing</p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight-luxe">Publicités</h1>
        <p className="mt-3 text-sm text-text-muted">
          Gérez les emplacements publicitaires (image / texte / vidéo).
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="lg:col-span-7">
          <div className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Emplacements</p>
            <p className="mt-2 font-serif text-2xl tracking-tight-luxe-sm">Où ça s’affiche</p>

            <div className="mt-4 space-y-3">
              {[
                { title: "Home", desc: "Section Publicités (3 cartes)." },
                { title: "Shop", desc: "Bannière inline sous les filtres." },
                { title: "Catégorie", desc: "Bannière inline sous l’image héro." },
              ].map((i) => (
                <div key={i.title} className="rounded-card border border-border-soft bg-bg-subtle p-4">
                  <p className="text-sm font-medium text-text-primary">{i.title}</p>
                  <p className="mt-1 text-sm text-text-muted">{i.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-modal border border-border-soft bg-bg-surface shadow-soft">
            <div className="border-b border-border-soft px-6 py-4">
              <p className="text-sm font-medium text-text-primary">Créations (exemples)</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {[
                  { kind: "Image", title: "Collection partenaire" },
                  { kind: "Texte", title: "Offre de bienvenue" },
                  { kind: "Vidéo", title: "Vidéo courte" },
                  { kind: "Bannière", title: "Annonce — format bannière" },
                ].map((c) => (
                  <div key={c.title} className="rounded-card border border-border-soft bg-bg-subtle p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-text-muted">{c.kind}</p>
                    <p className="mt-2 text-sm font-medium text-text-primary">{c.title}</p>
                    <p className="mt-1 text-sm text-text-muted">Statut: brouillon</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <aside className="lg:col-span-5">
          <div className="rounded-modal border border-border-soft bg-bg-surface p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Créer</p>
            <p className="mt-2 font-serif text-2xl tracking-tight-luxe-sm">Nouvelle annonce</p>
            <p className="mt-2 text-sm text-text-muted">Paramétrez une annonce.</p>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs uppercase tracking-[0.12em] text-text-muted">Type</span>
                <select className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
                  <option>Image</option>
                  <option>Texte</option>
                  <option>Vidéo</option>
                  <option>Bannière</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-[0.12em] text-text-muted">Titre</span>
                <input className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40" />
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-[0.12em] text-text-muted">Texte</span>
                <textarea className="mt-2 min-h-28 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40" />
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-[0.12em] text-text-muted">URL (CTA)</span>
                <input className="mt-2 w-full rounded-card border border-border-soft bg-bg-surface px-4 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40" placeholder="/shop" />
              </label>

              <button
                type="button"
                className="mt-2 inline-flex w-full items-center justify-center rounded-card bg-accent px-5 py-3 text-sm font-medium text-bg-surface shadow-soft transition duration-150 ease-premium hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
