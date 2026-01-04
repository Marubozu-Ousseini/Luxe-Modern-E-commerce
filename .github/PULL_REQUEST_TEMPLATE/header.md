# PR Template — Header / Mobile Nav Changes

## Summary
- What: (e.g.) Make search prominent, add search modal, implement mobile bottom nav.
- Why: improve discovery and one-thumb navigation on mobile.

## Changes
- Files: `components/Header.tsx`, `components/PromotionBanner.tsx` (if small promo moved)
- Behavior: search modal opens, bottom nav visible on mobile, hamburger collapses secondary links.

## Checklist
- [ ] Screenshots (before / after) attached
- [ ] Mobile and desktop tested (iPhone/Android + responsive widths)
- [ ] Accessibility: focus trap for search modal, aria-labels for bottom nav
- [ ] Analytics: `search_query`, `search_suggestion_click` events added (if applicable)
- [ ] Unit / integration tests added where appropriate

## Testing notes
1. Open mobile viewport, verify bottom nav presence and tappable targets.
2. Tap search icon → modal opens and focuses input; suggestions appear for sample queries.
3. Verify cart/favorites icons behave as before.

## Reviewer guidance
- Check accessibility focus trap in the modal and keyboard navigation.
- Review copy in the search placeholder and bottom nav labels.
