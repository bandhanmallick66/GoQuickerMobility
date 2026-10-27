"use client";

import { ArrowRight } from "lucide-react";
import { site } from "@/config/site";
import { LinkButton } from "@/components/ui/Button";
import { bookingHref, useBooking } from "@/components/booking/BookingContext";

export function FinalCta() {
  const { category } = useBooking();
  return (
    <section aria-labelledby="final-cta-title" className="on-light bg-canvas pb-16 lg:pb-24">
      <div className="container-gq">
        <div className="relative isolate grid items-center gap-6 overflow-hidden rounded-panel bg-forest-deep px-6 ring-1 ring-line-dark py-10 text-ivory sm:px-10 lg:grid-cols-2 lg:px-14 lg:py-12">
          <div aria-hidden="true" className="absolute inset-y-0 left-0 -z-10 w-1/2 bg-[radial-gradient(circle_at_20%_30%,rgb(79_209_161/0.18),transparent_60%)]" />
          {/* eslint-disable-next-line @next/next/no-img-element -- static artwork */}
          <img
            src="/images/vehicles/fleet.webp"
            alt=""
            loading="lazy"
            className="order-2 mx-auto w-full max-w-md drop-shadow-[0_24px_24px_rgb(0_0_0/0.4)] lg:order-1"
          />
          <div className="order-1 text-center lg:order-2 lg:text-left">
            <h2 id="final-cta-title" className="text-h2 font-bold">{site.finalCta.heading}</h2>
            <p className="mt-3 text-mist">{site.finalCta.text}</p>
            <LinkButton href={bookingHref(category)} size="lg" className="mt-7">
              {site.finalCta.button} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
