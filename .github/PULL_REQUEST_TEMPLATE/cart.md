# PR Template — Cart Drawer Simplification

## Summary
- What: Simplify cart drawer to show clear savings, single primary CTA to checkout, move coupon input to `/checkout` (drawer shows hint only).
- Why: Reduce choice overload and increase cart→checkout conversion.

## Changes
- Files: `components/Cart.tsx`, `pages/Checkout.tsx`
- Behavior: drawer focuses on subtotal/savings, single CTA to checkout, coupon moved to checkout page.

## Checklist
- [ ] Screenshots (before/after)
- [ ] Drawer keyboard focus order verified
- [ ] Coupon behavior documented on checkout page
- [ ] Analytics: `cart_open`, `cart_checkout_click`, `coupon_apply` instrumentation

## Testing
1. Add items to cart and open drawer; confirm coupon input removed or shown as hint.
2. Click primary CTA and verify navigation to `/checkout` with cart preserved.
3. Use keyboard to tab through drawer and activate actions.

## Reviewer notes
- Confirm no loss of functionality for pay-now checkout button; ensure click paths updated where used.
