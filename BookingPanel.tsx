"use client";

import { AppLink as Link } from "@/components/ui/AppLink";
import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowRight,
  Bike,
  CalendarDays,
  CarTaxiFront,
  CarFront,
  ChevronDown,
  Clock3,
  Hourglass,
  Info,
  Loader2,
  MapPin,
  Navigation,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from "lucide-react";
import { categories, getCategory, isCategoryId } from "@/config/categories";
import { rentalPackages, tripTypes, type TripTypeId } from "@/config/trips";
import { site } from "@/config/site";
import { useBooking } from "@/components/booking/BookingContext";
import { LocationField } from "@/components/booking/LocationField";
import { buttonClasses } from "@/components/ui/Button";
import { searchRides, type RideEstimate, type RideSearchResult } from "@/lib/api/rides";
import { todayInMarket } from "@/lib/date";
import { addRecentPlaces } from "@/lib/places";
import { placesConfigured } from "@/lib/api/places";
import type { CategoryId } from "@/lib/types";
import {
  emptyTrip,
  MAX_PASSENGERS,
  tripToSearchParams,
  tripTypeFor,
  validateTrip,
  type TripDraft,
  type TripErrors,
} from "@/lib/trip";

type Status = "idle" | "searching" | "empty" | RideSearchResult["status"];

const fieldShell =
  "group relative flex min-w-0 flex-1 items-start gap-3 rounded-2xl px-4 py-3 transition-colors focus-within:bg-canvas hover:bg-canvas/70";
const labelCls = "block text-[0.8rem] font-semibold text-ink";
const inputCls =
  "mt-0.5 block w-full min-w-0 bg-transparent text-[0.9rem] text-ink outline-none placeholder:text-ink-soft [color-scheme:light] dark:[color-scheme:dark]";
const errorCls = "mt-1 text-xs font-medium text-error";
const boxCls = "ring-1 ring-inset ring-line rounded-xl bg-card";
const categoryIcons: Record<CategoryId, LucideIcon> = { cars: CarFront, "auto-rickshaw": CarTaxiFront, bike: Bike, scooter: Bike };
// Trip types offered by at least one category; the selector only shows when there is a choice.
const allTripTypes = (Object.keys(tripTypes) as TripTypeId[]).filter((t) =>
  categories.some((c) => c.tripTypes.includes(t)),
);

