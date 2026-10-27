# GoQuicker

Website and booking backend for GoQuicker, a pick-up and drop-off ride service with four ride types: Cars, Auto Rickshaw, Bike and Scooter (Bike and Scooter are one-passenger two-wheeler taxis). Built with Next.js 16 (App Router), TypeScript, Tailwind CSS 4, PostgreSQL and Drizzle ORM.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in what you have; empty values switch features off
npm run db:migrate           # needs DATABASE_URL
npm run dev                  # http://localhost:3000
```

For sign-in without an SMS account, set `SMS_PROVIDER=console` and an `AUTH_SECRET`: codes are printed in the terminal. This is refused in production.

| Command | What it does |
|---|---|
| `npm run build && npm start` | Production build and server |
| `npm test` | Unit and database tests (in-memory Postgres, no setup needed) |
| `npm run typecheck`, `npm run lint` | Type and lint checks |
| `npm run db:generate` | New migration after editing `src/server/db/schema.ts` |
| `npm run build:preview` | Static demo copy in `preview/` (no server features) |

## What works when

Every feature that needs a provider reports "not connected yet" until its settings exist, so the site never invents rides, fares or confirmations.

| Feature | Needs |
|---|---|
| Sign-in and sign-up by phone OTP, account pages, ride history | `DATABASE_URL`, `AUTH_SECRET`, MSG91 settings |
| Booking a ride, cancelling, SOS alerts | Signed-in rider and the database |
| Address suggestions | `GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_PLACES_ENABLED=1` |
| Captain app at `/captain`: go online, share GPS, accept rides, navigate, start with ride OTP, finish | Database, sign-in settings, and captains added by your team |
| Live map of the captain on the rider's ride screen, route preview while booking | Captain app in use, `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`, and `GOOGLE_MAPS_API_KEY` for route lines |
| "Open in Google Maps" navigation links | Nothing: they work without any key |
| Fare estimates | Maps key, `SERVICE_CITY`, and rows in `fare_rules` for that city |
| Online payment choice (UPI, card, wallet) | Razorpay keys, `NEXT_PUBLIC_PAYMENTS_ENABLED=1` |
| Contact form, captain applications and status | The database |

## Where things live

- `src/config/` brand copy, navigation, market (India, INR, Asia/Kolkata), services, payments, FAQs. Contact details and social links are empty until real ones are added, and empty values stay hidden.
- `src/app/` pages, plus `src/app/api/` for the server API. `src/proxy.ts` sends signed-out visitors from `/account` to sign-in.
- `src/server/` database schema, services (auth, bookings, fares, requests), provider adapters (MSG91, Google Maps, Razorpay), request checks and rate limits.
- `src/lib/` code shared with the browser: trip validation, API client, session hook.
- `tests/` Vitest suites. Service tests run against PGlite with the real migration.
- `docs/architecture.md` how the pieces fit, and `docs/launch-checklist.md` what to do before going live.

Vehicle photos come from `assets/vehicles/` and are turned into web images in `public/images/vehicles/` by `python3 scripts/compose-photos.py` (cut-outs, photos placed on the dusk scenes from `scripts/generate-art.mjs`, and the `fleet*.webp` group shots of all four vehicles used wherever a section covers every service). To change a photo, replace the PNG in `assets/vehicles/` and run the script again. Paths are set in `src/config/`.

### Logo

The owner's logo is in `assets/brand/goquicker-logo.png` (on black). `python3 scripts/prepare-logo.py` makes transparent light and dark versions in `public/images/brand/`, plus side-by-side lockups (G mark beside the wordmark) used in the header and footer.
