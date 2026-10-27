import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/ui/PageHero";
import { RideScreen } from "@/components/account/RideScreen";

export const metadata: Metadata = { title: "Your ride", robots: { index: false } };

/** The demo ride is prerendered for previews; real rides render on request once bookings are live. */
export function generateStaticParams() {
  return [{ id: "demo" }];
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <PageHero
        eyebrow="Your ride"
        title="Ride details"
        crumbs={[
          { label: "Account", href: "/account" },
          { label: "Rides", href: "/account/bookings" },
        ]}
      />
      <div className="on-light bg-canvas">
        <div className="container-gq py-12 lg:py-16">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-panel bg-card ring-1 ring-line" />}>
            <RideScreenForParams params={params} />
          </Suspense>
        </div>
      </div>
    </>
  );
}

async function RideScreenForParams({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RideScreen id={id} />;
}
