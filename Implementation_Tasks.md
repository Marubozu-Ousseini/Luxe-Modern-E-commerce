# Implementation Task List — Sprint-ready Tasks

Sprint 1 (2 weeks) — Quick wins & discovery
- Task 1.1: Make header search larger and add suggestion stub (frontend only). (Dev/Design) — `components/Header.tsx`.
- Task 1.2: Simplify `ProductCard` visual hierarchy (remove extra stickers, ensure Add CTA accessible). (Dev/Design) — `components/ProductCard.tsx`.
- Task 1.3: Add skeleton loaders for product grid and PDP main image. (Dev) — `components/ProductList.tsx`, `components/ProductDetail.tsx`.
- Task 1.4: Implement mobile bottom nav (icons only). (Dev) — `components/Header.tsx`.

Sprint 2 — PDP persuasion & cart flow
- Task 2.1: Add PDP sticky CTA and short value proposition (Design/Dev) — `components/ProductDetail.tsx`.
- Task 2.2: Simplify cart drawer to single checkout CTA and move coupon input to `/checkout`. (Dev) — `components/Cart.tsx`, `pages/Checkout.tsx`.
- Task 2.3: Instrument events for core funnel (analytics). (Dev) — `services/analytics.ts`, add calls to `ProductDetail`, `Cart`, `PromotionBanner`.

Sprint 3 — Experimentation & accessibility
- Task 3.1: Build A/B variants for PDP CTA copy and urgency presence. (Design/Dev)
- Task 3.2: Accessibility pass (focus states, alt text audit, contrast). (Dev)
- Task 3.3: Performance tuning (image sizes, skeletons, defer non-critical JS). (Dev)

PR guidance
- Keep PRs small and focused (one component change per PR).
- Each PR must include: before/after screenshots, test instructions, and instrumentation notes.

Owners
- Design: craft microcopy, hero & PDP variants.
- Dev: implement components and instrumentation.
- PM: prioritize and run A/B tests.
