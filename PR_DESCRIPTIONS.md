# Ready-to-Paste PR Descriptions

Below are copy-ready GitHub PR bodies for each implementation task. Paste the relevant section into your PR description and update placeholders (e.g., ISSUE/ID, screenshots).

---

## PR: Header / Mobile Nav — Make search prominent + mobile bottom nav

Summary
- Make header search more prominent, add full-screen search modal with suggestions, and add mobile bottom navigation (Shop, Search, Favorites, Cart, Account). Collapse secondary links into a hamburger on mobile.

Why
- Improve product discovery and one-thumb navigation on mobile.

Changes
- `components/Header.tsx`: search modal, suggestion stub, mobile top/header tweaks
- `components/PromotionBanner.tsx` (minor): small promo placement when search modal open
- Styles: responsive adjustments

Testing
- Mobile and desktop manual checks (iPhone/Android responsive widths)
- Verify search modal focuses input and traps focus while open
- Verify bottom nav icons are tappable (>=44px) and have `aria-label`

Checklist
- [ ] Screenshots attached (before/after)
- [ ] Accessibility: focus trap, aria-labels for nav icons
- [ ] Analytics: `search_query` & `search_suggestion_click` events (if added)
- [ ] Unit/integration tests added where relevant

Notes
- Update issue/PR title with: "Header: search modal + mobile bottom nav — ISSUE-XXX"

---

## PR: ProductCard Simplification

Summary
- Simplify `ProductCard`: reduce visible badges to one primary badge, emphasize price, ensure `Add` CTA is reachable on hover and keyboard, preserve favorite toggle.

Why
- Reduce visual noise and increase add-to-cart conversions per listing view.

Changes
- `components/ProductCard.tsx`
- `components/Badges.tsx` (minor logic change)

Testing
- Verify grid shows single clear badge, price prominent
- Keyboard tab into card, ensure Add CTA reachable and actionable

Checklist
- [ ] Before/after screenshots
- [ ] Keyboard + screen reader checks
- [ ] Analytics: `product_card_cta_click` if new event

---

## PR: PDP Improvements — Sticky CTA + Trust Microcopy

Summary
- Add sticky bottom CTA for PDP on scroll/mobile, add one-line value proposition near primary CTA, show urgency/stock tag and trust microcopy, and instrument `pdp_cta_click` and `pdp_sticky_cta_click` events.

Why
- Reduce scroll friction and improve PDP→Add-to-cart conversions.

Changes
- `components/ProductDetail.tsx`
- `components/Testimonials.tsx` (placement tweaks)
- `services/analytics.ts` (add events)

Testing
- Confirm sticky CTA appears/hides correctly at breakpoints and respects safe-area-inset
- Clicking CTA updates cart and triggers analytics events
- `aria-live` announcements for cart changes

Checklist
- [ ] Screenshots (mobile sticky behavior)
- [ ] Accessibility: keyboard focus, `aria-live`
- [ ] Analytics instrumentation

---

## PR: Cart Drawer Simplification

Summary
- Simplify cart drawer to focus on subtotal and savings, present a single primary CTA to navigate to checkout, and move coupon input to the `/checkout` page (drawer shows a hint only).

Why
- Reduce choice overload in the drawer and improve cart→checkout conversion.

Changes
- `components/Cart.tsx`
- `pages/Checkout.tsx` (add coupon input + behavior)

Testing
- Add items to cart and open drawer: confirm coupon input not present (or shown as hint)
- Click primary CTA → navigate to `/checkout` with cart state preserved
- Keyboard navigation across drawer

Checklist
- [ ] Before/after screenshots
- [ ] Analytics: `cart_open`, `cart_checkout_click`, `coupon_apply`
- [ ] Manual tests for pay-now flow (if still available)

---

## PR: Promotion Banner — Replace marquee with targeted variants

Summary
- Replace passive marquee with targeted banner variants (free shipping threshold, time-limited offer, limited-stock badge), add impression (`promo_impression`) and click (`promo_click`) events, ensure accessible rendering.

Why
- Make promotions discoverable and measurable; increase promo-driven conversions.

Changes
- `components/PromotionBanner.tsx`
- Promotions data usage (sticker handling)

Testing
- Confirm each banner variant renders correctly and impressions/clicks are tracked
- Ensure animations (if used) do not harm LCP

Checklist
- [ ] Screenshots of banner variants
- [ ] Instrumentation for `promo_impression` and `promo_click`
- [ ] Accessibility: readable text, pause controls if animated

---

## PR: Hero & Homepage — Shorten hero, add category chips

Summary
- Shorten hero copy to a single-line value proposition, add category chips directly under hero for fast filtering, and surface featured collections.

Why
- Improve clarity and reduce time-to-product discovery.

Changes
- `components/HeroSection.tsx`
- `components/CategoryFilter.tsx` (chips visible under hero)

Testing
- Validate hero text length and responsiveness
- Click category chips → verify filter applies to product list

Checklist
- [ ] Screenshots
- [ ] Analytics: `hero_cta_click` if used

---

## PR: ProductList & FilterBar Enhancements

Summary
- Add category chips above grid, prioritize filters (material, price, availability), and set default sort to "Most popular".

Why
- Improve product discovery and filter usability.

Changes
- `components/ProductList.tsx`
- `components/FilterBar.tsx`
- `components/CategoryFilter.tsx`

Testing
- Filters apply and update the product grid
- Filter controls keyboard navigable
- URL reflects filter state (if applicable)

Checklist
- [ ] Screenshots
- [ ] Analytics: `filter_apply`, `sort_change`

---

## PR: Accessibility & Analytics Instrumentation

Summary
- Perform accessibility fixes (focus states, alt text, color contrast) and centralize analytics event names in `services/analytics.ts`. Add `aria-live` for cart updates.

Why
- Improve inclusivity and measurement quality for experiments.

Changes
- Various `components/*` changes for accessibility
- `services/analytics.ts` update for standardized event names

Testing
- Keyboard-only navigation tests for homepage, PDP, and cart
- Verify analytics events are fired in dev console or staging

Checklist
- [ ] WCAG items verified and documented
- [ ] Analytics event list updated and committed
- [ ] Tests added where applicable

---

### How to use
- Copy the relevant section above into a PR body and replace placeholders like `ISSUE-XXX` and add before/after screenshots.
- For multi-file PRs, keep the PR small or break into logical sub-PRs (component-per-PR recommended).

If you want, I can create branch names and suggested commit messages for each PR next. Would you like that?