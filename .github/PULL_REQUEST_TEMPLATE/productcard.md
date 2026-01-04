# PR Template — Product Card Simplification

## Summary
- What: Simplify `ProductCard` visual hierarchy, reduce badges to one primary badge, ensure price prominence and accessible Add CTA.
- Why: Reduce decision friction and increase add-to-cart per view.

## Changes
- Files: `components/ProductCard.tsx`, `components/Badges.tsx`
- Behavior: single badge prioritized, Add CTA visible on hover and keyboard focus, consistent price formatting.

## Checklist
- [ ] Before / after screenshots included
- [ ] Keyboard focus and screen reader checks passed
- [ ] Analytics: `product_card_cta_click` event added if new CTA behavior
- [ ] Unit tests for updated components (if applicable)

## Testing
1. Visit product grid, confirm one clear badge and price prominence.
2. Use keyboard to focus product card; ensure Add CTA reachable and actionable.
3. Check that favorite toggle still works and is accessible.

## Reviewer notes
- Confirm that stickers/stamps logic is preserved in admin/promotions but not shown by default on small cards.
