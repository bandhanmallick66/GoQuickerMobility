"use client";

import { useId, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Field, TextInput, describedBy } from "@/components/ui/Field";
import { checkPartnerStatus } from "@/lib/api/client";
import { normalizeIndianMobile } from "@/lib/validation";

export function PartnerStatusForm() {
  const uid = useId();
  const [ref, setRef] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "setup" | "error" | "ok">("idle");
  const [status, setStatus] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (ref.trim().length < 4) errs.ref = "Enter the reference from your application.";
    const p = normalizeIndianMobile(phone);
    if (!p) errs.phone = "Enter the mobile number you applied with.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setState("sending");
    const res = await checkPartnerStatus(ref.trim(), p!);
    if (res.status === "ok") {
      setStatus(res.data.status);
      setState("ok");
    } else setState(res.status === "not-configured" ? "setup" : "error");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field id={`${uid}-ref`} label="Application reference" error={errors.ref}>
        <TextInput id={`${uid}-ref`} value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} aria-invalid={!!errors.ref} aria-describedby={describedBy(`${uid}-ref`, errors.ref)} />
      </Field>
      <Field id={`${uid}-phone`} label="Mobile number" error={errors.phone}>
        <TextInput id={`${uid}-phone`} type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={!!errors.phone} aria-describedby={describedBy(`${uid}-phone`, errors.phone)} />
      </Field>
      <div aria-live="polite">
        {state === "setup" && <Notice tone="setup" title="Status checks aren't connected yet">We can&apos;t look up applications until the partner service is live.</Notice>}
        {state === "error" && <p role="alert" className="text-sm font-medium text-error">We couldn&apos;t find that application. Check the reference and number.</p>}
        {state === "ok" && <Notice title="Application status">{status}</Notice>}
      </div>
      <button type="submit" disabled={state === "sending"} className={buttonClasses("primary", "lg", "w-full")}>
        {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Checking" /> : <><Search className="h-4 w-4 text-lime" aria-hidden="true" /> Check status</>}
      </button>
    </form>
  );
}
