# Arki Digital Menu (demo)

Layer 1 of the **Arki hospitality platform**: a mobile-first QR menu that takes the order, not just shows it. Built by [Arki Tech Solutions](https://arkisolutions.com).

## What's in the demo

**Guest menu** (`/m/<restaurant>?t=<table>`)
- Amharic and English, one-tap switch
- Photos, prices in ETB, category bar that follows your scroll, search
- Options inside each item: strength (light/regular/dark macchiato), size, milk, extras, butter or oil
- Fasting, vegetarian and allergen filters; items show when a fasting option exists
- Live sold-out labels
- "Goes well with" upselling on items and in the cart
- QR table ordering: cart, kitchen notes, 10% service charge and 15% VAT, order tracking
- Call waiter / ask for the bill

**Owner panel** (`/owner/<restaurant>`)
- Live orders: received → preparing → served, waiter and bill calls
- Menu editor: mark sold out, edit names (EN/AM), prices, photos, hide items
- Analytics: menu opens, orders, revenue, average order, conversion, upsell revenue, per-item views/adds/sales
- QR codes for every table, printable
- Settings: every feature switched on or off per business (the configuration layer)

**Two sample restaurants** show the configuration layer:
- `tsehay-coffee`: Growth plan, all features on
- `buna-corner`: Starter plan, view-only menu

Demo owner logins are shown on the login screen and home page.

## Architecture

- React 18 + TypeScript + Vite, no backend required for the demo
- `src/lib/store.ts` is the only data layer. In the demo it uses the browser's localStorage, with live updates between tabs through BroadcastChannel. Replace it with the Arki platform API (orders, kitchen, stock, payments) to sync across devices, without changing the screens.
- `src/types.ts` `FeatureFlags` is the configuration layer; `Tenant.plan` is where Arki decides what each plan includes.
- Multi-tenant by URL: one link per restaurant, one QR code per table.

## Run locally

```bash
npm install
npm run dev
```

## Deploy on GitHub Pages

The workflow in `.github/workflows/pages.yml` builds and publishes the site on every push to `main`. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions** once. The site is then at `https://oumburs9.github.io/arki-digital-menu/`, and deep links like `/m/tsehay-coffee?t=5` work through `404.html`.

## Deploy on Vercel

Import this repository in Vercel. It detects Vite automatically; `vercel.json` sets the build and the SPA rewrites so `/m/...` and `/owner/...` links work.

## Notes

- Photos load from Unsplash; a branded placeholder shows if a photo can't load.
- All restaurant names, menus and prices are sample data.
