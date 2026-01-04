# PR Template — Product List & FilterBar

## Summary
- What: Add category chips and prioritized filters; set default sort to "Most popular".
- Why: Improve discoverability and reduce time-to-PDP.

## Changes
- Files: `components/ProductList.tsx`, `components/FilterBar.tsx`, `components/CategoryFilter.tsx`
- Behavior: chips visible above grid, filters accessible and keyboard navigable.

## Checklist
- [ ] Screenshots attached
- [ ] Filters usable via keyboard and screen readers
- [ ] Analytics: `filter_apply`, `sort_change` events

## Testing
1. Load Boutique page and confirm chips and filters display.
2. Apply filter and verify product grid updates accordingly.

## Reviewer notes
- Ensure filter state is reflected in URL (if applicable) so links are shareable.
