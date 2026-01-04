# UX Audit — Key Findings (Concise)

Summary: quick, focused audit of the storefront UI to identify high-impact UX issues and opportunities.

1. Top pain points
   - Search visibility: search is present but small on mobile; suggestions missing.
   - Product-card noise: multiple badges, overlays, and stickers compete with price and CTA.
   - PDP CTA placement: CTA blends into page flow; no persistent sticky CTA on scroll.
   - Cart friction: coupon management and multiple CTAs create choice overload; cart drawer tries to do too much.
   - Passive promos: marquee banner is easy to miss and not targeted.

2. Visual hierarchy
   - Good serif wordmark and photography; inconsistent emphasis between price, category and CTAs.
   - Hero copy often long; compress messaging to 1–2 lines.

3. Mobile UX
   - Primary actions (search, cart, account) are reachable, but important site links remain in desktop nav only.
   - Consider bottom navigation for 5 primary actions.

4. Persuasion & trust
   - Testimonials present but limited; add microtrust near CTAs (secure payment, returns, shipping promise).
   - Urgency signals exist (`limitedAvailability`) but inconsistent across product list and PDP.

5. Accessibility & performance
   - Images use `loading=lazy`—good; ensure alt texts present.
   - Ensure color contrast, keyboard focus visible and aria attributes for dynamic content (cart drawer, accordions).

6. Measurement
   - Some analytics events present; expand to instrument search suggestions, PDP sticky CTA clicks, and banner impressions.

Action: Use this to drive the IA redesign, component-level changes, and measurement plan.
