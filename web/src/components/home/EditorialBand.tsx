export function EditorialBand() {
  return (
    <section className="rounded-modal border border-border-soft bg-bg-surface p-8 shadow-soft md:p-12">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-center">
        <div className="md:col-span-5">
          <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Nos matières</p>
          <h2 className="mt-4 font-serif text-3xl tracking-tight-luxe">
            Le savoir-faire est le message
          </h2>
          <p className="mt-4 text-sm leading-6 text-text-muted">
            Nous choisissons les tissus pour la main, le tombé et la tenue dans le temps.
            Chaque couture et chaque finition sont pensées — des détails discrets qui deviennent votre quotidien.
          </p>
        </div>
        <div className="md:col-span-7">
          <div className="grid grid-cols-3 gap-4">
            {[
              "Tombé",
              "Texture",
              "Finition",
              "Poids",
              "Main",
              "Entretien",
            ].map((label) => (
              <div
                key={label}
                className="aspect-[4/5] rounded-card border border-border-soft bg-bg-subtle p-4"
              >
                <p className="text-xs text-text-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
