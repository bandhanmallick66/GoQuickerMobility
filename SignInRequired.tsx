import { LockKeyhole } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { AppLink } from "@/components/ui/AppLink";

/** Shown on account pages when there is no signed-in rider. The server enforces this too once auth is live. */
export function SignInRequired({ what, next }: { what: string; next: string }) {
  return (
    <div className="mx-auto max-w-md rounded-panel bg-card p-8 text-center shadow-panel ring-1 ring-line">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-forest-2">
        <LockKeyhole className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <h2 className="mt-5 text-xl font-bold">Sign in to see {what}</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">Use your mobile number. We&apos;ll send a one-time password by SMS.</p>
      <LinkButton href={`/login?next=${encodeURIComponent(next)}`} className="mt-6 w-full">
        Sign in
      </LinkButton>
      <p className="mt-4 text-sm text-ink-soft">
        New to GoQuicker?{" "}
        <AppLink href="/register" className="font-semibold text-forest-2 underline underline-offset-4">
          Create an account
        </AppLink>
      </p>
    </div>
  );
}
