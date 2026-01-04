# UX Prioritized Action List — Concise

This file is a focused, prioritized set of UX actions to redesign the storefront experience for higher conversion and stronger customer psychology, without changing the app architecture.

## How to use
- Implement items top-to-bottom; stop after any item if metrics improve sufficiently.
- Each item: impact (H/M/L), effort (S/M/L), owner (PM/Design/Dev), key metric to track.

---

1. Improve product discovery (H impact / M effort)
   - Action: Make search prominent, add predictive suggestions, and surface category chips on homepage and header search.
   - Files/components: `Header.tsx`, `ProductList.tsx`, `FilterBar.tsx`.
   - Metric: Increase search-to-PDP clicks by 20%.

2. Simplify product cards for clarity (H impact / S effort)
   - Action: Reduce visual noise; emphasize price, one clear badge (sale/bestseller), and persistent primary CTA `Add` on hover and via keyboard.
   - Files/components: `ProductCard.tsx`, `Badges.tsx`.
   - Metric: Add-to-cart rate per view +10%.

3. Optimize PDP for persuasion (H / M effort)
   - Action: Move price, urgency message (stock), one-line value proposition near CTA, social proof block and a sticky CTA on scroll.
   - Files/components: `ProductDetail.tsx`, `Testimonials.tsx`, `CompleteLook.tsx`.
   - Metric: PDP conversion rate +15%.

4. Reduce friction in cart (H / M effort)
   - Action: Change cart drawer to show clear savings, single checkout CTA, remove redundant steps. Save coupon UX for checkout page only.
   - Files/components: `Cart.tsx`, `Checkout.tsx`.
   - Metric: Cart-to-checkout rate +12%.

5. Strengthen promotional messaging (M / S effort)
   - Action: Replace passive marquee with targeted banner variants: limited-time offers, free shipping threshold, and local currency localization.
   - Files/components: `PromotionBanner.tsx`, promotions API.
   - Metric: Promo-driven conversions and average order value (AOV) lift.

6. Improve header/nav clarity on mobile (M / S effort)
   - Action: Collapse secondary links into a clear hamburger menu; use bottom nav for primary actions (Shop, Search, Favorites, Cart, Account).
   - Files/components: `Header.tsx`.
   - Metric: Mobile bounce and navigation completion rate improvements.

7. Add persuasion microcopy & trust signals (M / S effort)
   - Action: Short trust lines near CTAs: secure payment, returns, shipping promise, and authenticity of materials.
   - Files/components: `ProductDetail.tsx`, `Cart.tsx`, `Checkout.tsx`.
   - Metric: Reduction in cart abandonment.

8. Accessibility fixes & content hierarchy (M / M effort)
   - Action: Ensure headings follow order, alt text completeness, color contrast, and keyboard focus states for all CTAs.
   - Files/components: global components, `Header.tsx`, `ProductCard.tsx`, `Cart.tsx`, `ProductDetail.tsx`.
   - Metric: WCAG compliance checklist; reduced keyboard navigation errors in user testing.

9. Measurement & experiment scaffolding (H / M effort)
   - Action: Instrument analytics events for search, PDP CTAs, cart events, and banner impressions; prioritize A/B test variants for PDP CTA, cart flow, and banner messaging.
   - Files/components: analytics service + add tracking calls in `ProductDetail.tsx`, `Cart.tsx`, `PromotionBanner.tsx`.
   - Metric: A/B test-ready with primary KPIs defined.

10. Quick wins (low effort)
   - Action: Improve loading placeholders on images (`lazy` + skeletons), shorten hero copy, remove low-value links from top nav, and make `Favorites` accessible via persistent icon.
   - Files/components: `HeroSection.tsx`, `ProductCard.tsx`, `Header.tsx`.
   - Metric: Faster perceived load, engagement uptick.

---

## Next steps (implementation cadence)
- Sprint 1 (2 weeks): Items 1, 2, 10. Test small PDP CTA variant.
- Sprint 2 (2 weeks): Items 3, 4, measurement instrumentation.
- Sprint 3: Accessibility, promos, and experiments roll-out.

---

If you want, I can: map each action to specific PR tasks, generate example copy for banners and CTAs, and produce wireframes for PDP and header mobile. Which should I do next?
