import { HeroImage } from "@/components/layout/HeroImage";

export default function StoryPage() {
  return (
    <div className="pb-16">
      <div className="mt-10 rounded-modal border border-border-soft bg-bg-surface p-10 shadow-soft">
        <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Histoire</p>
        <h1 className="mt-4 font-serif text-4xl tracking-tight-luxe">Pensé pour vous</h1>
        <p className="mt-5 max-w-2xl text-sm leading-6 text-text-muted">
          Nous construisons le désir par la retenue : des éditions curatées, des matières tactiles,
          et des détails qui résistent à l’examen de près.
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-modal border border-border-soft bg-bg-surface shadow-soft">
        <div className="relative aspect-[21/9] bg-bg-subtle">
          <HeroImage pageKey="story" alt="Image héro – Histoire" title="Histoire" subtitle="Pensé pour vous" />
        </div>
      </div>
    </div>
  );
}
