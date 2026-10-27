import { ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";

export function DriveWithUs() {
  return (
    <section aria-labelledby="drive-title" className="on-light bg-canvas py-16 lg:py-20">
      <div className="container-gq">
        <div className="grid overflow-hidden rounded-panel bg-forest-deep text-ivory lg:grid-cols-2">
          <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-14">
            <h2 id="drive-title" className="text-h2 font-bold">Drive with GoQuicker</h2>
            <p className="mt-4 max-w-md leading-relaxed text-mist">
              Own a car, auto rickshaw, bike or scooter? Apply to become a captain, go online when it suits you and
              take pick-up and drop-off rides in your city.
            </p>
            <div className="mt-7">
              <LinkButton href="/partners" size="lg">
                Become a Captain <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </LinkButton>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- static artwork */}
          <img
            src="/images/vehicles/fleet-city.webp"
            alt="Yellow taxi car, auto rickshaw, motorbike and scooter by a city skyline at dusk"
            loading="lazy"
            className="h-full min-h-64 w-full object-cover object-[50%_85%]"
          />
        </div>
      </div>
    </section>
  );
}
