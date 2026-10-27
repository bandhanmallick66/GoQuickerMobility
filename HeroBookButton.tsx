"use client";

import { ArrowRight } from "lucide-react";
import { site } from "@/config/site";
import { LinkButton } from "@/components/ui/Button";
import { bookingHref, useBooking } from "@/components/booking/BookingContext";

export function HeroBookButton() {
  const { category } = useBooking();
  return (
    <LinkButton href={bookingHref(category)} size="lg">
      {site.hero.primaryCta.label}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </LinkButton>
  );
}
