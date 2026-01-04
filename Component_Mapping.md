# Component Mapping — Where to Apply Changes

High-impact mappings (file → change summary):

- `components/Header.tsx`
  - Make search prominent and add suggestions dropdown; implement mobile bottom nav; collapse secondary links into hamburger.

- `components/ProductCard.tsx`
  - Reduce badges to one primary badge, ensure price prominence and accessible Add CTA.

- `components/ProductDetail.tsx`
  - Add sticky CTA on scroll, shorten long copy sections, move coupon hints to checkout.

- `components/Cart.tsx`
  - Simplify actions: single primary CTA to checkout, move coupon to checkout page, show clear savings breakdown.

- `components/PromotionBanner.tsx`
  - Replace marquee with targeted banner variants and impression tracking (instrument `promo_impression`).

- `components/HeroSection.tsx`
  - Shorten hero copy, add CTA and category chips below hero.

- `components/Testimonials.tsx`
  - Use 1–2 short, verified testimonials on PDP and site footer; include ratings where available.

- `components/ProductList.tsx` / `components/FilterBar.tsx`
  - Add category chips and prioritized filters; surface sort control and “most popular” default.

Notes
- Each change is cosmetic/UI only — no architecture changes. Implement with small, focused PRs.
