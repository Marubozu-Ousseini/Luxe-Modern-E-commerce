# PDP + Mobile Header Wireframes and Example Copy

Concise deliverable: annotated wireframes, interaction notes, and example microcopy (French) for the Product Detail Page (PDP) and mobile header (bottom navigation + search). Built to align with the earlier IA and UI patterns without changing architecture.

---

**Files to update**
- `components/ProductDetail.tsx`
- `components/Header.tsx`
- `components/PromotionBanner.tsx` (for small promo area on PDP)

---

## 1) Desktop PDP — Wireframe (annotated)

Top area (two-column grid)
- Left (60%): Large image/video gallery, thumbnails below.
  - LCP target; add skeleton while loading.
- Right (40%): Sticky content column with the following order:
  1. Category tag (small, uppercase)
  2. Product title (`h1`) — large serif
  3. Price (large, emphasized) + small strikethrough original price when present
  4. One-line value proposition (20–30 chars) — concise benefit
  5. Urgency/stock line (if applicable) — light red or amber label
  6. Trust microcopy row: "Paiement sécurisé · Retours 14 jours · Livraison 2–4j"
  7. Quantity selector + primary CTA: `Ajouter au panier` (solid `bg-accent`) and secondary `Acheter maintenant` link-style
  8. Small note: free shipping threshold progress (e.g., "Livraison offerte dès 50 000 XAF")

Below fold
- Accordions: Détails | Matières | Livraison & Retours
- Social proof: 2 short verified testimonials (one-liner + name)
- Cross-sell carousel: `CompleteLook` with clear CTA `Ajouter` on each item

Behavior
- Add a sticky bottom bar on scroll for narrow windows: shows price + `Ajouter au panier` + quick favorites icon.
- Primary CTA triggers animation and `pdp_cta_click` analytics event.

Example layout ASCII (simplified)

[IMAGE GALLERY]     | CATEGORY
                    | PRODUCT NAME (H1)
                    | PRICE  12 000 XAF
                    | "Coupe pensée pour durer." (value line)
                    | [Stock: 3 restants]  •  Paiement sécurisé · Retours 14 jours
                    | [-] 1 [+]  [Ajouter au panier]  [Acheter maintenant]


## 1a) Desktop PDP — Example microcopy (French)
- Value line (short): "Matières naturelles, coupe durable."
- Urgency: "Rupture possible — seulement 3 restants"
- CTA primary: "Ajouter au panier"
- CTA secondary: "Acheter maintenant"
- Trust: "Paiement sécurisé · Retours sous 14 jours · Livraison 2–4 jours"

Analytics events to add (on PDP)
- `pdp_view` (productId)
- `pdp_cta_click` (productId, cta: 'add'|'buy_now')
- `pdp_sticky_cta_click` (productId)

---

## 2) Mobile PDP — Wireframe & interactions (annotated)

Mobile priorities: image, product name & price, single clear CTA, minimal scroll friction.

Top -> Bottom
1. Collapsible top bar: back + favorites + share
2. Large gallery (swipeable) with dot thumbnails
3. Title (h1) and price visible under image
4. One-line value proposition + short stock/urgency tag
5. Trust microcopy (single line)
6. Quantity control hidden inside quantity pill on sticky bar (expandable modal)

Sticky bottom bar (always visible) — 56-68px high
- Left: Price (bold) — e.g., `12 000 XAF`
- Center: Primary CTA `Ajouter` (full-width on small devices; we can place price left then CTA button center-right)
- Right: Cart icon with item count (secondary action)
- Tap CTA opens mini-add animation, increments cart, and shows small confirmation toast with `Voir le panier` link

Mobile sticky CTA copy examples
- Primary: "Ajouter — 12 000 XAF"
- Microtrust under CTA (very small): "Paiement sécurisé · Retours 14 j"

Keyboard & accessibility
- Ensure sticky CTA reachable via keyboard focus order
- Announce updates to cart with `aria-live="polite"`

Analytics events
- `pdp_sticky_cta_click` (productId)
- `pdp_swipe_image` (productId, index)

---

## 3) Mobile Header & Bottom Navigation — Wireframe (annotated)

Goal: Keep top header minimal; primary navigation via bottom nav for one-thumb reach.

Top header (compact)
- Left: Back / menu (hamburger)
- Center: brand wordmark (optional) or empty to reduce clutter
- Right: search icon, favorites icon (optional), cart icon

Search behavior
- Tap search icon opens full-screen search modal with prominent text input and predictive suggestions below
- Suggestions: recent searches + autocomplete results (first 5) with category chips

Bottom navigation (5 icons)
- Shop (home/boutique)
- Search (opens search modal)
- Favorites (heart) — open `Favoris` page
- Cart (opens drawer) — show badge count
- Account (profile/login)

Mobile header wire ASCII

Top: [≡]   Malafaareh   [🔍][♥][🛒]
Bottom nav: [Boutique] [🔍] [Favoris] [🛒] [Compte]

Microcopy & icons
- Icon labels small: "Boutique", "Rechercher", "Favoris", "Panier", "Compte"
- Search placeholder: "Rechercher des produits, ex: manteau, laine"

Accessibility
- Bottom nav buttons have clear aria-label and are large enough (min 44px tappable)
- Search modal focuses the input and traps focus while open

---

## 4) Interaction details & small behaviors
- Add-to-cart confirmation: subtle toast with product thumbnail, name, quantity, and CTA `Voir le panier`.
- Favorites toggle: instant UI feedback + `aria-pressed` and `aria-live` for screen readers.
- Sticky CTA should be dismissed if a full-screen cart modal opens.

---

## 5) Implementation notes (dev-friendly)
- Add `pdp_sticky_cta` component inside `ProductDetail.tsx`. Use CSS position: fixed; bottom: 0; width: 100%; safe-area-inset handling.
- Reuse existing `Cart` drawer open method when tapping cart icon.
- Implement search modal in `Header.tsx` as controlled overlay; add `searchSuggestions` stub endpoint to services for later instrumentation.
- Ensure `aria-live="polite"` region for cart updates.

Component mapping (quick)
- `ProductDetail.tsx` — sticky CTA, value line, urgency tag
- `Header.tsx` — search modal, compact top header adjustments, bottom nav for mobile
- `ProductCard.tsx` — ensure price formatting consistent with PDP (avoid mismatch)

---

## 6) Accessibility checklist (quick)
- `h1` present on PDP
- Alt attributes for all images
- Focus trap in search modal and cart drawer
- Color contrast check for price and CTA
- Announce cart updates with `aria-live`

---

## 7) Next steps
- I can generate component-level PR templates for the above work (one PR per component change) or create a clickable Figma-style spec (as Markdown with CSS snippets). Which next? 
