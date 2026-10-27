"use client";

import { AppLink as Link } from "@/components/ui/AppLink";
import { ArrowRight, Check } from "lucide-react";
import { categories } from "@/config/categories";
import { useBooking } from "@/components/booking/BookingContext";
import { SectionHeading } from "@/components/ui/SectionHeading";

/** "Ride Options": one card per service. Picking a card carries it into the booking form. */
export function CategorySection() {
  const { category, setCategory } = useBooking();

  return (
    <section aria-labelledby="categories-title" className="on-light bg-canvas py-16 lg:py-24">
      <div className="container-gq">
        <SectionHeading
          title="Ride Options"
          align="center"
          id="categories-title"
          intro="Four ways to get around town. Pick one and we'll carry it into your booking."
        />

        <ul className="no-scrollbar -mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-3 pt-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:mt-12 lg:grid-cols-4 lg:gap-5">
          {categories.map((c) => {
            const active = category === c.id;
            const features = c.features.filter((f) => f.enabled);
            return (
              <li
                key={c.id}
                id={`category-${c.id}`}
                className={`group relative flex w-[78%] shrink-0 snap-start flex-col rounded-card bg-card p-4 transition-[box-shadow,transform] duration-300 ease-out-soft sm:w-auto ${
                  active ? "shadow-lift ring-2 ring-brand" : "ring-1 ring-line hover:-translate-y-1 hover:shadow-lift"
                }`}
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-b from-brand-soft to-card">
                  {/* eslint-disable-next-line @next/next/no-img-element -- static artwork */}
                  <img
                    src={c.image.src}
                    alt={c.image.alt}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-contain p-4 transition-transform duration-500 ease-out-soft group-hover:scale-[1.04]"
                  />
                  {active && (
                    <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[0.7rem] font-bold text-white">
                      <Check className="h-3 w-3" aria-hidden="true" /> Selected
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-lg font-bold">
                  {/* The whole card selects the category; the Book link sits above it. */}
                  <button
                    type="button"
                    onClick={() => setCategory(active ? "" : c.id)}
                    aria-pressed={active}
                    className="text-left after:absolute after:inset-0 after:rounded-card after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-forest-2"
                  >
                    {c.name}
                  </button>
                </h3>
                <ul className="mb-4 mt-2 space-y-1.5 text-sm text-ink-soft">
                  {features.map((f) => (
                    <li key={f.label} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 shrink-0 text-forest-2" aria-hidden="true" /> {f.label}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
                  <p className="text-xs font-medium text-ink-soft">Fare shown before you confirm</p>
                  <Link
                    href={`/book?category=${c.id}`}
                    onClick={() => setCategory(c.id)}
                    aria-label={c.cta.label}
                    className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand text-white transition-colors hover:bg-brand-hover"
                  >
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
