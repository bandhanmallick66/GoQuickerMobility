# Launch checklist

Work through this before taking real riders. Items marked **legal** need advice from a qualified professional.

## Business details
- [ ] Add real contact details, social links and app store links in `src/config/site.ts` (empty values stay hidden).
- [ ] Confirm which service features to show (`enabled` flags in `src/config/categories.ts`).
- [ ] Replace placeholder artwork with licensed photos.
- [ ] Add real, permitted rider reviews to `src/config/testimonials.ts`, or keep the section hidden.
- [ ] **Legal:** have the Terms, Privacy, Cancellation and Safety pages reviewed. They are drafts. Check the DPDP Act 2023 and your state's aggregator licensing rules.

## Accounts and services
- [ ] PostgreSQL database with backups; set `DATABASE_URL` and run `npm run db:migrate`.
- [ ] `AUTH_SECRET` (random, 32+ bytes) and keep it secret.
- [ ] MSG91 account, DLT entity and OTP template registration (required for SMS in India); set `SMS_PROVIDER=msg91` and its keys.
- [ ] Google Maps Platform key restricted to Places API (New) and Routes API, with a billing budget alert.
- [ ] Add `fare_rules` rows for your launch city and set `SERVICE_CITY`. Example (₹30 base, ₹12/km, ₹1/min, ₹50 minimum):
  ```sql
  insert into fare_rules (city, category, base_fare, per_km, per_minute, minimum_fare, booking_fee)
  values ('Bengaluru', 'auto-rickshaw', 3000, 1200, 100, 5000, 0);
  ```
  Use one row per ride type: `cars`, `auto-rickshaw`, `bike` and `scooter`.
- [ ] Second Google Maps key for the browser with **Maps JavaScript API** enabled, restricted to your website address (HTTP referrers such as `https://goquicker.in/*`). Set `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`. Optionally create a Map ID with your styling and set `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`.
- [ ] Add each approved captain and their vehicle, then send them to `/captain`:
  ```sql
  insert into captains (name, phone, city, verified, active) values ('Ravi Kumar', '9876543210', 'Bengaluru', true, true);
  insert into vehicles (captain_id, category, plate, model)
  select id, 'auto-rickshaw', 'KA 01 AB 1234', 'Bajaj RE' from captains where phone = '9876543210';
  ```
  To stop a captain signing in, set `active = false`.
- [ ] Razorpay account (KYC complete), API keys and a webhook to `/api/webhooks/razorpay` with its secret. Turn on `NEXT_PUBLIC_PAYMENTS_ENABLED` only when payments are taken. Riders who chose UPI, card or wallet pay the final fare in the app after drop-off (Razorpay Checkout); subscribe the webhook to `payment.authorized`, `payment.captured`, `payment.failed` and `refund.processed`. Make one test payment in Razorpay test mode before going live.

## Operations (separate systems)
- [ ] Train captains on the captain app: go online, keep the screen on, check the vehicle number and ride OTP, navigate with Google Maps.
- [ ] Decide whether captains pick rides from the list (built) or you need automatic dispatch (not built).
- [ ] Someone watching `sos_alerts` around the clock, with a way to call the rider and alert emergency services (112). The site records alerts; it does not notify anyone by itself.
- [ ] Captain verification process (licence, RC, background checks) feeding `partner_applications` statuses.
- [ ] Support inbox reading `contact_messages`.

## Before go-live
- [ ] `NEXT_PUBLIC_DEMO_MODE` is **not** set.
- [ ] `NEXT_PUBLIC_SITE_URL` is set to the live address.
- [ ] HTTPS on the live domain; the session cookie is `Secure` in production.
- [ ] `npm test`, `npm run lint` and `npm run build` pass.
- [ ] Sign up, sign in, book, cancel and SOS tested end to end on a phone.
- [ ] One full test ride with two phones: rider books, captain accepts, rider watches the captain on the map, captain starts with the ride OTP and finishes.
- [ ] If running more than one server instance, move rate limits to Redis.
