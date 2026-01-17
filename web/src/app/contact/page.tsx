import { HeroImage } from "@/components/layout/HeroImage";

export default function ContactPage() {
  return (
    <div className="pb-16">
      <div className="mt-10 rounded-modal border border-border-soft bg-bg-surface p-10 shadow-soft">
        <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Contact</p>
        <h1 className="mt-4 font-serif text-4xl tracking-tight-luxe">Service client</h1>
        <p className="mt-5 max-w-2xl text-sm leading-6 text-text-muted">
          Un support calme, des réponses claires. Partagez votre question, nous répondrons avec attention.
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-modal border border-border-soft bg-bg-surface shadow-soft">
        <div className="relative aspect-[21/9] bg-bg-subtle">
          <HeroImage pageKey="contact" alt="Image héro – Contact" title="Contact" subtitle="Service client" />
        </div>
      </div>
    </div>
  );
}
