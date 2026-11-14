// src/lib/leagueId.ts

/**
 * Extracts a numeric FPL league ID from user input.
 * Accepts a bare ID ("2355363") or a pasted league URL
 * ("https://fantasy.premierleague.com/leagues/2355363/standings/c").
 * Returns null when no valid ID is found.
 */
export function parseLeagueId(input: string): string | null {
  const trimmed = input.trim();
  if (/^\d{1,10}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/\/leagues\/(\d{1,10})(?:\/|$)/);
  return match ? match[1] : null;
}

/**
 * True when the value is a plain numeric league ID. Route params must pass
 * this before they are used in a request to the FPL API.
 */
export function isValidLeagueId(value: string): boolean {
  return /^\d{1,10}$/.test(value);
}
