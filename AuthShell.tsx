import { ShieldCheck } from "lucide-react";

/** Split layout for sign-in and registration. */
export function AuthShell({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="on-light grid min-h-[calc(100dvh-4.5rem)] bg-canvas lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-forest-ink lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative artwork */}
        <img src="/images/vehicles/fleet-city.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_80%] opacity-90" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-forest-ink via-forest-ink/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-ivory">
          <p className="max-w-sm text-3xl font-bold leading-tight">
            Your City. <span className="text-lime">Your Ride.</span>
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm text-mist">
            <ShieldCheck className="h-4 w-4 text-lime" aria-hidden="true" /> Sign in with your mobile number. No password needed.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center px-5 py-14 sm:px-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-extrabold">{title}</h1>
          <p className="mt-2 text-ink-soft">{intro}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
