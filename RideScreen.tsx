"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bike,
  CarFront,
  CheckCircle2,
  Footprints,
  KeyRound,
  Loader2,
  Map as MapIcon,
  MapPin,
  Navigation,
  Phone,
  Share2,
  ShieldAlert,
  X,
} from "lucide-react";
import { getCategory, isTwoWheeler } from "@/config/categories";
import { demoBookings, type BookingSummary, type RideStatus } from "@/config/demo";
import { buttonClasses } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { AppLink } from "@/components/ui/AppLink";
import { cancelBooking, confirmPayment, getApi, sendSosAlert, shareTrip, startPayment } from "@/lib/api/client";
import { openCheckout } from "@/lib/razorpay";
import { paymentsConfigured } from "@/config/payments";
import { useSession } from "@/lib/session";
import { directionsUrl, distanceKm } from "@/lib/maps";
import { RideMap } from "@/components/maps/RideMap";
import { AccountLoading } from "./AccountLoading";
import { SignInRequired } from "./SignInRequired";

const timeline: { id: RideStatus; label: string }[] = [
  { id: "searching", label: "Finding a captain" },
  { id: "assigned", label: "Captain assigned" },
  { id: "arriving", label: "Captain on the way" },
  { id: "on-trip", label: "On trip" },
  { id: "completed", label: "Arrived" },
];

const cancelReasons = [
  "Captain is taking too long",
  "I booked by mistake",
  "My plans changed",
  "Captain asked me to cancel",
  "Other",
];

