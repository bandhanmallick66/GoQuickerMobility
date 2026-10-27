"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarDays,
  Check,
  CreditCard,
  Loader2,
  MapPin,
  Navigation,
  Smartphone,
  Tag,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { categories, getCategory, isCategoryId } from "@/config/categories";
import { paymentMethods, paymentsConfigured, type PaymentMethodId } from "@/config/payments";
import { demoMode } from "@/config/demo";
import { useBooking } from "@/components/booking/BookingContext";
import { LocationField } from "@/components/booking/LocationField";
import { RoutePreview } from "@/components/maps/RoutePreview";
import { AppLink } from "@/components/ui/AppLink";
import { buttonClasses } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { fieldBase } from "@/components/ui/Field";
import { applyPromo, createBooking } from "@/lib/api/client";
import { todayInMarket } from "@/lib/date";
import { searchRides, type RideEstimate } from "@/lib/api/rides";
import { mapsEnabled } from "@/lib/maps";
import { addRecentPlaces } from "@/lib/places";
import { emptyTrip, MAX_PASSENGERS, validateTrip, type TripDraft, type TripErrors } from "@/lib/trip";

const STORAGE_KEY = "gq:booking-draft";
const steps = ["Trip", "Ride", "Payment", "Review"] as const;
type Step = 0 | 1 | 2 | 3;

const stepFields: (keyof TripDraft)[][] = [
  ["pickup", "destination", "date", "time"],
  ["category", "passengers"],
  [],
  [],
];

const payIcons: Record<PaymentMethodId, LucideIcon> = { upi: Smartphone, card: CreditCard, wallet: Wallet, cash: Banknote };

interface Draft {
  trip: Omit<TripDraft, "category">;
  payment: PaymentMethodId | "";
  promo: string;
}

function draftFromParams(params: URLSearchParams): Draft {
  const trip = { ...emptyTrip };
  const pickup = params.get("pickup");
  const destination = params.get("destination");
  const date = params.get("date");
  const time = params.get("time");
  if (pickup) trip.pickup = pickup.slice(0, 200);
  if (destination) trip.destination = destination.slice(0, 200);
  if (date && time) {
    trip.when = "later";
    trip.date = date;
    trip.time = time;
  }
  return { trip, payment: "", promo: "" };
}

