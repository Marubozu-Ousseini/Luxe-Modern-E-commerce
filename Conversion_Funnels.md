# Conversion Funnels — Definitions & Priorities

Primary funnels (priority order):

1. Browse → PDP → Add-to-cart → Checkout → Purchase
   - KPIs: PDP views → add-to-cart rate, cart-to-checkout rate, checkout conversion.
   - Instrument: `pdp_view`, `pdp_cta_click`, `cart_add`, `cart_open`, `checkout_start`, `purchase_complete`.

2. Search → PDP → Add-to-cart
   - KPIs: search CTR, search-to-PDP rate, time-to-first-PDP.
   - Instrument: `search_query`, `search_suggestion_click`, `search_result_click`.

3. Promotion-driven landing → PDP → Purchase
   - KPIs: promo-impression CTR, promo-driven AOV.
   - Instrument: `promo_impression`, `promo_click`, `promo_code_apply`.

Secondary funnels
 - Favorites → PDP → Cart
 - Account/login → checkout speed

Quick tasks
 - Add event docs (name, props) in `services/analytics.ts`.
 - Tag top 10 events as priority for A/B tests.