export function BookingPanel() {
  const { category, setCategory } = useBooking();
  const [trip, setTrip] = useState<Omit<TripDraft, "category">>(emptyTrip);
  const [errors, setErrors] = useState<TripErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [estimates, setEstimates] = useState<RideEstimate[]>([]);
  const [moreOpen, setMoreOpen] = useState(false);
  const [minDate, setMinDate] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;

  // "Today" depends on the market time zone and the visitor's clock, so it is set after mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- client clock is unknown during prerender
  useEffect(() => setMinDate(todayInMarket()), []);

  const selected = isCategoryId(category) ? getCategory(category) : null;
  // A category picked elsewhere on the page may not support the current trip type.
  const tripType = tripTypeFor(category, trip.tripType);
  const current: TripDraft = { ...trip, tripType, category };
  const isRental = tripType === "rental";
  const offeredTripTypes = selected ? selected.tripTypes : allTripTypes;

  function resetStatus() {
    if (status !== "idle" && status !== "searching") setStatus("idle");
  }

  function update<K extends keyof TripDraft>(key: K, value: TripDraft[K]) {
    setTrip((t) => ({ ...t, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
    resetStatus();
  }

  function chooseTripType(next: TripTypeId) {
    update("tripType", next);
    // Rental and outstation belong to specific categories; move the selection along with the rider.
    if (!selected || !selected.tripTypes.includes(next)) {
      const fallback = categories.find((c) => c.tripTypes.includes(next));
      if (fallback) setCategory(fallback.id);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "searching") return;
    const found = validateTrip(current);
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      if (firstInvalid === "passengers" || firstInvalid === "returnDate") setMoreOpen(true);
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus(),
      );
      return;
    }
    addRecentPlaces(current.pickup, isRental ? "" : current.destination);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("searching");
    try {
      const result = await searchRides(current, controller.signal);
      setStatus(result.status === "ok" && result.results.length === 0 ? "empty" : result.status);
      setEstimates(result.status === "ok" ? result.results : []);
      setMessage(result.status === "error" ? result.message : "");
    } catch {
      // Aborted by a newer search.
    }
  }

  const errId = (k: keyof TripDraft) => (errors[k] ? id(`${k}-error`) : undefined);
  const continueHref = `/book?${tripToSearchParams(current).toString()}`;

  return (
    <section aria-labelledby="book-your-ride" className="on-light relative z-10">
      {/* Navy band behind the top of the card, as in the reference layout */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-28 bg-forest-deep sm:h-32" />
      <div className="container-gq relative pt-8 sm:pt-10">
        <form
          ref={formRef}
          onSubmit={onSubmit}
          noValidate
          className="mx-auto max-w-5xl rounded-panel bg-card p-4 shadow-panel ring-1 ring-line sm:p-7"
        >
          <div className="flex flex-col items-center gap-4 pb-5 text-center">
            <h2 id="book-your-ride" className="text-2xl font-bold sm:text-[1.75rem]">Book Your Ride</h2>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {offeredTripTypes.length > 1 && (
                <div role="radiogroup" aria-label="Trip type" className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl bg-canvas p-1">
                  {offeredTripTypes.map((t) => {
                    const on = tripType === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        title={tripTypes[t].hint}
                        onClick={() => chooseTripType(t)}
                        className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                          on ? "bg-brand text-white shadow-sm" : "text-ink-soft hover:text-ink"
                        }`}
                      >
                        {tripTypes[t].label}
                      </button>
                    );
                  })}
                </div>
              )}
              <div role="radiogroup" aria-label="When" className="flex gap-1 rounded-xl bg-canvas p-1">
                {(["now", "later"] as const).map((w) => (
                  <button
                    key={w}
                    type="button"
                    role="radio"
                    aria-checked={trip.when === w}
                    onClick={() => update("when", w)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                      trip.when === w ? "bg-brand text-white shadow-sm" : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    {w === "now" ? "Leave now" : (
                      <>
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> Schedule
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <LocationField
              id={id("pickup")}
              name="pickup"
              label="Pickup location"
              placeholder="Enter pickup address"
              icon={MapPin}
              value={trip.pickup}
              onChange={(v) => update("pickup", v)}
              error={errors.pickup}
              allowCurrentLocation
              className={boxCls}
            />

            {isRental ? (
              <div className={`${fieldShell} ${boxCls}`}>
                <Hourglass className="mt-1 h-5 w-5 shrink-0 text-forest-2" strokeWidth={1.8} aria-hidden="true" />
                <div className="relative min-w-0 flex-1">
                  <label htmlFor={id("rentalPackage")} className={labelCls}>Rental duration</label>
                  <select
                    id={id("rentalPackage")}
                    name="rentalPackage"
                    value={trip.rentalPackage}
                    onChange={(e) => update("rentalPackage", e.target.value)}
                    aria-invalid={!!errors.rentalPackage}
                    aria-describedby={errId("rentalPackage")}
                    className={`${inputCls} appearance-none pr-6 ${trip.rentalPackage ? "" : "text-ink-soft"}`}
                  >
                    <option value="">How long?</option>
                    {rentalPackages.map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-0 top-6 h-4 w-4 text-ink-soft" aria-hidden="true" />
                  {errors.rentalPackage && <p id={errId("rentalPackage")} className={errorCls}>{errors.rentalPackage}</p>}
                </div>
              </div>
            ) : (
              <LocationField
                id={id("destination")}
                name="destination"
                label={tripType === "outstation" ? "Destination city" : "Drop-off location"}
                placeholder="Where to?"
                icon={Navigation}
                value={trip.destination}
                onChange={(v) => update("destination", v)}
                error={errors.destination}
                className={boxCls}
              />
            )}

            {trip.when === "later" && (
              <>
                <div className={`${fieldShell} ${boxCls}`}>
                  <CalendarDays className="mt-1 h-5 w-5 shrink-0 text-forest-2" strokeWidth={1.8} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <label htmlFor={id("date")} className={labelCls}>Pickup date</label>
                    <input
                      id={id("date")}
                      name="date"
                      type="date"
                      min={minDate}
                      value={trip.date}
                      onChange={(e) => update("date", e.target.value)}
                      aria-invalid={!!errors.date}
                      aria-describedby={errId("date")}
                      className={`${inputCls} ${trip.date ? "" : "text-ink-soft"}`}
                    />
                    {errors.date && <p id={errId("date")} className={errorCls}>{errors.date}</p>}
                  </div>
                </div>
                <div className={`${fieldShell} ${boxCls}`}>
                  <Clock3 className="mt-1 h-5 w-5 shrink-0 text-forest-2" strokeWidth={1.8} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <label htmlFor={id("time")} className={labelCls}>Pickup time</label>
                    <input
                      id={id("time")}
                      name="time"
                      type="time"
                      value={trip.time}
                      onChange={(e) => update("time", e.target.value)}
                      aria-invalid={!!errors.time}
                      aria-describedby={errId("time")}
                      className={`${inputCls} ${trip.time ? "" : "text-ink-soft"}`}
                    />
                    {errors.time && <p id={errId("time")} className={errorCls}>{errors.time}</p>}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Ride type pills + search */}
          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <p id={id("category-label")} className="shrink-0 text-sm font-semibold text-ink">Ride Type</p>
              <div
                role="radiogroup"
                aria-labelledby={id("category-label")}
                aria-describedby={errId("category")}
                className="flex flex-wrap gap-2"
              >
                {categories.map((c) => {
                  const on = category === c.id;
                  const Icon = categoryIcons[c.id];
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="radio"
                      name="category"
                      aria-checked={on}
                      onClick={() => {
                        setCategory(on ? "" : c.id);
                        if (errors.category) setErrors((er) => ({ ...er, category: undefined, tripType: undefined }));
                        resetStatus();
                      }}
                      className={`inline-flex h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold ring-1 ring-inset transition-colors duration-200 ${
                        on ? "bg-brand text-white ring-brand" : "bg-card text-ink ring-line hover:ring-forest-2/50"
                      }`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              type="submit"
              disabled={status === "searching"}
              aria-busy={status === "searching"}
              className={buttonClasses("primary", "lg", "w-full shrink-0 whitespace-nowrap lg:w-auto")}
            >
              {status === "searching" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Searching…
                </>
              ) : (
                <>
                  {site.bookingCta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
          {errors.category && <p id={errId("category")} className={errorCls}>{errors.category}</p>}

          {/* Contextual options */}
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              aria-expanded={moreOpen}
              aria-controls={id("more")}
              className="inline-flex items-center gap-2 py-1 text-sm font-semibold text-forest-2 hover:text-forest"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              {moreOpen ? "Fewer options" : "More options"}
            </button>
            <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-soft">
              <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Your saved and recent places stay on this device.
              {placesConfigured ? " Start typing to see address suggestions." : " Address suggestions arrive once maps are connected."}
            </p>
          </div>

          <div id={id("more")} hidden={!moreOpen} className="pb-2 pt-4">
            {!selected ? (
              <p className="text-sm text-ink-soft">Choose a ride type to see the options that apply to it.</p>
            ) : (
              <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
                {selected.asksPassengers && (
                  <div>
                    <label htmlFor={id("passengers")} className={labelCls}>
                      <Users className="mr-1.5 inline h-4 w-4 text-forest-2" aria-hidden="true" />
                      Passengers
                    </label>
                    <input
                      id={id("passengers")}
                      name="passengers"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={MAX_PASSENGERS}
                      value={trip.passengers}
                      onChange={(e) => update("passengers", e.target.value)}
                      aria-invalid={!!errors.passengers}
                      aria-describedby={errId("passengers")}
                      className="mt-1.5 h-11 w-24 rounded-xl border border-line bg-card px-3 text-sm outline-none focus:border-forest-2"
                    />
                    {errors.passengers && <p id={errId("passengers")} className={errorCls}>{errors.passengers}</p>}
                  </div>
                )}
                {tripType === "outstation" ? (
                  <div className="flex flex-col gap-2">
                    <label className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        name="returnTrip"
                        checked={trip.returnTrip}
                        onChange={(e) => update("returnTrip", e.target.checked)}
                        className="h-4 w-4 accent-forest-2"
                      />
                      Round trip
                    </label>
                    {trip.returnTrip && (
                      <div>
                        <label htmlFor={id("returnDate")} className={labelCls}>Return date</label>
                        <input
                          id={id("returnDate")}
                          name="returnDate"
                          type="date"
                          min={(trip.when === "later" && trip.date) || minDate}
                          value={trip.returnDate}
                          onChange={(e) => update("returnDate", e.target.value)}
                          aria-invalid={!!errors.returnDate}
                          aria-describedby={errId("returnDate")}
                          className="mt-1.5 h-11 rounded-xl border border-line bg-card px-3 text-sm outline-none [color-scheme:light] dark:[color-scheme:dark] focus:border-forest-2"
                        />
                        {errors.returnDate && <p id={errId("returnDate")} className={errorCls}>{errors.returnDate}</p>}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-ink-soft">
                    {selected.tripTypes.includes("outstation")
                      ? "Choose Outstation above to plan a round trip."
                      : `${selected.name} rides are one way, from pick-up to drop-off.`}
                  </p>
                )}
              </div>
            )}
          </div>

          {errors.tripType && <p className={errorCls}>{errors.tripType}</p>}

          {/* Result states */}
          <div aria-live="polite">
            {status === "not-configured" && (
              <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-relaxed">
                  <span className="font-semibold">Your trip details look good.</span>{" "}
                  <span className="text-ink-soft">
                    Live ride search isn&apos;t connected yet, so this preview can&apos;t show available rides or fares.
                  </span>
                </p>
                <Link href={continueHref} className={buttonClasses("primary", "sm", "shrink-0")}>
                  Continue to booking <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            )}
            {status === "ok" && (
              <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm">
                  <p className="font-semibold">Estimated fares for your trip</p>
                  <ul className="mt-1 space-y-0.5 text-ink-soft">
                    {estimates.map((e) => (
                      <li key={e.category}>
                        {e.name}: <span className="font-semibold text-ink">{e.fareLabel}</span> · {e.distanceKm} km, about {e.minutes} min
                        {e.nearby &&
                          (e.nearby.count > 0 ? (
                            <span className="text-forest-2">
                              {" "}
                              · {e.nearby.count} captain{e.nearby.count === 1 ? "" : "s"} nearby
                              {e.nearby.etaMin != null && `, about ${e.nearby.etaMin} min away`}
                            </span>
                          ) : (
                            " · no captains nearby right now"
                          ))}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href={continueHref} className={buttonClasses("primary", "sm", "shrink-0")}>
                  See your options <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            )}
            {status === "empty" && (
              <p className="mt-4 rounded-2xl bg-canvas p-4 text-sm">
                <span className="font-semibold">No rides match this trip yet.</span>{" "}
                <span className="text-ink-soft">Try a different time or ride type.</span>
              </p>
            )}
            {status === "error" && (
              <p role="alert" className="mt-4 rounded-2xl bg-error/10 p-4 text-sm font-medium text-error">
                {message} Your details are still here.
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
