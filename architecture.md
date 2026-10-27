# Architecture

## Request flow

The browser only talks to this site's own `/api` routes. Provider keys (SMS, maps, payments) and the database stay on the server.

```
Browser ── /api/* route handlers ── src/server/services ── PostgreSQL
                    │
                    └── src/server/providers ── MSG91 · Google Maps · Razorpay
```

Each route handler parses its body with a zod schema (`src/server/schemas.ts`), checks the request comes from this site (`Origin` must match `Host`), applies a rate limit, and calls a service. Errors become JSON: a missing provider returns `503 {"status":"not-configured"}`, which the browser shows as an honest setup message.

## API

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/otp/request` | POST | Send a sign-in code |
| `/api/auth/register` | POST | Send a code with sign-up details; account is created on verify |
| `/api/auth/otp/verify` | POST | Check code, set session cookie |
| `/api/auth/session` | GET | Current rider (phone masked) |
| `/api/auth/logout` | POST | End session |
| `/api/rides/search` | POST | Fare estimates per ride type |
| `/api/places` | GET | Address suggestions |
| `/api/bookings` | GET, POST | Ride history, request a ride |
| `/api/bookings/[id]` | GET | One of the rider's rides |
| `/api/bookings/[id]/cancel` | POST | Cancel an active ride |
| `/api/bookings/[id]/sos` | POST | Record an SOS alert |
| `/api/promos/validate` | POST | Check an offer code |
| `/api/contact` | POST | Contact form |
| `/api/partners/applications` | POST | Captain application |
| `/api/partners/applications/status` | POST | Application status (reference + phone) |
| `/api/webhooks/razorpay` | POST | Payment events (signature checked) |
| `/api/captain/auth/request`, `/verify`, `/session`, `/logout` | | Captain sign-in (separate `gq_captain` cookie) |
| `/api/captain/online` | POST | Go online or offline |
| `/api/captain/location` | POST | Latest GPS fix (only accepted while online) |
| `/api/captain/rides` | GET | Open requests for the captain's vehicle, nearest first |
| `/api/captain/active` | GET | The captain's current ride |
| `/api/captain/rides/[id]/accept`, `/start`, `/complete` | POST | Take a ride, start it with the rider's ride OTP, finish it |

## Sign-in

Phone number and a 6-digit code, like Indian ride apps. Codes are stored as an HMAC (keyed by `AUTH_SECRET`), expire after 5 minutes, allow 5 tries, and are replaced when a new code is sent. Sending is limited to 3 per number per 10 minutes and 10 per IP per hour. A successful check creates a random session token; the browser gets it in an `httpOnly`, `SameSite=Lax` cookie and the database keeps only its SHA-256 hash. Sessions last 30 days.

## Rides

A booking stores pick-up, drop-off, optional scheduled time (India time), ride type, passengers (cars and autos only), payment choice, optional offer, a fare estimate when one could be worked out, and a 4-digit ride OTP the rider reads to the captain at pick-up. Status changes are appended to `booking_events`. Riders only ever see their own bookings; another rider's booking reads as "not found".

Fares come only from `fare_rules` rows the business sets per city and ride type (amounts in paise): base fare plus per-km and per-minute rates, a minimum fare and a booking fee, rounded up to a whole rupee. With no rule, no price is shown.

Payment is chosen at booking and taken at drop-off, as Rapido and Ola do. The `payments` table and Razorpay webhook record online payments once the captain-side system creates the order for the final fare.

## Captain app and live tracking

`/captain` is a web app captains open on their phone (sign-in at `/captain/login`). Captains are added by GoQuicker's team, with at least one vehicle; only `verified` and `active` captains can sign in. Their codes are kept apart from rider codes, so a code sent for one app can't sign in to the other.

```
Captain phone ── GPS every 5 s ──▶ /api/captain/location ──▶ captain_locations (one row per captain)
Rider phone   ◀── every 5 s ───── /api/bookings/[id]      ◀── booking + captain's latest fix
```

- **Going online** turns on GPS in the browser (`watchPosition`) and keeps the screen awake. Fixes are only accepted while the captain is online, and a captain can't go offline mid-ride.
- **Requests** list open rides for the captain's vehicle type, nearest pick-up first. Accepting is a single conditional update, so when two captains tap together only one gets the ride.
- **Trip flow:** accept → on the way (rider sees the captain move on the map and how far away they are) → rider reads the 4-digit ride OTP → captain starts the trip → captain finishes it, using the estimate or entering the fare.
- **Privacy:** the rider sees the captain's position only between acceptance and drop-off, and positions older than 2 minutes are treated as unknown. Captains see the rider's first name only.
- **Maps:** the rider's ride screen, the booking route preview and the captain app use the Maps JavaScript API with a browser key. Route lines and pick-up/drop-off coordinates come from the Routes API on the server at booking time. "Navigate" and "Open in Google Maps" buttons open Google Maps directions, which need no key.
- **Updates** use polling every 5 seconds, which is simple and reliable at launch scale. Move to WebSockets or server-sent events if you have many thousands of riders tracking at once.

Web pages can't share location from the background, so captains must keep the app open with the screen on. A native Android app (for example, wrapping these same APIs) is the step up when you need background tracking.

## Not in this codebase

Automatic dispatch (offering a ride to one nearby captain at a time), the operations console and captain payouts are separate systems. Today captains pick rides from the request list.

## Scaling notes

Rate limits are kept in memory, which suits a single server. With several instances, move them to a shared store such as Redis (`src/server/rateLimit.ts` is the only place to change).
