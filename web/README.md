# Luxurious Zen E‑Commerce (Next.js)

## Run locally

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`

## Admin (Basic Auth)

The `/admin` area is protected with HTTP Basic Auth via `middleware.ts`.

- Set credentials (recommended):
	- `ADMIN_BASIC_USER`
	- `ADMIN_BASIC_PASS`

Example:

```bash
export ADMIN_BASIC_USER="admin@malafaareh.com"
export ADMIN_BASIC_PASS="change-me"
```

This project is a modern e-commerce front-end built with Next.js App Router + Tailwind.
