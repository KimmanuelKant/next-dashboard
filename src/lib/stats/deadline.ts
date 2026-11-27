// src/lib/stats/deadline.ts
// What each team has for the next deadline: free transfers and chips left.
// Pure functions. FPL does not publish other teams' free transfers, so they
// are worked out from each team's history with FPL's rules.

import type { ChipWindow, ManagerHistory } from "@/lib/fpl/types";

/** Points FPL takes for each transfer beyond the free ones. */
const HIT_COST = 4;

const KEEPS_FREE_TRANSFERS = new Set(["wildcard", "freehit"]);

/**
 * Free transfers for the gameweek after the team's latest one, by FPL's
 * rules: transfers before the team's first deadline are unlimited; after
 * each deadline the team gains one; at most `max` are kept; transfers on a
 * Wildcard or Free Hit week use none. The free ones used in a week are the
 * week's transfers less those paid for with a hit. Null for a team with no
 * gameweeks yet.
 *
 * Transfers already made for the next gameweek are not taken off: the
 * history's weeks end with the latest deadline.
 */
export function freeTransfers(history: ManagerHistory, max: number): number | null {
  const weeks = history.gameweeks;
  if (weeks.length === 0) return null;
  let free = 1;
  for (const week of weeks.slice(1)) {
    const chip = history.chips.find((c) => c.gw === week.gw)?.name;
    if (!chip || !KEEPS_FREE_TRANSFERS.has(chip)) {
      const paid = week.transfersCost / HIT_COST;
      free = Math.max(0, free - Math.max(0, week.transfers - paid));
    }
    free = Math.min(max, free + 1);
  }
  return free;
}

/**
 * The chips a team can still play in `gw`'s half of the season, by FPL's
 * name, in FPL's order (a chip twice if it can still be played twice).
 * Empty once every chip of the half is used; also empty when no chip's
 * window holds `gw` (the season is over).
 */
export function chipsLeft(
  used: ManagerHistory["chips"],
  windows: ChipWindow[],
  gw: number
): string[] {
  return windows
    .filter((window) => window.start <= gw && gw <= window.stop)
    .flatMap((window) => {
      const plays = used.filter(
        (chip) => chip.name === window.name && chip.gw >= window.start && chip.gw <= window.stop
      ).length;
      return Array<string>(Math.max(0, window.number - plays)).fill(window.name);
    });
}
