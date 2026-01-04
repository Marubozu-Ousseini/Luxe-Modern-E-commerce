# PR Template — Accessibility & Analytics Instrumentation

## Summary
- What: Accessibility fixes (focus states, alt text, contrast) and add analytics events for core funnel.
- Why: Improve inclusivity and enable experiment measurement.

## Changes
- Files: various (`components/*`), `services/analytics.ts`
- Behavior: add `aria-live` for cart updates, ensure alt text present, centralize event names in `services/analytics.ts`.

## Checklist
- [ ] WCAG checklist items verified and documented
- [ ] Analytics events added and documented in `services/analytics.ts`
- [ ] Unit or integration tests added for critical flows

## Testing
1. Run keyboard-only navigation across homepage, PDP, and cart; check focus order.
2. Verify analytics events in dev console or test env when performing key actions.

## Reviewer guidance
- Confirm event naming consistency and avoid duplications.
- Ensure no accessibility regressions.
