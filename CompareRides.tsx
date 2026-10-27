import { AppLink as Link } from "@/components/ui/AppLink";
import { Check } from "lucide-react";
import { categories } from "@/config/categories";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { CategoryId } from "@/lib/types";

/**
 * Side-by-side comparison of the ride types. Fares depend on the trip and the
 * owner's fare rules, so the price bar sends riders to an estimate instead of
 * showing a made-up starting price.
 */
const details: Record<CategoryId, string[]> = {
  cars: ["Passengers chosen when you book", "Room for bags", "Best for longer trips"],
  "auto-rickshaw": ["Passengers chosen when you book", "Open-air city rides", "Best for everyday errands"],
  bike: ["One passenger, helmet required", "Two-wheeler routes", "Best for beating traffic"],
  scooter: ["One passenger, helmet required", "Two-wheeler routes", "Best for short hops"],
};

export function CompareRides() {
  return (
    <section aria-labelledby="compare-title" className="on-light bg-card py-16 lg:py-24">
      <div className="container-gq">
        <SectionHeading title="Compare Our Rides" align="center" id="compare-title" intro="Enter your trip to see the exact fare for each ride before you confirm." />
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
          {categories.map((c, i) => {
            const featured = i === 0;
            return (
              <li
                key={c.id}
                className={`flex flex-col overflow-hidden rounded-card bg-card ${featured ? "ring-2 ring-brand" : "ring-1 ring-line"}`}
              >
                <div className="p-5">
                  <h3 className="font-bold">{c.name}</h3>
                  {/* eslint-disable-next-line @next/next/no-img-element -- static artwork */}
                  <img src={c.image.src} alt="" loading="lazy" className="mx-auto mt-3 h-28 w-full object-contain" />
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">What you get</p>
                  <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
                    {details[c.id].map((d) => (
                      <li key={d} className="flex gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-2" aria-hidden="true" /> {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href={`/book?category=${c.id}`}
                  className="mt-auto flex items-center justify-between bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
                >
                  <span>Estimated fare</span>
                  <span>Get a quote →</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
