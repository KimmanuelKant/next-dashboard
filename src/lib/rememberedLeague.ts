// src/lib/rememberedLeague.ts
// The league a visitor asked the site to remember, kept in the browser's
// localStorage. It is written only when the visitor ticks "Remember this
// league", and it is never sent to the server.
import { useSyncExternalStore } from "react";

const KEY = "myfpl.league";
const ID = /^\d{1,10}$/;

export interface RememberedLeague {
  id: string;
  name: string;
  /** The visitor's own team in the league, when known. */
  team: string | null;
}

const listeners = new Set<() => void>();
// useSyncExternalStore needs the same object back while nothing has changed.
let cachedRaw: string | null | undefined;
let cached: RememberedLeague | null = null;

function parse(raw: string | null): RememberedLeague | null {
  if (!raw) {
    return null;
  }
  try {
    const value = JSON.parse(raw);
    if (typeof value?.id !== "string" || !ID.test(value.id) || typeof value.name !== "string") {
      return null;
    }
    const team = typeof value.team === "string" && ID.test(value.team) ? value.team : null;
    return { id: value.id, name: value.name.slice(0, 100), team };
  } catch {
    return null;
  }
}

function read(): RememberedLeague | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    // Storage is blocked: behave as if nothing is remembered.
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = parse(raw);
  }
  return cached;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function write(value: RememberedLeague | null) {
  try {
    if (value) {
      window.localStorage.setItem(KEY, JSON.stringify(value));
    } else {
      window.localStorage.removeItem(KEY);
    }
  } catch {
    // Storage is blocked or full: nothing is remembered.
  }
  listeners.forEach((listener) => listener());
}

export function rememberLeague(league: RememberedLeague) {
  write(league);
}

export function forgetLeague() {
  write(null);
}

/** The remembered league, or null. Always null during server rendering. */
export function useRememberedLeague(): RememberedLeague | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
