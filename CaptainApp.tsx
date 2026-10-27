"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, LogOut, MapPin, Navigation, Power, Radio, Users } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { AppLink } from "@/components/ui/AppLink";
import { fieldBase } from "@/components/ui/Field";
import { RideMap } from "@/components/maps/RideMap";
import {
  acceptRide,
  captainSignOut,
  completeTrip,
  getApi,
  sendCaptainLocation,
  setCaptainOnline,
  startTrip,
  type CaptainRide,
  type OpenRide,
} from "@/lib/api/client";
import { directionsUrl, type LatLng } from "@/lib/maps";

type Fix = LatLng & { heading: number | null; speed: number | null; accuracy: number; at: number };
type Gps = "off" | "waiting" | "on" | "denied" | "unavailable";

const SEND_EVERY_MS = 5000;
/** A parked phone may report no new GPS fix for minutes; resend the last one so riders don't see it go stale. */
const RESEND_SAME_FIX_MS = 30_000;

/** Captain web app: go online, share GPS, take rides and navigate with Google Maps. */
export function CaptainApp() {
  const router = useRouter();
  const [me, setMe] = useState<{ name: string; online: boolean } | null | "setup" | undefined>(undefined);
  const [online, setOnline] = useState(false);
  const [ride, setRide] = useState<CaptainRide | null>(null);
  const [requests, setRequests] = useState<OpenRide[]>([]);
  const [fix, setFix] = useState<Fix | null>(null);
  const [gps, setGps] = useState<Gps>("off");
  const [lastSent, setLastSent] = useState<number | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [fare, setFare] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const fixRef = useRef<Fix | null>(null);
  const sentAt = useRef(0);
  const sentWallClock = useRef(0);

  // Who is signed in.
  useEffect(() => {
    getApi<{ captain: { name: string; online: boolean } | null }>("/captain/auth/session").then((res) => {
      if (res.status === "not-configured") return setMe("setup");
      const c = res.status === "ok" ? res.data.captain : null;
      setMe(c);
      if (c) setOnline(c.online);
    });
  }, []);

  const signedIn = typeof me === "object" && me !== null;

  const refresh = useCallback(async () => {
    const active = await getApi<{ ride: CaptainRide | null; online: boolean }>("/captain/active");
    if (active.status !== "ok") return;
    setRide(active.data.ride);
    setOnline(active.data.online);
    if (!active.data.ride && active.data.online) {
      const open = await getApi<{ rides: OpenRide[] }>("/captain/rides");
      if (open.status === "ok") setRequests(open.data.rides);
    } else setRequests([]);
  }, []);

  // Current ride and nearby requests: every 5 s on a ride, every 10 s while waiting.
  useEffect(() => {
    if (!signedIn) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load, then polling
    refresh();
    const t = window.setInterval(refresh, ride ? 5000 : 10_000);
    return () => window.clearInterval(t);
  }, [signedIn, refresh, ride]);

  // GPS while online. The browser asks the captain for permission the first time.
  useEffect(() => {
    if (!signedIn || !online) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reflect that tracking stopped
      setGps("off");
      return;
    }
    if (!("geolocation" in navigator)) return setGps("unavailable");
    setGps("waiting");
    const watch = navigator.geolocation.watchPosition(
      (p) => {
        const f: Fix = {
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          heading: p.coords.heading,
          speed: p.coords.speed,
          accuracy: p.coords.accuracy,
          at: Date.now(),
        };
        fixRef.current = f;
        setFix(f);
        setGps("on");
      },
      (e) => setGps(e.code === e.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20_000 },
    );
    // Send the newest fix every few seconds rather than on every GPS tick.
    const send = window.setInterval(async () => {
      const f = fixRef.current;
      if (!f || (f.at <= sentAt.current && Date.now() - sentWallClock.current < RESEND_SAME_FIX_MS)) return;
      sentAt.current = f.at;
      sentWallClock.current = Date.now();
      const res = await sendCaptainLocation({ lat: f.lat, lng: f.lng, heading: f.heading, speed: f.speed, accuracy: f.accuracy });
      if (res.status === "ok") setLastSent(Date.now());
    }, SEND_EVERY_MS);
    // Keep the screen awake so the phone doesn't pause location sharing.
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => {});
    return () => {
      navigator.geolocation.clearWatch(watch);
      window.clearInterval(send);
      lock?.release().catch(() => {});
    };
  }, [signedIn, online]);

  async function act(name: string, fn: () => Promise<{ status: string; message?: string }>) {
    setBusy(name);
    setError("");
    const res = await fn();
    setBusy("");
    if (res.status === "error") setError(res.message ?? "Something went wrong. Please try again.");
    else if (res.status === "not-configured") setError("The captain service isn't connected yet.");
    await refresh();
    return res.status === "ok";
  }

  if (me === undefined) {
    return (
      <div role="status" className="grid min-h-64 place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-forest-2" aria-hidden="true" />
        <span className="sr-only">Loading the captain app</span>
      </div>
    );
  }
  if (me === "setup") {
    return (
      <Notice tone="setup" title="The captain app isn't connected yet">
        It works once GoQuicker&apos;s database and sign-in are set up. Nothing is tracked or shared until then.
      </Notice>
    );
  }
  if (me === null) {
    return (
      <div className="mx-auto max-w-md rounded-panel bg-card p-8 text-center ring-1 ring-line">
        <h2 className="text-xl font-bold">Sign in to the captain app</h2>
        <p className="mt-2 text-sm text-ink-soft">Use the mobile number GoQuicker registered for you.</p>
        <AppLink href="/captain/login" className={buttonClasses("primary", "lg", "mt-6 w-full")}>
          Sign in
        </AppLink>
      </div>
    );
  }

  const twoWheeler = /bike|scooter/i.test(ride?.category ?? "");
  const mode = twoWheeler ? "two-wheeler" : "driving";
  const gpsText: Record<Gps, string> = {
    off: "Location sharing is off.",
    waiting: "Finding your location…",
    on: `Sharing your location${fix ? ` (accurate to about ${Math.round(fix.accuracy)} m)` : ""}${lastSent ? `, last sent ${new Date(lastSent).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", second: "2-digit" })}` : ""}.`,
    denied: "Location permission is blocked. Allow location for this site in your browser settings to take rides.",
    unavailable: "We can't get your location. Check that GPS is on.",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-panel bg-forest p-5 text-ivory sm:p-6" aria-labelledby="cap-h">
        <div>
          <h2 id="cap-h" className="text-xl font-bold">Hi, {me.name.split(" ")[0]}</h2>
          <p className={`mt-1 flex items-center gap-2 text-sm ${gps === "denied" || gps === "unavailable" ? "text-[#ffb4a8]" : "text-mist"}`} aria-live="polite">
            <Radio className={`h-4 w-4 ${gps === "on" ? "text-lime" : ""}`} aria-hidden="true" /> {gpsText[gps]}
          </p>
        </div>
        <button
          type="button"
          aria-pressed={online}
          disabled={busy === "online"}
          onClick={() => act("online", () => setCaptainOnline(!online))}
          className={buttonClasses(online ? "primary" : "ghost-dark", "lg")}
        >
          {busy === "online" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Power className="h-4 w-4" aria-hidden="true" />}
          {online ? "Online" : "Go online"}
        </button>
      </section>

      {error && (
        <p role="alert" className="rounded-2xl bg-error/10 p-4 text-sm font-medium text-error">
          {error}
        </p>
      )}
      {done && (
        <Notice title="Trip finished">
          {done}
        </Notice>
      )}

      {ride ? (
        <section className="overflow-hidden rounded-panel bg-card ring-1 ring-line" aria-labelledby="ride-h">
          <RideMap
            pickup={ride.pickupAt ?? undefined}
            drop={ride.dropAt ?? undefined}
            polyline={ride.polyline ?? undefined}
            vehicle={fix}
            followVehicle
            label="Map with your location and the ride's pick-up and drop-off"
            className="aspect-[4/3] w-full sm:aspect-[16/9]"
            fallback={null}
          />
          <div className="space-y-5 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow text-forest-2">{ride.status === "on_trip" ? "On trip" : "Pick up your rider"}</p>
                <h2 id="ride-h" className="mt-1 text-xl font-bold">
                  {ride.riderName} · {ride.category}
                </h2>
              </div>
              <p className="text-right text-sm">
                <span className="block font-semibold">{ride.payment}</span>
                <span className="text-ink-soft">{ride.fareLabel ? `Rider pays about ${ride.fareLabel}` : "No fare estimate"}</span>
              </p>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-forest-2" aria-hidden="true" />
                <div>
                  <dt className="text-ink-soft">Pick-up</dt>
                  <dd className="font-semibold">{ride.pickup}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-forest-2" aria-hidden="true" />
                <div>
                  <dt className="text-ink-soft">Drop-off</dt>
                  <dd className="font-semibold">{ride.drop}</dd>
                </div>
              </div>
              {ride.passengers > 1 && (
                <div className="flex gap-3">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-forest-2" aria-hidden="true" />
                  <dd>{ride.passengers} passengers</dd>
                </div>
              )}
            </dl>

            {ride.status !== "on_trip" ? (
              <>
                <a href={directionsUrl(ride.pickupAt ?? ride.pickup, { mode })} target="_blank" rel="noopener noreferrer" className={buttonClasses("primary", "lg", "w-full")}>
                  <Navigation className="h-4 w-4 text-lime" aria-hidden="true" /> Navigate to pick-up
                </a>
                <form
                  className="flex flex-wrap items-end gap-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!/^\d{4}$/.test(otp)) return setError("Enter the rider's 4-digit ride OTP.");
                    if (await act("start", () => startTrip(ride.id, otp))) setOtp("");
                  }}
                >
                  <label className="min-w-40 flex-1 text-sm font-semibold">
                    Rider&apos;s ride OTP
                    <input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      inputMode="numeric"
                      autoComplete="off"
                      className={`${fieldBase} mt-1 tracking-[0.4em]`}
                    />
                  </label>
                  <button type="submit" disabled={busy === "start"} className={buttonClasses("primary", "lg")}>
                    {busy === "start" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Start trip"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <a
                  href={directionsUrl(ride.dropAt ?? ride.drop, { mode })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses("primary", "lg", "w-full")}
                >
                  <Navigation className="h-4 w-4 text-lime" aria-hidden="true" /> Navigate to drop-off
                </a>
                <form
                  className="flex flex-wrap items-end gap-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const rupees = fare.trim() === "" ? null : Number(fare);
                    if (rupees != null && (!Number.isInteger(rupees) || rupees < 0)) return setError("Enter the fare in whole rupees.");
                    if (rupees == null && ride.fareEstimate == null) return setError("Enter the fare for this trip.");
                    const res = await completeTrip(ride.id, rupees);
                    if (res.status === "ok") {
                      const { fare: due, collect } = res.data;
                      setDone(
                        !due
                          ? "Nothing to collect for this ride."
                          : collect === "app"
                            ? `The rider pays ${due} in the GoQuicker app. Don't collect cash.`
                            : `Collect ${due} from the rider.`,
                      );
                      setFare("");
                      await refresh();
                    } else setError(res.status === "error" ? res.message : "The captain service isn't connected yet.");
                  }}
                >
                  <label className="min-w-40 flex-1 text-sm font-semibold">
                    Final fare (₹)
                    <input
                      value={fare}
                      onChange={(e) => setFare(e.target.value.replace(/\D/g, ""))}
                      inputMode="numeric"
                      placeholder={ride.fareEstimate != null ? String(Math.round(ride.fareEstimate / 100)) : "Amount"}
                      className={`${fieldBase} mt-1`}
                    />
                    <span className="mt-1 block text-xs font-normal text-ink-soft">Leave empty to use the estimate.</span>
                  </label>
                  <button type="submit" className={buttonClasses("primary", "lg")}>
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Finish trip
                  </button>
                </form>
              </>
            )}
          </div>
        </section>
      ) : online ? (
        <section aria-labelledby="req-h" className="space-y-3">
          <h2 id="req-h" className="text-lg font-bold">Ride requests</h2>
          {fix && (
            <RideMap vehicle={fix} followVehicle label="Map with your current location" className="aspect-[16/9] w-full rounded-panel" fallback={null} />
          )}
          {requests.length === 0 ? (
            <p className="rounded-panel bg-card p-6 text-center text-sm text-ink-soft ring-1 ring-line">
              No ride requests for your vehicle right now. This list refreshes by itself.
            </p>
          ) : (
            <ul className="space-y-3">
              {requests.map((r) => (
                <li key={r.id} className="rounded-panel bg-card p-5 ring-1 ring-line">
                  <div className="flex flex-wrap items-start justify-between gap-2 text-sm">
                    <p className="font-bold">
                      {r.category}
                      {r.distanceToPickupKm != null && <span className="font-normal text-ink-soft"> · {r.distanceToPickupKm} km to pick-up</span>}
                    </p>
                    <p className="text-ink-soft">
                      {r.payment}
                      {r.fare && ` · ${r.fare}`}
                    </p>
                  </div>
                  <p className="mt-2 text-sm">
                    <span className="font-semibold">{r.pickup}</span> → {r.drop}
                  </p>
                  {r.when && (
                    <p className="mt-1 text-xs text-ink-soft">
                      Scheduled {new Date(r.when).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={busy !== ""}
                    onClick={() => {
                      setDone(null);
                      act(`accept-${r.id}`, () => acceptRide(r.id));
                    }}
                    className={buttonClasses("primary", "md", "mt-4 w-full")}
                  >
                    {busy === `accept-${r.id}` ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Accept ride"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <p className="rounded-panel bg-card p-6 text-center text-sm text-ink-soft ring-1 ring-line">
          You&apos;re offline. Go online to get ride requests. Your location is shared only while you&apos;re online.
        </p>
      )}

      <p className="text-xs leading-relaxed text-ink-soft">
        Keep this page open with the screen on while you&apos;re online. Phones pause location sharing for web pages in the background.
      </p>
      <button
        type="button"
        onClick={async () => {
          await captainSignOut();
          router.push("/captain/login");
        }}
        className="inline-flex items-center gap-2 text-sm font-semibold text-error hover:underline"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
      </button>
    </div>
  );
}
