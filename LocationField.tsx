"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BriefcaseBusiness, Clock3, Crosshair, Home, Loader2, MapPin, Star, X, type LucideIcon } from "lucide-react";
import { searchPlaces, placesConfigured, type PlaceSuggestion } from "@/lib/api/places";
import { getRecentPlaces, getSavedPlaces, setSavedPlace, type SavedPlaceKind } from "@/lib/places";

interface Option {
  key: string;
  label: string;
  sub?: string;
  icon: LucideIcon;
  run: () => void;
}

interface LocationFieldProps {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  /** Offers "Use current location" (asked only when the rider picks it). */
  allowCurrentLocation?: boolean;
  className?: string;
}

const savedMeta: Record<SavedPlaceKind, { label: string; icon: LucideIcon }> = {
  home: { label: "Home", icon: Home },
  work: { label: "Work", icon: BriefcaseBusiness },
};

/**
 * Location input with saved places, recent places, current location and
 * (when a maps provider is configured) live address suggestions.
 * Manual typing always works.
 */
export function LocationField({
  id,
  name,
  label,
  placeholder,
  icon: Icon,
  value,
  onChange,
  error,
  allowCurrentLocation,
  className = "",
}: LocationFieldProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const [saved, setSaved] = useState<Partial<Record<SavedPlaceKind, string>>>({});
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [lookup, setLookup] = useState<"idle" | "loading" | "error">("idle");
  const [geo, setGeo] = useState<"idle" | "locating" | "denied" | "unavailable">("idle");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const errorId = error ? `${id}-error` : undefined;
  const hintId = `${id}-hint`;

  function refreshMemory() {
    setRecent(getRecentPlaces());
    setSaved(getSavedPlaces());
  }

  // Live suggestions, debounced, only when a provider is configured.
  useEffect(() => {
    if (!placesConfigured || !open || value.trim().length < 3) return;
    const controller = new AbortController();
    const t = window.setTimeout(async () => {
      setLookup("loading");
      try {
        const res = await searchPlaces(value, controller.signal);
        if (res.status === "ok") {
          setSuggestions(res.suggestions);
          setLookup("idle");
        } else setLookup("error");
      } catch {
        // superseded
      }
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(t);
    };
  }, [value, open]);

  // Close when focus or clicks move outside.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  function choose(address: string) {
    onChange(address);
    setOpen(false);
    setActive(-1);
  }

  function useCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setGeo("unavailable");
      return;
    }
    setGeo("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo("idle");
        // Without a geocoding provider we can only offer coordinates.
        const { latitude, longitude } = pos.coords;
        choose(`Current location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`);
      },
      (err) => setGeo(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  const q = value.trim().toLowerCase();
  const liveSuggestions = placesConfigured && open && q.length >= 3 ? suggestions : [];
  const options: Option[] = [];
  if (allowCurrentLocation) {
    options.push({
      key: "current",
      label: geo === "locating" ? "Finding your location…" : "Use current location",
      sub: "We ask your browser once, only for this trip",
      icon: geo === "locating" ? Loader2 : Crosshair,
      run: useCurrentLocation,
    });
  }
  liveSuggestions.forEach((s) =>
    options.push({ key: `s-${s.id}`, label: s.primary, sub: s.secondary, icon: MapPin, run: () => choose([s.primary, s.secondary].filter(Boolean).join(", ")) }),
  );
  (Object.keys(savedMeta) as SavedPlaceKind[]).forEach((k) => {
    const addr = saved[k];
    if (addr && (!q || addr.toLowerCase().includes(q) || savedMeta[k].label.toLowerCase().includes(q))) {
      options.push({ key: `saved-${k}`, label: savedMeta[k].label, sub: addr, icon: savedMeta[k].icon, run: () => choose(addr) });
    }
  });
  recent
    .filter((r) => !q || (r.toLowerCase().includes(q) && r.toLowerCase() !== q))
    .forEach((r) => options.push({ key: `recent-${r}`, label: r, icon: Clock3, run: () => choose(r) }));
  if (value.trim().length >= 3 && !value.startsWith("Current location")) {
    (Object.keys(savedMeta) as SavedPlaceKind[]).forEach((k) => {
      if (saved[k]?.toLowerCase() === q) return;
      options.push({
        key: `save-${k}`,
        label: `Save as ${savedMeta[k].label}`,
        sub: value.trim(),
        icon: Star,
        run: () => {
          setSavedPlace(k, value);
          refreshMemory();
          setOpen(false);
        },
      });
    });
  }

  const showList = open && options.length > 0;

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        refreshMemory();
        setOpen(true);
      }
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && showList && active >= 0) {
      e.preventDefault();
      options[active]?.run();
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
    }
  }

  const geoNote =
    geo === "denied"
      ? "Location permission was declined. Type your pickup address instead."
      : geo === "unavailable"
        ? "We couldn't get your location. Type your pickup address instead."
        : "";

  return (
    <div ref={wrapRef} className={`group relative flex min-w-0 flex-1 items-start gap-3 rounded-2xl px-4 py-3 transition-colors focus-within:bg-canvas hover:bg-canvas/70 ${className}`}>
      <Icon className="mt-1 h-5 w-5 shrink-0 text-forest-2" strokeWidth={1.8} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block text-[0.8rem] font-semibold text-ink">
          {label}
        </label>
        <input
          ref={inputRef}
          id={id}
          name={name}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          aria-invalid={!!error}
          aria-describedby={[errorId, geoNote ? hintId : undefined].filter(Boolean).join(" ") || undefined}
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onFocus={() => {
            refreshMemory();
            setOpen(true);
          }}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onKeyDown={onKeyDown}
          className="mt-0.5 block w-full min-w-0 truncate bg-transparent text-[0.9rem] text-ink outline-none placeholder:text-ink-soft"
        />
        {error && (
          <p id={errorId} className="mt-1 text-xs font-medium text-error">
            {error}
          </p>
        )}
        {geoNote && (
          <p id={hintId} className="mt-1 text-xs text-warning">
            {geoNote}
          </p>
        )}
      </div>
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-line"
          aria-label={`Clear ${label.toLowerCase()}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label={`${label} suggestions`}
          className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-30 max-h-80 overflow-y-auto rounded-2xl bg-card p-1.5 shadow-panel ring-1 ring-line lg:right-auto lg:w-[24rem]"
        >
          {lookup === "loading" && (
            <li className="flex items-center gap-2 px-3 py-2 text-xs text-ink-soft" aria-hidden="true">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Looking up addresses…
            </li>
          )}
          {lookup === "error" && (
            <li className="px-3 py-2 text-xs text-warning">Address suggestions are unavailable. You can keep typing.</li>
          )}
          {options.map((o, i) => (
            <li
              key={o.key}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={o.run}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 ${i === active ? "bg-canvas" : ""}`}
            >
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-canvas text-forest-2">
                <o.icon className={`h-4 w-4 ${o.icon === Loader2 ? "animate-spin" : ""}`} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">{o.label}</span>
                {o.sub && <span className="block truncate text-xs text-ink-soft">{o.sub}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
