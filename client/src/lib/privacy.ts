import { useSyncExternalStore } from "react";

// "Hide amounts": blurs every rupee figure (see [data-private] in index.css).
// Remembered on this device only.
const KEY = "bolero.hideAmounts";
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function apply(hidden: boolean) {
  document.documentElement.toggleAttribute("data-private", hidden);
}

/** Call once before the first render so amounts never flash. */
export function initPrivacy() {
  apply(read());
}

export function setHidden(hidden: boolean) {
  try {
    localStorage.setItem(KEY, hidden ? "1" : "0");
  } catch {
    /* storage blocked: still apply for this session */
  }
  apply(hidden);
  listeners.forEach((l) => l());
}

export function useAmountsHidden(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => document.documentElement.hasAttribute("data-private"),
  );
}
