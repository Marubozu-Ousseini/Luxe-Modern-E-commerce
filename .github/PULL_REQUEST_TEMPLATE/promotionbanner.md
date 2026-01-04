# PR Template — Promotion Banner / Promo Variants

## Summary
- What: Replace passive marquee with targeted banner variants (free shipping threshold, time-limited offers, limited stock badges) and add impression tracking.
- Why: Increase promo-driven conversions and improve discoverability of offers.

## Changes
- Files: `components/PromotionBanner.tsx`, promotions API (frontend usage)
- Behavior: banner variants selectable via promotions API; impressions tracked (`promo_impression`) and clicks (`promo_click`).

## Checklist
- [ ] Examples of each banner variant included (screenshots)
- [ ] Impression and click events instrumented
- [ ] Banner accessible (text readable, pauses animation if animated)

## Testing
1. Load homepage and PDP where banner appears; confirm variant rendering.
2. Validate impression event firing and click handling for voucher links.

## Reviewer guidance
- Confirm animations do not harm LCP and that images have `alt` text.
