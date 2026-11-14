// src/lib/fpl/http.ts
// Low-level access to the FPL API: bounded concurrency and retries.

const BASE_URL = "https://fantasy.premierleague.com/api";
const MAX_CONCURRENT = 12;
const MAX_ATTEMPTS = 4;

let active = 0;
const waiting: (() => void)[] = [];

async function withSlot<T>(task: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => waiting.push(resolve));
  }
  active++;
  try {
    return await task();
  } finally {
    active--;
    waiting.shift()?.();
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class FplError extends Error {
  constructor(
    public readonly path: string,
    public readonly status: number | null
  ) {
    super(`FPL request failed (${status ?? "network error"}): ${path}`);
    this.name = "FplError";
  }
}

/**
 * GET a path on the FPL API. Returns null for 404 (the thing does not exist),
 * throws FplError when the API keeps failing.
 */
export async function fplGet<T>(path: string): Promise<T | null> {
  return withSlot(async () => {
    let lastStatus: number | null = null;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        await sleep(400 * 2 ** (attempt - 1));
      }
      try {
        const res = await fetch(`${BASE_URL}${path}`, { cache: "no-store" });
        if (res.ok) {
          return (await res.json()) as T;
        }
        if (res.status === 404) {
          return null;
        }
        lastStatus = res.status;
        // Retry rate limiting and server errors; give up on other client errors.
        if (res.status !== 429 && res.status < 500) {
          break;
        }
      } catch {
        lastStatus = null;
      }
    }
    throw new FplError(path, lastStatus);
  });
}
