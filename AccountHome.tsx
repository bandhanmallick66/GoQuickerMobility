"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, ChevronRight, Home, Plus, Trash2, UserRound, Users } from "lucide-react";
import { AppLink } from "@/components/ui/AppLink";
import { buttonClasses } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { fieldBase } from "@/components/ui/Field";
import { getSavedPlaces, setSavedPlace, type SavedPlaceKind } from "@/lib/places";
import { resetSession, useSession } from "@/lib/session";
import { signOut } from "@/lib/api/client";
import { isName, normalizeIndianMobile } from "@/lib/validation";
import { AccountLoading } from "./AccountLoading";
import { SignInRequired } from "./SignInRequired";

const CONTACTS_KEY = "gq:emergency-contacts";
const MAX_CONTACTS = 5;
type Contact = { name: string; phone: string };

export function AccountHome() {
  const session = useSession();
  const router = useRouter();
  const uid = useId();
  const [saved, setSaved] = useState<Partial<Record<SavedPlaceKind, string>>>({});
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [draft, setDraft] = useState<Contact>({ name: "", phone: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage after mount
    setSaved(getSavedPlaces());
    try {
      const raw = localStorage.getItem(CONTACTS_KEY);
      if (raw) setContacts(JSON.parse(raw) as Contact[]);
    } catch {}
  }, []);

  function persist(next: Contact[]) {
    setContacts(next);
    try {
      localStorage.setItem(CONTACTS_KEY, JSON.stringify(next));
    } catch {}
  }

  function addContact(e: React.FormEvent) {
    e.preventDefault();
    const phone = normalizeIndianMobile(draft.phone);
    if (!isName(draft.name)) return setError("Enter the contact's name.");
    if (!phone) return setError("Enter a valid 10-digit Indian mobile number.");
    if (contacts.length >= MAX_CONTACTS) return setError(`You can add up to ${MAX_CONTACTS} contacts.`);
    persist([...contacts, { name: draft.name.trim(), phone }]);
    setDraft({ name: "", phone: "" });
    setError("");
  }

  if (session === undefined) return <AccountLoading />;
  if (!session) return <SignInRequired what="your account" next="/account" />;

  const places: { kind: SavedPlaceKind; label: string; icon: typeof Home }[] = [
    { kind: "home", label: "Home", icon: Home },
    { kind: "work", label: "Work", icon: BriefcaseBusiness },
  ];

  return (
    <div className="space-y-6">
      {session.demo && (
        <Notice tone="demo" title="Demo account">
          You&apos;re seeing a sample account. Saved places and emergency contacts here are stored only in this browser.
        </Notice>
      )}
      {!session.demo && (
        <Notice title="Kept on this device">Saved places and emergency contacts are stored in this browser for now.</Notice>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-panel bg-card p-6 ring-1 ring-line" aria-labelledby="profile-h">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-forest-2">
            <UserRound className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 id="profile-h" className="mt-4 text-xl font-bold">{session.name}</h2>
          <p className="text-sm text-ink-soft">+91 {session.phone}</p>
          <AppLink href="/account/bookings" className="mt-6 flex items-center justify-between rounded-2xl bg-canvas px-4 py-3 font-semibold hover:bg-line">
            Your rides <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </AppLink>
          <AppLink href="/help" className="mt-2 flex items-center justify-between rounded-2xl bg-canvas px-4 py-3 font-semibold hover:bg-line">
            Help <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </AppLink>
          {!session.demo && (
            <button
              type="button"
              onClick={async () => {
                await signOut();
                resetSession();
                router.push("/");
              }}
              className="mt-2 w-full rounded-2xl px-4 py-3 text-left font-semibold text-error hover:bg-error/10"
            >
              Sign out
            </button>
          )}
        </section>

        <section className="rounded-panel bg-card p-6 ring-1 ring-line" aria-labelledby="places-h">
          <h2 id="places-h" className="text-lg font-bold">Saved places</h2>
          <p className="mt-1 text-sm text-ink-soft">Used as quick picks when you book.</p>
          <ul className="mt-5 space-y-3">
            {places.map(({ kind, label, icon: Icon }) => (
              <li key={kind}>
                <label htmlFor={`${uid}-${kind}`} className="flex items-center gap-2 text-sm font-semibold">
                  <Icon className="h-4 w-4 text-forest-2" aria-hidden="true" /> {label}
                </label>
                <input
                  id={`${uid}-${kind}`}
                  defaultValue={saved[kind] ?? ""}
                  key={saved[kind] ?? "empty"}
                  placeholder={`Add your ${label.toLowerCase()} address`}
                  onBlur={(e) => {
                    setSavedPlace(kind, e.target.value);
                    setSaved(getSavedPlaces());
                  }}
                  className={fieldBase}
                />
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-panel bg-card p-6 ring-1 ring-line" aria-labelledby="contacts-h">
          <h2 id="contacts-h" className="flex items-center gap-2 text-lg font-bold">
            <Users className="h-5 w-5 text-forest-2" aria-hidden="true" /> Emergency contacts
          </h2>
          <p className="mt-1 text-sm text-ink-soft">They can receive your live trip link when you share a ride or use SOS.</p>
          <ul className="mt-4 space-y-2">
            {contacts.map((c, i) => (
              <li key={c.phone} className="flex items-center justify-between rounded-xl bg-canvas px-3 py-2 text-sm">
                <span>
                  <span className="font-semibold">{c.name}</span> <span className="text-ink-soft">+91 {c.phone}</span>
                </span>
                <button type="button" onClick={() => persist(contacts.filter((_, j) => j !== i))} aria-label={`Remove ${c.name}`} className="grid h-8 w-8 place-items-center rounded-full hover:bg-card">
                  <Trash2 className="h-4 w-4 text-ink-soft" />
                </button>
              </li>
            ))}
          </ul>
          {contacts.length < MAX_CONTACTS && (
            <form onSubmit={addContact} noValidate className="mt-4 space-y-2">
              <label htmlFor={`${uid}-cname`} className="sr-only">Contact name</label>
              <input id={`${uid}-cname`} placeholder="Name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} className={fieldBase} />
              <label htmlFor={`${uid}-cphone`} className="sr-only">Contact mobile number</label>
              <input id={`${uid}-cphone`} type="tel" inputMode="numeric" placeholder="Mobile number" value={draft.phone} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} className={fieldBase} />
              {error && <p role="alert" className="text-xs font-medium text-error">{error}</p>}
              <button type="submit" className={buttonClasses("outline-light", "md", "w-full")}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Add contact
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
