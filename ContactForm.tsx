"use client";

import { useId, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Field, TextInput, describedBy, fieldBase } from "@/components/ui/Field";
import { submitContact } from "@/lib/api/client";
import { isEmail, isName, normalizeIndianMobile } from "@/lib/validation";

const topics = ["A ride I took", "Payment or refund", "Safety concern", "Becoming a captain", "Something else"];

export function ContactForm() {
  const uid = useId();
  const f = (n: string) => `${uid}-${n}`;
  const [v, setV] = useState({ name: "", contact: "", topic: "", ride: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "setup" | "sent" | "error">("idle");

  function set(k: keyof typeof v, value: string) {
    setV((s) => ({ ...s, [k]: value }));
    setErrors((e) => ({ ...e, [k]: "" }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    const errs: Record<string, string> = {};
    if (!isName(v.name)) errs.name = "Enter your name.";
    if (!isEmail(v.contact) && !normalizeIndianMobile(v.contact)) errs.contact = "Enter an email address or a 10-digit mobile number.";
    if (!v.topic) errs.topic = "Choose a topic.";
    if (v.message.trim().length < 10) errs.message = "Tell us a little more (at least 10 characters).";
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) return document.getElementById(f(first))?.focus();
    setState("sending");
    const res = await submitContact({ ...v, message: v.message.trim().slice(0, 2000) });
    setState(res.status === "ok" ? "sent" : res.status === "not-configured" ? "setup" : "error");
  }

  if (state === "sent") return <Notice title="Message sent">Thanks, we&apos;ll reply as soon as we can.</Notice>;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={f("name")} label="Your name" error={errors.name}>
          <TextInput id={f("name")} autoComplete="name" value={v.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} aria-describedby={describedBy(f("name"), errors.name)} />
        </Field>
        <Field id={f("contact")} label="Email or mobile" error={errors.contact}>
          <TextInput id={f("contact")} value={v.contact} onChange={(e) => set("contact", e.target.value)} aria-invalid={!!errors.contact} aria-describedby={describedBy(f("contact"), errors.contact)} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={f("topic")} label="Topic" error={errors.topic}>
          <select id={f("topic")} value={v.topic} onChange={(e) => set("topic", e.target.value)} aria-invalid={!!errors.topic} aria-describedby={describedBy(f("topic"), errors.topic)} className={fieldBase}>
            <option value="">Choose a topic</option>
            {topics.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field id={f("ride")} label="Ride ID" optional hint="Found on your ride details.">
          <TextInput id={f("ride")} value={v.ride} onChange={(e) => set("ride", e.target.value)} aria-describedby={describedBy(f("ride"), undefined, "hint")} />
        </Field>
      </div>
      <Field id={f("message")} label="Message" error={errors.message}>
        <textarea id={f("message")} rows={5} value={v.message} onChange={(e) => set("message", e.target.value)} aria-invalid={!!errors.message} aria-describedby={describedBy(f("message"), errors.message)} className={`${fieldBase} h-auto py-3`} />
      </Field>
      {state === "setup" && (
        <Notice tone="setup" title="Messages aren't connected yet">
          Your message wasn&apos;t sent because GoQuicker&apos;s support inbox isn&apos;t live. Your text is still in the form.
        </Notice>
      )}
      {state === "error" && <p role="alert" className="text-sm font-medium text-error">We couldn&apos;t send your message. Please try again.</p>}
      <button type="submit" disabled={state === "sending"} className={buttonClasses("primary", "lg")}>
        {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Sending" /> : <>Send message <Send className="h-4 w-4 text-lime" aria-hidden="true" /></>}
      </button>
    </form>
  );
}
