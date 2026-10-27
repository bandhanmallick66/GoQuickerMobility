"use client";

import { useId, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { AppLink } from "@/components/ui/AppLink";
import { buttonClasses } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Field, TextInput, describedBy } from "@/components/ui/Field";
import { registerRider } from "@/lib/api/client";
import { isEmail, isName, normalizeIndianMobile } from "@/lib/validation";
import { PhoneOtpForm } from "./PhoneOtpForm";

export function RegisterForm() {
  const uid = useId();
  const [values, setValues] = useState({ name: "", phone: "", email: "", consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<"" | "setup" | "error" | "sent">("");
  const [message, setMessage] = useState("");

  function set<K extends keyof typeof values>(k: K, v: (typeof values)[K]) {
    setValues((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const errs: Record<string, string> = {};
    if (!isName(values.name)) errs.name = "Enter your name.";
    const phone = normalizeIndianMobile(values.phone);
    if (!phone) errs.phone = "Enter a valid 10-digit Indian mobile number.";
    if (values.email && !isEmail(values.email)) errs.email = "Enter a valid email address, or leave it blank.";
    if (!values.consent) errs.consent = "Please accept the Terms and Privacy policy to continue.";
    setErrors(errs);
    const first = Object.keys(errs).find((k) => errs[k]);
    if (first) {
      document.getElementById(`${uid}-${first}`)?.focus();
      return;
    }
    setBusy(true);
    const res = await registerRider({ name: values.name.trim(), phone: phone!, email: values.email.trim() || undefined });
    setBusy(false);
    if (res.status === "ok") setResult("sent");
    else if (res.status === "not-configured") setResult("setup");
    else if (res.status === "error") {
      setResult("error");
      setMessage(res.message);
    }
  }

  if (result === "sent") return <PhoneOtpForm initialPhone={normalizeIndianMobile(values.phone) ?? ""} codeSent />;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field id={`${uid}-name`} label="Full name" error={errors.name}>
        <TextInput id={`${uid}-name`} autoComplete="name" value={values.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} aria-describedby={describedBy(`${uid}-name`, errors.name)} />
      </Field>
      <Field id={`${uid}-phone`} label="Mobile number" error={errors.phone} hint="We'll send a code to verify it.">
        <TextInput id={`${uid}-phone`} type="tel" inputMode="numeric" autoComplete="tel-national" value={values.phone} onChange={(e) => set("phone", e.target.value)} aria-invalid={!!errors.phone} aria-describedby={describedBy(`${uid}-phone`, errors.phone, "hint")} />
      </Field>
      <Field id={`${uid}-email`} label="Email" optional error={errors.email} hint="For receipts.">
        <TextInput id={`${uid}-email`} type="email" autoComplete="email" value={values.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} aria-describedby={describedBy(`${uid}-email`, errors.email, "hint")} />
      </Field>
      <div>
        <label className="flex items-start gap-3 text-sm">
          <input id={`${uid}-consent`} type="checkbox" checked={values.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-0.5 h-4 w-4 accent-forest-2" aria-invalid={!!errors.consent} />
          <span>
            I agree to the <AppLink href="/terms" className="font-semibold underline">Terms</AppLink> and{" "}
            <AppLink href="/privacy" className="font-semibold underline">Privacy policy</AppLink>.
          </span>
        </label>
        {errors.consent && <p className="mt-1.5 text-xs font-medium text-error">{errors.consent}</p>}
      </div>
      {result === "setup" && (
        <Notice tone="setup" title="Accounts aren't live yet">
          Your details look right, but sign-up isn&apos;t connected yet, so nothing has been saved.
        </Notice>
      )}
      {result === "error" && <p role="alert" className="text-sm font-medium text-error">{message}</p>}
      <button type="submit" disabled={busy} className={buttonClasses("primary", "lg", "w-full")}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Creating account" /> : <>Create account <ArrowRight className="h-4 w-4 text-lime" aria-hidden="true" /></>}
      </button>
    </form>
  );
}