export function BookingFlow() {
  const params = useSearchParams();
  const { category, setCategory } = useBooking();
  const [draft, setDraft] = useState<Draft>(() => draftFromParams(new URLSearchParams(params.toString())));
  const [step, setStep] = useState<Step>(0);
  const [errors, setErrors] = useState<TripErrors & { payment?: string }>({});
  const [minDate, setMinDate] = useState<string>();
  const [promoState, setPromoState] = useState<{ status: "idle" | "checking" | "info" | "ok"; message?: string }>({ status: "idle" });
  const [submit, setSubmit] = useState<{ status: "idle" | "sending" | "not-configured" | "error" | "signin" | "ok"; message?: string; id?: string }>({
    status: "idle",
  });
  const [quotes, setQuotes] = useState<{ key: string; results: RideEstimate[] } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const uid = useId();
  const id = (n: string) => `${uid}-${n}`;

  // Category from the URL wins, then any remembered choice.
  useEffect(() => {
    const fromUrl = params.get("category");
    if (isCategoryId(fromUrl)) setCategory(fromUrl);
  }, [params, setCategory]);

  // Restore an unfinished booking from this tab, unless the URL brought a new trip.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client clock is unknown during prerender
    setMinDate(todayInMarket());
    if (params.get("pickup")) return;
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) setDraft((d) => ({ ...d, ...(JSON.parse(saved) as Draft) }));
    } catch {
      // ignore
    }
  }, [params]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // ignore
    }
  }, [draft]);

  const trip: TripDraft = { ...draft.trip, category };
  const selected = isCategoryId(category) ? getCategory(category) : null;
  const quoteKey = `${trip.pickup}|${trip.destination}`;
  const quoteFor = (c: string) => (quotes?.key === quoteKey ? quotes.results.find((r) => r.category === c) : undefined);
  const est = selected ? quoteFor(selected.id) : undefined;

  // Fares and nearby captains for every ride type, from GoQuicker's fare rules and live captain locations.
  useEffect(() => {
    if (step !== 1 && step !== 3) return;
    if (quotes?.key === quoteKey) return;
    const controller = new AbortController();
    searchRides({ ...trip, category: "" }, controller.signal)
      .then((res) => {
        if (res.status === "ok") setQuotes({ key: quoteKey, results: res.results });
      })
      .catch(() => {});
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only when the trip identity changes
  }, [step, quoteKey]);

  function updateTrip<K extends keyof TripDraft>(key: K, value: TripDraft[K]) {
    setDraft((d) => ({ ...d, trip: { ...d.trip, [key]: value } }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    if (submit.status !== "idle") setSubmit({ status: "idle" });
  }

  function go(next: Step) {
    setStep(next);
    requestAnimationFrame(() => {
      headingRef.current?.focus();
      headingRef.current?.scrollIntoView({ block: "nearest" });
    });
  }

  function validateStep(s: Step): boolean {
    const all = validateTrip(trip);
    const relevant: TripErrors & { payment?: string } = {};
    const keys = s === 3 ? stepFields.flat() : stepFields[s];
    for (const k of keys) if (all[k]) relevant[k] = all[k];
    if ((s === 2 || s === 3) && !draft.payment) relevant.payment = "Choose how you'd like to pay.";
    setErrors(relevant);
    const first = Object.keys(relevant)[0];
    if (first) {
      // Jump back to the step that owns the first problem.
      const owner = stepFields.findIndex((f) => f.includes(first as keyof TripDraft));
      const target = (owner >= 0 ? owner : first === "payment" ? 2 : s) as Step;
      if (target !== s) go(target);
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`[name="${first}"]`)?.focus());
      return false;
    }
    return true;
  }

  function next() {
    if (validateStep(step)) {
      if (step === 0) addRecentPlaces(trip.pickup, trip.destination);
      go((step + 1) as Step);
    }
  }

  async function checkPromo() {
    const code = draft.promo.trim();
    if (!code) return;
    setPromoState({ status: "checking" });
    const res = await applyPromo(code);
    if (res.status === "ok") setPromoState({ status: "ok", message: res.data.description });
    else if (res.status === "not-configured") setPromoState({ status: "info", message: "There are no active offers right now." });
    else setPromoState({ status: "info", message: res.message });
  }

  async function confirm() {
    if (submit.status === "sending" || !validateStep(3)) return;
    setSubmit({ status: "sending" });
    const res = await createBooking({ ...trip, payment: draft.payment, promo: draft.promo.trim() || undefined });
    if (res.status === "ok") {
      setSubmit({ status: "ok", id: res.data.id });
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {}
    } else if (res.status === "not-configured") setSubmit({ status: "not-configured" });
    else if (res.code === 401) setSubmit({ status: "signin" });
    else setSubmit({ status: "error", message: res.message });
  }

  const err = (k: string) => (errors as Record<string, string | undefined>)[k];

  return (
    <div className="on-light bg-canvas">
      <div className="container-gq grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:py-14">
        <div className="min-w-0">
          {/* Stepper */}
          <ol className="grid grid-cols-4 gap-2" aria-label="Booking steps">
            {steps.map((label, i) => {
              const done = i < step;
              const current = i === step;
              return (
                <li key={label}>
                  <button
                    type="button"
                    disabled={i > step}
                    onClick={() => go(i as Step)}
                    aria-current={current ? "step" : undefined}
                    className="group flex w-full flex-col gap-2 text-left disabled:cursor-default"
                  >
                    <span className={`h-1.5 rounded-full transition-colors duration-300 ${done || current ? "bg-forest" : "bg-line"}`} />
                    <span className={`flex items-center gap-1.5 text-xs font-semibold sm:text-sm ${current ? "text-ink" : done ? "text-forest-2" : "text-ink-soft"}`}>
                      {done && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                      <span className="sr-only">Step {i + 1}: </span>
                      {label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (step < 3) next();
              else confirm();
            }}
            className="mt-8 rounded-panel bg-card p-5 shadow-panel ring-1 ring-black/[0.03] sm:p-8"
          >
            <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold outline-none">
              {["Where are you going?", "Choose your ride", "How would you like to pay?", "Review and confirm"][step]}
            </h2>

            {step === 0 && (
              <div className="mt-6 space-y-5">
                <div className="divide-y divide-line rounded-2xl ring-1 ring-line">
                  <LocationField id={id("pickup")} name="pickup" label="Pick-up" placeholder="Enter pick-up address" icon={MapPin} value={trip.pickup} onChange={(v) => updateTrip("pickup", v)} error={err("pickup")} allowCurrentLocation />
                  <LocationField id={id("destination")} name="destination" label="Drop-off" placeholder="Where to?" icon={Navigation} value={trip.destination} onChange={(v) => updateTrip("destination", v)} error={err("destination")} />
                </div>
                <RoutePreview trip={trip} />
                <fieldset>
                  <legend className="text-sm font-semibold">When do you need it?</legend>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    {(["now", "later"] as const).map((w) => (
                      <label
                        key={w}
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl p-4 ring-1 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-forest-2 ${
                          trip.when === w ? "bg-forest text-ivory ring-forest" : "bg-card ring-line hover:ring-forest-2/40"
                        }`}
                      >
                        <input type="radio" name="when" value={w} checked={trip.when === w} onChange={() => updateTrip("when", w)} className="sr-only" />
                        {w === "now" ? <Navigation className="h-5 w-5" aria-hidden="true" /> : <CalendarDays className="h-5 w-5" aria-hidden="true" />}
                        <span className="font-semibold">{w === "now" ? "Leave now" : "Schedule"}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                {trip.when === "later" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor={id("date")} className="text-sm font-semibold">Date</label>
                      <input id={id("date")} name="date" type="date" min={minDate} value={trip.date} onChange={(e) => updateTrip("date", e.target.value)} aria-invalid={!!err("date")} aria-describedby={err("date") ? id("date-e") : undefined} className={fieldBase} />
                      {err("date") && <p id={id("date-e")} className="mt-1.5 text-xs font-medium text-error">{err("date")}</p>}
                    </div>
                    <div>
                      <label htmlFor={id("time")} className="text-sm font-semibold">Pick-up time</label>
                      <input id={id("time")} name="time" type="time" value={trip.time} onChange={(e) => updateTrip("time", e.target.value)} aria-invalid={!!err("time")} aria-describedby={err("time") ? id("time-e") : undefined} className={fieldBase} />
                      {err("time") && <p id={id("time-e")} className="mt-1.5 text-xs font-medium text-error">{err("time")}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="mt-6 space-y-5">
                <fieldset>
                  <legend className="sr-only">Ride type</legend>
                  <div className="grid gap-3">
                    {categories.map((c) => {
                      const on = category === c.id;
                      return (
                        <label
                          key={c.id}
                          className={`flex cursor-pointer items-center gap-4 rounded-2xl p-3 ring-1 transition-[box-shadow,background-color] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-forest-2 sm:p-4 ${
                            on ? "bg-forest/[0.04] ring-2 ring-forest" : "ring-line hover:ring-forest-2/40"
                          }`}
                        >
                          <input
                            type="radio"
                            name="category"
                            value={c.id}
                            checked={on}
                            onChange={() => {
                              setCategory(c.id);
                              setErrors((e) => ({ ...e, category: undefined }));
                            }}
                            className="sr-only"
                          />
                          <span className="grid h-16 w-24 shrink-0 place-items-center rounded-xl bg-canvas p-1.5 sm:w-28">
                            {/* eslint-disable-next-line @next/next/no-img-element -- static artwork */}
                            <img src={c.image.src} alt="" className="max-h-full" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-bold">{c.name}</span>
                            <span className="mt-0.5 block text-sm leading-snug text-ink-soft">{c.description}</span>
                          </span>
                          <RideQuote quote={quoteFor(c.id)} />
                          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ring-2 ${on ? "bg-forest ring-forest text-lime" : "ring-line"}`}>
                            {on && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {err("category") && <p className="mt-2 text-xs font-medium text-error">{err("category")}</p>}
                </fieldset>
                {selected?.asksPassengers && (
                  <div className="max-w-[10rem]">
                    <label htmlFor={id("passengers")} className="text-sm font-semibold">Passengers</label>
                    <input id={id("passengers")} name="passengers" type="number" inputMode="numeric" min={1} max={MAX_PASSENGERS} value={trip.passengers} onChange={(e) => updateTrip("passengers", e.target.value)} aria-invalid={!!err("passengers")} className={fieldBase} />
                    {err("passengers") && <p className="mt-1.5 text-xs font-medium text-error">{err("passengers")}</p>}
                  </div>
                )}
                {selected && !selected.asksPassengers && <p className="text-sm text-ink-soft">{selected.name} rides carry one passenger. Wear a helmet for the whole ride.</p>}
              </div>
            )}

            {step === 2 && (
              <div className="mt-6 space-y-6">
                {!paymentsConfigured && (
                  <Notice tone="setup" title="Online payments aren't connected yet">
                    You can choose how you&apos;d like to pay. No money is taken on this site until GoQuicker&apos;s payment provider is live.
                  </Notice>
                )}
                <fieldset>
                  <legend className="sr-only">Payment method</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {paymentMethods
                      .filter((m) => m.enabled)
                      .map((m) => {
                        const Icon = payIcons[m.id];
                        const on = draft.payment === m.id;
                        return (
                          <label
                            key={m.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-2xl p-4 ring-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-forest-2 ${
                              on ? "ring-2 ring-forest bg-forest/[0.04]" : "ring-line hover:ring-forest-2/40"
                            }`}
                          >
                            <input
                              type="radio"
                              name="payment"
                              value={m.id}
                              checked={on}
                              onChange={() => {
                                setDraft((d) => ({ ...d, payment: m.id }));
                                setErrors((e) => ({ ...e, payment: undefined }));
                              }}
                              className="sr-only"
                            />
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-canvas text-forest-2">
                              <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                            </span>
                            <span className="min-w-0">
                              <span className="block font-semibold">{m.label}</span>
                              <span className="block text-xs text-ink-soft">{m.hint}</span>
                            </span>
                          </label>
                        );
                      })}
                  </div>
                  {err("payment") && <p className="mt-2 text-xs font-medium text-error">{err("payment")}</p>}
                </fieldset>
                <div>
                  <label htmlFor={id("promo")} className="text-sm font-semibold">
                    Promo code <span className="font-normal text-ink-soft">(optional)</span>
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
                      <input
                        id={id("promo")}
                        value={draft.promo}
                        onChange={(e) => {
                          setDraft((d) => ({ ...d, promo: e.target.value.toUpperCase().slice(0, 20) }));
                          setPromoState({ status: "idle" });
                        }}
                        placeholder="Enter code"
                        autoComplete="off"
                        className={`${fieldBase} mt-0 pl-10 uppercase`}
                      />
                    </div>
                    <button type="button" onClick={checkPromo} disabled={!draft.promo.trim() || promoState.status === "checking"} className={buttonClasses("outline-light", "md", "h-12 shrink-0")}>
                      {promoState.status === "checking" ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Checking" /> : "Apply"}
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-ink-soft" aria-live="polite">
                    {promoState.message}
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="mt-6 space-y-5">
                <dl className="divide-y divide-line rounded-2xl ring-1 ring-line">
                  <SummaryRow label="Pick-up" value={trip.pickup} onEdit={() => go(0)} />
                  <SummaryRow label="Drop-off" value={trip.destination} onEdit={() => go(0)} />
                  <SummaryRow label="When" value={trip.when === "now" ? "Leave now" : `${trip.date} at ${trip.time}`} onEdit={() => go(0)} />
                  <SummaryRow
                    label="Ride"
                    value={selected ? `${selected.name}${selected.asksPassengers ? ` · ${trip.passengers} passenger${trip.passengers === "1" ? "" : "s"}` : ""}` : "Not chosen"}
                    onEdit={() => go(1)}
                  />
                  <SummaryRow label="Payment" value={paymentMethods.find((m) => m.id === draft.payment)?.label ?? "Not chosen"} onEdit={() => go(2)} />
                  <div className="flex items-center justify-between gap-4 px-4 py-4">
                    <dt className="text-sm font-semibold">Fare estimate</dt>
                    <dd className="text-right text-sm text-ink-soft">
                      {est ? (
                        <span className="font-semibold text-ink">{`${est.fareLabel} · ${est.distanceKm} km, about ${est.minutes} min`}</span>
                      ) : (
                        "Shown here once fares are connected"
                      )}
                    </dd>
                  </div>
                </dl>
                <p className="text-xs leading-relaxed text-ink-soft">
                  You&apos;ll confirm with your mobile number before the ride is requested. By confirming you agree to the{" "}
                  <AppLink href="/terms" className="underline">Terms</AppLink> and{" "}
                  <AppLink href="/cancellation-policy" className="underline">Cancellation policy</AppLink>.
                </p>
                <div aria-live="polite">
                  {submit.status === "not-configured" && (
                    <Notice tone="setup" title="Booking isn't live yet">
                      Your trip details are complete, but GoQuicker&apos;s booking service isn&apos;t connected, so nothing has been reserved and
                      you haven&apos;t been charged.
                      {demoMode && (
                        <>
                          {" "}
                          <AppLink href="/account/bookings/demo" className="font-semibold text-forest-2 underline">
                            Preview the ride screen (demo)
                          </AppLink>
                        </>
                      )}
                    </Notice>
                  )}
                  {submit.status === "error" && (
                    <p role="alert" className="rounded-2xl bg-error/10 p-4 text-sm font-medium text-error">
                      {submit.message} Your details are still here.
                    </p>
                  )}
                  {submit.status === "signin" && (
                    <Notice title="Sign in to request this ride">
                      Your trip is saved on this page.{" "}
                      <AppLink href={`/login?next=${encodeURIComponent("/book")}`} className="font-semibold text-forest-2 underline">
                        Sign in with your mobile number
                      </AppLink>{" "}
                      and come back to confirm.
                    </Notice>
                  )}
                  {submit.status === "ok" && (
                    <Notice title="Ride requested">
                      We&apos;re finding a captain for you.{" "}
                      {submit.id && (
                        <AppLink href={`/account/bookings/${submit.id}`} className="font-semibold text-forest-2 underline">
                          Track your ride
                        </AppLink>
                      )}
                    </Notice>
                  )}
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
              {step > 0 ? (
                <button type="button" onClick={() => go((step - 1) as Step)} className={buttonClasses("outline-light", "md")}>
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
                </button>
              ) : (
                <span />
              )}
              <button type="submit" disabled={submit.status === "sending"} aria-busy={submit.status === "sending"} className={buttonClasses(step === 3 ? "primary" : "dark", "lg")}>
                {submit.status === "sending" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Requesting…
                  </>
                ) : step === 3 ? (
                  <>Request ride <ArrowRight className="h-4 w-4" aria-hidden="true" /></>
                ) : (
                  <>Continue <ArrowRight className="h-4 w-4 text-lime" aria-hidden="true" /></>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Trip summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Trip summary">
          <div className="overflow-hidden rounded-panel bg-forest text-ivory shadow-panel">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- decorative map artwork */}
              <img src="/images/benefits-route.svg" alt="" className="aspect-[16/10] w-full object-cover opacity-90" />
              {!mapsEnabled && (
                <span className="absolute bottom-3 left-3 rounded-full bg-forest-ink/80 px-3 py-1 text-[0.7rem] text-mist backdrop-blur">
                  Live map appears once maps are connected
                </span>
              )}
            </div>
            <div className="space-y-4 p-5">
              <SummaryLine icon={MapPin} label="Pick-up" value={trip.pickup || "Not set"} />
              <SummaryLine icon={Navigation} label="Drop-off" value={trip.destination || "Not set"} />
              <SummaryLine icon={CalendarDays} label="When" value={trip.when === "now" ? "Leave now" : trip.date && trip.time ? `${trip.date}, ${trip.time}` : "Choose a time"} />
              <div className="border-t border-line-dark pt-4 text-sm">
                <p className="text-mist">Ride</p>
                <p className="mt-0.5 font-semibold">{selected?.name ?? "Not chosen yet"}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-4">
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{label}</dt>
        <dd className="mt-0.5 break-words font-medium">{value || "Not set"}</dd>
      </div>
      <button type="button" onClick={onEdit} className="shrink-0 text-sm font-semibold text-forest-2 hover:underline" aria-label={`Edit ${label.toLowerCase()}`}>
        Edit
      </button>
    </div>
  );
}

function SummaryLine({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-lime" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-mist">{label}</p>
        <p className="break-words font-semibold">{value}</p>
      </div>
    </div>
  );
}

/** Fare and nearby captains for one ride type, or a plain note when they aren't available. */
function RideQuote({ quote }: { quote?: RideEstimate }) {
  if (!quote) {
    return (
      <span className="hidden shrink-0 text-right text-xs text-ink-soft sm:block">
        Fare shown
        <br />
        on review
      </span>
    );
  }
  const near = quote.nearby;
  return (
    <span className="shrink-0 text-right text-xs text-ink-soft">
      <span className="block text-sm font-bold text-ink">{quote.fareLabel}</span>
      {near &&
        (near.count > 0 ? (
          <span className="text-forest-2">
            {near.count} nearby{near.etaMin != null && ` · ${near.etaMin} min`}
          </span>
        ) : (
          "None nearby now"
        ))}
    </span>
  );
}
