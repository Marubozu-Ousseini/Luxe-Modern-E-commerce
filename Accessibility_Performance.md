# Accessibility & Performance Checklist

Accessibility (WCAG-focused)
- Headings: ensure H1 on PDP is `h1`, headings descending order across pages.
- Alt text: all images must have descriptive `alt` attributes.
- Focus: visible focus outline for all interactive elements; keyboard navigation through cart drawer and accordions.
- ARIA: cart drawer `role=dialog` + `aria-modal=true`; accordions `aria-expanded` used (already present).
- Color contrast: check CTAs and text against WCAG AA.

Performance
- Keep `loading="lazy"` for images; add low-res placeholders or skeletons for LCP images.
- Defer non-critical JS for analytics and promo polling where possible.
- Optimize hero and PDP images: serve appropriate sizes and use `srcset` if possible.

Quick fixes
- Add skeleton placeholders for product grid and PDP main image.
- Ensure promotion polling frequency is reasonable (30s currently — fine) and degrades gracefully.

Testing
- Run Lighthouse (desktop & mobile). Track LCP, TTFB, CLS, FID/INP.