export function RideScreen({ id }: { id: string }) {
  const session = useSession();
  const [live, setLive] = useState<BookingSummary | null | undefined>(undefined);
  const booking = session?.demo ? demoBookings.find((b) => b.id === id) : (live ?? undefined);
  const [statusOverride, setStatus] = useState<RideStatus | null>(null);
  const status = statusOverride ?? booking?.status ?? null;
  const [shareMsg, setShareMsg] = useState("");
  const sosRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");
  const [cancelState, setCancelState] = useState<"idle" | "sending" | "setup" | "done" | "error">("idle");
  const [sosState, setSosState] = useState<"idle" | "sending" | "setup" | "sent">("idle");
  const [payState, setPayState] = useState<{ status: "idle" | "working" | "error"; message?: string }>({ status: "idle" });
  const [reload, setReload] = useState(0);

  const liveStatus = live?.status;
  useEffect(() => {
    if (!session || session.demo) return;
    const controller = new AbortController();
    const load = () =>
      getApi<{ booking: BookingSummary }>(`/bookings/${encodeURIComponent(id)}`, controller.signal)
        .then((res) => {
          if (res.status === "ok") setLive(res.data.booking);
          else setLive((prev) => (prev === undefined ? null : prev)); // keep showing the last good data on a blip
        })
        .catch(() => {});
    load();
    // Refresh status and the captain's position every 5 seconds until the ride ends.
    const finished = liveStatus === "completed" || liveStatus === "cancelled";
    const timer = finished ? undefined : window.setInterval(load, 5000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [session, id, liveStatus, reload]);

  if (session === undefined) return <AccountLoading />;
  if (!session) return <SignInRequired what="this ride" next={`/account/bookings/${id}`} />;
  if (!session.demo && live === undefined) return <AccountLoading label="Loading your ride" />;
  if (!booking || !status) {
    return (
      <div className="mx-auto max-w-md rounded-panel bg-card p-8 text-center ring-1 ring-line">
        <h2 className="text-xl font-bold">We couldn&apos;t find this ride</h2>
        <p className="mt-2 text-sm text-ink-soft">It may belong to another account, or the link may be wrong.</p>
        <AppLink href="/account/bookings" className={buttonClasses("primary", "md", "mt-6")}>
          Your rides
        </AppLink>
      </div>
    );
  }

  const cat = getCategory(booking.category);
  const VehicleIcon = isTwoWheeler(booking.category) ? Bike : CarFront;
  const stepIndex = timeline.findIndex((t) => t.id === status);
  const active = status !== "completed" && status !== "cancelled";
  const tracking = status === "assigned" || status === "arriving" || status === "on-trip";
  const captainAway =
    booking.captainLocation && booking.map?.pickup ? distanceKm(booking.captainLocation, booking.map.pickup) : null;

  async function share() {
    // A public link that works without signing in, so family and friends can follow the ride.
    let url = window.location.href;
    if (!session?.demo) {
      const res = await shareTrip(booking!.id);
      if (res.status !== "ok") {
        setShareMsg(res.status === "error" ? res.message : "Trip sharing isn't connected yet.");
        return;
      }
      url = new URL(res.data.path, window.location.origin).toString();
    }
    const text = `I'm on a GoQuicker ${cat.name} ride. Follow my trip:`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My GoQuicker trip", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShareMsg("Trip link copied. Paste it into a message to share.");
    } catch {
      setShareMsg("Couldn't share automatically. Copy the page address to share your trip.");
    }
  }

  async function confirmCancel() {
    if (!reason || cancelState === "sending") return;
    setCancelState("sending");
    const res = await cancelBooking(booking!.id, reason);
    if (res.status === "ok") {
      setCancelState("done");
      setStatus("cancelled");
      cancelRef.current?.close();
    } else setCancelState(res.status === "not-configured" ? "setup" : "error");
  }

  async function pay() {
    setPayState({ status: "working" });
    const order = await startPayment(booking!.id);
    if (order.status !== "ok") {
      setPayState({ status: "error", message: order.status === "error" ? order.message : "Online payments aren't connected yet." });
      return;
    }
    try {
      const outcome = await openCheckout(order.data, `${cat.name} ride`);
      if (outcome.status === "dismissed") return setPayState({ status: "idle" });
      if (outcome.status === "failed") return setPayState({ status: "error", message: `${outcome.message} No money was taken. You can try again.` });
      const res = await confirmPayment(booking!.id, outcome);
      if (res.status !== "ok") {
        setPayState({ status: "error", message: "We couldn't confirm the payment yet. If money left your account it will show here shortly." });
      } else setPayState({ status: "idle" });
      setReload((n) => n + 1);
    } catch {
      setPayState({ status: "error", message: "The payment window couldn't open. Check your connection and try again." });
    }
  }

  async function alertSafetyTeam() {
    setSosState("sending");
    const res = await sendSosAlert(booking!.id);
    setSosState(res.status === "ok" ? "sent" : "setup");
  }

  return (
    <div className="space-y-6">
      {session.demo && (
        <Notice tone="demo" title="Demo ride">
          This screen uses sample data to show how ride tracking will work. It isn&apos;t a real booking.
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-panel bg-forest text-ivory shadow-panel">
          <RideMap
            pickup={booking.map?.pickup}
            drop={booking.map?.drop}
            polyline={booking.map?.polyline}
            vehicle={tracking ? booking.captainLocation : null}
            label="Map of your ride with the captain's live location"
            className="aspect-[16/10] w-full"
            fallback={
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- decorative map artwork */}
                <img src="/images/benefits-route.svg" alt="Illustration of a route from pick-up to drop-off" className="aspect-[16/10] w-full object-cover" />
                <span className="absolute left-3 top-3 rounded-full bg-forest-ink/80 px-3 py-1 text-xs text-mist backdrop-blur">
                  Map illustration. The live map appears once Google Maps is connected
                </span>
              </div>
            }
          />
          <div className="p-5 sm:p-6">
            <p className="eyebrow text-lime">{status === "cancelled" ? "Cancelled" : timeline[stepIndex]?.label}</p>
            <ol className="mt-4 flex gap-1.5" aria-label="Ride progress">
              {timeline.map((t, i) => (
                <li key={t.id} className="flex-1">
                  <span className={`block h-1.5 rounded-full ${status !== "cancelled" && i <= stepIndex ? "bg-lime" : "bg-white/15"}`} />
                  <span className="sr-only">
                    {t.label}
                    {i < stepIndex ? " (done)" : i === stepIndex ? " (current)" : ""}
                  </span>
                </li>
              ))}
            </ol>
            <dl className="mt-6 space-y-4 text-sm">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-lime" aria-hidden="true" />
                <div>
                  <dt className="text-mist">Pick-up</dt>
                  <dd className="font-semibold">{booking.pickup}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-lime" aria-hidden="true" />
                <div>
                  <dt className="text-mist">Drop-off</dt>
                  <dd className="font-semibold">{booking.drop}</dd>
                </div>
              </div>
            </dl>
            {tracking && (
              <p className="mt-5 text-sm text-mist" aria-live="polite">
                {booking.captainLocation
                  ? captainAway != null && status === "arriving"
                    ? `Your captain is about ${captainAway < 1 ? `${Math.round(captainAway * 1000)} m` : `${captainAway.toFixed(1)} km`} away.`
                    : "Your captain's location is updating live."
                  : "Waiting for your captain's location."}
              </p>
            )}
            {active && (
              <div className="mt-5 flex flex-wrap gap-2">
                <a
                  href={directionsUrl(booking.map?.pickup ?? booking.pickup, { mode: "walking" })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
                >
                  <Footprints className="h-4 w-4 text-lime" aria-hidden="true" /> Directions to pick-up
                </a>
                <a
                  href={directionsUrl(booking.map?.drop ?? booking.drop, { origin: booking.map?.pickup ?? booking.pickup })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
                >
                  <MapIcon className="h-4 w-4 text-lime" aria-hidden="true" /> Route in Google Maps
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {booking.captain && active && (
            <div className="rounded-panel bg-card p-5 ring-1 ring-line sm:p-6">
              <div className="flex items-center gap-4">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-forest-2">
                  <VehicleIcon className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="font-bold">{booking.captain.name}</p>
                  <p className="text-sm text-ink-soft">{booking.captain.vehicle}</p>
                </div>
                <p className="ml-auto rounded-lg bg-canvas px-3 py-1.5 font-mono text-sm font-bold tracking-wider ring-1 ring-line">
                  {booking.captain.plate}
                </p>
              </div>
              {booking.otp && (
                <div className="mt-5 flex items-center justify-between rounded-2xl bg-lime/30 p-4">
                  <div className="flex items-center gap-3">
                    <KeyRound className="h-5 w-5 text-forest" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold">Ride OTP</p>
                      <p className="text-xs text-ink-soft">Share only after checking the vehicle number</p>
                    </div>
                  </div>
                  <p className="font-mono text-2xl font-extrabold tracking-[0.3em]" aria-label={`Ride OTP ${booking.otp.split("").join(" ")}`}>
                    {booking.otp}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={share} className={buttonClasses("outline-light", "lg", "w-full bg-card")}>
              <Share2 className="h-4 w-4" aria-hidden="true" /> Share trip
            </button>
            <button
              type="button"
              onClick={() => sosRef.current?.showModal()}
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-error font-semibold text-white transition-colors hover:bg-[#a92626]"
            >
              <ShieldAlert className="h-5 w-5" aria-hidden="true" /> SOS
            </button>
          </div>
          <p className="text-sm text-ink-soft" aria-live="polite">{shareMsg}</p>

          <div className="rounded-panel bg-card p-5 text-sm ring-1 ring-line sm:p-6">
            <div className="flex justify-between">
              <span className="text-ink-soft">Ride</span>
              <span className="font-semibold">{cat.name}</span>
            </div>
            <div className="mt-3 flex justify-between">
              <span className="text-ink-soft">Payment</span>
              <span className="font-semibold">{booking.paymentMethod}</span>
            </div>
            {booking.discount && (
              <div className="mt-3 flex justify-between">
                <span className="text-ink-soft">Offer applied</span>
                <span className="font-semibold text-forest-2">−{booking.discount}</span>
              </div>
            )}
            <div className="mt-3 flex justify-between">
              <span className="text-ink-soft">Fare</span>
              <span className="font-semibold">{booking.fare ?? "Shown once fares are connected"}</span>
            </div>
          </div>

          {booking.payment && <PaymentCard payment={booking.payment} state={payState} onPay={pay} />}

          {active ? (
            <button type="button" onClick={() => cancelRef.current?.showModal()} className="w-full py-2 text-sm font-semibold text-error hover:underline">
              Cancel ride
            </button>
          ) : (
            status === "cancelled" && (
              <Notice title="Ride cancelled">{session.demo ? "You won't be charged for this demo ride." : "This ride has been cancelled."}</Notice>
            )
          )}
        </div>
      </div>

      {/* SOS dialog */}
      <dialog
        ref={sosRef}
        aria-labelledby="sos-title"
        className="on-light m-auto w-[min(28rem,calc(100vw-2rem))] rounded-panel bg-card p-0 text-ink shadow-panel backdrop:bg-forest-ink/70"
      >
        <div className="p-6">
          <div className="flex items-start justify-between">
            <h2 id="sos-title" className="flex items-center gap-2 text-xl font-bold">
              <ShieldAlert className="h-6 w-6 text-error" aria-hidden="true" /> Emergency help
            </h2>
            <button type="button" onClick={() => sosRef.current?.close()} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-canvas">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">If you&apos;re in danger, call emergency services first.</p>
          <a href="tel:112" className="mt-5 flex h-14 items-center justify-center gap-2 rounded-full bg-error font-semibold text-white">
            <Phone className="h-5 w-5" aria-hidden="true" /> Call 112
          </a>
          <button type="button" onClick={alertSafetyTeam} disabled={sosState === "sending"} className={buttonClasses("outline-light", "lg", "mt-3 w-full")}>
            {sosState === "sending" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Alert GoQuicker safety team"}
          </button>
          <div aria-live="polite" className="mt-3">
            {sosState === "setup" && (
              <Notice tone="setup" title="Safety alerts aren't connected yet">
                No alert was sent. Please call 112 if you need help.
              </Notice>
            )}
            {sosState === "sent" && <Notice title="Safety team alerted">They have your trip details and will contact you.</Notice>}
          </div>
        </div>
      </dialog>

      {/* Cancel dialog */}
      <dialog
        ref={cancelRef}
        aria-labelledby="cancel-title"
        className="on-light m-auto w-[min(28rem,calc(100vw-2rem))] rounded-panel bg-card p-0 text-ink shadow-panel backdrop:bg-forest-ink/70"
      >
        <form
          method="dialog"
          className="p-6"
          onSubmit={(e) => {
            e.preventDefault();
            confirmCancel();
          }}
        >
          <h2 id="cancel-title" className="text-xl font-bold">Cancel this ride?</h2>
          <p className="mt-2 text-sm text-ink-soft">
            A fee may apply once a captain is on the way. See the{" "}
            <AppLink href="/cancellation-policy" className="font-semibold underline">cancellation policy</AppLink>.
          </p>
          <fieldset className="mt-5 space-y-2">
            <legend className="text-sm font-semibold">Why are you cancelling?</legend>
            {cancelReasons.map((r) => (
              <label key={r} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ring-1 ring-line has-[:checked]:ring-2 has-[:checked]:ring-forest">
                <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-forest-2" />
                <span className="text-sm">{r}</span>
              </label>
            ))}
          </fieldset>
          <div aria-live="polite" className="mt-3">
            {cancelState === "setup" && (
              <Notice tone="setup" title="Cancellation isn't connected yet">
                {session.demo ? "This is a demo ride, so there's nothing to cancel on the server." : "The ride service isn't connected yet, so nothing was cancelled."}
              </Notice>
            )}
            {cancelState === "error" && <p className="text-sm font-medium text-error">We couldn&apos;t cancel the ride. Please try again.</p>}
          </div>
          <div className="mt-5 flex gap-3">
            <button type="button" onClick={() => cancelRef.current?.close()} className={buttonClasses("outline-light", "md", "flex-1")}>
              Keep ride
            </button>
            <button type="submit" disabled={!reason || cancelState === "sending"} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-error font-semibold text-white disabled:opacity-50">
              {cancelState === "sending" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Cancel ride</>}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}


/** After drop-off: pay in the app, or a plain note on how the fare is settled. */
function PaymentCard({
  payment,
  state,
  onPay,
}: {
  payment: NonNullable<BookingSummary["payment"]>;
  state: { status: "idle" | "working" | "error"; message?: string };
  onPay: () => void;
}) {
  if (payment.status === "paid") {
    return (
      <Notice title="Paid">
        {payment.amount} paid{payment.online ? " online" : ""}. Thanks for riding with GoQuicker.
      </Notice>
    );
  }
  if (!payment.online) return <Notice title="Pay your captain">Please pay {payment.amount} in cash to your captain.</Notice>;
  if (!paymentsConfigured) {
    return (
      <Notice tone="setup" title="Online payments aren't connected yet">
        Please pay {payment.amount} to your captain directly. No money is taken on this site yet.
      </Notice>
    );
  }
  return (
    <div className="rounded-panel bg-card p-5 ring-1 ring-line sm:p-6">
      <p className="font-semibold">Fare due: {payment.amount}</p>
      <p className="mt-1 text-sm text-ink-soft">Pay securely with UPI, card or wallet through Razorpay.</p>
      <button type="button" onClick={onPay} disabled={state.status === "working"} className={buttonClasses("primary", "lg", "mt-4 w-full")}>
        {state.status === "working" ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Opening payment" /> : `Pay ${payment.amount}`}
      </button>
      <p role="status" className="mt-2 text-sm font-medium text-error">
        {state.status === "error" ? state.message : ""}
      </p>
    </div>
  );
}
