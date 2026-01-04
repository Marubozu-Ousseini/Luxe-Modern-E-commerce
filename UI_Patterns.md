# UI Patterns & Component Guidelines

Design tokens (use existing Tailwind tokens where possible)
- Primary color: `bg-accent` for CTAs
- Neutral palette: `text-charcoal`, `text-slate`, `bg-bone`
- Typography: `font-serif` for headings, system sans for body

Component patterns
- Product Card: single badge, prominent price, subtle category, `Add` CTA visible on hover and keyboard-focus.
- PDP Sticky CTA: fixed bottom bar on mobile and small screens, persistent Add-to-cart on desktop when scrolled.
- Header: searchable input with suggestions dropdown; on mobile hide wordmark and prioritize icons.
- Cart Drawer: compact rows, step to full checkout via single CTA.

States
- Loading: skeleton for images and text blocks.
- Empty: friendly, action-based empty states (see `EmptyState.tsx`).
- Error: inline error messages near inputs with suggested actions.

Accessibility
- Ensure all interactive elements have aria-labels and focus rings.
- Use semantic headings and landmarks.

Copy tone
- Calm, confident, concise. CTAs: "Ajouter au panier", "Finaliser la commande", promo: "-15% aujourd'hui".
