# PR Template — Hero & Homepage Changes

## Summary
- What: Shorten hero copy, add category chips under hero, surface featured collections.
- Why: Improve clarity and drive users into product discovery faster.

## Changes
- Files: `components/HeroSection.tsx`, `components/CategoryFilter.tsx`, homepage wrapper
- Behavior: hero compresses to 1-line value prop + primary CTA; category chips for quick filtering.

## Checklist
- [ ] Before / after screenshots
- [ ] Mobile responsive checks
- [ ] Analytics: `hero_cta_click` if used for experiments

## Testing
1. Load homepage; verify hero length and chips appear under hero.
2. Click chips and confirm filter behavior applies to product list.

## Reviewer notes
- Keep hero LCP-friendly; use optimized image sizes.
