"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isCategoryId } from "@/config/categories";
import type { CategoryId } from "@/lib/types";

const STORAGE_KEY = "gq:category";

interface BookingContextValue {
  /** The ride type the visitor picked anywhere on the site. */
  category: CategoryId | "";
  setCategory: (id: CategoryId | "") => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

/**
 * Shares the selected service category between the category cards, booking
 * panel and CTAs so there is only ever one selection. The choice is remembered
 * in localStorage (it is a non-sensitive preference).
 */
export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [category, setCategoryState] = useState<CategoryId | "">("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a client-only preference after hydration
      if (isCategoryId(saved)) setCategoryState(saved);
    } catch {
      // Storage can be unavailable (private mode); the selection still works in memory.
    }
  }, []);

  const setCategory = useCallback((id: CategoryId | "") => {
    setCategoryState(id);
    try {
      if (id) window.localStorage.setItem(STORAGE_KEY, id);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage failures.
    }
  }, []);

  const value = useMemo(() => ({ category, setCategory }), [category, setCategory]);
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used inside BookingProvider");
  return ctx;
}

/** Booking route with the current category preserved. */
export function bookingHref(category: CategoryId | ""): string {
  return category ? `/book?category=${category}` : "/book";
}
