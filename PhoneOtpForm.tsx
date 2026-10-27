"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { fieldBase } from "@/components/ui/Field";
import { requestCaptainOtp, requestOtp, verifyCaptainOtp, verifyOtp } from "@/lib/api/client";
import { resetSession } from "@/lib/session";
import { isOtp, normalizeIndianMobile } from "@/lib/validation";

/** Where to go after sign-in: the page that asked, if it is on this site. */
function nextPath(fallback: string): string {
  const next = new URLSearchParams(window.location.search).get("next") ?? "";
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

/** Phone number + OTP sign-in, the way Indian ride apps do it. */
export function PhoneOtpForm({
  initialPhone = "",
  codeSent = false,
  captain = false,
}: {
  initialPhone?: string;
  codeSent?: boolean;
  /** Signs in to the captain app instead of a rider account. */
  captain?: boolean;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"phone" | "code">(codeSent ? "code" : "phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [setup, setSetup] = useState(false);
  const uid = useId();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");
    if (stage === "phone") {
      const normalized = normalizeIndianMobile(phone);
      if (!normalized) {
        setError("Enter a valid 10-digit Indian mobile number.");
        return;
      }
      setBusy(true);
      const res = await (captain ? requestCaptainOtp : requestOtp)(normalized);
      setBusy(false);
      if (res.status === "not-configured") setSetup(true);
      else if (res.status === "error") setError(res.message);
      else setStage("code");
    } else {
      if (!isOtp(code)) {
        setError("Enter the 6-digit code we sent you.");
        return;
      }
      setBusy(true);
      const res = await (captain ? verifyCaptainOtp : verifyOtp)(normalizeIndianMobile(phone) ?? "", code.trim());
      setBusy(false);
      if (res.status === "error") setError(res.message);
      else if (res.status === "not-configured") setSetup(true);
      else {
        if (!captain) resetSession();
        router.push(nextPath(captain ? "/captain" : "/account"));
      }
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {stage === "phone" ? (
        <div>
          <label htmlFor={`${uid}-phone`} className="text-sm font-semibold">Mobile number</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 mt-[3px] -translate-y-1/2 text-[0.95rem] font-semibold text-ink-soft">+91</span>
            <input
              id={`${uid}-phone`}
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={14}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? `${uid}-err` : undefined}
              className={`${fieldBase} pl-14`}
              placeholder="98765 43210"
            />
          </div>
        </div>
      ) : (
        <div>
          <label htmlFor={`${uid}-code`} className="text-sm font-semibold">6-digit code</label>
          <p className="text-sm text-ink-soft">Sent by SMS to +91 {normalizeIndianMobile(phone)}</p>
          <input
            id={`${uid}-code`}
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            aria-invalid={!!error}
            aria-describedby={error ? `${uid}-err` : undefined}
            className={`${fieldBase} tracking-[0.5em]`}
          />
          <button type="button" onClick={() => setStage("phone")} className="mt-2 text-sm font-semibold text-forest-2 hover:underline">
            Change number
          </button>
        </div>
      )}
      {error && (
        <p id={`${uid}-err`} role="alert" className="text-sm font-medium text-error">
          {error}
        </p>
      )}
      {setup && (
        <Notice tone="setup" title="Sign-in isn't connected yet">
          Your number looks right, but GoQuicker&apos;s SMS service isn&apos;t live, so no code was sent.
        </Notice>
      )}
      <button type="submit" disabled={busy} className={buttonClasses("primary", "lg", "w-full")}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Sending" /> : stage === "phone" ? "Send code" : "Verify and sign in"}
        {!busy && <ArrowRight className="h-4 w-4 text-lime" aria-hidden="true" />}
      </button>
    </form>
  );
}
