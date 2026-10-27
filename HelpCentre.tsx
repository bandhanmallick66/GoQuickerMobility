"use client";

import { useId, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { faqGroups } from "@/config/faqs";
import { FaqList } from "@/components/ui/FaqList";

export function HelpCentre() {
  const [q, setQ] = useState("");
  const id = useId();
  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return faqGroups;
    return faqGroups
      .map((g) => ({ ...g, items: g.items.filter((f) => `${f.q} ${f.a}`.toLowerCase().includes(term)) }))
      .filter((g) => g.items.length > 0);
  }, [q]);

  return (
    <div>
      <div className="relative max-w-xl">
        <label htmlFor={id} className="sr-only">Search help</label>
        <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
        <input
          id={id}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search for OTP, cancel, payment…"
          className="h-14 w-full rounded-full bg-card pl-14 pr-5 text-base shadow-panel outline-none ring-1 ring-line focus:ring-2 focus:ring-forest-2"
        />
      </div>
      <p className="sr-only" aria-live="polite">
        {groups.reduce((n, g) => n + g.items.length, 0)} answers
      </p>
      {groups.length === 0 ? (
        <p className="mt-10 text-ink-soft">No answers match “{q}”. Try another word, or contact us below.</p>
      ) : (
        <div className="mt-10 space-y-10">
          {groups.map((g) => (
            <section key={g.id} aria-labelledby={`faq-${g.id}`}>
              <h2 id={`faq-${g.id}`} className="mb-4 text-xl font-bold">{g.title}</h2>
              <FaqList items={g.items} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
