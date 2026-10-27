"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { getCategory } from "@/config/categories";
import { demoBookings, type BookingSummary } from "@/config/demo";
import { AppLink } from "@/components/ui/AppLink";
import { LinkButton } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { getApi } from "@/lib/api/client";
import { useSession } from "@/lib/session";
import { AccountLoading } from "./AccountLoading";
import { SignInRequired } from "./SignInRequired";

const statusLabel: Record<string, string> = {
  searching: "Finding a captain",
  assigned: "Captain assigned",
  arriving: "Captain on the way",
  "on-trip": "On trip",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function BookingList() {
  const session = useSession();
  const [loaded, setLoaded] = useState<{ rides: BookingSummary[] } | { error: string } | null>(null);

  useEffect(() => {
    if (!session || session.demo) return;
    const controller = new AbortController();
    getApi<{ bookings: BookingSummary[] }>("/bookings", controller.signal)
      .then((res) =>
        setLoaded(
          res.status === "ok"
            ? { rides: res.data.bookings }
            : { error: res.status === "error" ? res.message : "Ride history isn't connected yet." },
        ),
      )
      .catch(() => {});
    return () => controller.abort();
  }, [session]);

  if (session === undefined) return <AccountLoading />;
  if (!session) return <SignInRequired what="your rides" next="/account/bookings" />;
  if (!session.demo && !loaded) return <AccountLoading label="Loading your rides" />;
  if (loaded && "error" in loaded) {
    return (
      <p role="alert" className="rounded-panel bg-card p-8 text-center text-sm font-medium text-error ring-1 ring-line">
        {loaded.error}
      </p>
    );
  }
  const rides = session.demo ? demoBookings : (loaded?.rides ?? []);

  return (
    <div className="space-y-6">
      {session.demo && <Notice tone="demo" title="Demo rides">These are sample rides that show how your history will look.</Notice>}
      {rides.length === 0 ? (
        <div className="rounded-panel bg-card p-10 text-center ring-1 ring-line">
          <p className="text-lg font-bold">No rides yet</p>
          <p className="mt-1 text-sm text-ink-soft">Your trips will appear here after you book.</p>
          <LinkButton href="/book" className="mt-6">Book a ride</LinkButton>
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-panel bg-card ring-1 ring-line">
          {rides.map((r) => (
            <li key={r.id}>
              <AppLink href={`/account/bookings/${r.id}`} className="flex items-center gap-4 p-5 hover:bg-canvas">
                <span className="grid h-14 w-20 shrink-0 place-items-center rounded-xl bg-canvas p-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element -- static artwork */}
                  <img src={getCategory(r.category).image.src} alt="" className="max-h-full" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{getCategory(r.category).name} · {r.when}</span>
                  <span className="block truncate text-sm text-ink-soft">
                    {r.pickup} → {r.drop}
                  </span>
                </span>
                <span className="hidden rounded-full bg-lime/40 px-3 py-1 text-xs font-semibold sm:inline">{statusLabel[r.status]}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden="true" />
              </AppLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
