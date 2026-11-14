// src/lib/teamId.ts

/**
 * Extracts a numeric FPL team ID (the API calls it an "entry") from user
 * input. Accepts a bare ID ("123456") or a pasted team URL
 * ("https://fantasy.premierleague.com/entry/123456/event/12").
 * Returns null when no valid ID is found.
 */
export function parseTeamId(input: string): string | null {
  const trimmed = input.trim();
  if (/^\d{1,10}$/.test(trimmed)) {
    return trimmed;
  }
  return parseTeamUrl(trimmed);
}

/** The team ID in a pasted FPL team URL, or null when it is not one. */
export function parseTeamUrl(input: string): string | null {
  const match = input.match(/\/entry\/(\d{1,10})(?:\/|$)/);
  return match ? match[1] : null;
}

/**
 * True when the value is a plain numeric team ID. Route params must pass
 * this before they are used in a request to the FPL API.
 */
export function isValidTeamId(value: string): boolean {
  return /^\d{1,10}$/.test(value);
}
