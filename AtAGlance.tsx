import { SectionHeading } from "@/components/ui/SectionHeading";

/** Facts about how the service works. No invented ride counts or ratings. */
const facts = [
  { value: "4", label: "Ride types" },
  { value: "5 sec", label: "Live location updates" },
  { value: "4-digit", label: "OTP to start every ride" },
  { value: "1 tap", label: "SOS during a trip" },
];

export function AtAGlance() {
  return (
    <section aria-labelledby="glance-title" className="on-light bg-card py-16 lg:py-20">
      <div className="container-gq">
        <SectionHeading title="Built Around Your Trip" align="center" id="glance-title" />
        <dl className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="flex flex-col items-center text-center">
              <dt className="order-2 mt-1.5 text-sm font-medium text-ink-soft">{f.label}</dt>
              <dd className="order-1 text-3xl font-bold tabular-nums text-ink sm:text-4xl">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
