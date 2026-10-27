"use client";

import { useId, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { categories, isCategoryId } from "@/config/categories";
import { AppLink } from "@/components/ui/AppLink";
import { buttonClasses } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Field, TextInput, describedBy, fieldBase } from "@/components/ui/Field";
import { submitPartnerApplication } from "@/lib/api/client";
import { isName, normalizeIndianMobile } from "@/lib/validation";

export function PartnerForm() {
  const uid = useId();
  const f = (n: string) => `${uid}-${n}`;
  const [v, setV] = useState({ name: "", phone: "", city: "", vehicle: "", licence: false, rc: false, consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "setup" | "error" | "sent">("idle");
  const [reference, setReference] = useState("");

  function set<K extends keyof typeof v>(k: K, value: (typeof v)[K]) {
    setV((s) => ({ ...s, [k]: value }));
    setErrors((e) => ({ ...e, [k]: "" }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    const errs: Record<string, string> = {};
    if (!isName(v.name)) errs.name = "Enter your full name.";
    const phone = normalizeIndianMobile(v.phone);
    if (!phone) errs.phone = "Enter a valid 10-digit Indian mobile number.";
    if (v.city.trim().length < 2) errs.city = "Enter the city you'll ride in.";
    if (!isCategoryId(v.vehicle)) errs.vehicle = "Choose your vehicle type.";
    if (!v.licence || !v.rc) errs.docs = "You'll need a valid driving licence and vehicle RC to apply.";
    if (!v.consent) errs.consent = "Please agree so we can contact you about your application.";
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) return document.getElementById(f(first))?.focus();
    setState("sending");
    const res = await submitPartnerApplication({ name: v.name.trim(), phone, city: v.city.trim(), vehicle: v.vehicle });
    if (res.status === "ok") {
      setReference(res.data.reference);
      setState("sent");
    } else setState(res.status === "not-configured" ? "setup" : "error");
  }

  if (state === "sent") {
    return (
      <Notice title="Application received">
        Your reference is <strong>{reference}</strong>. You can{" "}
        <AppLink href="/partners/status" className="font-semibold underline">check your status</AppLink> any time.
      </Notice>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={f("name")} label="Full name (as on licence)" error={errors.name}>
          <TextInput id={f("name")} autoComplete="name" value={v.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} aria-describedby={describedBy(f("name"), errors.name)} />
        </Field>
        <Field id={f("phone")} label="Mobile number" error={errors.phone}>
          <TextInput id={f("phone")} type="tel" inputMode="numeric" autoComplete="tel-national" value={v.phone} onChange={(e) => set("phone", e.target.value)} aria-invalid={!!errors.phone} aria-describedby={describedBy(f("phone"), errors.phone)} />
        </Field>
        <Field id={f("city")} label="City" error={errors.city}>
          <TextInput id={f("city")} autoComplete="address-level2" value={v.city} onChange={(e) => set("city", e.target.value)} aria-invalid={!!errors.city} aria-describedby={describedBy(f("city"), errors.city)} />
        </Field>
        <Field id={f("vehicle")} label="Vehicle type" error={errors.vehicle}>
          <select id={f("vehicle")} value={v.vehicle} onChange={(e) => set("vehicle", e.target.value)} aria-invalid={!!errors.vehicle} aria-describedby={describedBy(f("vehicle"), errors.vehicle)} className={fieldBase}>
            <option value="">Choose a vehicle</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
      </div>
      <fieldset>
        <legend className="text-sm font-semibold">Documents you have</legend>
        <div className="mt-2 space-y-2 text-sm">
          <label className="flex items-center gap-3">
            <input id={f("docs")} type="checkbox" checked={v.licence} onChange={(e) => { set("licence", e.target.checked); setErrors((x) => ({ ...x, docs: "" })); }} className="h-4 w-4 accent-forest-2" />
            Valid driving licence for this vehicle
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={v.rc} onChange={(e) => { set("rc", e.target.checked); setErrors((x) => ({ ...x, docs: "" })); }} className="h-4 w-4 accent-forest-2" />
            Vehicle registration certificate (RC)
          </label>
        </div>
        {errors.docs && <p className="mt-1.5 text-xs font-medium text-error">{errors.docs}</p>}
      </fieldset>
      <div>
        <label className="flex items-start gap-3 text-sm">
          <input id={f("consent")} type="checkbox" checked={v.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-0.5 h-4 w-4 accent-forest-2" />
          <span>
            GoQuicker may contact me by phone and SMS about this application, as described in the{" "}
            <AppLink href="/privacy" className="font-semibold underline">Privacy policy</AppLink>.
          </span>
        </label>
        {errors.consent && <p className="mt-1.5 text-xs font-medium text-error">{errors.consent}</p>}
      </div>
      {state === "setup" && (
        <Notice tone="setup" title="Applications aren't open online yet">
          Your details look complete, but nothing was submitted because the application service isn&apos;t live.
        </Notice>
      )}
      {state === "error" && <p role="alert" className="text-sm font-medium text-error">We couldn&apos;t send your application. Please try again.</p>}
      <button type="submit" disabled={state === "sending"} className={buttonClasses("primary", "lg")}>
        {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Sending" /> : <>Apply now <ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
      </button>
    </form>
  );
}
