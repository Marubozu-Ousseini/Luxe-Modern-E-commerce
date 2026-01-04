# PR Template — Product Detail Page (PDP) Improvements

## Summary
- What: Add sticky CTA on scroll, move short value proposition near CTA, add urgency/stock line and trust microcopy.
- Why: Increase PDP→Add-to-cart conversions and reduce scroll friction.

## Changes
- Files: `components/ProductDetail.tsx`, `components/Testimonials.tsx`, `components/CompleteLook.tsx`
- Behavior: sticky bottom CTA on mobile/scroll, `aria-live` updates for cart, analytics events: `pdp_cta_click`, `pdp_sticky_cta_click`.

## Checklist
- [ ] Before / after screenshots
- [ ] Sticky CTA behaves across breakpoints and respects safe-area-inset
- [ ] Accessibility: keyboard focusable, `aria-live` region for cart changes
- [ ] Analytics instrumentation added and tested
- [ ] Unit/e2e tests updated

## Testing
1. Open a PDP on mobile and desktop; scroll to ensure sticky CTA appears/hides correctly.
2. Click primary CTA — verify cart increments and `aria-live` announcement.
3. Validate accordions still accessible with `aria-expanded` toggles.

## Reviewer guidance
- Confirm sticky CTA does not overlap other fixed UI and that it is dismissible when cart modal opens.
