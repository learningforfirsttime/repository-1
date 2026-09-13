"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * "My request" — the commission a visitor is assembling.
 *
 * This is the shape a shopping cart would take, if anything here were for
 * sale. Nothing is: the request exists only to be read back to the visitor
 * and copied to their own clipboard. It never leaves the browser.
 *
 * localStorage is touched exclusively inside useEffect, so the server and the
 * first client render always agree.
 */

export type Intake = {
  recipient: string;
  occasion: string;
  feeling: string;
};

const EMPTY_INTAKE: Intake = { recipient: "", occasion: "", feeling: "" };

const KEY_SELECTED = "amd.request.selected";
const KEY_INTAKE = "amd.request.intake";

type RequestValue = {
  /** true once localStorage has been read — guards against a hydration flash */
  hydrated: boolean;
  selected: string[];
  intake: Intake;
  has: (id: string) => boolean;
  add: (id: string) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  clear: () => void;
  updateIntake: (patch: Partial<Intake>) => void;
};

const RequestContext = createContext<RequestValue | null>(null);

const readSelected = (): string[] => {
  try {
    const raw = window.localStorage.getItem(KEY_SELECTED);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
};

const readIntake = (): Intake => {
  try {
    const raw = window.localStorage.getItem(KEY_INTAKE);
    if (!raw) return EMPTY_INTAKE;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return EMPTY_INTAKE;
    const o = parsed as Record<string, unknown>;
    return {
      recipient: typeof o.recipient === "string" ? o.recipient : "",
      occasion: typeof o.occasion === "string" ? o.occasion : "",
      feeling: typeof o.feeling === "string" ? o.feeling : "",
    };
  } catch {
    return EMPTY_INTAKE;
  }
};

export function RequestProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [intake, setIntake] = useState<Intake>(EMPTY_INTAKE);

  // read once, on the client only
  useEffect(() => {
    setSelected(readSelected());
    setIntake(readIntake());
    setHydrated(true);
  }, []);

  // write back, but never before the first read has happened
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY_SELECTED, JSON.stringify(selected));
    } catch {
      /* private mode, quota, or a browser that would rather not */
    }
  }, [selected, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY_INTAKE, JSON.stringify(intake));
    } catch {
      /* as above */
    }
  }, [intake, hydrated]);

  const has = useCallback((id: string) => selected.includes(id), [selected]);

  const add = useCallback((id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const remove = useCallback((id: string) => {
    setSelected((prev) => prev.filter((s) => s !== id));
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }, []);

  const clear = useCallback(() => {
    setSelected([]);
    setIntake(EMPTY_INTAKE);
  }, []);

  const updateIntake = useCallback((patch: Partial<Intake>) => {
    setIntake((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo<RequestValue>(
    () => ({
      hydrated,
      selected,
      intake,
      has,
      add,
      remove,
      toggle,
      clear,
      updateIntake,
    }),
    [hydrated, selected, intake, has, add, remove, toggle, clear, updateIntake]
  );

  return (
    <RequestContext.Provider value={value}>{children}</RequestContext.Provider>
  );
}

export function useRequest(): RequestValue {
  const ctx = useContext(RequestContext);
  if (!ctx) {
    throw new Error("useRequest must be used inside <RequestProvider>");
  }
  return ctx;
}
