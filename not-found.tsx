import { ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="relative overflow-hidden bg-forest-ink text-ivory">
      <div className="container-gq grid min-h-[70dvh] items-center gap-10 py-16 lg:grid-cols-2">
        <div>
          <p className="eyebrow text-lime">Error 404</p>
          <h1 className="mt-4 text-display font-extrabold">Wrong turn.</h1>
          <p className="mt-5 max-w-md text-lg text-mist">We couldn&apos;t find that page. Let&apos;s get you back on the road.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/" size="lg">Go home</LinkButton>
            <LinkButton href="/book" variant="ghost-dark" size="lg">
              Book a ride <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </LinkButton>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative artwork */}
        <img src="/images/vehicles/bike.webp" alt="" className="mx-auto w-full max-w-md opacity-90" />
      </div>
    </section>
  );
}
