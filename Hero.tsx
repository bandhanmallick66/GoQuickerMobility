import { ShieldCheck, MapPinned, ReceiptIndianRupee } from "lucide-react";
import { site } from "@/config/site";
import { HeroBookButton } from "./HeroBookButton";

const highlights = [
  { icon: ReceiptIndianRupee, label: "Fare shown before you confirm" },
  { icon: MapPinned, label: "Live trip tracking" },
  { icon: ShieldCheck, label: "OTP-verified pickups" },
];

export function Hero() {
  const [line1, line2] = site.hero.headline;
  return (
    <section
      aria-labelledby="hero-title"
      className="on-light relative isolate overflow-hidden bg-gradient-to-br from-brand-soft via-canvas to-canvas"
    >
      <div aria-hidden="true" className="absolute -right-40 top-10 -z-10 h-[30rem] w-[30rem] rounded-full bg-lime/20 blur-3xl" />
      <div className="container-gq grid items-center gap-10 pb-12 pt-12 sm:pt-16 lg:grid-cols-2 lg:gap-6 lg:pb-16 lg:pt-20">
        <div className="max-w-xl">
          <h1 id="hero-title" className="text-[clamp(2.4rem,1.5rem+3.2vw,4.1rem)] font-bold leading-[1.06] text-ink">
            <span className="block">{line1}</span>
            <span className="block">{line2}</span>
          </h1>
          <p className="mt-5 max-w-md text-[1.05rem] leading-relaxed text-ink-soft">{site.hero.description}</p>
          <div className="mt-8">
            <HeroBookButton />
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-3">
            {highlights.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-sm font-medium text-ink-soft">
                <Icon className="h-4 w-4 text-forest-2" strokeWidth={1.9} aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <div aria-hidden="true" className="absolute inset-x-[8%] bottom-[6%] top-[12%] -z-10 rounded-[45%] bg-card/70 ring-1 ring-line" />
          {/* eslint-disable-next-line @next/next/no-img-element -- static artwork */}
          <img
            src="/images/vehicles/fleet.webp"
            alt="GoQuicker rides: yellow taxi car, auto rickshaw, motorbike and scooter"
            fetchPriority="high"
            className="relative w-full drop-shadow-[0_30px_30px_rgb(15_26_43/0.25)]"
          />
        </div>
      </div>
    </section>
  );
}
