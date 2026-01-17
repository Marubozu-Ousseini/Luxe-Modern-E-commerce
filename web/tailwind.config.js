/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia"],
      },
      colors: {
        "text-primary": "var(--text-primary)",
        "text-muted": "var(--text-muted)",
        "bg-surface": "var(--bg-surface)",
        "bg-subtle": "var(--bg-subtle)",
        "footer-brown": "var(--footer-brown)",
        "promo-old": "var(--promo-old)",
        "promo-win": "var(--promo-win)",
        accent: "var(--accent)",
        "border-soft": "var(--border-soft)",
        "stone-taupe": "var(--stone-taupe)",
        sand: "var(--sand)",
        "social-instagram": "var(--social-instagram)",
        "social-facebook": "var(--social-facebook)",
        "social-whatsapp": "var(--social-whatsapp)",
        "social-snapchat": "var(--social-snapchat)",
        "social-tiktok": "var(--social-tiktok)",
      },
      boxShadow: {
        soft: "0 8px 24px rgba(0,0,0,0.06)",
      },
      borderRadius: {
        soft: "4px",
        card: "8px",
        modal: "12px",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        150: "150ms",
        200: "200ms",
        250: "250ms",
      },
      letterSpacing: {
        "tight-luxe": "-0.02em",
        "tight-luxe-sm": "-0.01em",
      },
      maxWidth: {
        content: "1320px",
      },
    },
  },
  plugins: [],
};

export default config;
