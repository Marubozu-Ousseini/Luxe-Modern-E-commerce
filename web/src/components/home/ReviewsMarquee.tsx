type Review = {
  quote: string;
  name: string;
  meta: string;
};

const reviews: Review[] = [
  {
    quote: "« Très belle qualité. La coupe tombe parfaitement et l’emballage est impeccable. »",
    name: "Aïcha",
    meta: "Douala",
  },
  {
    quote: "« Livraison rapide, service clair. Les matières sont vraiment premium, sans excès. »",
    name: "Hugo",
    meta: "Yaoundé",
  },
  {
    quote: "« Mon parfum est devenu un rituel. Sillage discret, mais présent — exactement ce que je voulais. »",
    name: "Mariam",
    meta: "Bafoussam",
  },
  {
    quote: "« La paire de chaussures est confortable dès le premier jour. Ligne minimaliste, très chic. »",
    name: "Kévin",
    meta: "Garoua",
  },
  {
    quote: "« Une expérience douce du début à la fin. On sent une vraie attention au détail. »",
    name: "Nadia",
    meta: "Bamenda",
  },
  {
    quote: "« La montre est sobre et lisible. Elle va avec tout, sans jamais “crier”. »",
    name: "Jean",
    meta: "Maroua",
  },
];

export function ReviewsMarquee() {
  const track = [...reviews, ...reviews];

  return (
    <section>
      <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Avis clients</p>

      <div className="mt-5 overflow-hidden rounded-modal border border-border-soft bg-bg-surface shadow-soft">
        <div
          className="flex w-[200%] gap-4 px-4 py-5 [animation:reviews-marquee_32s_linear_infinite] motion-reduce:animate-none"
          style={{ willChange: "transform" }}
          aria-label="Avis clients défilants"
        >
          {track.map((review, idx) => (
            <figure
              key={`${review.name}-${idx}`}
              className="w-[18rem] shrink-0 rounded-card border border-border-soft bg-bg-subtle p-4"
            >
              <blockquote className="text-sm text-text-primary">{review.quote}</blockquote>
              <figcaption className="mt-3 text-xs text-text-muted">
                {review.name} · {review.meta}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
