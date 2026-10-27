import { Loader2 } from "lucide-react";

/** Placeholder while the rider's session or rides load. */
export function AccountLoading({ label = "Loading your account" }: { label?: string }) {
  return (
    <div role="status" className="grid min-h-48 place-items-center rounded-panel bg-card ring-1 ring-line">
      <Loader2 className="h-6 w-6 animate-spin text-forest-2" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
