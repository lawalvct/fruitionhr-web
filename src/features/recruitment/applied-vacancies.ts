/**
 * Remembers, on this device, which vacancies the visitor has already applied
 * to — so a returning candidate is told straight away instead of filling the
 * whole form again, uploading a CV, and only then being turned away.
 *
 * This is a courtesy, not a control. The authoritative duplicate guard is the
 * unique index behind `POST /careers/{slug}/apply`, which answers 409 whatever
 * the browser believes. Anyone can clear their storage; nobody gains anything
 * by doing so.
 *
 * localStorage rather than a cookie: the marketing site and the API sit on
 * different hosts, so a cookie set here would never reach the server anyway,
 * and this record only ever needs to be read by the page that wrote it.
 */

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "fruitionhr.careers.applied";

/** Roughly a hiring cycle. Older entries are dropped so the record cannot grow forever. */
const RETENTION_DAYS = 180;

/** Keeps a shared or long-lived browser from accumulating an unbounded list. */
const MAX_ENTRIES = 50;

export interface AppliedRecord {
  /** `APP-000123` when the submission succeeded; null when the server reported a duplicate. */
  reference: string | null;
  /** Shown back to the candidate so they can tell which address they used. */
  email: string;
  /** ISO timestamp of the application. */
  at: string;
}

type Store = Record<string, AppliedRecord>;

function parseStore(raw: string | null): Store {
  // Storage holds whatever a previous version of this file wrote, and whatever
  // the visitor felt like typing into devtools, so nothing here is trusted.
  try {
    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};

    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const store: Store = {};

    for (const [slug, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value !== "object" || value === null) continue;
      const entry = value as Partial<AppliedRecord>;
      if (typeof entry.at !== "string") continue;

      const at = Date.parse(entry.at);
      if (Number.isNaN(at) || at < cutoff) continue;

      store[slug] = {
        reference: typeof entry.reference === "string" ? entry.reference : null,
        email: typeof entry.email === "string" ? entry.email : "",
        at: entry.at,
      };
    }

    return store;
  } catch {
    return {};
  }
}

/**
 * Parsed form of whatever is currently in storage, memoised on the raw text.
 *
 * The memo is what makes this safe to read from `useSyncExternalStore`: React
 * compares snapshots by identity and re-renders forever if each read returns a
 * freshly parsed object.
 */
let cachedRaw: string | null | undefined;
let cachedStore: Store = {};

const listeners = new Set<() => void>();

function currentRaw(): string | null {
  // Reading storage throws outright in some privacy modes.
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function readStore(): Store {
  const raw = currentRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedStore = parseStore(raw);
  }
  return cachedStore;
}

function writeStore(store: Store): void {
  try {
    const entries = Object.entries(store)
      .sort(([, a], [, b]) => Date.parse(b.at) - Date.parse(a.at))
      .slice(0, MAX_ENTRIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // Storage full or blocked. The server still refuses duplicates, so the
    // only cost is that this candidate gets told after submitting instead of
    // before — not worth interrupting them over.
  }

  cachedRaw = undefined; // force a re-parse on the next read
  for (const listener of listeners) listener();
}

/** Fires for writes made by *other* tabs; our own writes notify directly. */
function onStorageEvent(event: StorageEvent) {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  cachedRaw = undefined;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", onStorageEvent);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorageEvent);
  };
}

/**
 * The visitor's application to this vacancy, if this device knows of one.
 *
 * Server-rendered as null — the server cannot know — then settled on the
 * client, so the markup React hydrates is the markup that was sent. Apply in
 * one tab and any other tab showing the same vacancy updates too.
 */
export function useAppliedRecord(slug: string): AppliedRecord | null {
  return useSyncExternalStore(
    subscribe,
    () => readStore()[slug] ?? null,
    () => null,
  );
}

export function rememberApplication(slug: string, record: AppliedRecord): void {
  if (typeof window === "undefined") return;
  writeStore({ ...readStore(), [slug]: record });
}

/**
 * Drops the local record — for the shared laptop, the internet café, the
 * second person in the household. The server remains the real gate, so this
 * lets a genuinely different candidate through without letting anyone apply twice.
 */
export function forgetApplication(slug: string): void {
  if (typeof window === "undefined") return;
  const store = { ...readStore() };
  delete store[slug];
  writeStore(store);
}
