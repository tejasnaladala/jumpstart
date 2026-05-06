"use client";
import { useEffect, useRef, useState } from "react";

type Options = {
  // Debounce window before saving to localStorage. Defaults to 350ms.
  debounceMs?: number;
  // Maximum age (ms) of a saved draft. If older, ignored on hydrate.
  // Default 7 days. Use Infinity to disable.
  maxAgeMs?: number;
  // Optional callback fired when a hydrate finds an expired draft. Useful
  // for surfacing a "your draft expired" toast instead of silently losing
  // user work. Only fires once per hook instance.
  onExpired?: () => void;
  // Optional callback when a save fails (quota exceeded, private browsing
  // blocking writes, etc). The hook keeps status as "error" so the UI can
  // show a persistent indicator instead of silently swallowing the failure.
  onSaveError?: (err: unknown) => void;
};

type DraftEnvelope<T> = {
  v: 1;
  ts: number;
  data: T;
};

// Persist a piece of in-progress state to localStorage with a debounce, plus
// hydrate from localStorage on mount. Returns [value, setValue, status]
// where status is "idle" | "dirty" | "saving" | "saved" | "error" so the UI
// can render a tiny "auto-saved" indicator and warn on failed writes.
//
// Used for:
// - onboarding step drafts (so a refresh mid-onboarding doesn't lose work)
// - intro request body (so users don't lose typed openers on accidental nav)
// - browse filter state (remembered across sessions)
// - match detail viewed-state (which cards have been tapped open)
//
// SECURITY NOTE: values stored here are USER-AUTHORED text. They MUST NOT
// be rendered as HTML or evaluated as code anywhere downstream. Always
// flow them through React's text-content path (children, textContent,
// value) which auto-escapes. If a future surface ever wants to render
// markdown from a draft, sanitize first.
//
// Versioned envelope (`{v:1,ts,data}`) so we can migrate shapes later
// without breaking existing saved drafts.
export function useDraftState<T>(
  key: string,
  initial: T,
  options: Options = {}
): [T, (next: T | ((prev: T) => T)) => void, DraftStatus, () => void] {
  const {
    debounceMs = 350,
    maxAgeMs = 7 * 24 * 60 * 60 * 1000,
    onExpired,
    onSaveError,
  } = options;
  const [value, setValue] = useState<T>(initial);
  const [status, setStatus] = useState<DraftStatus>("idle");
  // Track which key the current state was hydrated for, so a key change
  // (e.g. /match/a -> /match/b in-place navigation) re-hydrates from the
  // new key instead of leaking the old draft into the new bucket.
  // Closes Codex H1.
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");
  const expiredFiredRef = useRef(false);

  // Hydrate from localStorage. Runs on mount AND on key change so a
  // navigation that swaps the key reloads the state for the new bucket.
  useEffect(() => {
    if (typeof window === "undefined") {
      setHydratedKey(key);
      return;
    }
    let nextValue: T = initial;
    let nextLastSaved = "";
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const env = JSON.parse(raw) as DraftEnvelope<T>;
        if (env && env.v === 1) {
          if (Date.now() - env.ts < maxAgeMs) {
            nextValue = env.data;
            nextLastSaved = JSON.stringify(env.data);
          } else if (!expiredFiredRef.current && onExpired) {
            expiredFiredRef.current = true;
            // Surface the expiry to the consumer so they can warn the user.
            // The expired draft is auto-cleared so it does not pile up.
            window.localStorage.removeItem(key);
            onExpired();
          }
        }
      }
    } catch {
      // Corrupted envelope; fall back to initial silently.
    }
    setValue(nextValue);
    lastSavedRef.current = nextLastSaved;
    setStatus("idle");
    setHydratedKey(key);
    return () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
    // initial is intentionally excluded from deps to avoid re-hydrating
    // when the consumer passes a fresh literal each render. The hook
    // re-hydrates only when key changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, maxAgeMs, onExpired]);

  // Save on value change, debounced. Skips until hydration for the
  // current key is complete so a hydrated value doesn't immediately
  // re-write itself, and a stale value from the old key never writes
  // under the new key.
  useEffect(() => {
    if (hydratedKey !== key || typeof window === "undefined") return;
    let serialized = "";
    try {
      serialized = JSON.stringify(value);
    } catch {
      // Unserializable value (cyclic ref). Should never happen with our
      // call sites, but guard anyway.
      setStatus("error");
      if (onSaveError) onSaveError(new Error("Value not serializable"));
      return;
    }
    if (serialized === lastSavedRef.current) {
      return;
    }
    setStatus("dirty");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        const env: DraftEnvelope<T> = {
          v: 1,
          ts: Date.now(),
          data: value,
        };
        // Set status inside try so a failed write does not leave the UI
        // stuck on "saving". Closes Codex M3.
        window.localStorage.setItem(key, JSON.stringify(env));
        setStatus("saving");
        lastSavedRef.current = serialized;
        setStatus("saved");
        if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
        settleTimerRef.current = setTimeout(() => setStatus("idle"), 1500);
      } catch (err) {
        // Quota exceeded, private browsing blocking writes, etc. Status
        // becomes "error" so the indicator surfaces the failure rather
        // than silently swallowing the write.
        setStatus("error");
        if (onSaveError) onSaveError(err);
      }
    }, debounceMs);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [value, key, debounceMs, hydratedKey, onSaveError]);

  function clear() {
    // Cancel any pending debounced save so a queued write does not
    // resurrect the cleared draft after a successful submit. Closes
    // Codex H2.
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Privacy mode; nothing to clear anyway.
      }
    }
    lastSavedRef.current = "";
    setValue(initial);
    setStatus("idle");
  }

  return [value, setValue, status, clear];
}

export type DraftStatus = "idle" | "dirty" | "saving" | "saved" | "error";
