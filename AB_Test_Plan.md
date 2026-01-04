# A/B Test & Rollout Plan — Priority Experiments

Objective: validate which UX changes increase conversions and AOV.

Experiment 1 — PDP CTA phrasing
- Variants: A (baseline) vs B (short value + CTA: "Ajouter — Paiement sécurisé") vs C (price on CTA: "Ajouter — 12 000 XAF").
- Metric: PDP→Add-to-Cart rate; secondary: add-to-cart→checkout.
- Duration: 2–4 weeks or 10k PDP views.

Experiment 2 — Cart CTA simplification
- Variants: A (baseline with coupon in drawer) vs B (single primary CTA to checkout; coupon on checkout only).
- Metric: Cart→Checkout rate.

Experiment 3 — Promo banner variants
- Variants: Free shipping threshold vs Percentage discount vs Time-limited offer.
- Metric: Promo-driven AOV and conversion lift.

Instrumentation
- Events required: `pdp_view`, `pdp_cta_click`, `cart_add`, `cart_open`, `checkout_start`, `promo_impression`, `promo_click`, `purchase_complete`.
- Use `services/analytics.ts` to centralize event names and props.

Rollout
- Start with 5–10% traffic for each experiment, increase if statistically promising.
- Stop/iterate based on primary KPI and pre-defined guardrails (e.g., no >5% drop in conversion).
