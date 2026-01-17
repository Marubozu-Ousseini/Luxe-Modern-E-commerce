import { HeroImage } from "@/components/layout/HeroImage";

export default function JournalPage() {
  return (
    <div className="pb-16">
      <div className="mt-10 rounded-modal border border-border-soft bg-bg-surface p-10 shadow-soft">
        <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Journal</p>
        <h1 className="mt-4 font-serif text-4xl tracking-tight-luxe">Notes de l’Atelier</h1>
        <p className="mt-5 max-w-2xl text-sm leading-6 text-text-muted">
          Un rythme discret de savoir-faire, d’entretien et de choix saisonniers.
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-modal border border-border-soft bg-bg-surface shadow-soft">
        <div className="relative aspect-[21/9] bg-bg-subtle">
          <HeroImage pageKey="journal" alt="Image héro – Journal" title="Journal" subtitle="Notes de l’Atelier" />
        </div>
      </div>
    </div>
  );
}
